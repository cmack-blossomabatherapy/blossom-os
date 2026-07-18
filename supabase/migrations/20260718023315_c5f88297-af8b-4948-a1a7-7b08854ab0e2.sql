
-- 1) Lineage: back-references from legacy tables to the unified cr_sync_runs record
ALTER TABLE public.shared_report_datasets
  ADD COLUMN IF NOT EXISTS cr_run_id uuid NULL REFERENCES public.cr_sync_runs(id) ON DELETE SET NULL;

ALTER TABLE public.bcba_productivity_upload_batches
  ADD COLUMN IF NOT EXISTS cr_run_id uuid NULL REFERENCES public.cr_sync_runs(id) ON DELETE SET NULL;

-- 2) CR upload capability map (super_admin editable, everyone reads own row)
CREATE TABLE IF NOT EXISTS public.cr_upload_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL CHECK (capability IN (
    'view','upload_reporting','upload_workforce','upload_clinical_ops',
    'edit_templates','commit','rollback','download_source','configure'
  )),
  granted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, capability)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_upload_permissions TO authenticated;
GRANT ALL ON public.cr_upload_permissions TO service_role;

ALTER TABLE public.cr_upload_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cr upload permissions"
  ON public.cr_upload_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage cr upload permissions"
  ON public.cr_upload_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3) Data-quality exceptions (user-actionable queue over cr_sync_run_errors + cross-report mismatches)
CREATE TABLE IF NOT EXISTS public.cr_data_quality_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NULL REFERENCES public.cr_sync_runs(id) ON DELETE CASCADE,
  type_key text NOT NULL,
  category text NOT NULL, -- unknown_employee | unknown_client | orphan_appointment | dup_id | invalid_status | cross_report_mismatch | other
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','error','critical')),
  external_id text NULL,
  row_number integer NULL,
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','ignored','reprocessed')),
  owner_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  resolved_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cr_dq_exceptions_status ON public.cr_data_quality_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_cr_dq_exceptions_type ON public.cr_data_quality_exceptions(type_key);
CREATE INDEX IF NOT EXISTS idx_cr_dq_exceptions_run ON public.cr_data_quality_exceptions(run_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_data_quality_exceptions TO authenticated;
GRANT ALL ON public.cr_data_quality_exceptions TO service_role;

ALTER TABLE public.cr_data_quality_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and ops leadership read CR data quality"
  ON public.cr_data_quality_exceptions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
  );

CREATE POLICY "Admins and ops leadership manage CR data quality"
  ON public.cr_data_quality_exceptions FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
  );

CREATE TRIGGER trg_cr_dq_exceptions_updated_at
  BEFORE UPDATE ON public.cr_data_quality_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
