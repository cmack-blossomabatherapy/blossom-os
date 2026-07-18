
CREATE TABLE IF NOT EXISTS public.bcba_productivity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bcba_id UUID NOT NULL,
  bcba_name TEXT,
  state TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  caseload_size INT NOT NULL DEFAULT 0,
  assigned_rbt_count INT NOT NULL DEFAULT 0,

  clinical_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  billable_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  assessment_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  parent_training_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  supervision_hours NUMERIC(10,2) NOT NULL DEFAULT 0,

  progress_reports_on_time INT NOT NULL DEFAULT 0,
  progress_reports_late INT NOT NULL DEFAULT 0,
  progress_reports_upcoming INT NOT NULL DEFAULT 0,

  treatment_plans_open INT NOT NULL DEFAULT 0,
  treatment_plans_qa_returned INT NOT NULL DEFAULT 0,

  documentation_on_time_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  qa_return_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0,

  service_utilization_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  open_risks INT NOT NULL DEFAULT 0,

  cancelled_appointments INT NOT NULL DEFAULT 0,
  cancelled_hours_family NUMERIC(10,2) NOT NULL DEFAULT 0,
  cancelled_hours_provider NUMERIC(10,2) NOT NULL DEFAULT 0,
  cancelled_hours_other NUMERIC(10,2) NOT NULL DEFAULT 0,

  mtd_target_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  mtd_actual_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  forecast_hours NUMERIC(10,2) NOT NULL DEFAULT 0,

  source_dates JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_prod_bcba_idx ON public.bcba_productivity_snapshots(bcba_id);
CREATE INDEX IF NOT EXISTS bcba_prod_period_idx ON public.bcba_productivity_snapshots(period_start, period_end);
CREATE UNIQUE INDEX IF NOT EXISTS bcba_prod_unique_idx ON public.bcba_productivity_snapshots(bcba_id, period_start, period_end);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_productivity_snapshots TO authenticated;
GRANT ALL ON public.bcba_productivity_snapshots TO service_role;
ALTER TABLE public.bcba_productivity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_prod_select" ON public.bcba_productivity_snapshots FOR SELECT TO authenticated USING (
  bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
);
CREATE POLICY "bcba_prod_insert" ON public.bcba_productivity_snapshots FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_prod_update" ON public.bcba_productivity_snapshots FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_prod_delete" ON public.bcba_productivity_snapshots FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bcba_id UUID NOT NULL,
  bcba_name TEXT,
  state TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  active_clients INT NOT NULL DEFAULT 0,
  active_rbts INT NOT NULL DEFAULT 0,
  supervision_load_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  new_assessments INT NOT NULL DEFAULT 0,
  reports_due INT NOT NULL DEFAULT 0,
  parent_training_workload INT NOT NULL DEFAULT 0,
  projected_service_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  open_staffing_gap_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  scheduled_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  upcoming_leave_days INT NOT NULL DEFAULT 0,
  open_qa_corrections INT NOT NULL DEFAULT 0,

  capacity_status TEXT NOT NULL DEFAULT 'available',
  reasoning JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_dates JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bcba_cap_status_check CHECK (capacity_status IN (
    'available','approaching_capacity','at_capacity','over_capacity','review_required'
  ))
);
CREATE INDEX IF NOT EXISTS bcba_cap_bcba_idx ON public.bcba_capacity_snapshots(bcba_id);
CREATE INDEX IF NOT EXISTS bcba_cap_status_idx ON public.bcba_capacity_snapshots(capacity_status);
CREATE UNIQUE INDEX IF NOT EXISTS bcba_cap_unique_idx ON public.bcba_capacity_snapshots(bcba_id, period_start, period_end);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_capacity_snapshots TO authenticated;
GRANT ALL ON public.bcba_capacity_snapshots TO service_role;
ALTER TABLE public.bcba_capacity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_cap_select" ON public.bcba_capacity_snapshots FOR SELECT TO authenticated USING (
  bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
);
CREATE POLICY "bcba_cap_insert" ON public.bcba_capacity_snapshots FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_cap_update" ON public.bcba_capacity_snapshots FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_cap_delete" ON public.bcba_capacity_snapshots FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_productivity_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES public.bcba_productivity_snapshots(id) ON DELETE CASCADE,
  bcba_id UUID NOT NULL,
  metric_key TEXT NOT NULL,
  reported_value TEXT,
  expected_value TEXT,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  task_id UUID REFERENCES public.user_tasks(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_prod_disc_status_check CHECK (status IN ('open','investigating','resolved','rejected'))
);
CREATE INDEX IF NOT EXISTS bcba_prod_disc_snap_idx ON public.bcba_productivity_discrepancies(snapshot_id);
CREATE INDEX IF NOT EXISTS bcba_prod_disc_bcba_idx ON public.bcba_productivity_discrepancies(bcba_id);

GRANT SELECT, INSERT, UPDATE ON public.bcba_productivity_discrepancies TO authenticated;
GRANT ALL ON public.bcba_productivity_discrepancies TO service_role;
ALTER TABLE public.bcba_productivity_discrepancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_prod_disc_select" ON public.bcba_productivity_discrepancies FOR SELECT TO authenticated USING (
  bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
);
CREATE POLICY "bcba_prod_disc_insert" ON public.bcba_productivity_discrepancies FOR INSERT TO authenticated WITH CHECK (
  bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "bcba_prod_disc_update" ON public.bcba_productivity_discrepancies FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

-- Touch triggers (reuse bcba_pr_touch_updated_at)
DROP TRIGGER IF EXISTS bcba_prod_touch ON public.bcba_productivity_snapshots;
CREATE TRIGGER bcba_prod_touch BEFORE UPDATE ON public.bcba_productivity_snapshots
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

DROP TRIGGER IF EXISTS bcba_cap_touch ON public.bcba_capacity_snapshots;
CREATE TRIGGER bcba_cap_touch BEFORE UPDATE ON public.bcba_capacity_snapshots
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

DROP TRIGGER IF EXISTS bcba_prod_disc_touch ON public.bcba_productivity_discrepancies;
CREATE TRIGGER bcba_prod_disc_touch BEFORE UPDATE ON public.bcba_productivity_discrepancies
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
