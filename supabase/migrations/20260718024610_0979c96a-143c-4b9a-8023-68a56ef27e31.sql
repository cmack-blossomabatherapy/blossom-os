
-- Ensure upsert key exists on rbt_supervision (safe if already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='rbt_supervision_mirror_key'
  ) THEN
    CREATE UNIQUE INDEX rbt_supervision_mirror_key
      ON public.rbt_supervision (rbt_employee_id, bcba_id, supervision_date);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_bcba_supervision_to_rbt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rbt_employee_id uuid;
  v_supervision_date date;
BEGIN
  -- Resolve the RBT employee id from the log's provider_id (which stores the RBT provider)
  v_rbt_employee_id := NEW.provider_id;
  IF v_rbt_employee_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_supervision_date := COALESCE(NEW.occurred_at::date, CURRENT_DATE);

  INSERT INTO public.rbt_supervision (
    rbt_employee_id,
    bcba_id,
    supervision_date,
    supervision_type,
    notes,
    feedback,
    status,
    signed_by_bcba_at,
    acknowledged_by_rbt_at
  ) VALUES (
    v_rbt_employee_id,
    NEW.bcba_id,
    v_supervision_date,
    COALESCE(NEW.supervision_format, 'standard'),
    NEW.notes,
    NEW.feedback,
    CASE
      WHEN NEW.rbt_acknowledged_at IS NOT NULL THEN 'acknowledged'
      WHEN NEW.bcba_signed_at IS NOT NULL THEN 'signed'
      ELSE 'logged'
    END,
    NEW.bcba_signed_at,
    NEW.rbt_acknowledged_at
  )
  ON CONFLICT (rbt_employee_id, bcba_id, supervision_date) DO UPDATE
  SET supervision_type = EXCLUDED.supervision_type,
      notes = EXCLUDED.notes,
      feedback = EXCLUDED.feedback,
      status = EXCLUDED.status,
      signed_by_bcba_at = EXCLUDED.signed_by_bcba_at,
      acknowledged_by_rbt_at = EXCLUDED.acknowledged_by_rbt_at,
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_bcba_supervision_to_rbt ON public.bcba_supervision_logs;
CREATE TRIGGER sync_bcba_supervision_to_rbt
AFTER INSERT OR UPDATE ON public.bcba_supervision_logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_bcba_supervision_to_rbt();
