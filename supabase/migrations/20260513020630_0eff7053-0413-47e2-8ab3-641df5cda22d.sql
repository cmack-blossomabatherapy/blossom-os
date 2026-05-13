
-- Graduation evaluator for HR Admin Assistant track
CREATE OR REPLACE FUNCTION public.evaluate_hr_admin_assistant_graduation(_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _track_id constant uuid := 'f0c4a25b-682f-46cb-8f6e-bff85fcad585';
  _user_id uuid;
  _track_match boolean;
  _required_modules int;
  _completed_modules int;
  _required_certs int;
  _earned_certs int;
BEGIN
  SELECT (e.track_id = _track_id), emp.user_id
    INTO _track_match, _user_id
  FROM academy_enrollments e
  JOIN employees emp ON emp.id = e.employee_id
  WHERE e.id = _enrollment_id;

  IF NOT COALESCE(_track_match, false) OR _user_id IS NULL THEN
    RETURN;
  END IF;

  -- Required, non-archived modules in track
  SELECT COUNT(*) INTO _required_modules
  FROM academy_modules m
  JOIN academy_weeks w ON w.id = m.week_id AND NOT w.is_archived
  JOIN academy_phases p ON p.id = w.phase_id
  WHERE p.track_id = _track_id
    AND m.is_required
    AND NOT m.is_archived;

  SELECT COUNT(*) INTO _completed_modules
  FROM academy_progress pr
  JOIN academy_modules m ON m.id = pr.module_id
  JOIN academy_weeks w ON w.id = m.week_id AND NOT w.is_archived
  JOIN academy_phases p ON p.id = w.phase_id
  WHERE pr.enrollment_id = _enrollment_id
    AND p.track_id = _track_id
    AND m.is_required
    AND NOT m.is_archived
    AND pr.status IN ('completed', 'waived');

  SELECT COUNT(*) INTO _required_certs
  FROM academy_certificates WHERE track_id = _track_id;

  SELECT COUNT(*) INTO _earned_certs
  FROM academy_user_certificates uc
  JOIN academy_certificates c ON c.id = uc.certificate_id
  WHERE uc.enrollment_id = _enrollment_id AND c.track_id = _track_id;

  IF _required_modules > 0
     AND _completed_modules >= _required_modules
     AND _required_certs > 0
     AND _earned_certs >= _required_certs THEN
    UPDATE academy_enrollments
       SET status = 'completed', updated_at = now()
     WHERE id = _enrollment_id AND status <> 'completed';

    UPDATE onboarding_route_locks
       SET active = false
     WHERE active
       AND user_id = _user_id
       AND reason ILIKE '%HR Admin Assistant%';
  END IF;
END;
$$;

-- Trigger fn for academy_progress
CREATE OR REPLACE FUNCTION public.trg_eval_hraa_grad_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('completed', 'waived') THEN
    PERFORM public.evaluate_hr_admin_assistant_graduation(NEW.enrollment_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger fn for academy_user_certificates
CREATE OR REPLACE FUNCTION public.trg_eval_hraa_grad_cert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.evaluate_hr_admin_assistant_graduation(NEW.enrollment_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS academy_progress_hraa_grad ON academy_progress;
CREATE TRIGGER academy_progress_hraa_grad
AFTER INSERT OR UPDATE OF status ON academy_progress
FOR EACH ROW EXECUTE FUNCTION public.trg_eval_hraa_grad_progress();

DROP TRIGGER IF EXISTS academy_cert_hraa_grad ON academy_user_certificates;
CREATE TRIGGER academy_cert_hraa_grad
AFTER INSERT ON academy_user_certificates
FOR EACH ROW EXECUTE FUNCTION public.trg_eval_hraa_grad_cert();

-- Backfill: evaluate all current HR Admin Assistant enrollments
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM academy_enrollments
           WHERE track_id = 'f0c4a25b-682f-46cb-8f6e-bff85fcad585'
  LOOP
    PERFORM public.evaluate_hr_admin_assistant_graduation(r.id);
  END LOOP;
END $$;
