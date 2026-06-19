
-- 1. Outlook OAuth token vault
CREATE TABLE IF NOT EXISTS public.integration_oauth_token_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oauth_connection_id uuid NOT NULL REFERENCES public.integration_oauth_connections(id) ON DELETE CASCADE,
  integration_id text NOT NULL,
  user_id uuid NOT NULL,
  provider_user_id text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_type text,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  last_refresh_at timestamptz,
  key_version text NOT NULL DEFAULT 'v1',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (oauth_connection_id)
);

GRANT ALL ON public.integration_oauth_token_vault TO service_role;
-- Intentionally NO grants to anon or authenticated: tokens must never reach the browser.

ALTER TABLE public.integration_oauth_token_vault ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by design; add an explicit deny-by-default policy
-- so even if a privilege were accidentally granted, no row is readable.
CREATE POLICY "vault_no_client_access" ON public.integration_oauth_token_vault
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_oauth_vault_user ON public.integration_oauth_token_vault(user_id, integration_id);

CREATE OR REPLACE FUNCTION public.tg_oauth_vault_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_oauth_vault_updated_at ON public.integration_oauth_token_vault;
CREATE TRIGGER trg_oauth_vault_updated_at BEFORE UPDATE ON public.integration_oauth_token_vault
  FOR EACH ROW EXECUTE FUNCTION public.tg_oauth_vault_updated_at();

-- 2. Seed integration_connections (production rows). Idempotent.
INSERT INTO public.integration_connections
  (integration_id, connection_type, environment, status, enabled, credential_mode, secret_names, config)
VALUES
  ('mailchimp',    'api',         'production', 'not_configured', true,  'secret', ARRAY['MAILCHIMP_API_KEY','MAILCHIMP_SERVER_PREFIX'], '{}'::jsonb),
  ('resend',       'api',         'production', 'not_configured', true,  'secret', ARRAY['RESEND_API_KEY'], '{}'::jsonb),
  ('retell',       'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['RETELL_API_KEY','RETELL_WEBHOOK_SECRET','RETELL_AGENT_ID'], '{}'::jsonb),
  ('ctm',          'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['CTM_API_KEY','CTM_WEBHOOK_SECRET'], '{}'::jsonb),
  ('apploi',       'api',         'production', 'not_configured', true,  'secret', ARRAY['APPLOI_API_KEY'], '{}'::jsonb),
  ('centralreach', 'api',         'production', 'not_configured', true,  'secret', ARRAY['CENTRALREACH_CLIENT_ID','CENTRALREACH_CLIENT_SECRET','CENTRALREACH_API_BASE_URL'], '{}'::jsonb),
  ('solum',        'api',         'production', 'not_configured', true,  'secret', ARRAY['SOLUM_API_KEY'], '{}'::jsonb),
  ('eligipro',     'api',         'production', 'not_configured', true,  'secret', ARRAY['ELIGIPRO_API_KEY'], '{}'::jsonb),
  ('ms365',        'oauth',       'production', 'not_configured', true,  'oauth',  ARRAY['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET','MICROSOFT_TENANT_ID','MICROSOFT_REDIRECT_URI','OAUTH_TOKEN_ENCRYPTION_KEY'], '{}'::jsonb),
  ('jivetel',      'api',         'production', 'not_configured', true,  'secret', ARRAY['JIVETEL_API_KEY'], '{}'::jsonb),
  ('make',         'webhook',     'production', 'not_configured', true,  'secret', ARRAY['MAKE_WEBHOOK_SECRET','MAKE_OUTBOUND_WEBHOOK_URL'], '{}'::jsonb),
  ('pandadoc',     'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['PANDADOC_API_KEY','PANDADOC_WEBHOOK_SECRET'], '{}'::jsonb),
  ('leadtrap',     'webhook',     'production', 'not_configured', true,  'secret', ARRAY['LEADTRAP_WEBHOOK_SECRET'], '{}'::jsonb),
  ('calendly',     'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['CALENDLY_CLIENT_ID','CALENDLY_CLIENT_SECRET','CALENDLY_WEBHOOK_SIGNING_KEY'], '{}'::jsonb),
  ('viventium',    'api',         'production', 'not_configured', true,  'secret', ARRAY['VIVENTIUM_API_KEY'], '{}'::jsonb),
  ('google-ads',   'api',         'production', 'not_configured', true,  'secret', ARRAY['GOOGLE_ADS_DEVELOPER_TOKEN','GOOGLE_ADS_CLIENT_ID','GOOGLE_ADS_CLIENT_SECRET','GOOGLE_ADS_REFRESH_TOKEN'], '{}'::jsonb),
  ('meta-ads',     'api',         'production', 'not_configured', true,  'secret', ARRAY['META_ADS_ACCESS_TOKEN','META_ADS_AD_ACCOUNT_ID'], '{}'::jsonb),
  ('fathom',       'api',         'production', 'not_configured', true,  'secret', ARRAY['FATHOM_API_KEY'], '{}'::jsonb),
  ('bloomgrowth',  'api',         'production', 'not_configured', true,  'secret', ARRAY['BLOOMGROWTH_API_KEY'], '{}'::jsonb)
ON CONFLICT DO NOTHING;
