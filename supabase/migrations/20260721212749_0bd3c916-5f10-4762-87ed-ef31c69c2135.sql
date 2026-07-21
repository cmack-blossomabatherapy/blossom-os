
-- Slice 2 retry — RBT pathway alignment. Uses DISTINCT ON instead of MIN(uuid).

-- 1) Concurrent-safe uniqueness on (employee_id, pathway_step_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname='public'
       AND indexname='rbt_pathway_progress_employee_step_uniq'
  ) THEN
    -- Remove duplicates keeping the oldest row per (employee_id, pathway_step_id).
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY employee_id, pathway_step_id ORDER BY created_at NULLS LAST, id) AS rn
        FROM public.rbt_pathway_progress
    )
    DELETE FROM public.rbt_pathway_progress p
     USING ranked r
     WHERE p.id = r.id AND r.rn > 1;

    CREATE UNIQUE INDEX rbt_pathway_progress_employee_step_uniq
      ON public.rbt_pathway_progress(employee_id, pathway_step_id);
  END IF;
END $$;

-- 2) Realign step catalog to the approved program (idempotent upsert).

-- ---------- EXPERIENCED RBT (2+ years) ---------------------------------------
SELECT public._upsert_rbt_step('experienced_rbt','orientation_short',
  'Blossom orientation',
  'Abbreviated orientation covering policies, procedures, expectations, and the CentralReach essentials you will use daily.',
  'orientation', 10, 1, 'in_person',
  to_jsonb(ARRAY['orientation']), true,
  jsonb_build_object('owner_key','training_lead_becca','event_kind','orientation','allows_scheduling',true));
SELECT public._upsert_rbt_step('experienced_rbt','staffing_ready',
  'Ready to staff',
  'Scheduling clears you to take a case. No additional training required — your BCBA remains available for any onboarding questions.',
  'action', 20, 1, 'self_paced',
  to_jsonb(ARRAY['staffing']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','staffing','allows_scheduling',true));
SELECT public._upsert_rbt_step('experienced_rbt','retention_two_week',
  'Two-week retention check-in',
  'Structured check-in on fit, family/BCBA barriers, confidence, and any additional support needed.',
  'checkin', 30, 1, 'zoom',
  to_jsonb(ARRAY['retention']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','retention_checkin','trigger','plus_14_days_after_first_session'));

-- ---------- DEVELOPING RBT (Under 2 years) -----------------------------------
SELECT public._upsert_rbt_step('under_2_years','orientation_new_hire',
  'New-hire orientation',
  'Standard Blossom orientation for developing RBTs.',
  'orientation', 10, 1, 'in_person',
  to_jsonb(ARRAY['orientation']), true,
  jsonb_build_object('owner_key','training_lead_becca','event_kind','orientation','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','zoom_learning_day',
  'Zoom learning day',
  'Live Zoom learning day covering session structure, data collection, and session notes. ABA Basics is excluded because you are already certified.',
  'training', 20, 1, 'zoom',
  to_jsonb(ARRAY['session_structure','data_collection','session_notes']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','role_play_in_clinic',
  'In-clinic role play',
  'Laminated role-play competency practice with a Lead RBT covering DTT, NET, pairing, chaining, differential reinforcement, prompting, data collection, and shaping.',
  'practice', 30, 1, 'in_person',
  to_jsonb(ARRAY['role_play']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','role_play','handout_owner','role_play_content_hannah','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','lead_rbt_client_session',
  'Lead RBT client session',
  'Attend a client session with a Lead RBT to observe expectations before your scored evaluation.',
  'observation', 40, 1, 'in_person',
  to_jsonb(ARRAY['client_demo']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','observation','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','competency_evaluation_scored',
  'Scored competency evaluation',
  'Competency evaluation scored 0-60. Your score determines how your first case will be staffed.',
  'evaluation', 50, 1, 'in_person',
  to_jsonb(ARRAY['competency_score']), true,
  jsonb_build_object(
    'owner_key','training_lead_becca',
    'event_kind','evaluation',
    'produces_score','competency_0_60',
    'signoff_role','bcba',
    'branch_config_key','developing_rbt_bands',
    'thresholds', jsonb_build_object(
      'repeat_lead_session',            jsonb_build_object('min',0,'max',36,'label','Repeat Lead RBT session and re-evaluate'),
      'staff_case_lead_first_session',  jsonb_build_object('min',37,'max',47,'label','Staff case; Lead RBT attends the entire first session'),
      'staff_case_bcba_first_session',  jsonb_build_object('min',48,'max',60,'label','Staff case; BCBA supervises the first session')
    )
  ));
SELECT public._upsert_rbt_step('under_2_years','staffing_first_case',
  'Staff the case',
  'Scheduling staffs your first case per your competency score band.',
  'action', 60, 2, 'self_paced',
  to_jsonb(ARRAY['staffing']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','staffing','depends_on','competency_evaluation_scored'));
SELECT public._upsert_rbt_step('under_2_years','first_session_support',
  'First session (score-branched)',
  '0-36: repeat Lead session and re-evaluate. 37-47: Lead RBT attends the entire first session. 48-60: BCBA supervises the first session.',
  'observation', 70, 1, 'in_person',
  to_jsonb(ARRAY['first_session']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','first_session','branch_config_key','developing_rbt_bands','allows_scheduling',true));
SELECT public._upsert_rbt_step('under_2_years','session_note_review',
  'Session-note review',
  'Submit a session note for review; feedback returned within one business day.',
  'review', 80, 3, 'self_paced',
  to_jsonb(ARRAY['session_notes']), true,
  jsonb_build_object('owner_key','session_note_reviewer_anju','event_kind','session_note_review','requires_submission',true));
SELECT public._upsert_rbt_step('under_2_years','retention_two_week',
  'Two-week retention check-in',
  'Structured check-in on fit, barriers, confidence, and any additional support needed.',
  'checkin', 90, 1, 'zoom',
  to_jsonb(ARRAY['retention']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','retention_checkin','trigger','plus_14_days_after_first_session'));

-- ---------- CERTIFICATION TRACK ----------------------------------------------
SELECT public._upsert_rbt_step('new_rbt_certification','intro_welcome_15min',
  '15-minute training welcome',
  'A 15-minute welcome from the Training Lead explaining how the training program works and what to expect.',
  'orientation', 10, 1, 'zoom',
  to_jsonb(ARRAY['orientation']), true,
  jsonb_build_object('owner_key','training_lead_becca','event_kind','orientation','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','paired_roleplay_competency',
  'Paired role-play & competency practice',
  'Role-play practice with a Lead RBT covering pairing, preference assessments, reinforcement, verbal operants, prompting, assent, differential reinforcement, DTT, NET, chaining, data collection, and shaping.',
  'practice', 20, 2, 'in_person',
  to_jsonb(ARRAY['role_play','competency_prep']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','role_play','handout_owner','role_play_content_hannah','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','client_demos_three',
  'Three in-person client demonstrations',
  'Complete at least three in-person competency observations with a Lead RBT and a client.',
  'demonstration', 30, 7, 'in_person',
  to_jsonb(ARRAY['client_demo']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','demonstration','required_count',3,'allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','bcba_competency_signoff',
  'BCBA competency signoff',
  'A BCBA reviews your competency observations and signs off before you sit for the RBT exam.',
  'evaluation', 40, 1, 'in_person',
  to_jsonb(ARRAY['competency_signoff']), true,
  jsonb_build_object('owner_key','training_lead_becca','event_kind','signoff','signoff_role','bcba'));
SELECT public._upsert_rbt_step('new_rbt_certification','exam_prep',
  'Exam preparation',
  'Guided RBT exam preparation with the Training Lead and Floater support.',
  'training', 50, 3, 'zoom',
  to_jsonb(ARRAY['exam_prep']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','exam_attempt',
  'RBT exam',
  'Sit for and pass the RBT exam.',
  'exam', 60, 1, 'self_paced',
  to_jsonb(ARRAY['exam']), true,
  jsonb_build_object('owner_key','training_lead_becca','event_kind','exam','allows_scheduling',false));
SELECT public._upsert_rbt_step('new_rbt_certification','zoom_aba_explained',
  'Zoom: ABA Explained',
  'Interactive Zoom module: pairing, preference assessments, reinforcement, verbal operants, prompting, assent, function of behavior, differential reinforcement. Active participation required.',
  'training', 70, 1, 'zoom',
  to_jsonb(ARRAY['aba_basics']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','interactive',true,'allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','zoom_data_collection',
  'Zoom: Data Collection',
  'Interactive Zoom module on data collection standards used at Blossom. Active participation required.',
  'training', 80, 1, 'zoom',
  to_jsonb(ARRAY['data_collection']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','interactive',true,'allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','zoom_session_notes',
  'Zoom: Session Notes',
  'Interactive Zoom module on writing high-quality session notes. Active participation required.',
  'training', 90, 1, 'zoom',
  to_jsonb(ARRAY['session_notes']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','training','interactive',true,'allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','shadow_lead_rbt_session',
  'Shadow Lead RBT with a client',
  'Shadow a Lead RBT during a client session before your first evaluation.',
  'observation', 100, 1, 'in_person',
  to_jsonb(ARRAY['client_demo']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','observation','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','post_shadow_evaluation',
  'Post-shadow evaluation',
  'Evaluation completed by your Lead RBT with score-based next steps.',
  'evaluation', 110, 1, 'in_person',
  to_jsonb(ARRAY['evaluation']), true,
  jsonb_build_object('owner_key','assessment_forms_becca','event_kind','evaluation','signoff_role','lead_rbt','branch_config_key','developing_rbt_bands'));
SELECT public._upsert_rbt_step('new_rbt_certification','submit_session_note_for_feedback',
  'Submit a session note for feedback',
  'Write and submit a session note; a reviewer returns written feedback before your first solo session.',
  'review', 120, 2, 'self_paced',
  to_jsonb(ARRAY['session_notes']), true,
  jsonb_build_object('owner_key','session_note_reviewer_anju','event_kind','session_note_review','requires_submission',true));
SELECT public._upsert_rbt_step('new_rbt_certification','staff_case_first_assignment',
  'Staff the case',
  'Scheduling staffs your first case. Your traveling Lead RBT will attend the entire first session.',
  'action', 130, 2, 'self_paced',
  to_jsonb(ARRAY['staffing']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','staffing'));
SELECT public._upsert_rbt_step('new_rbt_certification','first_session_lead_full',
  'First session — Lead RBT attends full session',
  'Your traveling Lead RBT attends the entire first session with you.',
  'observation', 140, 1, 'in_person',
  to_jsonb(ARRAY['first_session']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','first_session','signoff_role','lead_rbt','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','second_session_bcba',
  'Second session — BCBA attends',
  'A BCBA attends your second session to confirm readiness and provide direct clinical feedback.',
  'observation', 150, 1, 'in_person',
  to_jsonb(ARRAY['first_session']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','first_session','signoff_role','bcba','allows_scheduling',true));
SELECT public._upsert_rbt_step('new_rbt_certification','retention_two_week',
  'Two-week retention check-in',
  'Structured check-in on fit, family/BCBA barriers, confidence, and any additional support needed.',
  'checkin', 160, 1, 'zoom',
  to_jsonb(ARRAY['retention']), true,
  jsonb_build_object('owner_key','floater_lead_rbt','event_kind','retention_checkin','trigger','plus_14_days_after_first_session'));

-- 3) Retire legacy step keys no longer in the approved program.
DO $$
DECLARE
  keep_experienced   text[] := ARRAY['orientation_short','staffing_ready','retention_two_week'];
  keep_developing    text[] := ARRAY['orientation_new_hire','zoom_learning_day','role_play_in_clinic','lead_rbt_client_session','competency_evaluation_scored','staffing_first_case','first_session_support','session_note_review','retention_two_week'];
  keep_certification text[] := ARRAY['intro_welcome_15min','paired_roleplay_competency','client_demos_three','bcba_competency_signoff','exam_prep','exam_attempt','zoom_aba_explained','zoom_data_collection','zoom_session_notes','shadow_lead_rbt_session','post_shadow_evaluation','submit_session_note_for_feedback','staff_case_first_assignment','first_session_lead_full','second_session_bcba','retention_two_week'];
BEGIN
  DELETE FROM public.rbt_pathway_steps s
   USING public.rbt_pathways p
   WHERE s.pathway_id = p.id
     AND (
          (p.key='experienced_rbt'         AND s.key <> ALL (keep_experienced))
       OR (p.key='under_2_years'           AND s.key <> ALL (keep_developing))
       OR (p.key='new_rbt_certification'   AND s.key <> ALL (keep_certification))
     )
     AND NOT EXISTS (SELECT 1 FROM public.rbt_pathway_progress pr WHERE pr.pathway_step_id = s.id);

  UPDATE public.rbt_pathway_steps s
     SET metadata    = COALESCE(s.metadata,'{}'::jsonb) || jsonb_build_object('retired', true, 'retired_at', now()),
         required    = false,
         order_index = 900 + s.order_index
    FROM public.rbt_pathways p
   WHERE s.pathway_id = p.id
     AND (
          (p.key='experienced_rbt'         AND s.key <> ALL (keep_experienced))
       OR (p.key='under_2_years'           AND s.key <> ALL (keep_developing))
       OR (p.key='new_rbt_certification'   AND s.key <> ALL (keep_certification))
     )
     AND COALESCE(s.metadata->>'retired','false') <> 'true';
END $$;
