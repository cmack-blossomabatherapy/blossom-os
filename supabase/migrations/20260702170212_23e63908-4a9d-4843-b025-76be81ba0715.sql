
ALTER TABLE public.recruiting_candidates
  ADD COLUMN IF NOT EXISTS external_provider text,
  ADD COLUMN IF NOT EXISTS external_candidate_id text,
  ADD COLUMN IF NOT EXISTS external_profile_url text,
  ADD COLUMN IF NOT EXISTS external_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_payload jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recruiting_candidates_external_identity
  ON public.recruiting_candidates (external_provider, external_candidate_id)
  WHERE external_provider IS NOT NULL AND external_candidate_id IS NOT NULL;
