
-- Verification status enum + columns for partner_profiles
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS license_photo_url text,
  ADD COLUMN IF NOT EXISTS vehicle_photo_url text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- product image url already exists on listings (photo_url) — keep
-- Admins can review partners
DROP POLICY IF EXISTS "Admins manage partner verification" ON public.partner_profiles;
CREATE POLICY "Admins manage partner verification" ON public.partner_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all partners" ON public.partner_profiles;
CREATE POLICY "Admins view all partners" ON public.partner_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR true);

-- Trips: only approved partners can claim a trip
CREATE OR REPLACE FUNCTION public.is_approved_partner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_profiles WHERE id = _user_id AND verification_status = 'approved')
$$;

DROP POLICY IF EXISTS "Approved partners claim trips" ON public.trips;
CREATE POLICY "Approved partners claim trips" ON public.trips
  FOR UPDATE TO authenticated
  USING (
    -- trip is unclaimed or owned by this partner
    (partner_id IS NULL OR partner_id = auth.uid())
    AND public.is_approved_partner(auth.uid())
  )
  WITH CHECK (
    partner_id = auth.uid()
    AND public.is_approved_partner(auth.uid())
  );

-- Storage policies for buckets we will create via tool: partner-docs (private), avatars (public), product-images (public)
-- partner-docs: only owner or admin can read/write their own folder (user_id prefix)
DROP POLICY IF EXISTS "partner docs owner read" ON storage.objects;
CREATE POLICY "partner docs owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'partner-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "partner docs owner write" ON storage.objects;
CREATE POLICY "partner docs owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "partner docs owner update" ON storage.objects;
CREATE POLICY "partner docs owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'partner-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "partner docs owner delete" ON storage.objects;
CREATE POLICY "partner docs owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'partner-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars: public read, owner write
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars owner write" ON storage.objects;
CREATE POLICY "avatars owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars owner update" ON storage.objects;
CREATE POLICY "avatars owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars owner delete" ON storage.objects;
CREATE POLICY "avatars owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- product-images: public read, owner write
DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product images owner write" ON storage.objects;
CREATE POLICY "product images owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "product images owner update" ON storage.objects;
CREATE POLICY "product images owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "product images owner delete" ON storage.objects;
CREATE POLICY "product images owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
