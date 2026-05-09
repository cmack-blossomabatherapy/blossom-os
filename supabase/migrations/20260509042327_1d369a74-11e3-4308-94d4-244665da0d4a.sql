
ALTER TABLE public.sop_search_feedback
  ADD COLUMN IF NOT EXISTS filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS filters_norm text NOT NULL DEFAULT '';

ALTER TABLE public.sop_search_feedback
  DROP CONSTRAINT IF EXISTS sop_search_feedback_user_id_section_id_query_norm_key;

ALTER TABLE public.sop_search_feedback
  ADD CONSTRAINT sop_search_feedback_user_section_query_filters_key
  UNIQUE (user_id, section_id, query_norm, filters_norm);

CREATE INDEX IF NOT EXISTS sop_search_feedback_filters_norm_idx
  ON public.sop_search_feedback (filters_norm);
