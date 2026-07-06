-- Academy runtime progress: durable per-user per-module runtime state.
CREATE TABLE IF NOT EXISTS public.academy_runtime_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NULL,
  journey_slug text NOT NULL,
  track_id text NULL,
  module_id text NOT NULL,
  source_module_id text NULL,
  source_kind text NULL,
  status text NOT NULL DEFAULT 'not_started',
  elapsed_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  last_active_at timestamptz NULL,
  checklist_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  reflection_text text NULL,
  quiz_attempts jsonb NOT NULL DEFAULT '[]'::jsonb,
  centralreach_id text NULL,
  source_system text NOT NULL DEFAULT 'blossom_os',
  source_updated_at timestamptz NULL,
  sync_status text NOT NULL DEFAULT 'local',
  sync_error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique on (user, journey, coalesced track, module) via a normalized expression.
CREATE UNIQUE INDEX IF NOT EXISTS academy_runtime_progress_unique_idx
  ON public.academy_runtime_progress (
    user_id, journey_slug, coalesce(track_id, ''), module_id
  );

CREATE INDEX IF NOT EXISTS academy_runtime_progress_user_idx     ON public.academy_runtime_progress(user_id);
CREATE INDEX IF NOT EXISTS academy_runtime_progress_employee_idx ON public.academy_runtime_progress(employee_id);
CREATE INDEX IF NOT EXISTS academy_runtime_progress_journey_idx  ON public.academy_runtime_progress(journey_slug);
CREATE INDEX IF NOT EXISTS academy_runtime_progress_track_idx    ON public.academy_runtime_progress(track_id);
CREATE INDEX IF NOT EXISTS academy_runtime_progress_module_idx   ON public.academy_runtime_progress(module_id);
CREATE INDEX IF NOT EXISTS academy_runtime_progress_status_idx   ON public.academy_runtime_progress(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_runtime_progress TO authenticated;
GRANT ALL ON public.academy_runtime_progress TO service_role;

ALTER TABLE public.academy_runtime_progress ENABLE ROW LEVEL SECURITY;

-- Own rows: learner reads/writes their own progress.
CREATE POLICY academy_runtime_progress_own_select
  ON public.academy_runtime_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY academy_runtime_progress_own_insert
  ON public.academy_runtime_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY academy_runtime_progress_own_update
  ON public.academy_runtime_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Training/admin roles: read + update all rows (no broad write to arbitrary rows).
CREATE POLICY academy_runtime_progress_admin_select
  ON public.academy_runtime_progress FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'bcba')
    OR public.has_role(auth.uid(), 'clinical_director')
  );

CREATE POLICY academy_runtime_progress_admin_update
  ON public.academy_runtime_progress FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'coo')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'bcba')
    OR public.has_role(auth.uid(), 'clinical_director')
  );

-- updated_at trigger.
CREATE OR REPLACE FUNCTION public.academy_runtime_progress_touch_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS academy_runtime_progress_touch ON public.academy_runtime_progress;
CREATE TRIGGER academy_runtime_progress_touch
  BEFORE UPDATE ON public.academy_runtime_progress
  FOR EACH ROW EXECUTE FUNCTION public.academy_runtime_progress_touch_updated();