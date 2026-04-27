DO $$
BEGIN
  CREATE TYPE public.reauth_cycle_status AS ENUM ('Not Started', 'BCBA Notified', 'In Progress', 'Report Received', 'QA Review', 'Submitted', 'Approved', 'Failed / Delayed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.reauth_qa_status AS ENUM ('Not Started', 'In Review', 'Passed', 'Failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.reauth_submission_status AS ENUM ('Not Submitted', 'Ready', 'Submitted', 'Approved', 'Denied');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.client_reauth_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  linked_authorization_id uuid,
  payor text NOT NULL DEFAULT '',
  current_auth_expiration_date date NOT NULL,
  reauth_trigger_date date NOT NULL,
  bcba_9_week_notification_date date,
  bcba_6_week_notification_date date,
  progress_report_due_date date,
  progress_report_received_date date,
  qa_review_started_date date,
  qa_completed_date date,
  submission_date date,
  approval_date date,
  status public.reauth_cycle_status NOT NULL DEFAULT 'Not Started',
  qa_status public.reauth_qa_status NOT NULL DEFAULT 'Not Started',
  submission_status public.reauth_submission_status NOT NULL DEFAULT 'Not Submitted',
  assigned_bcba text,
  qa_owner text,
  authorization_coordinator text,
  state_director text,
  blockers text[] NOT NULL DEFAULT '{}',
  alerts text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  stage_entered_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT client_reauth_cycles_linked_payor_unique UNIQUE (linked_authorization_id, payor)
);

ALTER TABLE public.client_reauth_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View reauth cycles with permission"
ON public.client_reauth_cycles
FOR SELECT
USING (public.has_permission(auth.uid(), 'clients.view') OR public.has_permission(auth.uid(), 'auth.view') OR public.has_permission(auth.uid(), 'qa.view'));

CREATE POLICY "Create reauth cycles with permission"
ON public.client_reauth_cycles
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'auth.edit') OR public.has_permission(auth.uid(), 'clients.edit'));

CREATE POLICY "Update reauth cycles with permission"
ON public.client_reauth_cycles
FOR UPDATE
USING (public.has_permission(auth.uid(), 'auth.edit') OR public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'clients.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'auth.edit') OR public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'clients.edit'));

CREATE POLICY "Delete reauth cycles with permission"
ON public.client_reauth_cycles
FOR DELETE
USING (public.has_permission(auth.uid(), 'clients.delete'));

CREATE INDEX IF NOT EXISTS idx_reauth_cycles_client ON public.client_reauth_cycles (client_id);
CREATE INDEX IF NOT EXISTS idx_reauth_cycles_status_expiration ON public.client_reauth_cycles (status, current_auth_expiration_date);
CREATE INDEX IF NOT EXISTS idx_reauth_cycles_trigger ON public.client_reauth_cycles (reauth_trigger_date, status);

CREATE OR REPLACE FUNCTION public.seed_reauth_cycle_from_authorization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _bcba text;
  _state text;
  _payor text;
  _coordinator text;
BEGIN
  IF NEW.kind IN ('Treatment', 'Reauth') AND NEW.status IN ('Approved', 'Expiring Soon') AND NEW.expiration_date IS NOT NULL THEN
    SELECT bcba, state, payor INTO _bcba, _state, _payor FROM public.clients WHERE id = NEW.client_id;
    _coordinator := COALESCE(NEW.assigned_auth_coordinator, CASE WHEN COALESCE(NEW.state, _state) = 'GA' THEN 'Kayla / Riki / GA Team' WHEN COALESCE(NEW.payor, _payor, '') ILIKE '%medicaid%' THEN 'Medicaid Auth Team' ELSE 'Kayla' END);

    INSERT INTO public.client_reauth_cycles (
      client_id,
      linked_authorization_id,
      payor,
      current_auth_expiration_date,
      reauth_trigger_date,
      bcba_9_week_notification_date,
      bcba_6_week_notification_date,
      progress_report_due_date,
      status,
      assigned_bcba,
      qa_owner,
      authorization_coordinator,
      state_director,
      alerts
    )
    VALUES (
      NEW.client_id,
      NEW.id,
      COALESCE(NEW.payor, _payor, ''),
      NEW.expiration_date,
      NEW.expiration_date - 90,
      NEW.expiration_date - 63,
      NEW.expiration_date - 42,
      NEW.expiration_date - 45,
      CASE WHEN NEW.expiration_date <= CURRENT_DATE + 90 THEN 'BCBA Notified'::public.reauth_cycle_status ELSE 'Not Started'::public.reauth_cycle_status END,
      _bcba,
      COALESCE(NEW.qa_owner, 'QA Team'),
      _coordinator,
      CASE WHEN COALESCE(NEW.state, _state) = 'GA' THEN 'GA State Director' ELSE 'State Director' END,
      CASE WHEN NEW.expiration_date <= CURRENT_DATE + 90 THEN ARRAY['Reauth window open'] ELSE '{}'::text[] END
    )
    ON CONFLICT (linked_authorization_id, payor) DO UPDATE
    SET current_auth_expiration_date = EXCLUDED.current_auth_expiration_date,
        reauth_trigger_date = EXCLUDED.reauth_trigger_date,
        bcba_9_week_notification_date = EXCLUDED.bcba_9_week_notification_date,
        bcba_6_week_notification_date = EXCLUDED.bcba_6_week_notification_date,
        progress_report_due_date = EXCLUDED.progress_report_due_date,
        assigned_bcba = EXCLUDED.assigned_bcba,
        qa_owner = EXCLUDED.qa_owner,
        authorization_coordinator = EXCLUDED.authorization_coordinator,
        state_director = EXCLUDED.state_director,
        updated_at = now();

    UPDATE public.clients
    SET next_reauth_date = NEW.expiration_date - 90
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_reauth_cycle_from_authorization_trigger ON public.client_authorizations;
CREATE TRIGGER seed_reauth_cycle_from_authorization_trigger
AFTER INSERT OR UPDATE OF status, expiration_date, payor, assigned_auth_coordinator, qa_owner
ON public.client_authorizations
FOR EACH ROW
EXECUTE FUNCTION public.seed_reauth_cycle_from_authorization();

CREATE OR REPLACE FUNCTION public.sync_reauth_loop_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.stage_entered_at := now();
  END IF;

  IF NEW.current_auth_expiration_date <= CURRENT_DATE THEN
    NEW.status := 'Failed / Delayed';
    NEW.alerts := array_append(COALESCE(NEW.alerts, '{}'::text[]), 'Expired authorization');
    NEW.blockers := array_append(COALESCE(NEW.blockers, '{}'::text[]), 'Authorization expired');
  ELSIF NEW.current_auth_expiration_date <= CURRENT_DATE + 30 AND NEW.submission_status = 'Not Submitted' THEN
    NEW.status := 'Failed / Delayed';
    NEW.alerts := array_append(COALESCE(NEW.alerts, '{}'::text[]), '30 days to expiration – no submission');
    NEW.blockers := array_append(COALESCE(NEW.blockers, '{}'::text[]), 'Reauth not submitted');
  ELSIF NEW.current_auth_expiration_date <= CURRENT_DATE + 60 AND NEW.progress_report_received_date IS NULL AND NEW.status IN ('Not Started', 'BCBA Notified') THEN
    NEW.status := 'Failed / Delayed';
    NEW.alerts := array_append(COALESCE(NEW.alerts, '{}'::text[]), '60 days to expiration – no report started');
    NEW.blockers := array_append(COALESCE(NEW.blockers, '{}'::text[]), 'BCBA not responding');
  ELSIF NEW.reauth_trigger_date <= CURRENT_DATE AND NEW.status = 'Not Started' THEN
    NEW.status := 'BCBA Notified';
    NEW.alerts := array_append(COALESCE(NEW.alerts, '{}'::text[]), 'Reauth window open');
  END IF;

  IF NEW.progress_report_received_date IS NOT NULL AND NEW.status IN ('BCBA Notified', 'In Progress') THEN
    NEW.status := 'Report Received';
    NEW.qa_status := 'In Review';
    NEW.qa_review_started_date := COALESCE(NEW.qa_review_started_date, CURRENT_DATE);
  END IF;

  IF NEW.qa_status = 'Passed' AND NEW.status = 'QA Review' THEN
    NEW.status := 'Submitted';
    NEW.submission_status := 'Ready';
  ELSIF NEW.qa_status = 'Failed' THEN
    NEW.status := 'In Progress';
    NEW.submission_status := 'Not Submitted';
    NEW.blockers := array_append(COALESCE(NEW.blockers, '{}'::text[]), 'QA failed progress report');
  END IF;

  IF NEW.submission_status = 'Submitted' AND NEW.submission_date IS NULL THEN
    NEW.submission_date := CURRENT_DATE;
    NEW.status := 'Submitted';
  END IF;

  IF NEW.submission_status = 'Approved' THEN
    NEW.status := 'Approved';
    NEW.approval_date := COALESCE(NEW.approval_date, CURRENT_DATE);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'BCBA Notified' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Request Progress Report', false, CURRENT_DATE, 100),
      (NEW.client_id, 'Notify BCBA', false, CURRENT_DATE, 101);

    UPDATE public.clients
    SET stage = 'Reauth Triggered',
        next_action = 'Request progress report',
        next_reauth_date = NEW.reauth_trigger_date,
        active_alerts = array_append(COALESCE(active_alerts, '{}'::text[]), 'Reauth needed'),
        stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Report Received' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (NEW.client_id, 'Review Progress Report', false, CURRENT_DATE, 102);

    UPDATE public.clients
    SET stage = 'Progress Report Received', next_action = 'QA review progress report', stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Submitted' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_authorizations (client_id, kind, status, payor, state, assigned_auth_coordinator, next_action, reauth_source_id, progress_report_status)
    SELECT NEW.client_id, 'Reauth', 'Submitted', NEW.payor, c.state, NEW.authorization_coordinator, 'Follow up with payor', NEW.linked_authorization_id, 'Received'
    FROM public.clients c
    WHERE c.id = NEW.client_id
      AND NOT EXISTS (
        SELECT 1 FROM public.client_authorizations ca
        WHERE ca.client_id = NEW.client_id AND ca.kind = 'Reauth' AND ca.reauth_source_id = NEW.linked_authorization_id AND ca.status = 'Submitted'
      );

    UPDATE public.clients
    SET stage = 'Reauth Submitted', next_action = 'Monitor reauth response', stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.clients
    SET stage = 'Active',
        active_service_status = 'Active',
        auth_status = 'Approved',
        next_action = 'Monitor active services',
        next_reauth_date = NULL,
        active_alerts = array_remove(COALESCE(active_alerts, '{}'::text[]), 'Reauth needed'),
        stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Failed / Delayed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Escalate reauth issue', false, CURRENT_DATE, 103),
      (NEW.client_id, 'Contact BCBA', false, CURRENT_DATE, 104);

    UPDATE public.clients
    SET blockers = array_append(COALESCE(blockers, '{}'::text[]), 'Reauth delayed'),
        active_alerts = array_append(COALESCE(active_alerts, '{}'::text[]), 'Reauth not submitted'),
        next_action = 'Escalate reauth delay'
    WHERE id = NEW.client_id;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_reauth_loop_engine_trigger ON public.client_reauth_cycles;
CREATE TRIGGER sync_reauth_loop_engine_trigger
BEFORE INSERT OR UPDATE ON public.client_reauth_cycles
FOR EACH ROW
EXECUTE FUNCTION public.sync_reauth_loop_engine();

REVOKE ALL ON FUNCTION public.seed_reauth_cycle_from_authorization() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_reauth_loop_engine() FROM PUBLIC, anon, authenticated;