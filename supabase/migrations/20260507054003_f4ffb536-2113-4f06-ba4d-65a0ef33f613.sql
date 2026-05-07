CREATE POLICY "HR admins can grant training_admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'training_admin'::public.app_role
  AND public.has_permission(auth.uid(), 'hr.employees.edit')
);

CREATE POLICY "HR admins can revoke training_admin"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  role = 'training_admin'::public.app_role
  AND public.has_permission(auth.uid(), 'hr.employees.edit')
);