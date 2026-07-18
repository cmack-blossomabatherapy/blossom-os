
INSERT INTO public.bcba_notification_rules
  (event_key, domain, category, title_template, body_template, action_label, deep_link_template, channels, required, sensitive, dedupe_window_minutes)
VALUES
  ('bcba.productivity.discrepancy_created','productivity','update','Discrepancy opened','A new productivity discrepancy was opened on your metrics.','Review discrepancy','/bcba/productivity',ARRAY['in_app'],false,false,5),
  ('bcba.productivity.discrepancy_reopened','productivity','action_required','Discrepancy reopened','A previously resolved discrepancy has been reopened.','Review discrepancy','/bcba/productivity',ARRAY['in_app'],false,false,5),
  ('bcba.productivity.discrepancy_resolved','productivity','update','Discrepancy resolved','A discrepancy on your metrics was marked resolved.','View resolution','/bcba/productivity',ARRAY['in_app'],false,false,5)
ON CONFLICT (event_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.bcba_prod_disc_notify_on_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_disc public.bcba_productivity_discrepancies%ROWTYPE;
  v_event_key text;
  v_actor_name text;
  v_payload jsonb;
  v_link text;
BEGIN
  SELECT * INTO v_disc FROM public.bcba_productivity_discrepancies WHERE id = NEW.discrepancy_id;
  IF NOT FOUND OR v_disc.bcba_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.event_type = 'created' THEN
    v_event_key := 'bcba.productivity.discrepancy_created';
  ELSIF NEW.event_type = 'reopened' THEN
    v_event_key := 'bcba.productivity.discrepancy_reopened';
  ELSIF NEW.event_type = 'resolved' THEN
    v_event_key := 'bcba.productivity.discrepancy_resolved';
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email, 'System')
    INTO v_actor_name
  FROM public.profiles
  WHERE id = NEW.actor_id;

  v_link := '/bcba/productivity?tab=discrepancies&discrepancy=' || v_disc.id::text;

  v_payload := jsonb_build_object(
    'discrepancy_id', v_disc.id,
    'metric_key', v_disc.metric_key,
    'status', v_disc.status,
    'event_id', NEW.id,
    'event_type', NEW.event_type,
    'from_status', NEW.from_status,
    'to_status', NEW.to_status,
    'actor_id', NEW.actor_id,
    'actor_name', COALESCE(v_actor_name, 'System'),
    'comment', NEW.comment,
    'event_at', NEW.created_at,
    'dedupe', NEW.id::text
  );

  PERFORM public.emit_bcba_notification(v_event_key, v_disc.bcba_id, v_payload, v_link);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS bcba_prod_disc_notify_on_event_ins ON public.bcba_productivity_discrepancy_events;
CREATE TRIGGER bcba_prod_disc_notify_on_event_ins
AFTER INSERT ON public.bcba_productivity_discrepancy_events
FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_notify_on_event();
