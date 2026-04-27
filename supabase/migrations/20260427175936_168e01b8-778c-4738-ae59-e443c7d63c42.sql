CREATE OR REPLACE FUNCTION public.sync_authorization_revenue_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _consent_complete boolean;
  _target_stage public.client_stage;
  _staffing_status public.staffing_status;
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

    IF NEW.kind = 'Treatment' THEN
      NEW.treatment_plan_linked := COALESCE(NEW.treatment_plan_linked, true);
      NEW.treatment_plan_received := COALESCE(NEW.treatment_plan_received, true);
      NEW.next_action := COALESCE(NULLIF(NEW.next_action, ''), 'Submit Treatment Authorization');
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.stage_entered_at := now();
  END IF;

  IF NEW.status = 'Submitted' THEN
    NEW.submitted_date := COALESCE(NEW.submitted_date, CURRENT_DATE);
    NEW.next_action := 'Follow up with payor';
    NEW.submission_history := COALESCE(NEW.submission_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('status', 'Submitted', 'date', CURRENT_DATE));
  END IF;

  IF NEW.status = 'Approved' THEN
    NEW.approved_date := COALESCE(NEW.approved_date, CURRENT_DATE);
    NEW.next_action := CASE WHEN NEW.kind IN ('Treatment', 'Reauth') THEN 'Move client to staffing' ELSE 'Move client forward' END;
    NEW.authorization_period := COALESCE(NEW.authorization_period, CASE WHEN NEW.expiration_date IS NOT NULL THEN NEW.approved_date::text || ' – ' || NEW.expiration_date::text ELSE NULL END);
  END IF;

  IF NEW.status = 'Approved' AND NEW.expiration_date IS NOT NULL AND NEW.expiration_date <= CURRENT_DATE + 90 THEN
    NEW.status := 'Expiring Soon';
    NEW.next_action := 'Start reauthorization';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT consent_complete, staffing_status INTO _consent_complete, _staffing_status FROM public.clients WHERE id = NEW.client_id;
    IF NEW.kind = 'Initial' THEN
      _target_stage := CASE WHEN COALESCE(_consent_complete, false) THEN 'Schedule Assessment' ELSE 'Waiting on Consent Forms' END;
      UPDATE public.clients
      SET auth_status = 'Approved', stage = _target_stage, stage_entered_at = now(), next_action = CASE WHEN COALESCE(_consent_complete, false) THEN 'Schedule assessment' ELSE 'Collect consent forms' END
      WHERE id = NEW.client_id;
    ELSIF NEW.kind IN ('Treatment', 'Reauth') THEN
      UPDATE public.clients
      SET auth_status = 'Approved',
          stage = CASE WHEN _staffing_status = 'Assigned' THEN 'Pending Start Date' ELSE 'Staffing Needed' END,
          stage_entered_at = now(),
          staffing_status = CASE WHEN _staffing_status = 'Assigned' THEN _staffing_status ELSE 'Needed' END,
          next_action = CASE WHEN _staffing_status = 'Assigned' THEN 'Confirm start date' ELSE 'Begin staffing match' END
      WHERE id = NEW.client_id;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.kind = 'Treatment' AND NEW.status = 'Not Submitted' THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Submit Treatment Auth', false, CURRENT_DATE, 60),
      (NEW.client_id, 'Verify Treatment Plan Attached', false, CURRENT_DATE, 61),
      (NEW.client_id, 'Confirm Required Docs', false, CURRENT_DATE, 62);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Denied' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.escalation_owner := COALESCE(NEW.escalation_owner, 'Devorah');
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Correct documentation', false, CURRENT_DATE, 63),
      (NEW.client_id, 'Resubmit auth', false, CURRENT_DATE + 1, 64),
      (NEW.client_id, 'Escalate denied authorization to Devorah', false, CURRENT_DATE, 65);

    UPDATE public.clients
    SET blockers = array_append(blockers, 'Denied treatment authorization'), next_action = 'Fix documentation and resubmit auth'
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Expiring Soon' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_authorizations (client_id, kind, status, payor, state, assigned_auth_coordinator, next_action, reauth_source_id)
    SELECT NEW.client_id, 'Reauth', 'Not Submitted', NEW.payor, NEW.state, NEW.assigned_auth_coordinator, 'Confirm Treatment Plan', NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.client_authorizations
      WHERE client_id = NEW.client_id AND kind = 'Reauth' AND reauth_source_id = NEW.id
    );

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Confirm Treatment Plan', false, CURRENT_DATE, 66),
      (NEW.client_id, 'Request Progress Report', false, CURRENT_DATE + 7, 67),
      (NEW.client_id, 'Follow up with BCBA', false, CURRENT_DATE + 14, 68);
  END IF;

  NEW.updated_at := now();
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