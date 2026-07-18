
CREATE TABLE IF NOT EXISTS public.bcba_notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  domain text NOT NULL,
  category text NOT NULL DEFAULT 'update',
  title_template text NOT NULL,
  body_template text NOT NULL,
  action_label text,
  deep_link_template text,
  channels text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  required boolean NOT NULL DEFAULT false,
  sensitive boolean NOT NULL DEFAULT false,
  respect_quiet_hours boolean NOT NULL DEFAULT true,
  dedupe_window_minutes integer NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  paused_at timestamptz,
  paused_by uuid,
  paused_reason text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_notification_rules TO authenticated;
GRANT ALL ON public.bcba_notification_rules TO service_role;
ALTER TABLE public.bcba_notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_rules_read_all_auth" ON public.bcba_notification_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "bcba_rules_admin_manage" ON public.bcba_notification_rules TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'hr_admin'::app_role) OR has_role(auth.uid(),'operations_leadership'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'hr_admin'::app_role) OR has_role(auth.uid(),'operations_leadership'::app_role));

CREATE OR REPLACE FUNCTION public.bcba_notif_rules_touch() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS
$fn$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;
DROP TRIGGER IF EXISTS bcba_notif_rules_touch ON public.bcba_notification_rules;
CREATE TRIGGER bcba_notif_rules_touch BEFORE UPDATE ON public.bcba_notification_rules FOR EACH ROW EXECUTE FUNCTION public.bcba_notif_rules_touch();

CREATE TABLE IF NOT EXISTS public.bcba_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  target_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  deep_link text,
  dedupe_key text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_notif_events_dedupe_idx ON public.bcba_notification_events(dedupe_key);
GRANT SELECT ON public.bcba_notification_events TO authenticated;
GRANT ALL ON public.bcba_notification_events TO service_role;
ALTER TABLE public.bcba_notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_events_admin_read" ON public.bcba_notification_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'hr_admin'::app_role) OR has_role(auth.uid(),'operations_leadership'::app_role));

CREATE TABLE IF NOT EXISTS public.bcba_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.bcba_notification_events(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.bcba_notification_rules(id) ON DELETE SET NULL,
  user_id uuid,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_notif_deliveries_status_idx ON public.bcba_notification_deliveries(status);
CREATE INDEX IF NOT EXISTS bcba_notif_deliveries_user_idx ON public.bcba_notification_deliveries(user_id, created_at DESC);
GRANT SELECT ON public.bcba_notification_deliveries TO authenticated;
GRANT ALL ON public.bcba_notification_deliveries TO service_role;
ALTER TABLE public.bcba_notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_deliv_self_read" ON public.bcba_notification_deliveries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "bcba_deliv_admin_read" ON public.bcba_notification_deliveries FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'hr_admin'::app_role) OR has_role(auth.uid(),'operations_leadership'::app_role));

CREATE TABLE IF NOT EXISTS public.bcba_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  channel text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_key, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_notification_preferences TO authenticated;
GRANT ALL ON public.bcba_notification_preferences TO service_role;
ALTER TABLE public.bcba_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_prefs_self" ON public.bcba_notification_preferences TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "bcba_prefs_admin_read" ON public.bcba_notification_preferences FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'hr_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.bcba_notification_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  rule_id uuid,
  event_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_notification_audit TO authenticated;
GRANT ALL ON public.bcba_notification_audit TO service_role;
ALTER TABLE public.bcba_notification_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bcba_audit_admin_read" ON public.bcba_notification_audit FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'hr_admin'::app_role) OR has_role(auth.uid(),'operations_leadership'::app_role));
CREATE POLICY "bcba_audit_service_write" ON public.bcba_notification_audit FOR INSERT TO service_role
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE OR REPLACE FUNCTION public.emit_bcba_notification(
  p_event_key text, p_user_id uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_deep_link text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $fn$
DECLARE
  v_rule public.bcba_notification_rules%ROWTYPE;
  v_event_id uuid;
  v_dedupe text;
  v_channel text;
  v_pref RECORD;
  v_master_paused boolean := false;
  v_title text;
  v_body text;
  v_link text;
  v_now timestamptz := now();
  v_stale boolean;
BEGIN
  SELECT * INTO v_rule FROM public.bcba_notification_rules WHERE event_key = p_event_key AND active = true AND paused_at IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_stale := COALESCE((p_payload->>'stale')::boolean, false);
  IF v_stale THEN
    INSERT INTO public.bcba_notification_audit(actor_id, action, rule_id, details)
      VALUES (auth.uid(), 'stale_skip', v_rule.id, jsonb_build_object('event_key',p_event_key,'user',p_user_id));
    RETURN NULL;
  END IF;

  v_dedupe := p_event_key || ':' || COALESCE(p_user_id::text,'*') || ':' || COALESCE(p_payload->>'dedupe','');
  IF EXISTS (
    SELECT 1 FROM public.bcba_notification_events
    WHERE dedupe_key = v_dedupe AND created_at > v_now - make_interval(mins => v_rule.dedupe_window_minutes)
  ) THEN
    INSERT INTO public.bcba_notification_audit(actor_id, action, rule_id, details)
      VALUES (auth.uid(), 'dedupe_skip', v_rule.id, jsonb_build_object('event_key',p_event_key,'user',p_user_id));
    RETURN NULL;
  END IF;

  IF NOT v_rule.required AND p_user_id IS NOT NULL THEN
    SELECT enabled = false INTO v_master_paused
    FROM public.bcba_notification_preferences
    WHERE user_id = p_user_id AND event_key = '__all__' AND channel = '__all__';
    v_master_paused := COALESCE(v_master_paused, false);
  END IF;

  INSERT INTO public.bcba_notification_events(event_key, target_user_id, payload, deep_link, dedupe_key, processed_at)
    VALUES (p_event_key, p_user_id, COALESCE(p_payload,'{}'::jsonb), p_deep_link, v_dedupe, v_now)
    RETURNING id INTO v_event_id;

  v_title := v_rule.title_template;
  v_body := v_rule.body_template;
  v_link := COALESCE(p_deep_link, v_rule.deep_link_template);

  FOREACH v_channel IN ARRAY v_rule.channels LOOP
    IF v_rule.sensitive AND v_channel IN ('sms','email') THEN
      INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','sensitive_channel_blocked'));
      CONTINUE;
    END IF;

    IF v_master_paused THEN
      INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','master_pause'));
      CONTINUE;
    END IF;

    IF NOT v_rule.required AND p_user_id IS NOT NULL THEN
      SELECT * INTO v_pref FROM public.bcba_notification_preferences
        WHERE user_id = p_user_id AND event_key = p_event_key AND channel = v_channel;
      IF FOUND AND v_pref.enabled = false THEN
        INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
          VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','user_preference'));
        CONTINUE;
      END IF;
      IF v_rule.respect_quiet_hours AND v_pref.quiet_hours_start IS NOT NULL AND v_pref.quiet_hours_end IS NOT NULL THEN
        IF (v_now::time BETWEEN v_pref.quiet_hours_start AND v_pref.quiet_hours_end)
           OR (v_pref.quiet_hours_start > v_pref.quiet_hours_end AND
               (v_now::time >= v_pref.quiet_hours_start OR v_now::time <= v_pref.quiet_hours_end)) THEN
          INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
            VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'suppressed', jsonb_build_object('reason','quiet_hours'));
          CONTINUE;
        END IF;
      END IF;
    END IF;

    IF v_channel = 'in_app' AND p_user_id IS NOT NULL THEN
      INSERT INTO public.user_notifications(user_id, kind, title, body, link, dedupe_key, category, action_label, event_key, rule_id)
        VALUES (p_user_id, p_event_key, v_title, v_body, v_link, v_dedupe, v_rule.category, v_rule.action_label, p_event_key, v_rule.id)
        ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
      INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'sent');
    ELSIF v_channel = 'internal_task' AND p_user_id IS NOT NULL THEN
      INSERT INTO public.user_tasks(assignee_id, assigned_by_id, title, description, priority, related_record_type, related_record_id, related_url, due_at)
        VALUES (p_user_id, p_user_id, v_title, v_body, COALESCE((p_payload->>'priority')::user_task_priority,'medium'::user_task_priority), 'bcba_notification', v_event_id::text, v_link, NULLIF(p_payload->>'due_at','')::timestamptz);
      INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'sent');
    ELSE
      INSERT INTO public.bcba_notification_deliveries(event_id, rule_id, user_id, channel, status, metadata)
        VALUES (v_event_id, v_rule.id, p_user_id, v_channel, 'pending', jsonb_build_object('title',v_title,'body',v_body,'link',v_link));
    END IF;
  END LOOP;

  INSERT INTO public.bcba_notification_audit(actor_id, action, rule_id, event_id, details)
    VALUES (auth.uid(), 'emit', v_rule.id, v_event_id, jsonb_build_object('event_key',p_event_key,'user',p_user_id,'master_paused',v_master_paused));
  RETURN v_event_id;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.emit_bcba_notification(text, uuid, jsonb, text) TO authenticated, service_role;

INSERT INTO public.bcba_notification_rules
  (event_key, domain, category, title_template, body_template, action_label, deep_link_template, channels, required, sensitive, dedupe_window_minutes)
VALUES
  ('bcba.onboarding.credential_action','onboarding','action_required','Credential action needed','A credential item is waiting for you to complete.','Open onboarding','/bcba/onboarding',ARRAY['in_app','email','internal_task'],true,false,1440),
  ('bcba.onboarding.systems_setup','onboarding','action_required','Finish systems setup','Complete the required accounts and access setup.','Open setup','/bcba/onboarding',ARRAY['in_app','email','internal_task'],false,false,1440),
  ('bcba.onboarding.training_due','onboarding','due_soon','Onboarding training due','Assigned onboarding training is due soon.','Open academy','/bcba/academy',ARRAY['in_app','email'],false,false,1440),
  ('bcba.onboarding.caseload_assigned','onboarding','update','Initial caseload assigned','You have been assigned your initial caseload.','View caseload','/bcba/caseload',ARRAY['in_app','email'],false,false,60),
  ('bcba.onboarding.rbt_intro_due','onboarding','action_required','Introduce yourself to a new RBT','A new RBT is starting on your caseload. Send an introduction.','Open RBT','/bcba/my-rbts',ARRAY['in_app','email','internal_task'],false,false,720),
  ('bcba.caseload.case_assigned','caseload','update','New case assigned','A new client has been added to your caseload.','Open client','/bcba/caseload',ARRAY['in_app','email'],false,false,60),
  ('bcba.caseload.staffing_gap','caseload','action_required','Staffing gap on a client','A client on your caseload has an unfilled staffing gap.','View caseload','/bcba/caseload',ARRAY['in_app','email','internal_task','leadership_alert'],true,false,240),
  ('bcba.caseload.schedule_change','caseload','update','Schedule change','A schedule change was made on your caseload.','View schedule','/bcba/schedule',ARRAY['in_app'],false,false,60),
  ('bcba.caseload.repeated_cancellation','caseload','action_required','Repeated cancellations','A client has repeated cancellations. Review and act.','Open client','/bcba/caseload',ARRAY['in_app','email','internal_task'],false,false,720),
  ('bcba.caseload.underutilization','caseload','due_soon','Client underutilization','Service utilization is below target for a client.','View utilization','/bcba/parent-training',ARRAY['in_app','email'],false,false,1440),
  ('bcba.caseload.on_hold_update','caseload','update','On-hold status update','A client on your caseload had an on-hold status update.','Open client','/bcba/caseload',ARRAY['in_app'],false,false,240),
  ('bcba.rbt.new_starting','rbt','update','New RBT starting','A new RBT will start on your team soon.','Open RBTs','/bcba/my-rbts',ARRAY['in_app','email'],false,false,720),
  ('bcba.rbt.first_session_followup','rbt','action_required','First-session follow-up','Complete the first-session follow-up for an RBT.','Open RBT','/bcba/my-rbts',ARRAY['in_app','email','internal_task'],false,false,1440),
  ('bcba.rbt.support_request','rbt','action_required','RBT support request','An RBT submitted a support request that needs your attention.','Open request','/bcba/my-rbts',ARRAY['in_app','email','internal_task'],false,false,240),
  ('bcba.rbt.training_assigned','rbt','update','Training assigned to your RBT','A training was assigned to one of your RBTs.','View RBT','/bcba/my-rbts',ARRAY['in_app'],false,false,720),
  ('bcba.rbt.supervision_due','rbt','due_soon','Supervision due','An RBT supervision session is due.','Open supervision','/bcba/supervision',ARRAY['in_app','email','internal_task'],true,false,1440),
  ('bcba.rbt.performance_followup','rbt','action_required','Performance follow-up needed','An RBT needs a performance follow-up.','Open RBT','/bcba/my-rbts',ARRAY['in_app','email','internal_task'],false,false,720),
  ('bcba.clinical.assessment_assigned','clinical','update','Assessment assigned','A new assessment has been assigned to you.','Open assessments','/bcba/assessments',ARRAY['in_app','internal_task'],false,true,60),
  ('bcba.clinical.treatment_plan_due','clinical','due_soon','Treatment plan due','A treatment plan is due soon.','Open assessments','/bcba/assessments',ARRAY['in_app','internal_task'],true,true,1440),
  ('bcba.clinical.qa_correction','clinical','action_required','QA correction requested','A QA reviewer has requested corrections.','Open QA feedback','/bcba/assessments',ARRAY['in_app','internal_task'],true,true,720),
  ('bcba.clinical.parent_signature_needed','clinical','action_required','Parent signature needed','A parent signature is required to move forward.','Open assessments','/bcba/assessments',ARRAY['in_app','internal_task'],false,true,1440),
  ('bcba.clinical.progress_report_due','clinical','due_soon','Progress report due','A progress report is approaching its deadline.','Open progress reports','/bcba/progress-reports',ARRAY['in_app','internal_task'],true,true,1440),
  ('bcba.clinical.authorization_risk','clinical','action_required','Authorization at risk','An authorization is at risk of lapsing.','Open progress reports','/bcba/progress-reports',ARRAY['in_app','internal_task','leadership_alert'],true,true,720),
  ('bcba.clinical.parent_training_overdue','clinical','action_required','Parent training overdue','A parent training record is overdue.','Open parent training','/bcba/parent-training',ARRAY['in_app','internal_task'],false,true,1440),
  ('bcba.employee.credential_expiration','employee','action_required','Credential expiring soon','One of your credentials is expiring soon.','Open credentials','/bcba/profile',ARRAY['in_app','email','internal_task'],true,false,1440),
  ('bcba.employee.learning_due','employee','due_soon','Learning due','You have a learning assignment coming due.','Open academy','/bcba/academy',ARRAY['in_app','email'],false,false,1440),
  ('bcba.employee.support_ticket_update','employee','update','Support ticket update','There is an update on your support ticket.','Open support','/bcba/support-center',ARRAY['in_app','email'],false,false,60),
  ('bcba.employee.recognition','employee','recognition','You were recognized','You received recognition from your team.','View','/bcba',ARRAY['in_app','email'],false,false,60),
  ('bcba.employee.capacity_review','employee','update','Capacity review','Your capacity has been reviewed.','Open capacity','/bcba/productivity',ARRAY['in_app'],false,false,720),
  ('bcba.employee.growth_opportunity','employee','recognition','Growth opportunity available','A growth opportunity is available for you.','View','/bcba',ARRAY['in_app','email'],false,false,1440)
ON CONFLICT (event_key) DO NOTHING;
