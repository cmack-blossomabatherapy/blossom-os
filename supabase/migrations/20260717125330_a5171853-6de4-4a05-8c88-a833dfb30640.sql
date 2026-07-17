
-- ============================================================
-- Active RBT experience: hours, credentials, performance, discrepancies
-- ============================================================

-- HOURS SNAPSHOTS ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbt_hours_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scheduled_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  completed_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  cancelled_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  imported_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'centralreach',
  last_import_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_start, period_end, source)
);
GRANT SELECT ON public.rbt_hours_snapshots TO authenticated;
GRANT ALL ON public.rbt_hours_snapshots TO service_role;
ALTER TABLE public.rbt_hours_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt view own hours" ON public.rbt_hours_snapshots
  FOR SELECT TO authenticated USING (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'operations_leadership'));

-- HOURS ISSUE REPORTS -------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbt_hours_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  period_start DATE,
  period_end DATE,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_hours NUMERIC(6,2),
  reported_hours NUMERIC(6,2),
  status TEXT NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_hours_issues TO authenticated;
GRANT ALL ON public.rbt_hours_issues TO service_role;
ALTER TABLE public.rbt_hours_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt manage own hours issues" ON public.rbt_hours_issues
  FOR ALL TO authenticated
  USING (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'operations_leadership'))
  WITH CHECK (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'operations_leadership'));

-- SHIFT DISCREPANCY REPORTS -------------------------------------
CREATE TABLE IF NOT EXISTS public.rbt_shift_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  shift_event_id UUID,
  session_id UUID,
  session_date DATE,
  discrepancy_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.rbt_shift_discrepancies TO authenticated;
GRANT ALL ON public.rbt_shift_discrepancies TO service_role;
ALTER TABLE public.rbt_shift_discrepancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt manage own shift discrepancies" ON public.rbt_shift_discrepancies
  FOR ALL TO authenticated
  USING (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'operations_leadership')
    OR public.has_role(auth.uid(),'bcba') OR public.has_role(auth.uid(),'clinical_director'))
  WITH CHECK (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'operations_leadership'));

-- CREDENTIALS ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbt_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  credential_type TEXT NOT NULL, -- rbt_cert, cpr_first_aid, background_check, state_requirement, document
  label TEXT NOT NULL,
  identifier TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, expiring, expired, pending, missing, complete
  issued_on DATE,
  expires_on DATE,
  document_url TEXT,
  state_code TEXT,
  notes TEXT,
  last_verified_at TIMESTAMPTZ,
  source TEXT DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rbt_credentials_employee ON public.rbt_credentials(employee_id);
GRANT SELECT ON public.rbt_credentials TO authenticated;
GRANT ALL ON public.rbt_credentials TO service_role;
ALTER TABLE public.rbt_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt view own credentials" ON public.rbt_credentials
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_role(auth.uid(),'operations_leadership'));

-- PERFORMANCE NOTES (supportive, explainable) -------------------
CREATE TABLE IF NOT EXISTS public.rbt_performance_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  category TEXT NOT NULL, -- strength, on_track, needs_attention, development_goal, completed_coaching, recognition
  title TEXT NOT NULL,
  detail TEXT,
  source TEXT, -- 'bcba_evaluation','supervision','training','manual'
  source_reference TEXT,
  source_date DATE,
  author_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rbt_perf_notes_emp ON public.rbt_performance_notes(employee_id, category);
GRANT SELECT ON public.rbt_performance_notes TO authenticated;
GRANT ALL ON public.rbt_performance_notes TO service_role;
ALTER TABLE public.rbt_performance_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt view own perf notes" ON public.rbt_performance_notes
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'bcba')
    OR public.has_role(auth.uid(),'clinical_director') OR public.has_role(auth.uid(),'operations_leadership'));

-- updated_at trigger --------------------------------------------
CREATE OR REPLACE FUNCTION public.rbt_active_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_rbt_hours_snapshots_upd ON public.rbt_hours_snapshots;
CREATE TRIGGER trg_rbt_hours_snapshots_upd BEFORE UPDATE ON public.rbt_hours_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.rbt_active_touch_updated_at();

DROP TRIGGER IF EXISTS trg_rbt_hours_issues_upd ON public.rbt_hours_issues;
CREATE TRIGGER trg_rbt_hours_issues_upd BEFORE UPDATE ON public.rbt_hours_issues
  FOR EACH ROW EXECUTE FUNCTION public.rbt_active_touch_updated_at();

DROP TRIGGER IF EXISTS trg_rbt_shift_disc_upd ON public.rbt_shift_discrepancies;
CREATE TRIGGER trg_rbt_shift_disc_upd BEFORE UPDATE ON public.rbt_shift_discrepancies
  FOR EACH ROW EXECUTE FUNCTION public.rbt_active_touch_updated_at();

DROP TRIGGER IF EXISTS trg_rbt_credentials_upd ON public.rbt_credentials;
CREATE TRIGGER trg_rbt_credentials_upd BEFORE UPDATE ON public.rbt_credentials
  FOR EACH ROW EXECUTE FUNCTION public.rbt_active_touch_updated_at();

DROP TRIGGER IF EXISTS trg_rbt_perf_notes_upd ON public.rbt_performance_notes;
CREATE TRIGGER trg_rbt_perf_notes_upd BEFORE UPDATE ON public.rbt_performance_notes
  FOR EACH ROW EXECUTE FUNCTION public.rbt_active_touch_updated_at();
