
-- Fan out an after-hours AI call to the users of the routed department.
CREATE OR REPLACE FUNCTION public.notify_after_hours_call_fanout(
  p_call_id uuid,
  p_department text,
  p_state text,
  p_caller_name text,
  p_reason text,
  p_urgent boolean
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_targets uuid[];
  v_dept text := lower(coalesce(p_department, 'intake'));
  v_title text;
  v_body text;
  v_link text;
  v_dedupe text;
  v_count integer := 0;
BEGIN
  -- Resolve target user_ids based on department.
  IF v_dept = 'intake' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (
        p.department ILIKE '%intake%'
        OR ur.role IN ('intake','intake_lead','intake_coordinator')
      );

  ELSIF v_dept = 'scheduling' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (
        p.department ILIKE '%scheduling%'
        OR ur.role IN ('scheduling','scheduling_lead','scheduling_coordinator','staffing','staffing_lead','staffing_coordinator')
      );

  ELSIF v_dept = 'hr' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (
        p.department ILIKE '%human resources%'
        OR p.department ILIKE 'hr%'
        OR ur.role IN ('hr','hr_admin','hr_manager','hr_lead','hr_admin_assistant','payroll_admin','payroll_lead')
      );

  ELSIF v_dept = 'state_director' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND ur.role IN ('state_director','assistant_state_director')
      AND (
        p_state IS NULL
        OR p.state IS NULL
        OR lower(p.state) = lower(p_state)
      );

  ELSIF v_dept = 'urgent' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (
        p.department ILIKE '%intake%'
        OR ur.role IN (
          'intake','intake_lead','intake_coordinator',
          'state_director','assistant_state_director',
          'operations_leadership','director_of_operations','operations_manager','coo','executive_leadership','ceo'
        )
      );
  END IF;

  IF v_targets IS NULL OR array_length(v_targets, 1) IS NULL THEN
    RETURN 0;
  END IF;

  v_title := CASE
    WHEN p_urgent THEN 'Urgent after-hours call'
    ELSE 'New after-hours call — ' || initcap(replace(v_dept, '_', ' '))
  END;
  v_body := coalesce(nullif(trim(p_caller_name), ''), 'Unknown caller')
    || CASE WHEN p_state IS NOT NULL THEN ' · ' || p_state ELSE '' END
    || CASE WHEN p_reason IS NOT NULL THEN ' · ' || left(p_reason, 140) ELSE '' END;
  v_link := '/phone/ai-calls?call=' || p_call_id::text;
  v_dedupe := 'ah_call:' || p_call_id::text || ':' || v_dept;

  INSERT INTO public.user_notifications (user_id, kind, title, body, link, dedupe_key)
  SELECT uid, CASE WHEN p_urgent THEN 'ah_call_urgent' ELSE 'ah_call' END, v_title, v_body, v_link, v_dedupe
  FROM unnest(v_targets) AS uid
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_after_hours_call_fanout(uuid, text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_after_hours_call_fanout(uuid, text, text, text, text, boolean) TO service_role;

-- Trigger wrapper on phone_ai_calls.
CREATE OR REPLACE FUNCTION public.tg_notify_after_hours_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dept text;
  v_urgent boolean;
BEGIN
  v_dept := coalesce(NEW.department_to_notify, 'intake');
  v_urgent := coalesce(NEW.emergency_flag, false)
    OR lower(coalesce(NEW.urgency_level, '')) = 'high'
    OR v_dept = 'urgent';

  -- Only fan out on insert, or when department_to_notify meaningfully changes.
  IF TG_OP = 'UPDATE' THEN
    IF coalesce(OLD.department_to_notify, '') = coalesce(NEW.department_to_notify, '') THEN
      RETURN NEW;
    END IF;
  END IF;

  PERFORM public.notify_after_hours_call_fanout(
    NEW.id,
    v_dept,
    NEW.state,
    NEW.caller_name,
    coalesce(NEW.reason_for_call, NEW.call_summary),
    v_urgent
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_after_hours_call_ins ON public.phone_ai_calls;
CREATE TRIGGER notify_after_hours_call_ins
  AFTER INSERT ON public.phone_ai_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_notify_after_hours_call();

DROP TRIGGER IF EXISTS notify_after_hours_call_upd ON public.phone_ai_calls;
CREATE TRIGGER notify_after_hours_call_upd
  AFTER UPDATE OF department_to_notify ON public.phone_ai_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_notify_after_hours_call();
