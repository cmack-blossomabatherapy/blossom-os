
CREATE OR REPLACE FUNCTION public.emit_rbt_notification(p_event_key text, p_user_id uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_deep_link text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule public.rbt_notification_rules%ROWTYPE;
  v_event_id uuid;
  v_dedupe text;
  v_channel text;
  v_pref RECORD;
  v_master_paused boolean := false;
  v_title text;
  v_body text;
  v_link text;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_rule FROM public.rbt_notification_rules WHERE event_key = p_event_key AND active = true AND paused_at IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_dedupe := p_event_key || ':' || COALESCE(p_user_id::text,'*') || ':' || COALESCE(p_payload->>'dedupe','');
  IF EXISTS (
    SELECT 1 FROM public.rbt_notification_events
    WHERE dedupe_key = v_dedupe AND created_at > v_now - make_interval(mins => v_rule.dedupe_window_minutes)
  ) THEN
    INSERT INTO public.rbt_notification_audit(actor_id, action, rule_id, details)
      VALUES (auth.uid(), 'dedupe_skip', v_rule.id, jsonb_build_object('event_key',p_event_key,'user',p_user_id));
    RETURN NULL;
  END IF;

  -- Master pause: a wildcard preference row (event_key='__all__', channel='__all__', enabled=false)
  -- suppresses every non-required channel. Required rules always deliver.
  IF NOT v_rule.required AND p_user_id IS NOT NULL THEN
    SELECT enabled = false INTO v_master_paused
    FROM public.rbt_notification_preferences
    WHERE user_id = p_user_id AND event_key = '__all__' AND channel = '__all__';
    v_master_paused := COALESCE(v_master_paused, false);
  END IF;

  INSERT INTO public.rbt_notification_events(event_key, target_user_id, payload, deep_link, dedupe_key, processed_at)
    VALUES (p_event_key, p_user_id, COALESCE(p_payload,'{}'::jsonb), p_deep_link, v_dedupe, v_now)
    RETURNING id INTO v_event_id;

  v_title := v_rule.title_template;
  v_body := v_rule.body_template;
  v_link := COALESCE(p_deep_link, v_rule.deep_link_template);

  FOREACH v_channel IN ARRAY v_rule.channels LOOP
    IF v_master_paused THEN
      INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','master_pause'));
      CONTINUE;
    END IF;

    IF NOT v_rule.required AND p_user_id IS NOT NULL THEN
      SELECT * INTO v_pref FROM public.rbt_notification_preferences
        WHERE user_id = p_user_id AND event_key = p_event_key AND channel = v_channel;
      IF FOUND AND v_pref.enabled = false THEN
        INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
          VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','user_preference'));
        CONTINUE;
      END IF;
      IF v_rule.respect_quiet_hours AND v_pref.quiet_hours_start IS NOT NULL AND v_pref.quiet_hours_end IS NOT NULL THEN
        IF (v_now::time BETWEEN v_pref.quiet_hours_start AND v_pref.quiet_hours_end)
           OR (v_pref.quiet_hours_start > v_pref.quiet_hours_end AND
               (v_now::time >= v_pref.quiet_hours_start OR v_now::time <= v_pref.quiet_hours_end)) THEN
          INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
            VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','quiet_hours'));
          CONTINUE;
        END IF;
      END IF;
    END IF;

    IF v_channel = 'in_app' AND p_user_id IS NOT NULL THEN
      INSERT INTO public.user_notifications(user_id, kind, title, body, link, dedupe_key, category, action_label, event_key, rule_id)
        VALUES (p_user_id, p_event_key, v_title, v_body, v_link, v_dedupe, v_rule.category, v_rule.action_label, p_event_key, v_rule.id);
      INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'sent');
    ELSE
      INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'pending', jsonb_build_object('title',v_title,'body',v_body,'link',v_link));
    END IF;
  END LOOP;

  INSERT INTO public.rbt_notification_audit(actor_id, action, rule_id, event_id, details)
    VALUES (auth.uid(), 'emit', v_rule.id, v_event_id, jsonb_build_object('event_key',p_event_key,'user',p_user_id,'master_paused',v_master_paused));

  RETURN v_event_id;
END;
$function$;
