
ALTER TABLE public.rbt_pathways
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.rbt_pathway_steps
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO public.rbt_pathways (key, name, description, metadata)
VALUES
  ('new_rbt_certification', 'New RBT — Certification Track',
   'New hires without an active RBT credential. Ends at RBT exam and first client demonstration signoff.',
   jsonb_build_object('audience','new_hire','requires_exam',true)),
  ('under_2_years', 'Developing RBT (Under 2 Years)',
   'Certified RBTs with under two years of hands-on experience. Focus is competency, first case, and retention.',
   jsonb_build_object('audience','developing','score_branching',true)),
  ('experienced_rbt', 'Experienced RBT (2+ Years)',
   'Certified RBTs with two or more years of experience. Abbreviated onboarding with retention touchpoints.',
   jsonb_build_object('audience','experienced'))
ON CONFLICT (key) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      metadata = public.rbt_pathways.metadata || EXCLUDED.metadata;

UPDATE public.rbt_pathways
   SET metadata = metadata || jsonb_build_object('alias_of_key','under_2_years','alias_reason','Consolidated: certified w/o experience is a Developing RBT.')
 WHERE key IN ('certified_no_experience','certified_rbt_no_experience','no_experience_rbt')
   AND (metadata->>'alias_of_key') IS DISTINCT FROM 'under_2_years';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='rbt_pathway_steps_pathway_key_uniq') THEN
    CREATE UNIQUE INDEX rbt_pathway_steps_pathway_key_uniq ON public.rbt_pathway_steps(pathway_id, key);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._upsert_rbt_step(
  _pathway_key text, _key text, _title text, _description text,
  _kind text, _order int, _est_days int, _delivery_mode text,
  _capabilities jsonb, _required boolean, _metadata jsonb
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE _pid uuid;
BEGIN
  SELECT id INTO _pid FROM public.rbt_pathways WHERE key = _pathway_key;
  IF _pid IS NULL THEN RETURN; END IF;
  INSERT INTO public.rbt_pathway_steps
    (pathway_id, key, title, description, kind, order_index, estimated_days,
     delivery_mode, capabilities, required, metadata)
  VALUES
    (_pid, _key, _title, _description, _kind, _order, _est_days,
     _delivery_mode, _capabilities, _required, _metadata)
  ON CONFLICT (pathway_id, key) DO UPDATE
    SET title = EXCLUDED.title, description = EXCLUDED.description,
        kind = EXCLUDED.kind, order_index = EXCLUDED.order_index,
        estimated_days = EXCLUDED.estimated_days,
        delivery_mode = EXCLUDED.delivery_mode,
        capabilities = EXCLUDED.capabilities,
        required = EXCLUDED.required,
        metadata = public.rbt_pathway_steps.metadata || EXCLUDED.metadata;
END;
$$;

-- NEW RBT (Certification)
SELECT public._upsert_rbt_step('new_rbt_certification','orientation_blossom','Blossom orientation','Welcome, mission, tools, expectations. Delivered by the Training Lead.','orientation',10,1,'in_person', to_jsonb(ARRAY['orientation']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','orientation','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','aba_basics_kafo','KAFO ABA Basics','ABA Basics workshop covering session structure, data, and prompting.','training',20,1,'zoom', to_jsonb(ARRAY['aba_basics']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','role_play_in_clinic','In-clinic role play','Laminated role play prompts practiced with a Lead/Floater RBT in clinic.','practice',30,2,'in_person', to_jsonb(ARRAY['role_play','session_structure']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','role_play','handout_owner','role_play_content_hannah','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','competency_prep_zoom','Competency prep (Zoom)','Zoom competency prep with the Training Lead.','training',40,1,'zoom', to_jsonb(ARRAY['competency_prep']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','client_demos_three','Three in-person client demonstrations','Complete three in-person supervised client demonstrations.','demonstration',50,7,'in_person', to_jsonb(ARRAY['client_demo']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','demonstration','required_count',3,'allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','competency_evaluation_zoom','Competency evaluation (Zoom)','Scored competency evaluation delivered by the Training Lead.','evaluation',60,1,'zoom', to_jsonb(ARRAY['competency_signoff']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','evaluation','signoff_role','bcba','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','exam_prep','Exam prep','RBT exam prep with Training Lead / Floater support.','training',70,3,'zoom', to_jsonb(ARRAY['exam_prep']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','exam_attempt','RBT exam','Sit and pass the RBT exam.','exam',80,1,'self_paced', to_jsonb(ARRAY['exam']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','exam','allows_scheduling',false));
SELECT public._upsert_rbt_step('new_rbt_certification','first_session_support','First session (supervised)','Lead RBT (or Floater) attends the entire first session; BCBA supervises when scored 48-60.','observation',90,1,'in_person', to_jsonb(ARRAY['first_session']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','first_session','allows_scheduling',true,'signoff_role','lead_rbt'));
SELECT public._upsert_rbt_step('new_rbt_certification','post_first_session_eval','Post-first-session evaluation','Evaluation form completed by the observing trainer.','evaluation',100,1,'in_person', to_jsonb(ARRAY['evaluation']), true, jsonb_build_object('owner_key','assessment_forms_becca','event_kind','evaluation','signoff_role','lead_rbt'));
SELECT public._upsert_rbt_step('new_rbt_certification','retention_two_week','Two-week retention check-in','Structured check-in on feeling, family/BCBA barriers, confidence, and further support needs.','checkin',110,1,'zoom', to_jsonb(ARRAY['retention']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','retention_checkin','trigger','plus_14_days_after_first_session'));

-- UNDER 2 YEARS
SELECT public._upsert_rbt_step('under_2_years','orientation_new_hire','New-hire orientation','Standard Blossom orientation for developing RBTs.','orientation',10,1,'in_person', to_jsonb(ARRAY['orientation']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','orientation'));
SELECT public._upsert_rbt_step('under_2_years','aba_basics_review','ABA Basics review','Refresher on session notes, data collection, and prompting.','training',20,1,'zoom', to_jsonb(ARRAY['aba_basics']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','role_play_in_clinic','In-clinic role play','Laminated role play in clinic with Lead/Floater RBT.','practice',30,1,'in_person', to_jsonb(ARRAY['role_play']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','role_play','handout_owner','role_play_content_hannah','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','competency_review_zoom','Competency review (Zoom)','Zoom competency review with Training Lead prior to scored evaluation.','training',40,1,'zoom', to_jsonb(ARRAY['competency_prep']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','competency_evaluation_scored','Scored competency evaluation','Zoom competency evaluation scored 0-60. Score determines first-session ownership.','evaluation',50,1,'zoom', to_jsonb(ARRAY['competency_score']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','evaluation','produces_score','competency_0_60','signoff_role','bcba','branch_config_key','developing_rbt_bands'));
SELECT public._upsert_rbt_step('under_2_years','staffing_first_case','Staff the case','Scheduling staffs the case per score band.','action',60,2,'self_paced', to_jsonb(ARRAY['staffing']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','staffing','depends_on','competency_evaluation_scored'));
SELECT public._upsert_rbt_step('under_2_years','first_session_support','First session (per score band)','0-36: repeat Lead session and re-evaluate. 37-47: Lead attends full first session. 48-60: BCBA supervises first session.','observation',70,1,'in_person', to_jsonb(ARRAY['first_session']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','first_session','branch_config_key','developing_rbt_bands','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','session_note_review','Session-note review','Trainee submits session notes for review by Anju; feedback returned within one business day.','review',80,3,'self_paced', to_jsonb(ARRAY['session_notes']), true, jsonb_build_object('owner_key','session_note_reviewer_anju','event_kind','session_note_review','requires_submission',true));
SELECT public._upsert_rbt_step('under_2_years','post_first_session_eval','Post-first-session evaluation','Evaluation form completed by the observing trainer/BCBA.','evaluation',90,1,'in_person', to_jsonb(ARRAY['evaluation']), true, jsonb_build_object('owner_key','assessment_forms_becca','event_kind','evaluation'));
SELECT public._upsert_rbt_step('under_2_years','retention_two_week','Two-week retention check-in','Structured check-in on feeling, barriers, confidence, and further support.','checkin',100,1,'zoom', to_jsonb(ARRAY['retention']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','retention_checkin','trigger','plus_14_days_after_first_session'));

-- EXPERIENCED
SELECT public._upsert_rbt_step('experienced_rbt','orientation_short','Onboarding orientation','Abbreviated Blossom orientation.','orientation',10,1,'in_person', to_jsonb(ARRAY['orientation']), true, jsonb_build_object('owner_key','training_lead_becca','event_kind','orientation'));
SELECT public._upsert_rbt_step('experienced_rbt','session_note_sample','Session-note sample review','One session note reviewed by Anju to calibrate to Blossom expectations.','review',20,2,'self_paced', to_jsonb(ARRAY['session_notes']), true, jsonb_build_object('owner_key','session_note_reviewer_anju','event_kind','session_note_review'));
SELECT public._upsert_rbt_step('experienced_rbt','first_session_light','First session (light-touch)','Floater or Lead RBT available for first session; may attend if requested.','observation',30,1,'in_person', to_jsonb(ARRAY['first_session']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','first_session','allows_scheduling',true));
SELECT public._upsert_rbt_step('experienced_rbt','post_first_session_eval','Post-first-session evaluation','Evaluation form completed by the observing trainer or clinical lead.','evaluation',40,1,'in_person', to_jsonb(ARRAY['evaluation']), false, jsonb_build_object('owner_key','assessment_forms_becca','event_kind','evaluation'));
SELECT public._upsert_rbt_step('experienced_rbt','retention_two_week','Two-week retention check-in','Confirms fit, escalates any support needed.','checkin',50,1,'zoom', to_jsonb(ARRAY['retention']), true, jsonb_build_object('owner_key','floater_lead_rbt','event_kind','retention_checkin','trigger','plus_14_days_after_first_session'));

-- --- Notification triggers -------------------------------------------------
CREATE OR REPLACE FUNCTION public.rbt_notify_support_needed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _step_title text; _trainer_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.support_needed = NEW.support_needed THEN RETURN NEW; END IF;
  IF NEW.support_needed IS DISTINCT FROM true THEN RETURN NEW; END IF;
  SELECT title INTO _step_title FROM public.rbt_pathway_steps WHERE id = NEW.pathway_step_id;
  FOR _trainer_id IN
    SELECT trainer_user_id FROM public.rbt_trainee_assignments
     WHERE trainee_user_id = NEW.employee_id AND active
  LOOP
    INSERT INTO public.user_notifications
      (user_id, title, body, category, deep_link, priority, source, source_id)
    SELECT _trainer_id, 'Support needed',
      COALESCE(_step_title,'A trainee needs support') || ' — trainee flagged support needed.',
      'rbt_training', '/bcba/trainees?traineeId=' || NEW.employee_id::text,
      'high', 'rbt_pathway_progress', NEW.id::text
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_notifications
       WHERE user_id = _trainer_id AND source = 'rbt_pathway_progress'
         AND source_id = NEW.id::text AND read_at IS NULL
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rbt_notify_support_needed ON public.rbt_pathway_progress;
CREATE TRIGGER trg_rbt_notify_support_needed
  AFTER INSERT OR UPDATE OF support_needed ON public.rbt_pathway_progress
  FOR EACH ROW EXECUTE FUNCTION public.rbt_notify_support_needed();

CREATE OR REPLACE FUNCTION public.rbt_mark_retention_overdue()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c integer;
BEGIN
  WITH updated AS (
    UPDATE public.rbt_retention_checkins
       SET status = 'overdue', updated_at = now()
     WHERE status = 'due' AND due_at < now()
     RETURNING id, trainee_user_id, owner_user_id
  ), notified AS (
    INSERT INTO public.user_notifications
      (user_id, title, body, category, deep_link, priority, source, source_id)
    SELECT COALESCE(u.owner_user_id, ta.trainer_user_id),
      'Retention check-in overdue',
      'Two-week retention check-in is overdue for a trainee.',
      'rbt_training', '/bcba/trainees?checkinId=' || u.id::text,
      'high', 'rbt_retention_checkins', u.id::text
      FROM updated u
      LEFT JOIN public.rbt_trainee_assignments ta
        ON ta.trainee_user_id = u.trainee_user_id AND ta.active
       AND ta.trainer_kind = 'floater_lead_rbt'
     WHERE COALESCE(u.owner_user_id, ta.trainer_user_id) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.user_notifications un
          WHERE un.source = 'rbt_retention_checkins'
            AND un.source_id = u.id::text AND un.read_at IS NULL
       )
     RETURNING 1
  )
  SELECT COUNT(*) INTO _c FROM notified;
  RETURN _c;
END;
$$;
REVOKE ALL ON FUNCTION public.rbt_mark_retention_overdue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rbt_mark_retention_overdue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbt_mark_retention_overdue() TO service_role;
