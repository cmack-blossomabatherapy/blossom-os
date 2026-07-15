
-- 1) Storage RLS for the authorizations-resources bucket
DROP POLICY IF EXISTS "Authenticated can read authorizations-resources" ON storage.objects;
CREATE POLICY "Authenticated can read authorizations-resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'authorizations-resources');

-- 2) Clear prior seed for this bucket (idempotent)
DELETE FROM public.hr_resources WHERE storage_bucket = 'authorizations-resources';

-- 3) Seed rows
WITH staff_roles AS (
  SELECT ARRAY[
    'super_admin','executive_leadership','operations_leadership','training_management',
    'authorizations','authorizations_lead','utilization_manager',
    'director_of_rcm','rcm','benefits',
    'state_director','assistant_state_director',
    'clinical_director','bcba_lead'
  ]::text[] AS r
), credential_roles AS (
  SELECT ARRAY[
    'super_admin','training_management',
    'authorizations_lead','credentialing','hr_lead','hr'
  ]::text[] AS r
), admin_roles AS (
  SELECT ARRAY['super_admin','training_management']::text[] AS r
),
files (title, file_name, mime_type, kind, resource_type, sopr, trainr,
       subcategory, state, payer, description, tags_extra, vis_level, audience) AS (VALUES

-- START HERE
('Authorizations — Overview (Current Operations)','L1-Overview-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_start_here', NULL, NULL, 'High-level overview of how Authorizations operates today.', ARRAY['overview','start_here']::text[],'department_only','staff'),
('Authorizations / Utilization Manager — Role SOP','L1-Authorizations-Utilization-Manager-Role-SOP.pdf','application/pdf','policy','sop', true, false,
  'auth_start_here', NULL, NULL, 'Day-to-day responsibilities of the Authorizations / Utilization Manager role.', ARRAY['role_sop','start_here']::text[],'department_only','staff'),
('Authorizations Department Academy Guide','RFO-01964 - authorizations_department_academy_guide.pdf','application/pdf','document','guide', false, true,
  'auth_start_here', NULL, NULL, 'Department academy walkthrough — how Authorizations fits into current operations.', ARRAY['overview','academy']::text[],'department_only','staff'),

-- INITIAL AUTHORIZATION
('Initial Authorization — Current Operations','L2-Initial-Authorization-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_initial', NULL, NULL, 'How initial authorizations are handled today.', ARRAY['initial','sop']::text[],'department_only','staff'),
('Initial Authorization Submission Process SOP','L2-Initial-Authorization-Submission-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'auth_initial', NULL, NULL, 'Step-by-step SOP for submitting an initial authorization.', ARRAY['initial','submission','sop']::text[],'department_only','staff'),
('Assessment Submission — Walkthrough','RFO-00573 - Assessment_Submission.mp4','video/mp4','video','video', false, true,
  'auth_initial', NULL, NULL, 'Video walkthrough: assessment submission for initial authorizations.', ARRAY['video','initial','assessment']::text[],'department_only','staff'),
('Cover Sheet — Walkthrough','RFO-00574 - Cover_Sheet.mp4','video/mp4','video','video', false, true,
  'auth_initial', NULL, NULL, 'Video walkthrough: preparing the cover sheet for authorization submissions.', ARRAY['video','cover_sheet','submission']::text[],'department_only','staff'),
('ABA Preauth Form (Reference)','ABA Preauth Form.pdf','application/pdf','form','template', false, false,
  'auth_initial', NULL, NULL, 'Reference ABA preauthorization form.', ARRAY['form','preauth','initial']::text[],'department_only','staff'),
('Anthem — Auth Request Form','Anthem Request.pdf','application/pdf','form','template', false, false,
  'auth_initial', NULL, 'Anthem', 'Anthem authorization request form.', ARRAY['form','anthem','initial']::text[],'department_only','staff'),
('DMAS — Initial Authorization Form','dmas_initial_auth.pdf','application/pdf','form','template', false, false,
  'auth_initial', 'VA', 'DMAS', 'Virginia DMAS initial authorization request form.', ARRAY['form','dmas','virginia','initial']::text[],'department_only','staff'),
('TennCare / Wellpoint — Initial Auth Request','Tenncare.Wellpoint IA Request.pdf','application/pdf','form','template', false, false,
  'auth_initial', 'TN', 'Wellpoint / TennCare', 'TennCare / Wellpoint initial authorization request form.', ARRAY['form','tenncare','wellpoint','initial']::text[],'department_only','staff'),
('BCBS IL — Auth Request','BCBS IL.pdf','application/pdf','form','template', false, false,
  'auth_initial', NULL, 'BCBS IL', 'BCBS IL authorization request form.', ARRAY['form','bcbs','initial']::text[],'department_only','staff'),
('NC Wellcare — Initial Auth Request','NC - Wellcare IA.pdf','application/pdf','form','template', false, false,
  'auth_initial', 'NC', 'Wellcare', 'NC Wellcare initial authorization request form.', ARRAY['form','wellcare','nc','initial']::text[],'department_only','staff'),
('NC Healthy Blue — Auth Request','NC Healthy Blue Request.pdf','application/pdf','form','template', false, false,
  'auth_initial', 'NC', 'Healthy Blue', 'NC Healthy Blue authorization request form.', ARRAY['form','healthy_blue','nc','initial']::text[],'department_only','staff'),
('Amerihealth — Auth Reference','Amerihealth.pdf','application/pdf','form','template', false, false,
  'auth_initial', NULL, 'Amerihealth', 'Amerihealth authorization reference PDF.', ARRAY['form','amerihealth','initial']::text[],'department_only','staff'),

-- TREATMENT AUTHORIZATION
('Treatment Authorization — Current Operations','L2-Treatment-Authorization-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_treatment', NULL, NULL, 'How treatment authorizations are handled today.', ARRAY['treatment','sop']::text[],'department_only','staff'),
('Treatment Submission — Walkthrough','RFO-00575 - Treatment_submission.mp4','video/mp4','video','video', false, true,
  'auth_treatment', NULL, NULL, 'Video walkthrough: treatment authorization submission.', ARRAY['video','treatment','submission']::text[],'department_only','staff'),
('DMAS — Continued Stay Auth Form','dmas_continued_stay_auth.pdf','application/pdf','form','template', false, false,
  'auth_treatment', 'VA', 'DMAS', 'Virginia DMAS continued stay authorization form.', ARRAY['form','dmas','virginia','treatment','continued_stay']::text[],'department_only','staff'),
('Amerigroup — IT / CT Request','Amerigroup IT.CT Request.pdf','application/pdf','form','template', false, false,
  'auth_treatment', NULL, 'Amerigroup', 'Amerigroup Initial Treatment / Continued Treatment request form.', ARRAY['form','amerigroup','treatment']::text[],'department_only','staff'),
('TennCare / Wellpoint — IT / CT Request','Tenncare.Wellpoint IT.CT Request.pdf','application/pdf','form','template', false, false,
  'auth_treatment', 'TN', 'Wellpoint / TennCare', 'TennCare / Wellpoint IT/CT request form.', ARRAY['form','tenncare','wellpoint','treatment']::text[],'department_only','staff'),
('NC Wellcare — IT Request','NC - Wellcare IT.pdf','application/pdf','form','template', false, false,
  'auth_treatment', 'NC', 'Wellcare', 'NC Wellcare initial treatment request form.', ARRAY['form','wellcare','nc','treatment']::text[],'department_only','staff'),

-- REASSESSMENT / RENEWALS / EXPIRING
('Reassessment — Current Operations','L2-Reassessment-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_reassessment', NULL, NULL, 'Current process for reassessment.', ARRAY['reassessment','sop']::text[],'department_only','staff'),
('Renewals — Current Operations','L2-Renewals-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_reassessment', NULL, NULL, 'Current process for renewals.', ARRAY['renewal','sop']::text[],'department_only','staff'),
('Expiring Authorizations — Current Operations','L2-Expiring-Authorizations-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_reassessment', NULL, NULL, 'Current process for handling expiring authorizations.', ARRAY['expiring','sop']::text[],'department_only','staff'),

-- PENDING / APPROVED / DENIED
('Pending Authorization Follow-Up Process SOP','L2-Pending-Authorization-Follow-Up-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'auth_pending_approved_denied', NULL, NULL, 'How pending authorizations are followed up on.', ARRAY['pending','sop']::text[],'department_only','staff'),
('Approved Authorization Update Process SOP','L2-Approved-Authorization-Update-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'auth_pending_approved_denied', NULL, NULL, 'How approved authorizations are logged and communicated.', ARRAY['approved','sop']::text[],'department_only','staff'),
('Denials — Current Operations','L2-Denials-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_pending_approved_denied', NULL, NULL, 'Current process for handling authorization denials.', ARRAY['denial','sop']::text[],'department_only','staff'),
('Denial Review and Escalation Process SOP','L2-Denial-Review-and-Escalation-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'auth_pending_approved_denied', NULL, NULL, 'How to review and escalate denied authorizations.', ARRAY['denial','escalation','sop']::text[],'department_only','staff'),
('Approved Auths — Board Export','Approved_Auths_1781640959.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'auth_pending_approved_denied', NULL, NULL, 'Reference export of currently approved authorizations.', ARRAY['export','approved','board']::text[],'department_only','staff'),
('Denials — Board Export','Denials_1781640983.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'auth_pending_approved_denied', NULL, NULL, 'Reference export of denied authorizations.', ARRAY['export','denial','board']::text[],'department_only','staff'),
('Authorizations — Board Export','Authorizations_1781640940.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'auth_pending_approved_denied', NULL, NULL, 'Reference export of the Authorizations board.', ARRAY['export','authorizations','board']::text[],'department_only','staff'),

-- DOCUMENTATION AND QA
('Missing Documentation — Current Operations','L2-Missing-Documentation-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_docs_qa', NULL, NULL, 'How missing documentation is identified and resolved.', ARRAY['missing_docs','sop']::text[],'department_only','staff'),
('QA Submission — Current Operations','L2-QA-Submission-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_docs_qa', NULL, NULL, 'QA process for authorization submissions.', ARRAY['qa','submission','sop']::text[],'department_only','staff'),

-- BCBA ASSIGNMENT AND INSURANCE
('BCBA Assignment Confirmation Process SOP','L2-BCBA-Assignment-Confirmation-Process-SOP.pdf','application/pdf','policy','sop', true, false,
  'auth_bcba_insurance', NULL, NULL, 'How BCBA assignment is confirmed for authorizations.', ARRAY['bcba_assignment','sop']::text[],'department_only','staff'),
('Primary Insurance — Current Operations','L2-Primary-Insurance-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_bcba_insurance', NULL, NULL, 'Current process for primary insurance authorizations.', ARRAY['primary_insurance','sop']::text[],'department_only','staff'),
('Secondary Insurance — Current Operations','L2-Secondary-Insurance-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_bcba_insurance', NULL, NULL, 'Current process for secondary insurance authorizations.', ARRAY['secondary_insurance','sop']::text[],'department_only','staff'),
('VA Insurance Credentialing — Export','VA_Insurance_Credentialing_1781641071.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'auth_bcba_insurance', 'VA', NULL, 'Virginia insurance credentialing reference export.', ARRAY['export','credentialing','virginia']::text[],'department_only','staff'),
('BCBA Credentials — Board Export (Restricted)','BCBA_Credentials_1781641056.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'auth_bcba_insurance', NULL, NULL, 'BCBA credentials roster — restricted to leadership/credentialing.', ARRAY['credentialing','bcba','restricted']::text[],'leadership_only','lead'),
('Uncredentialed BCBAs — Board Export (Restricted)','Un_Credentialed_BCBAs_1781641086.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','document','report_reference', false, false,
  'auth_bcba_insurance', NULL, NULL, 'Uncredentialed BCBA roster — restricted to leadership/credentialing.', ARRAY['credentialing','bcba','restricted']::text[],'leadership_only','lead'),

-- STATE AND PAYER REFERENCES — GA
('Georgia Process — Current Operations','L2-Georgia-Process-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_state_payer', 'GA', NULL, 'Current authorization process for Georgia.', ARRAY['georgia','state_process','sop']::text[],'department_only','staff'),
('Multi-State Process — Current Operations','L2-Multi-State-Process-Current-Operations.pdf','application/pdf','policy','sop', true, false,
  'auth_state_payer', NULL, NULL, 'Current multi-state authorization process reference.', ARRAY['multi_state','state_process','sop']::text[],'department_only','staff'),
('Georgia Medicaid — Autism Manual (Q2 2025)','ga_medicaid_autism_q2_2025.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'GA', 'Medicaid', 'Georgia Medicaid autism services provider manual (Q2 2025).', ARRAY['georgia','medicaid','manual']::text[],'department_only','staff'),

-- STATE AND PAYER REFERENCES — NC
('NC Alliance — Info','NC - Alliance Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'NC', 'Alliance', 'NC Alliance payer reference.', ARRAY['nc','alliance']::text[],'department_only','staff'),
('NC Alliance — Walkthrough','NC Alliance .mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Alliance', 'NC Alliance authorization walkthrough video.', ARRAY['video','nc','alliance']::text[],'department_only','staff'),
('NC Partners — Info','NC - Partners Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'NC', 'Partners', 'NC Partners payer reference.', ARRAY['nc','partners']::text[],'department_only','staff'),
('NC Partners — Walkthrough','NC Partners.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Partners', 'NC Partners authorization walkthrough video.', ARRAY['video','nc','partners']::text[],'department_only','staff'),
('NC Trillium — Info','NC - Trillium Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'NC', 'Trillium', 'NC Trillium payer reference.', ARRAY['nc','trillium']::text[],'department_only','staff'),
('NC Trillium — Walkthrough','NC Trillium.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Trillium', 'NC Trillium authorization walkthrough video.', ARRAY['video','nc','trillium']::text[],'department_only','staff'),
('NC Trillium — Welcome Packet (2024)','nc_trillium_welcome_packet_2024.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'NC', 'Trillium', 'NC Trillium provider welcome packet (2024).', ARRAY['nc','trillium','welcome_packet']::text[],'department_only','staff'),
('NC Vaya — Info','NC - Vaya.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'NC', 'Vaya', 'NC Vaya payer reference.', ARRAY['nc','vaya']::text[],'department_only','staff'),
('NC Vaya — Walkthrough','NC - Vaya.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Vaya', 'NC Vaya authorization walkthrough video.', ARRAY['video','nc','vaya']::text[],'department_only','staff'),
('NC Healthy Blue — Info','NC - Healthy Blue Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'NC', 'Healthy Blue', 'NC Healthy Blue payer reference.', ARRAY['nc','healthy_blue']::text[],'department_only','staff'),
('NC Wellcare — Info','NC - Wellcare Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'NC', 'Wellcare', 'NC Wellcare payer reference.', ARRAY['nc','wellcare']::text[],'department_only','staff'),
('NC Attestation — Member Rights','nc_attestation_member_rights.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'NC', NULL, 'NC provider attestation of member rights.', ARRAY['nc','attestation','member_rights']::text[],'department_only','staff'),
('Amerihealth — Info','Amerihealth Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', NULL, 'Amerihealth', 'Amerihealth payer info reference.', ARRAY['amerihealth']::text[],'department_only','staff'),

-- STATE AND PAYER REFERENCES — TN
('TN Amerigroup — Info','TN - Amerigroup.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'TN', 'Amerigroup', 'TN Amerigroup payer reference.', ARRAY['tn','amerigroup','tenncare']::text[],'department_only','staff'),
('TN TennCare / BlueCare — Info','TN - TennCare.BlueCare.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'TN', 'TennCare / BlueCare', 'TN TennCare / BlueCare payer reference.', ARRAY['tn','tenncare','bluecare']::text[],'department_only','staff'),
('TN UHC — Info','TN - UHC.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'TN', 'UHC', 'TN UHC payer reference.', ARRAY['tn','uhc']::text[],'department_only','staff'),
('BCBS TN — Info','BCBS TN Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'TN', 'BCBS TN', 'BCBS TN payer reference (docx).', ARRAY['tn','bcbs']::text[],'department_only','staff'),
('BCBS TN — Reference','BCBS TN.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'TN', 'BCBS TN', 'BCBS TN payer reference (pdf).', ARRAY['tn','bcbs']::text[],'department_only','staff'),

-- STATE AND PAYER REFERENCES — VA
('VA Anthem — Info','VA - Anthem Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'Anthem', 'VA Anthem payer reference.', ARRAY['va','anthem']::text[],'department_only','staff'),
('VA Anthem HealthKeepers Plus — Info','va_anthem_hkp_info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'Anthem HealthKeepers Plus', 'VA Anthem HealthKeepers Plus payer reference.', ARRAY['va','anthem','healthkeepers']::text[],'department_only','staff'),
('VA Anthem BCBS — Info','va_anthem_info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'Anthem BCBS', 'VA Anthem BCBS payer reference.', ARRAY['va','anthem','bcbs']::text[],'department_only','staff'),
('VA Aetna — Reference','va_aetna.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'VA', 'Aetna', 'VA Aetna payer reference.', ARRAY['va','aetna']::text[],'department_only','staff'),
('VA Aetna Better Health — Reference','va_aetna_better_health.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'VA', 'Aetna Better Health', 'VA Aetna Better Health payer reference PDF.', ARRAY['va','aetna','better_health']::text[],'department_only','staff'),
('VA Aetna Better Health — Info','va_aetna_better_health_info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'Aetna Better Health', 'VA Aetna Better Health payer info reference.', ARRAY['va','aetna','better_health']::text[],'department_only','staff'),
('VA CareFirst — Reference','carefirst.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'VA', 'CareFirst', 'VA CareFirst payer reference PDF.', ARRAY['va','carefirst']::text[],'department_only','staff'),
('VA CareFirst — Info','carefirst_info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'CareFirst', 'VA CareFirst payer info reference.', ARRAY['va','carefirst']::text[],'department_only','staff'),
('VA CareFirst — Walkthrough','va_carefirst.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'VA', 'CareFirst', 'VA CareFirst authorization walkthrough video.', ARRAY['video','va','carefirst']::text[],'department_only','staff'),
('VA Medicaid — Info','va_medicaid_info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'Medicaid', 'VA Medicaid payer reference.', ARRAY['va','medicaid','dmas']::text[],'department_only','staff'),
('VA Medicaid — Walkthrough','va_medicaid.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'VA', 'Medicaid', 'VA Medicaid authorization walkthrough video.', ARRAY['video','va','medicaid']::text[],'department_only','staff'),
('VA Sentara — Reference','va_sentara.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', 'VA', 'Sentara', 'VA Sentara payer reference PDF.', ARRAY['va','sentara']::text[],'department_only','staff'),
('VA Sentara — Info','va_sentara_info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'Sentara', 'VA Sentara payer info reference.', ARRAY['va','sentara']::text[],'department_only','staff'),
('VA UHC — Info','va_uhc.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', 'VA', 'UHC', 'VA UHC payer reference.', ARRAY['va','uhc']::text[],'department_only','staff'),

-- MULTI-PAYER (cross-state)
('Aetna Commercial — Info','Aetna Commercial.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', NULL, 'Aetna Commercial', 'Aetna Commercial payer reference.', ARRAY['aetna','commercial']::text[],'department_only','staff'),
('Cigna — Info','Cigna Info.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','document','guide', false, false,
  'auth_state_payer', NULL, 'Cigna', 'Cigna payer reference (docx).', ARRAY['cigna']::text[],'department_only','staff'),
('Cigna — Reference','Cigna.pdf','application/pdf','document','guide', false, false,
  'auth_state_payer', NULL, 'Cigna', 'Cigna payer reference (pdf).', ARRAY['cigna']::text[],'department_only','staff'),
('RFO — VA CareFirst Walkthrough','RFO-00503 - VA_CareFirst.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'VA', 'CareFirst', 'Alternate VA CareFirst walkthrough video (RFO source).', ARRAY['video','va','carefirst','rfo']::text[],'department_only','staff'),
('RFO — VA Medicaid Walkthrough','RFO-00513 - VA_Medicaid.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'VA', 'Medicaid', 'Alternate VA Medicaid walkthrough video (RFO source).', ARRAY['video','va','medicaid','rfo']::text[],'department_only','staff'),
('RFO — NC Alliance Walkthrough','RFO-00462 - NC_Alliance.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Alliance', 'Alternate NC Alliance walkthrough video (RFO source).', ARRAY['video','nc','alliance','rfo']::text[],'department_only','staff'),
('RFO — NC Partners Walkthrough','RFO-00469 - NC_Partners.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Partners', 'Alternate NC Partners walkthrough video (RFO source).', ARRAY['video','nc','partners','rfo']::text[],'department_only','staff'),
('RFO — NC Trillium Walkthrough','RFO-00471 - NC_Trillium.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Trillium', 'Alternate NC Trillium walkthrough video (RFO source).', ARRAY['video','nc','trillium','rfo']::text[],'department_only','staff'),
('RFO — NC Vaya Walkthrough','RFO-00473 - NC_Vaya.mp4','video/mp4','video','video', false, true,
  'auth_state_payer', 'NC', 'Vaya', 'Alternate NC Vaya walkthrough video (RFO source).', ARRAY['video','nc','vaya','rfo']::text[],'department_only','staff'),

-- CENTRALREACH AND UTILIZATION
('Finding the Approved POS in CentralReach','Finding the approved POS.pdf','application/pdf','document','guide', false, true,
  'auth_cr_utilization', NULL, NULL, 'How to find the approved POS in CentralReach for authorizations.', ARRAY['centralreach','pos','utilization']::text[],'department_only','staff'),
('Cigna — Monthly Authorizations Reference','Cigna - Monthly Authorizations.pdf','application/pdf','document','guide', false, false,
  'auth_cr_utilization', NULL, 'Cigna', 'Cigna monthly authorization reference used in CentralReach.', ARRAY['cigna','monthly','centralreach']::text[],'department_only','staff'),
('Permission for RBT to Convert After Utilization Is Up','Permission for RBT to convert after utilization is up.pdf','application/pdf','document','guide', false, false,
  'auth_cr_utilization', NULL, NULL, 'Reference on RBT conversion permission when utilization is exhausted.', ARRAY['rbt','utilization','conversion']::text[],'department_only','staff'),
('Auth Utilization (Hour-Based) — Report','Auth-Utilization-Hour-Based-6-15-2026.pdf','application/pdf','document','report_reference', false, false,
  'auth_cr_utilization', NULL, NULL, 'Hour-based authorization utilization report reference.', ARRAY['utilization','report','hour_based']::text[],'department_only','staff'),
('Authorization Analysis — Report','Authorization-Analysis-6-15-2026.pdf','application/pdf','document','report_reference', false, false,
  'auth_cr_utilization', NULL, NULL, 'Authorization analysis report reference.', ARRAY['authorization','analysis','report']::text[],'department_only','staff'),

-- TRAINING AND ACADEMY
('Authorizations — 4-Week Current-State Onboarding Journey','Authorizations Department 4-Week Current-State Onboarding Journey - 2026-07-14.md','text/markdown','document','guide', false, true,
  'auth_training', NULL, NULL, '4-week current-state onboarding journey for the Authorizations department.', ARRAY['onboarding','journey','training']::text[],'department_only','staff'),

-- NEEDS REVIEW / ADMIN QA
('Overview of BCBA and Credentialing Boards (Needs Review)','Overview of BCBA and Credentialing Boards.mp4','video/mp4','video','video', false, false,
  'auth_admin_qa', NULL, NULL, 'BCBA / credentialing boards overview video — held for review before staff release.', ARRAY['needs_review','credentialing','bcba']::text[],'admin_only','admin'),
('RFO-00576 — Video (Needs Review)','RFO-00576 - video1445904513.mp4','video/mp4','video','video', false, false,
  'auth_admin_qa', NULL, NULL, 'Unclear source video — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
('RFO-00605 — Video (Needs Review)','RFO-00605 - video1649222295.mp4','video/mp4','video','video', false, false,
  'auth_admin_qa', NULL, NULL, 'Unclear source video — needs review before promoting to staff.', ARRAY['needs_review','rfo']::text[],'admin_only','admin'),
('Authorizations Resource Library — Uploaded Docs Availability Prompt','Authorizations Resource Library Uploaded Docs Availability Prompt - 2026-07-14.md','text/markdown','document','guide', false, false,
  'auth_admin_qa', NULL, NULL, 'Internal Lovable sprint prompt — admin only.', ARRAY['admin','sprint','prompt']::text[],'admin_only','admin')
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
  'authorizations-resources',
  f.file_name,
  f.mime_type,
  CASE f.audience
    WHEN 'staff' THEN (SELECT r FROM staff_roles)
    WHEN 'lead'  THEN (SELECT r FROM credential_roles)
    ELSE (SELECT r FROM admin_roles)
  END,
  CASE WHEN f.state IS NOT NULL THEN ARRAY[f.state] ELSE ARRAY[]::text[] END,
  f.vis_level,
  ARRAY['authorizations']::text[],
  ARRAY['authorizations', f.subcategory]
    || f.tags_extra
    || CASE WHEN f.state IS NOT NULL THEN ARRAY[lower(f.state)] ELSE ARRAY[]::text[] END
    || CASE WHEN f.payer IS NOT NULL THEN ARRAY[lower(regexp_replace(f.payer, '[^a-zA-Z0-9]+', '_', 'g'))] ELSE ARRAY[]::text[] END,
  f.resource_type,
  true,
  'published',
  'available',
  CASE WHEN f.audience = 'staff' THEN 'public_internal' ELSE 'internal' END,
  false,
  f.sopr,
  f.trainr,
  'FINAL - Authorizations Resource Library Upload - 2026-07-14',
  'Seeded from FINAL - Authorizations Resource Library Upload - 2026-07-14',
  false,
  0
FROM files f;
