-- QA Pass 5: extend qa_work_item_overrides with "truthful state" columns so
-- the UI can accurately reflect resolved / received states after refresh.
ALTER TABLE public.qa_work_item_overrides
  ADD COLUMN IF NOT EXISTS progress_report_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS treatment_plan_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_reason text,
  ADD COLUMN IF NOT EXISTS last_completed_action text,
  ADD COLUMN IF NOT EXISTS workflow_state text;

-- Re-affirm grants so the new columns are reachable via PostgREST.
GRANT SELECT, INSERT, UPDATE ON public.qa_work_item_overrides TO authenticated;
GRANT ALL ON public.qa_work_item_overrides TO service_role;

-- Existing policies already cover ALL with USING + WITH CHECK using
-- has_permission(auth.uid(), 'qa.edit'). No policy changes needed.