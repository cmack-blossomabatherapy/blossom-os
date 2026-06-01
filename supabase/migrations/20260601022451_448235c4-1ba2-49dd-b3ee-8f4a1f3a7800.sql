
-- 1. evaluation_reviewers table
CREATE TABLE IF NOT EXISTS public.evaluation_reviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  reviewer_staff_id uuid REFERENCES public.evaluation_staff(id) ON DELETE SET NULL,
  reviewer_email text NOT NULL,
  reviewer_name text,
  status text NOT NULL DEFAULT 'Not Sent'
    CHECK (status IN ('Not Sent','Sent','In Progress','Completed','Declined')),
  sent_at timestamptz,
  completed_at timestamptz,
  response_id uuid REFERENCES public.evaluation_responses(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, reviewer_email)
);

CREATE INDEX IF NOT EXISTS evaluation_reviewers_eval_idx ON public.evaluation_reviewers(evaluation_id);
CREATE INDEX IF NOT EXISTS evaluation_reviewers_staff_idx ON public.evaluation_reviewers(reviewer_staff_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_reviewers TO authenticated;
GRANT ALL ON public.evaluation_reviewers TO service_role;

ALTER TABLE public.evaluation_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval hr access evaluation_reviewers"
  ON public.evaluation_reviewers
  FOR ALL
  TO authenticated
  USING (public.eval_can_access(auth.uid()))
  WITH CHECK (public.eval_can_access(auth.uid()));

CREATE POLICY "eval qa read evaluation_reviewers"
  ON public.evaluation_reviewers FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.evaluations e
      JOIN public.evaluation_staff s ON s.id = e.staff_id
      WHERE e.id = evaluation_id AND s.role IN ('BCBA','RBT')
    )
  );

-- 2. updated_at trigger
CREATE TRIGGER trg_eval_reviewers_updated_at
  BEFORE UPDATE ON public.evaluation_reviewers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Aggregate reviewer statuses into evaluations.leadership_status
CREATE OR REPLACE FUNCTION public.refresh_evaluation_leadership_status(_evaluation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total int;
  completed int;
  in_progress int;
  sent int;
  new_status text;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Completed'),
    COUNT(*) FILTER (WHERE status = 'In Progress'),
    COUNT(*) FILTER (WHERE status IN ('Sent','In Progress','Completed'))
  INTO total, completed, in_progress, sent
  FROM public.evaluation_reviewers
  WHERE evaluation_id = _evaluation_id;

  IF total = 0 THEN
    new_status := 'Not Started';
  ELSIF completed = total THEN
    new_status := 'Completed';
  ELSIF in_progress > 0 OR completed > 0 OR sent > 0 THEN
    new_status := 'In Progress';
  ELSE
    new_status := 'Not Started';
  END IF;

  UPDATE public.evaluations
     SET leadership_status = new_status,
         updated_at = now()
   WHERE id = _evaluation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_eval_reviewers_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_evaluation_leadership_status(COALESCE(NEW.evaluation_id, OLD.evaluation_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_eval_reviewers_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_reviewers
  FOR EACH ROW EXECUTE FUNCTION public.trg_eval_reviewers_refresh();

-- 4. When a Leadership response is submitted, mark the matching reviewer complete
CREATE OR REPLACE FUNCTION public.trg_eval_response_mark_reviewer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.response_type = 'Leadership' AND NEW.respondent_email IS NOT NULL THEN
    UPDATE public.evaluation_reviewers
       SET status = 'Completed',
           completed_at = COALESCE(NEW.submitted_at, now()),
           response_id = NEW.id,
           updated_at = now()
     WHERE evaluation_id = NEW.evaluation_id
       AND lower(reviewer_email) = lower(NEW.respondent_email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_eval_response_reviewer ON public.evaluation_responses;
CREATE TRIGGER trg_eval_response_reviewer
  AFTER INSERT ON public.evaluation_responses
  FOR EACH ROW EXECUTE FUNCTION public.trg_eval_response_mark_reviewer();
