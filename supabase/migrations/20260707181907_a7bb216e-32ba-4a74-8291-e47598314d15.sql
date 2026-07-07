CREATE TABLE IF NOT EXISTS public.report_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  purpose text,
  metrics text,
  data_sources text[] NOT NULL DEFAULT '{}',
  frequency text,
  priority text NOT NULL DEFAULT 'Normal',
  visualization text,
  ai_assist boolean NOT NULL DEFAULT false,
  attachment_name text,
  status text NOT NULL DEFAULT 'New Request',
  requested_by_user_id uuid,
  requested_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.report_requests TO authenticated;
GRANT ALL ON public.report_requests TO service_role;

ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read report requests"
  ON public.report_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can submit report requests"
  ON public.report_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by_user_id IS NULL OR requested_by_user_id = auth.uid()
  );

CREATE POLICY "Admins can update report requests"
  ON public.report_requests
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

CREATE POLICY "Admins can delete report requests"
  ON public.report_requests
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

CREATE TRIGGER trg_report_requests_updated_at
  BEFORE UPDATE ON public.report_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_report_requests_created_at ON public.report_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_requests_requested_by ON public.report_requests (requested_by_user_id);