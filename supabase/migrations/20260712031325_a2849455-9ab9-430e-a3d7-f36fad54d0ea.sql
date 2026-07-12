ALTER TABLE public.escalation_thread_messages
ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;