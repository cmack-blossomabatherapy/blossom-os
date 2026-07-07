
-- Pass 8: expand sync_status vocabulary and de-dupe active outbox rows.

ALTER TABLE public.state_centralreach_outbox
  DROP CONSTRAINT IF EXISTS state_centralreach_outbox_sync_status_check;

ALTER TABLE public.state_centralreach_outbox
  ADD CONSTRAINT state_centralreach_outbox_sync_status_check
  CHECK (sync_status IN ('not_connected','pending','ready','synced','error','failed'));

-- Prevent duplicate active queue rows for the same source item.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_state_cr_outbox_active_source
  ON public.state_centralreach_outbox (state_code, source_type, source_id)
  WHERE source_id IS NOT NULL
    AND sync_status IN ('not_connected','pending','ready','error','failed');
