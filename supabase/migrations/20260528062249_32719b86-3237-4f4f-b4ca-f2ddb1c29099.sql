
-- 1) evaluation_rules table
CREATE TABLE public.evaluation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('BCBA','RBT')),
  eval_type text NOT NULL CHECK (eval_type IN ('30-Day','Quarterly','Annual')),
  enabled boolean NOT NULL DEFAULT true,
  first_offset_days integer NOT NULL DEFAULT 90,
  cadence_days integer,
  reminder_days_before integer NOT NULL DEFAULT 14,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, eval_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_rules TO authenticated;
GRANT ALL ON public.evaluation_rules TO service_role;

ALTER TABLE public.evaluation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth full evaluation_rules"
  ON public.evaluation_rules FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_evaluation_rules_updated_at
  BEFORE UPDATE ON public.evaluation_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed defaults
INSERT INTO public.evaluation_rules (role, eval_type, enabled, first_offset_days, cadence_days, reminder_days_before) VALUES
  ('BCBA','Quarterly', true, 90,  90,  14),
  ('BCBA','Annual',    true, 365, 365, 21),
  ('BCBA','30-Day',    false, 30, NULL, 7),
  ('RBT','30-Day',     true, 30,  NULL, 7),
  ('RBT','Quarterly',  true, 90,  90,  14),
  ('RBT','Annual',     true, 365, 365, 21);

-- 2) Alter evaluations
ALTER TABLE public.evaluations
  ALTER COLUMN cycle_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS generated_from_hire_date boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS assigned_reviewer_id uuid REFERENCES public.evaluation_staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eval_label text;

-- Widen evaluation_type check to include '30-Day'
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_evaluation_type_check;
ALTER TABLE public.evaluations
  ADD CONSTRAINT evaluations_evaluation_type_check
  CHECK (evaluation_type IN ('30-Day','Quarterly','Annual'));

CREATE INDEX IF NOT EXISTS idx_evaluations_due_date ON public.evaluations(due_date);
CREATE INDEX IF NOT EXISTS idx_evaluations_staff_due ON public.evaluations(staff_id, due_date);

-- 3) Generator function
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
          WHEN '30-Day' THEN '30-Day Review'
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

-- 4) Trigger on evaluation_staff
CREATE OR REPLACE FUNCTION public.trg_regen_staff_evaluations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR
     NEW.hire_date IS DISTINCT FROM OLD.hire_date OR
     NEW.role IS DISTINCT FROM OLD.role OR
     NEW.active_status IS DISTINCT FROM OLD.active_status
  THEN
    PERFORM public.regenerate_staff_evaluations(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_regen_evals ON public.evaluation_staff;
CREATE TRIGGER trg_staff_regen_evals
  AFTER INSERT OR UPDATE OF hire_date, role, active_status ON public.evaluation_staff
  FOR EACH ROW EXECUTE FUNCTION public.trg_regen_staff_evaluations();

-- 5) Backfill existing staff
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.evaluation_staff WHERE active_status = true AND hire_date IS NOT NULL LOOP
    PERFORM public.regenerate_staff_evaluations(r.id);
  END LOOP;
END $$;
