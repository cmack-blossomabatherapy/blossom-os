-- ============================================================
-- HR Phase 2 — Time Clock + Hours Tracker
-- ============================================================

-- Enums
CREATE TYPE public.punch_kind AS ENUM ('clock_in','clock_out','break_start','break_end');
CREATE TYPE public.punch_source AS ENUM ('kiosk','manual','manager_edit','import');
CREATE TYPE public.punch_status AS ENUM ('pending','approved','rejected','locked');

CREATE TYPE public.attendance_exception_kind AS ENUM (
  'missed_clock_in','missed_clock_out','late_arrival','early_departure',
  'long_break','overtime_risk','manual_edit_pending','duplicate_punch','outside_clinic'
);
CREATE TYPE public.attendance_exception_status AS ENUM ('open','acknowledged','resolved','dismissed');

CREATE TYPE public.timesheet_status AS ENUM ('draft','submitted','approved','rejected','locked');

-- ============================================================
-- time_clock_punches
-- ============================================================
CREATE TABLE public.time_clock_punches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  clinic text,
  kind public.punch_kind NOT NULL,
  source public.punch_source NOT NULL DEFAULT 'kiosk',
  status public.punch_status NOT NULL DEFAULT 'approved',
  punch_at timestamptz NOT NULL DEFAULT now(),
  scheduled_at timestamptz,
  recorded_by uuid,
  recorded_by_name text,
  edited_by uuid,
  edited_at timestamptz,
  edit_reason text,
  pay_period_start date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_punches_employee_time ON public.time_clock_punches(employee_id, punch_at DESC);
CREATE INDEX idx_punches_clinic_time   ON public.time_clock_punches(clinic, punch_at DESC);
CREATE INDEX idx_punches_status        ON public.time_clock_punches(status);

ALTER TABLE public.time_clock_punches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View time clock punches"
  ON public.time_clock_punches FOR SELECT
  USING (public.has_permission(auth.uid(),'hr.timeclock.view'));

CREATE POLICY "Insert time clock punches"
  ON public.time_clock_punches FOR INSERT
  WITH CHECK (public.has_permission(auth.uid(),'hr.timeclock.kiosk') OR public.has_permission(auth.uid(),'hr.timeclock.approve'));

CREATE POLICY "Update time clock punches"
  ON public.time_clock_punches FOR UPDATE
  USING (public.has_permission(auth.uid(),'hr.timeclock.approve'));

CREATE POLICY "Delete time clock punches"
  ON public.time_clock_punches FOR DELETE
  USING (public.has_permission(auth.uid(),'hr.timeclock.lock'));

CREATE TRIGGER trg_punches_touch
  BEFORE UPDATE ON public.time_clock_punches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- attendance_exceptions
-- ============================================================
CREATE TABLE public.attendance_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  clinic text,
  kind public.attendance_exception_kind NOT NULL,
  status public.attendance_exception_status NOT NULL DEFAULT 'open',
  occurred_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  related_punch_id uuid REFERENCES public.time_clock_punches(id) ON DELETE SET NULL,
  detail text,
  resolution text,
  resolved_by uuid,
  resolved_by_name text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exceptions_employee_date ON public.attendance_exceptions(employee_id, occurred_on DESC);
CREATE INDEX idx_exceptions_status        ON public.attendance_exceptions(status);
CREATE INDEX idx_exceptions_clinic        ON public.attendance_exceptions(clinic);

ALTER TABLE public.attendance_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View attendance exceptions"
  ON public.attendance_exceptions FOR SELECT
  USING (public.has_permission(auth.uid(),'hr.timeclock.view'));

CREATE POLICY "Manage attendance exceptions"
  ON public.attendance_exceptions FOR ALL
  USING (public.has_permission(auth.uid(),'hr.timeclock.approve'))
  WITH CHECK (public.has_permission(auth.uid(),'hr.timeclock.approve'));

CREATE TRIGGER trg_exceptions_touch
  BEFORE UPDATE ON public.attendance_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- hours_timesheets (weekly rollup per employee)
-- ============================================================
CREATE TABLE public.hours_timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status public.timesheet_status NOT NULL DEFAULT 'draft',
  total_hours numeric(8,2) NOT NULL DEFAULT 0,
  overtime_hours numeric(8,2) NOT NULL DEFAULT 0,
  submitted_at timestamptz,
  submitted_by uuid,
  approved_at timestamptz,
  approved_by uuid,
  approved_by_name text,
  locked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_start)
);
CREATE INDEX idx_timesheets_employee_period ON public.hours_timesheets(employee_id, period_start DESC);
CREATE INDEX idx_timesheets_status          ON public.hours_timesheets(status);

ALTER TABLE public.hours_timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View timesheets"
  ON public.hours_timesheets FOR SELECT
  USING (
    public.has_permission(auth.uid(),'hr.hours.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  );

CREATE POLICY "Insert timesheets"
  ON public.hours_timesheets FOR INSERT
  WITH CHECK (
    public.has_permission(auth.uid(),'hr.hours.submit')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  );

CREATE POLICY "Update timesheets"
  ON public.hours_timesheets FOR UPDATE
  USING (
    public.has_permission(auth.uid(),'hr.hours.approve')
    OR (
      EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
      AND status IN ('draft','rejected')
    )
  );

CREATE POLICY "Delete timesheets"
  ON public.hours_timesheets FOR DELETE
  USING (public.has_permission(auth.uid(),'hr.hours.approve'));

CREATE TRIGGER trg_timesheets_touch
  BEFORE UPDATE ON public.hours_timesheets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- hours_timesheet_entries (per-day lines)
-- ============================================================
CREATE TABLE public.hours_timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id uuid NOT NULL REFERENCES public.hours_timesheets(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  clinic text,
  hours numeric(6,2) NOT NULL DEFAULT 0,
  category text DEFAULT 'regular',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_timesheet_entries_sheet ON public.hours_timesheet_entries(timesheet_id, work_date);

ALTER TABLE public.hours_timesheet_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View timesheet entries"
  ON public.hours_timesheet_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hours_timesheets t
      WHERE t.id = timesheet_id
        AND (
          public.has_permission(auth.uid(),'hr.hours.view')
          OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = t.employee_id AND e.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Manage timesheet entries"
  ON public.hours_timesheet_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.hours_timesheets t
      WHERE t.id = timesheet_id
        AND (
          public.has_permission(auth.uid(),'hr.hours.approve')
          OR (
            EXISTS (SELECT 1 FROM public.employees e WHERE e.id = t.employee_id AND e.user_id = auth.uid())
            AND t.status IN ('draft','rejected')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hours_timesheets t
      WHERE t.id = timesheet_id
        AND (
          public.has_permission(auth.uid(),'hr.hours.approve')
          OR (
            EXISTS (SELECT 1 FROM public.employees e WHERE e.id = t.employee_id AND e.user_id = auth.uid())
            AND t.status IN ('draft','rejected')
          )
        )
    )
  );

CREATE TRIGGER trg_timesheet_entries_touch
  BEFORE UPDATE ON public.hours_timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Permissions catalog + role grants
-- ============================================================
INSERT INTO public.permissions (key, module, label, description) VALUES
  ('hr.timeclock.view',    'hr', 'View Time Clock',         'See punches, attendance views, and exceptions'),
  ('hr.timeclock.kiosk',   'hr', 'Use Time Clock Kiosk',    'Record punches via kiosk PIN entry'),
  ('hr.timeclock.approve', 'hr', 'Approve Time Clock',      'Edit punches and resolve attendance exceptions'),
  ('hr.timeclock.lock',    'hr', 'Lock Time Clock Periods', 'Lock punches into payroll, delete punches'),
  ('hr.hours.view',        'hr', 'View Hours / Timesheets', 'View all employee timesheets'),
  ('hr.hours.submit',      'hr', 'Submit Timesheets',       'Submit timesheets on behalf of employees'),
  ('hr.hours.approve',     'hr', 'Approve Timesheets',      'Approve, reject, and lock timesheets')
ON CONFLICT (key) DO NOTHING;

-- Grant to roles
INSERT INTO public.role_permissions (role, permission_key)
SELECT r::public.app_role, p
FROM (VALUES
  ('admin','hr.timeclock.view'),('admin','hr.timeclock.kiosk'),('admin','hr.timeclock.approve'),('admin','hr.timeclock.lock'),
  ('admin','hr.hours.view'),('admin','hr.hours.submit'),('admin','hr.hours.approve'),
  ('hr_admin','hr.timeclock.view'),('hr_admin','hr.timeclock.kiosk'),('hr_admin','hr.timeclock.approve'),('hr_admin','hr.timeclock.lock'),
  ('hr_admin','hr.hours.view'),('hr_admin','hr.hours.submit'),('hr_admin','hr.hours.approve'),
  ('hr_manager','hr.timeclock.view'),('hr_manager','hr.timeclock.kiosk'),('hr_manager','hr.timeclock.approve'),
  ('hr_manager','hr.hours.view'),('hr_manager','hr.hours.approve'),
  ('payroll_admin','hr.timeclock.view'),('payroll_admin','hr.timeclock.approve'),('payroll_admin','hr.timeclock.lock'),
  ('payroll_admin','hr.hours.view'),('payroll_admin','hr.hours.approve'),
  ('clinic_director','hr.timeclock.view'),('clinic_director','hr.timeclock.kiosk'),('clinic_director','hr.timeclock.approve'),
  ('clinic_director','hr.hours.view'),('clinic_director','hr.hours.approve'),
  ('state_director','hr.timeclock.view'),('state_director','hr.hours.view'),
  ('ops_manager','hr.timeclock.view'),('ops_manager','hr.timeclock.approve'),('ops_manager','hr.hours.view'),('ops_manager','hr.hours.approve'),
  ('exec','hr.timeclock.view'),('exec','hr.hours.view')
) AS v(r,p)
ON CONFLICT DO NOTHING;