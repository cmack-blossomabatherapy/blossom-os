-- Audit log table
CREATE TABLE IF NOT EXISTS public.onboarding_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid,                              -- null = system/service-role action
  event_type text NOT NULL,
  target_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'user',        -- user | admin | system | automation
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oal_user_created
  ON public.onboarding_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oal_actor
  ON public.onboarding_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_oal_event_type
  ON public.onboarding_audit_log (event_type);

ALTER TABLE public.onboarding_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own audit log" ON public.onboarding_audit_log;
CREATE POLICY "Users view own audit log"
  ON public.onboarding_audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all audit log" ON public.onboarding_audit_log;
CREATE POLICY "Admins view all audit log"
  ON public.onboarding_audit_log
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR
    has_role(auth.uid(),'hr_admin') OR
    has_role(auth.uid(),'hr_manager') OR
    has_role(auth.uid(),'training_admin')
  );
-- Note: no INSERT/UPDATE/DELETE policy → only the SECURITY DEFINER trigger can write.

-- Trigger function: diff OLD/NEW and emit one audit row per change
CREATE OR REPLACE FUNCTION public.log_onboarding_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_source text := CASE
    WHEN auth.uid() IS NULL THEN 'system'
    WHEN auth.uid() = NEW.user_id THEN 'user'
    ELSE 'admin'
  END;
  v_added text[];
  v_removed text[];
  k text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, metadata, source)
    VALUES (NEW.user_id, v_actor, 'state_initialized',
            jsonb_build_object('path', NEW.path), v_source);
    -- Also record any pre-populated arrays as initial seeds
    FOREACH k IN ARRAY COALESCE(NEW.modules_complete, '{}'::text[]) LOOP
      INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
      VALUES (NEW.user_id, v_actor, 'module_complete', k, v_source);
    END LOOP;
    RETURN NEW;
  END IF;

  -- modules_complete diff
  v_added := ARRAY(SELECT unnest(COALESCE(NEW.modules_complete,'{}'::text[]))
                   EXCEPT SELECT unnest(COALESCE(OLD.modules_complete,'{}'::text[])));
  v_removed := ARRAY(SELECT unnest(COALESCE(OLD.modules_complete,'{}'::text[]))
                     EXCEPT SELECT unnest(COALESCE(NEW.modules_complete,'{}'::text[])));
  FOREACH k IN ARRAY v_added LOOP
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'module_complete', k, v_source);
  END LOOP;
  FOREACH k IN ARRAY v_removed LOOP
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'module_uncheck', k, v_source);
  END LOOP;

  -- completed_steps diff
  v_added := ARRAY(SELECT unnest(COALESCE(NEW.completed_steps,'{}'::text[]))
                   EXCEPT SELECT unnest(COALESCE(OLD.completed_steps,'{}'::text[])));
  v_removed := ARRAY(SELECT unnest(COALESCE(OLD.completed_steps,'{}'::text[]))
                     EXCEPT SELECT unnest(COALESCE(NEW.completed_steps,'{}'::text[])));
  FOREACH k IN ARRAY v_added LOOP
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'step_complete', k, v_source);
  END LOOP;
  FOREACH k IN ARRAY v_removed LOOP
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'step_uncheck', k, v_source);
  END LOOP;

  -- acknowledgements diff
  v_added := ARRAY(SELECT unnest(COALESCE(NEW.acknowledgements,'{}'::text[]))
                   EXCEPT SELECT unnest(COALESCE(OLD.acknowledgements,'{}'::text[])));
  v_removed := ARRAY(SELECT unnest(COALESCE(OLD.acknowledgements,'{}'::text[]))
                     EXCEPT SELECT unnest(COALESCE(NEW.acknowledgements,'{}'::text[])));
  FOREACH k IN ARRAY v_added LOOP
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'ack', k, v_source);
  END LOOP;
  FOREACH k IN ARRAY v_removed LOOP
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'unack', k, v_source);
  END LOOP;

  IF COALESCE(NEW.quiz_passed,false) IS DISTINCT FROM COALESCE(OLD.quiz_passed,false) THEN
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, source)
    VALUES (NEW.user_id, v_actor,
            CASE WHEN NEW.quiz_passed THEN 'quiz_passed' ELSE 'quiz_reset' END,
            v_source);
  END IF;

  IF NEW.path IS DISTINCT FROM OLD.path THEN
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, metadata, source)
    VALUES (NEW.user_id, v_actor, 'path_change', NEW.path,
            jsonb_build_object('from', OLD.path, 'to', NEW.path), v_source);
  END IF;

  IF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, source)
    VALUES (NEW.user_id, v_actor,
            CASE WHEN NEW.completed_at IS NULL THEN 'reopened' ELSE 'completed' END,
            v_source);
  END IF;

  IF NEW.certificate_id IS DISTINCT FROM OLD.certificate_id AND NEW.certificate_id IS NOT NULL THEN
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source)
    VALUES (NEW.user_id, v_actor, 'certificate_issued', NEW.certificate_id, v_source);
  END IF;

  IF COALESCE(NEW.reset_count,0) > COALESCE(OLD.reset_count,0) THEN
    INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, metadata, source)
    VALUES (NEW.user_id, v_actor, 'journey_reset',
            jsonb_build_object('reset_count', NEW.reset_count),
            CASE WHEN v_actor IS NULL THEN 'admin' ELSE v_source END);
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_onboarding_changes ON public.onboarding_state;
CREATE TRIGGER trg_log_onboarding_changes
AFTER INSERT OR UPDATE ON public.onboarding_state
FOR EACH ROW EXECUTE FUNCTION public.log_onboarding_changes();