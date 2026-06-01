-- Widen evaluation type constraints to support 10-Day and 90-Day reviews
ALTER TABLE public.evaluation_rules DROP CONSTRAINT IF EXISTS evaluation_rules_eval_type_check;
ALTER TABLE public.evaluation_rules ADD CONSTRAINT evaluation_rules_eval_type_check
  CHECK (eval_type = ANY (ARRAY['10-Day'::text, '30-Day'::text, '90-Day'::text, 'Quarterly'::text, 'Annual'::text]));

ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_evaluation_type_check;
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_evaluation_type_check
  CHECK (evaluation_type = ANY (ARRAY['10-Day'::text, '30-Day'::text, '90-Day'::text, 'Quarterly'::text, 'Annual'::text]));

ALTER TABLE public.evaluation_forms DROP CONSTRAINT IF EXISTS evaluation_forms_evaluation_type_check;
ALTER TABLE public.evaluation_forms ADD CONSTRAINT evaluation_forms_evaluation_type_check
  CHECK (evaluation_type = ANY (ARRAY['10-Day'::text, '30-Day'::text, '90-Day'::text, 'Quarterly'::text, 'Annual'::text]));

-- Rename Office 30-Day review to 90-Day review
UPDATE public.evaluation_rules
SET eval_type = '90-Day', first_offset_days = 90
WHERE role = 'Office' AND eval_type = '30-Day';

-- Add new 10-Day review rule for RBT (disabled by default)
INSERT INTO public.evaluation_rules (role, eval_type, enabled, first_offset_days, cadence_days, reminder_days_before)
VALUES ('RBT', '10-Day', false, 10, NULL, 7)
ON CONFLICT (role, eval_type) DO NOTHING;

-- Update any orphaned Office evaluations from 30-Day to 90-Day (safety net)
UPDATE public.evaluations
SET evaluation_type = '90-Day'
WHERE evaluation_type = '30-Day'
  AND staff_id IN (SELECT id FROM public.evaluation_staff WHERE role = 'Office');

-- Update regenerate_staff_evaluations to label 10-Day and 90-Day reviews correctly
CREATE OR REPLACE FUNCTION public.regenerate_staff_evaluations(_staff_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.evaluation_staff%ROWTYPE;
  r record;
  occurrence_date date;
  horizon_date date;
  created_count int := 0;
  label_text text;
  occurrence_idx int;
BEGIN
  SELECT * INTO s FROM public.evaluation_staff WHERE id = _staff_id;
  IF NOT FOUND OR s.hire_date IS NULL OR s.active_status = false THEN
    RETURN 0;
  END IF;

  horizon_date := CURRENT_DATE + INTERVAL '2 years';

  FOR r IN
    SELECT * FROM public.evaluation_rules
     WHERE role = s.role AND enabled = true
     ORDER BY first_offset_days
  LOOP
    occurrence_date := s.hire_date + (r.first_offset_days || ' days')::interval;
    occurrence_idx := 1;

    WHILE occurrence_date <= horizon_date LOOP
      -- Skip past dates more than 30 days old
      IF occurrence_date >= CURRENT_DATE - INTERVAL '30 days' THEN
        label_text := CASE r.eval_type
          WHEN '10-Day' THEN '10-Day Review'
          WHEN '30-Day' THEN '30-Day Review'
          WHEN '90-Day' THEN '90-Day Review'
          WHEN 'Quarterly' THEN
            CASE WHEN occurrence_idx = 1 THEN '90-Day Quarterly Review'
                 ELSE 'Quarterly Review #' || occurrence_idx END
          WHEN 'Annual' THEN
            CASE WHEN occurrence_idx = 1 THEN 'Annual Performance Review'
                 ELSE 'Annual Review (Year ' || occurrence_idx || ')' END
        END;

        INSERT INTO public.evaluations (
          staff_id, evaluation_type, due_date, eval_label,
          generated_from_hire_date, assigned_reviewer_id,
          self_status, leadership_status, meeting_status, final_status,
          next_review_date
        )
        SELECT _staff_id, r.eval_type, occurrence_date::date, label_text,
               true, s.supervisor_id,
               'Not Sent', 'Not Started', 'Not Scheduled', 'Not Started',
               occurrence_date::date
        WHERE NOT EXISTS (
          SELECT 1 FROM public.evaluations e
           WHERE e.staff_id = _staff_id
             AND e.evaluation_type = r.eval_type
             AND e.due_date = occurrence_date::date
        );
        IF FOUND THEN created_count := created_count + 1; END IF;
      END IF;

      IF r.cadence_days IS NULL THEN EXIT; END IF;
      occurrence_date := occurrence_date + (r.cadence_days || ' days')::interval;
      occurrence_idx := occurrence_idx + 1;
    END LOOP;
  END LOOP;

  RETURN created_count;
END;
$$;