
-- Readiness columns on employee_onboarding
ALTER TABLE public.employee_onboarding
  ADD COLUMN IF NOT EXISTS viventium_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS viventium_external_id text,
  ADD COLUMN IF NOT EXISTS viventium_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS viventium_notes text,
  ADD COLUMN IF NOT EXISTS stellar_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS stellar_external_id text,
  ADD COLUMN IF NOT EXISTS stellar_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS stellar_notes text,
  ADD COLUMN IF NOT EXISTS centralreach_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS centralreach_external_id text,
  ADD COLUMN IF NOT EXISTS centralreach_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS centralreach_notes text;

-- Constrain to a small enum-like set (validation trigger, not CHECK, to stay flexible)
CREATE OR REPLACE FUNCTION public.validate_onboarding_integration_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY['not_started','pending','in_progress','ready','synced','error','not_applicable'];
BEGIN
  IF NEW.viventium_status IS NOT NULL AND NOT (NEW.viventium_status = ANY(allowed)) THEN
    RAISE EXCEPTION 'invalid viventium_status: %', NEW.viventium_status;
  END IF;
  IF NEW.stellar_status IS NOT NULL AND NOT (NEW.stellar_status = ANY(allowed)) THEN
    RAISE EXCEPTION 'invalid stellar_status: %', NEW.stellar_status;
  END IF;
  IF NEW.centralreach_status IS NOT NULL AND NOT (NEW.centralreach_status = ANY(allowed)) THEN
    RAISE EXCEPTION 'invalid centralreach_status: %', NEW.centralreach_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_onb_integration_status ON public.employee_onboarding;
CREATE TRIGGER trg_validate_onb_integration_status
  BEFORE INSERT OR UPDATE ON public.employee_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.validate_onboarding_integration_status();

-- Honest catalog rows: mark CR/Viventium as not_configured (no live connection yet)
UPDATE public.integration_catalog
  SET status = 'not_configured', notes = COALESCE(notes, 'Integration not connected yet — HR shows readiness data only.')
  WHERE id IN ('centralreach','viventium');

-- Stellar Checks catalog entry
INSERT INTO public.integration_catalog (id, display_name, category, owner_department, criticality, methods, status, source_of_truth_for, dependent_modules, notes)
VALUES (
  'stellar_checks',
  'Stellar Checks',
  'background_checks',
  'hr',
  'standard',
  ARRAY['api']::text[],
  'not_configured',
  ARRAY['background_check']::text[],
  ARRAY['hr','recruiting']::text[],
  'Background check provider — not connected yet. HR shows readiness data only.'
)
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      category = EXCLUDED.category,
      owner_department = EXCLUDED.owner_department;
