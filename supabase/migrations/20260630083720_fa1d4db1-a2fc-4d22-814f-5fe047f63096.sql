-- 1) interest_requests
CREATE TABLE public.interest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_phone text,
  buyer_address text NOT NULL,
  buyer_pincode text,
  quantity numeric,
  offer_price_paise integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  farmer_response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interest_requests TO authenticated;
GRANT ALL ON public.interest_requests TO service_role;

ALTER TABLE public.interest_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer or farmer can view"
  ON public.interest_requests FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = farmer_id OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "buyer can create"
  ON public.interest_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = buyer_id
    AND farmer_id = (SELECT farmer_id FROM public.listings WHERE id = listing_id)
    AND farmer_id <> auth.uid()
  );

CREATE POLICY "farmer can respond"
  ON public.interest_requests FOR UPDATE TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "buyer can cancel own pending"
  ON public.interest_requests FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id AND status = 'pending')
  WITH CHECK (auth.uid() = buyer_id AND status IN ('pending','cancelled'));

CREATE TRIGGER interest_requests_updated_at
  BEFORE UPDATE ON public.interest_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Guard: farmer cannot mutate immutable fields
CREATE OR REPLACE FUNCTION public.interest_requests_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN NEW; END IF;
  IF NEW.listing_id   IS DISTINCT FROM OLD.listing_id
     OR NEW.buyer_id   IS DISTINCT FROM OLD.buyer_id
     OR NEW.farmer_id  IS DISTINCT FROM OLD.farmer_id
     OR NEW.buyer_name IS DISTINCT FROM OLD.buyer_name
     OR NEW.buyer_address IS DISTINCT FROM OLD.buyer_address
     OR NEW.message    IS DISTINCT FROM OLD.message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Immutable fields on interest_requests';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER interest_requests_guard
  BEFORE UPDATE ON public.interest_requests
  FOR EACH ROW EXECUTE FUNCTION public.interest_requests_guard_update();

ALTER PUBLICATION supabase_realtime ADD TABLE public.interest_requests;

CREATE INDEX idx_interest_requests_farmer ON public.interest_requests(farmer_id, status, created_at DESC);
CREATE INDEX idx_interest_requests_buyer  ON public.interest_requests(buyer_id, status, created_at DESC);

-- 2) profile extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS aadhaar_last4 text CHECK (aadhaar_last4 IS NULL OR aadhaar_last4 ~ '^[0-9]{4}$'),
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','hi','te')),
  ADD COLUMN IF NOT EXISTS details_completed boolean NOT NULL DEFAULT false;

-- 3) partner profile completion gate
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS details_completed boolean NOT NULL DEFAULT false;
