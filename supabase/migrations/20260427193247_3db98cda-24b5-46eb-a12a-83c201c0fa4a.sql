CREATE TABLE IF NOT EXISTS public.training_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'GraduationCap',
  color TEXT NOT NULL DEFAULT 'primary',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.training_departments(id) ON DELETE SET NULL;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS training_type TEXT NOT NULL DEFAULT 'SOP';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'Beginner';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS required_default BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS role_visibility TEXT[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS created_by UUID NULL;
UPDATE public.training_courses SET title = name WHERE title IS NULL;
UPDATE public.training_courses SET estimated_minutes = duration_minutes WHERE estimated_minutes IS NULL AND duration_minutes IS NOT NULL;
UPDATE public.training_courses SET estimated_minutes = 15 WHERE estimated_minutes IS NULL;
ALTER TABLE public.training_courses ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.training_courses ALTER COLUMN estimated_minutes SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.training_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lesson_type TEXT NOT NULL DEFAULT 'Written SOP',
  content TEXT NOT NULL DEFAULT '',
  resource_url TEXT NULL,
  video_url TEXT NULL,
  tango_url TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NULL,
  assigned_to_role TEXT NULL,
  assigned_to_department TEXT NULL,
  assigned_by UUID NULL,
  due_date DATE NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NULL,
  last_opened_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  due_date DATE NULL,
  assigned_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.training_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.training_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'Multiple choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Award',
  course_id UUID NULL REFERENCES public.training_courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_training_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.training_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_training_courses_department ON public.training_courses(department_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_course ON public.training_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_user ON public.training_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON public.training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_course ON public.training_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_training_lesson_progress_user ON public.training_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_quiz_attempts_user ON public.training_quiz_attempts(user_id);

ALTER TABLE public.training_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_departments' AND policyname='Training departments are visible to signed in users') THEN
    CREATE POLICY "Training departments are visible to signed in users" ON public.training_departments FOR SELECT TO authenticated USING (is_active = true OR has_permission(auth.uid(), 'hr.training.view'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_departments' AND policyname='Training managers can manage departments') THEN
    CREATE POLICY "Training managers can manage departments" ON public.training_departments FOR ALL TO authenticated USING (has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role)) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_lessons' AND policyname='Training lessons are visible to signed in users') THEN
    CREATE POLICY "Training lessons are visible to signed in users" ON public.training_lessons FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_lessons' AND policyname='Training managers can manage lessons') THEN
    CREATE POLICY "Training managers can manage lessons" ON public.training_lessons FOR ALL TO authenticated USING (has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role)) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_assignments' AND policyname='Users and managers can view training assignments') THEN
    CREATE POLICY "Users and managers can view training assignments" ON public.training_assignments FOR SELECT TO authenticated USING (assigned_to_user_id = auth.uid() OR assigned_to_user_id IS NULL OR has_permission(auth.uid(), 'hr.training.view'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_assignments' AND policyname='Training managers can manage assignments') THEN
    CREATE POLICY "Training managers can manage assignments" ON public.training_assignments FOR ALL TO authenticated USING (has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role)) WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_progress' AND policyname='Users and managers can view course progress') THEN
    CREATE POLICY "Users and managers can view course progress" ON public.training_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.view'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_progress' AND policyname='Users can create their own course progress') THEN
    CREATE POLICY "Users can create their own course progress" ON public.training_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_progress' AND policyname='Users and managers can update course progress') THEN
    CREATE POLICY "Users and managers can update course progress" ON public.training_progress FOR UPDATE TO authenticated USING (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role)) WITH CHECK (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_lesson_progress' AND policyname='Users and managers can view lesson progress') THEN
    CREATE POLICY "Users and managers can view lesson progress" ON public.training_lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.view'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_lesson_progress' AND policyname='Users can create their own lesson progress') THEN
    CREATE POLICY "Users can create their own lesson progress" ON public.training_lesson_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_lesson_progress' AND policyname='Users and managers can update lesson progress') THEN
    CREATE POLICY "Users and managers can update lesson progress" ON public.training_lesson_progress FOR UPDATE TO authenticated USING (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role)) WITH CHECK (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.assign'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_quizzes' AND policyname='Training quizzes are visible to signed in users') THEN
    CREATE POLICY "Training quizzes are visible to signed in users" ON public.training_quizzes FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_quiz_questions' AND policyname='Training quiz questions are visible to signed in users') THEN
    CREATE POLICY "Training quiz questions are visible to signed in users" ON public.training_quiz_questions FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_quiz_attempts' AND policyname='Users and managers can view quiz attempts') THEN
    CREATE POLICY "Users and managers can view quiz attempts" ON public.training_quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.view'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_quiz_attempts' AND policyname='Users can create their own quiz attempts') THEN
    CREATE POLICY "Users can create their own quiz attempts" ON public.training_quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_badges' AND policyname='Training badges are visible to signed in users') THEN
    CREATE POLICY "Training badges are visible to signed in users" ON public.training_badges FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_training_badges' AND policyname='Users and managers can view earned badges') THEN
    CREATE POLICY "Users and managers can view earned badges" ON public.user_training_badges FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_permission(auth.uid(), 'hr.training.view'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'exec'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_training_badges' AND policyname='Users can earn their own badges') THEN
    CREATE POLICY "Users can earn their own badges" ON public.user_training_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;