ALTER TYPE public.client_stage ADD VALUE IF NOT EXISTS 'Pending Initial Authorization';
ALTER TYPE public.client_stage ADD VALUE IF NOT EXISTS 'Waiting on Consent Forms';
ALTER TYPE public.client_stage ADD VALUE IF NOT EXISTS 'Schedule Assessment';

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS lead_id text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS insurance text,
  ADD COLUMN IF NOT EXISTS payment_plan_status text NOT NULL DEFAULT 'Not Required',
  ADD COLUMN IF NOT EXISTS payment_plan_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_plan_signed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ready_for_auth boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS consent_complete boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON public.clients (lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_stage ON public.clients (stage, bcba, auth_status);

CREATE OR REPLACE FUNCTION public.seed_client_onboarding_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.id, 'Client Setup', false, CURRENT_DATE, 0),
      (NEW.id, 'Assign BCBA', false, CURRENT_DATE, 1);

    IF NEW.payment_plan_required AND NOT NEW.payment_plan_signed THEN
      INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
      VALUES
        (NEW.id, 'Send Payment Plan', false, CURRENT_DATE, 2),
        (NEW.id, 'Confirm Payment Plan Received', false, CURRENT_DATE + 1, 3);
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.stage = 'Pending Initial Authorization' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.client_authorizations (client_id, kind, status, notes)
    SELECT NEW.id, 'Initial', 'Not Submitted', 'Auto-created when client entered Pending Initial Authorization'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.client_authorizations
      WHERE client_id = NEW.id AND kind = 'Initial'
    );

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.id, 'Submit Initial Auth', false, CURRENT_DATE, 10),
      (NEW.id, 'Confirm Required Documents', false, CURRENT_DATE, 11),
      (NEW.id, 'Follow up with payor', false, CURRENT_DATE + 3, 12);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS seed_client_onboarding_tasks_trigger ON public.clients;
CREATE TRIGGER seed_client_onboarding_tasks_trigger
AFTER INSERT OR UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.seed_client_onboarding_tasks();