CREATE TABLE public.invite_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  resend_message_id TEXT,
  error_message TEXT,
  roles TEXT[] NOT NULL DEFAULT '{}',
  invited_user_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_email_logs_created_at ON public.invite_email_logs (created_at DESC);
CREATE INDEX idx_invite_email_logs_recipient_email ON public.invite_email_logs (recipient_email);
CREATE INDEX idx_invite_email_logs_status ON public.invite_email_logs (status);

ALTER TABLE public.invite_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invite email logs"
ON public.invite_email_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage invite email logs"
ON public.invite_email_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');