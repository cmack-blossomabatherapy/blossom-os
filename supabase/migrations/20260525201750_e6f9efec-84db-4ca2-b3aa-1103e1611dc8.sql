
CREATE OR REPLACE FUNCTION public.recruiting_track_stage_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    NEW.stage_entered_at = now();
  END IF;
  RETURN NEW;
END $$;
