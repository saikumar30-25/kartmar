ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS booking_fee_paise bigint NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS booking_fee_paid_at timestamptz;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS pickup_lat numeric,
  ADD COLUMN IF NOT EXISTS pickup_lng numeric,
  ADD COLUMN IF NOT EXISTS drop_lat numeric,
  ADD COLUMN IF NOT EXISTS drop_lng numeric,
  ADD COLUMN IF NOT EXISTS delivery_otp text NOT NULL DEFAULT lpad((floor(random() * 900000) + 100000)::text, 6, '0'),
  ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.deal_locations (
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  accuracy_m numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (deal_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_locations TO authenticated;
GRANT ALL ON public.deal_locations TO service_role;

ALTER TABLE public.deal_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deal_locations_select ON public.deal_locations;
CREATE POLICY deal_locations_select ON public.deal_locations
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.trips t WHERE t.deal_id = deal_locations.deal_id AND t.partner_id = auth.uid())
);

DROP POLICY IF EXISTS deal_locations_upsert_own ON public.deal_locations;
CREATE POLICY deal_locations_upsert_own ON public.deal_locations
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.farmer_id = auth.uid() OR d.buyer_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.trips t WHERE t.deal_id = deal_locations.deal_id AND t.partner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS deal_locations_update_own ON public.deal_locations;
CREATE POLICY deal_locations_update_own ON public.deal_locations
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS deal_locations_delete_own ON public.deal_locations;
CREATE POLICY deal_locations_delete_own ON public.deal_locations
FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_locations;
