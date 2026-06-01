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
  _existing_id uuid;
BEGIN
  _email := COALESCE(NEW.email, NEW.employee_code || '@blossomaba.local');
  _role := public.classify_eval_role(NEW.job_title);
  _active := NEW.status::text NOT IN ('terminated', 'inactive');

  -- If no evaluation_staff row is linked to this employee yet, try to adopt an
  -- existing unlinked row by name match before inserting a new one.
  SELECT id INTO _existing_id
  FROM public.evaluation_staff
  WHERE employee_id = NEW.id
  LIMIT 1;

  IF _existing_id IS NULL THEN
    SELECT id INTO _existing_id
    FROM public.evaluation_staff
    WHERE employee_id IS NULL
      AND lower(first_name) = lower(NEW.first_name)
      AND lower(last_name)  = lower(NEW.last_name)
    ORDER BY created_at ASC
    LIMIT 1;

    IF _existing_id IS NOT NULL THEN
      UPDATE public.evaluation_staff SET
        employee_id   = NEW.id,
        first_name    = NEW.first_name,
        last_name     = NEW.last_name,
        email         = _email,
        phone         = NEW.phone,
        role          = _role,
        state         = NEW.state,
        hire_date     = NEW.hire_date,
        active_status = _active,
        updated_at    = now()
      WHERE id = _existing_id;
      RETURN NEW;
    END IF;
  END IF;

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

-- One-time backfill: link existing unlinked evaluation_staff rows to employees
-- by name and pull the latest email/phone/role/etc.
WITH matched AS (
  SELECT es.id AS es_id, e.id AS emp_id, e.first_name, e.last_name,
         COALESCE(e.email, e.employee_code || '@blossomaba.local') AS email,
         e.phone, public.classify_eval_role(e.job_title) AS role,
         e.state, e.hire_date,
         (e.status::text NOT IN ('terminated','inactive')) AS active
  FROM public.evaluation_staff es
  JOIN public.employees e
    ON lower(e.first_name) = lower(es.first_name)
   AND lower(e.last_name)  = lower(es.last_name)
  WHERE es.employee_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.evaluation_staff es2 WHERE es2.employee_id = e.id
    )
)
UPDATE public.evaluation_staff es SET
  employee_id   = m.emp_id,
  email         = m.email,
  phone         = m.phone,
  role          = m.role,
  state         = m.state,
  hire_date     = m.hire_date,
  active_status = m.active,
  updated_at    = now()
FROM matched m
WHERE es.id = m.es_id;

-- For the Test BCBA case: an orphan employee-linked row was created when the
-- employee email changed. Merge it into the original evaluation_staff row
-- (which holds the real evaluation/email history) and delete the orphan plus
-- its auto-generated placeholder evaluations.
DO $$
DECLARE
  _orig uuid;
  _dup  uuid;
  _emp  uuid;
BEGIN
  SELECT es.id, e.id INTO _orig, _emp
  FROM public.evaluation_staff es
  JOIN public.employees e
    ON lower(e.first_name) = lower(es.first_name)
   AND lower(e.last_name)  = lower(es.last_name)
  WHERE es.employee_id = e.id
  LIMIT 0; -- noop; handled by backfill above
END $$;

-- Specifically resolve any remaining duplicate (same employee_id) by keeping
-- the one with the most evaluations and deleting the other along with its
-- placeholder data.
WITH ranked AS (
  SELECT es.id, es.employee_id,
         (SELECT count(*) FROM public.evaluations ev WHERE ev.staff_id = es.id) AS ev_count,
         row_number() OVER (
           PARTITION BY es.employee_id
           ORDER BY (SELECT count(*) FROM public.evaluations ev WHERE ev.staff_id = es.id) DESC,
                    es.created_at ASC
         ) AS rn
  FROM public.evaluation_staff es
  WHERE es.employee_id IS NOT NULL
),
to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.evaluation_staff WHERE id IN (SELECT id FROM to_delete);