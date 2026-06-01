
-- 1. Link evaluation_staff to employees with a proper unique constraint
ALTER TABLE public.evaluation_staff
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.evaluation_staff
  DROP CONSTRAINT IF EXISTS evaluation_staff_employee_id_key;
ALTER TABLE public.evaluation_staff
  ADD CONSTRAINT evaluation_staff_employee_id_key UNIQUE (employee_id);

-- 2. Helper to classify an employee job title into a Blossom evaluation role
CREATE OR REPLACE FUNCTION public.classify_eval_role(_job_title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _job_title ILIKE '%BCBA%' THEN 'BCBA'
    WHEN _job_title ILIKE '%Registered Behavior Technician%' OR _job_title ILIKE 'RBT %' OR _job_title ILIKE '% RBT%' OR _job_title = 'RBT' THEN 'RBT'
    ELSE 'Office'
  END
$$;

-- 3. Sync function: keep evaluation_staff in sync with an employee row
CREATE OR REPLACE FUNCTION public.sync_employee_to_evaluation_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _role text;
  _active boolean;
BEGIN
  _email := COALESCE(NEW.email, NEW.employee_code || '@blossomaba.local');
  _role := public.classify_eval_role(NEW.job_title);
  _active := NEW.status::text NOT IN ('terminated', 'inactive');

  INSERT INTO public.evaluation_staff (
    employee_id, first_name, last_name, email, phone, role, state,
    hire_date, active_status, evaluation_frequency
  )
  VALUES (
    NEW.id, NEW.first_name, NEW.last_name, _email, NEW.phone, _role, NEW.state,
    NEW.hire_date, _active, 'Both'
  )
  ON CONFLICT (employee_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    state = EXCLUDED.state,
    hire_date = EXCLUDED.hire_date,
    active_status = EXCLUDED.active_status,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_employee_eval_staff ON public.employees;
CREATE TRIGGER trg_sync_employee_eval_staff
  AFTER INSERT OR UPDATE OF first_name, last_name, email, phone, job_title, state, hire_date, status
  ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_to_evaluation_staff();

-- 4. One-time backfill of all existing employees
INSERT INTO public.evaluation_staff (
  employee_id, first_name, last_name, email, phone, role, state,
  hire_date, active_status, evaluation_frequency
)
SELECT
  e.id,
  e.first_name,
  e.last_name,
  COALESCE(e.email, e.employee_code || '@blossomaba.local'),
  e.phone,
  public.classify_eval_role(e.job_title),
  e.state,
  e.hire_date,
  e.status::text NOT IN ('terminated', 'inactive'),
  'Both'
FROM public.employees e
ON CONFLICT (employee_id) DO NOTHING;

-- 5. QA team read access: BCBA + RBT evaluations only
CREATE OR REPLACE FUNCTION public.eval_is_qa(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.has_role(_user_id, 'qa') $$;

DROP POLICY IF EXISTS "eval qa read evaluation_staff" ON public.evaluation_staff;
CREATE POLICY "eval qa read evaluation_staff"
  ON public.evaluation_staff FOR SELECT TO authenticated
  USING (public.eval_is_qa(auth.uid()) AND role IN ('BCBA','RBT'));

DROP POLICY IF EXISTS "eval qa read evaluations" ON public.evaluations;
CREATE POLICY "eval qa read evaluations"
  ON public.evaluations FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (SELECT 1 FROM public.evaluation_staff s WHERE s.id = staff_id AND s.role IN ('BCBA','RBT'))
  );

DROP POLICY IF EXISTS "eval qa read evaluation_meetings" ON public.evaluation_meetings;
CREATE POLICY "eval qa read evaluation_meetings"
  ON public.evaluation_meetings FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.evaluations e JOIN public.evaluation_staff s ON s.id = e.staff_id
      WHERE e.id = evaluation_id AND s.role IN ('BCBA','RBT')
    )
  );

DROP POLICY IF EXISTS "eval qa read evaluation_notes" ON public.evaluation_notes;
CREATE POLICY "eval qa read evaluation_notes"
  ON public.evaluation_notes FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.evaluations e JOIN public.evaluation_staff s ON s.id = e.staff_id
      WHERE e.id = evaluation_id AND s.role IN ('BCBA','RBT')
    )
  );

DROP POLICY IF EXISTS "eval qa read evaluation_responses" ON public.evaluation_responses;
CREATE POLICY "eval qa read evaluation_responses"
  ON public.evaluation_responses FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.evaluations e JOIN public.evaluation_staff s ON s.id = e.staff_id
      WHERE e.id = evaluation_id AND s.role IN ('BCBA','RBT')
    )
  );

DROP POLICY IF EXISTS "eval qa read evaluation_goals" ON public.evaluation_goals;
CREATE POLICY "eval qa read evaluation_goals"
  ON public.evaluation_goals FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (SELECT 1 FROM public.evaluation_staff s WHERE s.id = staff_id AND s.role IN ('BCBA','RBT'))
  );

DROP POLICY IF EXISTS "eval qa read evaluation_performance_scores" ON public.evaluation_performance_scores;
CREATE POLICY "eval qa read evaluation_performance_scores"
  ON public.evaluation_performance_scores FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (SELECT 1 FROM public.evaluation_staff s WHERE s.id = staff_id AND s.role IN ('BCBA','RBT'))
  );

DROP POLICY IF EXISTS "eval qa read evaluation_risk_flags" ON public.evaluation_risk_flags;
CREATE POLICY "eval qa read evaluation_risk_flags"
  ON public.evaluation_risk_flags FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (SELECT 1 FROM public.evaluation_staff s WHERE s.id = staff_id AND s.role IN ('BCBA','RBT'))
  );

DROP POLICY IF EXISTS "eval qa read evaluation_coaching_plans" ON public.evaluation_coaching_plans;
CREATE POLICY "eval qa read evaluation_coaching_plans"
  ON public.evaluation_coaching_plans FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (SELECT 1 FROM public.evaluation_staff s WHERE s.id = staff_id AND s.role IN ('BCBA','RBT'))
  );

DROP POLICY IF EXISTS "eval qa read evaluation_training_assignments" ON public.evaluation_training_assignments;
CREATE POLICY "eval qa read evaluation_training_assignments"
  ON public.evaluation_training_assignments FOR SELECT TO authenticated
  USING (
    public.eval_is_qa(auth.uid())
    AND EXISTS (SELECT 1 FROM public.evaluation_staff s WHERE s.id = staff_id AND s.role IN ('BCBA','RBT'))
  );

DROP POLICY IF EXISTS "eval qa read evaluation_forms" ON public.evaluation_forms;
CREATE POLICY "eval qa read evaluation_forms"
  ON public.evaluation_forms FOR SELECT TO authenticated
  USING (public.eval_is_qa(auth.uid()) AND staff_role IN ('BCBA','RBT'));

DROP POLICY IF EXISTS "eval qa read evaluation_rules" ON public.evaluation_rules;
CREATE POLICY "eval qa read evaluation_rules"
  ON public.evaluation_rules FOR SELECT TO authenticated
  USING (public.eval_is_qa(auth.uid()) AND role IN ('BCBA','RBT'));
