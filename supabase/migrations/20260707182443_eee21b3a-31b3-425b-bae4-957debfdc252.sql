DROP POLICY IF EXISTS "phone_ai_calls_scoped_read" ON public.phone_ai_calls;

CREATE POLICY "phone_ai_calls_intake_admin_read"
ON public.phone_ai_calls
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'systems_admin')
  OR public.has_role(auth.uid(), 'phone_support')
  OR public.has_role(auth.uid(), 'intake')
  OR public.has_role(auth.uid(), 'intake_lead')
  OR public.has_role(auth.uid(), 'intake_coordinator')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exec_saved_views_report_favorite
  ON public.executive_saved_views (user_id, scope, scope_key)
  WHERE scope = 'report_favorite';