DO $$ BEGIN
  CREATE TYPE public.staffing_match_status AS ENUM ('Suggested', 'Pending', 'Assigned', 'Rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.staffing_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  rbt_id text NOT NULL,
  rbt_name text NOT NULL,
  status public.staffing_match_status NOT NULL DEFAULT 'Suggested',
  match_score integer NOT NULL DEFAULT 0,
  distance_miles numeric,
  availability_overlap text[] NOT NULL DEFAULT '{}',
  capacity_remaining numeric,
  notes text,
  rejection_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staffing_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View staffing matches with permission" ON public.staffing_matches;
CREATE POLICY "View staffing matches with permission"
ON public.staffing_matches
FOR SELECT
USING (public.has_permission(auth.uid(), 'staffing.view') OR public.has_permission(auth.uid(), 'clients.view'));

DROP POLICY IF EXISTS "Create staffing matches with permission" ON public.staffing_matches;
CREATE POLICY "Create staffing matches with permission"
ON public.staffing_matches
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'staffing.edit') OR public.has_permission(auth.uid(), 'clients.edit'));

DROP POLICY IF EXISTS "Update staffing matches with permission" ON public.staffing_matches;
CREATE POLICY "Update staffing matches with permission"
ON public.staffing_matches
FOR UPDATE
USING (public.has_permission(auth.uid(), 'staffing.edit') OR public.has_permission(auth.uid(), 'clients.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'staffing.edit') OR public.has_permission(auth.uid(), 'clients.edit'));

DROP POLICY IF EXISTS "Delete staffing matches with permission" ON public.staffing_matches;
CREATE POLICY "Delete staffing matches with permission"
ON public.staffing_matches
FOR DELETE
USING (public.has_permission(auth.uid(), 'staffing.edit'));

CREATE INDEX IF NOT EXISTS idx_staffing_matches_client_id ON public.staffing_matches(client_id);
CREATE INDEX IF NOT EXISTS idx_staffing_matches_status ON public.staffing_matches(status);

CREATE OR REPLACE FUNCTION public.sync_staffing_match_engine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();

  IF TG_OP = 'UPDATE' AND NEW.status = 'Assigned' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.clients
    SET rbt = NEW.rbt_name,
        staffing_status = 'Assigned',
        stage = 'Pending Start Date',
        next_action = 'Confirm schedule',
        stage_entered_at = now(),
        staffing_history = COALESCE(staffing_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('date', CURRENT_DATE, 'event', 'RBT assigned: ' || NEW.rbt_name))
    WHERE id = NEW.client_id;

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (NEW.client_id, 'Confirm schedule', false, CURRENT_DATE + 1, 70);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Rejected' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (NEW.client_id, 'Contact candidate', false, CURRENT_DATE, 71);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_staffing_match_engine_trigger ON public.staffing_matches;
CREATE TRIGGER sync_staffing_match_engine_trigger
BEFORE UPDATE ON public.staffing_matches
FOR EACH ROW
EXECUTE FUNCTION public.sync_staffing_match_engine();

REVOKE ALL ON FUNCTION public.sync_staffing_match_engine() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_staffing_match_engine() FROM anon;
REVOKE ALL ON FUNCTION public.sync_staffing_match_engine() FROM authenticated;