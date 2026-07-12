-- Conflict-safe merge for per-user training progress with realtime enabled.
-- Multi-device / offline sync: server-side merge always keeps the "highest" state
-- so a late-arriving stale write can never regress a completed module.

-- Rank order: completed > in_progress > overdue > not_started
CREATE OR REPLACE FUNCTION public._training_status_rank(_s text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _s
    WHEN 'completed' THEN 3
    WHEN 'in_progress' THEN 2
    WHEN 'overdue' THEN 1
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.merge_user_training_progress(
  _training_id text,
  _status text,
  _progress_percent int,
  _started_at timestamptz,
  _completed_at timestamptz
)
RETURNS public.user_training_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.user_training_progress;
  _existing public.user_training_progress;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO _existing
    FROM public.user_training_progress
   WHERE user_id = _uid AND training_id = _training_id
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_training_progress(
      user_id, training_id, status, progress_percent, started_at, completed_at
    ) VALUES (
      _uid, _training_id, COALESCE(_status,'not_started'),
      COALESCE(_progress_percent,0), _started_at, _completed_at
    )
    RETURNING * INTO _row;
    RETURN _row;
  END IF;

  UPDATE public.user_training_progress
     SET status = CASE
           WHEN public._training_status_rank(_status) >= public._training_status_rank(_existing.status)
             THEN COALESCE(_status, _existing.status)
           ELSE _existing.status
         END,
         progress_percent = GREATEST(COALESCE(_existing.progress_percent,0), COALESCE(_progress_percent,0)),
         started_at = LEAST(
           COALESCE(_existing.started_at, _started_at, now()),
           COALESCE(_started_at, _existing.started_at, now())
         ),
         completed_at = CASE
           WHEN _existing.completed_at IS NOT NULL AND _completed_at IS NOT NULL
             THEN LEAST(_existing.completed_at, _completed_at)
           ELSE COALESCE(_existing.completed_at, _completed_at)
         END,
         updated_at = now()
   WHERE id = _existing.id
   RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_user_training_progress(text, text, int, timestamptz, timestamptz) TO authenticated;

-- Ensure realtime delivers row changes so other devices update live.
ALTER TABLE public.user_training_progress REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_training_progress'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_training_progress';
  END IF;
END $$;