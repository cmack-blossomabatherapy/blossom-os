
-- Enums
DO $$ BEGIN
  CREATE TYPE public.payroll_issue_category AS ENUM
    ('missing_time','adjustment','blocker','pto_review','benefits','employee_question','attendance_exception','approval_needed','reminder','escalation','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_issue_status AS ENUM ('open','in_progress','resolved','escalated','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_adjustment_type AS ENUM ('bonus','correction','retro','reimbursement','deduction','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_adjustment_status AS ENUM ('pending','approved','applied','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_reminder_status AS ENUM ('draft','scheduled','sent','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_reminder_cadence AS ENUM ('weekly','biweekly','one_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_comm_channel AS ENUM ('message','email','call','note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_comm_direction AS ENUM ('inbound','outbound','internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_benefit_status AS ENUM ('pending','active','inactive','terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_deduction_status AS ENUM ('active','paused','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_deduction_frequency AS ENUM ('per_paycheck','monthly','one_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payroll_issues
CREATE TABLE IF NOT EXISTS public.payroll_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category public.payroll_issue_category NOT NULL DEFAULT 'other',
  priority public.payroll_priority NOT NULL DEFAULT 'normal',
  status public.payroll_issue_status NOT NULL DEFAULT 'open',
  owner_role text,
  owner_user_id uuid,
  due_date date,
  resolution text,
  source text,
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payroll_issues_status ON public.payroll_issues(status);
CREATE INDEX IF NOT EXISTS idx_payroll_issues_employee ON public.payroll_issues(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_issues_due_date ON public.payroll_issues(due_date);

-- payroll_adjustments
CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payroll_run_id uuid REFERENCES public.payroll_runs(id) ON DELETE SET NULL,
  adjustment_type public.payroll_adjustment_type NOT NULL DEFAULT 'correction',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  hours numeric(10,2) NOT NULL DEFAULT 0,
  reason text,
  status public.payroll_adjustment_status NOT NULL DEFAULT 'pending',
  requested_by uuid,
  requested_by_name text,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  applied_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_employee ON public.payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_run ON public.payroll_adjustments(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_status ON public.payroll_adjustments(status);

-- payroll_reminders
CREATE TABLE IF NOT EXISTS public.payroll_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  audience text NOT NULL DEFAULT 'all',  -- all|state|role|employee
  state text,
  target_role text,
  target_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  cadence public.payroll_reminder_cadence NOT NULL DEFAULT 'weekly',
  status public.payroll_reminder_status NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  sent_by uuid,
  sent_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payroll_reminders_status ON public.payroll_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payroll_reminders_scheduled ON public.payroll_reminders(scheduled_for);

-- payroll_communications
CREATE TABLE IF NOT EXISTS public.payroll_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  channel public.payroll_comm_channel NOT NULL DEFAULT 'message',
  direction public.payroll_comm_direction NOT NULL DEFAULT 'outbound',
  category text NOT NULL DEFAULT 'follow_up',
  subject text,
  body text,
  status text NOT NULL DEFAULT 'open',
  related_issue_id uuid REFERENCES public.payroll_issues(id) ON DELETE SET NULL,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payroll_comms_employee ON public.payroll_communications(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_comms_category ON public.payroll_communications(category);

-- payroll_benefits
CREATE TABLE IF NOT EXISTS public.payroll_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  benefit_type text NOT NULL,  -- health|dental|vision|401k|life|other
  provider text,
  plan_name text,
  status public.payroll_benefit_status NOT NULL DEFAULT 'pending',
  effective_date date,
  end_date date,
  employee_contribution numeric(10,2) DEFAULT 0,
  employer_contribution numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payroll_benefits_employee ON public.payroll_benefits(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_benefits_status ON public.payroll_benefits(status);

-- payroll_deductions
CREATE TABLE IF NOT EXISTS public.payroll_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  deduction_type text NOT NULL,  -- garnishment|loan|uniform|other
  amount numeric(10,2) NOT NULL DEFAULT 0,
  frequency public.payroll_deduction_frequency NOT NULL DEFAULT 'per_paycheck',
  start_date date,
  end_date date,
  status public.payroll_deduction_status NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payroll_deductions_employee ON public.payroll_deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_deductions_status ON public.payroll_deductions(status);

-- Triggers
CREATE TRIGGER trg_payroll_issues_updated BEFORE UPDATE ON public.payroll_issues
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payroll_adjustments_updated BEFORE UPDATE ON public.payroll_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payroll_reminders_updated BEFORE UPDATE ON public.payroll_reminders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payroll_communications_updated BEFORE UPDATE ON public.payroll_communications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payroll_benefits_updated BEFORE UPDATE ON public.payroll_benefits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payroll_deductions_updated BEFORE UPDATE ON public.payroll_deductions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.payroll_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;

-- Policies: payroll role (view/manage)
CREATE POLICY "View payroll issues" ON public.payroll_issues FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view'));
CREATE POLICY "Manage payroll issues" ON public.payroll_issues
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE POLICY "View payroll adjustments" ON public.payroll_adjustments FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = payroll_adjustments.employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Manage payroll adjustments" ON public.payroll_adjustments
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE POLICY "View payroll reminders" ON public.payroll_reminders FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view'));
CREATE POLICY "Manage payroll reminders" ON public.payroll_reminders
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE POLICY "View payroll communications" ON public.payroll_communications FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view'));
CREATE POLICY "Manage payroll communications" ON public.payroll_communications
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE POLICY "View payroll benefits" ON public.payroll_benefits FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = payroll_benefits.employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Manage payroll benefits" ON public.payroll_benefits
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));

CREATE POLICY "View payroll deductions" ON public.payroll_deductions FOR SELECT
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = payroll_deductions.employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Manage payroll deductions" ON public.payroll_deductions
  USING (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'hr.payroll.runs.manage'));
