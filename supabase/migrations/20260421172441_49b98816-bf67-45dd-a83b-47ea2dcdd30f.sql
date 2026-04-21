
-- 2. NEW ENUMS ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.employee_status AS ENUM ('pending_start','active','on_leave','on_hold','terminated','resigned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contractor','prn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pay_type AS ENUM ('hourly','salaried');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.work_setting AS ENUM ('clinic','home','hybrid','admin','field');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_onboarding_status AS ENUM (
    'new_hire_pending','documents_needed','payroll_setup','training_assigned',
    'systems_setup','manager_assignment','ready_for_start','active','on_hold','incomplete'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_case_status AS ENUM (
    'new','open','waiting_employee','waiting_manager','waiting_payroll','waiting_hr','resolved','closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_case_priority AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_case_type AS ENUM (
    'payroll_issue','attendance_issue','benefit_question','hr_question','onboarding_blocker',
    'training_issue','manager_escalation','documentation_needed','access_issue','policy_acknowledgment',
    'disciplinary_concern','offboarding_case'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_relationship_kind AS ENUM (
    'direct_manager','dotted_line_manager','state_director','department_owner',
    'clinic_leader','onboarding_owner','operational_owner'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_doc_status AS ENUM ('missing','requested','uploaded','verified','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hr_note_visibility AS ENUM ('hr_only','managers','restricted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 3. CORE TABLES -------------------------------------------------------------

-- departments
CREATE TABLE IF NOT EXISTS public.hr_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- employees (master record, optionally linked to a Blossom OS user)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,                -- nullable: not all employees log in
  employee_code TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  job_title TEXT NOT NULL,
  department_id UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  state TEXT NOT NULL,
  clinic TEXT,                         -- free text for now; mirrors existing clinics naming
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  pay_type public.pay_type NOT NULL DEFAULT 'hourly',
  work_setting public.work_setting NOT NULL DEFAULT 'clinic',
  status public.employee_status NOT NULL DEFAULT 'pending_start',
  hire_date DATE,
  start_date DATE,
  termination_date DATE,
  next_review_date DATE,
  last_review_date DATE,
  -- payroll-restricted columns (only readable with hr.payroll.view)
  pay_rate NUMERIC(10,2),
  viventium_employee_id TEXT,
  viventium_sync_status TEXT DEFAULT 'not_connected',
  viventium_last_sync TIMESTAMPTZ,
  -- system access mirrors
  kiosk_pin TEXT,                      -- 4-6 digit PIN, hashed in app layer later
  kiosk_enabled BOOLEAN NOT NULL DEFAULT false,
  resource_hub_access BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_employees_state ON public.employees(state);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- relationships (multi-manager hierarchy)
CREATE TABLE IF NOT EXISTS public.employee_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  related_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  kind public.hr_relationship_kind NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, related_employee_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_emp_rel_employee ON public.employee_relationships(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_rel_related ON public.employee_relationships(related_employee_id);

-- onboarding templates + template tasks
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  role_target TEXT NOT NULL,           -- 'rbt','bcba','clinic_staff','case_manager','admin','payroll_finance','hr_recruiting','leadership','custom'
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,              -- 'hr','payroll','recruiting','manager','it','training','clinic'
  title TEXT NOT NULL,
  description TEXT,
  default_owner_role TEXT,             -- 'hr_admin','payroll_admin','recruiting_assistant', etc.
  due_offset_days INTEGER DEFAULT 7,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onb_tt_template ON public.onboarding_template_tasks(template_id);

-- per-employee onboarding workflow + tasks
CREATE TABLE IF NOT EXISTS public.employee_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  status public.hr_onboarding_status NOT NULL DEFAULT 'new_hire_pending',
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blockers TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_onb_employee ON public.employee_onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_onb_status ON public.employee_onboarding(status);

CREATE TABLE IF NOT EXISTS public.employee_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES public.employee_onboarding(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_role TEXT,
  owner_user_id UUID,
  due_date DATE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_onb_tasks_onb ON public.employee_onboarding_tasks(onboarding_id);

-- employee documents
CREATE TABLE IF NOT EXISTS public.employee_documents_hr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,              -- 'offer_letter','tax_form','direct_deposit','handbook_ack','license','background_check','i9','certification','review_form','disciplinary','other'
  name TEXT NOT NULL,
  status public.hr_doc_status NOT NULL DEFAULT 'requested',
  storage_path TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  expires_on DATE,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_docs_employee ON public.employee_documents_hr(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_docs_status ON public.employee_documents_hr(status);

-- notes
CREATE TABLE IF NOT EXISTS public.employee_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  visibility public.hr_note_visibility NOT NULL DEFAULT 'hr_only',
  author_id UUID,
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_notes_employee ON public.employee_notes(employee_id);

-- timeline
CREATE TABLE IF NOT EXISTS public.employee_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,            -- 'created','onboarding_advanced','document_uploaded','review_completed','training_completed','bonus_approved','status_changed','note','case_opened','case_closed','clock_exception'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_tl_employee ON public.employee_timeline(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_tl_created ON public.employee_timeline(created_at DESC);

-- cases
CREATE TABLE IF NOT EXISTS public.employee_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  case_type public.hr_case_type NOT NULL,
  status public.hr_case_status NOT NULL DEFAULT 'new',
  priority public.hr_case_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  summary TEXT,
  owner_user_id UUID,
  owner_role TEXT,
  due_date DATE,
  resolution TEXT,
  opened_by UUID,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_cases_employee ON public.employee_cases(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_cases_status ON public.employee_cases(status);

-- hr audit log
CREATE TABLE IF NOT EXISTS public.hr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_name TEXT,
  entity_type TEXT NOT NULL,           -- 'employee','onboarding','case','document','note'
  entity_id UUID,
  action TEXT NOT NULL,                -- 'created','updated','status_changed','deleted','viewed_payroll'
  diff JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_audit_entity ON public.hr_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hr_audit_created ON public.hr_audit_logs(created_at DESC);


-- 4. UPDATED_AT TRIGGERS -----------------------------------------------------
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_emp_onb_updated_at
  BEFORE UPDATE ON public.employee_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_emp_onb_tasks_updated_at
  BEFORE UPDATE ON public.employee_onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_emp_cases_updated_at
  BEFORE UPDATE ON public.employee_cases
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- 5. ENABLE RLS --------------------------------------------------------------
ALTER TABLE public.hr_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents_hr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_audit_logs ENABLE ROW LEVEL SECURITY;


-- 6. RLS POLICIES (gated by hr.* permission keys) ---------------------------

-- departments: any HR-permitted user can view, settings.manage to write
CREATE POLICY "View hr_departments" ON public.hr_departments FOR SELECT USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage hr_departments" ON public.hr_departments FOR ALL USING (public.has_permission(auth.uid(), 'hr.settings.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.settings.manage'));

-- employees
CREATE POLICY "View employees" ON public.employees FOR SELECT USING (public.has_permission(auth.uid(), 'hr.employees.view'));
CREATE POLICY "Create employees" ON public.employees FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'hr.employees.create'));
CREATE POLICY "Update employees" ON public.employees FOR UPDATE USING (public.has_permission(auth.uid(), 'hr.employees.edit'));
CREATE POLICY "Delete employees" ON public.employees FOR DELETE USING (public.has_permission(auth.uid(), 'hr.employees.delete'));

-- relationships
CREATE POLICY "View emp relationships" ON public.employee_relationships FOR SELECT USING (public.has_permission(auth.uid(), 'hr.employees.view'));
CREATE POLICY "Manage emp relationships" ON public.employee_relationships FOR ALL USING (public.has_permission(auth.uid(), 'hr.employees.edit')) WITH CHECK (public.has_permission(auth.uid(), 'hr.employees.edit'));

-- onboarding templates
CREATE POLICY "View onb templates" ON public.onboarding_templates FOR SELECT USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage onb templates" ON public.onboarding_templates FOR ALL USING (public.has_permission(auth.uid(), 'hr.onboarding.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.onboarding.manage'));
CREATE POLICY "View onb template tasks" ON public.onboarding_template_tasks FOR SELECT USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage onb template tasks" ON public.onboarding_template_tasks FOR ALL USING (public.has_permission(auth.uid(), 'hr.onboarding.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.onboarding.manage'));

-- per-employee onboarding
CREATE POLICY "View emp onboarding" ON public.employee_onboarding FOR SELECT USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage emp onboarding" ON public.employee_onboarding FOR ALL USING (public.has_permission(auth.uid(), 'hr.onboarding.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.onboarding.manage'));
CREATE POLICY "View emp onboarding tasks" ON public.employee_onboarding_tasks FOR SELECT USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage emp onboarding tasks" ON public.employee_onboarding_tasks FOR ALL USING (public.has_permission(auth.uid(), 'hr.onboarding.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.onboarding.manage'));

-- documents
CREATE POLICY "View emp docs" ON public.employee_documents_hr FOR SELECT USING (public.has_permission(auth.uid(), 'hr.documents.view'));
CREATE POLICY "Manage emp docs" ON public.employee_documents_hr FOR ALL USING (public.has_permission(auth.uid(), 'hr.documents.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.documents.manage'));

-- notes (HR-only by default; visibility is enforced in app layer too)
CREATE POLICY "View emp notes" ON public.employee_notes FOR SELECT USING (public.has_permission(auth.uid(), 'hr.notes.view'));
CREATE POLICY "Manage emp notes" ON public.employee_notes FOR ALL USING (public.has_permission(auth.uid(), 'hr.notes.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.notes.manage'));

-- timeline (any HR viewer)
CREATE POLICY "View emp timeline" ON public.employee_timeline FOR SELECT USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Insert emp timeline" ON public.employee_timeline FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'hr.view'));

-- cases
CREATE POLICY "View emp cases" ON public.employee_cases FOR SELECT USING (public.has_permission(auth.uid(), 'hr.cases.view'));
CREATE POLICY "Manage emp cases" ON public.employee_cases FOR ALL USING (public.has_permission(auth.uid(), 'hr.cases.manage')) WITH CHECK (public.has_permission(auth.uid(), 'hr.cases.manage'));

-- hr audit logs (HR Admin only)
CREATE POLICY "View hr audit" ON public.hr_audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'hr_admin'::app_role));
CREATE POLICY "Insert hr audit" ON public.hr_audit_logs FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'hr.view'));


-- 7. EMPLOYEE STATUS GUARD ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_employee_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('terminated','resigned') THEN
      IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_admin') OR public.has_role(auth.uid(),'ops_manager')) THEN
        RAISE EXCEPTION 'Only HR Admin, Ops Manager, or Systems Admin can terminate or close out an employee.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employees_status_guard
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_status_change();


-- 8. HR PERMISSION CATALOG ---------------------------------------------------
INSERT INTO public.permissions (key, module, label, description) VALUES
  ('hr.view',                  'HR Suite', 'View HR Suite',                'Access the HR Suite at all'),
  ('hr.employees.view',        'HR Suite', 'View employees',               'See the employee directory and profiles'),
  ('hr.employees.create',      'HR Suite', 'Create employees',             'Add new employees to the directory'),
  ('hr.employees.edit',        'HR Suite', 'Edit employees',               'Edit employee profiles and relationships'),
  ('hr.employees.delete',      'HR Suite', 'Delete employees',             'Remove employees from the system'),
  ('hr.onboarding.manage',     'HR Suite', 'Manage onboarding',            'Run onboarding workflows and edit templates'),
  ('hr.documents.view',        'HR Suite', 'View employee documents',      'See employee document records'),
  ('hr.documents.manage',      'HR Suite', 'Manage employee documents',    'Upload, verify, and manage employee documents'),
  ('hr.notes.view',            'HR Suite', 'View HR-only notes',           'Read internal HR notes on employees'),
  ('hr.notes.manage',          'HR Suite', 'Write HR-only notes',          'Add and edit internal HR notes'),
  ('hr.payroll.view',          'HR Suite', 'View payroll fields',          'See pay rate, Viventium status, payroll workflows'),
  ('hr.payroll.edit',          'HR Suite', 'Edit payroll fields',          'Change payroll-related employee data'),
  ('hr.cases.view',            'HR Suite', 'View HR cases',                'See employee requests and cases'),
  ('hr.cases.manage',          'HR Suite', 'Manage HR cases',              'Create, assign, and resolve HR cases'),
  ('hr.training.view',         'HR Suite', 'View training records',        'See assigned and completed training'),
  ('hr.training.manage',       'HR Suite', 'Manage training',              'Assign, edit, and verify training'),
  ('hr.reviews.view',          'HR Suite', 'View reviews',                 'See review records and ratings'),
  ('hr.reviews.manage',        'HR Suite', 'Manage reviews',               'Create and complete employee reviews'),
  ('hr.bonuses.view',          'HR Suite', 'View bonuses',                 'See bonus records and approvals'),
  ('hr.bonuses.manage',        'HR Suite', 'Manage bonuses',               'Approve and process bonus payouts'),
  ('hr.timeclock.view',        'HR Suite', 'View time clock data',         'See clock-in records and exceptions'),
  ('hr.timeclock.approve',     'HR Suite', 'Approve time clock entries',   'Approve manual edits and exceptions'),
  ('hr.kiosk.use',             'HR Suite', 'Use clinic kiosk',             'Access the clock-in kiosk on a clinic device'),
  ('hr.reports.view',          'HR Suite', 'View HR reports',              'Access HR analytics and reports'),
  ('hr.settings.manage',       'HR Suite', 'Manage HR settings',           'Edit HR templates, departments, workflows')
ON CONFLICT (key) DO NOTHING;


-- 9. ROLE -> PERMISSION GRANTS ----------------------------------------------

-- HR Admin: everything in HR
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'hr_admin'::public.app_role, key FROM public.permissions WHERE module = 'HR Suite'
ON CONFLICT DO NOTHING;

-- HR Manager: everything except settings + audit-restricted views (gets all hr.* except settings.manage and bonuses.manage)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('hr_manager','hr.view'),
  ('hr_manager','hr.employees.view'),
  ('hr_manager','hr.employees.create'),
  ('hr_manager','hr.employees.edit'),
  ('hr_manager','hr.onboarding.manage'),
  ('hr_manager','hr.documents.view'),
  ('hr_manager','hr.documents.manage'),
  ('hr_manager','hr.notes.view'),
  ('hr_manager','hr.notes.manage'),
  ('hr_manager','hr.cases.view'),
  ('hr_manager','hr.cases.manage'),
  ('hr_manager','hr.training.view'),
  ('hr_manager','hr.training.manage'),
  ('hr_manager','hr.reviews.view'),
  ('hr_manager','hr.reviews.manage'),
  ('hr_manager','hr.bonuses.view'),
  ('hr_manager','hr.timeclock.view'),
  ('hr_manager','hr.timeclock.approve'),
  ('hr_manager','hr.reports.view')
ON CONFLICT DO NOTHING;

-- Recruiting Assistant: onboarding + employee create + view
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('recruiting_assistant','hr.view'),
  ('recruiting_assistant','hr.employees.view'),
  ('recruiting_assistant','hr.employees.create'),
  ('recruiting_assistant','hr.employees.edit'),
  ('recruiting_assistant','hr.onboarding.manage'),
  ('recruiting_assistant','hr.documents.view'),
  ('recruiting_assistant','hr.documents.manage'),
  ('recruiting_assistant','hr.training.view'),
  ('recruiting_assistant','hr.training.manage')
ON CONFLICT DO NOTHING;

-- Payroll Admin: payroll + bonuses + timeclock approval
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('payroll_admin','hr.view'),
  ('payroll_admin','hr.employees.view'),
  ('payroll_admin','hr.payroll.view'),
  ('payroll_admin','hr.payroll.edit'),
  ('payroll_admin','hr.bonuses.view'),
  ('payroll_admin','hr.bonuses.manage'),
  ('payroll_admin','hr.timeclock.view'),
  ('payroll_admin','hr.timeclock.approve'),
  ('payroll_admin','hr.documents.view'),
  ('payroll_admin','hr.cases.view'),
  ('payroll_admin','hr.cases.manage'),
  ('payroll_admin','hr.reports.view')
ON CONFLICT DO NOTHING;

-- State Director / Clinic Director / Dept Manager: scoped view (employees + reviews + cases view, no payroll, no notes)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('state_director','hr.view'),
  ('state_director','hr.employees.view'),
  ('state_director','hr.training.view'),
  ('state_director','hr.reviews.view'),
  ('state_director','hr.cases.view'),
  ('state_director','hr.timeclock.view'),
  ('state_director','hr.reports.view'),
  ('clinic_director','hr.view'),
  ('clinic_director','hr.employees.view'),
  ('clinic_director','hr.training.view'),
  ('clinic_director','hr.reviews.view'),
  ('clinic_director','hr.cases.view'),
  ('clinic_director','hr.timeclock.view'),
  ('dept_manager','hr.view'),
  ('dept_manager','hr.employees.view'),
  ('dept_manager','hr.training.view'),
  ('dept_manager','hr.reviews.view'),
  ('dept_manager','hr.cases.view')
ON CONFLICT DO NOTHING;

-- Existing 'exec' and 'ops_manager' get HR view
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('exec','hr.view'),
  ('exec','hr.employees.view'),
  ('exec','hr.reports.view'),
  ('exec','hr.training.view'),
  ('exec','hr.reviews.view'),
  ('exec','hr.cases.view'),
  ('ops_manager','hr.view'),
  ('ops_manager','hr.employees.view'),
  ('ops_manager','hr.employees.edit'),
  ('ops_manager','hr.onboarding.manage'),
  ('ops_manager','hr.cases.view'),
  ('ops_manager','hr.cases.manage'),
  ('ops_manager','hr.timeclock.view'),
  ('ops_manager','hr.timeclock.approve'),
  ('ops_manager','hr.reports.view')
ON CONFLICT DO NOTHING;

-- Existing 'hr' role (legacy) gets HR Admin equivalent
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'hr'::public.app_role, key FROM public.permissions WHERE module = 'HR Suite'
ON CONFLICT DO NOTHING;

-- Existing 'finance' gets payroll view
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('finance','hr.view'),
  ('finance','hr.employees.view'),
  ('finance','hr.payroll.view'),
  ('finance','hr.bonuses.view'),
  ('finance','hr.reports.view')
ON CONFLICT DO NOTHING;


-- 10. SEED — DEPARTMENTS -----------------------------------------------------
INSERT INTO public.hr_departments (name, category, description) VALUES
  ('HR / Recruiting',         'People',     'People operations, recruiting, employee experience'),
  ('Payroll / Finance',       'Finance',    'Payroll processing, finance, accounting'),
  ('Operations',              'Leadership', 'Cross-functional operations management'),
  ('Intake',                  'Pipeline',   'Lead intake and conversion'),
  ('Authorizations',          'Pipeline',   'Insurance authorizations'),
  ('Scheduling',              'Operations', 'Assessment and session scheduling'),
  ('QA / Compliance',         'Clinical',   'Quality assurance and clinical compliance'),
  ('Clinic Operations',       'Clinical',   'Clinic-based service delivery'),
  ('State Leadership',        'Leadership', 'State-level leadership'),
  ('Training / Clinical Support','Clinical', 'Training programs and clinical support'),
  ('Staffing',                'Operations', 'RBT staffing and matching'),
  ('Phone / Support',         'Support',    'Phone handling and support'),
  ('Executive',               'Leadership', 'Executive leadership')
ON CONFLICT (name) DO NOTHING;


-- 11. SEED — ONBOARDING TEMPLATES + TASKS -----------------------------------
INSERT INTO public.onboarding_templates (name, role_target, description) VALUES
  ('RBT Onboarding',                'rbt',              'Standard onboarding for new RBTs'),
  ('BCBA Onboarding',               'bcba',             'Onboarding for BCBAs and clinical leads'),
  ('Clinic Staff Onboarding',       'clinic_staff',     'Front-desk and clinic admin staff'),
  ('Case Manager Onboarding',       'case_manager',     'Case manager / coordinator onboarding'),
  ('Admin Staff Onboarding',        'admin',            'General admin staff onboarding'),
  ('Payroll / Finance Onboarding',  'payroll_finance',  'Payroll and finance team onboarding'),
  ('HR / Recruiting Onboarding',    'hr_recruiting',    'HR and recruiting team onboarding'),
  ('Leadership Onboarding',         'leadership',       'Leadership and director onboarding'),
  ('Custom Template',               'custom',           'Blank template for one-off hires')
ON CONFLICT (name) DO NOTHING;

-- task seed for RBT template
WITH t AS (SELECT id FROM public.onboarding_templates WHERE name = 'RBT Onboarding')
INSERT INTO public.onboarding_template_tasks (template_id, position, category, title, default_owner_role, due_offset_days, is_required) VALUES
  ((SELECT id FROM t), 1,  'hr',       'Send offer letter',                            'hr_admin',             0, true),
  ((SELECT id FROM t), 2,  'hr',       'Collect signed offer + handbook acknowledgment','hr_admin',            3, true),
  ((SELECT id FROM t), 3,  'payroll',  'Collect W-4 and state tax forms',              'payroll_admin',        3, true),
  ((SELECT id FROM t), 4,  'payroll',  'Set up direct deposit',                        'payroll_admin',        5, true),
  ((SELECT id FROM t), 5,  'payroll',  'Create Viventium employee record',             'payroll_admin',        5, true),
  ((SELECT id FROM t), 6,  'hr',       'Run background check',                         'hr_admin',             5, true),
  ((SELECT id FROM t), 7,  'training', 'Assign RBT 40-hour training',                  'recruiting_assistant', 7, true),
  ((SELECT id FROM t), 8,  'training', 'Verify RBT certification on file',             'hr_admin',            14, true),
  ((SELECT id FROM t), 9,  'manager',  'Assign supervising BCBA',                      'ops_manager',          7, true),
  ((SELECT id FROM t), 10, 'clinic',   'Assign primary clinic location',               'clinic_director',      7, true),
  ((SELECT id FROM t), 11, 'it',       'Provision Blossom OS account',                 'admin',                7, true),
  ((SELECT id FROM t), 12, 'it',       'Set up clinic kiosk PIN',                      'hr_admin',             7, true),
  ((SELECT id FROM t), 13, 'training', 'Schedule shadow shifts',                       'clinic_director',     10, true),
  ((SELECT id FROM t), 14, 'hr',       'Confirm first-day readiness',                  'hr_admin',            10, true)
ON CONFLICT DO NOTHING;

-- task seed for BCBA template
WITH t AS (SELECT id FROM public.onboarding_templates WHERE name = 'BCBA Onboarding')
INSERT INTO public.onboarding_template_tasks (template_id, position, category, title, default_owner_role, due_offset_days, is_required) VALUES
  ((SELECT id FROM t), 1, 'hr',       'Send offer letter',                'hr_admin',       0, true),
  ((SELECT id FROM t), 2, 'hr',       'Collect signed offer',             'hr_admin',       3, true),
  ((SELECT id FROM t), 3, 'hr',       'Verify BCBA certification + BACB ID','hr_admin',     5, true),
  ((SELECT id FROM t), 4, 'hr',       'Verify state license',             'hr_admin',       5, true),
  ((SELECT id FROM t), 5, 'payroll',  'Salary setup in Viventium',        'payroll_admin',  5, true),
  ((SELECT id FROM t), 6, 'manager',  'Assign clinic + region',           'ops_manager',    7, true),
  ((SELECT id FROM t), 7, 'training', 'Treatment plan training',          'hr_manager',    14, true),
  ((SELECT id FROM t), 8, 'it',       'Provision Blossom OS account + CR','admin',         7, true),
  ((SELECT id FROM t), 9, 'hr',       'Schedule 30-day check-in',         'hr_admin',      30, true)
ON CONFLICT DO NOTHING;

-- minimal task seed for the rest
WITH t AS (SELECT id FROM public.onboarding_templates WHERE name = 'Clinic Staff Onboarding')
INSERT INTO public.onboarding_template_tasks (template_id, position, category, title, default_owner_role, due_offset_days, is_required) VALUES
  ((SELECT id FROM t), 1, 'hr',      'Offer + handbook',          'hr_admin',         3, true),
  ((SELECT id FROM t), 2, 'payroll', 'Tax forms + direct deposit','payroll_admin',    5, true),
  ((SELECT id FROM t), 3, 'clinic',  'Assign clinic + kiosk PIN','clinic_director',   7, true),
  ((SELECT id FROM t), 4, 'training','Clinic operations training','clinic_director',  7, true),
  ((SELECT id FROM t), 5, 'it',      'Provision Blossom OS access','admin',           7, true)
ON CONFLICT DO NOTHING;


-- 12. SEED — SAMPLE EMPLOYEES -----------------------------------------------
INSERT INTO public.employees (first_name, last_name, email, job_title, department_id, state, clinic, employment_type, pay_type, work_setting, status, hire_date, start_date, employee_code, kiosk_enabled) VALUES
  ('Nikki',    'Goldenberg',  'nikki@blossomabatherapy.com',     'HR Director',           (SELECT id FROM public.hr_departments WHERE name='HR / Recruiting'),     'GA','Atlanta',     'full_time','salaried','admin', 'active', '2022-04-01','2022-04-04','EMP-0001', false),
  ('Devorah',  'Klein',       'devorah@blossomabatherapy.com',   'Authorizations Manager',(SELECT id FROM public.hr_departments WHERE name='Authorizations'),       'GA','Atlanta',     'full_time','salaried','hybrid','active', '2022-08-15','2022-08-22','EMP-0002', false),
  ('Baila',    'Stein',       'baila@blossomabatherapy.com',     'Payroll Specialist',    (SELECT id FROM public.hr_departments WHERE name='Payroll / Finance'),    'GA','Atlanta',     'full_time','salaried','hybrid','active', '2023-01-10','2023-01-16','EMP-0003', false),
  ('Daylis',   'Marin',       'daylis@blossomabatherapy.com',    'Scheduler',             (SELECT id FROM public.hr_departments WHERE name='Scheduling'),           'GA','Atlanta',     'full_time','hourly',  'admin', 'active', '2023-03-20','2023-03-27','EMP-0004', false),
  ('Gabi',     'Reyes',       'gabi@blossomabatherapy.com',      'Intake Coordinator',    (SELECT id FROM public.hr_departments WHERE name='Intake'),               'GA','Atlanta',     'full_time','hourly',  'admin', 'active', '2023-06-12','2023-06-19','EMP-0005', false),
  ('Marcus',   'Bell',        'marcus.bell@blossomabatherapy.com','Lead RBT',             (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'GA','Marietta',    'full_time','hourly',  'clinic','active', '2023-09-05','2023-09-11','EMP-0006', true),
  ('Jasmine',  'Carter',      'jasmine.c@blossomabatherapy.com', 'RBT',                   (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'GA','Marietta',    'part_time','hourly',  'clinic','active', '2024-02-14','2024-02-19','EMP-0007', true),
  ('Aaron',    'Patel',       'aaron.p@blossomabatherapy.com',   'BCBA',                  (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'GA','Roswell',     'full_time','salaried','hybrid','active', '2023-05-01','2023-05-08','EMP-0008', false),
  ('Lila',     'Nguyen',      'lila.n@blossomabatherapy.com',    'BCBA',                  (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'NC','Charlotte',   'full_time','salaried','hybrid','active', '2023-07-10','2023-07-17','EMP-0009', false),
  ('Tariq',    'Adams',       'tariq.a@blossomabatherapy.com',   'RBT',                   (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'NC','Charlotte',   'full_time','hourly',  'clinic','active', '2024-01-08','2024-01-15','EMP-0010', true),
  ('Sophie',   'Owens',       'sophie.o@blossomabatherapy.com',  'Clinic Admin',          (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'TN','Nashville',   'full_time','hourly',  'clinic','active', '2023-11-06','2023-11-13','EMP-0011', true),
  ('Malik',    'Johnson',     'malik.j@blossomabatherapy.com',   'BCBA',                  (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'TN','Nashville',   'full_time','salaried','hybrid','active', '2024-03-04','2024-03-11','EMP-0012', false),
  ('Hannah',   'Cohen',       'hannah.c@blossomabatherapy.com',  'QA Specialist',         (SELECT id FROM public.hr_departments WHERE name='QA / Compliance'),      'VA','Richmond',    'full_time','salaried','home',  'active', '2023-08-21','2023-08-28','EMP-0013', false),
  ('Eli',      'Rosen',       'eli.r@blossomabatherapy.com',     'State Director',        (SELECT id FROM public.hr_departments WHERE name='State Leadership'),     'VA','Richmond',    'full_time','salaried','hybrid','active', '2022-11-14','2022-11-21','EMP-0014', false),
  ('Maya',     'Brooks',      'maya.b@blossomabatherapy.com',    'RBT',                   (SELECT id FROM public.hr_departments WHERE name='Clinic Operations'),    'MD','Baltimore',   'part_time','hourly',  'clinic','pending_start', '2026-04-10','2026-05-01','EMP-0015', true)
ON CONFLICT (employee_code) DO NOTHING;
