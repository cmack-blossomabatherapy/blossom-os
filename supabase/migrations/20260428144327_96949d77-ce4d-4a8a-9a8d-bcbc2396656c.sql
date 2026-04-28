INSERT INTO public.permissions (key, module, label, description) VALUES
  ('pipeline.view', 'Pipeline', 'View full pipeline', 'See the end-to-end lead and client pipeline'),
  ('pipeline.override', 'Pipeline', 'Override pipeline stages', 'Move records outside the normal owner workflow'),
  ('intake.view', 'Intake', 'View intake workspace', 'See leads and early pipeline intake work'),
  ('intake.edit', 'Intake', 'Manage intake workflow', 'Create leads, contact families, send forms, and manage missing information'),
  ('financial.vob.view', 'Financial / Benefits', 'View VOB decisions', 'Review benefit verification and financial intake status'),
  ('financial.vob.manage', 'Financial / Benefits', 'Manage VOB decisions', 'Approve, reject, and mark benefit/payment decisions'),
  ('payment_plans.view', 'Finance', 'View payment plans', 'See client payment plan status and financial tracking'),
  ('payment_plans.manage', 'Finance', 'Manage payment plans', 'Create and update payment plans'),
  ('payroll.view', 'Finance / Payroll', 'View payroll', 'See hours, payroll, and payout records'),
  ('payroll.process', 'Finance / Payroll', 'Process payroll', 'Process payroll and payout workflows'),
  ('hr.training.view', 'HR Suite', 'View training records', 'View training assignments, progress, and certifications'),
  ('hr.training.assign', 'HR Suite', 'Assign training', 'Assign training and manage course enrollment'),
  ('hr.training.manage', 'HR Suite', 'Manage training system', 'Create courses, badges, resources, assignments, and training dashboards'),
  ('hr.resources.view', 'HR Suite', 'View Resource Hub', 'Browse role-based staff resources'),
  ('hr.resources.manage', 'HR Suite', 'Manage Resource Hub', 'Create and organize resource categories and materials'),
  ('hr.announcements.view', 'HR Suite', 'View announcements', 'Read internal announcements'),
  ('hr.announcements.manage', 'HR Suite', 'Manage announcements', 'Create and publish internal announcements'),
  ('hr.settings.manage', 'HR Suite', 'Manage HR settings', 'Configure HR, training, people ops, time, and payroll settings'),
  ('settings.permissions.manage', 'Settings', 'Manage role permissions', 'Edit the role and permission matrix'),
  ('settings.workflows.manage', 'Settings', 'Manage workflow settings', 'Configure stages, automations, templates, and assignment rules'),
  ('settings.integrations.manage', 'Settings', 'Manage integrations', 'Configure connected systems'),
  ('state.view', 'State Leadership', 'View state operations', 'See clients, employees, and performance for assigned state'),
  ('state.escalate', 'State Leadership', 'Escalate state issues', 'Resolve blockers and escalate state-level problems')
ON CONFLICT (key) DO UPDATE SET
  module = EXCLUDED.module,
  label = EXCLUDED.label,
  description = EXCLUDED.description;

DELETE FROM public.role_permissions
WHERE role IN (
  'exec', 'ops_manager', 'intake', 'auth_team', 'qa', 'scheduling', 'staffing', 'clinic',
  'finance', 'hr', 'hr_admin', 'hr_manager', 'recruiting_assistant', 'payroll_admin',
  'state_director', 'clinic_director', 'dept_manager', 'staff', 'viewer'
);

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::public.app_role, key FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('exec','dashboard.view'),('exec','pipeline.view'),('exec','leads.view'),('exec','clients.view'),('exec','clients.financial'),
  ('exec','auth.view'),('exec','auth.billing'),('exec','qa.view'),('exec','scheduling.view'),('exec','staffing.view'),
  ('exec','recruiting.view'),('exec','operations.view'),('exec','clinics.view'),('exec','phone.view'),('exec','documents.view'),
  ('exec','tasks.view'),('exec','reports.view'),('exec','automations.view'),('exec','team.view'),('exec','finance.view'),
  ('exec','financial.vob.view'),('exec','payment_plans.view'),('exec','payroll.view'),('exec','hr.view'),('exec','hr.employees.view'),
  ('exec','hr.documents.view'),('exec','hr.onboarding.manage'),('exec','hr.reviews.view'),('exec','hr.training.view'),
  ('exec','hr.resources.view'),('exec','hr.announcements.view'),('exec','hr.reports.view'),('exec','settings.view'),('exec','pipeline.override'),

  ('ops_manager','dashboard.view'),('ops_manager','pipeline.view'),('ops_manager','pipeline.override'),('ops_manager','leads.view'),
  ('ops_manager','leads.create'),('ops_manager','leads.edit'),('ops_manager','clients.view'),('ops_manager','clients.create'),
  ('ops_manager','clients.edit'),('ops_manager','auth.view'),('ops_manager','auth.edit'),('ops_manager','qa.view'),('ops_manager','qa.edit'),
  ('ops_manager','scheduling.view'),('ops_manager','scheduling.edit'),('ops_manager','staffing.view'),('ops_manager','staffing.edit'),
  ('ops_manager','recruiting.view'),('ops_manager','operations.view'),('ops_manager','operations.edit'),('ops_manager','clinics.view'),
  ('ops_manager','clinics.edit'),('ops_manager','phone.view'),('ops_manager','phone.edit'),('ops_manager','documents.view'),
  ('ops_manager','documents.edit'),('ops_manager','tasks.view'),('ops_manager','tasks.edit'),('ops_manager','tasks.delete'),
  ('ops_manager','reports.view'),('ops_manager','automations.view'),('ops_manager','team.view'),('ops_manager','hr.training.view'),
  ('ops_manager','hr.training.assign'),('ops_manager','hr.resources.view'),('ops_manager','hr.announcements.view'),('ops_manager','hr.reports.view'),

  ('intake','dashboard.view'),('intake','intake.view'),('intake','intake.edit'),('intake','pipeline.view'),('intake','leads.view'),
  ('intake','leads.create'),('intake','leads.edit'),('intake','clients.view'),('intake','clients.create'),('intake','documents.view'),
  ('intake','documents.edit'),('intake','tasks.view'),('intake','tasks.edit'),('intake','phone.view'),('intake','phone.edit'),
  ('intake','financial.vob.view'),('intake','hr.training.view'),('intake','hr.resources.view'),('intake','hr.announcements.view'),

  ('finance','dashboard.view'),('finance','finance.view'),('finance','finance.edit'),('finance','clients.view'),('finance','clients.financial'),
  ('finance','financial.vob.view'),('finance','financial.vob.manage'),('finance','payment_plans.view'),('finance','payment_plans.manage'),
  ('finance','payroll.view'),('finance','hr.payroll.runs.view'),('finance','hr.bonuses.view'),('finance','hr.paychanges.view'),
  ('finance','reports.view'),('finance','team.view'),('finance','hr.training.view'),('finance','hr.resources.view'),('finance','hr.announcements.view'),

  ('auth_team','dashboard.view'),('auth_team','pipeline.view'),('auth_team','clients.view'),('auth_team','clients.edit'),
  ('auth_team','auth.view'),('auth_team','auth.edit'),('auth_team','auth.billing'),('auth_team','documents.view'),('auth_team','documents.edit'),
  ('auth_team','tasks.view'),('auth_team','tasks.edit'),('auth_team','reports.view'),('auth_team','hr.training.view'),('auth_team','hr.resources.view'),('auth_team','hr.announcements.view'),

  ('qa','dashboard.view'),('qa','pipeline.view'),('qa','qa.view'),('qa','qa.edit'),('qa','clients.view'),('qa','auth.view'),
  ('qa','documents.view'),('qa','documents.edit'),('qa','tasks.view'),('qa','tasks.edit'),('qa','reports.view'),('qa','hr.training.view'),
  ('qa','hr.resources.view'),('qa','hr.announcements.view'),

  ('staffing','dashboard.view'),('staffing','pipeline.view'),('staffing','staffing.view'),('staffing','staffing.edit'),('staffing','clients.view'),
  ('staffing','clients.edit'),('staffing','scheduling.view'),('staffing','team.view'),('staffing','tasks.view'),('staffing','tasks.edit'),
  ('staffing','hr.training.view'),('staffing','hr.resources.view'),('staffing','hr.announcements.view'),

  ('scheduling','dashboard.view'),('scheduling','pipeline.view'),('scheduling','scheduling.view'),('scheduling','scheduling.edit'),
  ('scheduling','clients.view'),('scheduling','clients.edit'),('scheduling','staffing.view'),('scheduling','tasks.view'),('scheduling','tasks.edit'),
  ('scheduling','hr.training.view'),('scheduling','hr.resources.view'),('scheduling','hr.announcements.view'),

  ('clinic','dashboard.view'),('clinic','clients.view'),('clinic','clinics.view'),('clinic','clinics.edit'),('clinic','scheduling.view'),
  ('clinic','scheduling.edit'),('clinic','staffing.view'),('clinic','tasks.view'),('clinic','tasks.edit'),('clinic','hr.training.view'),
  ('clinic','hr.resources.view'),('clinic','hr.announcements.view'),

  ('payroll_admin','dashboard.view'),('payroll_admin','finance.view'),('payroll_admin','payroll.view'),('payroll_admin','payroll.process'),
  ('payroll_admin','payment_plans.view'),('payroll_admin','hr.payroll.runs.view'),('payroll_admin','hr.payroll.runs.manage'),
  ('payroll_admin','hr.payroll.runs.submit'),('payroll_admin','hr.bonuses.view'),('payroll_admin','hr.bonuses.manage'),
  ('payroll_admin','hr.paychanges.view'),('payroll_admin','hr.paychanges.manage'),('payroll_admin','hr.hours.view'),('payroll_admin','hr.timeclock.view'),
  ('payroll_admin','reports.view'),('payroll_admin','hr.training.view'),('payroll_admin','hr.resources.view'),('payroll_admin','hr.announcements.view'),

  ('hr','dashboard.view'),('hr','hr.view'),('hr','hr.employees.view'),('hr','hr.employees.create'),('hr','hr.employees.edit'),
  ('hr','hr.documents.view'),('hr','hr.documents.manage'),('hr','hr.onboarding.manage'),('hr','hr.reviews.view'),('hr','hr.reviews.manage'),
  ('hr','hr.training.view'),('hr','hr.training.assign'),('hr','hr.training.manage'),('hr','hr.resources.view'),('hr','hr.resources.manage'),
  ('hr','hr.announcements.view'),('hr','hr.announcements.manage'),('hr','hr.reports.view'),('hr','team.view'),('hr','recruiting.view'),
  ('hr','recruiting.edit'),('hr','documents.view'),('hr','documents.edit'),('hr','tasks.view'),('hr','tasks.edit'),

  ('hr_admin','dashboard.view'),('hr_admin','hr.view'),('hr_admin','hr.employees.view'),('hr_admin','hr.employees.create'),
  ('hr_admin','hr.employees.edit'),('hr_admin','hr.employees.delete'),('hr_admin','hr.documents.view'),('hr_admin','hr.documents.manage'),
  ('hr_admin','hr.notes.view'),('hr_admin','hr.notes.manage'),('hr_admin','hr.cases.view'),('hr_admin','hr.cases.manage'),
  ('hr_admin','hr.onboarding.manage'),('hr_admin','hr.reviews.view'),('hr_admin','hr.reviews.manage'),('hr_admin','hr.training.view'),
  ('hr_admin','hr.training.assign'),('hr_admin','hr.training.manage'),('hr_admin','hr.resources.view'),('hr_admin','hr.resources.manage'),
  ('hr_admin','hr.announcements.view'),('hr_admin','hr.announcements.manage'),('hr_admin','hr.timeclock.view'),('hr_admin','hr.timeclock.approve'),
  ('hr_admin','hr.hours.view'),('hr_admin','hr.hours.approve'),('hr_admin','hr.payroll.view'),('hr_admin','hr.payroll.edit'),
  ('hr_admin','hr.payroll.runs.view'),('hr_admin','hr.bonuses.view'),('hr_admin','hr.paychanges.view'),('hr_admin','hr.reports.view'),
  ('hr_admin','hr.settings.manage'),('hr_admin','team.view'),('hr_admin','team.manage'),('hr_admin','recruiting.view'),('hr_admin','recruiting.edit'),

  ('hr_manager','dashboard.view'),('hr_manager','hr.view'),('hr_manager','hr.employees.view'),('hr_manager','hr.employees.edit'),
  ('hr_manager','hr.documents.view'),('hr_manager','hr.documents.manage'),('hr_manager','hr.cases.view'),('hr_manager','hr.cases.manage'),
  ('hr_manager','hr.onboarding.manage'),('hr_manager','hr.reviews.view'),('hr_manager','hr.reviews.manage'),('hr_manager','hr.training.view'),
  ('hr_manager','hr.training.assign'),('hr_manager','hr.training.manage'),('hr_manager','hr.resources.view'),('hr_manager','hr.resources.manage'),
  ('hr_manager','hr.announcements.view'),('hr_manager','hr.announcements.manage'),('hr_manager','hr.timeclock.view'),('hr_manager','hr.timeclock.approve'),
  ('hr_manager','hr.hours.view'),('hr_manager','hr.reports.view'),('hr_manager','team.view'),('hr_manager','recruiting.view'),('hr_manager','recruiting.edit'),

  ('recruiting_assistant','dashboard.view'),('recruiting_assistant','recruiting.view'),('recruiting_assistant','recruiting.edit'),
  ('recruiting_assistant','hr.view'),('recruiting_assistant','hr.employees.view'),('recruiting_assistant','hr.onboarding.manage'),
  ('recruiting_assistant','hr.training.view'),('recruiting_assistant','hr.training.assign'),('recruiting_assistant','hr.resources.view'),
  ('recruiting_assistant','hr.announcements.view'),('recruiting_assistant','team.view'),('recruiting_assistant','tasks.view'),('recruiting_assistant','tasks.edit'),

  ('state_director','dashboard.view'),('state_director','state.view'),('state_director','state.escalate'),('state_director','pipeline.view'),
  ('state_director','leads.view'),('state_director','clients.view'),('state_director','auth.view'),('state_director','qa.view'),('state_director','scheduling.view'),
  ('state_director','staffing.view'),('state_director','clinics.view'),('state_director','operations.view'),('state_director','reports.view'),
  ('state_director','hr.view'),('state_director','hr.employees.view'),('state_director','hr.reviews.view'),('state_director','hr.training.view'),
  ('state_director','hr.resources.view'),('state_director','hr.announcements.view'),('state_director','team.view'),

  ('clinic_director','dashboard.view'),('clinic_director','clients.view'),('clinic_director','clinics.view'),('clinic_director','clinics.edit'),
  ('clinic_director','scheduling.view'),('clinic_director','staffing.view'),('clinic_director','reports.view'),('clinic_director','hr.employees.view'),
  ('clinic_director','hr.training.view'),('clinic_director','hr.resources.view'),('clinic_director','hr.announcements.view'),('clinic_director','team.view'),

  ('dept_manager','dashboard.view'),('dept_manager','clients.view'),('dept_manager','operations.view'),('dept_manager','reports.view'),
  ('dept_manager','hr.employees.view'),('dept_manager','hr.reviews.view'),('dept_manager','hr.training.view'),('dept_manager','hr.resources.view'),
  ('dept_manager','hr.announcements.view'),('dept_manager','team.view'),

  ('staff','dashboard.view'),('staff','hr.training.view'),('staff','hr.training.complete'),('staff','hr.resources.view'),('staff','hr.announcements.view'),('staff','tasks.view'),
  ('viewer','dashboard.view'),('viewer','pipeline.view'),('viewer','leads.view'),('viewer','clients.view'),('viewer','auth.view'),('viewer','qa.view'),
  ('viewer','scheduling.view'),('viewer','staffing.view'),('viewer','operations.view'),('viewer','clinics.view'),('viewer','documents.view'),('viewer','tasks.view'),('viewer','reports.view')
ON CONFLICT DO NOTHING;

DELETE FROM public.stage_ownership;

INSERT INTO public.stage_ownership (stage_kind, stage_value, role) VALUES
  ('lead', 'New Lead', 'intake'),
  ('lead', 'In Contact', 'intake'),
  ('lead', 'Contacted', 'intake'),
  ('lead', 'Sent Form', 'intake'),
  ('lead', 'Missing Info', 'intake'),
  ('lead', 'Form Received', 'intake'),
  ('lead', 'Sent to VOB', 'intake'),
  ('lead', 'VOB Pending', 'finance'),
  ('lead', 'VOB Completed', 'finance'),
  ('lead', 'VOB Complete', 'finance'),
  ('lead', 'Converted', 'ops_manager'),
  ('lead', 'Lost', 'ops_manager'),
  ('client', 'BCBA Assignment', 'ops_manager'),
  ('client', 'Pending Initial Auth', 'auth_team'),
  ('client', 'Waiting on Consent', 'intake'),
  ('client', 'Waiting on Consent Forms', 'intake'),
  ('client', 'Schedule Assessment', 'scheduling'),
  ('client', 'Assessment Scheduled', 'scheduling'),
  ('client', 'QA', 'qa'),
  ('client', 'In QA', 'qa'),
  ('client', 'Pending Treatment Auth', 'auth_team'),
  ('client', 'Staffing Needed', 'staffing'),
  ('client', 'Restaffing Needed', 'staffing'),
  ('client', 'Pending Start Date', 'scheduling'),
  ('client', 'Pending Start Date', 'staffing'),
  ('client', 'Active', 'clinic'),
  ('client', 'Active', 'ops_manager'),
  ('client', 'Flaked', 'auth_team'),
  ('client', 'Discharged', 'auth_team'),
  ('client', 'Services on Pause', 'auth_team')
ON CONFLICT DO NOTHING;