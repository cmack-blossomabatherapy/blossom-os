-- ============================================================
-- HR SUITE PHASE 3 — Reviews, Bonuses, Training, Payroll
-- ============================================================

-- ----- ENUMS -----
CREATE TYPE public.review_type AS ENUM ('30_day','60_day','90_day','annual','probationary','ad_hoc');
CREATE TYPE public.review_status AS ENUM ('draft','manager_review','employee_acknowledge','completed','cancelled');
CREATE TYPE public.review_rating AS ENUM ('exceeds','meets','developing','needs_improvement','unsatisfactory');

CREATE TYPE public.bonus_type AS ENUM ('signing','retention','referral','performance','spot','holiday','other');
CREATE TYPE public.bonus_status AS ENUM ('pending_approval','approved','paid','cancelled');

CREATE TYPE public.pay_change_kind AS ENUM ('raise','promotion','demotion','adjustment','rate_correction','title_change');
CREATE TYPE public.pay_change_status AS ENUM ('proposed','approved','effective','reverted');

CREATE TYPE public.training_status AS ENUM ('assigned','in_progress','completed','expired','waived');

CREATE TYPE public.payroll_run_status AS ENUM ('open','ready','submitted','posted','closed','rejected');

-- ----- PERFORMANCE REVIEWS -----
CREATE TABLE public.employee_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewer_name text,
  review_type public.review_type NOT NULL DEFAULT 'annual',
  status public.review_status NOT NULL DEFAULT 'draft',
  overall_rating public.review_rating,
  period_start date,
  period_end date,
  due_date date,
  scheduled_for date,
  strengths text,
  growth_areas text,
  goals text,
  manager_comments text,
  employee_comments text,
  acknowledged_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_reviews_employee ON public.employee_reviews(employee_id);
CREATE INDEX idx_emp_reviews_status ON public.employee_reviews(status);
CREATE INDEX idx_emp_reviews_due ON public.employee_reviews(due_date);

ALTER TABLE public.employee_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View reviews" ON public.employee_reviews FOR SELECT
  USING (
    public.has_permission(auth.uid(), 'hr.reviews.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_reviews.employee_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Manage reviews" ON public.employee_reviews FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.reviews.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.reviews.manage'));
CREATE POLICY "Employee acknowledge own review" ON public.employee_reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_reviews.employee_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_reviews.employee_id AND e.user_id = auth.uid()));

CREATE TRIGGER trg_emp_reviews_updated BEFORE UPDATE ON public.employee_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- BONUSES -----
CREATE TABLE public.employee_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  bonus_type public.bonus_type NOT NULL DEFAULT 'performance',
  status public.bonus_status NOT NULL DEFAULT 'pending_approval',
  amount numeric(12,2) NOT NULL,
  reason text,
  notes text,
  effective_date date,
  paid_date date,
  payroll_run_id uuid,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_bonuses_employee ON public.employee_bonuses(employee_id);
CREATE INDEX idx_emp_bonuses_status ON public.employee_bonuses(status);

ALTER TABLE public.employee_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bonuses" ON public.employee_bonuses FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.bonuses.view'));
CREATE POLICY "Manage bonuses" ON public.employee_bonuses FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.bonuses.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.bonuses.manage'));

CREATE TRIGGER trg_emp_bonuses_updated BEFORE UPDATE ON public.employee_bonuses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- PAY CHANGES -----
CREATE TABLE public.employee_pay_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  kind public.pay_change_kind NOT NULL DEFAULT 'raise',
  status public.pay_change_status NOT NULL DEFAULT 'proposed',
  previous_rate numeric(12,2),
  new_rate numeric(12,2) NOT NULL,
  previous_title text,
  new_title text,
  previous_pay_type public.pay_type,
  new_pay_type public.pay_type,
  effective_date date NOT NULL,
  reason text,
  notes text,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  applied_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_paychanges_employee ON public.employee_pay_changes(employee_id);
CREATE INDEX idx_emp_paychanges_effective ON public.employee_pay_changes(effective_date);

ALTER TABLE public.employee_pay_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View pay changes" ON public.employee_pay_changes FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.paychanges.view'));
CREATE POLICY "Manage pay changes" ON public.employee_pay_changes FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.paychanges.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.paychanges.manage'));

CREATE TRIGGER trg_emp_paychanges_updated BEFORE UPDATE ON public.employee_pay_changes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- TRAINING COURSES -----
CREATE TABLE public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  provider text,
  category text,
  required_for_roles text[] NOT NULL DEFAULT '{}',
  renewal_months integer,
  duration_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View training courses" ON public.training_courses FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.training.view') OR auth.uid() IS NOT NULL);
CREATE POLICY "Manage training courses" ON public.training_courses FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.training.assign'));

CREATE TRIGGER trg_training_courses_updated BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- EMPLOYEE TRAININGS -----
CREATE TABLE public.employee_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE RESTRICT,
  status public.training_status NOT NULL DEFAULT 'assigned',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  expires_on date,
  score numeric(5,2),
  certificate_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_trainings_employee ON public.employee_trainings(employee_id);
CREATE INDEX idx_emp_trainings_status ON public.employee_trainings(status);
CREATE INDEX idx_emp_trainings_expires ON public.employee_trainings(expires_on);

ALTER TABLE public.employee_trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View trainings" ON public.employee_trainings FOR SELECT
  USING (
    public.has_permission(auth.uid(), 'hr.training.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_trainings.employee_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Assign trainings" ON public.employee_trainings FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(), 'hr.training.assign'));
CREATE POLICY "Update trainings (manager)" ON public.employee_trainings FOR UPDATE
  USING (public.has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.training.assign'));
CREATE POLICY "Employee complete own training" ON public.employee_trainings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_trainings.employee_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_trainings.employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Delete trainings" ON public.employee_trainings FOR DELETE
  USING (public.has_permission(auth.uid(), 'hr.training.assign'));

CREATE TRIGGER trg_emp_trainings_updated BEFORE UPDATE ON public.employee_trainings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- PAYROLL RUNS -----
CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_date date,
  status public.payroll_run_status NOT NULL DEFAULT 'open',
  total_hours numeric(12,2) NOT NULL DEFAULT 0,
  total_gross numeric(14,2) NOT NULL DEFAULT 0,
  employee_count integer NOT NULL DEFAULT 0,
  viventium_batch_id text,
  viventium_synced_at timestamptz,
  notes text,
  submitted_by uuid,
  submitted_by_name text,
  submitted_at timestamptz,
  posted_by uuid,
  posted_at timestamptz,
  closed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_runs_status ON public.payroll_runs(status);
CREATE INDEX idx_payroll_runs_period ON public.payroll_runs(period_start, period_end);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View payroll runs" ON public.payroll_runs FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view'));
CREATE POLICY "Manage payroll runs" ON public.payroll_runs FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE TRIGGER trg_payroll_runs_updated BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- PAYROLL RUN ITEMS -----
CREATE TABLE public.payroll_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  timesheet_id uuid REFERENCES public.hours_timesheets(id) ON DELETE SET NULL,
  regular_hours numeric(10,2) NOT NULL DEFAULT 0,
  overtime_hours numeric(10,2) NOT NULL DEFAULT 0,
  pto_hours numeric(10,2) NOT NULL DEFAULT 0,
  bonus_total numeric(12,2) NOT NULL DEFAULT 0,
  gross_pay numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, employee_id)
);
CREATE INDEX idx_payroll_run_items_run ON public.payroll_run_items(payroll_run_id);
CREATE INDEX idx_payroll_run_items_employee ON public.payroll_run_items(employee_id);

ALTER TABLE public.payroll_run_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View payroll items" ON public.payroll_run_items FOR SELECT
  USING (
    public.has_permission(auth.uid(), 'hr.payroll.runs.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = payroll_run_items.employee_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Manage payroll items" ON public.payroll_run_items FOR ALL
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE TRIGGER trg_payroll_run_items_updated BEFORE UPDATE ON public.payroll_run_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ----- PERMISSIONS CATALOG -----
INSERT INTO public.permissions (key, label, module, description) VALUES
  ('hr.reviews.view',         'View Performance Reviews',     'hr', 'View employee performance reviews'),
  ('hr.reviews.manage',       'Manage Performance Reviews',   'hr', 'Create, edit, and finalize performance reviews'),
  ('hr.reviews.acknowledge',  'Acknowledge Own Review',       'hr', 'Allow employee to acknowledge their own review'),
  ('hr.bonuses.view',         'View Bonuses',                 'hr', 'View employee bonus records'),
  ('hr.bonuses.manage',       'Manage Bonuses',               'hr', 'Create, approve, and pay bonuses'),
  ('hr.paychanges.view',      'View Pay Changes',             'hr', 'View employee pay change history'),
  ('hr.paychanges.manage',    'Manage Pay Changes',           'hr', 'Create and approve raises, promotions, adjustments'),
  ('hr.training.view',        'View Training',                'hr', 'View training assignments and certifications'),
  ('hr.training.assign',      'Assign Training',              'hr', 'Assign and manage training courses'),
  ('hr.training.complete',    'Complete Own Training',        'hr', 'Mark own training assignments complete'),
  ('hr.payroll.runs.view',    'View Payroll Runs',            'hr', 'View payroll run batches and items'),
  ('hr.payroll.runs.manage',  'Manage Payroll Runs',          'hr', 'Create, edit, and post payroll runs'),
  ('hr.payroll.runs.submit',  'Submit Payroll Runs',          'hr', 'Submit payroll runs to Viventium')
ON CONFLICT (key) DO NOTHING;

-- ----- ROLE GRANTS -----
-- HR Admin: everything
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('hr_admin','hr.reviews.view'),('hr_admin','hr.reviews.manage'),
  ('hr_admin','hr.bonuses.view'),('hr_admin','hr.bonuses.manage'),
  ('hr_admin','hr.paychanges.view'),('hr_admin','hr.paychanges.manage'),
  ('hr_admin','hr.training.view'),('hr_admin','hr.training.assign'),
  ('hr_admin','hr.payroll.runs.view'),('hr_admin','hr.payroll.runs.manage'),('hr_admin','hr.payroll.runs.submit'),
  ('hr_admin','hr.reviews.acknowledge'),('hr_admin','hr.training.complete')
ON CONFLICT DO NOTHING;

-- HR Manager: reviews + training mgmt, view bonuses/pay/payroll
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('hr_manager','hr.reviews.view'),('hr_manager','hr.reviews.manage'),
  ('hr_manager','hr.bonuses.view'),
  ('hr_manager','hr.paychanges.view'),
  ('hr_manager','hr.training.view'),('hr_manager','hr.training.assign'),
  ('hr_manager','hr.payroll.runs.view')
ON CONFLICT DO NOTHING;

-- Payroll Admin: bonuses + pay changes + payroll runs
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('payroll_admin','hr.bonuses.view'),('payroll_admin','hr.bonuses.manage'),
  ('payroll_admin','hr.paychanges.view'),('payroll_admin','hr.paychanges.manage'),
  ('payroll_admin','hr.payroll.runs.view'),('payroll_admin','hr.payroll.runs.manage'),('payroll_admin','hr.payroll.runs.submit'),
  ('payroll_admin','hr.training.view'),
  ('payroll_admin','hr.reviews.view')
ON CONFLICT DO NOTHING;

-- Exec: view all
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('exec','hr.reviews.view'),('exec','hr.bonuses.view'),('exec','hr.paychanges.view'),
  ('exec','hr.training.view'),('exec','hr.payroll.runs.view')
ON CONFLICT DO NOTHING;

-- Ops Manager: view reviews, training, payroll
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('ops_manager','hr.reviews.view'),('ops_manager','hr.training.view'),('ops_manager','hr.training.assign'),
  ('ops_manager','hr.payroll.runs.view')
ON CONFLICT DO NOTHING;

-- State / Clinic / Dept Directors: view reviews + training for visibility
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('state_director','hr.reviews.view'),('state_director','hr.training.view'),
  ('clinic_director','hr.reviews.view'),('clinic_director','hr.training.view'),
  ('dept_manager','hr.reviews.view'),('dept_manager','hr.training.view')
ON CONFLICT DO NOTHING;

-- Recruiting Assistant: training view (for new hires)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('recruiting_assistant','hr.training.view'),('recruiting_assistant','hr.training.assign')
ON CONFLICT DO NOTHING;

-- Finance: payroll + bonuses view
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('finance','hr.payroll.runs.view'),('finance','hr.bonuses.view'),('finance','hr.paychanges.view')
ON CONFLICT DO NOTHING;
