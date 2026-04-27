ALTER TYPE public.auth_kind ADD VALUE IF NOT EXISTS 'Reauth';
ALTER TYPE public.auth_status ADD VALUE IF NOT EXISTS 'Expiring Soon';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_report_status') THEN
    CREATE TYPE public.progress_report_status AS ENUM ('Not Started', 'In Progress', 'Received');
  END IF;
END $$;

ALTER TABLE public.client_authorizations
  ADD COLUMN IF NOT EXISTS payor text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS assigned_auth_coordinator text,
  ADD COLUMN IF NOT EXISTS qa_owner text,
  ADD COLUMN IF NOT EXISTS qa_status public.qa_status NOT NULL DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS treatment_plan_received boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_docs_received boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS missing_docs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_action text NOT NULL DEFAULT 'Submit Authorization',
  ADD COLUMN IF NOT EXISTS blockers text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage_entered_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS progress_report_status public.progress_report_status NOT NULL DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS reauth_source_id uuid;

CREATE INDEX IF NOT EXISTS idx_client_authorizations_status ON public.client_authorizations (status, kind);
CREATE INDEX IF NOT EXISTS idx_client_authorizations_expiration ON public.client_authorizations (expiration_date);
CREATE INDEX IF NOT EXISTS idx_client_authorizations_client_kind ON public.client_authorizations (client_id, kind);

CREATE OR REPLACE FUNCTION public.sync_authorization_revenue_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _consent_complete boolean;
  _target_stage public.client_stage;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stage_entered_at := COALESCE(NEW.stage_entered_at, now());
    IF NEW.payor IS NULL OR NEW.state IS NULL THEN
      SELECT COALESCE(NEW.payor, c.payor), COALESCE(NEW.state, c.state)
      INTO NEW.payor, NEW.state
      FROM public.clients c
      WHERE c.id = NEW.client_id;
    END IF;
    NEW.assigned_auth_coordinator := COALESCE(
      NEW.assigned_auth_coordinator,
      CASE
        WHEN NEW.state = 'GA' THEN 'Kayla / Riki / GA Team'
        WHEN NEW.payor ILIKE '%medicaid%' THEN 'Medicaid Auth Team'
        ELSE 'Kayla'
      END
    );
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.stage_entered_at := now();
  END IF;

  IF NEW.status = 'Submitted' AND NEW.submitted_date IS NULL THEN
    NEW.submitted_date := CURRENT_DATE;
    NEW.next_action := 'Follow up with payor';
  END IF;

  IF NEW.status = 'Approved' THEN
    NEW.approved_date := COALESCE(NEW.approved_date, CURRENT_DATE);
    NEW.next_action := CASE WHEN NEW.kind = 'Treatment' THEN 'Move client to Staffing Needed' ELSE 'Move client forward' END;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT consent_complete INTO _consent_complete FROM public.clients WHERE id = NEW.client_id;
    IF NEW.kind = 'Initial' THEN
      _target_stage := CASE WHEN COALESCE(_consent_complete, false) THEN 'Schedule Assessment' ELSE 'Waiting on Consent Forms' END;
      UPDATE public.clients
      SET auth_status = 'Approved', stage = _target_stage, stage_entered_at = now(), next_action = CASE WHEN COALESCE(_consent_complete, false) THEN 'Schedule assessment' ELSE 'Collect consent forms' END
      WHERE id = NEW.client_id;
    ELSIF NEW.kind IN ('Treatment', 'Reauth') THEN
      UPDATE public.clients
      SET auth_status = 'Approved', stage = 'Staffing Needed', stage_entered_at = now(), staffing_status = 'Needed', next_action = 'Begin staffing match'
      WHERE id = NEW.client_id;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Denied' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Fix documentation', false, CURRENT_DATE, 20),
      (NEW.client_id, 'Resubmit authorization', false, CURRENT_DATE + 1, 21);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Expiring Soon' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Confirm Treatment Plan', false, CURRENT_DATE, 30),
      (NEW.client_id, 'Request Progress Report', false, CURRENT_DATE + 7, 31),
      (NEW.client_id, 'Follow up with BCBA', false, CURRENT_DATE + 14, 32);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_authorization_revenue_gate_trigger ON public.client_authorizations;
CREATE TRIGGER sync_authorization_revenue_gate_trigger
BEFORE INSERT OR UPDATE ON public.client_authorizations
FOR EACH ROW
EXECUTE FUNCTION public.sync_authorization_revenue_gate();

REVOKE ALL ON FUNCTION public.sync_authorization_revenue_gate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_authorization_revenue_gate() FROM anon;
REVOKE ALL ON FUNCTION public.sync_authorization_revenue_gate() FROM authenticated;