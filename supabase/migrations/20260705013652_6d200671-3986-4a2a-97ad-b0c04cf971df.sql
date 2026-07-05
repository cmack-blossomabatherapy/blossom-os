-- Case Manager Pass 4: durable link between parent communications and follow-ups.
-- Both columns are nullable so historical rows are unaffected.
-- ON DELETE SET NULL keeps records intact if the counterpart is removed.

ALTER TABLE public.case_manager_communications
  ADD COLUMN IF NOT EXISTS follow_up_id uuid
    REFERENCES public.case_manager_follow_ups(id) ON DELETE SET NULL;

ALTER TABLE public.case_manager_follow_ups
  ADD COLUMN IF NOT EXISTS source_communication_id uuid
    REFERENCES public.case_manager_communications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cm_comms_follow_up_id
  ON public.case_manager_communications (follow_up_id)
  WHERE follow_up_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cm_followups_source_comm_id
  ON public.case_manager_follow_ups (source_communication_id)
  WHERE source_communication_id IS NOT NULL;