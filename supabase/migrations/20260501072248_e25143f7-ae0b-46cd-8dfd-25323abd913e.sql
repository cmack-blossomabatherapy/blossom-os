-- Audit log for role assignments / removals (and by extension training_admin toggles)
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  target_user_email TEXT,
  target_user_name TEXT,
  role public.app_role NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted','revoked')),
  actor_user_id UUID,
  actor_name TEXT,
  actor_email TEXT,
  source TEXT, -- e.g. 'hr_profile', 'team_admin', 'system'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_log_target ON public.role_audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_role ON public.role_audit_log(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_created ON public.role_audit_log(created_at DESC);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View role audit log"
  ON public.role_audit_log
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_manager')
  );

-- No INSERT/UPDATE/DELETE policies → only the SECURITY DEFINER trigger writes here.

CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _actor_name text;
  _actor_email text;
  _target_email text;
  _target_name text;
  _action text;
  _role public.app_role;
  _target uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'granted';
    _role := NEW.role;
    _target := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'revoked';
    _role := OLD.role;
    _target := OLD.user_id;
  ELSE
    RETURN NULL;
  END IF;

  SELECT display_name, email INTO _actor_name, _actor_email
  FROM public.profiles WHERE user_id = _actor;

  SELECT display_name, email INTO _target_name, _target_email
  FROM public.profiles WHERE user_id = _target;

  INSERT INTO public.role_audit_log (
    target_user_id, target_user_email, target_user_name,
    role, action,
    actor_user_id, actor_name, actor_email,
    source
  ) VALUES (
    _target, _target_email, _target_name,
    _role, _action,
    _actor, _actor_name, _actor_email,
    'system'
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_audit_ins ON public.user_roles;
DROP TRIGGER IF EXISTS trg_user_roles_audit_del ON public.user_roles;

CREATE TRIGGER trg_user_roles_audit_ins
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();

CREATE TRIGGER trg_user_roles_audit_del
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();