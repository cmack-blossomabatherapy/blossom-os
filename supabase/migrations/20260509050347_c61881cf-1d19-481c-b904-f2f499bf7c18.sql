
CREATE TABLE IF NOT EXISTS public.critical_alert_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.critical_alerts(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('generated','pushed','acknowledged','resolved','dismissed','reopened')),
  actor_user_id uuid,
  actor_name text,
  actor_email text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS critical_alert_audit_alert_idx ON public.critical_alert_audit (alert_id, created_at DESC);
CREATE INDEX IF NOT EXISTS critical_alert_audit_event_idx ON public.critical_alert_audit (event, created_at DESC);

ALTER TABLE public.critical_alert_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view alert audit"
  ON public.critical_alert_audit FOR SELECT
  TO authenticated USING (true);

-- Users may log their own dismissals; admins may log anything.
CREATE POLICY "Users insert own dismissals; admins insert anything"
  ON public.critical_alert_audit FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (event = 'dismissed' AND actor_user_id = auth.uid())
  );

-- Append-only: no updates or deletes
CREATE POLICY "No updates to audit"
  ON public.critical_alert_audit FOR UPDATE
  TO authenticated USING (false);
CREATE POLICY "No deletes from audit"
  ON public.critical_alert_audit FOR DELETE
  TO authenticated USING (false);

-- Trigger function to auto-log alert lifecycle events
CREATE OR REPLACE FUNCTION public.log_critical_alert_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _actor_name text;
  _actor_email text;
BEGIN
  IF _actor IS NOT NULL THEN
    SELECT display_name, email INTO _actor_name, _actor_email
    FROM public.profiles WHERE user_id = _actor;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.critical_alert_audit (alert_id, event, actor_user_id, actor_name, actor_email, metadata)
    VALUES (
      NEW.id, 'generated', _actor, _actor_name, _actor_email,
      jsonb_build_object('category', NEW.category, 'severity', NEW.severity, 'deep_link', NEW.deep_link, 'due_at', NEW.due_at)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.pushed_at IS DISTINCT FROM OLD.pushed_at AND NEW.pushed_at IS NOT NULL THEN
      INSERT INTO public.critical_alert_audit (alert_id, event, actor_user_id, actor_name, actor_email, metadata)
      VALUES (
        NEW.id, 'pushed', NULL, 'system', NULL,
        jsonb_build_object('push_attempts', NEW.push_attempts, 'push_last_error', NEW.push_last_error)
      );
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'acknowledged' THEN
        INSERT INTO public.critical_alert_audit (alert_id, event, actor_user_id, actor_name, actor_email, metadata)
        VALUES (NEW.id, 'acknowledged', _actor, _actor_name, _actor_email, jsonb_build_object('from', OLD.status));
      ELSIF NEW.status = 'resolved' THEN
        INSERT INTO public.critical_alert_audit (alert_id, event, actor_user_id, actor_name, actor_email, metadata)
        VALUES (NEW.id, 'resolved', _actor, _actor_name, _actor_email, jsonb_build_object('from', OLD.status));
      ELSIF NEW.status = 'open' AND OLD.status IN ('acknowledged','resolved') THEN
        INSERT INTO public.critical_alert_audit (alert_id, event, actor_user_id, actor_name, actor_email, metadata)
        VALUES (NEW.id, 'reopened', _actor, _actor_name, _actor_email, jsonb_build_object('from', OLD.status));
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS critical_alerts_audit ON public.critical_alerts;
CREATE TRIGGER critical_alerts_audit
  AFTER INSERT OR UPDATE ON public.critical_alerts
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_alert_event();
