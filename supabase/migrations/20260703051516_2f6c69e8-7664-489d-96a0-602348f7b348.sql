
-- =========================================
-- Fix 1: Profiles PII exposure to any authenticated user
-- =========================================
DROP POLICY IF EXISTS profiles_read_authenticated ON public.profiles;

CREATE POLICY profiles_read_self ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_read_related ON public.profiles
  FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.deals d
      WHERE (d.farmer_id = auth.uid() AND d.buyer_id = profiles.id)
         OR (d.buyer_id  = auth.uid() AND d.farmer_id = profiles.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.interest_requests ir
      WHERE ir.status = 'accepted'
        AND ((ir.farmer_id = auth.uid() AND ir.buyer_id = profiles.id)
          OR (ir.buyer_id  = auth.uid() AND ir.farmer_id = profiles.id))
    )
    OR EXISTS (
      SELECT 1 FROM public.trips t
      JOIN public.deals d ON d.id = t.deal_id
      WHERE (t.partner_id = auth.uid() AND (d.farmer_id = profiles.id OR d.buyer_id = profiles.id))
         OR ((d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()) AND t.partner_id = profiles.id)
    )
  );

CREATE OR REPLACE VIEW public.profiles_public
  WITH (security_invoker=on) AS
  SELECT id, name, avatar_url, rating, is_verified, district, state, language
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- =========================================
-- Fix 2: Requirements buyer_id public exposure
-- =========================================
DROP POLICY IF EXISTS requirements_read_all ON public.requirements;

CREATE POLICY requirements_read_owner_admin ON public.requirements
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE VIEW public.requirements_public
  WITH (security_invoker=on) AS
  SELECT id, product_name, quantity, unit, target_price_paise, district, state,
         needed_by, notes, status, created_at, updated_at
  FROM public.requirements;

GRANT SELECT ON public.requirements_public TO anon, authenticated;

-- =========================================
-- Fix 3: Interest requests buyer contact exposure
-- =========================================
CREATE TABLE IF NOT EXISTS public.interest_request_contacts (
  interest_id   uuid PRIMARY KEY REFERENCES public.interest_requests(id) ON DELETE CASCADE,
  buyer_phone   text,
  buyer_address text NOT NULL,
  buyer_pincode text,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

-- Backfill from existing interest_requests rows before we drop the columns
INSERT INTO public.interest_request_contacts (interest_id, buyer_phone, buyer_address, buyer_pincode)
SELECT id, buyer_phone, COALESCE(buyer_address, ''), buyer_pincode
FROM public.interest_requests
ON CONFLICT (interest_id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interest_request_contacts TO authenticated;
GRANT ALL ON public.interest_request_contacts TO service_role;

ALTER TABLE public.interest_request_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY irc_read ON public.interest_request_contacts
  FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.interest_requests ir
      WHERE ir.id = interest_request_contacts.interest_id
        AND (
          ir.buyer_id = auth.uid()
          OR (ir.farmer_id = auth.uid() AND ir.status = 'accepted')
        )
    )
  );

CREATE POLICY irc_insert ON public.interest_request_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interest_requests ir
      WHERE ir.id = interest_request_contacts.interest_id
        AND ir.buyer_id = auth.uid()
    )
  );

CREATE POLICY irc_update_buyer ON public.interest_request_contacts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interest_requests ir
      WHERE ir.id = interest_request_contacts.interest_id AND ir.buyer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interest_requests ir
      WHERE ir.id = interest_request_contacts.interest_id AND ir.buyer_id = auth.uid()
    )
  );

-- Update guard trigger to remove references to columns we're dropping
CREATE OR REPLACE FUNCTION public.interest_requests_guard_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN NEW; END IF;
  IF NEW.listing_id   IS DISTINCT FROM OLD.listing_id
     OR NEW.buyer_id   IS DISTINCT FROM OLD.buyer_id
     OR NEW.farmer_id  IS DISTINCT FROM OLD.farmer_id
     OR NEW.buyer_name IS DISTINCT FROM OLD.buyer_name
     OR NEW.message    IS DISTINCT FROM OLD.message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Immutable fields on interest_requests';
  END IF;
  RETURN NEW;
END $function$;

ALTER TABLE public.interest_requests
  DROP COLUMN IF EXISTS buyer_phone,
  DROP COLUMN IF EXISTS buyer_address,
  DROP COLUMN IF EXISTS buyer_pincode;
