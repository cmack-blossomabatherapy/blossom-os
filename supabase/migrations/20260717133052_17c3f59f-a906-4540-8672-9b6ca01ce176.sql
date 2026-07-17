
-- CATEGORY + LABEL on user_notifications for inbox tabs
ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS action_label text,
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS rule_id uuid;

-- RULES
CREATE TABLE IF NOT EXISTS public.rbt_notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  domain text NOT NULL,                       -- preboarding|training|staffing|first_90|active|growth
  category text NOT NULL DEFAULT 'update',    -- action_required|due_soon|update|recognition|completed
  title_template text NOT NULL,
  body_template text NOT NULL,
  action_label text,
  deep_link_template text,                    -- e.g. /rbt/app/preboarding
  channels text[] NOT NULL DEFAULT ARRAY['in_app'],   -- in_app|email|sms|task|leadership_alert
  required boolean NOT NULL DEFAULT false,    -- cannot be disabled by employees
  respect_quiet_hours boolean NOT NULL DEFAULT true,
  dedupe_window_minutes int NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  paused_at timestamptz,
  paused_by uuid,
  paused_reason text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rbt_notification_rules TO authenticated;
GRANT ALL ON public.rbt_notification_rules TO service_role;
ALTER TABLE public.rbt_notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules_read_all_auth" ON public.rbt_notification_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "rules_admin_manage" ON public.rbt_notification_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr_admin') OR public.has_role(auth.uid(),'operations_leadership'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr_admin') OR public.has_role(auth.uid(),'operations_leadership'));

-- EVENTS
CREATE TABLE IF NOT EXISTS public.rbt_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  target_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  deep_link text,
  dedupe_key text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rbt_notif_events_dedupe_idx ON public.rbt_notification_events(dedupe_key);
GRANT SELECT ON public.rbt_notification_events TO authenticated;
GRANT ALL ON public.rbt_notification_events TO service_role;
ALTER TABLE public.rbt_notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_admin_read" ON public.rbt_notification_events FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr_admin') OR public.has_role(auth.uid(),'operations_leadership')
);

-- DELIVERIES
CREATE TABLE IF NOT EXISTS public.rbt_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.rbt_notification_events(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.rbt_notification_rules(id) ON DELETE SET NULL,
  user_id uuid,
  channel text NOT NULL,        -- in_app|email|sms|task|leadership_alert
  status text NOT NULL DEFAULT 'pending', -- pending|sent|failed|suppressed
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rbt_notif_deliveries_user_idx ON public.rbt_notification_deliveries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rbt_notif_deliveries_status_idx ON public.rbt_notification_deliveries(status);
GRANT SELECT ON public.rbt_notification_deliveries TO authenticated;
GRANT ALL ON public.rbt_notification_deliveries TO service_role;
ALTER TABLE public.rbt_notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliv_self_read" ON public.rbt_notification_deliveries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "deliv_admin_read" ON public.rbt_notification_deliveries FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr_admin') OR public.has_role(auth.uid(),'operations_leadership')
);

-- PREFERENCES (employee opt-outs; required rules ignore this)
CREATE TABLE IF NOT EXISTS public.rbt_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  channel text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_key, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_notification_preferences TO authenticated;
GRANT ALL ON public.rbt_notification_preferences TO service_role;
ALTER TABLE public.rbt_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_self" ON public.rbt_notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "prefs_admin_read" ON public.rbt_notification_preferences FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr_admin')
);

-- AUDIT
CREATE TABLE IF NOT EXISTS public.rbt_notification_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  rule_id uuid,
  event_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rbt_notification_audit TO authenticated;
GRANT ALL ON public.rbt_notification_audit TO service_role;
ALTER TABLE public.rbt_notification_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON public.rbt_notification_audit FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr_admin') OR public.has_role(auth.uid(),'operations_leadership')
);
CREATE POLICY "audit_service_write" ON public.rbt_notification_audit FOR INSERT TO authenticated WITH CHECK (true);

-- Rule updated_at trigger
CREATE OR REPLACE FUNCTION public.rbt_notif_rules_touch() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
DROP TRIGGER IF EXISTS rbt_notif_rules_touch ON public.rbt_notification_rules;
CREATE TRIGGER rbt_notif_rules_touch BEFORE UPDATE ON public.rbt_notification_rules
FOR EACH ROW EXECUTE FUNCTION public.rbt_notif_rules_touch();

-- DISPATCHER
CREATE OR REPLACE FUNCTION public.emit_rbt_notification(
  p_event_key text,
  p_user_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_deep_link text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule public.rbt_notification_rules%ROWTYPE;
  v_event_id uuid;
  v_dedupe text;
  v_channel text;
  v_pref RECORD;
  v_title text;
  v_body text;
  v_link text;
  v_now timestamptz := now();
  v_quiet_ok boolean := true;
BEGIN
  SELECT * INTO v_rule FROM public.rbt_notification_rules WHERE event_key = p_event_key AND active = true AND paused_at IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_dedupe := p_event_key || ':' || COALESCE(p_user_id::text,'*') || ':' || COALESCE(p_payload->>'dedupe','');
  -- dedupe window
  IF EXISTS (
    SELECT 1 FROM public.rbt_notification_events
    WHERE dedupe_key = v_dedupe AND created_at > v_now - make_interval(mins => v_rule.dedupe_window_minutes)
  ) THEN
    INSERT INTO public.rbt_notification_audit(actor_id, action, rule_id, details)
      VALUES (auth.uid(), 'dedupe_skip', v_rule.id, jsonb_build_object('event_key',p_event_key,'user',p_user_id));
    RETURN NULL;
  END IF;

  INSERT INTO public.rbt_notification_events(event_key, target_user_id, payload, deep_link, dedupe_key, processed_at)
    VALUES (p_event_key, p_user_id, COALESCE(p_payload,'{}'::jsonb), p_deep_link, v_dedupe, v_now)
    RETURNING id INTO v_event_id;

  v_title := v_rule.title_template;
  v_body := v_rule.body_template;
  v_link := COALESCE(p_deep_link, v_rule.deep_link_template);

  FOREACH v_channel IN ARRAY v_rule.channels LOOP
    -- respect employee preference for non-required
    IF NOT v_rule.required AND p_user_id IS NOT NULL THEN
      SELECT * INTO v_pref FROM public.rbt_notification_preferences
        WHERE user_id = p_user_id AND event_key = p_event_key AND channel = v_channel;
      IF FOUND AND v_pref.enabled = false THEN
        INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
          VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','user_preference'));
        CONTINUE;
      END IF;
      -- quiet hours
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
      -- email/sms/task/leadership_alert: queued as pending for downstream workers
      INSERT INTO public.rbt_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'pending', jsonb_build_object('title',v_title,'body',v_body,'link',v_link));
    END IF;
  END LOOP;

  INSERT INTO public.rbt_notification_audit(actor_id, action, rule_id, event_id, details)
    VALUES (auth.uid(), 'emit', v_rule.id, v_event_id, jsonb_build_object('event_key',p_event_key,'user',p_user_id));

  RETURN v_event_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.emit_rbt_notification(text,uuid,jsonb,text) TO authenticated, service_role;
