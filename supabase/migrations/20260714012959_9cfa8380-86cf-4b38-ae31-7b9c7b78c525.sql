-- Lead documents: files uploaded to leads
CREATE TABLE IF NOT EXISTS public.lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  label text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_documents_lead_id_idx ON public.lead_documents(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_documents TO authenticated;
GRANT ALL ON public.lead_documents TO service_role;

ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read lead documents"
  ON public.lead_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert lead documents"
  ON public.lead_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update lead documents"
  ON public.lead_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete lead documents"
  ON public.lead_documents FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_lead_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_lead_documents_updated_at ON public.lead_documents;
CREATE TRIGGER trg_lead_documents_updated_at
  BEFORE UPDATE ON public.lead_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_lead_documents_updated_at();

-- Storage RLS for the private lead-documents bucket
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated read lead-documents') THEN
    CREATE POLICY "Authenticated read lead-documents" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'lead-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated write lead-documents') THEN
    CREATE POLICY "Authenticated write lead-documents" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lead-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated update lead-documents') THEN
    CREATE POLICY "Authenticated update lead-documents" ON storage.objects
      FOR UPDATE TO authenticated USING (bucket_id = 'lead-documents') WITH CHECK (bucket_id = 'lead-documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated delete lead-documents') THEN
    CREATE POLICY "Authenticated delete lead-documents" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'lead-documents');
  END IF;
END $$;