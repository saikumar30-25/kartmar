
CREATE POLICY "user_roles_self_pick_initial_nonadmin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role <> 'admin'::public.app_role
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
  );
