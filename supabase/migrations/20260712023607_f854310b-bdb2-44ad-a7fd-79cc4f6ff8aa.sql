-- CTM call events
CREATE TABLE public.ctm_call_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ctm_call_id text NOT NULL UNIQUE,
  ctm_account_id text,
  direction text,
  status text,
  from_number text,
  to_number text,
  tracking_number text,
  caller_name text,
  caller_city text,
  caller_state text,
  caller_zip text,
  duration_seconds integer,
  talk_time_seconds integer,
  recording_url text,
  transcript text,
  tags text[] DEFAULT ARRAY[]::text[],
  source_name text,
  campaign_name text,
  called_at timestamptz,
  ended_at timestamptz,
  resolved_state text,
  resolved_source_id uuid,
  resolved_campaign_id uuid,
  intake_lead_id uuid,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ctm_call_events_called_at ON public.ctm_call_events (called_at DESC);
CREATE INDEX idx_ctm_call_events_from ON public.ctm_call_events (from_number);
CREATE INDEX idx_ctm_call_events_tracking ON public.ctm_call_events (tracking_number);
CREATE INDEX idx_ctm_call_events_lead ON public.ctm_call_events (intake_lead_id);

GRANT SELECT ON public.ctm_call_events TO authenticated;
GRANT ALL ON public.ctm_call_events TO service_role;
ALTER TABLE public.ctm_call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctm_call_events_auth_read" ON public.ctm_call_events
  FOR SELECT TO authenticated USING (true);

-- CTM tracking number mapping
CREATE TABLE public.ctm_number_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text NOT NULL UNIQUE,
  friendly_name text,
  state_code text,
  marketing_source_id uuid,
  marketing_campaign_id uuid,
  default_intake_owner uuid,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ctm_number_mapping TO authenticated;
GRANT ALL ON public.ctm_number_mapping TO service_role;
ALTER TABLE public.ctm_number_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ctm_number_mapping_auth_read" ON public.ctm_number_mapping
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ctm_number_mapping_admin_write" ON public.ctm_number_mapping
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
  );
CREATE POLICY "ctm_number_mapping_admin_update" ON public.ctm_number_mapping
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
  );
CREATE POLICY "ctm_number_mapping_admin_delete" ON public.ctm_number_mapping
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
  );

-- CTM sync runs (audit)
CREATE TABLE public.ctm_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  calls_fetched integer NOT NULL DEFAULT 0,
  calls_upserted integer NOT NULL DEFAULT 0,
  leads_created integer NOT NULL DEFAULT 0,
  error text,
  detail jsonb
);
GRANT SELECT ON public.ctm_sync_runs TO authenticated;
GRANT ALL ON public.ctm_sync_runs TO service_role;
ALTER TABLE public.ctm_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctm_sync_runs_leadership_read" ON public.ctm_sync_runs
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
  );

-- Link CTM calls to intake leads and marketing call events
ALTER TABLE public.intake_leads ADD COLUMN IF NOT EXISTS ctm_call_id text;
CREATE INDEX IF NOT EXISTS idx_intake_leads_ctm_call ON public.intake_leads (ctm_call_id);

ALTER TABLE public.marketing_call_events ADD COLUMN IF NOT EXISTS ctm_call_id text;
CREATE INDEX IF NOT EXISTS idx_marketing_call_events_ctm ON public.marketing_call_events (ctm_call_id);

-- updated_at triggers
CREATE TRIGGER trg_ctm_call_events_updated_at
  BEFORE UPDATE ON public.ctm_call_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ctm_number_mapping_updated_at
  BEFORE UPDATE ON public.ctm_number_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime for live call panels
ALTER PUBLICATION supabase_realtime ADD TABLE public.ctm_call_events;