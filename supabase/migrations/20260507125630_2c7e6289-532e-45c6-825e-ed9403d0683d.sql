
-- Academy enrollment audit log
CREATE TABLE public.academy_enrollment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  employee_id uuid NOT NULL,
  employee_name text,
  track_id uuid,
  track_name text,
  action text NOT NULL CHECK (action IN ('assigned','removed','updated')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid,
  actor_name text,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_audit_created_at ON public.academy_enrollment_audit (created_at DESC);
CREATE INDEX idx_academy_audit_employee ON public.academy_enrollment_audit (employee_id);
CREATE INDEX idx_academy_audit_track ON public.academy_enrollment_audit (track_id);

ALTER TABLE public.academy_enrollment_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit viewable by training managers"
  ON public.academy_enrollment_audit FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_permission(auth.uid(),'hr.training.assign')
    OR public.has_permission(auth.uid(),'hr.training.manage')
  );

CREATE POLICY "Audit inserts by system only"
  ON public.academy_enrollment_audit FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Trigger function
CREATE OR REPLACE FUNCTION public.log_academy_enrollment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _actor_name text;
  _actor_email text;
  _emp_name text;
  _track_name text;
  _emp_id uuid;
  _track_id uuid;
  _action text;
  _details jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'assigned';
    _emp_id := NEW.employee_id;
    _track_id := NEW.track_id;
    _details := jsonb_build_object('status', NEW.status, 'path', NEW.path, 'start_date', NEW.start_date);
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'removed';
    _emp_id := OLD.employee_id;
    _track_id := OLD.track_id;
    _details := jsonb_build_object('status', OLD.status, 'path', OLD.path);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status
       AND NEW.path IS NOT DISTINCT FROM OLD.path THEN
      RETURN NEW;
    END IF;
    _action := 'updated';
    _emp_id := NEW.employee_id;
    _track_id := NEW.track_id;
    _details := jsonb_build_object(
      'from', jsonb_build_object('status', OLD.status, 'path', OLD.path),
      'to',   jsonb_build_object('status', NEW.status, 'path', NEW.path)
    );
  END IF;

  SELECT first_name || ' ' || last_name INTO _emp_name FROM public.employees WHERE id = _emp_id;
  SELECT name INTO _track_name FROM public.academy_tracks WHERE id = _track_id;
  IF _actor IS NOT NULL THEN
    SELECT display_name, email INTO _actor_name, _actor_email FROM public.profiles WHERE user_id = _actor;
  END IF;

  INSERT INTO public.academy_enrollment_audit
    (enrollment_id, employee_id, employee_name, track_id, track_name,
     action, details, actor_user_id, actor_name, actor_email)
  VALUES
    (COALESCE(NEW.id, OLD.id), _emp_id, _emp_name, _track_id, _track_name,
     _action, _details, _actor, _actor_name, _actor_email);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER academy_enrollment_audit_ins
  AFTER INSERT ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_academy_enrollment_change();

CREATE TRIGGER academy_enrollment_audit_upd
  AFTER UPDATE ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_academy_enrollment_change();

CREATE TRIGGER academy_enrollment_audit_del
  AFTER DELETE ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_academy_enrollment_change();
