-- Retire LeadTrap + PandaDoc, promote Jotform, correct Go Integrator Nava.

-- 1) Jotform catalog row (canonical form/intake/document provider).
INSERT INTO public.integration_catalog (
  id, display_name, category, owner_department, criticality,
  methods, status, source_of_truth_for, dependent_modules, notes
)
VALUES (
  'jotform',
  'Jotform',
  'forms_intake_documents',
  'Intake / HR / Operations',
  'critical',
  ARRAY['api','webhook','embedded_link'],
  'configured',
  ARRAY['Form submissions']::text[],
  ARRAY[
    'Intake Dashboard',
    'Recruiting Pipeline',
    'HR Onboarding',
    'Patient Lifetime Journey',
    'Document surfaces'
  ]::text[],
  'Canonical form/intake/document-submission provider. Inbound/read-only. HIPAA region recommended for PHI. Not a clinical or HR source of truth.'
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  owner_department = EXCLUDED.owner_department,
  criticality = EXCLUDED.criticality,
  methods = EXCLUDED.methods,
  status = EXCLUDED.status,
  source_of_truth_for = EXCLUDED.source_of_truth_for,
  dependent_modules = EXCLUDED.dependent_modules,
  notes = EXCLUDED.notes,
  updated_at = now();

-- 2) Retire LeadTrap.
UPDATE public.integration_catalog
SET
  display_name = 'LeadTrap (retired — replaced by Jotform)',
  status = 'disabled',
  criticality = 'optional',
  source_of_truth_for = ARRAY[]::text[],
  dependent_modules = ARRAY['Historical lead history only']::text[],
  notes = 'Retired. Replaced by Jotform. Historical rows preserved; adapter is not active.',
  updated_at = now()
WHERE id = 'leadtrap';

UPDATE public.integration_connections
SET enabled = false, status = 'disabled', updated_at = now()
WHERE integration_id = 'leadtrap';

-- 3) Retire PandaDoc.
UPDATE public.integration_catalog
SET
  display_name = 'PandaDoc (retired — replaced by Jotform)',
  status = 'disabled',
  criticality = 'optional',
  source_of_truth_for = ARRAY[]::text[],
  dependent_modules = ARRAY['Historical document history only']::text[],
  notes = 'Retired. Replaced by Jotform. Historical rows preserved; adapter is not active.',
  updated_at = now()
WHERE id = 'pandadoc';

UPDATE public.integration_connections
SET enabled = false, status = 'disabled', updated_at = now()
WHERE integration_id = 'pandadoc';

-- 4) Correct Go Integrator Nava.
UPDATE public.integration_catalog
SET
  display_name = 'Go Integrate Nava',
  category = 'communications',
  owner_department = 'Operations / Communications',
  criticality = 'standard',
  methods = ARRAY['manual_upload']::text[],
  status = 'configured',
  source_of_truth_for = ARRAY[]::text[],
  dependent_modules = ARRAY['Jivetel / NetSapiens desktop CTI']::text[],
  notes = 'Desktop CTI/CRM companion that bridges to NetSapiens/Jivetel. Requires local UNITE license — not cloud-testable. Configured per-user against the Blossom NetSapiens/Jivetel host.',
  updated_at = now()
WHERE id = 'go-integrate-nava';