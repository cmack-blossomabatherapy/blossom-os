
-- Helper: suggest roles from text
CREATE OR REPLACE FUNCTION public.suggest_resource_roles(_title text, _description text, _source text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  blob text := lower(coalesce(_title,'') || ' ' || coalesce(_description,'') || ' ' || coalesce(_source,''));
  out text[] := ARRAY[]::text[];
BEGIN
  IF blob ~ '(billing|finance|invoice|payroll|reimbursement|claim)' THEN
    out := out || ARRAY['billing_finance_team'];
  END IF;
  IF blob ~ '(recruit|applicant|candidate|hiring|orientation)' THEN
    out := out || ARRAY['recruiting_team'];
  END IF;
  IF blob ~ '(\bhr\b|human resource|onboarding|employee handbook|benefits|pto)' THEN
    out := out || ARRAY['hr_team'];
  END IF;
  IF blob ~ '(\brbt\b|registered behavior technician|session note)' THEN
    out := out || ARRAY['rbt'];
  END IF;
  IF blob ~ '(\bbcba\b|board certified|supervision|treatment plan|clinical)' THEN
    out := out || ARRAY['bcba','clinical_director'];
  END IF;
  IF blob ~ '(schedul|staffing|coverage|pairing)' THEN
    out := out || ARRAY['scheduling_team','staffing_team'];
  END IF;
  IF blob ~ '(authoriz|\bauth\b|reauth|payer requirement)' THEN
    out := out || ARRAY['authorization_coordinator'];
  END IF;
  IF blob ~ '(\bqa\b|quality assurance|compliance|audit)' THEN
    out := out || ARRAY['qa_team'];
  END IF;
  IF blob ~ '(marketing|campaign|seo|brand|social media)' THEN
    out := out || ARRAY['marketing_team'];
  END IF;
  IF blob ~ '(intake|lead|vob|verification of benefits|inquiry)' THEN
    out := out || ARRAY['intake_coordinator'];
  END IF;
  IF blob ~ '(credential|caqh|licensure|npi)' THEN
    out := out || ARRAY['credentialing_team'];
  END IF;
  IF blob ~ '(case manager|case management|family support)' THEN
    out := out || ARRAY['case_manager'];
  END IF;
  IF blob ~ '(behavior support|behavioral support|crisis|de-escalation)' THEN
    out := out || ARRAY['behavioral_support'];
  END IF;
  IF blob ~ '(state operation|state director|regional)' THEN
    out := out || ARRAY['state_director','assistant_state_director'];
  END IF;
  IF blob ~ '(business development|referral|partnership)' THEN
    out := out || ARRAY['business_development'];
  END IF;
  RETURN out;
END;
$$;

-- Deactivate README noise
UPDATE public.hr_resources
SET is_active = false, pending_reason = coalesce(pending_reason,'') || ' [readme-noise]'
WHERE lower(coalesce(title,'')) IN ('readme','readme.md')
  AND is_active IS DISTINCT FROM false;

-- Backfill visibility_roles using suggestions for exec-only-tagged rows
WITH exec_tier AS (
  SELECT ARRAY['super_admin','director_of_operations','ceo','executive_leadership','operations_leadership','coo','executive']::text[] AS r
),
targets AS (
  SELECT h.id,
         h.visibility_roles,
         public.suggest_resource_roles(h.title, h.description, coalesce(h.source_note, h.storage_path, h.file_name)) AS suggested
  FROM public.hr_resources h, exec_tier e
  WHERE h.is_active IS DISTINCT FROM false
    AND (h.visibility_roles IS NULL
         OR NOT EXISTS (
           SELECT 1 FROM unnest(h.visibility_roles) v
           WHERE v <> ALL(e.r)
         ))
)
UPDATE public.hr_resources h
SET visibility_roles = (
  SELECT ARRAY(SELECT DISTINCT unnest(coalesce(h.visibility_roles, ARRAY[]::text[]) || t.suggested))
)
FROM targets t
WHERE h.id = t.id AND array_length(t.suggested,1) > 0;
