
-- Helper: check if the current user has any leadership-level role
CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin','executive_leadership','operations_leadership')
  )
$$;

-- ============================================================
-- executive_work_items
-- ============================================================
CREATE TABLE public.executive_work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  department text,
  state_code text,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  owner_user_id uuid,
  owner_name text,
  due_date date,
  source_page text,
  source_system text,
  related_route text,
  related_record_type text,
  related_record_id text,
  created_by uuid,
  updated_by uuid,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_work_items TO authenticated;
GRANT ALL ON public.executive_work_items TO service_role;
ALTER TABLE public.executive_work_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_work_items_read ON public.executive_work_items FOR SELECT TO authenticated USING (true);
CREATE POLICY exec_work_items_write ON public.executive_work_items FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_work_items_update ON public.executive_work_items FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_work_items_delete ON public.executive_work_items FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

-- ============================================================
-- executive_decisions
-- ============================================================
CREATE TABLE public.executive_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  decision_body text,
  decision_date date NOT NULL DEFAULT CURRENT_DATE,
  department text,
  state_code text,
  status text NOT NULL DEFAULT 'active',
  owner_user_id uuid,
  created_by uuid,
  updated_by uuid,
  related_route text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_decisions TO authenticated;
GRANT ALL ON public.executive_decisions TO service_role;
ALTER TABLE public.executive_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_decisions_read ON public.executive_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY exec_decisions_write ON public.executive_decisions FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_decisions_update ON public.executive_decisions FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_decisions_delete ON public.executive_decisions FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

-- ============================================================
-- executive_briefings
-- ============================================================
CREATE TABLE public.executive_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  period_start date,
  period_end date,
  body text,
  department text,
  state_code text,
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_briefings TO authenticated;
GRANT ALL ON public.executive_briefings TO service_role;
ALTER TABLE public.executive_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_briefings_read ON public.executive_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY exec_briefings_write ON public.executive_briefings FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_briefings_update ON public.executive_briefings FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_briefings_delete ON public.executive_briefings FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

-- ============================================================
-- executive_updates
-- ============================================================
CREATE TABLE public.executive_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  audience text NOT NULL DEFAULT 'company',
  department text,
  state_code text,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_updates TO authenticated;
GRANT ALL ON public.executive_updates TO service_role;
ALTER TABLE public.executive_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_updates_read ON public.executive_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY exec_updates_write ON public.executive_updates FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_updates_update ON public.executive_updates FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_updates_delete ON public.executive_updates FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

-- ============================================================
-- executive_risks
-- ============================================================
CREATE TABLE public.executive_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  department text,
  state_code text,
  severity text NOT NULL DEFAULT 'medium',
  likelihood text NOT NULL DEFAULT 'possible',
  status text NOT NULL DEFAULT 'open',
  owner_user_id uuid,
  mitigation_plan text,
  due_date date,
  created_by uuid,
  updated_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_risks TO authenticated;
GRANT ALL ON public.executive_risks TO service_role;
ALTER TABLE public.executive_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_risks_read ON public.executive_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY exec_risks_write ON public.executive_risks FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_risks_update ON public.executive_risks FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_risks_delete ON public.executive_risks FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

-- ============================================================
-- executive_kpi_snapshots
-- ============================================================
CREATE TABLE public.executive_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL,
  metric_label text,
  metric_value numeric,
  unit text,
  period_start date,
  period_end date,
  department text,
  state_code text,
  source text,
  captured_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exec_kpi_snapshots_key_idx ON public.executive_kpi_snapshots (metric_key, period_end DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_kpi_snapshots TO authenticated;
GRANT ALL ON public.executive_kpi_snapshots TO service_role;
ALTER TABLE public.executive_kpi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_kpi_read ON public.executive_kpi_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY exec_kpi_write ON public.executive_kpi_snapshots FOR INSERT TO authenticated WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_kpi_update ON public.executive_kpi_snapshots FOR UPDATE TO authenticated USING (public.is_leadership(auth.uid())) WITH CHECK (public.is_leadership(auth.uid()));
CREATE POLICY exec_kpi_delete ON public.executive_kpi_snapshots FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()));

-- ============================================================
-- executive_saved_views (per-user; used by /reports and executive pages)
-- ============================================================
CREATE TABLE public.executive_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope text NOT NULL,          -- e.g. 'reports', 'command_center', 'state_health'
  scope_key text,               -- e.g. report key or page key
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exec_saved_views_user_scope_idx ON public.executive_saved_views (user_id, scope, scope_key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_saved_views TO authenticated;
GRANT ALL ON public.executive_saved_views TO service_role;
ALTER TABLE public.executive_saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_saved_views_own ON public.executive_saved_views FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- executive_activity_log
-- ============================================================
CREATE TABLE public.executive_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exec_activity_log_created_idx ON public.executive_activity_log (created_at DESC);
GRANT SELECT, INSERT ON public.executive_activity_log TO authenticated;
GRANT ALL ON public.executive_activity_log TO service_role;
ALTER TABLE public.executive_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY exec_activity_read ON public.executive_activity_log FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));
CREATE POLICY exec_activity_write ON public.executive_activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_user_id);

-- ============================================================
-- shared_report_recents (per-user recent report list, for /reports)
-- ============================================================
CREATE TABLE public.shared_report_recents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_key text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, report_key)
);
CREATE INDEX shared_report_recents_user_idx ON public.shared_report_recents (user_id, opened_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_report_recents TO authenticated;
GRANT ALL ON public.shared_report_recents TO service_role;
ALTER TABLE public.shared_report_recents ENABLE ROW LEVEL SECURITY;
CREATE POLICY shared_recents_own ON public.shared_report_recents FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE TRIGGER trg_exec_work_items_updated BEFORE UPDATE ON public.executive_work_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_decisions_updated BEFORE UPDATE ON public.executive_decisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_briefings_updated BEFORE UPDATE ON public.executive_briefings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_updates_updated BEFORE UPDATE ON public.executive_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_risks_updated BEFORE UPDATE ON public.executive_risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_kpi_snapshots_updated BEFORE UPDATE ON public.executive_kpi_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_saved_views_updated BEFORE UPDATE ON public.executive_saved_views FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
