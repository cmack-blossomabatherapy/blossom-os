CREATE INDEX IF NOT EXISTS cr_timesheet_status_current_batch_idx
ON public.cr_timesheet_status ((COALESCE(last_seen_batch_id, batch_id)));