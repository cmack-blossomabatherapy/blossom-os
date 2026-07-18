
-- =========================================================================
-- BCBA Onboarding Journey
-- =========================================================================
-- Templates (per lifecycle stage) → items (checklist rows) → instances
-- (per-BCBA copies) → state, comments, audit.
--
-- Design: employee-facing items expose only "employee_instructions" and
-- neutral metadata. Owner teams (Credentialing, HR, Systems, etc.) see
-- "internal_instructions" via a separate policy path. Admins manage the
-- template; role-owners work their queues; BCBAs see one coherent journey.
-- =========================================================================

CREATE TYPE public.bcba_onb_status AS ENUM (
  'not_started','in_progress','waiting_on_bcba','waiting_on_owner',
  'submitted','approved','completed','blocked','skipped'
);

CREATE TYPE public.bcba_onb_owner AS ENUM (
  'bcba','credentialing','hr','clinical_leadership','training',
  'systems','state_leadership','super_admin'
);

CREATE TYPE public.bcba_onb_evidence AS ENUM (
  'none','checkbox','file_upload','external_link','approval','comment'
);

-- ---- Template items (one per checklist row, shared across all BCBAs) -----
CREATE TABLE public.bcba_onboarding_template_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key     TEXT NOT NULL,       -- e.g. 'welcome','credentialing','systems_setup'
  section_label   TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL,       -- offer_accepted, preboarding, credentialing, onboarding, systems_setup, initial_caseload_setup
  sort_order      INT  NOT NULL DEFAULT 100,

  title                 TEXT NOT NULL,
  employee_instructions TEXT,          -- what the BCBA sees
  internal_instructions TEXT,          -- owner-only

  owner_role      public.bcba_onb_owner NOT NULL,
  required        BOOLEAN NOT NULL DEFAULT TRUE,
  evidence_type   public.bcba_onb_evidence NOT NULL DEFAULT 'checkbox',
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  external_link_hint TEXT,

  due_offset_days INT,                 -- +N days from journey start (nullable)
  depends_on_item_id UUID REFERENCES public.bcba_onboarding_template_items(id) ON DELETE SET NULL,
  is_completion_gate BOOLEAN NOT NULL DEFAULT FALSE, -- if true, blocks caseload activation

  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bcba_onb_tmpl_stage_idx ON public.bcba_onboarding_template_items(lifecycle_stage, sort_order);
CREATE INDEX bcba_onb_tmpl_owner_idx ON public.bcba_onboarding_template_items(owner_role) WHERE enabled;

GRANT SELECT ON public.bcba_onboarding_template_items TO authenticated;
GRANT ALL ON public.bcba_onboarding_template_items TO service_role;
ALTER TABLE public.bcba_onboarding_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read template"
  ON public.bcba_onboarding_template_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage template"
  ON public.bcba_onboarding_template_items FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
  );

-- ---- Per-BCBA instances --------------------------------------------------
CREATE TABLE public.bcba_onboarding_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bcba_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_item_id  UUID NOT NULL REFERENCES public.bcba_onboarding_template_items(id) ON DELETE CASCADE,

  status            public.bcba_onb_status NOT NULL DEFAULT 'not_started',
  assigned_owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date          DATE,
  external_url      TEXT,
  file_path         TEXT,              -- storage path
  approved_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bcba_user_id, template_item_id)
);

CREATE INDEX bcba_onb_items_user_idx  ON public.bcba_onboarding_items(bcba_user_id);
CREATE INDEX bcba_onb_items_owner_idx ON public.bcba_onboarding_items(assigned_owner_user_id) WHERE status NOT IN ('completed','skipped','approved');
CREATE INDEX bcba_onb_items_status_idx ON public.bcba_onboarding_items(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_onboarding_items TO authenticated;
GRANT ALL ON public.bcba_onboarding_items TO service_role;
ALTER TABLE public.bcba_onboarding_items ENABLE ROW LEVEL SECURITY;

-- BCBA sees own items
CREATE POLICY "BCBA reads own items"
  ON public.bcba_onboarding_items FOR SELECT TO authenticated
  USING (
    bcba_user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
    OR public.has_role(auth.uid(),'hr'::app_role)
    OR public.has_role(auth.uid(),'hr_admin'::app_role)
    OR public.has_role(auth.uid(),'clinical_director'::app_role)
    OR public.has_role(auth.uid(),'operations_leadership'::app_role)
  );

-- BCBA updates own items (limited to their status/upload/comment paths through app)
CREATE POLICY "BCBA updates own items"
  ON public.bcba_onboarding_items FOR UPDATE TO authenticated
  USING (bcba_user_id = auth.uid())
  WITH CHECK (bcba_user_id = auth.uid());

-- Owners / admins manage all
CREATE POLICY "Owners manage items"
  ON public.bcba_onboarding_items FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
    OR public.has_role(auth.uid(),'hr'::app_role)
    OR public.has_role(auth.uid(),'hr_admin'::app_role)
    OR public.has_role(auth.uid(),'clinical_director'::app_role)
    OR public.has_role(auth.uid(),'operations_leadership'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
    OR public.has_role(auth.uid(),'hr'::app_role)
    OR public.has_role(auth.uid(),'hr_admin'::app_role)
    OR public.has_role(auth.uid(),'clinical_director'::app_role)
    OR public.has_role(auth.uid(),'operations_leadership'::app_role)
  );

-- ---- Comments ------------------------------------------------------------
CREATE TABLE public.bcba_onboarding_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES public.bcba_onboarding_items(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  visibility   TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all','internal')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bcba_onb_cmt_item_idx ON public.bcba_onboarding_comments(item_id);

GRANT SELECT, INSERT, DELETE ON public.bcba_onboarding_comments TO authenticated;
GRANT ALL ON public.bcba_onboarding_comments TO service_role;
ALTER TABLE public.bcba_onboarding_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read comments on visible items"
  ON public.bcba_onboarding_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bcba_onboarding_items i
      WHERE i.id = item_id
        AND (
          i.bcba_user_id = auth.uid() AND visibility = 'all'
          OR public.has_role(auth.uid(),'admin'::app_role)
          OR public.has_role(auth.uid(),'super_admin'::app_role)
          OR public.has_role(auth.uid(),'hr'::app_role)
          OR public.has_role(auth.uid(),'hr_admin'::app_role)
          OR public.has_role(auth.uid(),'clinical_director'::app_role)
          OR public.has_role(auth.uid(),'operations_leadership'::app_role)
        )
    )
  );

CREATE POLICY "Insert comments on visible items"
  ON public.bcba_onboarding_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bcba_onboarding_items i
      WHERE i.id = item_id
        AND (
          i.bcba_user_id = auth.uid() AND visibility = 'all'
          OR public.has_role(auth.uid(),'admin'::app_role)
          OR public.has_role(auth.uid(),'super_admin'::app_role)
          OR public.has_role(auth.uid(),'hr'::app_role)
          OR public.has_role(auth.uid(),'hr_admin'::app_role)
          OR public.has_role(auth.uid(),'clinical_director'::app_role)
          OR public.has_role(auth.uid(),'operations_leadership'::app_role)
        )
    )
  );

-- ---- Audit ---------------------------------------------------------------
CREATE TABLE public.bcba_onboarding_audit (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES public.bcba_onboarding_items(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,               -- status_changed, approved, file_uploaded, comment_added, ...
  from_value TEXT,
  to_value   TEXT,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bcba_onb_audit_item_idx ON public.bcba_onboarding_audit(item_id, created_at DESC);

GRANT SELECT, INSERT ON public.bcba_onboarding_audit TO authenticated;
GRANT ALL ON public.bcba_onboarding_audit TO service_role;
ALTER TABLE public.bcba_onboarding_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read audit on visible items"
  ON public.bcba_onboarding_audit FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bcba_onboarding_items i
      WHERE i.id = item_id
        AND (
          i.bcba_user_id = auth.uid()
          OR public.has_role(auth.uid(),'admin'::app_role)
          OR public.has_role(auth.uid(),'super_admin'::app_role)
          OR public.has_role(auth.uid(),'hr'::app_role)
          OR public.has_role(auth.uid(),'hr_admin'::app_role)
          OR public.has_role(auth.uid(),'clinical_director'::app_role)
          OR public.has_role(auth.uid(),'operations_leadership'::app_role)
        )
    )
  );

CREATE POLICY "Insert audit for actor"
  ON public.bcba_onboarding_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ---- Trigger: status change → audit + completed_at -----------------------
CREATE OR REPLACE FUNCTION public.bcba_onboarding_item_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('completed','approved') AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
    INSERT INTO public.bcba_onboarding_audit(item_id, actor_id, action, from_value, to_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status::text, NEW.status::text);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bcba_onb_item_audit_trg
BEFORE UPDATE ON public.bcba_onboarding_items
FOR EACH ROW EXECUTE FUNCTION public.bcba_onboarding_item_audit();

CREATE OR REPLACE FUNCTION public.bcba_onboarding_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

CREATE TRIGGER bcba_onb_tmpl_touch_trg
BEFORE UPDATE ON public.bcba_onboarding_template_items
FOR EACH ROW EXECUTE FUNCTION public.bcba_onboarding_touch();

-- ---- RPC: start_bcba_onboarding(bcba_user_id) ----------------------------
-- Materializes all enabled template items into per-user instances.
CREATE OR REPLACE FUNCTION public.start_bcba_onboarding(_bcba_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inserted_count INT := 0;
BEGIN
  IF NOT (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'super_admin'::app_role)
    OR public.has_role(auth.uid(),'hr'::app_role)
    OR public.has_role(auth.uid(),'hr_admin'::app_role)
    OR public.has_role(auth.uid(),'clinical_director'::app_role)
    OR public.has_role(auth.uid(),'operations_leadership'::app_role)
    OR auth.uid() = _bcba_user_id
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH ins AS (
    INSERT INTO public.bcba_onboarding_items(bcba_user_id, template_item_id, due_date)
    SELECT _bcba_user_id, t.id,
           CASE WHEN t.due_offset_days IS NOT NULL
                THEN (CURRENT_DATE + t.due_offset_days)::date
                ELSE NULL END
    FROM public.bcba_onboarding_template_items t
    WHERE t.enabled
    ON CONFLICT (bcba_user_id, template_item_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM ins;

  RETURN inserted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_bcba_onboarding(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_bcba_onboarding(UUID) TO authenticated, service_role;

-- ---- RPC: bcba_caseload_activation_status(user) --------------------------
-- Returns whether all completion-gate items are approved/completed.
CREATE OR REPLACE FUNCTION public.bcba_caseload_activation_status(_bcba_user_id UUID)
RETURNS TABLE(total_gates INT, cleared_gates INT, blocked_titles TEXT[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::int AS total_gates,
    COUNT(*) FILTER (WHERE i.status IN ('completed','approved'))::int AS cleared_gates,
    COALESCE(ARRAY_AGG(t.title) FILTER (WHERE i.status NOT IN ('completed','approved')), ARRAY[]::text[]) AS blocked_titles
  FROM public.bcba_onboarding_items i
  JOIN public.bcba_onboarding_template_items t ON t.id = i.template_item_id
  WHERE i.bcba_user_id = _bcba_user_id
    AND t.is_completion_gate = true;
$$;

REVOKE EXECUTE ON FUNCTION public.bcba_caseload_activation_status(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bcba_caseload_activation_status(UUID) TO authenticated, service_role;
