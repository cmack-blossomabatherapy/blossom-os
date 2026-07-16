
-- Notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  task_id UUID,
  task_source TEXT,
  read_at TIMESTAMPTZ,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_dedupe_idx
  ON public.user_notifications(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON public.user_notifications(user_id) WHERE read_at IS NULL;

GRANT SELECT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications read"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own notifications update"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete"
  ON public.user_notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Trigger for user_tasks (uuid assignee)
CREATE OR REPLACE FUNCTION public.notify_user_task_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target UUID;
  actor UUID;
  due_label TEXT;
BEGIN
  target := NEW.assignee_id;
  actor := COALESCE(NEW.assigned_by_id, auth.uid());
  IF target IS NULL OR target = actor THEN
    RETURN NEW;
  END IF;
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

DROP TRIGGER IF EXISTS trg_notify_user_task_assignment ON public.user_tasks;
CREATE TRIGGER trg_notify_user_task_assignment
  AFTER INSERT OR UPDATE OF assignee_id ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_task_assignment();

-- Trigger for intake_tasks (owner text → resolve via profile display_name)
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

DROP TRIGGER IF EXISTS trg_notify_intake_task_assignment ON public.intake_tasks;
CREATE TRIGGER trg_notify_intake_task_assignment
  AFTER INSERT OR UPDATE OF owner ON public.intake_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_intake_task_assignment();

-- Due-date reminders (idempotent via dedupe_key)
CREATE OR REPLACE FUNCTION public.create_task_due_reminders()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today DATE := (now() AT TIME ZONE 'America/New_York')::date;
  tomorrow DATE := today + 1;
  inserted INTEGER := 0;
BEGIN
  -- user_tasks: due today
  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT ut.assignee_id, 'task_due_today', 'Task due today',
           COALESCE(ut.title,'Untitled task'),
           '/tasks?taskId=' || ut.id::text, ut.id, 'user_tasks',
           'due_today:user_tasks:' || ut.id::text || ':' || today::text
      FROM public.user_tasks ut
     WHERE ut.assignee_id IS NOT NULL
       AND ut.status <> 'done'
       AND (ut.due_at AT TIME ZONE 'America/New_York')::date = today
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  -- user_tasks: due tomorrow
  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT ut.assignee_id, 'task_due_tomorrow', 'Task due tomorrow',
           COALESCE(ut.title,'Untitled task'),
           '/tasks?taskId=' || ut.id::text, ut.id, 'user_tasks',
           'due_tomorrow:user_tasks:' || ut.id::text || ':' || today::text
      FROM public.user_tasks ut
     WHERE ut.assignee_id IS NOT NULL
       AND ut.status <> 'done'
       AND (ut.due_at AT TIME ZONE 'America/New_York')::date = tomorrow
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  -- intake_tasks: due today (resolve owner → profile)
  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT p.user_id, 'task_due_today', 'Task due today',
           COALESCE(it.title,'Untitled task'),
           '/tasks?taskId=' || it.id::text, it.id, 'intake_tasks',
           'due_today:intake_tasks:' || it.id::text || ':' || today::text
      FROM public.intake_tasks it
      JOIN public.profiles p ON lower(p.display_name) = lower(btrim(it.owner))
     WHERE it.owner IS NOT NULL AND btrim(it.owner) <> ''
       AND it.status <> 'done'
       AND it.due_date = today
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  -- intake_tasks: due tomorrow
  WITH ins AS (
    INSERT INTO public.user_notifications(user_id, kind, title, body, link, task_id, task_source, dedupe_key)
    SELECT p.user_id, 'task_due_tomorrow', 'Task due tomorrow',
           COALESCE(it.title,'Untitled task'),
           '/tasks?taskId=' || it.id::text, it.id, 'intake_tasks',
           'due_tomorrow:intake_tasks:' || it.id::text || ':' || today::text
      FROM public.intake_tasks it
      JOIN public.profiles p ON lower(p.display_name) = lower(btrim(it.owner))
     WHERE it.owner IS NOT NULL AND btrim(it.owner) <> ''
       AND it.status <> 'done'
       AND it.due_date = tomorrow
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
    RETURNING 1)
  SELECT inserted + COUNT(*) INTO inserted FROM ins;

  RETURN inserted;
END; $$;

GRANT EXECUTE ON FUNCTION public.create_task_due_reminders() TO service_role, authenticated;
