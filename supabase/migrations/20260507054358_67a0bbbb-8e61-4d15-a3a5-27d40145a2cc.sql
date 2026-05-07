
CREATE TABLE IF NOT EXISTS public.academy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text,
  employee_id uuid,
  enrollment_id uuid,
  event_type text NOT NULL,
  route text,
  complete boolean,
  bypass boolean,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_academy_audit_log_user ON public.academy_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_audit_log_event ON public.academy_audit_log(event_type, created_at DESC);

ALTER TABLE public.academy_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own academy audit entries"
  ON public.academy_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins and HR admins can view academy audit log"
  ON public.academy_audit_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_admin')
  );
