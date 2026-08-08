CREATE OR REPLACE FUNCTION private.deal_insert_valid(
  _listing_id uuid, _requirement_id uuid, _farmer_id uuid, _buyer_id uuid,
  _agreed_price_paise bigint, _total_paise bigint, _quantity numeric
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE l RECORD; r RECORD;
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN true; END IF;
  IF _buyer_id IS DISTINCT FROM auth.uid() THEN RETURN false; END IF;
  IF _agreed_price_paise IS NULL OR _quantity IS NULL OR _quantity <= 0 THEN RETURN false; END IF;
  IF _total_paise IS DISTINCT FROM (_agreed_price_paise * _quantity) THEN RETURN false; END IF;

  IF _listing_id IS NOT NULL THEN
    SELECT farmer_id, price_paise, min_price_paise, quantity INTO l
      FROM public.listings WHERE id = _listing_id;
    IF NOT FOUND THEN RETURN false; END IF;
    IF _farmer_id IS DISTINCT FROM l.farmer_id THEN RETURN false; END IF;
    IF _agreed_price_paise > l.price_paise
       OR _agreed_price_paise < COALESCE(l.min_price_paise, ROUND(l.price_paise * 0.5)) THEN RETURN false; END IF;
    IF _quantity > l.quantity THEN RETURN false; END IF;
    RETURN true;
  END IF;

  IF _requirement_id IS NOT NULL THEN
    SELECT buyer_id, quantity INTO r FROM public.requirements WHERE id = _requirement_id;
    IF NOT FOUND THEN RETURN false; END IF;
    IF r.buyer_id IS DISTINCT FROM auth.uid() THEN RETURN false; END IF;
    RETURN true;
  END IF;

  RETURN false;
END $$;

REVOKE ALL ON FUNCTION private.deal_insert_valid(uuid,uuid,uuid,uuid,bigint,bigint,numeric) FROM public;
GRANT EXECUTE ON FUNCTION private.deal_insert_valid(uuid,uuid,uuid,uuid,bigint,bigint,numeric) TO authenticated, service_role;

DROP POLICY IF EXISTS deals_buyer_create ON public.deals;
CREATE POLICY deals_buyer_create ON public.deals
FOR INSERT TO authenticated
WITH CHECK (
  private.deal_insert_valid(listing_id, requirement_id, farmer_id, buyer_id,
                            agreed_price_paise, total_paise, quantity)
);

CREATE OR REPLACE FUNCTION public.deals_insert_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN NEW; END IF;
  IF NOT private.deal_insert_valid(NEW.listing_id, NEW.requirement_id, NEW.farmer_id, NEW.buyer_id,
                                   NEW.agreed_price_paise, NEW.total_paise, NEW.quantity) THEN
    RAISE EXCEPTION 'Deal does not match the referenced listing/requirement';
  END IF;
  RETURN NEW;
END $$;