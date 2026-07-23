
-- =========================================================================
-- CTM operations: durable webhook log, historical import jobs, unknown caller
-- review queue. All INGEST_ONLY-safe.
-- =========================================================================

-- 1. Durable webhook event log ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ctm_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  ctm_call_id TEXT,
  event_kind TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','duplicate','failed','ignored')),
  payload_hash TEXT NOT NULL,
  payload_size_bytes INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_ip TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error TEXT,
  linked_call_event_id UUID REFERENCES public.ctm_call_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ctm_webhook_events_hash ON public.ctm_webhook_events (payload_hash);
CREATE INDEX IF NOT EXISTS ix_ctm_webhook_events_status ON public.ctm_webhook_events (status, received_at DESC);
CREATE INDEX IF NOT EXISTS ix_ctm_webhook_events_call ON public.ctm_webhook_events (ctm_call_id);

GRANT SELECT, INSERT, UPDATE ON public.ctm_webhook_events TO authenticated;
GRANT ALL ON public.ctm_webhook_events TO service_role;

ALTER TABLE public.ctm_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ctm_webhook_events_read" ON public.ctm_webhook_events;
CREATE POLICY "ctm_webhook_events_read" ON public.ctm_webhook_events
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'executive_leadership'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
    OR has_role(auth.uid(),'marketing'::app_role)
    OR has_role(auth.uid(),'marketing_growth_lead'::app_role)
    OR has_role(auth.uid(),'marketing_team'::app_role)
  );

DROP POLICY IF EXISTS "ctm_webhook_events_manage" ON public.ctm_webhook_events;
CREATE POLICY "ctm_webhook_events_manage" ON public.ctm_webhook_events
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
  ) WITH CHECK (true);

CREATE TRIGGER trg_ctm_webhook_events_updated_at
  BEFORE UPDATE ON public.ctm_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Historical import jobs ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ctm_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','paused','completed','failed','cancelled')),
  cursor_page INTEGER NOT NULL DEFAULT 1,
  cursor_iso TIMESTAMPTZ,
  pages_processed INTEGER NOT NULL DEFAULT 0,
  calls_fetched INTEGER NOT NULL DEFAULT 0,
  calls_upserted INTEGER NOT NULL DEFAULT 0,
  calls_duplicate INTEGER NOT NULL DEFAULT 0,
  leads_linked INTEGER NOT NULL DEFAULT 0,
  leads_created INTEGER NOT NULL DEFAULT 0,
  review_queued INTEGER NOT NULL DEFAULT 0,
  rate_limit_hits INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS ix_ctm_import_jobs_status ON public.ctm_import_jobs (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.ctm_import_jobs TO authenticated;
GRANT ALL ON public.ctm_import_jobs TO service_role;

ALTER TABLE public.ctm_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ctm_import_jobs_read" ON public.ctm_import_jobs;
CREATE POLICY "ctm_import_jobs_read" ON public.ctm_import_jobs
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'executive_leadership'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
    OR has_role(auth.uid(),'marketing'::app_role)
    OR has_role(auth.uid(),'marketing_growth_lead'::app_role)
    OR has_role(auth.uid(),'marketing_team'::app_role)
  );

DROP POLICY IF EXISTS "ctm_import_jobs_write" ON public.ctm_import_jobs;
CREATE POLICY "ctm_import_jobs_write" ON public.ctm_import_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
  );

DROP POLICY IF EXISTS "ctm_import_jobs_update" ON public.ctm_import_jobs;
CREATE POLICY "ctm_import_jobs_update" ON public.ctm_import_jobs
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
  ) WITH CHECK (true);

CREATE TRIGGER trg_ctm_import_jobs_updated_at
  BEFORE UPDATE ON public.ctm_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Unknown caller review queue ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.ctm_unknown_caller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ctm_call_event_id UUID NOT NULL REFERENCES public.ctm_call_events(id) ON DELETE CASCADE,
  ctm_call_id TEXT NOT NULL,
  reason TEXT NOT NULL, -- 'missing_from_number' | 'no_lead_match' | 'ambiguous_phone_match'
  candidate_lead_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  from_number TEXT,
  tracking_number TEXT,
  caller_name TEXT,
  resolved_state TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','attached','created_lead','ignored','duplicate')),
  decision_reason TEXT,
  decided_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ctm_unknown_reviews_call ON public.ctm_unknown_caller_reviews (ctm_call_event_id);
CREATE INDEX IF NOT EXISTS ix_ctm_unknown_reviews_status ON public.ctm_unknown_caller_reviews (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.ctm_unknown_caller_reviews TO authenticated;
GRANT ALL ON public.ctm_unknown_caller_reviews TO service_role;

ALTER TABLE public.ctm_unknown_caller_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ctm_unknown_reviews_read" ON public.ctm_unknown_caller_reviews;
CREATE POLICY "ctm_unknown_reviews_read" ON public.ctm_unknown_caller_reviews
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'executive_leadership'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
    OR has_role(auth.uid(),'marketing'::app_role)
    OR has_role(auth.uid(),'marketing_growth_lead'::app_role)
    OR has_role(auth.uid(),'marketing_team'::app_role)
  );

DROP POLICY IF EXISTS "ctm_unknown_reviews_manage" ON public.ctm_unknown_caller_reviews;
CREATE POLICY "ctm_unknown_reviews_manage" ON public.ctm_unknown_caller_reviews
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
  ) WITH CHECK (true);

CREATE TRIGGER trg_ctm_unknown_reviews_updated_at
  BEFORE UPDATE ON public.ctm_unknown_caller_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Widen ctm_call_events SELECT for marketing roles ------------------------
DROP POLICY IF EXISTS "Phone-authorized roles read CTM calls" ON public.ctm_call_events;
CREATE POLICY "Phone-authorized roles read CTM calls" ON public.ctm_call_events
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'executive_leadership'::app_role)
    OR has_role(auth.uid(),'operations_leadership'::app_role)
    OR has_role(auth.uid(),'intake'::app_role)
    OR has_role(auth.uid(),'intake_lead'::app_role)
    OR has_role(auth.uid(),'intake_coordinator'::app_role)
    OR has_role(auth.uid(),'state_director'::app_role)
    OR has_role(auth.uid(),'marketing'::app_role)
    OR has_role(auth.uid(),'marketing_growth_lead'::app_role)
    OR has_role(auth.uid(),'marketing_team'::app_role)
  );
