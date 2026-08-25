-- ============================================================
-- Commit to Submit (C2S) Compliance — DATA FOUNDATION ONLY
-- Program is NOT activated. Activation is impossible until all
-- required approvals/values are recorded (see CHECK below).
-- No client, payor, service, hours, rate, raw label, raw payload,
-- contact, compensation, or employment-action columns.
-- ============================================================

-- ---------- 1. Program configuration (effective-dated versions) ----------
CREATE TABLE public.c2s_program_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version text NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  is_enabled boolean NOT NULL DEFAULT false,
  hr_approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  hr_approved_at timestamptz,
  legal_approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  legal_approved_at timestamptz,
  tracking_start_date date,
  prior_history_counts boolean,
  new_hire_grace_days integer CHECK (new_hire_grace_days IS NULL OR new_hire_grace_days >= 0),
  category1_qa_criteria text,
  on_time_max_lag_days integer NOT NULL DEFAULT 7 CHECK (on_time_max_lag_days > 0),
  dispute_window_business_days integer NOT NULL DEFAULT 5 CHECK (dispute_window_business_days > 0),
  notes text,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT c2s_config_period_valid CHECK (effective_to IS NULL OR effective_to >= effective_from),
  -- Activation is impossible until every required approval/value exists.
  CONSTRAINT c2s_config_activation_requires_approvals CHECK (
    is_enabled = false OR (
      hr_approved_by IS NOT NULL AND hr_approved_at IS NOT NULL
      AND legal_approved_by IS NOT NULL AND legal_approved_at IS NOT NULL
      AND tracking_start_date IS NOT NULL
      AND prior_history_counts IS NOT NULL
      AND new_hire_grace_days IS NOT NULL
      AND category1_qa_criteria IS NOT NULL AND btrim(category1_qa_criteria) <> ''
    )
  )
);

-- ---------- 2. Reviewed tracker / completion records ----------
CREATE TABLE public.c2s_tracker_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  state text,
  role_group text NOT NULL DEFAULT 'unknown' CHECK (role_group IN ('rbt','bcba','unknown')),
  service_date date NOT NULL,
  documentation_due_date date,
  authoritative_completed_at timestamptz,
  lag_days integer,
  source_kind text NOT NULL CHECK (source_kind IN ('authoritative_completion','reviewed_tracker')),
  source_reference text,
  category text NOT NULL DEFAULT 'unclassified'
    CHECK (category IN ('rbt_documentation','bcba_category_1','bcba_category_2','unclassified')),
  review_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (review_status IN ('unreviewed','under_review','upheld','not_upheld','withdrawn')),
  reviewed_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  category1_criteria_reference text,
  is_formal_violation boolean NOT NULL DEFAULT false,
  formal_violation_recorded_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  formal_violation_recorded_at timestamptz,
  config_id uuid REFERENCES public.c2s_program_config(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- A formal violation requires a reviewed + upheld disposition and provenance.
  CONSTRAINT c2s_tracker_formal_requires_review CHECK (
    is_formal_violation = false OR (
      review_status = 'upheld'
      AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
      AND formal_violation_recorded_by IS NOT NULL AND formal_violation_recorded_at IS NOT NULL
      AND config_id IS NOT NULL
    )
  ),
  -- BCBA Category 1 can never rest on a billing-lag proxy; it needs an
  -- authoritative completion source plus reviewed substantive QA criteria.
  CONSTRAINT c2s_tracker_category1_requires_evidence CHECK (
    category <> 'bcba_category_1' OR (
      source_kind = 'authoritative_completion'
      AND authoritative_completed_at IS NOT NULL
      AND category1_criteria_reference IS NOT NULL AND btrim(category1_criteria_reference) <> ''
    )
  )
);
CREATE INDEX c2s_tracker_subject_idx ON public.c2s_tracker_records (subject_employee_id, service_date);

-- ---------- 3. Coaching ----------
CREATE TABLE public.c2s_coaching_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  coached_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  coaching_date date NOT NULL DEFAULT CURRENT_DATE,
  topic text,
  summary text,
  acknowledged_at timestamptz,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX c2s_coaching_subject_idx ON public.c2s_coaching_records (subject_employee_id, coaching_date);

-- ---------- 4. Exceptions (excuse / pause a deadline) ----------
CREATE TABLE public.c2s_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tracker_record_id uuid REFERENCES public.c2s_tracker_records(id) ON DELETE SET NULL,
  exception_type text NOT NULL CHECK (exception_type IN (
    'approved_leave','system_outage','ada_accommodation','qa_error',
    'parent_signature_delay','approved_extension','other'
  )),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','denied','withdrawn')),
  applies_from date,
  applies_to date,
  reason text,
  approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT c2s_exception_window_valid CHECK (applies_to IS NULL OR applies_from IS NULL OR applies_to >= applies_from),
  CONSTRAINT c2s_exception_approval_provenance CHECK (
    status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
  )
);
CREATE INDEX c2s_exceptions_subject_idx ON public.c2s_exceptions (subject_employee_id, status);

-- ---------- 5. Notices ----------
CREATE TABLE public.c2s_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tracker_record_id uuid NOT NULL REFERENCES public.c2s_tracker_records(id) ON DELETE RESTRICT,
  config_id uuid NOT NULL REFERENCES public.c2s_program_config(id) ON DELETE RESTRICT,
  notice_level integer NOT NULL CHECK (notice_level IN (1,2,3)),
  prior_coaching_id uuid NOT NULL REFERENCES public.c2s_coaching_records(id) ON DELETE RESTRICT,
  issued_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  -- A third notice creates an HR review requirement only. It performs no
  -- employment action; no pay, discipline, or termination field exists here.
  hr_review_required boolean NOT NULL DEFAULT false,
  hr_review_id uuid,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT c2s_notice_level3_requires_hr_review CHECK (notice_level <> 3 OR hr_review_required = true),
  CONSTRAINT c2s_notice_unique_level UNIQUE (subject_employee_id, tracker_record_id, notice_level)
);
CREATE INDEX c2s_notices_subject_idx ON public.c2s_notices (subject_employee_id, notice_level);

-- ---------- 6. Disputes ----------
CREATE TABLE public.c2s_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tracker_record_id uuid REFERENCES public.c2s_tracker_records(id) ON DELETE SET NULL,
  notice_id uuid REFERENCES public.c2s_notices(id) ON DELETE SET NULL,
  filed_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  filed_at timestamptz NOT NULL DEFAULT now(),
  filing_deadline date,
  statement text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','upheld','denied','withdrawn')),
  decided_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT c2s_dispute_decision_provenance CHECK (
    status NOT IN ('upheld','denied') OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)
  )
);
CREATE INDEX c2s_disputes_subject_idx ON public.c2s_disputes (subject_employee_id, status);

-- ---------- 7. 90-day program / HR reviews ----------
CREATE TABLE public.c2s_program_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  review_kind text NOT NULL DEFAULT 'ninety_day'
    CHECK (review_kind IN ('ninety_day','hr_review')),
  window_start date NOT NULL,
  window_end date NOT NULL,
  days_on_time integer CHECK (days_on_time IS NULL OR days_on_time >= 0),
  qa_quality_summary text,
  has_upheld_disputes boolean,
  manager_recommendation text CHECK (
    manager_recommendation IS NULL
    OR manager_recommendation IN ('exit_program','continue_program','undecided')
  ),
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  manager_recommended_at timestamptz,
  hr_approved boolean,
  hr_approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  hr_approved_at timestamptz,
  outcome text CHECK (outcome IS NULL OR outcome IN ('exited','continued','pending')),
  notes text,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT c2s_review_window_valid CHECK (window_end >= window_start),
  -- Outcomes are recorded by people, never automated: an outcome requires an
  -- explicit HR approval decision with provenance.
  CONSTRAINT c2s_review_outcome_requires_hr CHECK (
    outcome IS NULL OR outcome = 'pending'
    OR (hr_approved IS NOT NULL AND hr_approved_by IS NOT NULL AND hr_approved_at IS NOT NULL)
  )
);
CREATE INDEX c2s_reviews_subject_idx ON public.c2s_program_reviews (subject_employee_id, window_end);

ALTER TABLE public.c2s_notices
  ADD CONSTRAINT c2s_notice_hr_review_fk
  FOREIGN KEY (hr_review_id) REFERENCES public.c2s_program_reviews(id) ON DELETE SET NULL;

-- ---------- updated_at triggers ----------
CREATE OR REPLACE FUNCTION public.c2s_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER c2s_config_touch BEFORE UPDATE ON public.c2s_program_config
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();
CREATE TRIGGER c2s_tracker_touch BEFORE UPDATE ON public.c2s_tracker_records
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();
CREATE TRIGGER c2s_coaching_touch BEFORE UPDATE ON public.c2s_coaching_records
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();
CREATE TRIGGER c2s_exceptions_touch BEFORE UPDATE ON public.c2s_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();
CREATE TRIGGER c2s_notices_touch BEFORE UPDATE ON public.c2s_notices
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();
CREATE TRIGGER c2s_disputes_touch BEFORE UPDATE ON public.c2s_disputes
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();
CREATE TRIGGER c2s_reviews_touch BEFORE UPDATE ON public.c2s_program_reviews
  FOR EACH ROW EXECUTE FUNCTION public.c2s_touch_updated_at();

-- ============================================================
-- Dedicated C2S authorization helpers (fixed search_path).
-- Intentionally NOT reusing manages_employee (wrong subject
-- contract + people-manager flag) or is_hr_operator (too broad).
-- ============================================================

-- Narrow disciplinary-detail authority: HR leadership, admins, executives.
CREATE OR REPLACE FUNCTION public.c2s_is_hr_authority(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text IN (
        'admin','super_admin','systems_admin',
        'hr','hr_admin','hr_manager','hr_lead',
        'exec','executive','executive_leadership','ceo','coo'
      )
  );
$$;

-- The subject's direct designated manager (employees.manager_id), regardless
-- of the is_people_manager flag.
CREATE OR REPLACE FUNCTION public.c2s_is_direct_manager(_subject_employee_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.employees subject
    JOIN public.employees viewer ON viewer.id = subject.manager_id
    WHERE subject.id = _subject_employee_id
      AND viewer.user_id = _user_id
  );
$$;

-- The subject themself.
CREATE OR REPLACE FUNCTION public.c2s_is_subject(_subject_employee_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = _subject_employee_id AND e.user_id = _user_id
  );
$$;

-- Sensitive read: subject, direct manager, or narrow HR/admin/exec authority.
CREATE OR REPLACE FUNCTION public.c2s_can_read_subject(_subject_employee_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.c2s_is_subject(_subject_employee_id, _user_id)
      OR public.c2s_is_direct_manager(_subject_employee_id, _user_id)
      OR public.c2s_is_hr_authority(_user_id);
$$;

REVOKE ALL ON FUNCTION public.c2s_is_hr_authority(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.c2s_is_direct_manager(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.c2s_is_subject(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.c2s_can_read_subject(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.c2s_is_hr_authority(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.c2s_is_direct_manager(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.c2s_is_subject(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.c2s_can_read_subject(uuid, uuid) TO authenticated, service_role;

-- ---------- Grants ----------
GRANT SELECT ON public.c2s_program_config TO authenticated;
GRANT INSERT, UPDATE ON public.c2s_program_config TO authenticated;
GRANT ALL ON public.c2s_program_config TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.c2s_tracker_records TO authenticated;
GRANT ALL ON public.c2s_tracker_records TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.c2s_coaching_records TO authenticated;
GRANT ALL ON public.c2s_coaching_records TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.c2s_exceptions TO authenticated;
GRANT ALL ON public.c2s_exceptions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.c2s_notices TO authenticated;
GRANT ALL ON public.c2s_notices TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.c2s_disputes TO authenticated;
GRANT ALL ON public.c2s_disputes TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.c2s_program_reviews TO authenticated;
GRANT ALL ON public.c2s_program_reviews TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.c2s_program_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c2s_tracker_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c2s_coaching_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c2s_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c2s_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c2s_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.c2s_program_reviews ENABLE ROW LEVEL SECURITY;

-- Config: readable by any authenticated employee (it is policy metadata, not
-- disciplinary detail); only HR authority may create or change a version.
CREATE POLICY "c2s_config_read" ON public.c2s_program_config
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "c2s_config_insert" ON public.c2s_program_config
  FOR INSERT TO authenticated WITH CHECK (public.c2s_is_hr_authority());
CREATE POLICY "c2s_config_update" ON public.c2s_program_config
  FOR UPDATE TO authenticated USING (public.c2s_is_hr_authority()) WITH CHECK (public.c2s_is_hr_authority());

-- Tracker records: sensitive read; HR authority owns formal disposition.
CREATE POLICY "c2s_tracker_read" ON public.c2s_tracker_records
  FOR SELECT TO authenticated USING (public.c2s_can_read_subject(subject_employee_id));
CREATE POLICY "c2s_tracker_insert" ON public.c2s_tracker_records
  FOR INSERT TO authenticated WITH CHECK (public.c2s_is_hr_authority());
CREATE POLICY "c2s_tracker_update" ON public.c2s_tracker_records
  FOR UPDATE TO authenticated USING (public.c2s_is_hr_authority()) WITH CHECK (public.c2s_is_hr_authority());

-- Coaching: subject/manager/HR read; direct manager or HR may coach.
CREATE POLICY "c2s_coaching_read" ON public.c2s_coaching_records
  FOR SELECT TO authenticated USING (public.c2s_can_read_subject(subject_employee_id));
CREATE POLICY "c2s_coaching_insert" ON public.c2s_coaching_records
  FOR INSERT TO authenticated WITH CHECK (
    public.c2s_is_direct_manager(subject_employee_id) OR public.c2s_is_hr_authority()
  );
CREATE POLICY "c2s_coaching_update" ON public.c2s_coaching_records
  FOR UPDATE TO authenticated USING (
    public.c2s_is_direct_manager(subject_employee_id) OR public.c2s_is_hr_authority()
  ) WITH CHECK (
    public.c2s_is_direct_manager(subject_employee_id) OR public.c2s_is_hr_authority()
  );

-- Exceptions: HR authority controls approval; subject/manager may read.
CREATE POLICY "c2s_exceptions_read" ON public.c2s_exceptions
  FOR SELECT TO authenticated USING (public.c2s_can_read_subject(subject_employee_id));
CREATE POLICY "c2s_exceptions_insert" ON public.c2s_exceptions
  FOR INSERT TO authenticated WITH CHECK (public.c2s_is_hr_authority());
CREATE POLICY "c2s_exceptions_update" ON public.c2s_exceptions
  FOR UPDATE TO authenticated USING (public.c2s_is_hr_authority()) WITH CHECK (public.c2s_is_hr_authority());

-- Notices: HR authority only for write; sensitive read.
CREATE POLICY "c2s_notices_read" ON public.c2s_notices
  FOR SELECT TO authenticated USING (public.c2s_can_read_subject(subject_employee_id));
CREATE POLICY "c2s_notices_insert" ON public.c2s_notices
  FOR INSERT TO authenticated WITH CHECK (public.c2s_is_hr_authority());
CREATE POLICY "c2s_notices_update" ON public.c2s_notices
  FOR UPDATE TO authenticated USING (public.c2s_is_hr_authority()) WITH CHECK (public.c2s_is_hr_authority());

-- Disputes: the employee may file and read their own dispute, but may NOT
-- adjudicate it (updates are restricted to HR authority).
CREATE POLICY "c2s_disputes_read" ON public.c2s_disputes
  FOR SELECT TO authenticated USING (public.c2s_can_read_subject(subject_employee_id));
CREATE POLICY "c2s_disputes_insert" ON public.c2s_disputes
  FOR INSERT TO authenticated WITH CHECK (
    public.c2s_is_subject(subject_employee_id) OR public.c2s_is_hr_authority()
  );
CREATE POLICY "c2s_disputes_update" ON public.c2s_disputes
  FOR UPDATE TO authenticated USING (public.c2s_is_hr_authority()) WITH CHECK (public.c2s_is_hr_authority());

-- 90-day reviews: sensitive read; managers may record their direct report's
-- recommendation, HR authority owns approval.
CREATE POLICY "c2s_reviews_read" ON public.c2s_program_reviews
  FOR SELECT TO authenticated USING (public.c2s_can_read_subject(subject_employee_id));
CREATE POLICY "c2s_reviews_insert" ON public.c2s_program_reviews
  FOR INSERT TO authenticated WITH CHECK (
    public.c2s_is_direct_manager(subject_employee_id) OR public.c2s_is_hr_authority()
  );
CREATE POLICY "c2s_reviews_update" ON public.c2s_program_reviews
  FOR UPDATE TO authenticated USING (
    public.c2s_is_direct_manager(subject_employee_id) OR public.c2s_is_hr_authority()
  ) WITH CHECK (
    public.c2s_is_direct_manager(subject_employee_id) OR public.c2s_is_hr_authority()
  );

-- ============================================================
-- De-identified operational proxy report.
-- Proxy ONLY: a DOS-to-billing-creation lag can never mark a
-- formal violation. No client/financial/raw-label output.
-- ============================================================
CREATE OR REPLACE FUNCTION public.report_c2s_documentation_proxy(p_from date, p_to date)
RETURNS TABLE (
  employee_id uuid,
  provider_display_name text,
  role_group text,
  state text,
  date_of_service date,
  documentation_date date,
  lag_days integer,
  timeliness_status text,
  proxy_category text,
  used_authoritative_completion boolean,
  provenance text,
  source_quality text,
  last_seen_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH guard AS (SELECT auth.uid() AS uid),
  by_id AS (
    SELECT l.cr_provider_id AS provider_id, (min(l.employee_id::text))::uuid AS employee_id
    FROM public.cr_provider_match_links l
    WHERE l.cr_provider_id IS NOT NULL AND l.employee_id IS NOT NULL
    GROUP BY l.cr_provider_id
    HAVING count(DISTINCT l.employee_id) = 1
  ),
  name_pool AS (
    SELECT public.normalize_person_name(l.cr_provider_name) AS name_key, l.employee_id
    FROM public.cr_provider_match_links l
    WHERE l.employee_id IS NOT NULL AND btrim(coalesce(l.cr_provider_name, '')) <> ''
    UNION
    SELECT public.normalize_person_name(concat_ws(' ', e.first_name, e.last_name)), e.id
    FROM public.employees e
    WHERE btrim(concat_ws(' ', e.first_name, e.last_name)) <> ''
  ),
  by_name AS (
    SELECT name_key, (min(employee_id::text))::uuid AS employee_id
    FROM name_pool
    WHERE name_key IS NOT NULL AND btrim(name_key) <> ''
    GROUP BY name_key
    HAVING count(DISTINCT employee_id) = 1
  ),
  facts AS (
    SELECT
      b.date_of_service,
      b.state,
      b.rendering_provider_name,
      b.rendering_provider_cr_id,
      b.procedure_code,
      s.creation_date,
      s.provider_role,
      s.billing_labels,
      s.last_seen_at
    FROM public.cr_billing_sessions b
    INNER JOIN public.cr_billing_session_status s ON s.row_hash = b.row_hash
    WHERE coalesce(s.is_void, false) = false
      AND coalesce(s.deleted, false) = false
      AND b.date_of_service IS NOT NULL
      AND (p_from IS NULL OR b.date_of_service >= p_from)
      AND (p_to IS NULL OR b.date_of_service <= p_to)
  ),
  mapped AS (
    SELECT
      f.*,
      coalesce(i.employee_id, n.employee_id) AS employee_id,
      CASE
        WHEN i.employee_id IS NOT NULL THEN 'mapped_by_provider_id'
        WHEN n.employee_id IS NOT NULL THEN 'mapped_by_unique_normalized_name'
        ELSE 'unmapped_provider'
      END AS source_quality
    FROM facts f
    LEFT JOIN by_id i ON i.provider_id = nullif(btrim(f.rendering_provider_cr_id), '')
    LEFT JOIN by_name n
      ON i.employee_id IS NULL
     AND n.name_key = public.normalize_person_name(f.rendering_provider_name)
  ),
  authoritative AS (
    SELECT
      m.*,
      t.completed_on
    FROM mapped m
    LEFT JOIN LATERAL (
      SELECT (tr.authoritative_completed_at AT TIME ZONE 'UTC')::date AS completed_on
      FROM public.c2s_tracker_records tr
      WHERE tr.subject_employee_id = m.employee_id
        AND tr.service_date = m.date_of_service
        AND tr.authoritative_completed_at IS NOT NULL
      ORDER BY tr.authoritative_completed_at ASC
      LIMIT 1
    ) t ON true
  ),
  shaped AS (
    SELECT
      a.employee_id,
      nullif(btrim(a.rendering_provider_name), '') AS provider_display_name,
      CASE
        WHEN lower(coalesce(a.provider_role, '') || ' ' || coalesce(a.billing_labels, '')) ~ '\m(bcba|bcaba|lba|analyst)\M'
          THEN 'BCBA'
        WHEN lower(coalesce(a.provider_role, '') || ' ' || coalesce(a.billing_labels, '')) ~ '\m(rbt|bt|technician|rbt/bt)\M'
          THEN 'RBT'
        WHEN a.procedure_code IN ('97155','97151','97156','97157','97158')
          THEN 'BCBA'
        WHEN a.procedure_code IN ('97153','97154','0362T','0373T')
          THEN 'RBT'
        WHEN lower(coalesce(emp.job_title, '') || ' ' || coalesce(emp.credential, '')) ~ '\m(bcba|bcaba|lba)\M'
          THEN 'BCBA'
        WHEN lower(coalesce(emp.job_title, '') || ' ' || coalesce(emp.credential, '')) ~ '\m(rbt|bt|technician)\M'
          THEN 'RBT'
        ELSE 'Unknown'
      END AS role_group,
      nullif(btrim(a.state), '') AS state,
      a.date_of_service,
      coalesce(a.completed_on, a.creation_date) AS documentation_date,
      CASE
        WHEN coalesce(a.completed_on, a.creation_date) IS NULL THEN NULL
        ELSE (coalesce(a.completed_on, a.creation_date) - a.date_of_service)
      END AS lag_days,
      (a.completed_on IS NOT NULL) AS used_authoritative_completion,
      CASE
        WHEN a.completed_on IS NOT NULL THEN 'authoritative_completion'
        WHEN a.creation_date IS NOT NULL THEN 'dos_to_billing_creation_proxy'
        ELSE 'missing_documentation_timestamp'
      END AS provenance,
      a.source_quality,
      a.last_seen_at
    FROM authoritative a
    LEFT JOIN public.employees emp ON emp.id = a.employee_id
  )
  SELECT
    s.employee_id,
    s.provider_display_name,
    s.role_group,
    s.state,
    s.date_of_service,
    s.documentation_date,
    s.lag_days,
    CASE
      WHEN s.lag_days IS NULL THEN 'missing'
      WHEN s.lag_days < 0 THEN 'invalid'
      WHEN s.lag_days > 7 THEN 'late'
      ELSE 'on_time'
    END AS timeliness_status,
    CASE
      WHEN s.role_group = 'RBT' THEN 'RBT proxy'
      WHEN s.role_group = 'BCBA' THEN 'BCBA Category 2 proxy'
      ELSE 'unclassified'
    END AS proxy_category,
    s.used_authoritative_completion,
    s.provenance,
    s.source_quality,
    s.last_seen_at
  FROM shaped s
  CROSS JOIN guard g
  WHERE g.uid IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy(date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy(date, date) TO service_role;

COMMENT ON FUNCTION public.report_c2s_documentation_proxy(date, date) IS
  'De-identified Commit to Submit documentation-timeliness proxy. DOS-to-billing-creation lag is a PROXY ONLY and can never mark a formal violation. BCBA Category 1 is never inferred here.';
