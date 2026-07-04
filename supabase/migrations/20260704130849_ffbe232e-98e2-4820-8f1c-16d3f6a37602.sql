
-- Behavioral Support pass 2 hardening

-- CHECK constraints for enum-like text fields
ALTER TABLE public.behavioral_support_cases
  DROP CONSTRAINT IF EXISTS bs_cases_severity_chk,
  ADD CONSTRAINT bs_cases_severity_chk CHECK (severity IN ('low','medium','high','crisis')),
  DROP CONSTRAINT IF EXISTS bs_cases_status_chk,
  ADD CONSTRAINT bs_cases_status_chk CHECK (status IN ('open','triage','active','monitoring','waiting_on_bcba','waiting_on_family','resolved','archived')),
  DROP CONSTRAINT IF EXISTS bs_cases_source_chk,
  ADD CONSTRAINT bs_cases_source_chk CHECK (source_system IN ('manual','centralreach','phone','intake','qa','case_manager','bcba','rbt','other'));

ALTER TABLE public.behavioral_support_escalations
  DROP CONSTRAINT IF EXISTS bs_esc_severity_chk,
  ADD CONSTRAINT bs_esc_severity_chk CHECK (severity IN ('low','medium','high','crisis')),
  DROP CONSTRAINT IF EXISTS bs_esc_status_chk,
  ADD CONSTRAINT bs_esc_status_chk CHECK (status IN ('new','triage','assigned','in_progress','waiting_on_bcba','waiting_on_family','resolved','archived')),
  DROP CONSTRAINT IF EXISTS bs_esc_type_chk,
  ADD CONSTRAINT bs_esc_type_chk CHECK (escalation_type IN ('crisis','aggression','family_concern','staff_safety','clinical_support','supervision_gap','parent_training_gap','service_instability','other'));

ALTER TABLE public.behavioral_support_plans
  DROP CONSTRAINT IF EXISTS bs_plans_status_chk,
  ADD CONSTRAINT bs_plans_status_chk CHECK (plan_status IN ('draft','active','monitoring','completed','archived'));

ALTER TABLE public.behavioral_support_plan_tasks
  DROP CONSTRAINT IF EXISTS bs_tasks_status_chk,
  ADD CONSTRAINT bs_tasks_status_chk CHECK (status IN ('open','in_progress','blocked','completed','archived'));

ALTER TABLE public.behavioral_support_followups
  DROP CONSTRAINT IF EXISTS bs_fu_status_chk,
  ADD CONSTRAINT bs_fu_status_chk CHECK (status IN ('open','due_today','overdue','completed','cancelled')),
  DROP CONSTRAINT IF EXISTS bs_fu_priority_chk,
  ADD CONSTRAINT bs_fu_priority_chk CHECK (priority IN ('low','medium','high','urgent')),
  DROP CONSTRAINT IF EXISTS bs_fu_type_chk,
  ADD CONSTRAINT bs_fu_type_chk CHECK (followup_type IN ('family_call','bcba_checkin','rbt_support','plan_review','crisis_checkin','documentation_review','other'));

-- Tighten Behavioral Support plans/tasks SELECT policies.
-- The previous policies granted every BCBA broad SELECT on all plans and
-- tasks across every client. Behavioral/clinical support content is
-- protected and should not be exposed org-wide. Until a reliable
-- user_id -> BCBA assignment mapping exists, remove broad BCBA access and
-- keep visibility limited to leadership + behavioral support roles.

DROP POLICY IF EXISTS "bs_plans_select" ON public.behavioral_support_plans;
CREATE POLICY "bs_plans_select" ON public.behavioral_support_plans FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
  );

DROP POLICY IF EXISTS "bs_tasks_select" ON public.behavioral_support_plan_tasks;
CREATE POLICY "bs_tasks_select" ON public.behavioral_support_plan_tasks FOR SELECT
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec') OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'clinic_director') OR public.has_role(auth.uid(),'behavioral_support')
  );
