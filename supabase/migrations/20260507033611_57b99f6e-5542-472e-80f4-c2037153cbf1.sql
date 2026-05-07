
-- Add new work_setting enum values
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'leadership';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'intake';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'recruiting';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'scheduling';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'state_director';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE work_setting ADD VALUE IF NOT EXISTS 'systems';

-- Academy enums
CREATE TYPE academy_module_type AS ENUM ('training','shadowing','meeting','video','sop','quiz','reflection','task');
CREATE TYPE academy_module_status AS ENUM ('locked','available','in_progress','submitted','completed','waived');
CREATE TYPE academy_enrollment_status AS ENUM ('not_started','active','paused','completed','withdrawn');
CREATE TYPE academy_path AS ENUM ('new_state','existing_state','either');

-- Tracks
CREATE TABLE public.academy_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Phases
CREATE TABLE public.academy_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.academy_tracks(id) ON DELETE CASCADE,
  position int NOT NULL,
  name text NOT NULL,
  tagline text,
  color_token text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Weeks
CREATE TABLE public.academy_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.academy_phases(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  title text NOT NULL,
  objective text,
  outcomes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Modules
CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.academy_weeks(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  module_type academy_module_type NOT NULL,
  duration_label text,
  leader_name text,
  department text,
  is_required boolean NOT NULL DEFAULT true,
  applies_to academy_path NOT NULL DEFAULT 'either',
  applies_to_new_state_only boolean NOT NULL DEFAULT false,
  quiz jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Module resources
CREATE TABLE public.academy_module_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text,
  kind text NOT NULL DEFAULT 'link',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enrollments
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.academy_tracks(id) ON DELETE RESTRICT,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status academy_enrollment_status NOT NULL DEFAULT 'active',
  path academy_path NOT NULL DEFAULT 'existing_state',
  assigned_state text,
  mentor_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  current_week_id uuid REFERENCES public.academy_weeks(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, track_id)
);

-- Progress
CREATE TABLE public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  status academy_module_status NOT NULL DEFAULT 'available',
  score numeric,
  reflection text,
  verified_by uuid,
  verified_by_name text,
  verified_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, module_id)
);

-- Shadow sessions
CREATE TABLE public.academy_shadow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.academy_modules(id) ON DELETE SET NULL,
  shadowed_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  shadowed_name text,
  department text,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL DEFAULT 0,
  notes text,
  mentor_signoff boolean NOT NULL DEFAULT false,
  signoff_by uuid,
  signoff_by_name text,
  signoff_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Check-ins
CREATE TABLE public.academy_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.academy_modules(id) ON DELETE SET NULL,
  with_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  with_name text,
  meeting_date date NOT NULL DEFAULT CURRENT_DATE,
  agenda text,
  notes text,
  action_items text,
  leader_rating int,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz attempts
CREATE TABLE public.academy_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_academy_phases_track ON public.academy_phases(track_id, position);
CREATE INDEX idx_academy_weeks_phase ON public.academy_weeks(phase_id, week_number);
CREATE INDEX idx_academy_modules_week ON public.academy_modules(week_id, position);
CREATE INDEX idx_academy_enroll_emp ON public.academy_enrollments(employee_id);
CREATE INDEX idx_academy_progress_enroll ON public.academy_progress(enrollment_id);
CREATE INDEX idx_academy_shadow_enroll ON public.academy_shadow_sessions(enrollment_id);
CREATE INDEX idx_academy_checkins_enroll ON public.academy_checkins(enrollment_id);
CREATE INDEX idx_academy_quiz_enroll ON public.academy_quiz_attempts(enrollment_id);

-- Enable RLS
ALTER TABLE public.academy_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_module_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_shadow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Helper: is current user the trainee for this enrollment?
CREATE OR REPLACE FUNCTION public.is_academy_trainee(_enrollment_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_enrollments e
    JOIN public.employees emp ON emp.id = e.employee_id
    WHERE e.id = _enrollment_id AND emp.user_id = auth.uid()
  )
$$;

-- Curriculum content readable by all HR users
CREATE POLICY "View academy content" ON public.academy_tracks FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage academy tracks" ON public.academy_tracks FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign')) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

CREATE POLICY "View academy phases" ON public.academy_phases FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage academy phases" ON public.academy_phases FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign')) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

CREATE POLICY "View academy weeks" ON public.academy_weeks FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage academy weeks" ON public.academy_weeks FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign')) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

CREATE POLICY "View academy modules" ON public.academy_modules FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage academy modules" ON public.academy_modules FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign')) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

CREATE POLICY "View academy resources" ON public.academy_module_resources FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
CREATE POLICY "Manage academy resources" ON public.academy_module_resources FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign')) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

-- Enrollments
CREATE POLICY "View enrollments (mgr/self)" ON public.academy_enrollments FOR SELECT
  USING (has_permission(auth.uid(), 'hr.training.view') OR EXISTS (SELECT 1 FROM employees e WHERE e.id = academy_enrollments.employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Manage enrollments" ON public.academy_enrollments FOR ALL
  USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));
CREATE POLICY "Trainee update own enrollment" ON public.academy_enrollments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = academy_enrollments.employee_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.id = academy_enrollments.employee_id AND e.user_id = auth.uid()));

-- Progress
CREATE POLICY "View progress (mgr/self)" ON public.academy_progress FOR SELECT
  USING (has_permission(auth.uid(), 'hr.training.view') OR is_academy_trainee(enrollment_id));
CREATE POLICY "Manage progress (mgr)" ON public.academy_progress FOR ALL
  USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));
CREATE POLICY "Trainee insert own progress" ON public.academy_progress FOR INSERT
  WITH CHECK (is_academy_trainee(enrollment_id));
CREATE POLICY "Trainee update own progress" ON public.academy_progress FOR UPDATE
  USING (is_academy_trainee(enrollment_id))
  WITH CHECK (is_academy_trainee(enrollment_id));

-- Shadow sessions
CREATE POLICY "View shadow (mgr/self)" ON public.academy_shadow_sessions FOR SELECT
  USING (has_permission(auth.uid(), 'hr.training.view') OR is_academy_trainee(enrollment_id));
CREATE POLICY "Manage shadow (mgr)" ON public.academy_shadow_sessions FOR ALL
  USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));
CREATE POLICY "Trainee insert own shadow" ON public.academy_shadow_sessions FOR INSERT
  WITH CHECK (is_academy_trainee(enrollment_id));
CREATE POLICY "Trainee update own shadow" ON public.academy_shadow_sessions FOR UPDATE
  USING (is_academy_trainee(enrollment_id))
  WITH CHECK (is_academy_trainee(enrollment_id));

-- Check-ins
CREATE POLICY "View checkins (mgr/self)" ON public.academy_checkins FOR SELECT
  USING (has_permission(auth.uid(), 'hr.training.view') OR is_academy_trainee(enrollment_id));
CREATE POLICY "Manage checkins (mgr)" ON public.academy_checkins FOR ALL
  USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));
CREATE POLICY "Trainee insert own checkins" ON public.academy_checkins FOR INSERT
  WITH CHECK (is_academy_trainee(enrollment_id));

-- Quiz attempts
CREATE POLICY "View quiz attempts (mgr/self)" ON public.academy_quiz_attempts FOR SELECT
  USING (has_permission(auth.uid(), 'hr.training.view') OR is_academy_trainee(enrollment_id));
CREATE POLICY "Insert quiz attempts (self)" ON public.academy_quiz_attempts FOR INSERT
  WITH CHECK (is_academy_trainee(enrollment_id) OR has_permission(auth.uid(), 'hr.training.assign'));

-- Updated_at triggers
CREATE TRIGGER touch_academy_enrollments BEFORE UPDATE ON public.academy_enrollments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_academy_progress BEFORE UPDATE ON public.academy_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_academy_shadow BEFORE UPDATE ON public.academy_shadow_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- SEED CURRICULUM
-- ============================================================
DO $seed$
DECLARE
  _track uuid;
  _p1 uuid; _p2 uuid; _p3 uuid; _p4 uuid;
  _w1 uuid; _w2 uuid; _w3 uuid; _w4 uuid; _w5 uuid;
BEGIN
  INSERT INTO public.academy_tracks (name, description) VALUES
    ('Office Operations Academy', 'A guided 5-week immersion into Blossom''s systems, departments, leadership, and operational standards.')
  RETURNING id INTO _track;

  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (_track, 1, 'Foundation', 'Systems, structure, and standards', 'primary') RETURNING id INTO _p1;
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (_track, 2, 'Department Immersion', 'Hands-on across every department', 'teal') RETURNING id INTO _p2;
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (_track, 3, 'Role Application', 'Apply your training to real work', 'amber') RETURNING id INTO _p3;
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (_track, 4, 'Ownership', 'Own the operation', 'violet') RETURNING id INTO _p4;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (_p1, 1, 'Foundation & Systems Training',
     'Build a strong understanding of company structure, ABA fundamentals, and core systems.',
     ARRAY['Understand company structure','Understand expectations','Understand operational flow','Have basic systems familiarity']
    ) RETURNING id INTO _w1;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (_p2, 2, 'Department Immersion',
     'Gain hands-on exposure to each department and understand how departments interconnect.',
     ARRAY['Understand cross-department workflows','Understand operational lifecycle','Understand lead → client flow','Understand hiring process','Understand reporting structure']
    ) RETURNING id INTO _w2;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (_p3, 3, 'Role Application & State Training',
     'Apply your training — branched by whether you are launching a new state or operating in an existing one.',
     ARRAY['Operate inside Intake or State Setup','Coordinate communication','Handle operational responsibilities']
    ) RETURNING id INTO _w3;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (_p4, 4, 'Transition to Ownership — Week 4',
     'Move from observation to ownership of intake and recruiting workflows.',
     ARRAY['Manage intake flow','Coordinate teams','Track KPIs','Handle escalations']
    ) RETURNING id INTO _w4;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (_p4, 5, 'Operational Independence — Week 5',
     'Operate independently across all systems and departments.',
     ARRAY['Manage operations independently','Track and report KPIs','Coordinate across departments','Oversee state operations effectively']
    ) RETURNING id INTO _w5;

  -- Week 1 modules
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department) VALUES
    (_w1, 1, 'Team Introductions', 'Meet key team members, understand roles & responsibilities, explore the org chart.', 'meeting', '1–2 hours', 'Onboarding Team', 'People'),
    (_w1, 2, 'Leadership Training — Chad Kaufman', 'Leadership expectations, operational oversight, ABA background, company protocols.', 'meeting', '1 hour', 'Chad Kaufman', 'Leadership'),
    (_w1, 3, 'Leadership Training — Shira Lasry', 'Daily expectations, operational flow, communication standards.', 'meeting', '1 hour', 'Shira Lasry', 'Leadership'),
    (_w1, 4, 'Shadowing — Predecessor or Gary Frank', 'Sit with existing employee. Observe workflows, communication, and task management.', 'shadowing', '4–8 hours', 'Gary Frank', 'Operations'),
    (_w1, 5, 'Systems Training — CentralReach', 'SOPs, Tango walkthroughs, interactive step-by-step guides, knowledge checks.', 'training', '2–4 hours', NULL, 'Systems'),
    (_w1, 6, 'Systems Training — Monday.com', 'Workflows, board structure, automations.', 'training', '1–2 hours', NULL, 'Systems'),
    (_w1, 7, 'Backend Systems Deep Dive — Eli Berman', 'CR structure, workflow architecture, operational backend.', 'meeting', '1 hour', 'Eli Berman', 'Systems'),
    (_w1, 8, 'Video Training Library', 'Foundational video content covering ABA basics and company protocols.', 'video', '2 hours', NULL, 'Training'),
    (_w1, 9, 'Week 1 Knowledge Check', 'Validate your understanding of company structure, systems, and expectations.', 'quiz', '15 min', NULL, NULL),
    (_w1, 10, 'Week 1 Reflection', 'What stood out? What questions remain? Submit for mentor review.', 'reflection', '15 min', NULL, NULL);

  -- New-state conditional module on Week 1
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department, applies_to, applies_to_new_state_only) VALUES
    (_w1, 11, 'New State Track — Shadow Gary Frank (3 days)', 'Observe state setup process, operational launch structure, watch state-specific training videos.', 'shadowing', '3 days', 'Gary Frank', 'Operations', 'new_state', true);

  -- Week 2 modules — department immersion
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department) VALUES
    (_w2, 1, 'Intake Department Immersion', 'Lead intake flow, client onboarding, lead management, VOB handoff, intake SOPs, Monday workflows.', 'training', '2–4 hours', NULL, 'Intake'),
    (_w2, 2, 'Recruiting Department Immersion', 'RBT/BCBA recruiting, candidate pipeline, interview flow, offer & onboarding process.', 'training', '2–4 hours', NULL, 'Recruiting'),
    (_w2, 3, 'Case Management Immersion', 'Client coordination, internal communication, escalation flow.', 'training', '2 hours', NULL, 'Case Management'),
    (_w2, 4, 'Scheduling — Daylis', 'Scheduling workflows, coverage management, staffing challenges.', 'meeting', '1–2 hours', 'Daylis', 'Scheduling'),
    (_w2, 5, 'Marketing — Nick', 'Lead generation, marketing funnel, referral flow, state growth strategy.', 'meeting', '1 hour', 'Nick', 'Marketing'),
    (_w2, 6, 'Tracking & Reporting — Corey Mack', 'KPIs, reporting systems, dashboard expectations, operational metrics.', 'meeting', '1 hour', 'Corey Mack', 'Operations'),
    (_w2, 7, 'Weekly Check-in with Chad Kaufman', 'Review observations, plan next steps.', 'meeting', '30 min', 'Chad Kaufman', 'Leadership'),
    (_w2, 8, 'Daily Check-ins with Shira Lasry', 'Brief daily syncs on progress, blockers, and priorities.', 'meeting', '15 min daily', 'Shira Lasry', 'Leadership'),
    (_w2, 9, 'Week 2 Knowledge Check', 'Validate cross-department understanding.', 'quiz', '15 min', NULL, NULL),
    (_w2, 10, 'Week 2 Reflection', 'Which department surprised you? Where do you want to deepen?', 'reflection', '15 min', NULL, NULL);

  -- Week 3 — Path A (new state)
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, department, applies_to) VALUES
    (_w3, 1, 'New State — Laws & Regulations', 'State-specific laws, payor landscape, regulatory requirements.', 'training', '2 hours', 'Operations', 'new_state'),
    (_w3, 2, 'New State — Credentialing Setup', 'Stand up credentialing for the new state.', 'task', '1 day', 'Operations', 'new_state'),
    (_w3, 3, 'New State — BCBA Recruiting', 'Source and pipeline initial BCBAs in the new state.', 'task', '2 days', 'Recruiting', 'new_state'),
    (_w3, 4, 'New State — Workflow & Infrastructure', 'Build operational workflows and infrastructure for launch.', 'task', '2 days', 'Operations', 'new_state'),
    (_w3, 5, 'New State — Initial Operational Plan', 'Document the initial operational plan and submit for review.', 'reflection', '1 hour', 'Leadership', 'new_state');

  -- Week 3 — Path B (existing state)
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, department, applies_to) VALUES
    (_w3, 6, 'Existing State — Work Inside Intake', 'Manage intake workflows directly: contacts, forms, VOBs, handoffs.', 'task', '1 week', 'Intake', 'existing_state'),
    (_w3, 7, 'Existing State — Coordinate Communication', 'Lead daily comms across BCBA, RBT, and family touchpoints.', 'task', 'ongoing', 'Operations', 'existing_state'),
    (_w3, 8, 'Existing State — Handle Operational Responsibilities', 'Take on operational responsibilities under mentor guidance.', 'task', 'ongoing', 'Operations', 'existing_state');

  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, department) VALUES
    (_w3, 9, 'Week 3 Mentor Check-in', 'Mentor signs off on application readiness.', 'meeting', '30 min', 'Leadership'),
    (_w3, 10, 'Week 3 Reflection', 'What did you ship? Where did you struggle? What''s next?', 'reflection', '15 min', NULL);

  -- Week 4 — Ownership begins
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, department) VALUES
    (_w4, 1, 'Own the Intake Pipeline', 'Run the intake pipeline end-to-end with mentor supervision.', 'task', '1 week', 'Intake'),
    (_w4, 2, 'Own the Recruiting Pipeline', 'Manage recruiting pipeline activities and reporting.', 'task', '1 week', 'Recruiting'),
    (_w4, 3, 'Track KPIs Daily', 'Log daily KPI snapshots, surface blockers, drive resolution.', 'task', 'daily', 'Operations'),
    (_w4, 4, 'Handle Escalations', 'Triage and resolve escalations under leadership coaching.', 'task', 'as needed', 'Operations'),
    (_w4, 5, 'Weekly Leadership Eval', 'Leadership evaluation of operational ownership.', 'meeting', '30 min', 'Leadership'),
    (_w4, 6, 'Week 4 Reflection', 'Where did you grow? Where do you still need support?', 'reflection', '15 min', NULL);

  -- Week 5 — Independence
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, department) VALUES
    (_w5, 1, 'Independent Operations', 'Run operations independently. Mentor observes, coaches as needed.', 'task', '1 week', 'Operations'),
    (_w5, 2, 'KPI Reporting Out', 'Present weekly KPIs to leadership.', 'meeting', '45 min', 'Leadership'),
    (_w5, 3, 'Cross-Department Coordination', 'Lead a cross-department coordination meeting.', 'task', '1 hour', 'Operations'),
    (_w5, 4, 'State Operations Oversight', 'Demonstrate effective oversight of state operations.', 'task', 'ongoing', 'Operations'),
    (_w5, 5, 'Final Mentor Sign-off', 'Mentor and leadership sign off on academy completion.', 'meeting', '1 hour', 'Leadership'),
    (_w5, 6, 'Final Reflection & Next Steps', 'Reflect on the journey. Set 30/60/90-day goals.', 'reflection', '30 min', NULL);
END $seed$;
