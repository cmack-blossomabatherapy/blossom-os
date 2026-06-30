
-- Scheduling Pass 3: safe client/provider identity columns
ALTER TABLE public.scheduling_actions
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'blossom_os',
  ADD COLUMN IF NOT EXISTS source_record_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS provider_role TEXT;

ALTER TABLE public.scheduling_coverage_cases
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'blossom_os',
  ADD COLUMN IF NOT EXISTS source_record_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS provider_role TEXT;

ALTER TABLE public.scheduling_cancellations
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'blossom_os',
  ADD COLUMN IF NOT EXISTS source_record_id TEXT;

ALTER TABLE public.scheduling_session_adjustments
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'blossom_os',
  ADD COLUMN IF NOT EXISTS source_record_id TEXT;

ALTER TABLE public.scheduling_contact_attempts
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'blossom_os',
  ADD COLUMN IF NOT EXISTS source_record_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_name TEXT,
  ADD COLUMN IF NOT EXISTS provider_role TEXT;

CREATE INDEX IF NOT EXISTS scheduling_actions_client_key_idx           ON public.scheduling_actions(client_key);
CREATE INDEX IF NOT EXISTS scheduling_actions_client_name_idx          ON public.scheduling_actions(client_name);
CREATE INDEX IF NOT EXISTS scheduling_actions_provider_idx             ON public.scheduling_actions(provider_role, provider_name);

CREATE INDEX IF NOT EXISTS scheduling_coverage_cases_client_key_idx    ON public.scheduling_coverage_cases(client_key);
CREATE INDEX IF NOT EXISTS scheduling_coverage_cases_client_name_idx   ON public.scheduling_coverage_cases(client_name);
CREATE INDEX IF NOT EXISTS scheduling_coverage_cases_provider_idx      ON public.scheduling_coverage_cases(provider_role, provider_name);

CREATE INDEX IF NOT EXISTS scheduling_cancellations_client_key_idx     ON public.scheduling_cancellations(client_key);
CREATE INDEX IF NOT EXISTS scheduling_cancellations_client_name_idx    ON public.scheduling_cancellations(client_name);

CREATE INDEX IF NOT EXISTS scheduling_session_adjustments_client_key_idx  ON public.scheduling_session_adjustments(client_key);
CREATE INDEX IF NOT EXISTS scheduling_session_adjustments_client_name_idx ON public.scheduling_session_adjustments(client_name);

CREATE INDEX IF NOT EXISTS scheduling_contact_attempts_client_key_idx  ON public.scheduling_contact_attempts(client_key);
CREATE INDEX IF NOT EXISTS scheduling_contact_attempts_client_name_idx ON public.scheduling_contact_attempts(client_name);
CREATE INDEX IF NOT EXISTS scheduling_contact_attempts_provider_idx    ON public.scheduling_contact_attempts(provider_role, provider_name);
