
CREATE TABLE public.user_email_mfa (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_email_mfa TO authenticated;
GRANT ALL ON public.user_email_mfa TO service_role;
ALTER TABLE public.user_email_mfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own email mfa" ON public.user_email_mfa
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.email_mfa_codes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'verify',
  attempts INT NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_mfa_codes TO service_role;
ALTER TABLE public.email_mfa_codes ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated → only service_role (edge function) can read/write.

CREATE INDEX email_mfa_codes_user_idx ON public.email_mfa_codes(user_id, created_at DESC);
