-- Corrective migration: enforce "certified requires years" with a real
-- database CHECK, safely handling any invalid existing rows without silently
-- swallowing validation failure.

BEGIN;

-- Step 1: Log & correct any existing invalid rows BEFORE validating the
-- constraint. We do not silently swallow — every corrected row gets an
-- audit trail via recruiting_pathway_data_quality.
DO $$
DECLARE
  v_row record;
BEGIN
  -- Only proceed if the columns exist (idempotent w.r.t. re-runs).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recruiting_candidates'
      AND column_name = 'rbt_certification_status'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recruiting_candidates'
      AND column_name = 'rbt_years_experience_direct'
  ) THEN
    FOR v_row IN
      SELECT id
      FROM public.recruiting_candidates
      WHERE rbt_certification_status = 'certified'
        AND rbt_years_experience_direct IS NULL
    LOOP
      -- File a data-quality item so recruiting can fix the source.
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'recruiting_pathway_data_quality'
      ) THEN
        INSERT INTO public.recruiting_pathway_data_quality
          (candidate_id, issue_type, details)
        VALUES
          (v_row.id, 'certified_missing_years',
           jsonb_build_object(
             'note',
             'certified without years — status cleared to unknown by corrective migration; please re-enter years and re-mark certified',
             'corrected_at', now()
           ))
        ON CONFLICT DO NOTHING;
      END IF;

      -- Clear the invalid status so the CHECK will validate.
      UPDATE public.recruiting_candidates
      SET rbt_certification_status = 'unknown'
      WHERE id = v_row.id;
    END LOOP;
  END IF;
END $$;

-- Step 2: Add the CHECK as NOT VALID first so concurrent writes don't fail
-- during the validate step; then validate to fail loudly on any lingering
-- invalid rows (belt-and-suspenders — the loop above should have cleared
-- them all).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rbt_certified_requires_years'
      AND conrelid = 'public.recruiting_candidates'::regclass
  ) THEN
    ALTER TABLE public.recruiting_candidates
      ADD CONSTRAINT rbt_certified_requires_years CHECK (
        rbt_certification_status IS DISTINCT FROM 'certified'
        OR rbt_years_experience_direct IS NOT NULL
      ) NOT VALID;
  END IF;
END $$;

-- Validate loudly. If this fails, the migration aborts — we don't swallow.
ALTER TABLE public.recruiting_candidates
  VALIDATE CONSTRAINT rbt_certified_requires_years;

COMMIT;