
-- Guard against fabricated deals: ensure farmer_id/price/quantity align with the referenced listing.
CREATE OR REPLACE FUNCTION public.deals_insert_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  l RECORD;
BEGIN
  -- Admins bypass
  IF private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.buyer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'buyer_id must be the authenticated user';
  END IF;

  IF NEW.listing_id IS NOT NULL THEN
    SELECT id, farmer_id, price_paise, min_price_paise, quantity, product_name, unit, photo_url, district
      INTO l FROM public.listings WHERE id = NEW.listing_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Referenced listing does not exist';
    END IF;
    IF NEW.farmer_id IS DISTINCT FROM l.farmer_id THEN
      RAISE EXCEPTION 'farmer_id does not match listing owner';
    END IF;
    -- Price must be within listing floor..listed price (allow buyer to accept posted or negotiated within floor).
    IF NEW.agreed_price_paise IS NULL
       OR NEW.agreed_price_paise > l.price_paise
       OR NEW.agreed_price_paise < COALESCE(l.min_price_paise, ROUND(l.price_paise * 0.5)) THEN
      RAISE EXCEPTION 'agreed_price_paise out of allowed range for this listing';
    END IF;
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 OR NEW.quantity > l.quantity THEN
      RAISE EXCEPTION 'quantity out of allowed range for this listing';
    END IF;
    IF NEW.total_paise IS DISTINCT FROM (NEW.agreed_price_paise * NEW.quantity) THEN
      RAISE EXCEPTION 'total_paise must equal agreed_price_paise * quantity';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS deals_insert_guard_trg ON public.deals;
CREATE TRIGGER deals_insert_guard_trg
  BEFORE INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_insert_guard();
