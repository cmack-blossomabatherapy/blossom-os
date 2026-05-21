-- ============= KPI Scorecards =============
CREATE TABLE public.kpi_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type TEXT NOT NULL DEFAULT 'state_director',
  state TEXT NOT NULL,
  week_of DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy', -- healthy | watch | at_risk
  summary TEXT,
  total_hours NUMERIC,
  total_potential_hours NUMERIC,
  active_clients INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_type, state, week_of)
);

CREATE INDEX idx_kpi_scorecards_state_week ON public.kpi_scorecards (state, week_of DESC);
CREATE INDEX idx_kpi_scorecards_role ON public.kpi_scorecards (role_type);

CREATE TABLE public.kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID NOT NULL REFERENCES public.kpi_scorecards(id) ON DELETE CASCADE,
  kpi_key TEXT NOT NULL,          -- machine key: "hours_53", "active_clients", ...
  kpi_label TEXT NOT NULL,        -- "53 Hours", "Active Clients", ...
  kpi_value NUMERIC,
  previous_value NUMERIC,
  trend NUMERIC,                  -- +/- percent vs previous
  status TEXT DEFAULT 'healthy',  -- healthy | watch | at_risk
  unit TEXT,                      -- "hours", "clients", "%", "count"
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scorecard_id, kpi_key)
);

CREATE INDEX idx_kpi_values_scorecard ON public.kpi_values (scorecard_id);

CREATE TABLE public.kpi_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID NOT NULL REFERENCES public.kpi_scorecards(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kpi_notes_scorecard ON public.kpi_notes (scorecard_id, created_at DESC);

CREATE TABLE public.kpi_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID REFERENCES public.kpi_scorecards(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  upload_type TEXT NOT NULL DEFAULT 'csv',  -- csv | xlsx | manual
  row_count INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kpi_imports_created ON public.kpi_imports (created_at DESC);

-- ============= RLS =============
ALTER TABLE public.kpi_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_values     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_imports    ENABLE ROW LEVEL SECURITY;

-- Helper to check elevated access (admin or ops manager)
CREATE OR REPLACE FUNCTION public.kpi_can_manage(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'ops_manager');
$$;

-- kpi_scorecards
CREATE POLICY "scorecards_select_auth"  ON public.kpi_scorecards FOR SELECT TO authenticated USING (true);
CREATE POLICY "scorecards_insert_auth"  ON public.kpi_scorecards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "scorecards_update_owner" ON public.kpi_scorecards FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.kpi_can_manage(auth.uid()))
  WITH CHECK (auth.uid() = created_by OR public.kpi_can_manage(auth.uid()));
CREATE POLICY "scorecards_delete_owner" ON public.kpi_scorecards FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.kpi_can_manage(auth.uid()));

-- kpi_values (inherit ownership through parent scorecard)
CREATE POLICY "values_select_auth"  ON public.kpi_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "values_insert_auth"  ON public.kpi_values FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kpi_scorecards s WHERE s.id = scorecard_id
      AND (s.created_by = auth.uid() OR public.kpi_can_manage(auth.uid()))
  ));
CREATE POLICY "values_update_owner" ON public.kpi_values FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.kpi_scorecards s WHERE s.id = scorecard_id
      AND (s.created_by = auth.uid() OR public.kpi_can_manage(auth.uid()))
  ));
CREATE POLICY "values_delete_owner" ON public.kpi_values FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.kpi_scorecards s WHERE s.id = scorecard_id
      AND (s.created_by = auth.uid() OR public.kpi_can_manage(auth.uid()))
  ));

-- kpi_notes
CREATE POLICY "notes_select_auth"  ON public.kpi_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes_insert_auth"  ON public.kpi_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "notes_update_owner" ON public.kpi_notes FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.kpi_can_manage(auth.uid()));
CREATE POLICY "notes_delete_owner" ON public.kpi_notes FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.kpi_can_manage(auth.uid()));

-- kpi_imports
CREATE POLICY "imports_select_auth" ON public.kpi_imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "imports_insert_auth" ON public.kpi_imports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "imports_delete_owner" ON public.kpi_imports FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by OR public.kpi_can_manage(auth.uid()));

-- ============= Timestamps =============
CREATE TRIGGER trg_kpi_scorecards_updated_at BEFORE UPDATE ON public.kpi_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_kpi_values_updated_at BEFORE UPDATE ON public.kpi_values
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_kpi_notes_updated_at BEFORE UPDATE ON public.kpi_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();