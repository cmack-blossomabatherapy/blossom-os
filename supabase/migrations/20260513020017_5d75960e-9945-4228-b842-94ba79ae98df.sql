
-- =========================================================================
-- HR Admin Assistant Track — schema additions
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.academy_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.academy_tracks(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, code)
);

CREATE TABLE IF NOT EXISTS public.academy_competency_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES public.academy_competencies(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  notes text,
  updated_by uuid,
  updated_by_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, competency_id)
);

CREATE TABLE IF NOT EXISTS public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.academy_tracks(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  awarded_after_phase_id uuid REFERENCES public.academy_phases(id) ON DELETE SET NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, code)
);

CREATE TABLE IF NOT EXISTS public.academy_user_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,
  certificate_id uuid NOT NULL REFERENCES public.academy_certificates(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by uuid,
  awarded_by_name text,
  UNIQUE (enrollment_id, certificate_id)
);

ALTER TABLE public.academy_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_competency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_user_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View academy competencies" ON public.academy_competencies;
CREATE POLICY "View academy competencies" ON public.academy_competencies
  FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
DROP POLICY IF EXISTS "Manage academy competencies" ON public.academy_competencies;
CREATE POLICY "Manage academy competencies" ON public.academy_competencies
  FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

DROP POLICY IF EXISTS "View academy certificates" ON public.academy_certificates;
CREATE POLICY "View academy certificates" ON public.academy_certificates
  FOR SELECT USING (has_permission(auth.uid(), 'hr.view'));
DROP POLICY IF EXISTS "Manage academy certificates" ON public.academy_certificates;
CREATE POLICY "Manage academy certificates" ON public.academy_certificates
  FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

DROP POLICY IF EXISTS "View own competency scores" ON public.academy_competency_scores;
CREATE POLICY "View own competency scores" ON public.academy_competency_scores
  FOR SELECT USING (
    public.is_academy_trainee(enrollment_id) OR has_permission(auth.uid(), 'hr.view')
  );
DROP POLICY IF EXISTS "Manage competency scores" ON public.academy_competency_scores;
CREATE POLICY "Manage competency scores" ON public.academy_competency_scores
  FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

DROP POLICY IF EXISTS "View own certificates" ON public.academy_user_certificates;
CREATE POLICY "View own certificates" ON public.academy_user_certificates
  FOR SELECT USING (
    public.is_academy_trainee(enrollment_id) OR has_permission(auth.uid(), 'hr.view')
  );
DROP POLICY IF EXISTS "Manage user certificates" ON public.academy_user_certificates;
CREATE POLICY "Manage user certificates" ON public.academy_user_certificates
  FOR ALL USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

-- =========================================================================
-- Seed: HR Admin Assistant track (idempotent — deletes prior copy)
-- =========================================================================

DO $seed$
DECLARE
  v_track_id uuid;
  v_phase1 uuid; v_phase2 uuid; v_phase3 uuid; v_phase4 uuid;
  v_week1 uuid;  v_week2 uuid;  v_week3 uuid;  v_week4 uuid;
BEGIN
  -- Wipe prior HR Admin Assistant track to ensure clean re-seed
  DELETE FROM public.academy_tracks WHERE name = 'HR Admin Assistant';

  INSERT INTO public.academy_tracks (name, description, is_active)
  VALUES (
    'HR Admin Assistant',
    'A calm, guided 4-week onboarding for new HR Admin Assistants — culture, systems, employee support, audits, and independent operations.',
    true
  )
  RETURNING id INTO v_track_id;

  -- Phases (one per week, calm progression of color tokens)
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (v_track_id, 1, 'Foundation', 'Welcome, culture, and the systems you''ll live in', 'teal')
  RETURNING id INTO v_phase1;
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (v_track_id, 2, 'Employee Support', 'Onboarding workflows and access management', 'primary')
  RETURNING id INTO v_phase2;
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (v_track_id, 3, 'Operations', 'Audits, organization, and HR documentation', 'violet')
  RETURNING id INTO v_phase3;
  INSERT INTO public.academy_phases (track_id, position, name, tagline, color_token) VALUES
    (v_track_id, 4, 'Independent Application', 'Workers comp, accountability, and operational excellence', 'amber')
  RETURNING id INTO v_phase4;

  -- Weeks
  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (v_phase1, 1, 'Foundation, Culture & Systems',
     'Get grounded in Blossom''s mission, meet the team, and learn the systems you''ll use every day.',
     ARRAY['Understand mission, vision, and core values',
           'Recognize each leader and their role',
           'Log in to all required systems',
           'Send first welcome message in Teams'])
  RETURNING id INTO v_week1;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (v_phase2, 2, 'Employee Support & Access Management',
     'Confidently answer routine HR questions and create access for new hires.',
     ARRAY['Triage employee questions accurately',
           'Create user accounts end-to-end',
           'Set up email + phone for a new hire',
           'Run an HR request through to completion'])
  RETURNING id INTO v_week2;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (v_phase3, 3, 'Operations, Audits & Organization',
     'Own the operational rhythm: audits, mail, SharePoint, and documentation.',
     ARRAY['Complete a Jivetel audit',
           'Run an email audit',
           'Organize SharePoint to standard',
           'Process incoming mail correctly'])
  RETURNING id INTO v_week3;

  INSERT INTO public.academy_weeks (phase_id, week_number, title, objective, outcomes) VALUES
    (v_phase4, 4, 'Independent Application',
     'Operate independently on workers comp support and end-to-end onboarding.',
     ARRAY['Handle a workers comp case from intake to follow-up',
           'Lead an onboarding from start to finish',
           'Communicate proactively with employees and Nikki',
           'Demonstrate operational excellence'])
  RETURNING id INTO v_week4;

  -- ============== WEEK 1 modules ==============
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department, is_required) VALUES
    (v_week1, 1, 'Welcome to Blossom',         'A short, warm welcome from leadership and a tour of what your first month looks like.', 'video',     '6 min',  'Cory Mack',         'HR', true),
    (v_week1, 2, 'Mission & Vision',           'Why Blossom exists and the families we serve.',                                          'training',  '10 min', 'Cory Mack',         'HR', true),
    (v_week1, 3, 'Core Values in Practice',    'How our values show up in HR — calm, clarity, and care.',                                'training',  '10 min', 'Nikki Goldenberg',  'HR', true),
    (v_week1, 4, 'Meet the Team',              'Faces, roles, and how we work together.',                                                'video',     '8 min',  'Nikki Goldenberg',  'HR', true),
    (v_week1, 5, 'Org Chart Walkthrough',      'Where you sit and who supports each function.',                                          'training',  '5 min',  'Nikki Goldenberg',  'HR', true),
    (v_week1, 6, 'How Blossom Works',          'A bird''s-eye view of the operation across intake, clinical, scheduling, and HR.',       'training',  '12 min', 'Cory Mack',         'HR', true),
    (v_week1, 7, 'Systems Tour: Viventium',    'Logging in, profile basics, and where employee data lives.',                             'sop',       '15 min', 'Nikki Goldenberg',  'HR', true),
    (v_week1, 8, 'Systems Tour: Monday.com',   'Boards we use, daily check-ins, and how to update items.',                               'sop',       '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week1, 9, 'Systems Tour: Teams + Outlook','Channels you''ll live in, etiquette, and signature setup.',                            'sop',       '10 min', 'Nikki Goldenberg',  'HR', true),
    (v_week1,10, 'Systems Tour: SharePoint',   'Folder structure, permissions, and where files belong.',                                 'sop',       '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week1,11, 'Systems Tour: Tapcheck + Jivetel','Pay-on-demand and phone system basics.',                                            'sop',       '8 min',  'Nikki Goldenberg',  'HR', true),
    (v_week1,12, 'HR Request Forms',           'The forms employees use and how requests come to you.',                                  'sop',       '10 min', 'Nikki Goldenberg',  'HR', true),
    (v_week1,13, 'Week 1 Reflection',          'Three things that landed, one question for Nikki.',                                      'reflection','5 min',  'Nikki Goldenberg',  'HR', true),
    (v_week1,14, 'Week 1 Quiz',                'Quick check on culture, team, and systems.',                                             'quiz',      '8 min',  'Nikki Goldenberg',  'HR', true);

  -- ============== WEEK 2 modules ==============
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department, is_required) VALUES
    (v_week2, 1, 'Answering Employee Questions','Tone, triage, and the playbook for common questions.',                                  'training',  '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week2, 2, 'Onboarding Workflow Overview','The full path from offer accepted to first paycheck.',                                  'training',  '15 min', 'Nikki Goldenberg',  'HR', true),
    (v_week2, 3, 'Creating User Accounts',     'Step-by-step: Outlook, Teams, Viventium, and CentralReach.',                             'sop',       '20 min', 'Nikki Goldenberg',  'HR', true),
    (v_week2, 4, 'Email + Phone Setup',        'Standards for email aliases, signatures, and phone provisioning.',                       'sop',       '15 min', 'Nikki Goldenberg',  'HR', true),
    (v_week2, 5, 'Permissions & System Access','Right level, right person — when in doubt, ask.',                                        'sop',       '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week2, 6, 'HR Request Workflow Simulation','Practice run: process three sample requests end-to-end.',                             'task',      '20 min', 'Nikki Goldenberg',  'HR', true),
    (v_week2, 7, 'Shadow Nikki: Onboarding Live','Sit with Nikki for two real onboardings this week.',                                  'shadowing', '2 hrs',  'Nikki Goldenberg',  'HR', true),
    (v_week2, 8, 'Week 2 Quiz',                'Access management and onboarding workflow check.',                                       'quiz',      '10 min', 'Nikki Goldenberg',  'HR', true);

  -- ============== WEEK 3 modules ==============
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department, is_required) VALUES
    (v_week3, 1, 'Jivetel Audits',             'How we audit phone usage and what to flag.',                                              'sop',       '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week3, 2, 'Email Audits',               'Inbox hygiene, distribution lists, and offboarding cleanup.',                            'sop',       '10 min', 'Nikki Goldenberg',  'HR', true),
    (v_week3, 3, 'SharePoint Organization',    'Naming conventions, folder structure, and permission reviews.',                          'sop',       '15 min', 'Nikki Goldenberg',  'HR', true),
    (v_week3, 4, 'Scanning Mail',              'How to scan, name, and route incoming mail.',                                            'sop',       '8 min',  'Nikki Goldenberg',  'HR', true),
    (v_week3, 5, 'HR Documentation Standards', 'What we keep, where, and for how long.',                                                 'training',  '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week3, 6, 'Operational Standards',      'Daily/weekly/monthly rhythm for an HR Admin Assistant.',                                 'training',  '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week3, 7, 'Week 3 Capstone Task',       'Run a SharePoint cleanup on one folder and document what you changed.',                  'task',      '45 min', 'Nikki Goldenberg',  'HR', true),
    (v_week3, 8, 'Week 3 Quiz',                'Operations and audits check.',                                                           'quiz',      '10 min', 'Nikki Goldenberg',  'HR', true);

  -- ============== WEEK 4 modules ==============
  INSERT INTO public.academy_modules (week_id, position, title, description, module_type, duration_label, leader_name, department, is_required) VALUES
    (v_week4, 1, 'Workers Comp Support',       'How to support an injured employee from report to follow-up.',                           'training',  '15 min', 'Nikki Goldenberg',  'HR', true),
    (v_week4, 2, 'Independent Workflow Handling','Owning a request from inbox to resolution without hand-holding.',                      'training',  '12 min', 'Nikki Goldenberg',  'HR', true),
    (v_week4, 3, 'Employee Communication',     'Templates, tone, and timing for common situations.',                                     'training',  '10 min', 'Nikki Goldenberg',  'HR', true),
    (v_week4, 4, 'Run an Onboarding Solo',     'Lead one full onboarding with Nikki observing only.',                                    'task',      '3 hrs',  'Nikki Goldenberg',  'HR', true),
    (v_week4, 5, 'Accountability Check-in',    'Self-assessment + 1:1 with Nikki on competencies.',                                      'meeting',   '30 min', 'Nikki Goldenberg',  'HR', true),
    (v_week4, 6, 'Operational Excellence Reflection','What you learned and what you''ll improve next month.',                            'reflection','10 min', 'Nikki Goldenberg',  'HR', true),
    (v_week4, 7, 'Final Capstone Quiz',        'Comprehensive check across all four weeks.',                                             'quiz',      '20 min', 'Nikki Goldenberg',  'HR', true),
    (v_week4, 8, 'Graduation: Blossom HR Certified','Sign-off from Nikki and certificate awarded.',                                      'meeting',   '20 min', 'Nikki Goldenberg',  'HR', true);

  -- ============== Competencies ==============
  INSERT INTO public.academy_competencies (track_id, code, name, description, position) VALUES
    (v_track_id, 'communication',     'Communication',      'Clarity, tone, and timeliness across email, Teams, and phone.', 1),
    (v_track_id, 'organization',      'Organization',       'Files, follow-ups, and personal task management.',              2),
    (v_track_id, 'onboarding',        'Onboarding',         'Run an onboarding end-to-end without missed steps.',            3),
    (v_track_id, 'employee_support',  'Employee Support',   'Handle employee questions with empathy and accuracy.',          4),
    (v_track_id, 'hr_systems',        'HR Systems',         'Comfort with Viventium, Monday, Teams, SharePoint, Jivetel.',   5),
    (v_track_id, 'professionalism',   'Professionalism',    'Reliability, discretion, and presence.',                        6),
    (v_track_id, 'documentation',     'Documentation',      'What to record, where, and to what standard.',                  7);

  -- ============== Certificates ==============
  INSERT INTO public.academy_certificates (track_id, code, name, description, awarded_after_phase_id, position) VALUES
    (v_track_id, 'hr_foundations',     'HR Foundations',      'Awarded after completing Week 1 — culture and systems mastery.',         v_phase1, 1),
    (v_track_id, 'employee_support',   'Employee Support',    'Awarded after completing Week 2 — access and onboarding workflows.',     v_phase2, 2),
    (v_track_id, 'hr_operations',      'HR Operations',       'Awarded after completing Week 3 — audits, organization, documentation.', v_phase3, 3),
    (v_track_id, 'onboarding_systems', 'Onboarding Systems',  'Demonstrated ownership of the onboarding system end-to-end.',            v_phase4, 4),
    (v_track_id, 'blossom_hr_certified','Blossom HR Certified','Final certification — ready to operate independently.',                 v_phase4, 5);
END
$seed$;

-- =========================================================================
-- Provision testhr@ as HR Admin Assistant + reset + lock app
-- =========================================================================

DO $tester$
DECLARE
  v_user_id  uuid := '62a6d0d0-7c8c-4e13-acdd-75030232ebe0';
  v_track_id uuid;
  v_first_week_id uuid;
  v_emp_id uuid;
  v_mentor_id uuid := 'b33cc72a-8a4b-4da2-b09c-fecb9d2651a5';
BEGIN
  SELECT id INTO v_track_id FROM public.academy_tracks WHERE name = 'HR Admin Assistant';
  SELECT w.id INTO v_first_week_id
    FROM public.academy_weeks w
    JOIN public.academy_phases p ON p.id = w.phase_id
   WHERE p.track_id = v_track_id
   ORDER BY w.week_number ASC
   LIMIT 1;

  -- Ensure an employees row exists for testhr
  SELECT id INTO v_emp_id FROM public.employees WHERE user_id = v_user_id;
  IF v_emp_id IS NULL THEN
    INSERT INTO public.employees (
      user_id, first_name, last_name, email, job_title, state,
      employment_type, pay_type, work_setting, status, hire_date, start_date,
      manager_id, department_id
    ) VALUES (
      v_user_id, 'Test', 'HR', 'testhr@blossomabatherapy.com',
      'HR Admin Assistant', 'NJ',
      'part_time', 'hourly', 'office', 'pending_start', CURRENT_DATE, CURRENT_DATE,
      v_mentor_id, NULL
    )
    RETURNING id INTO v_emp_id;
  ELSE
    UPDATE public.employees
       SET job_title = 'HR Admin Assistant',
           manager_id = COALESCE(manager_id, v_mentor_id),
           updated_at = now()
     WHERE id = v_emp_id;
  END IF;

  -- Reset prior academy data for this employee
  DELETE FROM public.academy_progress
   WHERE enrollment_id IN (SELECT id FROM public.academy_enrollments WHERE employee_id = v_emp_id);
  DELETE FROM public.academy_shadow_sessions
   WHERE enrollment_id IN (SELECT id FROM public.academy_enrollments WHERE employee_id = v_emp_id);
  DELETE FROM public.academy_checkins
   WHERE enrollment_id IN (SELECT id FROM public.academy_enrollments WHERE employee_id = v_emp_id);
  DELETE FROM public.academy_quiz_attempts
   WHERE enrollment_id IN (SELECT id FROM public.academy_enrollments WHERE employee_id = v_emp_id);
  DELETE FROM public.academy_competency_scores
   WHERE enrollment_id IN (SELECT id FROM public.academy_enrollments WHERE employee_id = v_emp_id);
  DELETE FROM public.academy_user_certificates
   WHERE enrollment_id IN (SELECT id FROM public.academy_enrollments WHERE employee_id = v_emp_id);
  DELETE FROM public.academy_enrollments WHERE employee_id = v_emp_id;

  -- Fresh enrollment in HR Admin Assistant
  INSERT INTO public.academy_enrollments (
    employee_id, track_id, path, status, mentor_employee_id, current_week_id, start_date, notes
  ) VALUES (
    v_emp_id, v_track_id, 'existing_state', 'active', v_mentor_id, v_first_week_id, CURRENT_DATE,
    'Fresh start — HR Admin Assistant onboarding (assigned by system).'
  );

  -- Route locks: deactivate prior locks for this user, then re-add a focused set
  UPDATE public.onboarding_route_locks SET active = false WHERE user_id = v_user_id;
  INSERT INTO public.onboarding_route_locks (user_id, route_pattern, reason, locked_by, active) VALUES
    (v_user_id, '/admin/*',                     'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr',                          'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/dashboard',                'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/onboarding',               'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/payroll',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/training-dashboard',       'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/training-statistics',      'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/training-assign',          'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/training',                 'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/reviews',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/recognition',              'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/announcements',            'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/announcements-feed',       'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/reports',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/settings',                 'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/notification-settings',    'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/hours',                    'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/time-clock',               'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/time-clock-kiosk',         'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/journey',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/hr/track-assign',             'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/leads',                       'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/leads/*',                     'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/clients',                     'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/clients/*',                   'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/pipeline',                    'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/authorizations',              'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/authorizations/*',            'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/authorizations-dashboard',    'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/scheduling',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/scheduling-dashboard',        'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/staffing',                    'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/staffing-dashboard',          'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/qa',                          'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/qa/*',                        'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/qa-dashboard',                'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/clinics',                     'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/clinic-dashboard',            'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/finance-dashboard',           'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/recruiting',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/recruiting-dashboard',        'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/intake-dashboard',            'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/operations',                  'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/phone-calls',                 'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/documents',                   'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/tasks',                       'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/reports',                     'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/automations',                 'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/settings',                    'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/intelligence/*',              'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/blossom/*',                   'Locked until HR Admin Assistant onboarding completes', v_user_id, true),
    (v_user_id, '/enterprise/*',                'Locked until HR Admin Assistant onboarding completes', v_user_id, true);
END
$tester$;
