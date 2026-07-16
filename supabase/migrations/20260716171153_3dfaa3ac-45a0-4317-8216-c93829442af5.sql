
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
           '/tasks?taskId=' || ut.id::text, ut.id, 'user_tasks',
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
           '/tasks?taskId=' || ut.id::text, ut.id, 'user_tasks',
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
           '/tasks?taskId=' || it.id::text, it.id, 'intake_tasks',
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
           '/tasks?taskId=' || it.id::text, it.id, 'intake_tasks',
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

-- Also fix user_task trigger status guard (not strictly needed but cleaner)
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
