-- ============================================================
-- Commit to Submit (C2S) — Phase 3A FINAL hardening repair (additive)
-- Repairs live-function defects found after the previous hardening pass:
--  1. dispute backdating / self-anchoring / incoherent notice+tracker links
--  2. notice UPDATE became impossible once a higher level existed
--  3. tracking_start_date / prior_history_counts / effective window ignored
--  4. approved unlinked exception with no window acted as a blanket exception
--  5. minimum EXECUTE privileges on internal helper routines
-- No client, payor, financial, compensation, rate, raw payload/label, or
-- employment-action data is introduced anywhere below.
-- ============================================================

-- ---------- 1. Effective-window / tracking-start validation helpers ----------

-- Is a calendar date inside the configuration's effective window?
CREATE OR REPLACE FUNCTION public.c2s_config_window_contains(_config_id uuid, _on date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.c2s_program_config c
    WHERE c.id = _config_id
      AND _on IS NOT NULL
      AND (c.effective_from IS NULL OR _on >= c.effective_from)
      AND (c.effective_to IS NULL OR _on <= c.effective_to)
  );
$$;
COMMENT ON FUNCTION public.c2s_config_window_contains(uuid, date) IS
  'True when a date falls inside the C2S configuration effective window.';

-- May a service date be counted under this configuration?
-- Dates on/after tracking_start_date always may. Earlier dates may only when
-- prior_history_counts = true.
CREATE OR REPLACE FUNCTION public.c2s_config_allows_service_date(_config_id uuid, _service_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.c2s_program_config c
    WHERE c.id = _config_id
      AND _service_date IS NOT NULL
      AND c.tracking_start_date IS NOT NULL
      AND (
        _service_date >= c.tracking_start_date
        OR coalesce(c.prior_history_counts, false) = true
      )
  );
$$;
COMMENT ON FUNCTION public.c2s_config_allows_service_date(uuid, date) IS
  'True when a service date is in scope: on/after tracking_start_date, or earlier only when prior history counts.';

-- ---------- 2. Approved exception scope must be bounded ----------
-- An approved exception must either link to a same-subject tracker record, or
-- carry BOTH applies_from and applies_to as a bounded same-subject window.
-- An unlinked exception with no window (or a one-sided window) never applies.
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
          AND x.applies_from IS NOT NULL
          AND x.applies_to IS NOT NULL
          AND _service_date >= x.applies_from
          AND _service_date <= x.applies_to
        )
      )
  );
$$;
COMMENT ON FUNCTION public.c2s_has_approved_exception(uuid, uuid, date) IS
  'True only for a linked same-record approved exception or a bounded approved date-window exception. An unbounded exception never applies.';

CREATE OR REPLACE FUNCTION public.c2s_exception_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  t public.c2s_tracker_records;
BEGIN
  IF NEW.tracker_record_id IS NOT NULL THEN
    SELECT * INTO t FROM public.c2s_tracker_records WHERE id = NEW.tracker_record_id;
    IF t.id IS NULL OR t.subject_employee_id <> NEW.subject_employee_id THEN
      RAISE EXCEPTION 'C2S: an exception may only link to a tracker record for the same employee';
    END IF;
  END IF;

  IF NEW.status = 'approved' AND NEW.tracker_record_id IS NULL THEN
    IF NEW.applies_from IS NULL OR NEW.applies_to IS NULL THEN
      RAISE EXCEPTION 'C2S: an approved exception must link to a tracker record or carry a bounded applies_from/applies_to window';
    END IF;
    IF NEW.applies_to < NEW.applies_from THEN
      RAISE EXCEPTION 'C2S: exception window applies_to must not precede applies_from';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.c2s_exception_scope_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_exception_scope_guard() TO service_role;

DROP TRIGGER IF EXISTS c2s_exception_scope_guard_trg ON public.c2s_exceptions;
CREATE TRIGGER c2s_exception_scope_guard_trg
  BEFORE INSERT OR UPDATE ON public.c2s_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.c2s_exception_scope_guard();

-- ---------- 3. Active formal must respect the effective config window ----------
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
      AND public.c2s_config_window_contains(
            t.config_id, (t.formal_violation_recorded_at AT TIME ZONE 'UTC')::date)
      AND public.c2s_config_allows_service_date(t.config_id, t.service_date)
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

-- ---------- 4. Tracker formal guard: tracking start + effective window ----------
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

  -- The formal disposition must be recorded inside the configuration window.
  IF NOT public.c2s_config_window_contains(
       NEW.config_id, (NEW.formal_violation_recorded_at AT TIME ZONE 'UTC')::date) THEN
    RAISE EXCEPTION 'C2S: the formal-recorded date falls outside the program configuration effective window';
  END IF;

  -- Service dates before tracking_start_date only count when prior history counts.
  IF NOT public.c2s_config_allows_service_date(NEW.config_id, NEW.service_date) THEN
    RAISE EXCEPTION 'C2S: the service date precedes the program tracking start date and prior history does not count';
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

-- ---------- 5. Notice guard: sequential on INSERT only, immutable identity ----
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
  IF TG_OP = 'UPDATE' THEN
    -- Identity of an issued notice is immutable. Only acknowledgment and HR
    -- review fields may change, so an earlier notice stays editable after a
    -- later level exists. A later dispute/exception never erases history.
    IF NEW.subject_employee_id IS DISTINCT FROM OLD.subject_employee_id
       OR NEW.tracker_record_id IS DISTINCT FROM OLD.tracker_record_id
       OR NEW.config_id IS DISTINCT FROM OLD.config_id
       OR NEW.prior_coaching_id IS DISTINCT FROM OLD.prior_coaching_id
       OR NEW.notice_level IS DISTINCT FROM OLD.notice_level
       OR NEW.issued_by IS DISTINCT FROM OLD.issued_by
       OR NEW.issued_at IS DISTINCT FROM OLD.issued_at THEN
      RAISE EXCEPTION 'C2S: an issued notice identity (subject, record, configuration, coaching, level, issuer, issued_at) is immutable';
    END IF;
    IF NEW.notice_level = 3 THEN
      NEW.hr_review_required := true;
    END IF;
    RETURN NEW;
  END IF;

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
  IF NOT public.c2s_config_window_contains(
       NEW.config_id, (coalesce(NEW.issued_at, now()) AT TIME ZONE 'UTC')::date) THEN
    RAISE EXCEPTION 'C2S: the notice issue date falls outside the program configuration effective window';
  END IF;

  IF NOT public.c2s_is_active_formal(NEW.tracker_record_id) THEN
    RAISE EXCEPTION 'C2S: a notice requires an active formal violation (no approved exception, no upheld dispute)';
  END IF;

  -- Levels must advance sequentially 1 -> 2 -> 3 for a subject. Max stays 3.
  SELECT coalesce(max(n.notice_level), 0) INTO highest
  FROM public.c2s_notices n
  WHERE n.subject_employee_id = NEW.subject_employee_id;
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

-- ---------- 6. Dispute guard: authoritative anchor, no backdating ----------
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

  -- A notice and a record supplied together must describe the SAME record.
  IF NEW.notice_id IS NOT NULL AND NEW.tracker_record_id IS NOT NULL
     AND n.tracker_record_id IS DISTINCT FROM NEW.tracker_record_id THEN
    RAISE EXCEPTION 'C2S: the disputed notice must reference the same tracker record as the dispute';
  END IF;

  SELECT coalesce(min(c.dispute_window_business_days), 5) INTO window_days
  FROM public.c2s_program_config c
  WHERE c.is_enabled = true;
  window_days := coalesce(window_days, 5);

  -- The deadline anchor is authoritative only. A dispute NEVER anchors itself
  -- from a caller-supplied filed_at.
  anchor := coalesce(
    (n.issued_at AT TIME ZONE 'UTC')::date,
    (t.formal_violation_recorded_at AT TIME ZONE 'UTC')::date
  );
  IF anchor IS NULL THEN
    RAISE EXCEPTION 'C2S: a dispute requires an authoritative anchor (notice issue date or formal-recorded date)';
  END IF;
  NEW.filing_deadline := public.c2s_add_business_days(anchor, window_days);

  IF auth.uid() IS NULL THEN
    RETURN NEW; -- trusted backend/service context; link coherence already enforced
  END IF;

  is_hr := public.c2s_is_hr_authority();
  SELECT e.id INTO viewer FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' AND NOT is_hr THEN
    -- The employee may only file: no impersonation, no backdating, no
    -- self-adjudication.
    IF viewer IS NULL THEN
      RAISE EXCEPTION 'C2S: only a mapped employee record may file a dispute';
    END IF;
    NEW.filed_by := viewer;
    NEW.filed_at := now();
    NEW.status := 'submitted';
    NEW.decided_by := NULL;
    NEW.decided_at := NULL;
    NEW.decision_notes := NULL;
    IF (NEW.filed_at AT TIME ZONE 'UTC')::date > NEW.filing_deadline THEN
      RAISE EXCEPTION 'C2S: the dispute filing window has closed (deadline %)', NEW.filing_deadline;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------- 7. Minimum EXECUTE privileges on internal helpers ----------
-- Internal helpers are called only from SECURITY DEFINER triggers/functions, so
-- no client role needs direct EXECUTE.
REVOKE ALL ON FUNCTION public.c2s_add_business_days(date, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_config_is_active(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_has_approved_exception(uuid, uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_is_active_formal(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_config_window_contains(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_config_allows_service_date(uuid, date) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.c2s_add_business_days(date, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_config_is_active(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_has_approved_exception(uuid, uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_is_active_formal(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_config_window_contains(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_config_allows_service_date(uuid, date) TO service_role;

-- Trigger functions stay unexecutable by client roles.
REVOKE ALL ON FUNCTION public.c2s_tracker_formal_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_notice_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.c2s_dispute_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_tracker_formal_guard() TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_notice_guard() TO service_role;
GRANT EXECUTE ON FUNCTION public.c2s_dispute_guard() TO service_role;

-- RLS helpers referenced by policies keep authenticated EXECUTE.
GRANT EXECUTE ON FUNCTION public.c2s_is_subject(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_is_direct_manager(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_can_read_subject(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.c2s_is_hr_authority(uuid) TO authenticated;

-- Staff-facing report RPCs keep authenticated EXECUTE.
GRANT EXECUTE ON FUNCTION public.report_c2s_program_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy(date, date) TO authenticated;