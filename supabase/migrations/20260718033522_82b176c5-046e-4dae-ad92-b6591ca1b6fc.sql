
-- 1) Add columns
ALTER TABLE public.bcba_productivity_discrepancies
  ADD COLUMN IF NOT EXISTS impacted_metric_keys text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS source_timestamps jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS bcba_prod_disc_impacted_metrics_idx
  ON public.bcba_productivity_discrepancies USING GIN (impacted_metric_keys);

-- 2) Trigger to auto-populate impacted_metric_keys + source_timestamps
CREATE OR REPLACE FUNCTION public.bcba_prod_disc_populate_sources()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  snap_sources jsonb;
  snap_period_end date;
  snap_updated timestamptz;
  keys text[];
  k text;
  ts text;
  out_map jsonb := '{}'::jsonb;
BEGIN
  -- Ensure metric_key is always part of impacted_metric_keys
  keys := COALESCE(NEW.impacted_metric_keys, '{}'::text[]);
  IF NEW.metric_key IS NOT NULL AND NOT (NEW.metric_key = ANY(keys)) THEN
    keys := array_append(keys, NEW.metric_key);
  END IF;
  NEW.impacted_metric_keys := keys;

  -- Look up snapshot source_dates when available
  IF NEW.snapshot_id IS NOT NULL THEN
    SELECT source_dates, period_end, updated_at
      INTO snap_sources, snap_period_end, snap_updated
    FROM public.bcba_productivity_snapshots
    WHERE id = NEW.snapshot_id;
  END IF;

  IF keys IS NOT NULL THEN
    FOREACH k IN ARRAY keys LOOP
      ts := NULL;
      IF snap_sources IS NOT NULL THEN
        ts := snap_sources->>k;
      END IF;
      IF ts IS NULL AND snap_updated IS NOT NULL THEN
        ts := to_char(snap_updated AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
      END IF;
      IF ts IS NOT NULL THEN
        out_map := out_map || jsonb_build_object(k, ts);
      END IF;
    END LOOP;
  END IF;

  -- Preserve any manually supplied overrides in NEW.source_timestamps
  IF NEW.source_timestamps IS NOT NULL AND NEW.source_timestamps <> '{}'::jsonb THEN
    out_map := out_map || NEW.source_timestamps;
  END IF;

  NEW.source_timestamps := out_map;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bcba_prod_disc_populate_sources_ins ON public.bcba_productivity_discrepancies;
CREATE TRIGGER bcba_prod_disc_populate_sources_ins
  BEFORE INSERT ON public.bcba_productivity_discrepancies
  FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_populate_sources();

DROP TRIGGER IF EXISTS bcba_prod_disc_populate_sources_upd ON public.bcba_productivity_discrepancies;
CREATE TRIGGER bcba_prod_disc_populate_sources_upd
  BEFORE UPDATE OF impacted_metric_keys, metric_key, snapshot_id
  ON public.bcba_productivity_discrepancies
  FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_populate_sources();

-- 3) Backfill existing rows
UPDATE public.bcba_productivity_discrepancies d
SET impacted_metric_keys = ARRAY[d.metric_key],
    source_timestamps = COALESCE(
      jsonb_build_object(
        d.metric_key,
        COALESCE(
          s.source_dates->>d.metric_key,
          to_char(s.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )
      ),
      '{}'::jsonb
    )
FROM public.bcba_productivity_snapshots s
WHERE d.snapshot_id = s.id
  AND (d.impacted_metric_keys IS NULL OR array_length(d.impacted_metric_keys, 1) IS NULL);

UPDATE public.bcba_productivity_discrepancies
SET impacted_metric_keys = ARRAY[metric_key]
WHERE (impacted_metric_keys IS NULL OR array_length(impacted_metric_keys, 1) IS NULL)
  AND metric_key IS NOT NULL;
