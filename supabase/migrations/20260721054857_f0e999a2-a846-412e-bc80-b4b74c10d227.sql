
CREATE OR REPLACE FUNCTION public.rbt_notify_support_needed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _step_title text; _trainer_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.support_needed = NEW.support_needed THEN RETURN NEW; END IF;
  IF NEW.support_needed IS DISTINCT FROM true THEN RETURN NEW; END IF;

  SELECT title INTO _step_title
    FROM public.rbt_pathway_steps WHERE id = NEW.pathway_step_id;

  FOR _trainer_id IN
    SELECT trainer_user_id FROM public.rbt_trainee_assignments
     WHERE trainee_user_id = NEW.employee_id AND active
  LOOP
    INSERT INTO public.user_notifications
      (user_id, kind, title, body, category, link, dedupe_key, event_key)
    VALUES
      (_trainer_id,
       'rbt_training',
       'Support needed',
       COALESCE(_step_title,'A trainee needs support') || ' — trainee flagged support needed.',
       'action',
       '/bcba/trainees?traineeId=' || NEW.employee_id::text,
       'rbt_support_needed:' || NEW.id::text,
       'rbt.support_needed')
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rbt_mark_retention_overdue()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c integer := 0;
BEGIN
  WITH updated AS (
    UPDATE public.rbt_retention_checkins
       SET status = 'overdue', updated_at = now()
     WHERE status = 'due' AND due_at < now()
     RETURNING id, trainee_user_id, owner_user_id
  ), notified AS (
    INSERT INTO public.user_notifications
      (user_id, kind, title, body, category, link, dedupe_key, event_key)
    SELECT COALESCE(u.owner_user_id, ta.trainer_user_id),
      'rbt_training',
      'Retention check-in overdue',
      'Two-week retention check-in is overdue for a trainee.',
      'action',
      '/bcba/trainees?checkinId=' || u.id::text,
      'rbt_retention_overdue:' || u.id::text,
      'rbt.retention_overdue'
      FROM updated u
      LEFT JOIN public.rbt_trainee_assignments ta
        ON ta.trainee_user_id = u.trainee_user_id AND ta.active
       AND ta.trainer_kind = 'floater_lead_rbt'
     WHERE COALESCE(u.owner_user_id, ta.trainer_user_id) IS NOT NULL
     ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
     RETURNING 1
  )
  SELECT COUNT(*) INTO _c FROM notified;
  RETURN _c;
END;
$$;
