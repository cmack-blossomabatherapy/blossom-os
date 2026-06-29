
-- 1. Tighten RLS helper functions for recruiting tables
CREATE OR REPLACE FUNCTION public.recruiting_can_write(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR public.has_role(_user_id, 'super_admin')
    OR public.has_role(_user_id, 'systems_admin')
    OR public.has_role(_user_id, 'ops_manager')
    OR public.has_role(_user_id, 'operations_manager')
    OR public.has_role(_user_id, 'director_of_operations')
    OR public.has_role(_user_id, 'coo')
    OR public.has_role(_user_id, 'hr_admin')
    OR public.has_role(_user_id, 'hr_manager')
    OR public.has_role(_user_id, 'hr_lead')
    OR public.has_role(_user_id, 'hr')
    OR public.has_role(_user_id, 'recruiting_assistant')
    OR public.has_role(_user_id, 'recruiting_lead')
    OR public.has_role(_user_id, 'recruiting_coordinator')
$$;

CREATE OR REPLACE FUNCTION public.recruiting_can_read(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.recruiting_can_write(_user_id)
    OR public.has_role(_user_id, 'exec')
    OR public.has_role(_user_id, 'executive')
    OR public.has_role(_user_id, 'state_director')
    OR public.has_role(_user_id, 'assistant_state_director')
$$;

-- 2. Audit trail table
CREATE TABLE IF NOT EXISTS public.recruiting_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  entity_table text NOT NULL,
  entity_id uuid,
  event_type text NOT NULL,
  from_value text,
  to_value text,
  payload jsonb,
  actor_user_id uuid,
  actor_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recruiting_activity_events_candidate_idx
  ON public.recruiting_activity_events (candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS recruiting_activity_events_entity_idx
  ON public.recruiting_activity_events (entity_table, entity_id);

GRANT SELECT ON public.recruiting_activity_events TO authenticated;
GRANT ALL ON public.recruiting_activity_events TO service_role;

ALTER TABLE public.recruiting_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View recruiting activity" ON public.recruiting_activity_events;
CREATE POLICY "View recruiting activity"
  ON public.recruiting_activity_events
  FOR SELECT
  USING (public.recruiting_can_read(auth.uid()));

-- (No INSERT/UPDATE/DELETE policy — only the database trigger writes via SECURITY DEFINER.)

-- 3. Generic event logger (SECURITY DEFINER so triggers can insert regardless of caller)
CREATE OR REPLACE FUNCTION public.log_recruiting_event(
  _candidate_id uuid,
  _entity_table text,
  _entity_id uuid,
  _event_type text,
  _from_value text,
  _to_value text,
  _payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.recruiting_activity_events(
    candidate_id, entity_table, entity_id, event_type,
    from_value, to_value, payload, actor_user_id
  )
  VALUES (
    _candidate_id, _entity_table, _entity_id, _event_type,
    _from_value, _to_value, _payload, auth.uid()
  );
END;
$$;

-- 4. Candidate stage change → lazy child rows + audit
CREATE OR REPLACE FUNCTION public.recruiting_candidate_stage_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_recruiting_event(
      NEW.id, 'recruiting_candidates', NEW.id, 'create',
      NULL, NEW.pipeline_stage,
      jsonb_build_object('role', NEW.role, 'state', NEW.state)
    );
    RETURN NEW;
  END IF;

  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    NEW.stage_entered_at := now();

    PERFORM public.log_recruiting_event(
      NEW.id, 'recruiting_candidates', NEW.id, 'stage_change',
      OLD.pipeline_stage, NEW.pipeline_stage, NULL
    );

    -- Lazy create child rows when entering specific stages
    IF NEW.pipeline_stage = 'Interview Scheduled' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.recruiting_interviews
        WHERE candidate_id = NEW.id AND completed_at IS NULL
      ) INTO v_exists;
      IF NOT v_exists THEN
        INSERT INTO public.recruiting_interviews(candidate_id, interview_type, status)
        VALUES (NEW.id, 'Phone Screen', 'Scheduled');
      END IF;

    ELSIF NEW.pipeline_stage = 'Offer Sent' THEN
      SELECT EXISTS(SELECT 1 FROM public.recruiting_offers WHERE candidate_id = NEW.id)
      INTO v_exists;
      IF NOT v_exists THEN
        INSERT INTO public.recruiting_offers(candidate_id, status, sent_at)
        VALUES (NEW.id, 'Sent', now());
      END IF;

    ELSIF NEW.pipeline_stage = 'Background Check' THEN
      SELECT EXISTS(SELECT 1 FROM public.recruiting_background_checks WHERE candidate_id = NEW.id)
      INTO v_exists;
      IF NOT v_exists THEN
        INSERT INTO public.recruiting_background_checks(candidate_id, status, initiated_at)
        VALUES (NEW.id, 'Initiated', now());
      END IF;

    ELSIF NEW.pipeline_stage = 'Orientation Scheduled' THEN
      SELECT EXISTS(SELECT 1 FROM public.recruiting_orientation_slots WHERE candidate_id = NEW.id)
      INTO v_exists;
      IF NOT v_exists THEN
        INSERT INTO public.recruiting_orientation_slots(candidate_id, status)
        VALUES (NEW.id, 'Scheduled');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recruiting_candidate_stage ON public.recruiting_candidates;
CREATE TRIGGER trg_recruiting_candidate_stage
  BEFORE INSERT OR UPDATE ON public.recruiting_candidates
  FOR EACH ROW EXECUTE FUNCTION public.recruiting_candidate_stage_changed();

-- 5. Lightweight child-table audit
CREATE OR REPLACE FUNCTION public.recruiting_child_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_candidate uuid;
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_candidate := COALESCE((OLD).candidate_id, NULL);
    v_id := (OLD).id;
    PERFORM public.log_recruiting_event(
      v_candidate, TG_TABLE_NAME, v_id, 'delete', NULL, NULL, to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;

  v_candidate := COALESCE((NEW).candidate_id, NULL);
  v_id := (NEW).id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_recruiting_event(
      v_candidate, TG_TABLE_NAME, v_id, 'create', NULL, NULL, to_jsonb(NEW)
    );
  ELSE
    PERFORM public.log_recruiting_event(
      v_candidate, TG_TABLE_NAME, v_id, 'update', NULL, NULL,
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'recruiting_interviews',
    'recruiting_offers',
    'recruiting_background_checks',
    'recruiting_orientation_slots',
    'recruiting_onboarding_tasks',
    'recruiting_followups',
    'recruiting_escalations',
    'recruiting_messages'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.recruiting_child_audit()',
      t, t
    );
  END LOOP;
END $$;
