
-- Assistant State Director existence check (idempotent).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'assistant_state_director') THEN
    ALTER TYPE public.app_role ADD VALUE 'assistant_state_director';
  END IF;
END $$;

ALTER TABLE public.state_operational_tasks
  ADD COLUMN IF NOT EXISTS authorization_id   TEXT,
  ADD COLUMN IF NOT EXISTS scheduling_item_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata           JSONB;

ALTER TABLE public.state_operational_escalations
  ADD COLUMN IF NOT EXISTS authorization_id   TEXT,
  ADD COLUMN IF NOT EXISTS scheduling_item_id TEXT,
  ADD COLUMN IF NOT EXISTS source_module      TEXT,
  ADD COLUMN IF NOT EXISTS metadata           JSONB;

ALTER TABLE public.state_department_handoffs
  ADD COLUMN IF NOT EXISTS authorization_id   TEXT,
  ADD COLUMN IF NOT EXISTS scheduling_item_id TEXT,
  ADD COLUMN IF NOT EXISTS source_module      TEXT,
  ADD COLUMN IF NOT EXISTS metadata           JSONB;

ALTER TABLE public.state_operational_activity
  ADD COLUMN IF NOT EXISTS metadata           JSONB;
