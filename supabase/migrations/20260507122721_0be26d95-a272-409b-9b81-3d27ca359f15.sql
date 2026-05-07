
-- ============================================================================
-- 1. WIPE SEED DATA (keep employees, departments, onboarding templates, academy structure)
-- ============================================================================
DELETE FROM public.training_quiz_questions;
DELETE FROM public.training_quizzes;
DELETE FROM public.training_lessons;
DELETE FROM public.training_lesson_progress;
DELETE FROM public.training_quiz_attempts;
DELETE FROM public.training_progress;
DELETE FROM public.training_assignments;
DELETE FROM public.training_followups;
DELETE FROM public.training_track_courses;
DELETE FROM public.training_track_enrollments;
DELETE FROM public.training_badges;
DELETE FROM public.employee_trainings;
DELETE FROM public.training_courses;
-- keep training_tracks (RBT/BCBA structure), training_module_defaults, training_departments

DELETE FROM public.hr_announcement_reads;
DELETE FROM public.hr_announcements;
DELETE FROM public.hr_resources;
DELETE FROM public.knowledge_chunks;

DELETE FROM public.employee_onboarding_tasks;
DELETE FROM public.employee_onboarding;
DELETE FROM public.employee_timeline;
DELETE FROM public.academy_audit_log;
DELETE FROM public.academy_enrollments;
DELETE FROM public.payroll_run_items;
DELETE FROM public.payroll_runs;

-- ============================================================================
-- 2. EMPLOYEE TIMELINE LIFECYCLE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_employee_timeline_event(
  _employee_id uuid, _event_type text, _description text, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _actor uuid := auth.uid(); _name text;
BEGIN
  IF _actor IS NOT NULL THEN
    SELECT display_name INTO _name FROM public.profiles WHERE user_id = _actor;
  END IF;
  INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_by, created_by_name)
  VALUES (_employee_id, _event_type, _description, COALESCE(_metadata, '{}'::jsonb), _actor, _name);
END $$;

-- Employee status / job changes
CREATE OR REPLACE FUNCTION public.trg_log_employee_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.id, 'hired',
      concat('Employee record created: ', NEW.first_name, ' ', NEW.last_name),
      jsonb_build_object('hire_date', NEW.hire_date, 'job_title', NEW.job_title));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_employee_timeline_event(NEW.id, 'status_changed',
      concat('Status changed from ', OLD.status, ' to ', NEW.status),
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  IF NEW.job_title IS DISTINCT FROM OLD.job_title THEN
    PERFORM public.log_employee_timeline_event(NEW.id, 'job_title_changed',
      concat('Title changed from "', COALESCE(OLD.job_title, '—'), '" to "', COALESCE(NEW.job_title, '—'), '"'),
      jsonb_build_object('from', OLD.job_title, 'to', NEW.job_title));
  END IF;
  IF NEW.department_id IS DISTINCT FROM OLD.department_id THEN
    PERFORM public.log_employee_timeline_event(NEW.id, 'department_changed',
      'Department updated', jsonb_build_object('from', OLD.department_id, 'to', NEW.department_id));
  END IF;
  IF NEW.termination_date IS DISTINCT FROM OLD.termination_date AND NEW.termination_date IS NOT NULL THEN
    PERFORM public.log_employee_timeline_event(NEW.id, 'terminated',
      concat('Termination date set to ', NEW.termination_date::text),
      jsonb_build_object('termination_date', NEW.termination_date));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_employees_timeline ON public.employees;
CREATE TRIGGER trg_employees_timeline
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_change();

-- Employee training status changes
CREATE OR REPLACE FUNCTION public.trg_log_employee_training()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_name text;
BEGIN
  SELECT COALESCE(title, name) INTO _course_name FROM public.training_courses WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'training_assigned',
      concat('Assigned training: ', COALESCE(_course_name, 'course')),
      jsonb_build_object('course_id', NEW.course_id, 'due_date', NEW.due_date, 'required', true));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status::text = 'completed' THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'training_completed',
        concat('Completed training: ', COALESCE(_course_name, 'course')),
        jsonb_build_object('course_id', NEW.course_id, 'score', NEW.score, 'completed_at', NEW.completed_at));
    ELSIF NEW.status::text = 'in_progress' AND OLD.status::text = 'assigned' THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'training_started',
        concat('Started training: ', COALESCE(_course_name, 'course')),
        jsonb_build_object('course_id', NEW.course_id));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_employee_trainings_timeline ON public.employee_trainings;
CREATE TRIGGER trg_employee_trainings_timeline
  AFTER INSERT OR UPDATE ON public.employee_trainings
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_training();

-- Employee review milestones
CREATE OR REPLACE FUNCTION public.trg_log_employee_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'review_scheduled',
      concat('Review scheduled (', NEW.review_type::text, ')'),
      jsonb_build_object('review_id', NEW.id, 'due_date', NEW.due_date));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'review_completed',
        concat('Review completed (', NEW.review_type::text, ')'),
        jsonb_build_object('review_id', NEW.id, 'rating', NEW.overall_rating));
    END IF;
    IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'review_acknowledged',
        'Review acknowledged by employee', jsonb_build_object('review_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_employee_reviews_timeline ON public.employee_reviews;
CREATE TRIGGER trg_employee_reviews_timeline
  AFTER INSERT OR UPDATE ON public.employee_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_review();

-- Onboarding task completion
CREATE OR REPLACE FUNCTION public.trg_log_onboarding_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _employee_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.completed AND NOT OLD.completed THEN
    SELECT employee_id INTO _employee_id FROM public.employee_onboarding WHERE id = NEW.onboarding_id;
    IF _employee_id IS NOT NULL THEN
      PERFORM public.log_employee_timeline_event(_employee_id, 'onboarding_task_completed',
        concat('Onboarding task completed: ', NEW.title),
        jsonb_build_object('task_id', NEW.id, 'category', NEW.category));
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_onboarding_task_timeline ON public.employee_onboarding_tasks;
CREATE TRIGGER trg_onboarding_task_timeline
  AFTER UPDATE ON public.employee_onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_onboarding_task();

-- Track enrollment events
CREATE OR REPLACE FUNCTION public.trg_log_track_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _track_name text;
BEGIN
  SELECT name INTO _track_name FROM public.training_tracks WHERE id = COALESCE(NEW.track_id, OLD.track_id);
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'track_enrolled',
      concat('Enrolled in track: ', COALESCE(_track_name, '—')),
      jsonb_build_object('track_id', NEW.track_id, 'due_date', NEW.due_date));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'track_completed',
      concat('Completed track: ', COALESCE(_track_name, '—')),
      jsonb_build_object('track_id', NEW.track_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_track_enrollment_timeline ON public.training_track_enrollments;
CREATE TRIGGER trg_track_enrollment_timeline
  AFTER INSERT OR UPDATE ON public.training_track_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_track_enrollment();

-- ============================================================================
-- 3. AUTO-RECALC COURSE PROGRESS FROM LESSON COMPLETIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalc_course_progress(_user_id uuid, _course_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _total int; _done int; _pct int; _status text; _started timestamptz; _completed timestamptz;
DECLARE _emp_id uuid;
BEGIN
  SELECT count(*) INTO _total FROM public.training_lessons WHERE course_id = _course_id;
  IF COALESCE(_total,0) = 0 THEN RETURN; END IF;

  SELECT count(*) INTO _done FROM public.training_lesson_progress lp
   JOIN public.training_lessons l ON l.id = lp.lesson_id
   WHERE l.course_id = _course_id AND lp.user_id = _user_id AND lp.completed;

  _pct := (_done::numeric / _total::numeric * 100)::int;
  _status := CASE WHEN _pct >= 100 THEN 'completed' WHEN _pct > 0 THEN 'in_progress' ELSE 'assigned' END;
  _started := CASE WHEN _done > 0 THEN now() ELSE NULL END;
  _completed := CASE WHEN _pct >= 100 THEN now() ELSE NULL END;

  INSERT INTO public.training_progress (user_id, course_id, status, progress_percentage, started_at, completed_at, last_opened_at)
  VALUES (_user_id, _course_id, _status, _pct, _started, _completed, now())
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        started_at = COALESCE(public.training_progress.started_at, EXCLUDED.started_at),
        completed_at = CASE WHEN EXCLUDED.status = 'completed' THEN COALESCE(public.training_progress.completed_at, now()) ELSE NULL END,
        last_opened_at = now(),
        updated_at = now();

  -- Mirror into employee_trainings if assignment exists
  SELECT id INTO _emp_id FROM public.employees WHERE user_id = _user_id LIMIT 1;
  IF _emp_id IS NOT NULL THEN
    UPDATE public.employee_trainings
       SET status = _status::public.employee_training_status,
           started_at = COALESCE(started_at, _started),
           completed_at = CASE WHEN _status = 'completed' THEN COALESCE(completed_at, now()) ELSE NULL END
     WHERE employee_id = _emp_id AND course_id = _course_id;
  END IF;
END $$;

-- Add unique constraint for ON CONFLICT
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'training_progress_user_course_uq') THEN
    ALTER TABLE public.training_progress ADD CONSTRAINT training_progress_user_course_uq UNIQUE (user_id, course_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_recalc_after_lesson_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_id uuid;
BEGIN
  SELECT course_id INTO _course_id FROM public.training_lessons WHERE id = COALESCE(NEW.lesson_id, OLD.lesson_id);
  IF _course_id IS NOT NULL THEN
    PERFORM public.recalc_course_progress(COALESCE(NEW.user_id, OLD.user_id), _course_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_lesson_progress_recalc ON public.training_lesson_progress;
CREATE TRIGGER trg_lesson_progress_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.training_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_after_lesson_progress();

-- After a passing quiz attempt, mark course completed
CREATE OR REPLACE FUNCTION public.trg_quiz_attempt_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_id uuid; _emp_id uuid;
BEGIN
  SELECT course_id INTO _course_id FROM public.training_quizzes WHERE id = NEW.quiz_id;
  IF _course_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.passed THEN
    INSERT INTO public.training_progress (user_id, course_id, status, progress_percentage, completed_at, last_opened_at, quiz_score)
    VALUES (NEW.user_id, _course_id, 'completed', 100, now(), now(), NEW.score)
    ON CONFLICT (user_id, course_id) DO UPDATE
      SET status = 'completed', progress_percentage = 100,
          completed_at = COALESCE(public.training_progress.completed_at, now()),
          quiz_score = GREATEST(COALESCE(public.training_progress.quiz_score, 0), NEW.score),
          last_opened_at = now(), updated_at = now();

    SELECT id INTO _emp_id FROM public.employees WHERE user_id = NEW.user_id LIMIT 1;
    IF _emp_id IS NOT NULL THEN
      UPDATE public.employee_trainings
         SET status = 'completed'::public.employee_training_status,
             completed_at = COALESCE(completed_at, now()),
             score = GREATEST(COALESCE(score, 0), NEW.score::numeric)
       WHERE employee_id = _emp_id AND course_id = _course_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_quiz_attempt_complete ON public.training_quiz_attempts;
CREATE TRIGGER trg_quiz_attempt_complete
  AFTER INSERT ON public.training_quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.trg_quiz_attempt_complete();

-- ============================================================================
-- 4. POLICIES — let employees read their own timeline
-- ============================================================================
DROP POLICY IF EXISTS "Employees see own timeline" ON public.employee_timeline;
CREATE POLICY "Employees see own timeline"
  ON public.employee_timeline FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_timeline.employee_id AND e.user_id = auth.uid())
  );
