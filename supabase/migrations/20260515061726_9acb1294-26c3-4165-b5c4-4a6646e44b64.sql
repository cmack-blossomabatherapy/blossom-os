CREATE POLICY "execs read imports"
  ON public.bcba_billable_imports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'exec'::app_role));

CREATE POLICY "execs read sessions"
  ON public.bcba_billable_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'exec'::app_role));