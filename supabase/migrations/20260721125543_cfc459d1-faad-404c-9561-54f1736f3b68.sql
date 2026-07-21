
-- 1. Phone normalization helper -------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_phone_e164(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p IS NULL OR btrim(p) = '' THEN NULL
    WHEN length(regexp_replace(p, '\D', '', 'g')) = 10
      THEN '+1' || regexp_replace(p, '\D', '', 'g')
    WHEN length(regexp_replace(p, '\D', '', 'g')) = 11
         AND left(regexp_replace(p, '\D', '', 'g'), 1) = '1'
      THEN '+' || regexp_replace(p, '\D', '', 'g')
    WHEN length(regexp_replace(p, '\D', '', 'g')) >= 8
      THEN '+' || regexp_replace(p, '\D', '', 'g')
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.normalize_phone_e164(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_phone_e164(text) TO authenticated, service_role;

-- 2. intake_leads: normalized lookup columns ----------------------------------
ALTER TABLE public.intake_leads
  ADD COLUMN IF NOT EXISTS phone_e164 text
    GENERATED ALWAYS AS (public.normalize_phone_e164(phone)) STORED,
  ADD COLUMN IF NOT EXISTS parent_cell_phone_e164 text
    GENERATED ALWAYS AS (public.normalize_phone_e164(parent_cell_phone)) STORED,
  ADD COLUMN IF NOT EXISTS home_phone_e164 text
    GENERATED ALWAYS AS (public.normalize_phone_e164(home_phone)) STORED,
  ADD COLUMN IF NOT EXISTS email_lower text
    GENERATED ALWAYS AS (lower(nullif(btrim(email), ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_intake_leads_phone_e164
  ON public.intake_leads (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_leads_parent_cell_e164
  ON public.intake_leads (parent_cell_phone_e164) WHERE parent_cell_phone_e164 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_leads_home_phone_e164
  ON public.intake_leads (home_phone_e164) WHERE home_phone_e164 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_leads_email_lower
  ON public.intake_leads (email_lower) WHERE email_lower IS NOT NULL;

-- 3. intake_lead_source_events (provenance/idempotency) -----------------------
CREATE TABLE IF NOT EXISTS public.intake_lead_source_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  integration_id text NOT NULL,
  provider_event_id text,
  event_kind text NOT NULL,
  normalized_record_id uuid REFERENCES public.integration_normalized_records(id) ON DELETE SET NULL,
  raw_event_id uuid REFERENCES public.integration_webhook_events(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_intake_lead_source_events_provider
  ON public.intake_lead_source_events (integration_id, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_lead_source_events_lead
  ON public.intake_lead_source_events (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_lead_source_events_norm
  ON public.intake_lead_source_events (normalized_record_id)
  WHERE normalized_record_id IS NOT NULL;

GRANT SELECT ON public.intake_lead_source_events TO authenticated;
GRANT ALL ON public.intake_lead_source_events TO service_role;

ALTER TABLE public.intake_lead_source_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Intake source events: authorized read" ON public.intake_lead_source_events;
CREATE POLICY "Intake source events: authorized read"
  ON public.intake_lead_source_events
  FOR SELECT
  TO authenticated
  USING (public.has_permission(auth.uid(), 'leads.view'));

DROP POLICY IF EXISTS "Intake source events: service role write" ON public.intake_lead_source_events;
CREATE POLICY "Intake source events: service role write"
  ON public.intake_lead_source_events
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 4. intake_promotion_state (promotion outcomes) -------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intake_promotion_state_kind') THEN
    CREATE TYPE public.intake_promotion_state_kind AS ENUM (
      'staged',
      'promoted',
      'linked_existing',
      'incomplete_review',
      'ambiguous_review',
      'rejected',
      'error'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.intake_promotion_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_record_id uuid NOT NULL UNIQUE REFERENCES public.integration_normalized_records(id) ON DELETE CASCADE,
  integration_id text NOT NULL,
  state public.intake_promotion_state_kind NOT NULL DEFAULT 'staged',
  lead_id uuid REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  candidate_lead_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_promotion_state_state
  ON public.intake_promotion_state (state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_promotion_state_lead
  ON public.intake_promotion_state (lead_id) WHERE lead_id IS NOT NULL;

GRANT SELECT ON public.intake_promotion_state TO authenticated;
GRANT ALL ON public.intake_promotion_state TO service_role;

ALTER TABLE public.intake_promotion_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Promotion state: authorized read" ON public.intake_promotion_state;
CREATE POLICY "Promotion state: authorized read"
  ON public.intake_promotion_state
  FOR SELECT
  TO authenticated
  USING (public.has_permission(auth.uid(), 'leads.view'));

DROP POLICY IF EXISTS "Promotion state: service role write" ON public.intake_promotion_state;
CREATE POLICY "Promotion state: service role write"
  ON public.intake_promotion_state
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.tg_touch_intake_promotion_state()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_intake_promotion_state_touch ON public.intake_promotion_state;
CREATE TRIGGER trg_intake_promotion_state_touch
  BEFORE UPDATE ON public.intake_promotion_state
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_intake_promotion_state();

-- 5. CTM diagnostic view --------------------------------------------------------
CREATE OR REPLACE VIEW public.ctm_unmatched_tracking_numbers AS
SELECT
  c.tracking_number,
  count(*)::int AS call_count,
  max(c.called_at) AS last_seen_at
FROM public.ctm_call_events c
LEFT JOIN public.ctm_number_mapping m
  ON m.tracking_number = c.tracking_number
WHERE c.tracking_number IS NOT NULL
  AND m.tracking_number IS NULL
GROUP BY c.tracking_number;

REVOKE ALL ON public.ctm_unmatched_tracking_numbers FROM PUBLIC;
GRANT SELECT ON public.ctm_unmatched_tracking_numbers TO authenticated, service_role;

-- 6. Promotion RPC -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_normalized_record(_record_id uuid)
RETURNS TABLE(state public.intake_promotion_state_kind, lead_id uuid, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.integration_normalized_records%ROWTYPE;
  v_phone text;
  v_email text;
  v_lead_id uuid;
  v_candidates uuid[];
  v_state public.intake_promotion_state_kind;
  v_reason text;
  v_caller_role text;
BEGIN
  -- Only service-role or admin can drive promotions.
  v_caller_role := coalesce(auth.role()::text, '');
  IF v_caller_role <> 'service_role'
     AND NOT (public.has_role(auth.uid(), 'admin'::app_role)
              OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'promote_normalized_record requires service_role or admin';
  END IF;

  SELECT * INTO rec FROM public.integration_normalized_records WHERE id = _record_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'error'::public.intake_promotion_state_kind, NULL::uuid, 'record_not_found'::text;
    RETURN;
  END IF;

  -- Only lead-shaped kinds are eligible.
  IF rec.record_kind NOT IN ('lead','inquiry','inbound_call','call','form_submission') THEN
    INSERT INTO public.intake_promotion_state(normalized_record_id, integration_id, state, reason)
    VALUES (rec.id, rec.integration_id, 'rejected', 'ineligible_kind:' || rec.record_kind)
    ON CONFLICT (normalized_record_id) DO UPDATE
      SET state = EXCLUDED.state, reason = EXCLUDED.reason;
    RETURN QUERY SELECT 'rejected'::public.intake_promotion_state_kind, NULL::uuid, ('ineligible_kind:' || rec.record_kind);
    RETURN;
  END IF;

  v_phone := public.normalize_phone_e164(rec.person_phone);
  v_email := lower(nullif(btrim(rec.person_email), ''));

  -- Precedence: provider external id → phone → email
  IF rec.provider_record_id IS NOT NULL THEN
    SELECT array_agg(DISTINCT lse.lead_id)
      INTO v_candidates
    FROM public.intake_lead_source_events lse
    WHERE lse.integration_id = rec.integration_id
      AND lse.provider_event_id = rec.provider_record_id;
  END IF;

  IF (v_candidates IS NULL OR array_length(v_candidates,1) IS NULL) AND v_phone IS NOT NULL THEN
    SELECT array_agg(DISTINCT id)
      INTO v_candidates
    FROM public.intake_leads
    WHERE phone_e164 = v_phone
       OR parent_cell_phone_e164 = v_phone
       OR home_phone_e164 = v_phone;
  END IF;

  IF (v_candidates IS NULL OR array_length(v_candidates,1) IS NULL) AND v_email IS NOT NULL THEN
    SELECT array_agg(DISTINCT id)
      INTO v_candidates
    FROM public.intake_leads
    WHERE email_lower = v_email;
  END IF;

  IF v_candidates IS NOT NULL AND array_length(v_candidates,1) > 1 THEN
    v_state := 'ambiguous_review';
    v_reason := 'multiple_candidates:' || array_length(v_candidates,1);
    v_lead_id := NULL;
  ELSIF v_candidates IS NOT NULL AND array_length(v_candidates,1) = 1 THEN
    v_state := 'linked_existing';
    v_lead_id := v_candidates[1];
    v_reason := 'linked_by_phone_or_id';
  ELSE
    -- Need enough identifying info to create a lead.
    IF v_phone IS NULL AND v_email IS NULL AND rec.person_name IS NULL THEN
      v_state := 'incomplete_review';
      v_reason := 'missing_identifiers';
      v_lead_id := NULL;
    ELSE
      INSERT INTO public.intake_leads(
        parent_name, child_name, phone, email, state,
        lead_source, pipeline_stage, source_metadata
      ) VALUES (
        COALESCE(rec.person_name, 'Unknown caller'),
        'Unknown',
        COALESCE(v_phone, 'unknown'),
        COALESCE(v_email, ''),
        'Unknown',
        COALESCE(rec.source_label, rec.integration_id),
        'Lead Captured',
        jsonb_build_object(
          'integration_id', rec.integration_id,
          'provider_record_id', rec.provider_record_id,
          'record_kind', rec.record_kind,
          'promoted_at', now()
        )
      )
      RETURNING id INTO v_lead_id;

      v_state := 'promoted';
      v_reason := 'created_from_' || rec.integration_id;
    END IF;
  END IF;

  -- Record provenance link (idempotent by integration/provider_event_id).
  IF v_lead_id IS NOT NULL AND rec.provider_record_id IS NOT NULL THEN
    INSERT INTO public.intake_lead_source_events(
      lead_id, integration_id, provider_event_id, event_kind, normalized_record_id, raw_event_id, metadata
    ) VALUES (
      v_lead_id, rec.integration_id, rec.provider_record_id, rec.record_kind, rec.id, rec.raw_event_id,
      jsonb_build_object('promotion_state', v_state)
    )
    ON CONFLICT (integration_id, provider_event_id)
      WHERE provider_event_id IS NOT NULL
      DO UPDATE SET
        lead_id = EXCLUDED.lead_id,
        normalized_record_id = EXCLUDED.normalized_record_id,
        metadata = EXCLUDED.metadata;
  END IF;

  INSERT INTO public.intake_promotion_state(
    normalized_record_id, integration_id, state, lead_id, candidate_lead_ids, reason
  ) VALUES (
    rec.id, rec.integration_id, v_state, v_lead_id, COALESCE(v_candidates, '{}'::uuid[]), v_reason
  )
  ON CONFLICT (normalized_record_id) DO UPDATE
    SET state = EXCLUDED.state,
        lead_id = EXCLUDED.lead_id,
        candidate_lead_ids = EXCLUDED.candidate_lead_ids,
        reason = EXCLUDED.reason,
        updated_at = now();

  RETURN QUERY SELECT v_state, v_lead_id, v_reason;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_normalized_record(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_normalized_record(uuid) TO service_role;

-- 7. INGEST_ONLY server enforcement: intake_tasks -------------------------------
CREATE OR REPLACE FUNCTION public.enforce_intake_actions_enabled_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.intake_actions_enabled() THEN RETURN NEW; END IF;
  IF coalesce(auth.role()::text,'') = 'service_role' THEN RETURN NEW; END IF;
  -- Allow admin correction.
  IF auth.uid() IS NOT NULL
     AND (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Intake is in INGEST_ONLY mode — task creation is disabled (preview only).'
    USING ERRCODE = 'P0001';
END $$;

DROP TRIGGER IF EXISTS trg_enforce_intake_actions_enabled_tasks ON public.intake_tasks;
CREATE TRIGGER trg_enforce_intake_actions_enabled_tasks
  BEFORE INSERT ON public.intake_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_intake_actions_enabled_tasks();

-- 8. INGEST_ONLY: block stage advancement + auto-owner via user updates -------
CREATE OR REPLACE FUNCTION public.enforce_intake_ingest_only_lead_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_service boolean := coalesce(auth.role()::text,'') = 'service_role';
  is_admin boolean := auth.uid() IS NOT NULL
    AND (public.has_role(auth.uid(), 'admin'::app_role)
         OR public.has_role(auth.uid(), 'super_admin'::app_role));
BEGIN
  IF public.intake_actions_enabled() OR is_service OR is_admin THEN
    RETURN NEW;
  END IF;
  -- User updates in INGEST_ONLY: freeze stage and coordinator assignment.
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    NEW.pipeline_stage := OLD.pipeline_stage;
  END IF;
  IF NEW.assigned_intake_coordinator IS DISTINCT FROM OLD.assigned_intake_coordinator THEN
    NEW.assigned_intake_coordinator := OLD.assigned_intake_coordinator;
  END IF;
  IF NEW.assigned_intake_coordinator_user_id IS DISTINCT FROM OLD.assigned_intake_coordinator_user_id THEN
    NEW.assigned_intake_coordinator_user_id := OLD.assigned_intake_coordinator_user_id;
  END IF;
  IF NEW.assigned_intake_coordinator_employee_id IS DISTINCT FROM OLD.assigned_intake_coordinator_employee_id THEN
    NEW.assigned_intake_coordinator_employee_id := OLD.assigned_intake_coordinator_employee_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_intake_ingest_only_lead_updates ON public.intake_leads;
CREATE TRIGGER trg_enforce_intake_ingest_only_lead_updates
  BEFORE UPDATE ON public.intake_leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_intake_ingest_only_lead_updates();

-- 9. Comment noting outbound-only integration event kinds (advisory) -----------
COMMENT ON TABLE public.intake_promotion_state IS
  'Blossom OS INGEST_ONLY: promotion outcome per normalized record. States: staged, promoted, linked_existing, incomplete_review, ambiguous_review, rejected, error.';
