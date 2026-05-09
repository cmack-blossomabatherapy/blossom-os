
CREATE TYPE public.sop_feedback_vote AS ENUM ('up', 'down', 'not_relevant');

CREATE TABLE public.sop_search_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sop_sections(id) ON DELETE CASCADE,
  query text NOT NULL DEFAULT '',
  query_norm text NOT NULL DEFAULT '',
  vote public.sop_feedback_vote NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_id, query_norm)
);

CREATE INDEX idx_sop_feedback_user ON public.sop_search_feedback(user_id);
CREATE INDEX idx_sop_feedback_section ON public.sop_search_feedback(section_id);
CREATE INDEX idx_sop_feedback_query ON public.sop_search_feedback(query_norm);

ALTER TABLE public.sop_search_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own SOP feedback - select" ON public.sop_search_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own SOP feedback - insert" ON public.sop_search_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own SOP feedback - update" ON public.sop_search_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own SOP feedback - delete" ON public.sop_search_feedback FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_sop_feedback_updated_at
  BEFORE UPDATE ON public.sop_search_feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
