-- ============================================================
-- Intake release: helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_intake_director(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('super_admin','admin','intake_lead','operations_leadership')
  )
$$;

CREATE OR REPLACE FUNCTION public.has_intake_access(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('super_admin','admin','intake_lead','intake_coordinator','intake','operations_leadership','director_of_operations','operations_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.intake_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- 1. CTM qualification config (backend-driven)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intake_ctm_qualification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true,
  tracking_numbers text[] NOT NULL DEFAULT '{}',
  campaigns text[] NOT NULL DEFAULT '{}',
  excluded_tags text[] NOT NULL DEFAULT ARRAY['spam','internal','test','robocall','wrong number'],
  excluded_numbers text[] NOT NULL DEFAULT '{}',
  min_duration_seconds integer NOT NULL DEFAULT 15,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT intake_ctm_qualification_config_singleton CHECK (singleton),
  CONSTRAINT intake_ctm_qualification_config_singleton_uniq UNIQUE (singleton)
);
GRANT SELECT, INSERT, UPDATE ON public.intake_ctm_qualification_config TO authenticated;
GRANT ALL ON public.intake_ctm_qualification_config TO service_role;
ALTER TABLE public.intake_ctm_qualification_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake staff read ctm qualification config"
  ON public.intake_ctm_qualification_config FOR SELECT TO authenticated
  USING (public.has_intake_access(auth.uid()));
CREATE POLICY "directors write ctm qualification config"
  ON public.intake_ctm_qualification_config FOR INSERT TO authenticated
  WITH CHECK (public.is_intake_director(auth.uid()));
CREATE POLICY "directors update ctm qualification config"
  ON public.intake_ctm_qualification_config FOR UPDATE TO authenticated
  USING (public.is_intake_director(auth.uid()))
  WITH CHECK (public.is_intake_director(auth.uid()));
CREATE TRIGGER trg_intake_ctm_qualification_config_touch
  BEFORE UPDATE ON public.intake_ctm_qualification_config
  FOR EACH ROW EXECUTE FUNCTION public.intake_touch_updated_at();
INSERT INTO public.intake_ctm_qualification_config (singleton) VALUES (true)
  ON CONFLICT (singleton) DO NOTHING;

-- ============================================================
-- 2. Qualification outcome on the call record
-- ============================================================
ALTER TABLE public.ctm_call_events
  ADD COLUMN IF NOT EXISTS qualification_state text,
  ADD COLUMN IF NOT EXISTS qualification_reason text,
  ADD COLUMN IF NOT EXISTS qualification_detail text,
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz;

-- ============================================================
-- 3. Qualification audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intake_ctm_qualification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ctm_call_id text NOT NULL,
  ctm_call_event_id uuid,
  source text NOT NULL CHECK (source IN ('webhook','sync','retry','manual_review')),
  state text NOT NULL CHECK (state IN ('eligible','excluded','ambiguous_review','incomplete_review','error')),
  reason text NOT NULL,
  detail text,
  lead_id uuid,
  candidate_lead_ids uuid[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT intake_ctm_qualification_events_idempotent UNIQUE (ctm_call_id, source, state, reason)
);
CREATE INDEX IF NOT EXISTS idx_intake_ctm_qual_events_state ON public.intake_ctm_qualification_events (state, created_at DESC);
GRANT SELECT ON public.intake_ctm_qualification_events TO authenticated;
GRANT ALL ON public.intake_ctm_qualification_events TO service_role;
ALTER TABLE public.intake_ctm_qualification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake staff read ctm qualification events"
  ON public.intake_ctm_qualification_events FOR SELECT TO authenticated
  USING (public.has_intake_access(auth.uid()));

-- ============================================================
-- 4. Canonical stage transition history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intake_stage_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('forward','backward')),
  reason text,
  is_exception boolean NOT NULL DEFAULT false,
  missing_requirements text[] NOT NULL DEFAULT '{}',
  actor_id uuid,
  actor_is_director boolean NOT NULL DEFAULT false,
  reverted_transition_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intake_stage_transitions_lead ON public.intake_stage_transitions (lead_id, created_at DESC);
GRANT SELECT ON public.intake_stage_transitions TO authenticated;
GRANT ALL ON public.intake_stage_transitions TO service_role;
ALTER TABLE public.intake_stage_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake staff read stage transitions"
  ON public.intake_stage_transitions FOR SELECT TO authenticated
  USING (public.has_intake_access(auth.uid()));

-- ============================================================
-- 5. Admission packet checklist + approvals + audit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intake_admission_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'missing' CHECK (status IN ('complete','missing','waived')),
  missing text[] NOT NULL DEFAULT '{}',
  notes text,
  waived_by uuid,
  waived_reason text,
  waived_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT intake_admission_checklist_items_unique UNIQUE (lead_id, item_key)
);
GRANT SELECT ON public.intake_admission_checklist_items TO authenticated;
GRANT ALL ON public.intake_admission_checklist_items TO service_role;
ALTER TABLE public.intake_admission_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake staff read admission checklist"
  ON public.intake_admission_checklist_items FOR SELECT TO authenticated
  USING (public.has_intake_access(auth.uid()));
CREATE TRIGGER trg_intake_admission_items_touch
  BEFORE UPDATE ON public.intake_admission_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.intake_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.intake_admission_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  approved_by uuid,
  approved_at timestamptz,
  exception_reason text,
  revoked_by uuid,
  revoked_at timestamptz,
  handoff_marked_by uuid,
  handoff_marked_at timestamptz,
  handoff_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.intake_admission_approvals TO authenticated;
GRANT ALL ON public.intake_admission_approvals TO service_role;
ALTER TABLE public.intake_admission_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake staff read admission approvals"
  ON public.intake_admission_approvals FOR SELECT TO authenticated
  USING (public.has_intake_access(auth.uid()));
CREATE TRIGGER trg_intake_admission_approvals_touch
  BEFORE UPDATE ON public.intake_admission_approvals
  FOR EACH ROW EXECUTE FUNCTION public.intake_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.intake_admission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  item_key text,
  from_status text,
  to_status text,
  reason text,
  actor_id uuid,
  actor_is_director boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intake_admission_events_lead ON public.intake_admission_events (lead_id, created_at DESC);
GRANT SELECT ON public.intake_admission_events TO authenticated;
GRANT ALL ON public.intake_admission_events TO service_role;
ALTER TABLE public.intake_admission_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake staff read admission events"
  ON public.intake_admission_events FOR SELECT TO authenticated
  USING (public.has_intake_access(auth.uid()));

-- ============================================================
-- 6. Server-enforced write RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.intake_record_stage_transition(
  p_lead_id uuid,
  p_to_stage text,
  p_direction text,
  p_reason text DEFAULT NULL,
  p_is_exception boolean DEFAULT false,
  p_missing text[] DEFAULT '{}'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_director boolean := public.is_intake_director(v_uid);
  v_from text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_intake_access(v_uid) THEN
    RAISE EXCEPTION 'not_authorized_for_intake';
  END IF;
  IF p_direction NOT IN ('forward','backward') THEN
    RAISE EXCEPTION 'invalid_direction';
  END IF;
  IF p_is_exception THEN
    IF NOT v_director THEN RAISE EXCEPTION 'director_approval_required'; END IF;
    IF coalesce(btrim(p_reason), '') = '' THEN RAISE EXCEPTION 'exception_reason_required'; END IF;
  END IF;

  SELECT pipeline_stage::text INTO v_from FROM public.intake_leads WHERE id = p_lead_id;
  IF v_from IS NULL THEN RAISE EXCEPTION 'lead_not_found'; END IF;

  UPDATE public.intake_leads
     SET pipeline_stage = p_to_stage::intake_pipeline_stage,
         stage_entered_at = now(),
         updated_at = now()
   WHERE id = p_lead_id;

  INSERT INTO public.intake_stage_transitions
    (lead_id, from_stage, to_stage, direction, reason, is_exception, missing_requirements, actor_id, actor_is_director)
  VALUES
    (p_lead_id, v_from, p_to_stage, p_direction, nullif(btrim(coalesce(p_reason,'')),''), p_is_exception,
     coalesce(p_missing,'{}'), v_uid, v_director)
  RETURNING id INTO v_id;

  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.intake_record_stage_transition(uuid, text, text, text, boolean, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_set_admission_item(
  p_lead_id uuid,
  p_item_key text,
  p_label text,
  p_required boolean,
  p_status text,
  p_missing text[] DEFAULT '{}',
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_director boolean := public.is_intake_director(v_uid);
  v_prev text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_intake_access(v_uid) THEN
    RAISE EXCEPTION 'not_authorized_for_intake';
  END IF;
  IF p_status NOT IN ('complete','missing','waived') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  IF p_status = 'waived' THEN
    IF NOT v_director THEN RAISE EXCEPTION 'director_approval_required'; END IF;
    IF coalesce(btrim(p_reason), '') = '' THEN RAISE EXCEPTION 'waiver_reason_required'; END IF;
  END IF;

  SELECT status INTO v_prev FROM public.intake_admission_checklist_items
   WHERE lead_id = p_lead_id AND item_key = p_item_key;

  INSERT INTO public.intake_admission_checklist_items
    (lead_id, item_key, label, required, status, missing, waived_by, waived_reason, waived_at, updated_by)
  VALUES
    (p_lead_id, p_item_key, p_label, coalesce(p_required,true), p_status, coalesce(p_missing,'{}'),
     CASE WHEN p_status = 'waived' THEN v_uid END,
     CASE WHEN p_status = 'waived' THEN btrim(p_reason) END,
     CASE WHEN p_status = 'waived' THEN now() END,
     v_uid)
  ON CONFLICT (lead_id, item_key) DO UPDATE SET
    label = EXCLUDED.label,
    required = EXCLUDED.required,
    status = EXCLUDED.status,
    missing = EXCLUDED.missing,
    waived_by = EXCLUDED.waived_by,
    waived_reason = EXCLUDED.waived_reason,
    waived_at = EXCLUDED.waived_at,
    updated_by = EXCLUDED.updated_by
  RETURNING id INTO v_id;

  INSERT INTO public.intake_admission_events
    (lead_id, event_type, item_key, from_status, to_status, reason, actor_id, actor_is_director)
  VALUES (p_lead_id, CASE WHEN p_status = 'waived' THEN 'item_waived' ELSE 'item_status_changed' END,
          p_item_key, v_prev, p_status, nullif(btrim(coalesce(p_reason,'')),''), v_uid, v_director);

  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.intake_set_admission_item(uuid, text, text, boolean, text, text[], text) TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_approve_admission(
  p_lead_id uuid,
  p_exception_reason text DEFAULT NULL,
  p_revoke boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_blockers int;
BEGIN
  IF v_uid IS NULL OR NOT public.is_intake_director(v_uid) THEN
    RAISE EXCEPTION 'director_approval_required';
  END IF;

  IF p_revoke THEN
    UPDATE public.intake_admission_approvals
       SET approved_by = NULL, approved_at = NULL, revoked_by = v_uid, revoked_at = now()
     WHERE lead_id = p_lead_id RETURNING id INTO v_id;
    INSERT INTO public.intake_admission_events (lead_id, event_type, reason, actor_id, actor_is_director)
    VALUES (p_lead_id, 'approval_revoked', nullif(btrim(coalesce(p_exception_reason,'')),''), v_uid, true);
    RETURN v_id;
  END IF;

  SELECT count(*) INTO v_blockers FROM public.intake_admission_checklist_items
   WHERE lead_id = p_lead_id AND required AND status = 'missing';
  IF v_blockers > 0 AND coalesce(btrim(p_exception_reason),'') = '' THEN
    RAISE EXCEPTION 'exception_reason_required_for_open_blockers';
  END IF;

  INSERT INTO public.intake_admission_approvals (lead_id, approved_by, approved_at, exception_reason)
  VALUES (p_lead_id, v_uid, now(), nullif(btrim(coalesce(p_exception_reason,'')),''))
  ON CONFLICT (lead_id) DO UPDATE SET
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at,
    exception_reason = EXCLUDED.exception_reason,
    revoked_by = NULL,
    revoked_at = NULL
  RETURNING id INTO v_id;

  INSERT INTO public.intake_admission_events (lead_id, event_type, reason, actor_id, actor_is_director)
  VALUES (p_lead_id, 'admission_approved', nullif(btrim(coalesce(p_exception_reason,'')),''), v_uid, true);

  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.intake_approve_admission(uuid, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_mark_admission_handoff(
  p_lead_id uuid,
  p_reference text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_approved timestamptz;
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.is_intake_director(v_uid) THEN
    RAISE EXCEPTION 'director_approval_required';
  END IF;
  SELECT approved_at INTO v_approved FROM public.intake_admission_approvals WHERE lead_id = p_lead_id;
  IF v_approved IS NULL THEN RAISE EXCEPTION 'admission_approval_required_before_handoff'; END IF;

  UPDATE public.intake_admission_approvals
     SET handoff_marked_by = v_uid, handoff_marked_at = now(), handoff_reference = nullif(btrim(coalesce(p_reference,'')),'')
   WHERE lead_id = p_lead_id RETURNING id INTO v_id;

  INSERT INTO public.intake_admission_events (lead_id, event_type, reason, actor_id, actor_is_director)
  VALUES (p_lead_id, 'handoff_marked', nullif(btrim(coalesce(p_reference,'')),''), v_uid, true);

  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.intake_mark_admission_handoff(uuid, text) TO authenticated;