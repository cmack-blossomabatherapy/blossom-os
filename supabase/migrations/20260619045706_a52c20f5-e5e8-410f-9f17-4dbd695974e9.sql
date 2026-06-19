
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.integration_normalized_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL REFERENCES public.integration_catalog(id) ON DELETE CASCADE,
  provider_record_id text,
  record_kind text NOT NULL,
  record_status text,
  display_title text,
  occurred_at timestamptz,
  person_email text,
  person_phone text,
  person_name text,
  external_url text,
  source_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_event_id uuid REFERENCES public.integration_webhook_events(id) ON DELETE SET NULL,
  sync_run_id uuid REFERENCES public.integration_sync_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integration_normalized_records TO authenticated;
GRANT ALL ON public.integration_normalized_records TO service_role;

ALTER TABLE public.integration_normalized_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view normalized records" ON public.integration_normalized_records;
CREATE POLICY "Admins can view normalized records"
  ON public.integration_normalized_records
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::public.app_role)
  );

CREATE UNIQUE INDEX IF NOT EXISTS integration_normalized_records_natural_key
  ON public.integration_normalized_records (integration_id, provider_record_id, record_kind)
  WHERE provider_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS integration_normalized_records_kind_idx
  ON public.integration_normalized_records (integration_id, record_kind, occurred_at DESC);

CREATE INDEX IF NOT EXISTS integration_normalized_records_raw_event_idx
  ON public.integration_normalized_records (raw_event_id);

CREATE INDEX IF NOT EXISTS integration_normalized_records_sync_run_idx
  ON public.integration_normalized_records (sync_run_id);

CREATE INDEX IF NOT EXISTS integration_webhook_events_status_idx
  ON public.integration_webhook_events (integration_id, processing_status, received_at DESC);

DROP TRIGGER IF EXISTS update_integration_normalized_records_updated_at
  ON public.integration_normalized_records;
CREATE TRIGGER update_integration_normalized_records_updated_at
  BEFORE UPDATE ON public.integration_normalized_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
