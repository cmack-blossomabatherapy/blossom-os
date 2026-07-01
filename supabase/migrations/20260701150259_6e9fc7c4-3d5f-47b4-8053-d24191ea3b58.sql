
-- marketing_work_items ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type text NOT NULL,
  title text NOT NULL,
  description text,
  state text,
  source_system text,
  campaign_id uuid,
  lead_id uuid,
  referral_contact_id uuid,
  referral_company_id uuid,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  owner_id uuid,
  due_date date,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_work_items TO authenticated;
GRANT ALL ON public.marketing_work_items TO service_role;
ALTER TABLE public.marketing_work_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view marketing work items"
  ON public.marketing_work_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage marketing work items"
  ON public.marketing_work_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mwi_work_type ON public.marketing_work_items (work_type);
CREATE INDEX IF NOT EXISTS idx_mwi_status ON public.marketing_work_items (status);
CREATE INDEX IF NOT EXISTS idx_mwi_owner ON public.marketing_work_items (owner_id);
CREATE INDEX IF NOT EXISTS idx_mwi_state ON public.marketing_work_items (state);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_mwi_updated_at ON public.marketing_work_items;
CREATE TRIGGER trg_mwi_updated_at
  BEFORE UPDATE ON public.marketing_work_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- marketing_web_metrics --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_web_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  source_system text NOT NULL,
  page_path text,
  query text,
  state text,
  campaign_id uuid,
  sessions integer,
  users integer,
  clicks integer,
  impressions integer,
  conversions integer,
  spend numeric,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_web_metrics TO authenticated;
GRANT ALL ON public.marketing_web_metrics TO service_role;
ALTER TABLE public.marketing_web_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view web metrics"
  ON public.marketing_web_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage web metrics"
  ON public.marketing_web_metrics FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mwm_date ON public.marketing_web_metrics (metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_mwm_source ON public.marketing_web_metrics (source_system);

DROP TRIGGER IF EXISTS trg_mwm_updated_at ON public.marketing_web_metrics;
CREATE TRIGGER trg_mwm_updated_at
  BEFORE UPDATE ON public.marketing_web_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- marketing_reputation_events -------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  occurred_at timestamptz NOT NULL,
  state text,
  rating numeric,
  reviewer_name text,
  review_text text,
  sentiment text,
  response_status text,
  linked_lead_id uuid,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_reputation_events TO authenticated;
GRANT ALL ON public.marketing_reputation_events TO service_role;
ALTER TABLE public.marketing_reputation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view reputation events"
  ON public.marketing_reputation_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage reputation events"
  ON public.marketing_reputation_events FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mre_occurred ON public.marketing_reputation_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mre_source ON public.marketing_reputation_events (source_system);

DROP TRIGGER IF EXISTS trg_mre_updated_at ON public.marketing_reputation_events;
CREATE TRIGGER trg_mre_updated_at
  BEFORE UPDATE ON public.marketing_reputation_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
