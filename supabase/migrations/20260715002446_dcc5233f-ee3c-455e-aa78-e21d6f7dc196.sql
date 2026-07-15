
-- 1) Storage RLS for the scheduling-resources bucket
DROP POLICY IF EXISTS "Authenticated can read scheduling-resources" ON storage.objects;
CREATE POLICY "Authenticated can read scheduling-resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'scheduling-resources');

-- 2) Clear prior seed for this bucket (idempotent)
DELETE FROM public.hr_resources WHERE storage_bucket = 'scheduling-resources';

-- 3) Seed rows
WITH staff_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'scheduling','scheduling_lead','scheduling_coordinator','scheduling_team',
    'doo','director_of_operations',
    'state_director','assistant_state_director'
  ]::text[] AS r
), admin_roles AS (
  SELECT ARRAY['super_admin','training_management']::text[] AS r
),
files (title, file_name, mime_type, kind, resource_type, sopr, trainr,
       subcategory, description, tags_extra, vis_level, audience) AS (VALUES

-- START HERE
('Scheduling Resource Inventory (Final)','00 - FINAL Scheduling Resource Inventory.csv','text/csv','document','report_reference', false, false,
  'sched_start_here','Canonical inventory of every current-state Scheduling resource.', ARRAY['inventory','start_here']::text[],'department_only','staff'),
('Scheduling Resource Collection Index','00 - Scheduling Resource Collection Index.pdf','application/pdf','document','guide', false, true,
  'sched_start_here','Reader-friendly index of the Scheduling resource collection.', ARRAY['index','start_here']::text[],'department_only','staff'),

-- SCHEDULING SOPS (learner-facing PDFs)
('Scheduling Coordinator — Role SOP','L1-Scheduling-Coordinator-Role-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_sops','Day-to-day responsibilities of the Scheduling Coordinator role.', ARRAY['role_sop']::text[],'department_only','staff'),
('Family Scheduling Communication Process SOP','L2-Family-Scheduling-Communication-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_sops','How Scheduling communicates with families about appointments and changes.', ARRAY['family_communication']::text[],'department_only','staff'),
('Clinic Scheduling — Current Operations','L2-Clinic-Scheduling-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_sops','Current-state process for clinic-based scheduling.', ARRAY['clinic']::text[],'department_only','staff'),
('Field Scheduling — Current Operations','L2-Field-Scheduling-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_sops','Current-state process for in-home / field scheduling.', ARRAY['field','in_home']::text[],'department_only','staff'),
('Open Case Staffing Follow-Up Process SOP','L2-Open-Case-Staffing-Follow-Up-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_sops','How Scheduling follows up on open case staffing needs.', ARRAY['staffing','follow_up']::text[],'department_only','staff'),
('Staffing Escalation to Recruiting Process SOP','L2-Staffing-Escalation-to-Recruiting-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_sops','When and how Scheduling escalates staffing gaps to Recruiting.', ARRAY['staffing','recruiting','escalation']::text[],'department_only','staff'),

-- CENTRALREACH SCHEDULING REFERENCES
('How to Schedule an Appointment in CentralReach','RFO-00633 - How_to_Schedule_an_Appointment_in_CentralReach.pdf','application/pdf','document','guide', false, true,
  'sched_cr_references','Step-by-step reference for scheduling an appointment in CentralReach.', ARRAY['centralreach','appointment']::text[],'department_only','staff'),
('Canceling and Deleting Sessions in CentralReach','RFO-00631 - Canceling_and_Deleting_Sessions.pdf','application/pdf','document','guide', false, true,
  'sched_cr_references','Reference for canceling and deleting sessions in CentralReach.', ARRAY['centralreach','cancellation']::text[],'department_only','staff'),
('Connecting Employees and Clients (CentralReach)','RFO-00632 - Connecting_Employees_and_Clients.pdf','application/pdf','document','guide', false, true,
  'sched_cr_references','How to connect employees and clients in CentralReach.', ARRAY['centralreach','connections']::text[],'department_only','staff'),
('CentralReach Schedule Sync Check Process SOP','L2-CentralReach-Schedule-Sync-Check-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_cr_references','SOP for verifying CentralReach schedule sync.', ARRAY['centralreach','sync','sop']::text[],'department_only','staff'),
('CentralReach — Scheduling Tab, Search, Views & Permissions','Scheduling Tab Search, Views, and Permissions.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough of the CentralReach scheduling tab, search, views, and permissions.', ARRAY['video','centralreach','permissions']::text[],'department_only','staff'),
('How to Connect Employee Schedule Permissions','How to Connect Employee Schedule Permissions.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough of employee schedule permissions in CentralReach.', ARRAY['video','centralreach','permissions']::text[],'department_only','staff'),
('CR Video 1 — Adding Admin Rate for RBTs','RFO-00424 - 1._Adding_Admin_Rate_for_RBTs.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: adding admin rate for RBTs in CentralReach.', ARRAY['video','centralreach','admin_rate']::text[],'department_only','staff'),
('CR Video 2 — Adding Admin Rate to an Existing Appt','RFO-00428 - 2._Adding_Admin_Rate_to_an_Existing_Appt.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: adding admin rate to an existing appointment.', ARRAY['video','centralreach','admin_rate']::text[],'department_only','staff'),
('CR Video 3 — Adding Admin Rate Without an Appt (Converting Session)','RFO-00429 - 3._Adding_Admin_Rate_without_an_Appt_converting_the_session.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: adding admin rate without an appointment (converting the session).', ARRAY['video','centralreach','admin_rate','conversion']::text[],'department_only','staff'),
('CR Video 4 — Shadow Sessions','RFO-00430 - 4._Shadow_Sessions.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: shadow sessions in CentralReach.', ARRAY['video','centralreach','shadow']::text[],'department_only','staff'),
('CR Video 5 — Double-checking Timesheet Changes','RFO-00431 - 5._Double_checking_Timesheets_changes.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: double-checking timesheet changes.', ARRAY['video','centralreach','timesheet']::text[],'department_only','staff'),
('CR Video 6 — Unlocking and Locking Service Codes','RFO-00432 - 6._Unlocking_and_Locking_Service_Codes.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: unlocking and locking service codes.', ARRAY['video','centralreach','service_codes']::text[],'department_only','staff'),
('CR Video 7 — Adjusting a Timesheet','RFO-00433 - 7._Adjusting_a_Timesheet.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: adjusting a timesheet.', ARRAY['video','centralreach','timesheet']::text[],'department_only','staff'),
('CR Video 8 — Adjusting an Appointment That Was Converted','RFO-00434 - 8._Adjusting_an_Appointment_that_Was_Converted.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: adjusting an appointment that was converted.', ARRAY['video','centralreach','appointment','conversion']::text[],'department_only','staff'),
('CR Video 10 — Unconverted Sessions','RFO-00425 - 10._Unconverted_Sessions.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: unconverted sessions in CentralReach.', ARRAY['video','centralreach','unconverted']::text[],'department_only','staff'),
('CR Video 12 — Connections','RFO-00427 - 12._Connections.mp4','video/mp4','video','video', false, true,
  'sched_cr_references','Walkthrough: connections in CentralReach.', ARRAY['video','centralreach','connections']::text[],'department_only','staff'),
('RBT/QA/Client Cancellation — CR Input Guide','RFO-00448 - RBT_QA_or_Client_Cancelation_Scheduling_input_to_CR.pdf','application/pdf','document','guide', false, true,
  'sched_cr_references','How to input RBT/QA/client cancellations into CentralReach.', ARRAY['centralreach','cancellation','input']::text[],'department_only','staff'),

-- ASSESSMENT AND EVALUATION SCHEDULING
('Assessment Scheduling — Current Operations','L2-Assessment-Scheduling-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_assessment','Current-state process for assessment scheduling.', ARRAY['assessment']::text[],'department_only','staff'),
('Evaluation Timeline & Scheduling SOP','Blossom_Evaluation_Timeline_and_Scheduling_SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_assessment','Evaluation timeline and scheduling SOP.', ARRAY['evaluation','timeline']::text[],'department_only','staff'),

-- CLIENT, THERAPIST, AND RBT SCHEDULING
('Client Scheduling — Current Operations','L2-Client-Scheduling-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_client_therapist_rbt','Current-state process for client scheduling.', ARRAY['client']::text[],'department_only','staff'),
('Therapist Scheduling — Current Operations','L2-Therapist-Scheduling-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_client_therapist_rbt','Current-state process for therapist scheduling.', ARRAY['therapist']::text[],'department_only','staff'),
('New Client Schedule Setup Process SOP','L2-New-Client-Schedule-Setup-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_client_therapist_rbt','How to build a schedule for a new client.', ARRAY['new_client','setup']::text[],'department_only','staff'),
('RBT Availability Update Process SOP','L2-RBT-Availability-Update-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_client_therapist_rbt','How RBT availability is captured and updated.', ARRAY['rbt','availability']::text[],'department_only','staff'),
('Pairing Process — Current Operations','L2-Pairing-Process-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_client_therapist_rbt','Current-state process for pairing RBTs and clients.', ARRAY['pairing']::text[],'department_only','staff'),
('Case Staffing Match Process SOP','L2-Case-Staffing-Match-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_client_therapist_rbt','How Scheduling matches cases to staffing.', ARRAY['staffing','match']::text[],'department_only','staff'),

-- SCHEDULE CHANGES, RESCHEDULING, CONFLICTS
('Schedule Change Request Process SOP','L2-Schedule-Change-Request-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_changes','How schedule change requests are captured and processed.', ARRAY['change_request']::text[],'department_only','staff'),
('Schedule Changes — Current Operations','L2-Schedule-Changes-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_changes','Current-state process for schedule changes.', ARRAY['change']::text[],'department_only','staff'),
('Rescheduling — Current Operations','L2-Rescheduling-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_changes','Current-state process for rescheduling.', ARRAY['reschedule']::text[],'department_only','staff'),
('Schedule Conflicts — Current Operations','L2-Schedule-Conflicts-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_changes','Current-state process for handling schedule conflicts.', ARRAY['conflict']::text[],'department_only','staff'),
('Cancellation Analysis (6-15-2026)','Cancellation-Analysis-6-15-2026.pdf','application/pdf','document','report_reference', false, false,
  'sched_changes','Example cancellation analysis report — reference snapshot.', ARRAY['cancellation','analysis','example']::text[],'department_only','staff'),
('CR Video 11 — Cancellation Report','RFO-00426 - 11._Cancellation_Report.mp4','video/mp4','video','video', false, true,
  'sched_changes','Walkthrough: cancellation report in CentralReach.', ARRAY['video','cancellation','centralreach']::text[],'department_only','staff'),

-- COVERAGE, OPEN HOURS, HOURS SERVICED
('Coverage — Current Operations','L2-Coverage-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'sched_coverage','Current-state process for schedule coverage.', ARRAY['coverage']::text[],'department_only','staff'),
('Open Hours and Coverage Review Process SOP','L2-Open-Hours-and-Coverage-Review-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_coverage','Reviewing open hours and coverage.', ARRAY['open_hours','coverage']::text[],'department_only','staff'),
('Hours Serviced Staffing Review Process SOP','L2-Hours-Serviced-Staffing-Review-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'sched_coverage','Reviewing hours serviced against staffing.', ARRAY['hours_serviced','staffing']::text[],'department_only','staff'),
('Schedule Monitoring — Academy Guide','RFO-02092 - schedule_monitoring_academy_guide.pdf','application/pdf','document','guide', false, true,
  'sched_coverage','Academy guide for schedule monitoring.', ARRAY['monitoring','academy']::text[],'department_only','staff'),
('Schedule Optimization — Academy Guide','RFO-02094 - schedule_optimization_academy_guide.pdf','application/pdf','document','guide', false, true,
  'sched_coverage','Academy guide for schedule optimization.', ARRAY['optimization','academy']::text[],'department_only','staff'),
('Scheduling Playbook','RFO-02188 - staffing_playbook.pdf','application/pdf','document','guide', false, true,
  'sched_coverage','Approved scheduling playbook reference.', ARRAY['playbook']::text[],'department_only','staff'),

-- TRAINING, SHADOWING, ROLE PACKET
('Scheduling Team — 4-Week Current-State Onboarding Journey','Scheduling Team 4-Week Current-State Onboarding Journey - 2026-07-14.md','text/markdown','document','guide', false, true,
  'sched_training','4-week current-state onboarding journey for the Scheduling team.', ARRAY['journey','onboarding']::text[],'department_only','staff'),
('Scheduling Department — Academy Guide','RFO-02096 - scheduling_department_academy_guide.pdf','application/pdf','document','guide', false, true,
  'sched_training','Department academy walkthrough.', ARRAY['academy','overview']::text[],'department_only','staff'),
('Scheduling Oversight — Academy Guide','RFO-02098 - scheduling_oversight_academy_guide.pdf','application/pdf','document','guide', false, true,
  'sched_training','Scheduling oversight academy guide.', ARRAY['academy','oversight']::text[],'department_only','staff'),
('Scheduling Shadow — Academy Guide','RFO-02100 - scheduling_shadow_academy_guide.pdf','application/pdf','document','guide', false, true,
  'sched_training','Shadowing guide for Scheduling.', ARRAY['academy','shadow']::text[],'department_only','staff'),
('Scheduling Shadow — Guide (Shadowing Packet)','RFO-07657 - 110_04_Shadowing_109_scheduling_shadow_guide.pdf','application/pdf','document','guide', false, true,
  'sched_training','Shadowing packet reference.', ARRAY['shadow','packet']::text[],'department_only','staff'),
('Scheduling Coordinator — Role Deep Dive','RFO-06329 - 16_Scheduling_Coordinator_Role_Deep_Dive_2026_06_28.pdf','application/pdf','document','guide', false, true,
  'sched_training','Deep dive into the Scheduling Coordinator role.', ARRAY['role','deep_dive']::text[],'department_only','staff'),
('Scheduling — Job Packet','RFO-05939 - 16_Job_Packet.pdf','application/pdf','document','guide', false, true,
  'sched_training','Scheduling job packet.', ARRAY['job_packet']::text[],'department_only','staff'),
('Scheduling Coordinator — Signoff','RFO-05245 - 16_Scheduling_Coordinator_Signoff.pdf','application/pdf','document','guide', false, true,
  'sched_training','Scheduling Coordinator signoff document.', ARRAY['signoff']::text[],'department_only','staff'),
('Scheduling — Binder Index','RFO-05938 - 16_Binder_Index.pdf','application/pdf','document','guide', false, true,
  'sched_training','Index of the Scheduling binder.', ARRAY['binder','index']::text[],'department_only','staff'),
('Current Blossom Scheduling Packet','RFO-04724 - 16_Current_Blossom_Packet.pdf','application/pdf','document','guide', false, true,
  'sched_training','Current-state Blossom Scheduling packet reference.', ARRAY['packet']::text[],'department_only','staff'),

-- BOARD EXPORTS AND EXAMPLES
('Cancellations NC (05-23 to 05-29-2026)','Cancellations NC 05-23-2026 to 05-29-2026.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'sched_exports','Example NC cancellations spreadsheet snapshot — reference only.', ARRAY['nc','cancellation','export','example']::text[],'department_only','staff'),
('Appointment Export Summary','RFO-01328 - appointment_export_summary.csv','text/csv','document','report_reference', false, false,
  'sched_exports','Example appointment export summary — reference snapshot.', ARRAY['appointment','export','example']::text[],'department_only','staff'),

-- NEEDS REVIEW / SCHEDULING ADJACENT (admin only)
('Staffing Playbook (Needs Review)','RFO-00958 - 126_staffing_playbook.pdf','application/pdf','document','guide', false, false,
  'sched_admin_qa','Staffing-adjacent playbook — held for trainer review before general release.', ARRAY['needs_review','staffing']::text[],'admin_only','admin'),
('Source Doc — Scheduling Playbook (Needs Review)','RFO-07530 - 145_02_Source_Document_scheduling_playbook.pdf','application/pdf','document','guide', false, false,
  'sched_admin_qa','Source-document version of the scheduling playbook — admin only.', ARRAY['needs_review','source','playbook']::text[],'admin_only','admin'),
('Scheduling — Disk File Audit (Final)','00 - FINAL Scheduling Disk File Audit.csv','text/csv','document','report_reference', false, false,
  'sched_admin_qa','Final disk-level audit of Scheduling source files — admin only.', ARRAY['admin','audit']::text[],'admin_only','admin'),
('Scheduling — Resource Collection Index (Source CSV)','00 - Scheduling Resource Collection Index.csv','text/csv','document','report_reference', false, false,
  'sched_admin_qa','Source CSV of the Scheduling resource collection index — admin only.', ARRAY['admin','index']::text[],'admin_only','admin'),
('Scheduling Resource Library — Uploaded Docs Availability Prompt','Scheduling Resource Library Uploaded Docs Availability Prompt - 2026-07-14.md','text/markdown','document','guide', false, false,
  'sched_admin_qa','Internal Lovable sprint prompt — admin only.', ARRAY['admin','sprint','prompt']::text[],'admin_only','admin')
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
  'scheduling-resources',
  f.file_name,
  f.mime_type,
  CASE f.audience
    WHEN 'staff' THEN (SELECT r FROM staff_roles)
    ELSE (SELECT r FROM admin_roles)
  END,
  ARRAY[]::text[],
  f.vis_level,
  ARRAY['scheduling']::text[],
  ARRAY['scheduling', f.subcategory] || f.tags_extra,
  f.resource_type,
  true,
  'published',
  'available',
  CASE WHEN f.audience = 'staff' THEN 'public_internal' ELSE 'internal' END,
  false,
  f.sopr,
  f.trainr,
  'FINAL - Scheduling Resource Library Upload - 2026-07-14',
  'Seeded from FINAL - Scheduling Resource Library Upload - 2026-07-14',
  false,
  0
FROM files f;
