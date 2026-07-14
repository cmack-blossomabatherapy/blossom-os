-- 1) Storage RLS: allow authenticated users to read from intake-resources.
--    Detail visibility is still gated by hr_resources RLS via visibility_roles.
DROP POLICY IF EXISTS "Authenticated can read intake-resources" ON storage.objects;
CREATE POLICY "Authenticated can read intake-resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'intake-resources');

-- 2) Seed hr_resources rows for the FINAL Intake resource pack (2026-07-14).
--    Idempotent — clears any prior intake-resources rows first.
DELETE FROM public.hr_resources WHERE storage_bucket = 'intake-resources';

-- Role sets
--   staff-facing intake:
--     super_admin, executive_leadership, operations_leadership, training_management,
--     director_of_intake, intake_lead, intake_coordinator,
--     state_director, assistant_state_director, state_va
--   leadership-only intake:
--     super_admin, executive_leadership, operations_leadership, training_management,
--     director_of_intake, intake_lead, state_director

WITH staff_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'director_of_intake','intake_lead','intake_coordinator',
    'state_director','assistant_state_director','state_va'
  ]::text[] AS r
), lead_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'director_of_intake','intake_lead','state_director'
  ]::text[] AS r
),
files (title, file_name, mime_type, kind, resource_type, sopr, trainr,
       subcategory, description, tags_extra, vis_level, audience) AS (VALUES
  -- START HERE
  ('Intake Overview — Current Operations','L1-Overview-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_start_here','How Intake actually runs today across Blossom.', ARRAY['overview','start_here']::text[],'department_only','staff'),
  ('Intake Lead / Admissions Role SOP','L1-Intake-Lead-Admissions-Role-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_start_here','Day-to-day responsibilities of the Intake Lead / Admissions role.', ARRAY['role_sop','start_here']::text[],'department_only','staff'),
  ('Director of Intake Role SOP','L1-Director-of-Intake-Role-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_start_here','Director of Intake responsibilities and oversight scope.', ARRAY['role_sop','leadership','start_here']::text[],'leadership_only','lead'),

  -- LEAD HANDLING
  ('New Lead — Current Operations','L2-New-Lead-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','How new leads are received and worked today.', ARRAY['new_lead','lead_handling']::text[],'department_only','staff'),
  ('New Lead Intake Process SOP','L2-New-Lead-Intake-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','Full SOP for taking a new lead through initial intake.', ARRAY['new_lead','lead_handling','sop']::text[],'department_only','staff'),
  ('Lead Status Update Process SOP','L2-Lead-Status-Update-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','How to update lead status in current trackers.', ARRAY['lead_status','lead_handling']::text[],'department_only','staff'),
  ('Website Leads — Current Operations','L2-Website-Leads-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','How leads coming from the website are handled today.', ARRAY['website_leads','lead_handling']::text[],'department_only','staff'),
  ('Facebook Leads — Current Operations','L2-Facebook-Leads-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','How leads from Facebook / paid social are handled today.', ARRAY['facebook_leads','lead_handling']::text[],'department_only','staff'),
  ('Lead Disqualification — Current Operations','L2-Lead-Disqualification-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','When and how to disqualify a lead.', ARRAY['lead_disqualification','lead_handling']::text[],'department_only','staff'),
  ('Can''t Reach Process — Current Operations','L2-Can-t-Reach-Process-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','Can''t Reach protocol for unresponsive families.', ARRAY['cant_reach','lead_handling']::text[],'department_only','staff'),
  ('Transition to Client — Current Operations','L2-Transition-to-Client-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_lead_handling','How to transition an approved lead into an active client.', ARRAY['transition_to_client','lead_handling']::text[],'department_only','staff'),

  -- FAMILY COMMUNICATION
  ('Family Contact and Follow-Up Process SOP','L2-Family-Contact-and-Follow-Up-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_family_communication','Standard family contact cadence and follow-up rules.', ARRAY['family_contact','follow_up']::text[],'department_only','staff'),
  ('Phone Calls — Current Operations','L2-Phone-Calls-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_family_communication','How Intake handles inbound and outbound phone calls today.', ARRAY['phone_calls','communication']::text[],'department_only','staff'),
  ('Parent Communication Resources — SMS & Email Template Library','Parent Communication Resources SMS and Email Template Library Prompt - 2026-07-14.md','text/markdown','document','guide', false, true,
    'intake_family_communication','Reference for the SMS + email template library used from the Parent Communication page.', ARRAY['parent_communication','templates']::text[],'department_only','staff'),

  -- FORMS AND MISSING INFORMATION
  ('Initial Forms — Current Operations','L2-Initial-Forms-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_forms','How initial intake forms are collected and processed today.', ARRAY['initial_forms','forms']::text[],'department_only','staff'),
  ('Consent Forms — Current Operations','L2-Consent-Forms-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_forms','Consent form collection process.', ARRAY['consent','forms']::text[],'department_only','staff'),
  ('Missing Information — Current Operations','L2-Missing-Information-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_forms','How to chase missing information from families and referrals.', ARRAY['missing_information','forms']::text[],'department_only','staff'),
  ('Need Diagnosis — Current Operations','L2-Need-Diagnosis-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_forms','What to do when a lead needs a diagnosis.', ARRAY['need_diagnosis','diagnosis','forms']::text[],'department_only','staff'),
  ('Review Packet — Current Operations','L2-Review-Packet-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_forms','Preparing and reviewing the intake packet.', ARRAY['review_packet','forms']::text[],'department_only','staff'),

  -- INSURANCE, BENEFITS, VOB
  ('Insurance Collection — Current Operations','L2-Insurance-Collection-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_insurance_vob','How Intake collects insurance information from families.', ARRAY['insurance','benefits','vob']::text[],'department_only','staff'),
  ('Insurance and Benefits Handoff Process SOP','L2-Insurance-and-Benefits-Handoff-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_insurance_vob','Handoff of insurance and benefits to the VOB / auth teams.', ARRAY['insurance','benefits','vob','handoff']::text[],'department_only','staff'),
  ('VOB Submission — Current Operations','L2-VOB-Submission-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_insurance_vob','Submitting the VOB request today.', ARRAY['vob','insurance','benefits']::text[],'department_only','staff'),
  ('VOB Review — Current Operations','L2-VOB-Review-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_insurance_vob','Reviewing the returned VOB and next steps.', ARRAY['vob','insurance','benefits']::text[],'department_only','staff'),
  ('Payment Plans — Current Operations','L2-Payment-Plans-Current-Operations.pdf','application/pdf','policy','sop', true, false,
    'intake_insurance_vob','Setting up and communicating payment plans.', ARRAY['payment_plan','insurance']::text[],'department_only','staff'),

  -- AFTER-HOURS AI & CALL REVIEW
  ('After-Hours AI Call Review Process SOP','L2-After-Hours-AI-Call-Review-Process-SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_afterhours','Reviewing the after-hours AI receptionist calls each morning.', ARRAY['after_hours','ai_call','retell']::text[],'department_only','staff'),
  ('Phone System & After-Hours Call Handling SOP','Phone System & After-Hours Call Handling SOP.pdf','application/pdf','policy','sop', true, false,
    'intake_afterhours','Phone system and after-hours call handling reference.', ARRAY['after_hours','phone_calls','ai_call']::text[],'department_only','staff'),

  -- TRAINING
  ('Intake Department 4-Week Current-State Onboarding Journey','Intake Department 4-Week Current-State Onboarding Journey - 2026-07-14.md','text/markdown','document','training', false, true,
    'intake_training','Prompt / reference used to author the current-state Intake onboarding journey.', ARRAY['training','onboarding_journey']::text[],'department_only','staff'),
  ('Intake Training Video Requirements','Intake Training Video Requirements - 2026-07-14.md','text/markdown','document','training', false, true,
    'intake_training','Master list of Intake training videos required and their upload status.', ARRAY['training','video_requirements','admin']::text[],'leadership_only','lead'),

  -- TRAINING VIDEOS (real)
  ('Monday.com Lead Intake to Solum Workflow','Monday.com Lead Intake to Solum Workflow.mp4','video/mp4','video','video', false, true,
    'intake_training','Walkthrough: moving a new lead from Monday.com into Solum.', ARRAY['training','video','monday','solum']::text[],'department_only','staff'),
  ('Manually Add Patients to Solum and Run Benefits','Manually Add Patients to Solent and Run Benefits.mp4','video/mp4','video','video', false, true,
    'intake_insurance_vob','Walkthrough: manually adding a patient to Solum and running benefits.', ARRAY['training','video','solum','benefits','insurance']::text[],'department_only','staff'),
  ('Solum Webhook and VOB Status Workflow','Solum Webhook and VOB Status Workflow.mp4','video/mp4','video','video', false, true,
    'intake_insurance_vob','Walkthrough: Solum webhook, VOB status updates, and handoff.', ARRAY['training','video','solum','vob','webhook']::text[],'department_only','staff'),
  ('After-Hours Retell AI Receptionist Walkthrough','After Hours Retell AI Receptionist Walkthrough.mp4','video/mp4','video','video', false, true,
    'intake_afterhours','Walkthrough: reviewing after-hours Retell AI receptionist calls.', ARRAY['training','video','after_hours','ai_call','retell']::text[],'department_only','staff'),

  -- CHEAT SHEETS
  ('Lead Benefits Cheat Sheet','Lead Benefits Cheat Sheet.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','cheat_sheet', false, false,
    'intake_cheatsheets','Quick reference for lead benefits.', ARRAY['cheat_sheet','benefits','insurance','vob']::text[],'department_only','staff'),
  ('Lead Benefits Cheat Sheets — Export A','Lead_Benefits_Cheat_Sheets_1781640821.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','cheat_sheet', false, false,
    'intake_cheatsheets','Board export of lead benefits cheat sheets.', ARRAY['cheat_sheet','benefits','insurance','export']::text[],'department_only','staff'),
  ('Lead Benefits Cheat Sheets — Export B','Lead_Benefits_Cheat_Sheets_1782177836.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','cheat_sheet', false, false,
    'intake_cheatsheets','Board export of lead benefits cheat sheets.', ARRAY['cheat_sheet','benefits','insurance','export']::text[],'department_only','staff'),
  ('All Insurance By State','All Insurance By State.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','reference', false, false,
    'intake_cheatsheets','Reference of accepted insurance by state.', ARRAY['insurance','state','reference']::text[],'department_only','staff'),
  ('Insurance Rates By State','Insurance Rates By State.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','reference', false, false,
    'intake_cheatsheets','Reference of insurance rates by state.', ARRAY['insurance','rates','state','reference']::text[],'department_only','staff'),
  ('No OON Benefits','No_OON_Benefits_1781640908.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','reference', false, false,
    'intake_cheatsheets','Export listing payers with no OON benefits.', ARRAY['insurance','oon','benefits','reference']::text[],'department_only','staff'),

  -- BOARD EXPORTS
  ('Leads Board Export','Leads_1781640863.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'intake_board_exports','Example export of the current Leads board.', ARRAY['board_export','leads']::text[],'department_only','staff'),
  ('Clients Board Export','Clients_1781640882.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'intake_board_exports','Example export of the Clients board (transition-to-client context).', ARRAY['board_export','clients','leadership']::text[],'leadership_only','lead'),
  ('After Hours AI Calls Export','After_Hours_AI_Calls_1781640845.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'intake_board_exports','Export of after-hours AI receptionist calls for review.', ARRAY['board_export','after_hours','ai_call','retell']::text[],'department_only','staff'),
  ('Savannah Intake Marketing Outreach','Savannah Intake Marketing Outreach .xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'intake_board_exports','Marketing outreach tracker for Savannah intake.', ARRAY['board_export','marketing','outreach','savannah']::text[],'department_only','staff'),
  ('Tennessee Intake Marketing Outreach','Tennessee Intake Marketing Outreach .xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
    'intake_board_exports','Marketing outreach tracker for Tennessee intake.', ARRAY['board_export','marketing','outreach','tennessee']::text[],'department_only','staff'),

  -- FORMS & CURRENT PROCESS REFERENCES (DOCX)
  ('Intake Follow-up Process','Intake Follow-up Process.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
    'intake_forms_references','Reference doc: current Intake follow-up process.', ARRAY['follow_up','reference']::text[],'department_only','staff'),
  ('Leads Board Reference','Leads Board.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
    'intake_forms_references','Reference doc: current Leads board layout and columns.', ARRAY['leads_board','reference']::text[],'department_only','staff'),
  ('Consent Form for Use and Disclosure of Public Health Information','Consent Form for Use and Disclosure of Public Health Information.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','form','template', false, false,
    'intake_forms_references','Consent / public health information disclosure form reference.', ARRAY['consent','form','template','phi']::text[],'department_only','staff'),

  -- ADMIN QA
  ('Intake Resource Library — Uploaded Docs Availability Prompt','Intake Resource Library Uploaded Docs Availability Prompt - 2026-07-14.md','text/markdown','document','admin_reference', false, false,
    'intake_admin_qa','Admin reconciliation reference for the Intake resource pack.', ARRAY['admin','qa','reconciliation']::text[],'admin_only','lead')
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
  'intake-resources',
  f.file_name,
  f.mime_type,
  CASE WHEN f.audience = 'staff' THEN (SELECT r FROM staff_roles) ELSE (SELECT r FROM lead_roles) END,
  ARRAY[]::text[],
  f.vis_level,
  ARRAY['intake']::text[],
  ARRAY['intake', f.subcategory] || f.tags_extra,
  f.resource_type,
  true,
  'published',
  'available',
  CASE WHEN f.audience = 'lead' THEN 'internal' ELSE 'public_internal' END,
  false,
  f.sopr,
  f.trainr,
  'FINAL - Intake Resource Library Upload - 2026-07-14',
  'Seeded from FINAL - Intake Resource Library Upload - 2026-07-14',
  false,
  0
FROM files f;