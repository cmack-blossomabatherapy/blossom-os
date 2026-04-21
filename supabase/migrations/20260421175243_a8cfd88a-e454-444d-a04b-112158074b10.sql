-- ============================================================
-- HR SUITE PHASE 4 — Communication, Resource Hub, Reports, Settings
-- ============================================================

-- ----- ENUMS -----
CREATE TYPE public.hr_announcement_audience AS ENUM ('all','by_state','by_clinic','by_department','by_role');
CREATE TYPE public.hr_announcement_priority AS ENUM ('info','important','urgent');
CREATE TYPE public.hr_resource_kind AS ENUM ('document','link','video','policy','form','folder');
CREATE TYPE public.hr_resource_category AS ENUM ('handbook','payroll','training','clinical','it','benefits','onboarding','general');

-- ----- ANNOUNCEMENTS -----
CREATE TABLE public.hr_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  priority public.hr_announcement_priority NOT NULL DEFAULT 'info',
  audience public.hr_announcement_audience NOT NULL DEFAULT 'all',
  audience_states text[] NOT NULL DEFAULT '{}',
  audience_clinics text[] NOT NULL DEFAULT '{}',
  audience_departments uuid[] NOT NULL DEFAULT '{}',
  audience_roles text[] NOT NULL DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  publish_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  author_id uuid,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hr_announcements_publish ON public.hr_announcements(publish_at DESC);
CREATE INDEX idx_hr_announcements_priority ON public.hr_announcements(priority);

ALTER TABLE public.hr_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View announcements" ON public.hr_announcements FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.announcements.view') OR public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage announcements" ON public.hr_announcements FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.announcements.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.announcements.manage'));

CREATE TRIGGER trg_hr_announcements_updated BEFORE UPDATE ON public.hr_announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- ANNOUNCEMENT READS -----
CREATE TABLE public.hr_announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.hr_announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);
CREATE INDEX idx_hr_ann_reads_user ON public.hr_announcement_reads(user_id);

ALTER TABLE public.hr_announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own reads" ON public.hr_announcement_reads FOR SELECT
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'hr.announcements.manage'));
CREATE POLICY "Insert own read" ON public.hr_announcement_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ----- RESOURCE HUB -----
CREATE TABLE public.hr_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  kind public.hr_resource_kind NOT NULL DEFAULT 'document',
  category public.hr_resource_category NOT NULL DEFAULT 'general',
  url text,
  storage_path text,
  parent_id uuid REFERENCES public.hr_resources(id) ON DELETE SET NULL,
  visibility_states text[] NOT NULL DEFAULT '{}',
  visibility_clinics text[] NOT NULL DEFAULT '{}',
  visibility_roles text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hr_resources_category ON public.hr_resources(category);
CREATE INDEX idx_hr_resources_parent ON public.hr_resources(parent_id);

ALTER TABLE public.hr_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View resources" ON public.hr_resources FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.resources.view') OR public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage resources" ON public.hr_resources FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.resources.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.resources.manage'));

CREATE TRIGGER trg_hr_resources_updated BEFORE UPDATE ON public.hr_resources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- SAVED REPORTS -----
CREATE TABLE public.hr_saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hr_reports_category ON public.hr_saved_reports(category);

ALTER TABLE public.hr_saved_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View reports" ON public.hr_saved_reports FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.reports.view') OR (is_shared = true AND public.has_permission(auth.uid(), 'hr.view')));
CREATE POLICY "Manage own/shared reports" ON public.hr_saved_reports FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.reports.manage') OR created_by = auth.uid())
  WITH CHECK (public.has_permission(auth.uid(), 'hr.reports.manage') OR created_by = auth.uid());

CREATE TRIGGER trg_hr_reports_updated BEFORE UPDATE ON public.hr_saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- SETTINGS -----
CREATE TABLE public.hr_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid,
  updated_by_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View settings" ON public.hr_settings FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage settings" ON public.hr_settings FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.settings.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.settings.manage'));

-- ----- PERMISSIONS CATALOG -----
INSERT INTO public.permissions (key, label, module, description) VALUES
  ('hr.announcements.view',    'View Announcements',    'hr', 'Read HR announcements posted to your audience'),
  ('hr.announcements.manage',  'Manage Announcements',  'hr', 'Create, edit, and pin HR announcements'),
  ('hr.resources.view',        'View Resource Hub',     'hr', 'Browse the staff Resource Hub'),
  ('hr.resources.manage',      'Manage Resource Hub',   'hr', 'Upload, edit, and organize resources in the hub'),
  ('hr.reports.view',          'View HR Reports',       'hr', 'View HR analytics and saved reports'),
  ('hr.reports.manage',        'Manage HR Reports',     'hr', 'Create, edit, and share saved HR reports'),
  ('hr.settings.manage',       'Manage HR Settings',    'hr', 'Configure HR module-level settings (PTO, OT, kiosk)')
ON CONFLICT (key) DO NOTHING;

-- ----- ROLE GRANTS -----
INSERT INTO public.role_permissions (role, permission_key) VALUES
  -- HR Admin: everything
  ('hr_admin','hr.announcements.view'),('hr_admin','hr.announcements.manage'),
  ('hr_admin','hr.resources.view'),('hr_admin','hr.resources.manage'),
  ('hr_admin','hr.reports.view'),('hr_admin','hr.reports.manage'),
  ('hr_admin','hr.settings.manage'),
  -- HR Manager: view + manage comm/resources/reports
  ('hr_manager','hr.announcements.view'),('hr_manager','hr.announcements.manage'),
  ('hr_manager','hr.resources.view'),('hr_manager','hr.resources.manage'),
  ('hr_manager','hr.reports.view'),('hr_manager','hr.reports.manage'),
  -- Payroll Admin: reports + view comm/resources
  ('payroll_admin','hr.announcements.view'),
  ('payroll_admin','hr.resources.view'),
  ('payroll_admin','hr.reports.view'),('payroll_admin','hr.reports.manage'),
  -- Exec: view all + manage announcements
  ('exec','hr.announcements.view'),('exec','hr.announcements.manage'),
  ('exec','hr.resources.view'),
  ('exec','hr.reports.view'),
  -- Ops Manager
  ('ops_manager','hr.announcements.view'),('ops_manager','hr.resources.view'),('ops_manager','hr.reports.view'),
  -- State / Clinic / Dept Directors: view comm + resources
  ('state_director','hr.announcements.view'),('state_director','hr.resources.view'),('state_director','hr.reports.view'),
  ('clinic_director','hr.announcements.view'),('clinic_director','hr.resources.view'),
  ('dept_manager','hr.announcements.view'),('dept_manager','hr.resources.view'),
  -- Recruiting Assistant
  ('recruiting_assistant','hr.announcements.view'),('recruiting_assistant','hr.resources.view'),
  -- Finance
  ('finance','hr.reports.view'),('finance','hr.announcements.view')
ON CONFLICT DO NOTHING;

-- ----- DEFAULT SETTINGS -----
INSERT INTO public.hr_settings (key, value, description) VALUES
  ('pto.accrual', '{"hours_per_pay_period": 4, "max_balance": 120, "carryover": 40}'::jsonb, 'PTO accrual policy'),
  ('overtime.threshold', '{"weekly_hours": 40, "daily_hours": null, "multiplier": 1.5}'::jsonb, 'Overtime calculation rules'),
  ('kiosk.geofence', '{"enabled": false, "radius_meters": 250}'::jsonb, 'Time clock kiosk geofencing'),
  ('payroll.cycle', '{"frequency": "biweekly", "submit_lead_days": 2}'::jsonb, 'Default payroll cycle'),
  ('reviews.cadence', '{"new_hire": [30, 60, 90], "annual_month": 1}'::jsonb, 'Default performance review schedule')
ON CONFLICT (key) DO NOTHING;
