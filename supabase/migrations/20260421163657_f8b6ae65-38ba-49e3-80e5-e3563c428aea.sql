-- =========================================================================
-- 1. permissions catalog
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  key text PRIMARY KEY,
  module text NOT NULL,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view permissions" ON public.permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage permissions catalog" ON public.permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 2. role_permissions matrix
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_key)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view role_permissions" ON public.role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage role_permissions" ON public.role_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 3. stage_ownership
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.stage_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_kind text NOT NULL CHECK (stage_kind IN ('lead', 'client')),
  stage_value text NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_kind, stage_value, role)
);
CREATE INDEX IF NOT EXISTS idx_stage_ownership_lookup ON public.stage_ownership(stage_kind, stage_value);
ALTER TABLE public.stage_ownership ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view stage_ownership" ON public.stage_ownership FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage stage_ownership" ON public.stage_ownership FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 4. Helper functions
-- =========================================================================
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role = ur.role
      WHERE ur.user_id = _user_id
        AND rp.permission_key = _perm
    );
$$;

CREATE OR REPLACE FUNCTION public.owns_stage(_user_id uuid, _stage_kind text, _stage_value text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'exec')
    OR public.has_role(_user_id, 'ops_manager')
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.stage_ownership so ON so.role = ur.role
      WHERE ur.user_id = _user_id
        AND so.stage_kind = _stage_kind
        AND so.stage_value = _stage_value
    );
$$;

-- =========================================================================
-- 5. Stage transition trigger on clients
-- =========================================================================
CREATE OR REPLACE FUNCTION public.enforce_client_stage_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    IF NOT public.owns_stage(auth.uid(), 'client', NEW.stage::text) THEN
      RAISE EXCEPTION 'Your role does not own the % stage. Ask an admin or operations manager to make this change.', NEW.stage
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_enforce_stage_ownership ON public.clients;
CREATE TRIGGER clients_enforce_stage_ownership
  BEFORE UPDATE OF stage ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_client_stage_ownership();

-- =========================================================================
-- 6. Rewrite RLS to use permission keys
-- =========================================================================
-- clients
DROP POLICY IF EXISTS "Editors create clients" ON public.clients;
DROP POLICY IF EXISTS "Editors update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins delete clients" ON public.clients;
DROP POLICY IF EXISTS "Signed-in users view clients" ON public.clients;

CREATE POLICY "View clients with permission" ON public.clients FOR SELECT
  USING (public.has_permission(auth.uid(), 'clients.view'));
CREATE POLICY "Create clients with permission" ON public.clients FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'clients.create'));
CREATE POLICY "Update clients with permission" ON public.clients FOR UPDATE
  USING (public.has_permission(auth.uid(), 'clients.edit'));
CREATE POLICY "Delete clients with permission" ON public.clients FOR DELETE
  USING (public.has_permission(auth.uid(), 'clients.delete'));

-- client_authorizations
DROP POLICY IF EXISTS "Editors insert auths" ON public.client_authorizations;
DROP POLICY IF EXISTS "Editors update auths" ON public.client_authorizations;
DROP POLICY IF EXISTS "Editors delete auths" ON public.client_authorizations;
DROP POLICY IF EXISTS "Signed-in view auths" ON public.client_authorizations;

CREATE POLICY "View auths with permission" ON public.client_authorizations FOR SELECT
  USING (public.has_permission(auth.uid(), 'auth.view'));
CREATE POLICY "Insert auths with permission" ON public.client_authorizations FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'auth.edit'));
CREATE POLICY "Update auths with permission" ON public.client_authorizations FOR UPDATE
  USING (public.has_permission(auth.uid(), 'auth.edit'));
CREATE POLICY "Delete auths with permission" ON public.client_authorizations FOR DELETE
  USING (public.has_permission(auth.uid(), 'auth.delete'));

-- client_documents
DROP POLICY IF EXISTS "Editors insert documents" ON public.client_documents;
DROP POLICY IF EXISTS "Editors update documents" ON public.client_documents;
DROP POLICY IF EXISTS "Editors delete documents" ON public.client_documents;
DROP POLICY IF EXISTS "Signed-in view documents" ON public.client_documents;

CREATE POLICY "View documents with permission" ON public.client_documents FOR SELECT
  USING (public.has_permission(auth.uid(), 'documents.view'));
CREATE POLICY "Insert documents with permission" ON public.client_documents FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'documents.edit'));
CREATE POLICY "Update documents with permission" ON public.client_documents FOR UPDATE
  USING (public.has_permission(auth.uid(), 'documents.edit'));
CREATE POLICY "Delete documents with permission" ON public.client_documents FOR DELETE
  USING (public.has_permission(auth.uid(), 'documents.delete'));

-- client_tasks
DROP POLICY IF EXISTS "Editors insert tasks" ON public.client_tasks;
DROP POLICY IF EXISTS "Editors update tasks" ON public.client_tasks;
DROP POLICY IF EXISTS "Editors delete tasks" ON public.client_tasks;
DROP POLICY IF EXISTS "Signed-in view tasks" ON public.client_tasks;

CREATE POLICY "View tasks with permission" ON public.client_tasks FOR SELECT
  USING (public.has_permission(auth.uid(), 'tasks.view'));
CREATE POLICY "Insert tasks with permission" ON public.client_tasks FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'tasks.edit'));
CREATE POLICY "Update tasks with permission" ON public.client_tasks FOR UPDATE
  USING (public.has_permission(auth.uid(), 'tasks.edit'));
CREATE POLICY "Delete tasks with permission" ON public.client_tasks FOR DELETE
  USING (public.has_permission(auth.uid(), 'tasks.delete'));

-- client_schedule_slots
DROP POLICY IF EXISTS "Editors insert schedule" ON public.client_schedule_slots;
DROP POLICY IF EXISTS "Editors update schedule" ON public.client_schedule_slots;
DROP POLICY IF EXISTS "Editors delete schedule" ON public.client_schedule_slots;
DROP POLICY IF EXISTS "Signed-in view schedule" ON public.client_schedule_slots;

CREATE POLICY "View schedule with permission" ON public.client_schedule_slots FOR SELECT
  USING (public.has_permission(auth.uid(), 'scheduling.view'));
CREATE POLICY "Insert schedule with permission" ON public.client_schedule_slots FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'scheduling.edit'));
CREATE POLICY "Update schedule with permission" ON public.client_schedule_slots FOR UPDATE
  USING (public.has_permission(auth.uid(), 'scheduling.edit'));
CREATE POLICY "Delete schedule with permission" ON public.client_schedule_slots FOR DELETE
  USING (public.has_permission(auth.uid(), 'scheduling.delete'));

-- client_timeline
DROP POLICY IF EXISTS "Editors insert timeline" ON public.client_timeline;
DROP POLICY IF EXISTS "Admins delete timeline" ON public.client_timeline;
DROP POLICY IF EXISTS "Signed-in view timeline" ON public.client_timeline;

CREATE POLICY "View timeline with permission" ON public.client_timeline FOR SELECT
  USING (public.has_permission(auth.uid(), 'clients.view'));
CREATE POLICY "Insert timeline with permission" ON public.client_timeline FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'clients.edit'));
CREATE POLICY "Delete timeline as admin" ON public.client_timeline FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 7. Seed permissions catalog
-- =========================================================================
INSERT INTO public.permissions (key, module, label, description) VALUES
  -- Dashboard
  ('dashboard.view', 'Dashboard', 'View dashboard', 'See main operational dashboard'),
  -- Leads
  ('leads.view', 'Leads', 'View leads', NULL),
  ('leads.create', 'Leads', 'Create leads', NULL),
  ('leads.edit', 'Leads', 'Edit leads', NULL),
  ('leads.delete', 'Leads', 'Delete leads', NULL),
  -- Clients
  ('clients.view', 'Clients', 'View clients', NULL),
  ('clients.create', 'Clients', 'Create clients', NULL),
  ('clients.edit', 'Clients', 'Edit clients', NULL),
  ('clients.delete', 'Clients', 'Delete clients', NULL),
  ('clients.financial', 'Clients', 'View financial fields', 'See payor, billing, payment plan info'),
  -- Authorizations
  ('auth.view', 'Authorizations', 'View authorizations', NULL),
  ('auth.edit', 'Authorizations', 'Edit / submit authorizations', NULL),
  ('auth.delete', 'Authorizations', 'Delete authorizations', NULL),
  ('auth.billing', 'Authorizations', 'See billing & claims', 'Manager-only carve-out'),
  -- QA
  ('qa.view', 'QA', 'View QA queue', NULL),
  ('qa.edit', 'QA', 'Review / approve QA', NULL),
  -- Scheduling
  ('scheduling.view', 'Scheduling', 'View schedules', NULL),
  ('scheduling.edit', 'Scheduling', 'Edit schedules', NULL),
  ('scheduling.delete', 'Scheduling', 'Delete schedule slots', NULL),
  -- Staffing
  ('staffing.view', 'Staffing', 'View staffing engine', NULL),
  ('staffing.edit', 'Staffing', 'Assign / restaff', NULL),
  -- Recruiting
  ('recruiting.view', 'Recruiting', 'View recruiting pipeline', NULL),
  ('recruiting.edit', 'Recruiting', 'Manage candidates', NULL),
  -- Operations
  ('operations.view', 'Operations', 'View operations dashboard', NULL),
  ('operations.edit', 'Operations', 'Edit operational workflows', NULL),
  -- Clinics
  ('clinics.view', 'Clinics', 'View clinics', NULL),
  ('clinics.edit', 'Clinics', 'Edit clinic data', NULL),
  -- Phone Calls
  ('phone.view', 'Phone Calls', 'View call log', NULL),
  ('phone.edit', 'Phone Calls', 'Log / manage calls', NULL),
  -- Documents
  ('documents.view', 'Documents', 'View documents', NULL),
  ('documents.edit', 'Documents', 'Upload / edit documents', NULL),
  ('documents.delete', 'Documents', 'Delete documents', NULL),
  -- Tasks
  ('tasks.view', 'Tasks', 'View tasks', NULL),
  ('tasks.edit', 'Tasks', 'Create / complete tasks', NULL),
  ('tasks.delete', 'Tasks', 'Delete tasks', NULL),
  -- Reports
  ('reports.view', 'Reports', 'View reports', NULL),
  -- Automations
  ('automations.view', 'Automations', 'View automations', NULL),
  ('automations.edit', 'Automations', 'Manage automations', NULL),
  -- Team
  ('team.view', 'Team', 'View team directory', NULL),
  ('team.manage', 'Team', 'Invite / assign roles', NULL),
  ('team.hr', 'Team', 'HR data (reviews, onboarding)', NULL),
  -- Finance
  ('finance.view', 'Finance', 'View financial module', NULL),
  ('finance.edit', 'Finance', 'Edit financial data / payroll', NULL),
  -- Settings
  ('settings.view', 'Settings', 'View settings', NULL),
  ('settings.edit', 'Settings', 'Edit settings', NULL)
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- 8. Seed role_permissions matrix
-- =========================================================================
-- Helper inline: insert (role, perm_key) pairs
-- admin: handled implicitly by has_permission (always true), but seed for UI display
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::public.app_role, key FROM public.permissions
ON CONFLICT DO NOTHING;

-- exec: view everything
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('exec', 'dashboard.view'),
  ('exec', 'leads.view'),
  ('exec', 'clients.view'),
  ('exec', 'clients.financial'),
  ('exec', 'auth.view'),
  ('exec', 'auth.billing'),
  ('exec', 'qa.view'),
  ('exec', 'scheduling.view'),
  ('exec', 'staffing.view'),
  ('exec', 'recruiting.view'),
  ('exec', 'operations.view'),
  ('exec', 'clinics.view'),
  ('exec', 'phone.view'),
  ('exec', 'documents.view'),
  ('exec', 'tasks.view'),
  ('exec', 'reports.view'),
  ('exec', 'automations.view'),
  ('exec', 'team.view'),
  ('exec', 'finance.view'),
  ('exec', 'settings.view')
ON CONFLICT DO NOTHING;

-- ops_manager: full operational control
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('ops_manager', 'dashboard.view'),
  ('ops_manager', 'leads.view'),
  ('ops_manager', 'leads.create'),
  ('ops_manager', 'leads.edit'),
  ('ops_manager', 'leads.delete'),
  ('ops_manager', 'clients.view'),
  ('ops_manager', 'clients.create'),
  ('ops_manager', 'clients.edit'),
  ('ops_manager', 'clients.delete'),
  ('ops_manager', 'auth.view'),
  ('ops_manager', 'auth.edit'),
  ('ops_manager', 'qa.view'),
  ('ops_manager', 'qa.edit'),
  ('ops_manager', 'scheduling.view'),
  ('ops_manager', 'scheduling.edit'),
  ('ops_manager', 'scheduling.delete'),
  ('ops_manager', 'staffing.view'),
  ('ops_manager', 'staffing.edit'),
  ('ops_manager', 'operations.view'),
  ('ops_manager', 'operations.edit'),
  ('ops_manager', 'clinics.view'),
  ('ops_manager', 'phone.view'),
  ('ops_manager', 'phone.edit'),
  ('ops_manager', 'documents.view'),
  ('ops_manager', 'documents.edit'),
  ('ops_manager', 'tasks.view'),
  ('ops_manager', 'tasks.edit'),
  ('ops_manager', 'tasks.delete'),
  ('ops_manager', 'reports.view'),
  ('ops_manager', 'automations.view'),
  ('ops_manager', 'team.view')
ON CONFLICT DO NOTHING;

-- intake
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('intake', 'dashboard.view'),
  ('intake', 'leads.view'),
  ('intake', 'leads.create'),
  ('intake', 'leads.edit'),
  ('intake', 'clients.view'),
  ('intake', 'clients.create'),
  ('intake', 'clients.edit'),
  ('intake', 'documents.view'),
  ('intake', 'documents.edit'),
  ('intake', 'tasks.view'),
  ('intake', 'tasks.edit'),
  ('intake', 'phone.view'),
  ('intake', 'phone.edit')
ON CONFLICT DO NOTHING;

-- auth_team
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('auth_team', 'dashboard.view'),
  ('auth_team', 'clients.view'),
  ('auth_team', 'clients.edit'),
  ('auth_team', 'auth.view'),
  ('auth_team', 'auth.edit'),
  ('auth_team', 'documents.view'),
  ('auth_team', 'documents.edit'),
  ('auth_team', 'tasks.view'),
  ('auth_team', 'tasks.edit')
ON CONFLICT DO NOTHING;

-- qa
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('qa', 'dashboard.view'),
  ('qa', 'qa.view'),
  ('qa', 'qa.edit'),
  ('qa', 'clients.view'),
  ('qa', 'documents.view'),
  ('qa', 'documents.edit'),
  ('qa', 'tasks.view'),
  ('qa', 'tasks.edit')
ON CONFLICT DO NOTHING;

-- scheduling
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('scheduling', 'dashboard.view'),
  ('scheduling', 'scheduling.view'),
  ('scheduling', 'scheduling.edit'),
  ('scheduling', 'clients.view'),
  ('scheduling', 'tasks.view'),
  ('scheduling', 'tasks.edit')
ON CONFLICT DO NOTHING;

-- staffing
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('staffing', 'dashboard.view'),
  ('staffing', 'staffing.view'),
  ('staffing', 'staffing.edit'),
  ('staffing', 'clients.view'),
  ('staffing', 'team.view')
ON CONFLICT DO NOTHING;

-- clinic
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('clinic', 'dashboard.view'),
  ('clinic', 'clinics.view'),
  ('clinic', 'clinics.edit'),
  ('clinic', 'clients.view'),
  ('clinic', 'scheduling.view')
ON CONFLICT DO NOTHING;

-- finance
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('finance', 'dashboard.view'),
  ('finance', 'finance.view'),
  ('finance', 'finance.edit'),
  ('finance', 'clients.view'),
  ('finance', 'clients.financial'),
  ('finance', 'team.view')
ON CONFLICT DO NOTHING;

-- hr
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('hr', 'dashboard.view'),
  ('hr', 'team.view'),
  ('hr', 'team.hr'),
  ('hr', 'recruiting.view'),
  ('hr', 'recruiting.edit'),
  ('hr', 'documents.view'),
  ('hr', 'documents.edit'),
  ('hr', 'tasks.view'),
  ('hr', 'tasks.edit')
ON CONFLICT DO NOTHING;

-- phone_support
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('phone_support', 'dashboard.view'),
  ('phone_support', 'phone.view'),
  ('phone_support', 'phone.edit'),
  ('phone_support', 'leads.view'),
  ('phone_support', 'clients.view')
ON CONFLICT DO NOTHING;

-- staff (legacy generic): same as ops_manager minus deletes
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('staff', 'dashboard.view'),
  ('staff', 'leads.view'),
  ('staff', 'leads.edit'),
  ('staff', 'clients.view'),
  ('staff', 'clients.edit'),
  ('staff', 'auth.view'),
  ('staff', 'auth.edit'),
  ('staff', 'qa.view'),
  ('staff', 'scheduling.view'),
  ('staff', 'scheduling.edit'),
  ('staff', 'staffing.view'),
  ('staff', 'documents.view'),
  ('staff', 'documents.edit'),
  ('staff', 'tasks.view'),
  ('staff', 'tasks.edit'),
  ('staff', 'phone.view'),
  ('staff', 'phone.edit'),
  ('staff', 'reports.view')
ON CONFLICT DO NOTHING;

-- viewer: read-only
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('viewer', 'dashboard.view'),
  ('viewer', 'leads.view'),
  ('viewer', 'clients.view'),
  ('viewer', 'auth.view'),
  ('viewer', 'qa.view'),
  ('viewer', 'scheduling.view'),
  ('viewer', 'staffing.view'),
  ('viewer', 'operations.view'),
  ('viewer', 'clinics.view'),
  ('viewer', 'phone.view'),
  ('viewer', 'documents.view'),
  ('viewer', 'tasks.view'),
  ('viewer', 'reports.view')
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 9. Seed stage_ownership
-- =========================================================================
-- Lead stages (best-effort: intake owns all lead stages)
-- We don't know lead stage values yet (mock data); seed common ones used in code.
INSERT INTO public.stage_ownership (stage_kind, stage_value, role) VALUES
  ('lead', 'New Lead', 'intake'),
  ('lead', 'Contacted', 'intake'),
  ('lead', 'VOB Pending', 'intake'),
  ('lead', 'VOB Complete', 'intake'),
  ('lead', 'Consent Sent', 'intake'),
  ('lead', 'Converted', 'intake'),
  ('lead', 'Lost', 'intake')
ON CONFLICT DO NOTHING;

-- Client stages
INSERT INTO public.stage_ownership (stage_kind, stage_value, role) VALUES
  ('client', 'BCBA Assignment', 'auth_team'),
  ('client', 'Pending Initial Auth', 'auth_team'),
  ('client', 'Waiting on Consent Forms', 'intake'),
  ('client', 'Schedule Assessment', 'scheduling'),
  ('client', 'Assessment Scheduled', 'scheduling'),
  ('client', 'In QA', 'qa'),
  ('client', 'Pending Treatment Auth', 'auth_team'),
  ('client', 'Staffing Needed', 'staffing'),
  ('client', 'Restaffing Needed', 'staffing'),
  ('client', 'Pending Start Date', 'scheduling'),
  ('client', 'Pending Start Date', 'staffing'),
  ('client', 'Active', 'clinic'),
  ('client', 'Flaked', 'auth_team'),
  ('client', 'Discharged', 'auth_team'),
  ('client', 'Services on Pause', 'auth_team')
ON CONFLICT DO NOTHING;
