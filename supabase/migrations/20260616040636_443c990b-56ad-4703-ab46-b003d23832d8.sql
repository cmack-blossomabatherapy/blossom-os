
-- ============================================================
-- Department Management
-- ============================================================

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  head_user_id uuid,            -- references auth.users (no FK by policy)
  backup_user_id uuid,
  primary_queue_path text,      -- e.g. "/intake"
  workspace_id text,            -- maps to WORKSPACES[].id in code
  escalation_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All signed-in users can read departments"
  ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

-- Team members
CREATE TABLE public.department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',  -- member | lead | backup
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_members TO authenticated;
GRANT ALL ON public.department_members TO service_role;
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read department members"
  ON public.department_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage department members"
  ON public.department_members FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

-- KPIs
CREATE TABLE public.department_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  label text NOT NULL,
  target_value text,
  current_value text,
  unit text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_kpis TO authenticated;
GRANT ALL ON public.department_kpis TO service_role;
ALTER TABLE public.department_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read department kpis"
  ON public.department_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage department kpis"
  ON public.department_kpis FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

-- Reports / Resources / Training links
CREATE TABLE public.department_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  kind text NOT NULL,           -- 'report' | 'resource' | 'training'
  label text NOT NULL,
  path text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_resources TO authenticated;
GRANT ALL ON public.department_resources TO service_role;
ALTER TABLE public.department_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read department resources"
  ON public.department_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage department resources"
  ON public.department_resources FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_departments_touch BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_department_kpis_touch BEFORE UPDATE ON public.department_kpis
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Seed the 16 Blossom OS departments (owners left NULL — editable).
-- ============================================================
INSERT INTO public.departments (slug, name, sort_order, primary_queue_path, workspace_id, description) VALUES
  ('executive-leadership',  'Executive Leadership',           10, '/ws/executive',            'executive',             'Company-wide visibility, growth, and strategy.'),
  ('coo-office',            'COO / Operating Office',         20, '/coo',                     'coo',                   'Operating system design, governance, and Blossom OS rollout.'),
  ('operations',            'Operations',                     30, '/operations/command-center','operations',           'Cadence, blockers, KPI exceptions, and escalations.'),
  ('marketing-growth',      'Marketing & Growth',             40, '/marketing',               'marketing',             'Campaigns, lead sources, attribution, and reputation.'),
  ('intake-admissions',     'Intake & Admissions',            50, '/intake',                  'intake',                'Leads, family follow-up, and VOB readiness.'),
  ('finance-benefits',      'Finance / Benefits',             60, '/ws/finance',              'finance',               'VOB review, case approvals, and payment plans.'),
  ('authorizations',        'Authorizations',                 70, '/authorizations',          'authorizations',        'Auth pipeline, utilization, and reauth cycles.'),
  ('clinical-qa-compliance','Clinical QA & Compliance',       80, '/qa',                      'qa',                    'Treatment plans, progress reports, and compliance reviews.'),
  ('scheduling-staffing',   'Scheduling & Staffing',          90, '/scheduling',              'scheduling',            'Coverage, pending starts, and uncovered hours.'),
  ('recruiting-talent',     'Recruiting & Talent Acquisition',100,'/recruiting/workspace',    'recruiting',            'Candidates, interviews, offers, and orientation.'),
  ('people-ops-hr',         'People Operations / HR',         110,'/hr-team',                 'hr',                    'People, onboarding, evaluations, and compliance.'),
  ('payroll-finance-ops',   'Payroll & Finance Operations',   120,'/payroll/workspace',       'payroll',               'Payroll runs, hours, adjustments, and Viventium readiness.'),
  ('billing-rcm',           'Billing / Credentialing / RCM',  130,'/billing-finance',         'billing-credentialing', 'Claims, payors, credentialing, and revenue cycle.'),
  ('clinical-care-team',    'Clinical Care Team',             140,'/bcba',                    'bcba',                  'BCBAs and RBTs delivering care to clients.'),
  ('state-operations',      'State Operations',               150,'/state-director',          'state-command',         'State-level visibility, pipeline, and local relationships.'),
  ('systems-os-admin',      'Systems / Blossom OS Admin',     160,'/admin',                   'admin',                 'Permissions, integrations, automations, and data health.');
