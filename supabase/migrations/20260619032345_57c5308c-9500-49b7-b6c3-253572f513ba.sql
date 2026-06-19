
-- =====================================================
-- Integrations Backend Foundation
-- =====================================================

-- 1) integration_catalog ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_catalog (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  category text NOT NULL,
  owner_department text,
  criticality text NOT NULL DEFAULT 'standard',
  methods text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'not_configured',
  source_of_truth_for text[] NOT NULL DEFAULT '{}',
  dependent_modules text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integration_catalog TO authenticated;
GRANT ALL ON public.integration_catalog TO service_role;
ALTER TABLE public.integration_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read integration catalog" ON public.integration_catalog;
CREATE POLICY "Authenticated can read integration catalog"
  ON public.integration_catalog FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage integration catalog" ON public.integration_catalog;
CREATE POLICY "Admins manage integration catalog"
  ON public.integration_catalog FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- 2) integration_connections --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL REFERENCES public.integration_catalog(id) ON DELETE CASCADE,
  connection_type text NOT NULL,
  environment text NOT NULL DEFAULT 'production',
  status text NOT NULL DEFAULT 'not_configured',
  enabled boolean NOT NULL DEFAULT false,
  credential_mode text NOT NULL DEFAULT 'supabase_secret',
  secret_names text[] NOT NULL DEFAULT '{}',
  masked_account text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_tested_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_connections_integration_id ON public.integration_connections(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_status ON public.integration_connections(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_connections TO authenticated;
GRANT ALL ON public.integration_connections TO service_role;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage integration connections" ON public.integration_connections;
CREATE POLICY "Admins manage integration connections"
  ON public.integration_connections FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- 3) integration_sync_runs ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL REFERENCES public.integration_catalog(id),
  connection_id uuid REFERENCES public.integration_connections(id) ON DELETE SET NULL,
  run_type text NOT NULL,
  direction text NOT NULL DEFAULT 'inbound',
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  records_received integer NOT NULL DEFAULT 0,
  records_created integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_integration_sync_runs_integration_id ON public.integration_sync_runs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_runs_started_at ON public.integration_sync_runs(started_at DESC);

GRANT SELECT ON public.integration_sync_runs TO authenticated;
GRANT ALL ON public.integration_sync_runs TO service_role;
ALTER TABLE public.integration_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sync runs" ON public.integration_sync_runs;
CREATE POLICY "Admins read sync runs"
  ON public.integration_sync_runs FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- 4) integration_webhook_events ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL REFERENCES public.integration_catalog(id),
  connection_id uuid REFERENCES public.integration_connections(id) ON DELETE SET NULL,
  provider_event_id text,
  event_type text,
  verification_status text NOT NULL DEFAULT 'unverified',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_status text NOT NULL DEFAULT 'received',
  error_message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_ip text
);

CREATE INDEX IF NOT EXISTS idx_integration_webhook_events_integration_id ON public.integration_webhook_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_webhook_events_received_at ON public.integration_webhook_events(received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_integration_webhook_events_provider_event
  ON public.integration_webhook_events(integration_id, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

GRANT SELECT ON public.integration_webhook_events TO authenticated;
GRANT ALL ON public.integration_webhook_events TO service_role;
ALTER TABLE public.integration_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read webhook events" ON public.integration_webhook_events;
CREATE POLICY "Admins read webhook events"
  ON public.integration_webhook_events FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- 5) integration_oauth_connections -------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL REFERENCES public.integration_catalog(id),
  user_id uuid NOT NULL,
  provider_user_id text,
  provider_email text,
  display_name text,
  scopes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'not_connected',
  token_secret_name text,
  refresh_secret_name text,
  expires_at timestamptz,
  last_connected_at timestamptz,
  last_refresh_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_connections_user_id ON public.integration_oauth_connections(user_id);

GRANT SELECT ON public.integration_oauth_connections TO authenticated;
GRANT ALL ON public.integration_oauth_connections TO service_role;
ALTER TABLE public.integration_oauth_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own oauth connections" ON public.integration_oauth_connections;
CREATE POLICY "Users read own oauth connections"
  ON public.integration_oauth_connections FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- 6) external_identity_links --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  blossom_id uuid,
  blossom_text_id text,
  integration_id text NOT NULL REFERENCES public.integration_catalog(id),
  external_id text NOT NULL,
  external_url text,
  display_label text,
  last_verified_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_external_identity_links
  ON public.external_identity_links(integration_id, entity_type, external_id);
CREATE INDEX IF NOT EXISTS idx_external_identity_links_blossom_id ON public.external_identity_links(blossom_id);

GRANT SELECT ON public.external_identity_links TO authenticated;
GRANT ALL ON public.external_identity_links TO service_role;
ALTER TABLE public.external_identity_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read external identity links" ON public.external_identity_links;
CREATE POLICY "Admins read external identity links"
  ON public.external_identity_links FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- 7) integration_events -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL REFERENCES public.integration_catalog(id),
  source_event_id uuid REFERENCES public.integration_webhook_events(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  entity_text_id text,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_name text,
  external_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_events_integration_id ON public.integration_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_occurred_at ON public.integration_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_events_entity ON public.integration_events(entity_type, entity_id);

GRANT SELECT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read integration events" ON public.integration_events;
CREATE POLICY "Admins read integration events"
  ON public.integration_events FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

-- =====================================================
-- updated_at triggers
-- =====================================================
CREATE OR REPLACE FUNCTION public.tg_integrations_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.integration_catalog;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integration_catalog
  FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.integration_connections;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.integration_oauth_connections;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.integration_oauth_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.external_identity_links;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.external_identity_links
  FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();

-- =====================================================
-- Seed integration_catalog
-- =====================================================
INSERT INTO public.integration_catalog (id, display_name, category, owner_department, criticality, methods, status, source_of_truth_for, dependent_modules, notes) VALUES
  ('centralreach','CentralReach','clinical_emr','Clinical Operations','critical','{api,file_import}','connected','{Clinical EMR,Billing,Clinical scheduling,Authorizations}','{Clinical Dashboard,BCBA Dashboard,Scheduling,Authorizations,QA,Reports}','EMR — Blossom OS integrates, does not replace.'),
  ('viventium','Viventium','hris','HR Team','critical','{api,file_import}','connected','{Employee lifecycle,Payroll,Hire/termination dates}','{User Management,Employee Directory,HR Dashboard}','Governs employee lifecycle.'),
  ('apploi','Apploi','recruiting','Recruiting / HR','critical','{api}','connected','{Applicant tracking,Recruiting pipeline}','{Recruiting Dashboard,Candidate Pipeline}','ATS for RBT/BCBA recruiting.'),
  ('ms365','Microsoft Outlook / Microsoft 365','communications','Operations / All Departments','critical','{oauth,api}','configured','{Email,Internal calendar}','{Communications,Patient Lifetime Journey,Recruiting Interviews}','Per-user OAuth for email and calendar.'),
  ('jivetel','Jivetel','communications','HR / Operations / Marketing','standard','{api}','configured','{Phone system,Extensions}','{Phone System,Shared Lines,Directory}','Office phone system.'),
  ('ctm','CTM / CallTrackingMetrics','marketing','Marketing Team','critical','{api,webhook}','connected','{Inbound call attribution}','{Marketing Dashboard,Intake Dashboard,Patient Lifetime Journey}','Critical for lead attribution.'),
  ('retell','Retell AI','ai_voice','Marketing / Intake / Operations','standard','{webhook,api}','connected','{After-hours AI voice}','{After-Hours Calls,Intake Dashboard,Patient Lifetime Journey}','Captures after-hours intake.'),
  ('leadtrap','LeadTrap','lead_capture','Marketing / Intake','standard','{webhook}','configured','{Web lead capture}','{Lead Sources,Referral Queue,Intake Dashboard}','Routes web leads into intake.'),
  ('mailchimp','Mailchimp','marketing','Marketing Team','standard','{api}','configured','{Email marketing campaigns}','{Marketing Dashboard,Campaigns,Patient Lifetime Journey}','Marketing email + nurture.'),
  ('resend','Resend','communications','Operations / Platform','critical','{api}','connected','{Transactional email delivery}','{User Management invites,Welcome emails,Email MFA,Evaluation emails}','Powers transactional email across Blossom OS. Already in production.'),
  ('google-ads','Google Ads','marketing','Marketing Team','standard','{api}','connected','{Paid search performance}','{Marketing Dashboard,Lead Sources,Attribution & ROI}','Paid search performance.'),
  ('meta-ads','Facebook Ads / Meta Ads','marketing','Marketing Team','standard','{api}','connected','{Paid social performance}','{Marketing Dashboard,Lead Sources}','Paid social performance.'),
  ('solum','Solom / Solum','eligibility','Intake / Authorizations','maybe','{api,manual_upload}','maybe','{VOB workflow}','{Intake Dashboard,Authorizations,Patient Lifetime Journey}','Vendor spelling unconfirmed.'),
  ('eligipro','Eligipro','eligibility','Intake / Authorizations','standard','{api}','connected','{Real-time eligibility}','{Intake,Authorizations,Patient Lifetime Journey}','Real-time eligibility verification.'),
  ('pandadoc','PandaDoc','documents','Intake / HR / Operations','standard','{api,webhook}','needs_attention','{}','{Intake,HR onboarding,Resource management}','E-signature only. Not a source of truth.'),
  ('calendly','Calendly','meetings','Recruiting / Intake / BD','standard','{api,embedded_link}','connected','{External booking links}','{Recruiting Interviews,Intake Parent Communication}','External-facing scheduling.'),
  ('fathom','Fathom AI','meetings','Leadership / Operations','maybe','{api}','maybe','{Meeting transcripts}','{Operations Command Center,Department Scorecards}','AI meeting notes — pending rollout.'),
  ('bloomgrowth','BloomGrowth','meetings','Executive / Operations Leadership','standard','{api,embedded_link}','configured','{L10 meeting cadence}','{Executive Dashboard,Operations Dashboard}','EOS / L10 leadership meeting OS.'),
  ('make','Make.com','marketing','Operations / Platform','standard','{webhook,api}','configured','{}','{Lead Sources,Patient Lifetime Journey}','Automation bridge during migration only — not the long-term source of truth.')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  owner_department = EXCLUDED.owner_department,
  criticality = EXCLUDED.criticality,
  methods = EXCLUDED.methods,
  status = EXCLUDED.status,
  source_of_truth_for = EXCLUDED.source_of_truth_for,
  dependent_modules = EXCLUDED.dependent_modules,
  notes = EXCLUDED.notes,
  updated_at = now();
