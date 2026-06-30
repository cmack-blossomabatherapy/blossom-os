
-- Helper: marketing-access predicate (admins + marketing roles)
CREATE OR REPLACE FUNCTION public.is_marketing_user(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role IN ('admin','super_admin','marketing','marketing_team','marketing_growth_lead')
  );
$$;

-- ============ marketing_sources ============
CREATE TABLE public.marketing_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_system text,           -- e.g. 'ctm','leadtrap','facebook_ads','google_ads','mailchimp','referral','manual','website'
  channel text,                 -- 'paid','organic','referral','phone','email','community'
  state text,
  owner_id uuid,
  external_id text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_sources TO authenticated;
GRANT ALL ON public.marketing_sources TO service_role;
ALTER TABLE public.marketing_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketing can read sources" ON public.marketing_sources
  FOR SELECT TO authenticated USING (public.is_marketing_user(auth.uid()));
CREATE POLICY "Marketing can write sources" ON public.marketing_sources
  FOR ALL TO authenticated
  USING (public.is_marketing_user(auth.uid()))
  WITH CHECK (public.is_marketing_user(auth.uid()));

-- ============ marketing_campaigns ============
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text,                 -- 'facebook_ads','google_ads','email','seo','community','referral'
  state text,
  status text NOT NULL DEFAULT 'draft',  -- draft|active|paused|completed|archived
  budget_cents bigint,
  start_date date,
  end_date date,
  owner_id uuid,
  source_id uuid REFERENCES public.marketing_sources(id) ON DELETE SET NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  notes text,
  external_id text,
  source_system text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketing can read campaigns" ON public.marketing_campaigns
  FOR SELECT TO authenticated USING (public.is_marketing_user(auth.uid()));
CREATE POLICY "Marketing can write campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (public.is_marketing_user(auth.uid()))
  WITH CHECK (public.is_marketing_user(auth.uid()));

-- ============ marketing_source_events ============
CREATE TABLE public.marketing_source_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  source_id uuid REFERENCES public.marketing_sources(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  external_id text,
  event_type text,                  -- 'lead','call','form','message','click','conversion'
  occurred_at timestamptz NOT NULL DEFAULT now(),
  state text,
  caller_name text,
  caller_phone text,
  caller_email text,
  payload_summary text,
  raw_payload jsonb,
  status text NOT NULL DEFAULT 'new',  -- new|attached|created|ignored|review
  lead_id uuid REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  referral_contact_id uuid,
  referral_company_id uuid,
  central_reach_client_id text,
  central_reach_patient_id text,
  sync_status text,
  last_synced_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mse_status ON public.marketing_source_events(status);
CREATE INDEX idx_mse_source_system ON public.marketing_source_events(source_system);
CREATE INDEX idx_mse_state ON public.marketing_source_events(state);
CREATE INDEX idx_mse_occurred_at ON public.marketing_source_events(occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_source_events TO authenticated;
GRANT ALL ON public.marketing_source_events TO service_role;
ALTER TABLE public.marketing_source_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketing can read events" ON public.marketing_source_events
  FOR SELECT TO authenticated USING (public.is_marketing_user(auth.uid()));
CREATE POLICY "Marketing can write events" ON public.marketing_source_events
  FOR ALL TO authenticated
  USING (public.is_marketing_user(auth.uid()))
  WITH CHECK (public.is_marketing_user(auth.uid()));

-- ============ marketing_campaign_metrics ============
CREATE TABLE public.marketing_campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  spend_cents bigint NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  source_system text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, metric_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_metrics TO authenticated;
GRANT ALL ON public.marketing_campaign_metrics TO service_role;
ALTER TABLE public.marketing_campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketing can read metrics" ON public.marketing_campaign_metrics
  FOR SELECT TO authenticated USING (public.is_marketing_user(auth.uid()));
CREATE POLICY "Marketing can write metrics" ON public.marketing_campaign_metrics
  FOR ALL TO authenticated
  USING (public.is_marketing_user(auth.uid()))
  WITH CHECK (public.is_marketing_user(auth.uid()));

-- ============ marketing_call_events ============
CREATE TABLE public.marketing_call_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text,           -- 'ctm','jivetel','retellai','manual'
  external_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  caller_name text,
  caller_phone text,
  state text,
  source_id uuid REFERENCES public.marketing_sources(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  status text,                   -- 'answered','missed','voicemail'
  duration_seconds integer,
  recording_url text,
  transcript_summary text,
  lead_id uuid REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  referral_contact_id uuid,
  referral_company_id uuid,
  follow_up_action text,
  raw_payload jsonb,
  central_reach_client_id text,
  central_reach_patient_id text,
  sync_status text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mce_occurred_at ON public.marketing_call_events(occurred_at DESC);
CREATE INDEX idx_mce_source ON public.marketing_call_events(source_system);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_call_events TO authenticated;
GRANT ALL ON public.marketing_call_events TO service_role;
ALTER TABLE public.marketing_call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketing can read call events" ON public.marketing_call_events
  FOR SELECT TO authenticated USING (public.is_marketing_user(auth.uid()));
CREATE POLICY "Marketing can write call events" ON public.marketing_call_events
  FOR ALL TO authenticated
  USING (public.is_marketing_user(auth.uid()))
  WITH CHECK (public.is_marketing_user(auth.uid()));

-- ============ marketing_email_events ============
CREATE TABLE public.marketing_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text,           -- 'mailchimp','outlook','manual'
  external_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  event_type text,              -- 'sent','open','click','bounce','unsubscribe'
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  list_name text,
  subject text,
  recipient_email text,
  lead_id uuid REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  referral_contact_id uuid,
  state text,
  raw_payload jsonb,
  sync_status text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mee_occurred_at ON public.marketing_email_events(occurred_at DESC);
CREATE INDEX idx_mee_campaign ON public.marketing_email_events(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_email_events TO authenticated;
GRANT ALL ON public.marketing_email_events TO service_role;
ALTER TABLE public.marketing_email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketing can read email events" ON public.marketing_email_events
  FOR SELECT TO authenticated USING (public.is_marketing_user(auth.uid()));
CREATE POLICY "Marketing can write email events" ON public.marketing_email_events
  FOR ALL TO authenticated
  USING (public.is_marketing_user(auth.uid()))
  WITH CHECK (public.is_marketing_user(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_marketing_sources_updated BEFORE UPDATE ON public.marketing_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_marketing_campaigns_updated BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_marketing_source_events_updated BEFORE UPDATE ON public.marketing_source_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_marketing_campaign_metrics_updated BEFORE UPDATE ON public.marketing_campaign_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_marketing_call_events_updated BEFORE UPDATE ON public.marketing_call_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_marketing_email_events_updated BEFORE UPDATE ON public.marketing_email_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
