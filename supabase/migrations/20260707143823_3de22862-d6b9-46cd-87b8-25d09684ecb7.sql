
-- Broaden insert policies on State Operations tables so department users
-- (intake, scheduling, authorizations, QA, BCBA, etc.) can create tasks,
-- escalations, and notes for their own state via "Send to State Support"
-- and related flows. Read/update/delete policies are unchanged.

DROP POLICY IF EXISTS "state_tasks_insert" ON public.state_operational_tasks;
CREATE POLICY "state_tasks_insert" ON public.state_operational_tasks
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (state_code IS NOT NULL AND state_code = public.user_state_code())
  );

DROP POLICY IF EXISTS "state_esc_insert" ON public.state_operational_escalations;
CREATE POLICY "state_esc_insert" ON public.state_operational_escalations
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (state_code IS NOT NULL AND state_code = public.user_state_code())
  );

DROP POLICY IF EXISTS "state_notes_insert" ON public.state_operational_notes;
CREATE POLICY "state_notes_insert" ON public.state_operational_notes
  FOR INSERT TO authenticated WITH CHECK (
    public.user_is_leadership()
    OR (state_code IS NOT NULL AND state_code = public.user_state_code())
  );
