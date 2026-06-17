
CREATE TABLE IF NOT EXISTS public.bcba_productivity_upload_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid NULL,
  uploaded_by_email text NULL,
  file_name text NOT NULL,
  file_size bigint NULL,
  file_hash text NULL,
  upload_label text NULL,
  notes text NULL,
  source_system text NOT NULL DEFAULT 'centralreach',
  report_type text NOT NULL DEFAULT 'bcba_productivity_billing',
  status text NOT NULL DEFAULT 'active',
  parsed_row_count integer NOT NULL DEFAULT 0,
  appended_row_count integer NOT NULL DEFAULT 0,
  duplicate_row_count integer NOT NULL DEFAULT 0,
  service_date_min date NULL,
  service_date_max date NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_bcba_prod_batches_created ON public.bcba_productivity_upload_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_batches_status ON public.bcba_productivity_upload_batches (status);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_batches_dmin ON public.bcba_productivity_upload_batches (service_date_min);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_batches_dmax ON public.bcba_productivity_upload_batches (service_date_max);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_batches_hash ON public.bcba_productivity_upload_batches (file_hash);

GRANT SELECT, INSERT, UPDATE ON public.bcba_productivity_upload_batches TO authenticated;
GRANT ALL ON public.bcba_productivity_upload_batches TO service_role;

ALTER TABLE public.bcba_productivity_upload_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read bcba prod batches"
  ON public.bcba_productivity_upload_batches FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert bcba prod batches"
  ON public.bcba_productivity_upload_batches FOR INSERT
  TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

CREATE POLICY "Admins can update bcba prod batches"
  ON public.bcba_productivity_upload_batches FOR UPDATE
  TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

CREATE TABLE IF NOT EXISTS public.bcba_productivity_billing_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  batch_id uuid NOT NULL REFERENCES public.bcba_productivity_upload_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  source_system text NOT NULL DEFAULT 'centralreach',
  service_date date NULL,
  client_id text NULL,
  client_name text NULL,
  provider_id text NULL,
  provider_name text NULL,
  procedure_code text NULL,
  hours numeric NULL,
  units numeric NULL,
  raw jsonb NOT NULL,
  normalized jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bcba_prod_rows_hash_active
  ON public.bcba_productivity_billing_rows (row_hash) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_batch ON public.bcba_productivity_billing_rows (batch_id);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_sdate ON public.bcba_productivity_billing_rows (service_date);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_client_id ON public.bcba_productivity_billing_rows (client_id);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_client_name ON public.bcba_productivity_billing_rows (client_name);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_provider ON public.bcba_productivity_billing_rows (provider_name);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_code ON public.bcba_productivity_billing_rows (procedure_code);
CREATE INDEX IF NOT EXISTS idx_bcba_prod_rows_active ON public.bcba_productivity_billing_rows (active);

GRANT SELECT, INSERT, UPDATE ON public.bcba_productivity_billing_rows TO authenticated;
GRANT ALL ON public.bcba_productivity_billing_rows TO service_role;

ALTER TABLE public.bcba_productivity_billing_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active bcba prod rows"
  ON public.bcba_productivity_billing_rows FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert bcba prod rows"
  ON public.bcba_productivity_billing_rows FOR INSERT
  TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  );

CREATE POLICY "Admins can update bcba prod rows"
  ON public.bcba_productivity_billing_rows FOR UPDATE
  TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'systems_admin')
  );
