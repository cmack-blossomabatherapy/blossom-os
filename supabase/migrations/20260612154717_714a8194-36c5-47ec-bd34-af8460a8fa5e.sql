
-- Triggers --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_log_employee_device()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'device_assigned',
      concat('Device assigned: ', NEW.name, ' (', NEW.device_type, ')'),
      jsonb_build_object('device_id', NEW.id, 'serial', NEW.serial, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'device_status_changed',
        concat('Device "', NEW.name, '" — status ', OLD.status, ' → ', NEW.status),
        jsonb_build_object('device_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
    END IF;
    IF NEW.returned_at IS DISTINCT FROM OLD.returned_at AND NEW.returned_at IS NOT NULL THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'device_returned',
        concat('Device returned: ', NEW.name),
        jsonb_build_object('device_id', NEW.id, 'returned_at', NEW.returned_at));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_employee_timeline_event(OLD.employee_id, 'device_removed',
      concat('Device removed: ', OLD.name), jsonb_build_object('device_id', OLD.id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_employee_devices_timeline ON public.employee_devices;
CREATE TRIGGER trg_employee_devices_timeline AFTER INSERT OR UPDATE OR DELETE ON public.employee_devices
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_device();

CREATE OR REPLACE FUNCTION public.trg_log_employee_nfc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'nfc_assigned',
      concat('NFC tag assigned (', NEW.tag_code, ')'),
      jsonb_build_object('tag_id', NEW.id, 'is_active', NEW.is_active));
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id,
      CASE WHEN NEW.is_active THEN 'nfc_activated' ELSE 'nfc_deactivated' END,
      concat('NFC tag ', NEW.tag_code, ' ', CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END),
      jsonb_build_object('tag_id', NEW.id));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_employee_timeline_event(OLD.employee_id, 'nfc_removed',
      concat('NFC tag removed (', OLD.tag_code, ')'), jsonb_build_object('tag_id', OLD.id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_employee_nfc_timeline ON public.employee_nfc_tags;
CREATE TRIGGER trg_employee_nfc_timeline AFTER INSERT OR UPDATE OR DELETE ON public.employee_nfc_tags
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_nfc();

CREATE OR REPLACE FUNCTION public.trg_log_employee_pay_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'pay_change_proposed',
      concat('Pay change proposed (', NEW.kind, ') — new rate ', NEW.new_rate),
      jsonb_build_object('pay_change_id', NEW.id, 'kind', NEW.kind, 'new_rate', NEW.new_rate));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id,
      concat('pay_change_', NEW.status::text),
      concat('Pay change ', NEW.status::text, ' (', NEW.kind, ')'),
      jsonb_build_object('pay_change_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_employee_pay_changes_timeline ON public.employee_pay_changes;
CREATE TRIGGER trg_employee_pay_changes_timeline AFTER INSERT OR UPDATE ON public.employee_pay_changes
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_pay_change();

CREATE OR REPLACE FUNCTION public.trg_log_employee_document()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'document_added',
      concat('Document added: ', NEW.name, ' (', NEW.doc_type, ')'),
      jsonb_build_object('document_id', NEW.id, 'status', NEW.status, 'required', NEW.required));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'document_status_changed',
        concat('Document "', NEW.name, '" — status ', OLD.status, ' → ', NEW.status),
        jsonb_build_object('document_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
    END IF;
    IF NEW.verified_at IS DISTINCT FROM OLD.verified_at AND NEW.verified_at IS NOT NULL THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'document_verified',
        concat('Document verified: ', NEW.name), jsonb_build_object('document_id', NEW.id));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_employee_timeline_event(OLD.employee_id, 'document_removed',
      concat('Document removed: ', OLD.name), jsonb_build_object('document_id', OLD.id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_employee_documents_hr_timeline ON public.employee_documents_hr;
CREATE TRIGGER trg_employee_documents_hr_timeline AFTER INSERT OR UPDATE OR DELETE ON public.employee_documents_hr
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_document();

CREATE OR REPLACE FUNCTION public.trg_log_employee_note()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'note_added',
      concat('Note added', CASE WHEN NEW.author_name IS NOT NULL THEN concat(' by ', NEW.author_name) ELSE '' END),
      jsonb_build_object('note_id', NEW.id, 'visibility', NEW.visibility));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_employee_notes_timeline ON public.employee_notes;
CREATE TRIGGER trg_employee_notes_timeline AFTER INSERT ON public.employee_notes
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_note();

CREATE OR REPLACE FUNCTION public.trg_log_employee_case()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'case_opened',
      concat('HR case opened: ', NEW.title, ' (', NEW.case_type, ', ', NEW.priority, ')'),
      jsonb_build_object('case_id', NEW.id, 'priority', NEW.priority, 'case_type', NEW.case_type));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'case_status_changed',
        concat('HR case "', NEW.title, '" — ', OLD.status, ' → ', NEW.status),
        jsonb_build_object('case_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
    END IF;
    IF NEW.closed_at IS DISTINCT FROM OLD.closed_at AND NEW.closed_at IS NOT NULL THEN
      PERFORM public.log_employee_timeline_event(NEW.employee_id, 'case_closed',
        concat('HR case closed: ', NEW.title), jsonb_build_object('case_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_employee_cases_timeline ON public.employee_cases;
CREATE TRIGGER trg_employee_cases_timeline AFTER INSERT OR UPDATE ON public.employee_cases
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_case();

CREATE OR REPLACE FUNCTION public.trg_log_employee_bonus()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'bonus_created',
      concat('Bonus created: $', NEW.amount, ' (', NEW.bonus_type, ')'),
      jsonb_build_object('bonus_id', NEW.id, 'amount', NEW.amount, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'bonus_status_changed',
      concat('Bonus ', OLD.status, ' → ', NEW.status, ' ($', NEW.amount, ')'),
      jsonb_build_object('bonus_id', NEW.id, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_employee_bonuses_timeline ON public.employee_bonuses;
CREATE TRIGGER trg_employee_bonuses_timeline AFTER INSERT OR UPDATE ON public.employee_bonuses
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_bonus();

CREATE OR REPLACE FUNCTION public.trg_log_hours_timesheet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'timesheet_created',
      concat('Timesheet created for ', NEW.period_start::text, ' – ', NEW.period_end::text),
      jsonb_build_object('timesheet_id', NEW.id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_employee_timeline_event(NEW.employee_id, 'timesheet_status_changed',
      concat('Timesheet ', NEW.period_start::text, ' – ', NEW.period_end::text, ': ', OLD.status, ' → ', NEW.status),
      jsonb_build_object('timesheet_id', NEW.id, 'total_hours', NEW.total_hours));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_hours_timesheets_timeline ON public.hours_timesheets;
CREATE TRIGGER trg_hours_timesheets_timeline AFTER INSERT OR UPDATE ON public.hours_timesheets
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_hours_timesheet();

CREATE OR REPLACE FUNCTION public.trg_log_employee_login()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _emp_id uuid;
BEGIN
  SELECT id INTO _emp_id FROM public.employees
   WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) LIMIT 1;
  IF _emp_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(_emp_id, 'login_assigned',
      concat('Login access granted: ', NEW.system_name),
      jsonb_build_object('login_id', NEW.id, 'system', NEW.system_name, 'category', NEW.system_category));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      PERFORM public.log_employee_timeline_event(_emp_id,
        CASE WHEN NEW.is_active THEN 'login_activated' ELSE 'login_deactivated' END,
        concat('Login ', NEW.system_name, ' ', CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END),
        jsonb_build_object('login_id', NEW.id));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_employee_timeline_event(_emp_id, 'login_removed',
      concat('Login removed: ', OLD.system_name), jsonb_build_object('login_id', OLD.id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_employee_logins_timeline ON public.employee_logins;
CREATE TRIGGER trg_employee_logins_timeline AFTER INSERT OR UPDATE OR DELETE ON public.employee_logins
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_employee_login();

CREATE OR REPLACE FUNCTION public.trg_log_pto_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _emp_id uuid;
BEGIN
  SELECT id INTO _emp_id FROM public.employees
   WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) LIMIT 1;
  IF _emp_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(_emp_id, 'pto_requested',
      concat('PTO requested: ', NEW.pto_type, ' ', NEW.start_date::text, ' – ', NEW.end_date::text,
             ' (', NEW.hours, 'h, ', NEW.status, ')'),
      jsonb_build_object('pto_id', NEW.id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_employee_timeline_event(_emp_id, concat('pto_', NEW.status::text),
      concat('PTO ', NEW.start_date::text, ' – ', NEW.end_date::text, ': ', OLD.status, ' → ', NEW.status),
      jsonb_build_object('pto_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_pto_requests_timeline ON public.pto_requests;
CREATE TRIGGER trg_pto_requests_timeline AFTER INSERT OR UPDATE ON public.pto_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_pto_request();

CREATE OR REPLACE FUNCTION public.trg_log_evaluation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _emp_id uuid;
BEGIN
  SELECT employee_id INTO _emp_id FROM public.evaluation_staff
   WHERE id = COALESCE(NEW.staff_id, OLD.staff_id) LIMIT 1;
  IF _emp_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_employee_timeline_event(_emp_id, 'evaluation_scheduled',
      concat('Evaluation scheduled: ', NEW.evaluation_type,
             CASE WHEN NEW.due_date IS NOT NULL THEN concat(' (due ', NEW.due_date::text, ')') ELSE '' END),
      jsonb_build_object('evaluation_id', NEW.id, 'type', NEW.evaluation_type, 'due_date', NEW.due_date));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.final_status IS DISTINCT FROM OLD.final_status THEN
      PERFORM public.log_employee_timeline_event(_emp_id, 'evaluation_status_changed',
        concat('Evaluation (', NEW.evaluation_type, '): ', OLD.final_status, ' → ', NEW.final_status),
        jsonb_build_object('evaluation_id', NEW.id, 'from', OLD.final_status, 'to', NEW.final_status));
    END IF;
    IF NEW.completed_at IS DISTINCT FROM OLD.completed_at AND NEW.completed_at IS NOT NULL THEN
      PERFORM public.log_employee_timeline_event(_emp_id, 'evaluation_completed',
        concat('Evaluation completed: ', NEW.evaluation_type),
        jsonb_build_object('evaluation_id', NEW.id, 'completed_at', NEW.completed_at));
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_evaluations_timeline ON public.evaluations;
CREATE TRIGGER trg_evaluations_timeline AFTER INSERT OR UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_evaluation();

-- BACKFILL --------------------------------------------------------------------
INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'pay_change_proposed',
       concat('Pay change proposed (', r.kind, ') — new rate ', r.new_rate),
       jsonb_build_object('pay_change_id', r.id, 'kind', r.kind, 'new_rate', r.new_rate),
       r.created_at
FROM public.employee_pay_changes r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'pay_change_id' = r.id::text);

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'device_assigned',
       concat('Device assigned: ', r.name, ' (', r.device_type, ')'),
       jsonb_build_object('device_id', r.id, 'serial', r.serial, 'status', r.status),
       r.assigned_at
FROM public.employee_devices r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'device_id' = r.id::text AND t.event_type = 'device_assigned');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'nfc_assigned',
       concat('NFC tag assigned (', r.tag_code, ')'),
       jsonb_build_object('tag_id', r.id, 'is_active', r.is_active),
       r.assigned_at
FROM public.employee_nfc_tags r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'tag_id' = r.id::text AND t.event_type = 'nfc_assigned');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'document_added',
       concat('Document added: ', r.name, ' (', r.doc_type, ')'),
       jsonb_build_object('document_id', r.id, 'status', r.status, 'required', r.required),
       r.created_at
FROM public.employee_documents_hr r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'document_id' = r.id::text AND t.event_type = 'document_added');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at, created_by, created_by_name)
SELECT r.employee_id, 'note_added',
       concat('Note added', CASE WHEN r.author_name IS NOT NULL THEN concat(' by ', r.author_name) ELSE '' END),
       jsonb_build_object('note_id', r.id, 'visibility', r.visibility),
       r.created_at, r.author_id, r.author_name
FROM public.employee_notes r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'note_id' = r.id::text);

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'case_opened',
       concat('HR case opened: ', r.title, ' (', r.case_type, ', ', r.priority, ')'),
       jsonb_build_object('case_id', r.id, 'priority', r.priority, 'case_type', r.case_type),
       r.opened_at
FROM public.employee_cases r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'case_id' = r.id::text AND t.event_type = 'case_opened');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'bonus_created',
       concat('Bonus created: $', r.amount, ' (', r.bonus_type, ')'),
       jsonb_build_object('bonus_id', r.id, 'amount', r.amount, 'status', r.status),
       r.created_at
FROM public.employee_bonuses r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'bonus_id' = r.id::text AND t.event_type = 'bonus_created');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT r.employee_id, 'timesheet_created',
       concat('Timesheet created for ', r.period_start::text, ' – ', r.period_end::text),
       jsonb_build_object('timesheet_id', r.id, 'status', r.status),
       r.created_at
FROM public.hours_timesheets r
WHERE r.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'timesheet_id' = r.id::text AND t.event_type = 'timesheet_created');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT e.id, 'login_assigned',
       concat('Login access granted: ', el.system_name),
       jsonb_build_object('login_id', el.id, 'system', el.system_name, 'category', el.system_category),
       el.created_at
FROM public.employee_logins el
JOIN public.employees e ON e.user_id = el.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'login_id' = el.id::text AND t.event_type = 'login_assigned');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT e.id, 'pto_requested',
       concat('PTO requested: ', p.pto_type, ' ', p.start_date::text, ' – ', p.end_date::text,
              ' (', p.hours, 'h, ', p.status, ')'),
       jsonb_build_object('pto_id', p.id, 'status', p.status),
       p.created_at
FROM public.pto_requests p
JOIN public.employees e ON e.user_id = p.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'pto_id' = p.id::text AND t.event_type = 'pto_requested');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT es.employee_id, 'evaluation_scheduled',
       concat('Evaluation scheduled: ', ev.evaluation_type,
              CASE WHEN ev.due_date IS NOT NULL THEN concat(' (due ', ev.due_date::text, ')') ELSE '' END),
       jsonb_build_object('evaluation_id', ev.id, 'type', ev.evaluation_type, 'due_date', ev.due_date),
       ev.created_at
FROM public.evaluations ev
JOIN public.evaluation_staff es ON es.id = ev.staff_id
WHERE es.employee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'evaluation_id' = ev.id::text AND t.event_type = 'evaluation_scheduled');

INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at)
SELECT es.employee_id, 'evaluation_completed',
       concat('Evaluation completed: ', ev.evaluation_type),
       jsonb_build_object('evaluation_id', ev.id, 'completed_at', ev.completed_at),
       ev.completed_at
FROM public.evaluations ev
JOIN public.evaluation_staff es ON es.id = ev.staff_id
WHERE es.employee_id IS NOT NULL AND ev.completed_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.employee_timeline t
                  WHERE t.metadata->>'evaluation_id' = ev.id::text AND t.event_type = 'evaluation_completed');
