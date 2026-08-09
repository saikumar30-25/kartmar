CREATE OR REPLACE FUNCTION private.deal_insert_valid(_listing_id uuid, _requirement_id uuid, _farmer_id uuid, _buyer_id uuid, _agreed_price_paise bigint, _total_paise bigint, _quantity numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE l RECORD; r RECORD; uid uuid := auth.uid();
BEGIN
  IF private.has_role(uid, 'admin'::public.app_role) THEN RETURN true; END IF;
  IF uid IS NULL THEN RETURN false; END IF;
  -- creator must be one of the two named parties
  IF uid IS DISTINCT FROM _buyer_id AND uid IS DISTINCT FROM _farmer_id THEN RETURN false; END IF;
  IF _buyer_id IS NULL OR _farmer_id IS NULL OR _buyer_id = _farmer_id THEN RETURN false; END IF;
  IF _agreed_price_paise IS NULL OR _agreed_price_paise <= 0
     OR _quantity IS NULL OR _quantity <= 0
     OR _total_paise IS NULL THEN RETURN false; END IF;
  IF _total_paise IS DISTINCT FROM (_agreed_price_paise * _quantity)::bigint THEN RETURN false; END IF;

  IF _listing_id IS NOT NULL THEN
    SELECT farmer_id, price_paise, min_price_paise, quantity INTO l
      FROM public.listings WHERE id = _listing_id;
    IF NOT FOUND THEN RETURN false; END IF;
    IF _farmer_id IS DISTINCT FROM l.farmer_id THEN RETURN false; END IF;
    IF _agreed_price_paise > l.price_paise
       OR _agreed_price_paise < COALESCE(l.min_price_paise, ROUND(l.price_paise * 0.5)) THEN RETURN false; END IF;
    IF _quantity > l.quantity THEN RETURN false; END IF;
    -- when the seller creates the deal, an accepted interest from that buyer must exist
    IF uid = _farmer_id AND uid IS DISTINCT FROM _buyer_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.interest_requests ir
        WHERE ir.listing_id = _listing_id
          AND ir.buyer_id = _buyer_id
          AND ir.farmer_id = _farmer_id
          AND ir.status = 'accepted'
      ) THEN RETURN false; END IF;
    END IF;
    RETURN true;
  END IF;

  IF _requirement_id IS NOT NULL THEN
    SELECT buyer_id, quantity, target_price_paise INTO r
      FROM public.requirements WHERE id = _requirement_id;
    IF NOT FOUND THEN RETURN false; END IF;
    IF r.buyer_id IS DISTINCT FROM _buyer_id THEN RETURN false; END IF;
    IF uid IS DISTINCT FROM _buyer_id THEN RETURN false; END IF;
    IF _quantity > r.quantity THEN RETURN false; END IF;
    IF r.target_price_paise IS NOT NULL AND _agreed_price_paise > r.target_price_paise THEN RETURN false; END IF;
    RETURN true;
  END IF;

  RETURN false;
END $function$;