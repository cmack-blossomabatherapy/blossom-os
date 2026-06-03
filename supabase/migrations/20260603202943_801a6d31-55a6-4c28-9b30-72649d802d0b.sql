
ALTER TABLE public.phone_ai_call_notifications
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS trigger_source text NOT NULL DEFAULT 'auto_webhook',
  ADD COLUMN IF NOT EXISTS triggered_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS triggered_by_email text,
  ADD COLUMN IF NOT EXISTS triggered_by_name text,
  ADD COLUMN IF NOT EXISTS resend_message_id text,
  ADD COLUMN IF NOT EXISTS caller_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS phone_ai_call_notifications_created_at_idx
  ON public.phone_ai_call_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS phone_ai_call_notifications_call_id_idx
  ON public.phone_ai_call_notifications (call_id);
