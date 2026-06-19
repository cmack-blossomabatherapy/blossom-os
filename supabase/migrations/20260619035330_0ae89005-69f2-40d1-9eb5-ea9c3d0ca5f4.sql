
-- =====================================================================
-- Integrations Backend Pass 3
-- =====================================================================

-- 1. Add Go Integrate Nava to the catalog
INSERT INTO public.integration_catalog
  (id, display_name, category, owner_department, criticality, methods, status, source_of_truth_for, dependent_modules, notes)
VALUES
  ('go-integrate-nava','Go Integrate Nava','eligibility','Intake / Authorizations / Operations','standard',
   ARRAY['planned']::text[],'not_configured', ARRAY[]::text[], ARRAY[]::text[],
   'Vendor details pending confirmation. Added as a required integration placeholder so Blossom OS has a backend-ready connection record once credentials and API documentation are available.')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  owner_department = EXCLUDED.owner_department,
  criticality = EXCLUDED.criticality,
  methods = EXCLUDED.methods,
  notes = EXCLUDED.notes,
  updated_at = now();

-- 2. Dedupe integration_connections by natural key, then add unique constraint
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY integration_id, connection_type, environment ORDER BY created_at ASC, id ASC) AS rn
  FROM public.integration_connections
)
DELETE FROM public.integration_connections c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_integration_connections_natural
  ON public.integration_connections (integration_id, connection_type, environment);

-- 3. Idempotent upsert for all required connections, including Go Integrate Nava
INSERT INTO public.integration_connections
  (integration_id, connection_type, environment, status, enabled, credential_mode, secret_names, config)
VALUES
  ('mailchimp',         'api',         'production', 'not_configured', true,  'secret', ARRAY['MAILCHIMP_API_KEY','MAILCHIMP_SERVER_PREFIX'], '{}'::jsonb),
  ('resend',            'api',         'production', 'not_configured', true,  'secret', ARRAY['RESEND_API_KEY'], '{}'::jsonb),
  ('retell',            'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['RETELL_API_KEY','RETELL_WEBHOOK_SECRET','RETELL_AGENT_ID'], '{}'::jsonb),
  ('ctm',               'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['CTM_API_KEY','CTM_WEBHOOK_SECRET'], '{}'::jsonb),
  ('apploi',            'api',         'production', 'not_configured', true,  'secret', ARRAY['APPLOI_API_KEY'], '{}'::jsonb),
  ('centralreach',      'api',         'production', 'not_configured', true,  'secret', ARRAY['CENTRALREACH_CLIENT_ID','CENTRALREACH_CLIENT_SECRET','CENTRALREACH_API_BASE_URL'], '{}'::jsonb),
  ('solum',             'api',         'production', 'not_configured', true,  'secret', ARRAY['SOLUM_API_KEY'], '{}'::jsonb),
  ('eligipro',          'api',         'production', 'not_configured', true,  'secret', ARRAY['ELIGIPRO_API_KEY'], '{}'::jsonb),
  ('ms365',             'oauth',       'production', 'not_configured', true,  'oauth',  ARRAY['MICROSOFT_CLIENT_ID','MICROSOFT_CLIENT_SECRET','MICROSOFT_TENANT_ID','MICROSOFT_REDIRECT_URI','OAUTH_TOKEN_ENCRYPTION_KEY'], '{}'::jsonb),
  ('jivetel',           'api',         'production', 'not_configured', true,  'secret', ARRAY['JIVETEL_API_KEY'], '{}'::jsonb),
  ('make',              'webhook',     'production', 'not_configured', true,  'secret', ARRAY['MAKE_WEBHOOK_SECRET','MAKE_OUTBOUND_WEBHOOK_URL'], '{}'::jsonb),
  ('pandadoc',          'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['PANDADOC_API_KEY','PANDADOC_WEBHOOK_SECRET'], '{}'::jsonb),
  ('leadtrap',          'webhook',     'production', 'not_configured', true,  'secret', ARRAY['LEADTRAP_WEBHOOK_SECRET'], '{}'::jsonb),
  ('calendly',          'api_webhook', 'production', 'not_configured', true,  'secret', ARRAY['CALENDLY_CLIENT_ID','CALENDLY_CLIENT_SECRET','CALENDLY_WEBHOOK_SIGNING_KEY'], '{}'::jsonb),
  ('viventium',         'api',         'production', 'not_configured', true,  'secret', ARRAY['VIVENTIUM_API_KEY'], '{}'::jsonb),
  ('google-ads',        'api',         'production', 'not_configured', true,  'secret', ARRAY['GOOGLE_ADS_DEVELOPER_TOKEN','GOOGLE_ADS_CLIENT_ID','GOOGLE_ADS_CLIENT_SECRET','GOOGLE_ADS_REFRESH_TOKEN'], '{}'::jsonb),
  ('meta-ads',          'api',         'production', 'not_configured', true,  'secret', ARRAY['META_ADS_ACCESS_TOKEN','META_ADS_AD_ACCOUNT_ID'], '{}'::jsonb),
  ('fathom',            'api',         'production', 'not_configured', true,  'secret', ARRAY['FATHOM_API_KEY'], '{}'::jsonb),
  ('bloomgrowth',       'api',         'production', 'not_configured', true,  'secret', ARRAY['BLOOMGROWTH_API_KEY'], '{}'::jsonb),
  ('go-integrate-nava', 'planned',     'production', 'not_configured', false, 'secret', ARRAY['GO_INTEGRATE_NAVA_API_KEY','GO_INTEGRATE_NAVA_WEBHOOK_SECRET'], '{"vendor_details_pending": true}'::jsonb)
ON CONFLICT (integration_id, connection_type, environment) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  credential_mode = EXCLUDED.credential_mode,
  secret_names = EXCLUDED.secret_names,
  config = public.integration_connections.config || EXCLUDED.config,
  updated_at = now();

-- 4. OAuth state nonce table (only hashes are stored)
CREATE TABLE IF NOT EXISTS public.integration_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL,
  user_id uuid NOT NULL,
  state_hash text NOT NULL UNIQUE,
  redirect_to text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.integration_oauth_states TO service_role;
-- No anon/authenticated grants; all writes happen via service-role Edge Functions.

ALTER TABLE public.integration_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oauth_states_no_client_access" ON public.integration_oauth_states;
CREATE POLICY "oauth_states_no_client_access" ON public.integration_oauth_states
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_oauth_states_user ON public.integration_oauth_states(user_id, integration_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.integration_oauth_states(expires_at);
