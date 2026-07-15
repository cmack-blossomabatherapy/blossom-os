
CREATE TABLE public.viventium_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  mode text NOT NULL,
  dry_run boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'running',
  records_received integer DEFAULT 0,
  records_normalized integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_matched integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.viventium_sync_runs TO authenticated;
GRANT ALL ON public.viventium_sync_runs TO service_role;

ALTER TABLE public.viventium_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and HR view viventium sync runs"
  ON public.viventium_sync_runs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_manager')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

CREATE INDEX viventium_sync_runs_started_idx
  ON public.viventium_sync_runs (started_at DESC);
