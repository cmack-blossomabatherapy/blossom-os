
-- Task assignment (user_tasks) — drawer open, no filter change.
CREATE OR REPLACE FUNCTION public.notify_user_task_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target UUID;
  actor UUID;
  due_label TEXT;
BEGIN
  target := NEW.assignee_id;
  actor := COALESCE(NEW.assigned_by_id, auth.uid());
  IF target IS NULL OR target = actor THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.assignee_id IS NOT DISTINCT FROM NEW.assignee_id THEN
    RETURN NEW;
  END IF;
  due_label := CASE WHEN NEW.due_at IS NOT NULL
    THEN ' · Due ' || to_char(NEW.due_at AT TIME ZONE 'UTC', 'Mon DD') ELSE '' END;
  INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
  VALUES (target, 'task_assigned', 'New task assigned to you',
          COALESCE(NEW.title,'Untitled task') || due_label,
          '/tasks?taskId=' || NEW.id::text, NEW.id, 'user_tasks',
          'assign:user_tasks:' || NEW.id::text)
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  RETURN NEW;
END; $$;

-- Task assignment (intake_tasks) — drawer open, no filter change.
CREATE OR REPLACE FUNCTION public.notify_intake_task_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target UUID;
  actor UUID;
  due_label TEXT;
BEGIN
  IF NEW.owner IS NULL OR btrim(NEW.owner) = '' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.owner IS NOT DISTINCT FROM NEW.owner THEN
    RETURN NEW;
  END IF;
  SELECT p.user_id INTO target FROM public.profiles p
   WHERE lower(p.display_name) = lower(btrim(NEW.owner)) LIMIT 1;
  IF target IS NULL THEN RETURN NEW; END IF;
  actor := COALESCE(NEW.created_by, auth.uid());
  IF target = actor THEN RETURN NEW; END IF;
  due_label := CASE WHEN NEW.due_date IS NOT NULL
    THEN ' · Due ' || to_char(NEW.due_date, 'Mon DD') ELSE '' END;
  INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
  VALUES (target, 'task_assigned', 'New task assigned to you',
          COALESCE(NEW.title,'Untitled task') || due_label,
          '/tasks?taskId=' || NEW.id::text, NEW.id, 'intake_tasks',
          'assign:intake_tasks:' || NEW.id::text || ':' || lower(btrim(NEW.owner)))
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  RETURN NEW;
END; $$;

-- Due reminders — task_due_today includes ?filter=today so the list matches.
CREATE OR REPLACE FUNCTION public.create_task_due_reminders()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today DATE := (now() AT TIME ZONE 'America/New_York')::date;
  tomorrow DATE := today + 1;
  inserted INTEGER := 0;
BEGIN
  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT ut.assignee_id, 'task_due_today', 'Task due today',
           COALESCE(ut.title,'Untitled task'),
           '/tasks?taskId=' || ut.id::text || '&filter=today',
           ut.id, 'user_tasks',
           'due_today:user_tasks:' || ut.id::text || ':' || today::text
      FROM public.user_tasks ut
     WHERE ut.assignee_id IS NOT NULL
       AND ut.status::text NOT IN ('done','completed','cancelled')
       AND (ut.due_at AT TIME ZONE 'America/New_York')::date = today
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT ut.assignee_id, 'task_due_tomorrow', 'Task due tomorrow',
           COALESCE(ut.title,'Untitled task'),
           '/tasks?taskId=' || ut.id::text,
           ut.id, 'user_tasks',
           'due_tomorrow:user_tasks:' || ut.id::text || ':' || today::text
      FROM public.user_tasks ut
     WHERE ut.assignee_id IS NOT NULL
       AND ut.status::text NOT IN ('done','completed','cancelled')
       AND (ut.due_at AT TIME ZONE 'America/New_York')::date = tomorrow
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT p.user_id, 'task_due_today', 'Task due today',
           COALESCE(it.title,'Untitled task'),
           '/tasks?taskId=' || it.id::text || '&filter=today',
           it.id, 'intake_tasks',
           'due_today:intake_tasks:' || it.id::text || ':' || today::text
      FROM public.intake_tasks it
      JOIN public.profiles p ON lower(p.display_name) = lower(btrim(it.owner))
     WHERE it.owner IS NOT NULL AND btrim(it.owner) <> ''
       AND it.status::text NOT IN ('Completed')
       AND it.due_date = today
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT p.user_id, 'task_due_tomorrow', 'Task due tomorrow',
           COALESCE(it.title,'Untitled task'),
           '/tasks?taskId=' || it.id::text,
           it.id, 'intake_tasks',
           'due_tomorrow:intake_tasks:' || it.id::text || ':' || today::text
      FROM public.intake_tasks it
      JOIN public.profiles p ON lower(p.display_name) = lower(btrim(it.owner))
     WHERE it.owner IS NOT NULL AND btrim(it.owner) <> ''
       AND it.status::text NOT IN ('Completed')
       AND it.due_date = tomorrow
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  RETURN inserted;
END; $$;

-- After-hours AI call fanout — link now pre-filters the board.
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
  IF v_dept = 'intake' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (p.department ILIKE '%intake%'
        OR ur.role IN ('intake','intake_lead','intake_coordinator'));
  ELSIF v_dept = 'scheduling' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (p.department ILIKE '%scheduling%'
        OR ur.role IN ('scheduling','scheduling_lead','scheduling_coordinator','staffing','staffing_lead','staffing_coordinator'));
  ELSIF v_dept = 'hr' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (p.department ILIKE '%human resources%'
        OR p.department ILIKE 'hr%'
        OR ur.role IN ('hr','hr_admin','hr_manager','hr_lead','hr_admin_assistant','payroll_admin','payroll_lead'));
  ELSIF v_dept = 'state_director' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND ur.role IN ('state_director','assistant_state_director')
      AND (p_state IS NULL OR p.state IS NULL OR lower(p.state) = lower(p_state));
  ELSIF v_dept = 'urgent' THEN
    SELECT array_agg(DISTINCT p.user_id) INTO v_targets
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id IS NOT NULL
      AND (p.department ILIKE '%intake%'
        OR ur.role IN (
          'intake','intake_lead','intake_coordinator',
          'state_director','assistant_state_director',
          'operations_leadership','director_of_operations','operations_manager','coo','executive_leadership','ceo'
        ));
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
  -- Widen the range so the target call is always visible; pre-select the
  -- department chip; land urgent notifications on the Urgent view.
  v_link := '/phone/ai-calls?call=' || p_call_id::text
    || '&range=all&dept=' || v_dept
    || CASE WHEN p_urgent THEN '&view=urgent' ELSE '&view=open' END;
  v_dedupe := 'ah_call:' || p_call_id::text || ':' || v_dept;

  INSERT INTO public.user_notifications (user_id, kind, title, body, link, dedupe_key)
  SELECT uid, CASE WHEN p_urgent THEN 'ah_call_urgent' ELSE 'ah_call' END, v_title, v_body, v_link, v_dedupe
  FROM unnest(v_targets) AS uid
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
