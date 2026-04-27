DO $$ BEGIN
  CREATE TYPE public.scheduling_status AS ENUM ('Pending Schedule', 'Schedule Created', 'Pending Start', 'Active');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS scheduling_status public.scheduling_status NOT NULL DEFAULT 'Pending Schedule',
ADD COLUMN IF NOT EXISTS case_coordination_document_generated boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pairing_email_sent boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduling_notes text,
ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'Not Synced';

ALTER TABLE public.client_schedule_slots
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'Clinic',
ADD COLUMN IF NOT EXISTS notes text;

CREATE OR REPLACE FUNCTION public.sync_scheduling_start_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.rbt IS NOT NULL AND OLD.rbt IS DISTINCT FROM NEW.rbt THEN
    NEW.scheduling_status := 'Pending Schedule';
    NEW.next_action := 'Build weekly schedule';

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.id, 'Build Weekly Schedule', false, CURRENT_DATE, 80),
      (NEW.id, 'Confirm Availability', false, CURRENT_DATE, 81),
      (NEW.id, 'Set Start Date', false, CURRENT_DATE + 1, 82);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.start_date IS NOT NULL AND OLD.start_date IS DISTINCT FROM NEW.start_date THEN
    NEW.scheduling_status := 'Pending Start';
    NEW.stage := 'Pending Start Date';
    NEW.next_action := 'Confirm BCBA + RBT linked';

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.id, 'Confirm BCBA + RBT linked', false, CURRENT_DATE, 85),
      (NEW.id, 'Prepare for activation', false, NEW.start_date, 86);
  END IF;

  IF NEW.start_date IS NOT NULL AND NEW.start_date <= CURRENT_DATE AND NEW.scheduling_status = 'Pending Start' THEN
    NEW.scheduling_status := 'Active';
    NEW.stage := 'Active';
    NEW.next_action := 'Begin active services monitoring';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_scheduling_start_engine_trigger ON public.clients;
CREATE TRIGGER sync_scheduling_start_engine_trigger
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.sync_scheduling_start_engine();

CREATE OR REPLACE FUNCTION public.sync_schedule_slot_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients
    SET scheduling_status = 'Schedule Created',
        stage = CASE WHEN stage = 'Pending Start Date' THEN stage ELSE 'Pending Schedule' END,
        next_action = 'Generate Case Coordination Document',
        centralreach_sync_status = 'Needs Sync',
        stage_entered_at = now()
    WHERE id = NEW.client_id;

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Generate Case Coordination Document', false, CURRENT_DATE, 83),
      (NEW.client_id, 'Send Pairing Email', false, CURRENT_DATE, 84);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_schedule_slot_engine_trigger ON public.client_schedule_slots;
CREATE TRIGGER sync_schedule_slot_engine_trigger
AFTER INSERT ON public.client_schedule_slots
FOR EACH ROW
EXECUTE FUNCTION public.sync_schedule_slot_engine();

REVOKE ALL ON FUNCTION public.sync_scheduling_start_engine() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_scheduling_start_engine() FROM anon;
REVOKE ALL ON FUNCTION public.sync_scheduling_start_engine() FROM authenticated;
REVOKE ALL ON FUNCTION public.sync_schedule_slot_engine() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_schedule_slot_engine() FROM anon;
REVOKE ALL ON FUNCTION public.sync_schedule_slot_engine() FROM authenticated;