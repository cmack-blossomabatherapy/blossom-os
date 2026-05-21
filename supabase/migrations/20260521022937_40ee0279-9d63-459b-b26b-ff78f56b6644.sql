-- Backfill state from raw_labels and keep it populated on future imports
CREATE OR REPLACE FUNCTION public.derive_state_from_labels(labels text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN labels ILIKE '%Virginia Location%'        THEN 'VA'
    WHEN labels ILIKE '%Georgia Location%'         THEN 'GA'
    WHEN labels ILIKE '%North Carolina Location%'  THEN 'NC'
    WHEN labels ILIKE '%Tennessee Location%'       THEN 'TN'
    WHEN labels ILIKE '%Maryland Location%'        THEN 'MD'
    WHEN labels ILIKE '%Florida Location%'         THEN 'FL'
    WHEN labels ILIKE '%Texas Location%'           THEN 'TX'
    WHEN labels ILIKE '%South Carolina Location%'  THEN 'SC'
    ELSE NULL
  END
$$;

-- Trigger to set state on insert/update if blank
CREATE OR REPLACE FUNCTION public.bcba_sessions_set_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.state IS NULL OR btrim(NEW.state) = '') AND NEW.raw_labels IS NOT NULL THEN
    NEW.state := public.derive_state_from_labels(NEW.raw_labels);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bcba_sessions_set_state ON public.bcba_billable_sessions;
CREATE TRIGGER trg_bcba_sessions_set_state
BEFORE INSERT OR UPDATE OF raw_labels, state
ON public.bcba_billable_sessions
FOR EACH ROW
EXECUTE FUNCTION public.bcba_sessions_set_state();

-- One-time backfill of existing rows
UPDATE public.bcba_billable_sessions
SET state = public.derive_state_from_labels(raw_labels)
WHERE (state IS NULL OR btrim(state) = '')
  AND raw_labels IS NOT NULL
  AND public.derive_state_from_labels(raw_labels) IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bcba_sessions_state ON public.bcba_billable_sessions(state);