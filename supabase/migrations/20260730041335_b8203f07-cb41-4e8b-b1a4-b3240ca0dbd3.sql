CREATE TABLE IF NOT EXISTS public.apploi_outbound_status_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  external_candidate_id text NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  requested_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT apploi_outbound_status_valid CHECK (status IN ('pending','sent','failed','blocked_scope','skipped'))
);

CREATE INDEX IF NOT EXISTS idx_apploi_outbound_status_pending
  ON public.apploi_outbound_status_queue (status, created_at);
CREATE INDEX IF NOT EXISTS idx_apploi_outbound_status_candidate
  ON public.apploi_outbound_status_queue (candidate_id);

GRANT SELECT ON public.apploi_outbound_status_queue TO authenticated;
GRANT ALL ON public.apploi_outbound_status_queue TO service_role;

ALTER TABLE public.apploi_outbound_status_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiting and admins can view Apploi outbound queue"
ON public.apploi_outbound_status_queue
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'recruiting_lead')
  OR public.has_role(auth.uid(), 'recruiting_coordinator')
  OR public.has_role(auth.uid(), 'recruiting_assistant')
  OR public.has_role(auth.uid(), 'hr_admin')
  OR public.has_role(auth.uid(), 'hr_lead')
);

CREATE OR REPLACE FUNCTION public.apploi_touch_outbound_queue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apploi_outbound_touch ON public.apploi_outbound_status_queue;
CREATE TRIGGER trg_apploi_outbound_touch
BEFORE UPDATE ON public.apploi_outbound_status_queue
FOR EACH ROW EXECUTE FUNCTION public.apploi_touch_outbound_queue();

CREATE OR REPLACE FUNCTION public.enqueue_apploi_status_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage
     AND NEW.external_provider = 'apploi'
     AND NEW.external_candidate_id IS NOT NULL THEN
    INSERT INTO public.apploi_outbound_status_queue
      (candidate_id, external_candidate_id, from_stage, to_stage, requested_by)
    VALUES
      (NEW.id, NEW.external_candidate_id, OLD.pipeline_stage::text, NEW.pipeline_stage::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_apploi_status_push ON public.recruiting_candidates;
CREATE TRIGGER trg_enqueue_apploi_status_push
AFTER UPDATE ON public.recruiting_candidates
FOR EACH ROW EXECUTE FUNCTION public.enqueue_apploi_status_push();