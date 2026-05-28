
-- Helper functions
CREATE OR REPLACE FUNCTION public.eval_can_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(_user_id,'admin')
    OR public.has_role(_user_id,'exec')
    OR public.has_role(_user_id,'ops_manager')
    OR public.has_role(_user_id,'hr_admin')
    OR public.has_role(_user_id,'hr_manager')
    OR public.has_role(_user_id,'hr')
$$;

CREATE OR REPLACE FUNCTION public.recruiting_can_read(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.recruiting_can_write(_user_id)
    OR public.has_role(_user_id,'exec')
    OR public.has_role(_user_id,'state_director')
$$;

CREATE OR REPLACE FUNCTION public.alerts_can_read(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(_user_id,'admin')
    OR public.has_role(_user_id,'exec')
    OR public.has_role(_user_id,'ops_manager')
    OR public.has_role(_user_id,'state_director')
$$;

CREATE OR REPLACE FUNCTION public.kpi_can_read(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(_user_id,'admin')
    OR public.has_role(_user_id,'exec')
    OR public.has_role(_user_id,'ops_manager')
    OR public.has_role(_user_id,'finance')
    OR public.has_role(_user_id,'state_director')
$$;

-- Evaluation audit log: was public; restrict to HR/admin reads, allow inserts only when authenticated
DROP POLICY IF EXISTS "audit log open insert" ON public.evaluation_audit_log;
DROP POLICY IF EXISTS "audit log open read" ON public.evaluation_audit_log;
CREATE POLICY "eval audit read" ON public.evaluation_audit_log FOR SELECT TO authenticated USING (public.eval_can_access(auth.uid()));
CREATE POLICY "eval audit insert" ON public.evaluation_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Evaluation settings: HR/admin only
DROP POLICY IF EXISTS "settings open read" ON public.evaluation_settings;
DROP POLICY IF EXISTS "settings open write" ON public.evaluation_settings;
CREATE POLICY "eval settings read" ON public.evaluation_settings FOR SELECT TO authenticated USING (public.eval_can_access(auth.uid()));
CREATE POLICY "eval settings write" ON public.evaluation_settings FOR ALL TO authenticated USING (public.eval_can_access(auth.uid())) WITH CHECK (public.eval_can_access(auth.uid()));

-- All other evaluation_* tables: HR/admin only
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'evaluations','evaluation_staff','evaluation_responses','evaluation_forms',
    'evaluation_form_tokens','evaluation_emails','evaluation_email_templates',
    'evaluation_notes','evaluation_meetings','evaluation_goals','evaluation_coaching_plans',
    'evaluation_performance_scores','evaluation_risk_flags','evaluation_rules',
    'evaluation_training_assignments','evaluation_ai_insights'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth full %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all goals" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all coaching" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all perf" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all flags" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all training" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all insights" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "eval hr access %1$s" ON public.%1$s FOR ALL TO authenticated USING (public.eval_can_access(auth.uid())) WITH CHECK (public.eval_can_access(auth.uid()))', t);
  END LOOP;
END $$;

-- Recruiting tables: restrict reads
DROP POLICY IF EXISTS "View candidates" ON public.recruiting_candidates;
CREATE POLICY "View candidates" ON public.recruiting_candidates FOR SELECT TO authenticated USING (public.recruiting_can_read(auth.uid()));

DROP POLICY IF EXISTS "View msgs" ON public.recruiting_messages;
CREATE POLICY "View msgs" ON public.recruiting_messages FOR SELECT TO authenticated USING (public.recruiting_can_read(auth.uid()));

DO $$
DECLARE t text; pname text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'recruiting_offers','recruiting_background_checks','recruiting_interviews',
    'recruiting_orientation_slots','recruiting_onboarding_tasks','recruiting_followups',
    'recruiting_escalations','recruiting_staffing_needs','recruiting_workflow_stages',
    'interview_outcome_checks'
  ])
  LOOP
    FOR pname IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd='SELECT'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Recruiting read %1$s" ON public.%1$s FOR SELECT TO authenticated USING (public.recruiting_can_read(auth.uid()))', t);
  END LOOP;
END $$;

-- Critical alerts
DROP POLICY IF EXISTS "Authenticated can view critical alerts" ON public.critical_alerts;
CREATE POLICY "View critical alerts" ON public.critical_alerts FOR SELECT TO authenticated USING (public.alerts_can_read(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view alert audit" ON public.critical_alert_audit;
CREATE POLICY "View alert audit" ON public.critical_alert_audit FOR SELECT TO authenticated USING (public.alerts_can_read(auth.uid()));

-- KPI tables
DROP POLICY IF EXISTS "scorecards_select_auth" ON public.kpi_scorecards;
CREATE POLICY "scorecards_select" ON public.kpi_scorecards FOR SELECT TO authenticated USING (public.kpi_can_read(auth.uid()));

DROP POLICY IF EXISTS "values_select_auth" ON public.kpi_values;
CREATE POLICY "values_select" ON public.kpi_values FOR SELECT TO authenticated USING (public.kpi_can_read(auth.uid()));

DROP POLICY IF EXISTS "notes_select_auth" ON public.kpi_notes;
CREATE POLICY "notes_select" ON public.kpi_notes FOR SELECT TO authenticated USING (public.kpi_can_read(auth.uid()));

DROP POLICY IF EXISTS "imports_select_auth" ON public.kpi_imports;
CREATE POLICY "imports_select" ON public.kpi_imports FOR SELECT TO authenticated USING (public.kpi_can_read(auth.uid()));

-- Realtime channel authorization: only authenticated users can subscribe
DROP POLICY IF EXISTS "authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "authenticated can read realtime messages"
  ON realtime.messages FOR SELECT TO authenticated USING (true);
