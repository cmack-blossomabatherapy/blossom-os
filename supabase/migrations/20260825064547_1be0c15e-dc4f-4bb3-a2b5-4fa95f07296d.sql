-- ============================================================
-- Commit to Submit (C2S) — Phase 3A HARDENING (additive)
-- Fixes live-audit findings: overly broad default table privileges,
-- sensitive config exposure, non-database-true formal violations,
-- notice/dispute integrity, manager field boundary, proxy mapping.
-- No client, financial, compensation, rate, raw payload/label, or
-- employment-action data is introduced anywhere below.
-- ============================================================

-- ---------- 1. Privilege lockdown (project default privileges granted
-- anon/authenticated full DML incl. TRUNCATE, which RLS does not protect) ----
REVOKE ALL PRIVILEGES ON TABLE public.c2s_program_config FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.c2s_tracker_records FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.c2s_coaching_records FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.c2s_exceptions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.c2s_notices FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.c2s_disputes FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.c2s_program_reviews FROM PUBLIC, anon, authenticated;

-- Regrant ONLY what the RLS policies need. Never DELETE/TRUNCATE/REFERENCES/TRIGGER.
GRANT SELECT, INSERT, UPDATE ON public.c2s_program_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.c2s_tracker_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.c2s_coaching_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.c2s_exceptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.c2s_notices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.c2s_disputes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.c2s_program_reviews TO authenticated;

GRANT ALL ON public.c2s_program_config TO service_role;
GRANT ALL ON public.c2s_tracker_records TO service_role;
GRANT ALL ON public.c2s_coaching_records TO service_role;
GRANT ALL ON public.c2s_exceptions TO service_role;
GRANT ALL ON public.c2s_notices TO service_role;
GRANT ALL ON public.c2s_disputes TO service_role;
GRANT ALL ON public.c2s_program_reviews TO service_role;

-- ---------- 2. Privileged role list (narrow: drop systems_admin, add cfo) ----
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
        'admin','super_admin',
        'hr','hr_admin','hr_manager','hr_lead',
        'exec','executive','executive_leadership','ceo','coo','cfo'
      )
  );
$$;
REVOKE ALL ON FUNCTION public.c2s_is_hr_authority(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.c2s_is_hr_authority(uuid) TO authenticated, service_role;

-- ---------- 3. Config: sensitive read + single enabled version ----------
DROP POLICY IF EXISTS "c2s_config_read" ON public.c2s_program_config;
CREATE POLICY "c2s_config_read_hr_only" ON public.c2s_program_config
  FOR SELECT TO authenticated USING (public.c2s_is_hr_authority());

-- At most one enabled configuration version at a time. Zero rows = disabled.
CREATE UNIQUE INDEX IF NOT EXISTS c2s_config_single_enabled_idx
  ON public.c2s_program_config ((is_enabled))
  WHERE is_enabled = true;

-- Staff-safe status: no approver identities, no approval notes, no sensitive fields.
CREATE OR REPLACE FUNCTION public.report_c2s_program_status()
RETURNS TABLE (
  configured boolean,
  enabled boolean,
  policy_version text,
  tracking_start_date date,
  approvals_complete boolean,
  required_values_complete boolean,
  activation_ready boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH guard AS (SELECT auth.uid() AS uid),
  pick AS (
    SELECT c.*
    FROM public.c2s_program_config c
    ORDER BY c.is_enabled DESC, c.effective_from DESC, c.created_at DESC
    LIMIT 1
  )
  SELECT
    (p.id IS NOT NULL) AS configured,
    coalesce(p.is_enabled, false) AS enabled,
    p.policy_version,
    p.tracking_start_date,
    (p.hr_approved_at IS NOT NULL AND p.legal_approved_at IS NOT NULL) AS approvals_complete,
    (
      p.tracking_start_date IS NOT NULL
      AND p.prior_history_counts IS NOT NULL
      AND p.new_hire_grace_days IS NOT NULL
      AND coalesce(btrim(p.category1_qa_criteria), '') <> ''
    ) AS required_values_complete,
    (
      coalesce(p.is_enabled, false)
      AND p.hr_approved_at IS NOT NULL AND p.legal_approved_at IS NOT NULL
      AND p.tracking_start_date IS NOT NULL
      AND p.prior_history_counts IS NOT NULL
      AND p.new_hire_grace_days IS NOT NULL
      AND coalesce(btrim(p.category1_qa_criteria), '') <> ''
    ) AS activation_ready
  FROM guard g
  LEFT JOIN pick p ON true
  WHERE g.uid IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.report_c2s_program_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_c2s_program_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.report_c2s_program_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_c2s_program_status() TO service_role;
COMMENT ON FUNCTION public.report_c2s_program_status() IS
  'Staff-safe Commit to Submit program status. Never returns approver ids, approval notes, or other sensitive configuration fields.';

-- ---------- 4. Shared validation helpers ----------
CREATE OR REPLACE FUNCTION public.c2s_config_is_active(_config_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.c2s_program_config c
    WHERE c.id = _config_id
      AND c.is_enabled = true
      AND c.hr_approved_by IS NOT NULL AND c.hr_approved_at IS NOT NULL
      AND c.legal_approved_by IS NOT NULL AND c.legal_approved_at IS NOT NULL
      AND c.tracking_start_date IS NOT NULL
      AND c.prior_history_counts IS NOT NULL
      AND c.new_hire_grace_days IS NOT NULL
      AND coalesce(btrim(c.category1_qa_criteria), '') <> ''
  );
$$;

-- Weekend-aware business-day math.
-- LIMITATION: organization holidays are not available in any source system, so
-- a deadline near a holiday must be confirmed manually by HR.
CREATE OR REPLACE FUNCTION public.c2s_add_business_days(_from date, _days integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  d date := _from;
  remaining integer := greatest(coalesce(_days, 0), 0);
BEGIN
  IF _from IS NULL THEN RETURN NULL; END IF;
  WHILE remaining > 0 LOOP
    d := d + 1;
    IF extract(isodow FROM d) < 6 THEN
      remaining := remaining - 1;
    END IF;
  END LOOP;
  RETURN d;
END;
$$;
COMMENT ON FUNCTION public.c2s_add_business_days(date, integer) IS
  'Weekend-aware business-day addition. Organization holidays are unavailable in the source and require manual confirmation.';

-- Does an approved exception cover this tracker record (linked or by date window)?
CREATE OR REPLACE FUNCTION public.c2s_has_approved_exception(_subject uuid, _tracker_record_id uuid, _service_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.c2s_exceptions x
    WHERE x.status = 'approved'
      AND x.subject_employee_id = _subject
      AND (
        (_tracker_record_id IS NOT NULL AND x.tracker_record_id = _tracker_record_id)
        OR (
          x.tracker_record_id IS NULL
          AND _service_date IS NOT NULL
          AND (x.applies_from IS NULL OR _service_date >= x.applies_from)
          AND (x.applies_to IS NULL OR _service_date <= x.applies_to)
        )
      )
  );
$$;

-- Single active-formal helper for notices/report logic. A later approved
-- exception or upheld dispute makes a record ineligible for ACTIVE formal
-- counts without erasing the recorded history.
CREATE OR REPLACE FUNCTION public.c2s_is_active_formal(_tracker_record_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.c2s_tracker_records t
    WHERE t.id = _tracker_record_id
      AND t.is_formal_violation = true
      AND t.review_status = 'upheld'
      AND t.reviewed_by IS NOT NULL AND t.reviewed_at IS NOT NULL
      AND t.formal_violation_recorded_by IS NOT NULL
      AND t.formal_violation_recorded_at IS NOT NULL
      AND t.source_kind IN ('authoritative_completion','reviewed_tracker')
      AND public.c2s_config_is_active(t.config_id)
      AND EXISTS (
        SELECT 1 FROM public.c2s_coaching_records c
        WHERE c.subject_employee_id = t.subject_employee_id
          AND c.coaching_date <= (t.formal_violation_recorded_at AT TIME ZONE 'UTC')::date
      )
      AND NOT public.c2s_has_approved_exception(t.subject_employee_id, t.id, t.service_date)
      AND NOT EXISTS (
        SELECT 1 FROM public.c2s_disputes d
        WHERE d.tracker_record_id = t.id AND d.status = 'upheld'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.c2s_config_is_active(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.c2s_add_business_days(date, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.c2s_has_approved_exception(uuid, uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.c2s_is_active_formal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.c2s_config_is_active(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.c2s_add_business_days(date, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.c2s_has_approved_exception(uuid, uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.c2s_is_active_formal(uuid) TO authenticated, service_role;

-- ---------- 5. Formal violation must be database-true ----------
CREATE OR REPLACE FUNCTION public.c2s_tracker_formal_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(NEW.is_formal_violation, false) = false THEN
    RETURN NEW;
  END IF;

  IF NOT public.c2s_config_is_active(NEW.config_id) THEN
    RAISE EXCEPTION 'C2S: a formal violation requires an enabled, fully approved program configuration';
  END IF;

  IF NEW.source_kind NOT IN ('authoritative_completion','reviewed_tracker') THEN
    RAISE EXCEPTION 'C2S: a formal violation requires an authoritative completion or reviewed tracker source';
  END IF;

  IF NEW.review_status <> 'upheld'
     OR NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NULL
     OR NEW.formal_violation_recorded_by IS NULL OR NEW.formal_violation_recorded_at IS NULL THEN
    RAISE EXCEPTION 'C2S: a formal violation requires an upheld review with reviewer and timestamps';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.c2s_coaching_records c
    WHERE c.subject_employee_id = NEW.subject_employee_id
      AND c.coaching_date <= (NEW.formal_violation_recorded_at AT TIME ZONE 'UTC')::date
  ) THEN
    RAISE EXCEPTION 'C2S: coaching for this employee must exist and precede the formal-recorded date';
  END IF;

  IF public.c2s_has_approved_exception(NEW.subject_employee_id, NEW.id, NEW.service_date) THEN
    RAISE EXCEPTION 'C2S: an approved exception applies to this record';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.c2s_disputes d
    WHERE d.tracker_record_id = NEW.id AND d.status = 'upheld'
  ) THEN
    RAISE EXCEPTION 'C2S: an upheld dispute overturns this record';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.c2s_tracker_formal_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_tracker_formal_guard() TO service_role;

DROP TRIGGER IF EXISTS c2s_tracker_formal_guard_trg ON public.c2s_tracker_records;
CREATE TRIGGER c2s_tracker_formal_guard_trg
  BEFORE INSERT OR UPDATE ON public.c2s_tracker_records
  FOR EACH ROW EXECUTE FUNCTION public.c2s_tracker_formal_guard();

-- ---------- 6. Notice integrity ----------
CREATE OR REPLACE FUNCTION public.c2s_notice_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  t public.c2s_tracker_records;
  co public.c2s_coaching_records;
  highest integer;
BEGIN
  SELECT * INTO t FROM public.c2s_tracker_records WHERE id = NEW.tracker_record_id;
  IF t.id IS NULL OR t.subject_employee_id <> NEW.subject_employee_id THEN
    RAISE EXCEPTION 'C2S: notice subject must match the tracker record subject';
  END IF;

  SELECT * INTO co FROM public.c2s_coaching_records WHERE id = NEW.prior_coaching_id;
  IF co.id IS NULL OR co.subject_employee_id <> NEW.subject_employee_id THEN
    RAISE EXCEPTION 'C2S: notice must reference coaching for the same employee';
  END IF;
  IF co.coaching_date > (NEW.issued_at AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'C2S: coaching must precede the notice';
  END IF;

  IF NEW.config_id IS DISTINCT FROM t.config_id THEN
    RAISE EXCEPTION 'C2S: notice configuration must match the tracker record configuration';
  END IF;
  IF NOT public.c2s_config_is_active(NEW.config_id) THEN
    RAISE EXCEPTION 'C2S: a notice requires an enabled, fully approved program configuration';
  END IF;

  IF NOT public.c2s_is_active_formal(NEW.tracker_record_id) THEN
    RAISE EXCEPTION 'C2S: a notice requires an active formal violation (no approved exception, no upheld dispute)';
  END IF;

  -- Levels must advance sequentially 1 -> 2 -> 3 for a subject. Max stays 3.
  SELECT coalesce(max(n.notice_level), 0) INTO highest
  FROM public.c2s_notices n
  WHERE n.subject_employee_id = NEW.subject_employee_id
    AND n.id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  IF NEW.notice_level <> highest + 1 THEN
    RAISE EXCEPTION 'C2S: notice levels must advance sequentially (next allowed level is %)', highest + 1;
  END IF;

  -- Level 3 is an HR review requirement ONLY. No employment action is created.
  IF NEW.notice_level = 3 THEN
    NEW.hr_review_required := true;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.c2s_notice_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_notice_guard() TO service_role;

DROP TRIGGER IF EXISTS c2s_notice_guard_trg ON public.c2s_notices;
CREATE TRIGGER c2s_notice_guard_trg
  BEFORE INSERT OR UPDATE ON public.c2s_notices
  FOR EACH ROW EXECUTE FUNCTION public.c2s_notice_guard();

-- ---------- 7. Dispute insert integrity ----------
CREATE OR REPLACE FUNCTION public.c2s_dispute_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  n public.c2s_notices;
  t public.c2s_tracker_records;
  viewer uuid;
  is_hr boolean;
  window_days integer;
  anchor date;
BEGIN
  IF NEW.notice_id IS NULL AND NEW.tracker_record_id IS NULL THEN
    RAISE EXCEPTION 'C2S: a dispute must reference a notice or a tracker record';
  END IF;

  IF NEW.notice_id IS NOT NULL THEN
    SELECT * INTO n FROM public.c2s_notices WHERE id = NEW.notice_id;
    IF n.id IS NULL OR n.subject_employee_id <> NEW.subject_employee_id THEN
      RAISE EXCEPTION 'C2S: the disputed notice must belong to the dispute subject';
    END IF;
  END IF;

  IF NEW.tracker_record_id IS NOT NULL THEN
    SELECT * INTO t FROM public.c2s_tracker_records WHERE id = NEW.tracker_record_id;
    IF t.id IS NULL OR t.subject_employee_id <> NEW.subject_employee_id THEN
      RAISE EXCEPTION 'C2S: the disputed record must belong to the dispute subject';
    END IF;
  END IF;

  SELECT coalesce(min(c.dispute_window_business_days), 5) INTO window_days
  FROM public.c2s_program_config c
  WHERE c.is_enabled = true;

  anchor := coalesce(
    (n.issued_at AT TIME ZONE 'UTC')::date,
    (t.formal_violation_recorded_at AT TIME ZONE 'UTC')::date,
    (coalesce(NEW.filed_at, now()) AT TIME ZONE 'UTC')::date
  );
  NEW.filing_deadline := public.c2s_add_business_days(anchor, window_days);

  IF auth.uid() IS NULL THEN
    RETURN NEW; -- trusted backend/service context
  END IF;

  is_hr := public.c2s_is_hr_authority();
  SELECT e.id INTO viewer FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' AND NOT is_hr THEN
    -- The employee may only file: no self-adjudication, no impersonation.
    NEW.filed_by := coalesce(viewer, NEW.filed_by);
    NEW.status := 'submitted';
    NEW.decided_by := NULL;
    NEW.decided_at := NULL;
    NEW.decision_notes := NULL;
    IF (coalesce(NEW.filed_at, now()) AT TIME ZONE 'UTC')::date > NEW.filing_deadline THEN
      RAISE EXCEPTION 'C2S: the dispute filing window has closed (deadline %)', NEW.filing_deadline;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.c2s_dispute_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_dispute_guard() TO service_role;

DROP TRIGGER IF EXISTS c2s_dispute_guard_trg ON public.c2s_disputes;
CREATE TRIGGER c2s_dispute_guard_trg
  BEFORE INSERT OR UPDATE ON public.c2s_disputes
  FOR EACH ROW EXECUTE FUNCTION public.c2s_dispute_guard();

-- ---------- 8. Manager review field boundary ----------
CREATE OR REPLACE FUNCTION public.c2s_review_field_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  viewer uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- trusted backend/service context
  END IF;
  IF public.c2s_is_hr_authority() THEN
    RETURN NEW; -- HR authority owns HR fields
  END IF;

  IF NOT public.c2s_is_direct_manager(NEW.subject_employee_id) THEN
    RAISE EXCEPTION 'C2S: only the direct manager or HR authority may record this review';
  END IF;

  SELECT e.id INTO viewer FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1;
  NEW.manager_id := coalesce(viewer, NEW.manager_id);

  IF TG_OP = 'INSERT' THEN
    NEW.hr_approved := NULL;
    NEW.hr_approved_by := NULL;
    NEW.hr_approved_at := NULL;
    NEW.outcome := NULL;
  ELSE
    -- HR-owned fields are preserved, never written by a manager.
    NEW.hr_approved := OLD.hr_approved;
    NEW.hr_approved_by := OLD.hr_approved_by;
    NEW.hr_approved_at := OLD.hr_approved_at;
    NEW.outcome := OLD.outcome;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.c2s_review_field_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_review_field_guard() TO service_role;

DROP TRIGGER IF EXISTS c2s_review_field_guard_trg ON public.c2s_program_reviews;
CREATE TRIGGER c2s_review_field_guard_trg
  BEFORE INSERT OR UPDATE ON public.c2s_program_reviews
  FOR EACH ROW EXECUTE FUNCTION public.c2s_review_field_guard();

-- ---------- 9. Proxy mapping / role correctness ----------
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
  id_pool AS (
    -- employees.centralreach_id is authoritative identity, plus reviewed links.
    SELECT nullif(btrim(e.centralreach_id), '') AS provider_id, e.id AS employee_id
    FROM public.employees e
    WHERE nullif(btrim(e.centralreach_id), '') IS NOT NULL
    UNION
    SELECT nullif(btrim(l.cr_provider_id), ''), l.employee_id
    FROM public.cr_provider_match_links l
    WHERE l.employee_id IS NOT NULL
      AND nullif(btrim(l.cr_provider_id), '') IS NOT NULL
  ),
  by_id AS (
    SELECT provider_id, (min(employee_id::text))::uuid AS employee_id
    FROM id_pool
    GROUP BY provider_id
    HAVING count(DISTINCT employee_id) = 1
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
      s.creation_date,
      s.provider_role,
      s.billing_labels,
      s.last_seen_at
    FROM public.cr_billing_sessions b
    INNER JOIN public.cr_billing_session_status s ON s.row_hash = b.row_hash
    WHERE coalesce(s.is_void, false) = false
      AND coalesce(s.deleted, false) = false
      -- Honor an EXPLICIT invalid/rejected source flag only. Missing quality
      -- metadata must never make a row invalid.
      AND lower(coalesce(s.source_quality->>'status', '')) NOT IN ('invalid','rejected')
      AND lower(coalesce(s.source_quality->>'invalid', '')) NOT IN ('true','t','1','yes')
      AND lower(coalesce(s.source_quality->>'rejected', '')) NOT IN ('true','t','1','yes')
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
    SELECT m.*, t.completed_on
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
      -- Approved hierarchy ONLY: current provider role / billing labels, then
      -- the mapped employee's job title / credential, else Unknown.
      -- A procedure code must never guess a person's role.
      CASE
        WHEN lower(coalesce(a.provider_role, '') || ' ' || coalesce(a.billing_labels, '')) ~ '\m(bcba|bcaba|lba|analyst)\M'
          THEN 'BCBA'
        WHEN lower(coalesce(a.provider_role, '') || ' ' || coalesce(a.billing_labels, '')) ~ '\m(rbt|bt|technician)\M'
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
  WHERE g.uid IS NOT NULL
    -- An inverted range must never return misleading data.
    AND (p_from IS NULL OR p_to IS NULL OR p_from <= p_to);
$$;

REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy(date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy(date, date) TO service_role;
COMMENT ON FUNCTION public.report_c2s_documentation_proxy(date, date) IS
  'De-identified Commit to Submit documentation-timeliness proxy. Identity maps by CentralReach id first (employees.centralreach_id plus reviewed links), then unique normalized name. Role never comes from a procedure code. PROXY ONLY: never a formal violation and never BCBA Category 1.';