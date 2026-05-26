
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  role text,
  active_state text,
  conversation_id uuid,
  prompt text NOT NULL,
  response_preview text,
  kb_hits jsonb NOT NULL DEFAULT '[]'::jsonb,
  tools_called jsonb NOT NULL DEFAULT '[]'::jsonb,
  records_accessed jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  duration_ms integer,
  status text NOT NULL DEFAULT 'ok',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_created ON public.ai_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON public.ai_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_role ON public.ai_audit_log (role, created_at DESC);

ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view AI audit log" ON public.ai_audit_log;
CREATE POLICY "Admins can view AI audit log"
  ON public.ai_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));
