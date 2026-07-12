
-- Add workflow columns
ALTER TABLE public.escalation_threads
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS blocker text,
  ADD COLUMN IF NOT EXISTS next_step text;

-- Normalize existing status values before adding the constraint
UPDATE public.escalation_threads SET status = 'Resolved' WHERE lower(status) IN ('resolved','closed','done');
UPDATE public.escalation_threads SET status = 'Open' WHERE status IS NULL OR lower(status) IN ('open','new');
UPDATE public.escalation_threads SET status = 'Assigned' WHERE lower(status) = 'assigned';
UPDATE public.escalation_threads SET status = 'In Review' WHERE lower(status) IN ('in review','in_review','review');

-- Backfill owner_id to the recipient (to_user_id) where unset
UPDATE public.escalation_threads SET owner_id = to_user_id WHERE owner_id IS NULL;

-- Enforce the workflow vocabulary
ALTER TABLE public.escalation_threads DROP CONSTRAINT IF EXISTS escalation_threads_status_check;
ALTER TABLE public.escalation_threads
  ADD CONSTRAINT escalation_threads_status_check
  CHECK (status IN ('Open','Assigned','In Review','Resolved'));

ALTER TABLE public.escalation_threads ALTER COLUMN status SET DEFAULT 'Open';
