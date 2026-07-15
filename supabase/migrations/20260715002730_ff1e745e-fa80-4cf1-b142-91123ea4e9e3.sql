
DROP POLICY IF EXISTS "Authenticated can read staffing-resources" ON storage.objects;
CREATE POLICY "Authenticated can read staffing-resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'staffing-resources');

DELETE FROM public.hr_resources WHERE storage_bucket = 'staffing-resources';

WITH staff_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'doo','director_of_operations',
    'staffing','staffing_lead','staffing_coordinator','staffing_team',
    'scheduling','scheduling_lead','scheduling_coordinator','scheduling_team',
    'recruiting','recruiter','recruiting_lead','recruiting_manager',
    'state_director','assistant_state_director'
  ]::text[] AS r
), admin_roles AS (
  SELECT ARRAY['super_admin','training_management']::text[] AS r
),
files (title, file_name, mime_type, kind, resource_type, sopr, trainr,
       subcategory, description, tags_extra, vis_level, audience) AS (VALUES

-- START HERE
('Staffing Resource Inventory (Final)','00 - FINAL Staffing Resource Inventory.csv','text/csv','document','report_reference', false, false,
 'staff_start_here','Canonical inventory of every current-state Staffing resource.', ARRAY['inventory','start_here']::text[],'department_only','staff'),
('Staffing Department SOP Book','00 - Dept SOP Book - Staffing - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_start_here','Complete department-level SOP book for Staffing.', ARRAY['sop_book','department']::text[],'department_only','staff'),
('Staffing Coordinator — Role SOP','R-SOP - Staffing-Coordinator - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_start_here','Day-to-day responsibilities of the Staffing Coordinator.', ARRAY['role_sop']::text[],'department_only','staff'),

-- CORE STAFFING SOPS
('Case Staffing Match SOP','A-SOP - Case-Staffing-Match - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_sops','How Staffing matches open cases to available staff.', ARRAY['case_match','open_cases']::text[],'department_only','staff'),
('Hours Serviced Staffing Review SOP','A-SOP - Hours-Serviced-Staffing-Review - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_sops','How Staffing reviews hours serviced against staffing.', ARRAY['hours_serviced','kpi']::text[],'department_only','staff'),
('Open Case Staffing Follow-Up SOP','A-SOP - Open-Case-Staffing-Follow-Up - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_sops','How Staffing follows up on open cases.', ARRAY['open_cases','follow_up']::text[],'department_only','staff'),
('RBT Availability Update SOP','A-SOP - RBT-Availability-Update - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_sops','How RBT availability is captured and updated for Staffing.', ARRAY['rbt_availability','coverage']::text[],'department_only','staff'),
('Staffing Escalation to Recruiting SOP','A-SOP - Staffing-Escalation-to-Recruiting - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_sops','When and how Staffing escalates gaps to Recruiting.', ARRAY['recruiting_handoff','escalation']::text[],'department_only','staff'),
('Complete Role SOP Book','21 - Complete Role SOP Book - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_sops','Full compiled role-level SOP book for Staffing Coordinator.', ARRAY['sop_book']::text[],'department_only','staff'),

-- OPEN CASES AND CASE MATCHING
('Pairing Process — Academy Guide','072 - pairing-process-academy-guide.pdf','application/pdf','document','guide', false, true,
 'staff_open_cases','Academy guide for the pairing process.', ARRAY['pairing_process']::text[],'department_only','staff'),
('Family Staffing Preference SOP','Blossom ABA Therapy - Family Staffing Preference SOP.pdf','application/pdf','policy','sop', true, true,
 'staff_open_cases','How family staffing preferences are captured and honored.', ARRAY['family_preferences']::text[],'department_only','staff'),

-- RBT AVAILABILITY AND COVERAGE
('Coverage Gaps — Academy Guide','070 - coverage-gaps-academy-guide.pdf','application/pdf','document','guide', false, true,
 'staff_coverage','Academy guide for identifying and closing coverage gaps.', ARRAY['coverage_gaps','coverage']::text[],'department_only','staff'),
('Coverage Risks — Academy Guide','061 - coverage-risks-academy-guide.pdf','application/pdf','document','guide', false, true,
 'staff_coverage','Academy guide for coverage risks and mitigation.', ARRAY['coverage_risks','coverage']::text[],'department_only','staff'),
('Staffing Structure — Academy Guide','066 - staffing-structure-academy-guide.pdf','application/pdf','document','guide', false, true,
 'staff_coverage','Academy guide to Blossom''s staffing structure.', ARRAY['structure']::text[],'department_only','staff'),

-- HOURS SERVICED AND STAFFING KPIS
('Staffing KPIs — Academy Guide','087 - staffing-kpis-academy-guide.pdf','application/pdf','document','guide', false, true,
 'staff_kpis','Academy guide covering Staffing KPIs.', ARRAY['kpi']::text[],'department_only','staff'),
('Staffing Playbook','126 - staffing-playbook.pdf','application/pdf','document','guide', false, true,
 'staff_kpis','Approved Staffing playbook reference.', ARRAY['playbook']::text[],'department_only','staff'),

-- ESCALATIONS AND RECRUITING HANDOFF
('Staffing Escalations — Academy Guide','096 - staffing-escalations-academy-guide.pdf','application/pdf','document','guide', false, true,
 'staff_escalations','Academy guide for Staffing escalations.', ARRAY['escalation','recruiting_handoff']::text[],'department_only','staff'),

-- TRAINING, SHADOWING, ROLE PACKET
('Staffing Team — 4-Week Current-State Onboarding Journey','Staffing Team 4-Week Current-State Onboarding Journey - 2026-07-14.md','text/markdown','document','guide', false, true,
 'staff_training','4-week current-state onboarding journey for the Staffing team.', ARRAY['journey','onboarding']::text[],'department_only','staff'),
('Current Blossom Staffing Packet','17 - Current Blossom Packet.pdf','application/pdf','document','guide', false, true,
 'staff_training','Current-state Blossom Staffing packet reference.', ARRAY['packet','current']::text[],'department_only','staff'),
('Staffing — Job Packet','17 - Job Packet.pdf','application/pdf','document','guide', false, true,
 'staff_training','Staffing job packet.', ARRAY['job_packet']::text[],'department_only','staff'),
('Role SOP Acknowledgement','21 - Role SOP Acknowledgement - 2026-07-10.pdf','application/pdf','document','guide', false, true,
 'staff_training','Staffing role SOP acknowledgement form.', ARRAY['acknowledgement','signoff']::text[],'department_only','staff'),
('Complete Department SOP Book','12 - Complete Department SOP Book - 2026-07-10.pdf','application/pdf','policy','sop', true, true,
 'staff_training','Full compiled department SOP book.', ARRAY['sop_book','department']::text[],'department_only','staff'),
('Action SOP Field Manual','10 - Action SOP Field Manual - 2026-07-10.pdf','application/pdf','document','guide', false, true,
 'staff_training','Action SOP field manual for Staffing operators.', ARRAY['field_manual']::text[],'department_only','staff'),

-- REPORTS, EXPORTS, EXAMPLES (admin/leadership)
('Staffing Lead — Owner/Review Worklist','28 - Staffing Lead Confirm Sara Uhr If Current.csv','text/csv','document','report_reference', false, false,
 'staff_reports','Staffing owner/review worklist snapshot — leadership reference only.', ARRAY['worklist','snapshot']::text[],'leadership_only','leadership'),

-- ADMIN QA / NEEDS REVIEW / FUTURE
('Staffing — Current vs Future Overview','00 - 10 - Staffing Current vs Future Overview.pdf','application/pdf','document','guide', false, false,
 'staff_admin_qa','Future-facing planning document — admin only, not current process training.', ARRAY['future','planning']::text[],'admin_only','admin'),
('Training — Current vs Future Addendum','17 - Training Current vs Future Addendum.pdf','application/pdf','document','guide', false, false,
 'staff_admin_qa','Future-facing training addendum — admin only.', ARRAY['future','training_planning']::text[],'admin_only','admin'),
('Training Journey and 30-60-90 (Future)','17 - Training Journey and 30-60-90.pdf','application/pdf','document','guide', false, false,
 'staff_admin_qa','Future 30/60/90 training journey — admin only planning reference.', ARRAY['future','30_60_90']::text[],'admin_only','admin'),
('Owner Confirmation — Staffing','12 - Owner Confirmation - Staffing - 2026-07-10.pdf','application/pdf','document','guide', false, false,
 'staff_admin_qa','Owner confirmation admin document — admin only.', ARRAY['admin','owner']::text[],'admin_only','admin'),
('Staffing — Disk File Audit (Final)','00 - FINAL Staffing Disk File Audit.csv','text/csv','document','report_reference', false, false,
 'staff_admin_qa','Final disk-level audit of Staffing source files — admin only.', ARRAY['admin','audit']::text[],'admin_only','admin'),
('Staffing Resource Library — Uploaded Docs Availability Prompt','Staffing Resource Library Uploaded Docs Availability Prompt - 2026-07-14.md','text/markdown','document','guide', false, false,
 'staff_admin_qa','Internal Lovable sprint prompt — admin only.', ARRAY['admin','sprint','prompt']::text[],'admin_only','admin')
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
  'staffing-resources',
  f.file_name,
  f.mime_type,
  CASE f.audience
    WHEN 'staff' THEN (SELECT r FROM staff_roles)
    WHEN 'leadership' THEN ARRAY['super_admin','executive_leadership','operations_leadership','training_management','doo','director_of_operations','state_director','assistant_state_director','staffing_lead']::text[]
    ELSE (SELECT r FROM admin_roles)
  END,
  ARRAY[]::text[],
  f.vis_level,
  ARRAY['staffing']::text[],
  ARRAY['staffing', f.subcategory] || f.tags_extra,
  f.resource_type,
  true,
  'published',
  'available',
  CASE WHEN f.audience = 'staff' THEN 'public_internal' ELSE 'internal' END,
  false,
  f.sopr,
  f.trainr,
  'FINAL - Staffing Resource Library Upload - 2026-07-14',
  'Seeded from FINAL - Staffing Resource Library Upload - 2026-07-14',
  false,
  0
FROM files f;
