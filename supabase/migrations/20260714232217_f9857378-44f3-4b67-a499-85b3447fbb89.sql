
-- 1) Storage RLS for the recruiting-resources bucket
DROP POLICY IF EXISTS "Authenticated can read recruiting-resources" ON storage.objects;
CREATE POLICY "Authenticated can read recruiting-resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'recruiting-resources');

-- 2) Clear prior seed for this bucket (idempotent)
DELETE FROM public.hr_resources WHERE storage_bucket = 'recruiting-resources';

-- 3) Seed rows
WITH staff_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'recruiting_lead','recruiting_coordinator','recruiting_assistant','recruiting','recruiting_team',
    'hr_lead','hr','state_director','assistant_state_director'
  ]::text[] AS r
), lead_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'recruiting_lead','hr_lead','hr'
  ]::text[] AS r
), admin_roles AS (
  SELECT ARRAY['super_admin','training_management']::text[] AS r
),
files (title, file_name, mime_type, kind, resource_type, sopr, trainr,
       subcategory, description, tags_extra, vis_level, audience) AS (VALUES

  -- START HERE
  ('Recruiting Lead / Coordinator Role SOP','L1-Recruiting-Lead-Coordinator-Role-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_start_here','Day-to-day responsibilities of the Recruiting Lead / Coordinator role.', ARRAY['role_sop','start_here']::text[],'department_only','staff'),
  ('Recruiting Department Academy Guide','016 - recruiting-department-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_start_here','Department overview and how Recruiting fits into current operations.', ARRAY['overview','academy']::text[],'department_only','staff'),
  ('Recruiting Workflow Academy Guide','074 - recruiting-workflow-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_start_here','Walkthrough of the current Recruiting workflow end-to-end.', ARRAY['workflow','academy']::text[],'department_only','staff'),

  -- CANDIDATE PIPELINE
  ('Candidate Intake Process SOP','L2-Candidate-Intake-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_candidate_pipeline','How new candidates are brought into the pipeline.', ARRAY['candidate','intake','pipeline']::text[],'department_only','staff'),
  ('Candidate Follow-Up Process SOP','L2-Candidate-Follow-Up-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_candidate_pipeline','Follow-up cadence and expectations for candidates.', ARRAY['candidate','follow_up','pipeline']::text[],'department_only','staff'),
  ('Candidate Pipeline Academy Guide','075 - candidate-pipeline-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_candidate_pipeline','Academy walkthrough of the candidate pipeline.', ARRAY['candidate','pipeline','academy']::text[],'department_only','staff'),
  ('GA HireCare Recruitment Leads (Export)','GA_HireCare_Recruitment_Leads_1781018389.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'recruiting_candidate_pipeline','Example HireCare recruitment leads export for reference.', ARRAY['hirecare','candidate','export']::text[],'department_only','staff'),
  ('HireCare Interview Leads (Export)','HireCare_Interview_Leads_1781018375.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'recruiting_candidate_pipeline','Example HireCare interview leads board export.', ARRAY['hirecare','interview','export']::text[],'department_only','staff'),

  -- JOB POSTING AND SOURCING
  ('Job Posting — Current Operations','L2-Job-Posting-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_job_posting','How Recruiting posts and manages jobs today.', ARRAY['job_posting','sourcing']::text[],'department_only','staff'),
  ('How to Post and Edit Jobs','How to Post and Edit Jobs.mp4','video/mp4','video','video', false, true,
    'recruiting_job_posting','Walkthrough: posting and editing jobs.', ARRAY['video','job_posting','sourcing']::text[],'department_only','staff'),
  ('Indeed Accounts, Job Posting, Invites Guide','Indeed Accounts, Job Posting, Invites Guide.mp4','video/mp4','video','video', false, true,
    'recruiting_job_posting','Walkthrough: Indeed accounts, posting, and candidate invites.', ARRAY['video','indeed','job_posting','sourcing']::text[],'department_only','staff'),
  ('Indeed Analytics and Hiring Insight Overview','Indeed Analytics and Hiring Insight Overview.mp4','video/mp4','video','video', false, true,
    'recruiting_job_posting','Walkthrough: Indeed analytics and hiring insights.', ARRAY['video','indeed','analytics']::text[],'department_only','staff'),
  ('ZipRecruiter Recruiting Overview and Resume Database','ZipRecruiter Recruiting Overview and Resume Database.mp4','video/mp4','video','video', false, true,
    'recruiting_job_posting','Walkthrough: ZipRecruiter overview and resume database.', ARRAY['video','ziprecruiter','sourcing']::text[],'department_only','staff'),
  ('Using ClickUp Smart Sourcing Subscriptions','Using ClickUp Smart Sourcing Subscriptions.mp4','video/mp4','video','video', false, true,
    'recruiting_job_posting','Walkthrough: ClickUp smart sourcing subscriptions.', ARRAY['video','clickup','sourcing']::text[],'department_only','staff'),
  ('Apploi — Reaching Out','Apploi- Reaching out.pdf','application/pdf','document','guide', false, true,
    'recruiting_job_posting','Guide: reaching out to candidates through Apploi.', ARRAY['apploi','sourcing','outreach']::text[],'department_only','staff'),
  ('Apploi — Recruiting Guide','Apploi - Recruiting.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, true,
    'recruiting_job_posting','Written Apploi recruiting reference.', ARRAY['apploi','sourcing','reference']::text[],'department_only','staff'),

  -- RESUME REVIEW
  ('Resume Review — Current Operations','L2-Resume-Review-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_resume_review','How resumes are screened and reviewed today.', ARRAY['resume','screening']::text[],'department_only','staff'),

  -- INTERVIEWS
  ('Interview Scheduling Process SOP','L2-Interview-Scheduling-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_interviews','How interviews are scheduled today.', ARRAY['interview','scheduling']::text[],'department_only','staff'),
  ('Interview Process — Current Operations','L2-Interview-Process-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_interviews','How interviews are actually run.', ARRAY['interview']::text[],'department_only','staff'),
  ('Conducting an Interview','Conducting an Interview.pdf','application/pdf','document','guide', false, true,
    'recruiting_interviews','Guide: conducting a candidate interview.', ARRAY['interview','guide']::text[],'department_only','staff'),
  ('Adding Candidates, Interviewing, Sending Offers','Adding Candidates, Interviewing, Sending Offers.mp4','video/mp4','video','video', false, true,
    'recruiting_interviews','Walkthrough: adding candidates, interviewing, and sending offers.', ARRAY['video','interview','offer']::text[],'department_only','staff'),
  ('Interview Process Academy Guide','076 - interview-process-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_interviews','Academy walkthrough of the interview process.', ARRAY['interview','academy']::text[],'department_only','staff'),

  -- OFFERS AND HIRING HANDOFF
  ('Offer Letters — Current Operations','L2-Offer-Letters-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_offers','How offers are prepared and sent today.', ARRAY['offer','offer_letter']::text[],'department_only','staff'),
  ('Hiring Handoff to HR Process SOP','L2-Hiring-Handoff-to-HR-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_offers','Handoff from Recruiting to HR after offer acceptance.', ARRAY['offer','handoff','hr']::text[],'department_only','staff'),
  ('Offer Letter Signed — Workflow Reference','Offer Letter Signed.pdf','application/pdf','document','guide', false, false,
    'recruiting_offers','Reference for the Offer Letter Signed workflow.', ARRAY['offer','offer_letter','workflow']::text[],'department_only','staff'),

  -- OFFER LETTER TEMPLATES (leadership only)
  ('BCBA FT Offer Letter — Template','BCBA FT Offer Letter.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'recruiting_offers','BCBA full-time offer letter reference template (leadership only).', ARRAY['offer','offer_letter','template','bcba','ft','leadership']::text[],'leadership_only','lead'),
  ('BCBA FT Offer Letter — Template (v2)','BCBA FT Offer Letter1.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'recruiting_offers','BCBA full-time offer letter reference template — alternate (leadership only).', ARRAY['offer','offer_letter','template','bcba','ft','leadership']::text[],'leadership_only','lead'),
  ('BCBA PT Offer Letter — Template','Offer Letter PT BCBA Dec 2023.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'recruiting_offers','BCBA part-time offer letter reference template (leadership only).', ARRAY['offer','offer_letter','template','bcba','pt','leadership']::text[],'leadership_only','lead'),
  ('BCBA PT Offer Letter — Template (copy)','Offer Letter PT BCBA Dec 2023 - Copy.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'recruiting_offers','BCBA part-time offer letter reference template — copy (leadership only).', ARRAY['offer','offer_letter','template','bcba','pt','leadership']::text[],'leadership_only','lead'),
  ('RBT Offer Letter — Template','Offer Letter RBT Final .docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'recruiting_offers','RBT offer letter reference template (leadership only).', ARRAY['offer','offer_letter','template','rbt','leadership']::text[],'leadership_only','lead'),
  ('RBT Offer Letter — Template (2025)','Offer Letter RBT Final 25.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'recruiting_offers','RBT offer letter reference template — 2025 revision (leadership only).', ARRAY['offer','offer_letter','template','rbt','leadership']::text[],'leadership_only','lead'),

  -- BACKGROUND CHECKS AND ONBOARDING HANDOFF
  ('Background Checks — Current Operations','L2-Background-Checks-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_background_onboarding','How background checks are run today.', ARRAY['background_check','onboarding']::text[],'department_only','staff'),
  ('Background Checks Academy Guide','079 - background-checks-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_background_onboarding','Academy walkthrough of background checks.', ARRAY['background_check','academy']::text[],'department_only','staff'),
  ('Employee Onboarding Logistics Process SOP','L2-Employee-Onboarding-Logistics-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_background_onboarding','Handoff awareness: employee onboarding logistics.', ARRAY['onboarding','handoff']::text[],'department_only','staff'),
  ('Onboarding — Current Operations','L2-Onboarding-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_background_onboarding','Handoff awareness: how onboarding runs today.', ARRAY['onboarding','handoff']::text[],'department_only','staff'),
  ('Orientation — Current Operations','L2-Orientation-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'recruiting_background_onboarding','Handoff awareness: how orientation runs today.', ARRAY['orientation','handoff']::text[],'department_only','staff'),
  ('Orientation Process Academy Guide','078 - orientation-process-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_background_onboarding','Academy walkthrough of the orientation process.', ARRAY['orientation','academy']::text[],'department_only','staff'),
  ('Transfer Employee Onboarding to Viventium','Transfer Employee Onboarding to Viventium.mp4','video/mp4','video','video', false, true,
    'recruiting_background_onboarding','Walkthrough: transferring an employee onboarding to Viventium.', ARRAY['video','viventium','onboarding','handoff']::text[],'department_only','staff'),
  ('Viventium Workflow Academy Guide','080 - viventium-workflow-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_background_onboarding','Academy walkthrough of the Viventium workflow.', ARRAY['viventium','workflow','academy']::text[],'department_only','staff'),
  ('BCBA Onboarding (Export)','BCBA Onboarding.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'recruiting_background_onboarding','Reference export of BCBA onboarding tracker.', ARRAY['bcba','onboarding','export']::text[],'department_only','staff'),
  ('Recruiting Onboarding Workflow','Recruiting Onboarding Workflow .docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
    'recruiting_background_onboarding','Reference doc: recruiting onboarding workflow.', ARRAY['onboarding','workflow','reference']::text[],'department_only','staff'),
  ('Recruiting Onboarding Workflow — Updated','UpdatedRecruiting Onboarding Workflow .docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
    'recruiting_background_onboarding','Updated reference doc: recruiting onboarding workflow.', ARRAY['onboarding','workflow','reference','updated']::text[],'department_only','staff'),

  -- STATE RECRUITING AND KPIS
  ('State Recruiting Need Review Process SOP','L2-State-Recruiting-Need-Review-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'recruiting_state_kpi','How state recruiting needs are reviewed today.', ARRAY['state','recruiting_need']::text[],'department_only','staff'),
  ('Recruiting KPIs Academy Guide','089 - recruiting-kpis-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_state_kpi','Academy walkthrough of Recruiting KPIs.', ARRAY['kpi','academy']::text[],'department_only','staff'),

  -- TRAINING, SHADOWING, PLAYBOOKS
  ('Recruiting Shadow Academy Guide','083 - recruiting-shadow-academy-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_training_playbooks','Academy guide for shadowing on the Recruiting team.', ARRAY['shadow','academy']::text[],'department_only','staff'),
  ('Recruiting Shadow Guide','111 - recruiting-shadow-guide.pdf','application/pdf','document','guide', false, true,
    'recruiting_training_playbooks','Reference guide for Recruiting shadow days.', ARRAY['shadow','guide']::text[],'department_only','staff'),
  ('Recruiting Playbook','127 - recruiting-playbook.pdf','application/pdf','document','guide', false, true,
    'recruiting_training_playbooks','Current Recruiting playbook.', ARRAY['playbook']::text[],'department_only','staff'),
  ('Recruiting Department 4-Week Current-State Onboarding Journey','Recruiting Department 4-Week Current-State Onboarding Journey - 2026-07-14.md','text/markdown','document','training', false, true,
    'recruiting_training_playbooks','Prompt / reference used to author the current-state Recruiting onboarding journey.', ARRAY['training','onboarding_journey']::text[],'department_only','staff'),

  -- ADMIN QA / NEEDS REVIEW
  ('Recruiting Resource Library — Uploaded Docs Availability Prompt','Recruiting Resource Library Uploaded Docs Availability Prompt - 2026-07-14.md','text/markdown','document','admin_reference', false, false,
    'recruiting_admin_qa','Admin reconciliation reference for the Recruiting resource pack.', ARRAY['admin','qa','reconciliation']::text[],'admin_only','admin'),
  ('Sprint 20 — Recruiting Menu & Functionality Prompt','Lovable Prompt - Blossom OS Sprint 20 Recruiting Team Full Menu Pages and Functionality.md','text/markdown','document','admin_reference', false, false,
    'recruiting_admin_qa','Internal Lovable sprint prompt — admin only.', ARRAY['admin','sprint','prompt']::text[],'admin_only','admin'),
  ('RFO-00416 — DMAS Application (needs review)','RFO-00416 - DMAS_Application.webm','audio/webm','video','video', false, false,
    'recruiting_admin_qa','Unclear source media — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
  ('RFO-00419 — Screen Capture (needs review)','RFO-00419 - screen_capture_1.webm','audio/webm','video','video', false, false,
    'recruiting_admin_qa','Unclear source media — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
  ('RFO-00420 — Screen Capture (needs review)','RFO-00420 - screen_capture_1.webm','audio/webm','video','video', false, false,
    'recruiting_admin_qa','Unclear source media — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
  ('RFO-00421 — Screen Capture (needs review)','RFO-00421 - screen_capture.webm','audio/webm','video','video', false, false,
    'recruiting_admin_qa','Unclear source media — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
  ('RFO-00423 — Video (needs review)','RFO-00423 - video1003223464.mp4','video/mp4','video','video', false, false,
    'recruiting_admin_qa','Unclear source media — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
  ('RFO-00684 — After-Hours Retell AI Receptionist Walkthrough (needs review)','RFO-00684 - After_Hours_Retell_AI_Receptionist_Walkthrough.mp4','video/mp4','video','video', false, false,
    'recruiting_admin_qa','After-hours Retell walkthrough — belongs to Intake area, held for review here.', ARRAY['needs_review','rfo','retell']::text[],'admin_only','admin')
)
INSERT INTO public.hr_resources (
  id, title, description, kind, category, storage_path, storage_bucket,
  file_name, mime_type, visibility_roles, visibility_states, visibility_level,
  departments, tags, resource_type, is_active, upload_status, attachment_status,
  sensitivity, is_sensitive, sop_related, training_related, uploaded_by_name,
  source_note, is_pinned, position
)
SELECT
  gen_random_uuid(),
  f.title,
  f.description,
  f.kind::hr_resource_kind,
  'general'::hr_resource_category,
  f.file_name,
  'recruiting-resources',
  f.file_name,
  f.mime_type,
  CASE f.audience
    WHEN 'staff' THEN (SELECT r FROM staff_roles)
    WHEN 'lead'  THEN (SELECT r FROM lead_roles)
    ELSE (SELECT r FROM admin_roles)
  END,
  ARRAY[]::text[],
  f.vis_level,
  ARRAY['recruiting']::text[],
  ARRAY['recruiting', f.subcategory] || f.tags_extra,
  f.resource_type,
  true,
  'published',
  'available',
  CASE WHEN f.audience = 'staff' THEN 'public_internal' ELSE 'internal' END,
  false,
  f.sopr,
  f.trainr,
  'FINAL - Recruiting Resource Library Upload - 2026-07-14',
  'Seeded from FINAL - Recruiting Resource Library Upload - 2026-07-14',
  false,
  0
FROM files f;
