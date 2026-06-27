
CREATE TYPE public.app_role AS ENUM ('farmer', 'owner', 'partner', 'admin');
CREATE TYPE public.quality_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE public.listing_status AS ENUM ('active', 'reserved', 'sold', 'expired');
CREATE TYPE public.requirement_status AS ENUM ('open', 'matched', 'fulfilled', 'cancelled');
CREATE TYPE public.deal_status AS ENUM ('pending_payment', 'paid', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled');
CREATE TYPE public.trip_status AS ENUM ('offered', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE public.vehicle_type AS ENUM ('mini_truck', 'tempo', 'pickup', 'tractor', 'bike');

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  district TEXT,
  state TEXT,
  avatar_url TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['en'],
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'farmer');
BEGIN
  INSERT INTO public.profiles (id, name, phone, district, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.phone,
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'state'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PARTNER PROFILES
CREATE TABLE public.partner_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type public.vehicle_type NOT NULL,
  vehicle_number TEXT NOT NULL,
  license_doc_url TEXT,
  capacity_kg INTEGER NOT NULL DEFAULT 500,
  district TEXT,
  state TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  total_trips INTEGER NOT NULL DEFAULT 0,
  earnings_paise BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.partner_profiles TO authenticated;
GRANT ALL ON public.partner_profiles TO service_role;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_profiles_read_all" ON public.partner_profiles FOR SELECT USING (true);
CREATE POLICY "partner_profiles_manage_self" ON public.partner_profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.partner_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.is_partner(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = _user_id)
$$;

-- LISTINGS
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_paise BIGINT NOT NULL,
  min_price_paise BIGINT,
  quality_grade public.quality_grade NOT NULL DEFAULT 'A',
  harvest_date DATE,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  available_until DATE,
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_read_all" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_manage_own" ON public.listings FOR ALL TO authenticated USING (farmer_id = auth.uid()) WITH CHECK (farmer_id = auth.uid());
CREATE INDEX listings_status_idx ON public.listings (status, created_at DESC);
CREATE INDEX listings_farmer_idx ON public.listings (farmer_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- REQUIREMENTS
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  target_price_paise BIGINT,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  needed_by DATE,
  notes TEXT,
  status public.requirement_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.requirements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requirements_read_all" ON public.requirements FOR SELECT USING (true);
CREATE POLICY "requirements_manage_own" ON public.requirements FOR ALL TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());
CREATE INDEX requirements_status_idx ON public.requirements (status, created_at DESC);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- DEALS
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  photo_url TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  agreed_price_paise BIGINT NOT NULL,
  total_paise BIGINT NOT NULL,
  status public.deal_status NOT NULL DEFAULT 'pending_payment',
  pickup_district TEXT,
  drop_district TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_participants_read" ON public.deals FOR SELECT TO authenticated USING (
  farmer_id = auth.uid() OR buyer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "deals_buyer_create" ON public.deals FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "deals_participants_update" ON public.deals FOR UPDATE TO authenticated USING (
  farmer_id = auth.uid() OR buyer_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE INDEX deals_farmer_idx ON public.deals (farmer_id);
CREATE INDEX deals_buyer_idx ON public.deals (buyer_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- DEAL MESSAGES
CREATE TABLE public.deal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  offer_price_paise BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.deal_messages TO authenticated;
GRANT ALL ON public.deal_messages TO service_role;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_msg_participants_read" ON public.deal_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
);
CREATE POLICY "deal_msg_participants_insert" ON public.deal_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
);
CREATE INDEX deal_messages_deal_idx ON public.deal_messages (deal_id, created_at);

-- TRIPS
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_district TEXT NOT NULL,
  drop_district TEXT NOT NULL,
  distance_km NUMERIC,
  fare_paise BIGINT NOT NULL,
  status public.trip_status NOT NULL DEFAULT 'offered',
  pickup_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_read" ON public.trips FOR SELECT TO authenticated USING (
  partner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
  OR (partner_id IS NULL AND status = 'offered' AND public.is_partner(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "trips_insert_by_participant" ON public.trips FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
);
CREATE POLICY "trips_update" ON public.trips FOR UPDATE TO authenticated USING (
  partner_id = auth.uid()
  OR (partner_id IS NULL AND public.is_partner(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
);
CREATE INDEX trips_partner_idx ON public.trips (partner_id, status);
CREATE INDEX trips_deal_idx ON public.trips (deal_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_messages;
