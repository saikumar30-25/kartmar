
-- 1. Private schema for security-definer helpers (not exposed by the Data API)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_partner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = _user_id) $$;

CREATE OR REPLACE FUNCTION private.is_approved_partner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = _user_id AND verification_status = 'approved') $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_partner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_approved_partner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_partner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_approved_partner(uuid) TO authenticated, service_role;

-- 2. Repoint existing policies that referenced public.has_role / is_partner / is_approved_partner

-- profiles: drop public read, restrict to authenticated only
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- partner_profiles: drop public read + permissive admin policy
DROP POLICY IF EXISTS "partner_profiles_read_all" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins view all partners" ON public.partner_profiles;
CREATE POLICY "partner_profiles_admin_read" ON public.partner_profiles
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.partner_profiles FROM anon;
-- owner SELECT already covered by partner_profiles_manage_self (FOR ALL)

DROP POLICY IF EXISTS "Admins manage partner verification" ON public.partner_profiles;
CREATE POLICY "Admins manage partner verification" ON public.partner_profiles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles: remove self-insert privilege escalation; admin-only management
DROP POLICY IF EXISTS "Users can set their own role" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- deals: repoint read + tighten update with WITH CHECK + immutability trigger
DROP POLICY IF EXISTS "deals_participants_read" ON public.deals;
CREATE POLICY "deals_participants_read" ON public.deals
  FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR buyer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "deals_participants_update" ON public.deals;
CREATE POLICY "deals_participants_update" ON public.deals
  FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid() OR buyer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (farmer_id = auth.uid() OR buyer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.deals_guard_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.agreed_price_paise IS DISTINCT FROM OLD.agreed_price_paise
     OR NEW.total_paise         IS DISTINCT FROM OLD.total_paise
     OR NEW.farmer_id           IS DISTINCT FROM OLD.farmer_id
     OR NEW.buyer_id            IS DISTINCT FROM OLD.buyer_id
     OR NEW.listing_id          IS DISTINCT FROM OLD.listing_id
     OR NEW.requirement_id      IS DISTINCT FROM OLD.requirement_id
     OR NEW.quantity            IS DISTINCT FROM OLD.quantity THEN
    RAISE EXCEPTION 'Cannot modify immutable deal fields';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS deals_guard_update ON public.deals;
CREATE TRIGGER deals_guard_update BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_guard_update();

-- trips: repoint read, replace update policy, prevent fare/partner manipulation
DROP POLICY IF EXISTS "trips_read" ON public.trips;
CREATE POLICY "trips_read" ON public.trips
  FOR SELECT TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = trips.deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
    OR (partner_id IS NULL AND status = 'offered'::trip_status AND private.is_approved_partner(auth.uid()))
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "trips_update" ON public.trips;
-- Deal participants may only edit notes; partner-only updates handled by 'Approved partners claim trips'
CREATE POLICY "trips_update_participants" ON public.trips
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = trips.deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = trips.deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Approved partners claim trips" ON public.trips;
CREATE POLICY "Approved partners claim trips" ON public.trips
  FOR UPDATE TO authenticated
  USING (((partner_id IS NULL) OR (partner_id = auth.uid())) AND private.is_approved_partner(auth.uid()))
  WITH CHECK ((partner_id = auth.uid()) AND private.is_approved_partner(auth.uid()));

CREATE OR REPLACE FUNCTION public.trips_guard_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  -- Assigned partner: may not change fare, deal_id, or reassign
  IF OLD.partner_id IS NOT NULL AND OLD.partner_id = auth.uid() THEN
    IF NEW.fare_paise IS DISTINCT FROM OLD.fare_paise
       OR NEW.deal_id   IS DISTINCT FROM OLD.deal_id
       OR NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'Partner cannot modify financial or assignment fields';
    END IF;
    RETURN NEW;
  END IF;
  -- Claiming partner: assigning self
  IF OLD.partner_id IS NULL AND NEW.partner_id = auth.uid() THEN
    IF NEW.fare_paise IS DISTINCT FROM OLD.fare_paise
       OR NEW.deal_id IS DISTINCT FROM OLD.deal_id THEN
      RAISE EXCEPTION 'Cannot modify fare or deal on claim';
    END IF;
    RETURN NEW;
  END IF;
  -- Deal participant (farmer/buyer): only notes editable
  IF NEW.fare_paise   IS DISTINCT FROM OLD.fare_paise
     OR NEW.partner_id IS DISTINCT FROM OLD.partner_id
     OR NEW.status     IS DISTINCT FROM OLD.status
     OR NEW.pickup_at  IS DISTINCT FROM OLD.pickup_at
     OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
     OR NEW.deal_id    IS DISTINCT FROM OLD.deal_id THEN
    RAISE EXCEPTION 'Deal participant cannot modify partner-controlled trip fields';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trips_guard_update ON public.trips;
CREATE TRIGGER trips_guard_update BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.trips_guard_update();

-- 3. Storage policy referencing public.has_role -> private.has_role
DROP POLICY IF EXISTS "partner docs owner read" ON storage.objects;
CREATE POLICY "partner docs owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'partner-docs'
    AND ((auth.uid())::text = (storage.foldername(name))[1]
         OR private.has_role(auth.uid(), 'admin'::public.app_role))
  );

-- 4. Drop the public-schema security-definer functions so they are no longer exposed via PostgREST
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_partner(uuid);
DROP FUNCTION IF EXISTS public.is_approved_partner(uuid);
