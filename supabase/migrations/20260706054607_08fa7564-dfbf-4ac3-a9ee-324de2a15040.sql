-- Allow anonymous read of active listings for the public landing page and read of public profile info.
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.profiles_public TO anon;

-- Ensure the anon SELECT policy exists on listings for anon (public role already includes anon, but be explicit).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='listings' AND policyname='listings_read_public_anon') THEN
    CREATE POLICY listings_read_public_anon ON public.listings FOR SELECT TO anon USING (status = 'active');
  END IF;
END$$;