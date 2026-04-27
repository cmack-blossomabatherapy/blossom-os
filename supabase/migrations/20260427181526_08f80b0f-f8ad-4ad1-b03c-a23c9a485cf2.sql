DO $$
BEGIN
  CREATE TYPE public.active_service_status AS ENUM ('Active', 'Services on Pause', 'Flaked', 'Discharged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.active_staffing_status AS ENUM ('Stable', 'Needs Restaffing', 'In Transition');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.notes_compliance_status AS ENUM ('Compliant', 'Needs Review', 'Flagged', 'Repeated Errors');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.billing_claim_status AS ENUM ('Current', 'Missing Sessions', 'Claims Issue', 'Delayed Billing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.session_delivery_status AS ENUM ('Scheduled', 'Delivered', 'Missed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.service_note_status AS ENUM ('Pending', 'Submitted', 'Flagged', 'Corrected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.service_claim_status AS ENUM ('Not Submitted', 'Submitted', 'Paid', 'Issue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.compliance_flag_source AS ENUM ('NoteGuard', 'Amerigroup', 'Billing', 'Staffing', 'Utilization', 'Reauth');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.compliance_flag_severity AS ENUM ('Yellow', 'Red');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS active_service_status public.active_service_status NOT NULL DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS active_staffing_status public.active_staffing_status NOT NULL DEFAULT 'Stable',
ADD COLUMN IF NOT EXISTS approved_weekly_hours numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_weekly_hours numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_weekly_hours numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_location text NOT NULL DEFAULT 'Clinic',
ADD COLUMN IF NOT EXISTS notes_compliance_status public.notes_compliance_status NOT NULL DEFAULT 'Compliant',
ADD COLUMN IF NOT EXISTS noteguard_flags integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS amerigroup_status text NOT NULL DEFAULT 'Current',
ADD COLUMN IF NOT EXISTS sessions_logged integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS claims_submitted integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS claims_issues integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_status public.billing_claim_status NOT NULL DEFAULT 'Current',
ADD COLUMN IF NOT EXISTS new_rbt_start_date date,
ADD COLUMN IF NOT EXISTS rbt_check_in_status text NOT NULL DEFAULT 'Not Required',
ADD COLUMN IF NOT EXISTS early_rbt_issues text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS next_reauth_date date,
ADD COLUMN IF NOT EXISTS active_alerts text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS active_notes text;

CREATE TABLE IF NOT EXISTS public.client_service_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  rbt text,
  bcba text,
  location text NOT NULL DEFAULT 'Clinic',
  scheduled_hours numeric NOT NULL DEFAULT 0,
  delivered_hours numeric NOT NULL DEFAULT 0,
  delivery_status public.session_delivery_status NOT NULL DEFAULT 'Scheduled',
  note_status public.service_note_status NOT NULL DEFAULT 'Pending',
  claim_status public.service_claim_status NOT NULL DEFAULT 'Not Submitted',
  billing_issue text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_service_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View service sessions with permission"
ON public.client_service_sessions
FOR SELECT
USING (public.has_permission(auth.uid(), 'clients.view') OR public.has_permission(auth.uid(), 'scheduling.view') OR public.has_permission(auth.uid(), 'auth.billing'));

CREATE POLICY "Create service sessions with permission"
ON public.client_service_sessions
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'clients.edit') OR public.has_permission(auth.uid(), 'scheduling.edit'));

CREATE POLICY "Update service sessions with permission"
ON public.client_service_sessions
FOR UPDATE
USING (public.has_permission(auth.uid(), 'clients.edit') OR public.has_permission(auth.uid(), 'scheduling.edit') OR public.has_permission(auth.uid(), 'auth.billing'))
WITH CHECK (public.has_permission(auth.uid(), 'clients.edit') OR public.has_permission(auth.uid(), 'scheduling.edit') OR public.has_permission(auth.uid(), 'auth.billing'));

CREATE POLICY "Delete service sessions with permission"
ON public.client_service_sessions
FOR DELETE
USING (public.has_permission(auth.uid(), 'clients.delete'));

CREATE TABLE IF NOT EXISTS public.client_compliance_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  source public.compliance_flag_source NOT NULL,
  severity public.compliance_flag_severity NOT NULL DEFAULT 'Yellow',
  title text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'Open',
  owner text,
  due_date date,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_compliance_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View compliance flags with permission"
ON public.client_compliance_flags
FOR SELECT
USING (public.has_permission(auth.uid(), 'clients.view') OR public.has_permission(auth.uid(), 'qa.view') OR public.has_permission(auth.uid(), 'auth.billing'));

CREATE POLICY "Create compliance flags with permission"
ON public.client_compliance_flags
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'clients.edit') OR public.has_permission(auth.uid(), 'qa.edit'));

CREATE POLICY "Update compliance flags with permission"
ON public.client_compliance_flags
FOR UPDATE
USING (public.has_permission(auth.uid(), 'clients.edit') OR public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'auth.billing'))
WITH CHECK (public.has_permission(auth.uid(), 'clients.edit') OR public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'auth.billing'));

CREATE POLICY "Delete compliance flags with permission"
ON public.client_compliance_flags
FOR DELETE
USING (public.has_permission(auth.uid(), 'clients.delete'));

CREATE INDEX IF NOT EXISTS idx_service_sessions_client_date ON public.client_service_sessions (client_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_flags_client_status ON public.client_compliance_flags (client_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_active_services ON public.clients (stage, active_service_status, billing_status, notes_compliance_status);

CREATE OR REPLACE FUNCTION public.sync_active_services_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _next_reauth date;
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.start_date <= CURRENT_DATE AND OLD.stage IS DISTINCT FROM 'Active' AND NEW.scheduling_status = 'Active' THEN
    NEW.stage := 'Active';
    NEW.active_service_status := 'Active';
    NEW.active_staffing_status := CASE WHEN NEW.rbt IS NULL THEN 'Needs Restaffing' ELSE 'Stable' END;
    NEW.next_action := 'Monitor active services';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.rbt IS NOT NULL AND NEW.rbt IS NULL AND OLD.stage = 'Active' THEN
    NEW.stage := 'Restaffing Needed';
    NEW.staffing_status := 'Needed';
    NEW.active_staffing_status := 'Needs Restaffing';
    NEW.active_alerts := array_append(COALESCE(NEW.active_alerts, '{}'::text[]), 'RBT removed');
    NEW.next_action := 'Reassign RBT';

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.id, 'Reassign RBT', false, CURRENT_DATE, 90),
      (NEW.id, 'Notify staffing team', false, CURRENT_DATE, 91);
  END IF;

  SELECT MIN(expiration_date) - 90
  INTO _next_reauth
  FROM public.client_authorizations
  WHERE client_id = NEW.id
    AND kind IN ('Treatment', 'Reauth')
    AND expiration_date IS NOT NULL
    AND status IN ('Approved', 'Expiring Soon');

  NEW.next_reauth_date := COALESCE(NEW.next_reauth_date, _next_reauth);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_active_services_engine_trigger ON public.clients;
CREATE TRIGGER sync_active_services_engine_trigger
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.sync_active_services_engine();

CREATE OR REPLACE FUNCTION public.sync_service_session_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _client_id uuid;
BEGIN
  _client_id := COALESCE(NEW.client_id, OLD.client_id);

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    NEW.updated_at := now();

    IF NEW.note_status = 'Flagged' THEN
      INSERT INTO public.client_compliance_flags (client_id, source, severity, title, detail, owner, due_date)
      VALUES (NEW.client_id, 'NoteGuard', 'Red', 'Note flagged', COALESCE(NEW.notes, 'Correct flagged session note'), COALESCE(NEW.bcba, 'BCBA'), CURRENT_DATE)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
      VALUES (NEW.client_id, 'Fix note', false, CURRENT_DATE, 92);
    END IF;
  END IF;

  UPDATE public.clients c
  SET scheduled_weekly_hours = COALESCE((SELECT SUM(scheduled_hours) FROM public.client_service_sessions WHERE client_id = _client_id AND session_date >= CURRENT_DATE - 7), 0),
      delivered_weekly_hours = COALESCE((SELECT SUM(delivered_hours) FROM public.client_service_sessions WHERE client_id = _client_id AND session_date >= CURRENT_DATE - 7 AND delivery_status = 'Delivered'), 0),
      sessions_logged = COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND delivery_status = 'Delivered'), 0),
      claims_submitted = COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND claim_status IN ('Submitted', 'Paid')), 0),
      claims_issues = COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND claim_status = 'Issue'), 0),
      noteguard_flags = COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND note_status = 'Flagged'), 0),
      notes_compliance_status = CASE WHEN COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND note_status = 'Flagged'), 0) >= 2 THEN 'Repeated Errors'::public.notes_compliance_status WHEN COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND note_status = 'Flagged'), 0) = 1 THEN 'Flagged'::public.notes_compliance_status ELSE 'Compliant'::public.notes_compliance_status END,
      billing_status = CASE WHEN COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND claim_status = 'Issue'), 0) > 0 THEN 'Claims Issue'::public.billing_claim_status WHEN COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND delivery_status = 'Delivered' AND claim_status = 'Not Submitted'), 0) > 0 THEN 'Delayed Billing'::public.billing_claim_status ELSE 'Current'::public.billing_claim_status END,
      active_alerts = CASE WHEN COALESCE((SELECT COUNT(*) FROM public.client_service_sessions WHERE client_id = _client_id AND note_status = 'Flagged'), 0) > 0 THEN array_append(COALESCE(active_alerts, '{}'::text[]), 'Note compliance issue') ELSE active_alerts END
  WHERE c.id = _client_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_service_session_engine_trigger ON public.client_service_sessions;
CREATE TRIGGER sync_service_session_engine_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.client_service_sessions
FOR EACH ROW
EXECUTE FUNCTION public.sync_service_session_engine();

CREATE OR REPLACE FUNCTION public.sync_compliance_flag_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' AND NEW.status = 'Open' THEN
    UPDATE public.clients
    SET active_alerts = array_append(COALESCE(active_alerts, '{}'::text[]), NEW.title),
        notes_compliance_status = CASE WHEN NEW.source IN ('NoteGuard', 'Amerigroup') THEN 'Flagged'::public.notes_compliance_status ELSE notes_compliance_status END,
        billing_status = CASE WHEN NEW.source = 'Billing' THEN 'Claims Issue'::public.billing_claim_status ELSE billing_status END,
        next_action = CASE WHEN NEW.source IN ('NoteGuard', 'Amerigroup') THEN 'Fix note' WHEN NEW.source = 'Billing' THEN 'Resolve claim issue' ELSE next_action END
    WHERE id = NEW.client_id;

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (
      NEW.client_id,
      CASE WHEN NEW.source IN ('NoteGuard', 'Amerigroup') THEN 'Fix note' WHEN NEW.source = 'Billing' THEN 'Resolve claim issue' WHEN NEW.source = 'Staffing' THEN 'Reassign RBT' WHEN NEW.source = 'Reauth' THEN 'Request progress report' ELSE 'Review active services issue' END,
      false,
      COALESCE(NEW.due_date, CURRENT_DATE),
      93
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_compliance_flag_engine_trigger ON public.client_compliance_flags;
CREATE TRIGGER sync_compliance_flag_engine_trigger
BEFORE INSERT OR UPDATE ON public.client_compliance_flags
FOR EACH ROW
EXECUTE FUNCTION public.sync_compliance_flag_engine();