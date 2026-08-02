-- 1. Honest per-batch counters for every uploaded file / import session.
ALTER TABLE public.cr_import_batches
  ADD COLUMN IF NOT EXISTS parsed_row_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appended_row_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duplicate_row_count integer NOT NULL DEFAULT 0;

-- 2. Global (cross-batch) dedupe on normalized CentralReach fact tables.
--    Previously unique on (batch_id, row_hash), which only deduped inside one
--    uploaded file. Appending multiple files / sessions requires unique(row_hash).
DROP INDEX IF EXISTS public.cr_billing_sessions_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cr_billing_sessions_row_hash_key
  ON public.cr_billing_sessions(row_hash);
CREATE INDEX IF NOT EXISTS cr_billing_sessions_batch_idx
  ON public.cr_billing_sessions(batch_id);

DROP INDEX IF EXISTS public.cr_schedule_events_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cr_schedule_events_row_hash_key
  ON public.cr_schedule_events(row_hash);
CREATE INDEX IF NOT EXISTS cr_schedule_events_batch_idx
  ON public.cr_schedule_events(batch_id);

DROP INDEX IF EXISTS public.cr_authorizations_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cr_authorizations_row_hash_key
  ON public.cr_authorizations(row_hash);
CREATE INDEX IF NOT EXISTS cr_authorizations_batch_idx
  ON public.cr_authorizations(batch_id);

DROP INDEX IF EXISTS public.cr_auth_utilization_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cr_auth_utilization_row_hash_key
  ON public.cr_authorization_utilization(row_hash);
CREATE INDEX IF NOT EXISTS cr_auth_utilization_batch_idx
  ON public.cr_authorization_utilization(batch_id);

DROP INDEX IF EXISTS public.cr_claims_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cr_claims_row_hash_key
  ON public.cr_claims(row_hash);
CREATE INDEX IF NOT EXISTS cr_claims_batch_idx
  ON public.cr_claims(batch_id);

DROP INDEX IF EXISTS public.cr_contacts_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cr_contacts_row_hash_key
  ON public.cr_contacts(row_hash);
CREATE INDEX IF NOT EXISTS cr_contacts_batch_idx
  ON public.cr_contacts(batch_id);