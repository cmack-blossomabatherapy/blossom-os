
-- =========================================================================
-- Multi-hat access model: employee_role_assignments
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.employee_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_key text NOT NULL,
  os_role_key text NULL,
  state_code text NULL,
  department_key text NULL,
  scope text NOT NULL DEFAULT 'state',
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  starts_at date NULL,
  ends_at date NULL,
  title_override text NULL,
  responsibility_notes text NULL,
  assigned_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT era_scope_check CHECK (scope IN ('company','state','department','assigned')),
  CONSTRAINT era_state_check CHECK (state_code IS NULL OR state_code IN ('GA','NC','VA','TN','MD','NJ'))
);

CREATE INDEX IF NOT EXISTS era_user_idx ON public.employee_role_assignments(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS era_employee_idx ON public.employee_role_assignments(employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS era_primary_per_user_uidx
  ON public.employee_role_assignments(user_id)
  WHERE is_primary = true AND is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS era_uniq_hat_uidx
  ON public.employee_role_assignments(
    user_id,
    role_key,
    COALESCE(state_code, ''),
    COALESCE(department_key, '')
  );

CREATE OR REPLACE FUNCTION public.tg_era_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_era_updated_at ON public.employee_role_assignments;
CREATE TRIGGER trg_era_updated_at
  BEFORE UPDATE ON public.employee_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_era_set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_role_assignments TO authenticated;
GRANT ALL ON public.employee_role_assignments TO service_role;

ALTER TABLE public.employee_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_role_assignments(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','super_admin','systems_admin','hr_lead','hr_admin','hr_manager')
  );
$$;

DROP POLICY IF EXISTS "era_read_self" ON public.employee_role_assignments;
CREATE POLICY "era_read_self" ON public.employee_role_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "era_admin_read_all" ON public.employee_role_assignments;
CREATE POLICY "era_admin_read_all" ON public.employee_role_assignments
  FOR SELECT TO authenticated USING (public.can_manage_role_assignments(auth.uid()));

DROP POLICY IF EXISTS "era_admin_insert" ON public.employee_role_assignments;
CREATE POLICY "era_admin_insert" ON public.employee_role_assignments
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_role_assignments(auth.uid()));

DROP POLICY IF EXISTS "era_admin_update" ON public.employee_role_assignments;
CREATE POLICY "era_admin_update" ON public.employee_role_assignments
  FOR UPDATE TO authenticated
  USING (public.can_manage_role_assignments(auth.uid()))
  WITH CHECK (public.can_manage_role_assignments(auth.uid()));

DROP POLICY IF EXISTS "era_admin_delete" ON public.employee_role_assignments;
CREATE POLICY "era_admin_delete" ON public.employee_role_assignments
  FOR DELETE TO authenticated USING (public.can_manage_role_assignments(auth.uid()));

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_role_assignments(_user_id uuid)
RETURNS SETOF public.employee_role_assignments
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.employee_role_assignments
  WHERE user_id = _user_id
  ORDER BY is_primary DESC, is_active DESC, created_at;
$$;

CREATE OR REPLACE FUNCTION public.user_allowed_states(_user_id uuid)
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT state_code FROM public.employee_role_assignments
  WHERE user_id = _user_id AND is_active = true AND state_code IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.user_allowed_departments(_user_id uuid, _state_code text)
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT department_key FROM public.employee_role_assignments
  WHERE user_id = _user_id AND is_active = true AND department_key IS NOT NULL
    AND (_state_code IS NULL OR state_code IS NULL OR state_code = _state_code OR scope = 'company');
$$;

CREATE OR REPLACE FUNCTION public.user_has_hat(
  _user_id uuid, _role_key text, _state_code text DEFAULT NULL, _department_key text DEFAULT NULL
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_role_assignments
    WHERE user_id = _user_id AND is_active = true AND role_key = _role_key
      AND (_state_code IS NULL OR state_code IS NULL OR state_code = _state_code)
      AND (_department_key IS NULL OR department_key IS NULL OR department_key = _department_key)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_state_department(
  _user_id uuid, _state_code text, _department_key text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_role_assignments
    WHERE user_id = _user_id AND is_active = true
      AND (
        scope = 'company'
        OR (
          (state_code IS NULL OR state_code = _state_code)
          AND (department_key IS NULL OR department_key = _department_key)
        )
      )
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','super_admin','systems_admin','executive','coo','director_of_operations','operations_manager')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role_assignments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_allowed_states(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_allowed_departments(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_hat(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_state_department(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_role_assignments(uuid) TO authenticated;

-- Backfill from user_roles
WITH src AS (
  SELECT
    ur.user_id,
    ur.role::text AS role_key,
    COALESCE(e.state, p.state) AS state_code_raw,
    e.id AS employee_id,
    ROW_NUMBER() OVER (
      PARTITION BY ur.user_id
      ORDER BY
        CASE ur.role::text
          WHEN 'admin' THEN 0 WHEN 'super_admin' THEN 0
          WHEN 'state_director' THEN 1 WHEN 'assistant_state_director' THEN 2
          ELSE 3
        END,
        ur.role::text
    ) AS rn
  FROM public.user_roles ur
  LEFT JOIN public.profiles  p ON p.user_id = ur.user_id
  LEFT JOIN public.employees e ON e.user_id = ur.user_id
)
INSERT INTO public.employee_role_assignments (
  user_id, employee_id, role_key, state_code, department_key, scope, is_primary, is_active
)
SELECT
  src.user_id,
  src.employee_id,
  src.role_key,
  CASE WHEN src.state_code_raw IN ('GA','NC','VA','TN','MD','NJ') THEN src.state_code_raw ELSE NULL END AS state_code,
  CASE
    WHEN src.role_key IN ('state_director','assistant_state_director') THEN 'state_operations'
    WHEN src.role_key IN ('intake','intake_coordinator','intake_lead') THEN 'intake'
    WHEN src.role_key IN ('recruiting_assistant','recruiting_coordinator','recruiting_lead') THEN 'recruiting'
    WHEN src.role_key IN ('staffing','staffing_coordinator','staffing_lead') THEN 'staffing'
    WHEN src.role_key IN ('scheduling','scheduling_coordinator','scheduling_lead') THEN 'scheduling'
    WHEN src.role_key IN ('auth_team','authorization_coordinator','authorization_manager') THEN 'authorizations'
    WHEN src.role_key IN ('qa','qa_specialist','qa_director') THEN 'qa'
    WHEN src.role_key IN ('credentialing_lead','credentialing_team','credentialing') THEN 'credentialing'
    WHEN src.role_key IN ('hr','hr_admin','hr_manager','hr_lead','hr_team') THEN 'hr'
    WHEN src.role_key IN ('marketing','marketing_team','marketing_growth_lead') THEN 'marketing'
    WHEN src.role_key IN ('business_development') THEN 'business_development'
    WHEN src.role_key IN ('clinic','clinical_lead','clinic_director','bcba','rbt','behavioral_support') THEN 'clinical'
    WHEN src.role_key IN ('finance','billing_lead','finance_benefits_lead','finance_benefits_team') THEN 'finance'
    WHEN src.role_key IN ('payroll_admin','payroll_lead','payroll_coordinator') THEN 'payroll'
    WHEN src.role_key IN ('rcm_team') THEN 'rcm'
    WHEN src.role_key IN ('training_admin') THEN 'training'
    WHEN src.role_key IN ('admin','super_admin','systems_admin') THEN 'systems'
    ELSE NULL
  END AS department_key,
  CASE
    WHEN src.role_key IN ('admin','super_admin','systems_admin','executive','exec','coo','director_of_operations','operations_manager','ops_manager') THEN 'company'
    WHEN src.role_key IN ('state_director','assistant_state_director') THEN 'state'
    ELSE 'department'
  END AS scope,
  (src.rn = 1) AS is_primary,
  true AS is_active
FROM src
ON CONFLICT (user_id, role_key, COALESCE(state_code, ''), COALESCE(department_key, '')) DO NOTHING;
