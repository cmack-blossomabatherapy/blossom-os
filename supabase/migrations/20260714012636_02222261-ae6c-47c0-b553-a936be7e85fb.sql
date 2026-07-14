
-- Lead documents table for CRM-style file uploads on leads
CREATE TABLE IF NOT EXISTS public.lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  label text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_documents_lead_id_idx ON public.lead_documents(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_documents TO authenticated;
GRANT ALL ON public.lead_documents TO service_role;

ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- Any authenticated user with an intake or leadership role can manage lead docs
CREATE POLICY "Intake and leadership can read lead documents"
  ON public.lead_documents FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
    OR public.has_role(auth.uid(), 'intake_coordinator'::app_role)
    OR public.has_role(auth.uid(), 'intake_lead'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
  );

CREATE POLICY "Intake and leadership can insert lead documents"
  ON public.lead_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
      OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
      OR public.has_role(auth.uid(), 'intake_coordinator'::app_role)
      OR public.has_role(auth.uid(), 'intake_lead'::app_role)
    )
  );

CREATE POLICY "Uploader or leadership can update lead documents"
  ON public.lead_documents FOR UPDATE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
    OR public.has_role(auth.uid(), 'intake_lead'::app_role)
  );

CREATE POLICY "Uploader or leadership can delete lead documents"
  ON public.lead_documents FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
    OR public.has_role(auth.uid(), 'intake_lead'::app_role)
  );

CREATE TRIGGER lead_documents_set_updated_at
  BEFORE UPDATE ON public.lead_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for lead-documents bucket (bucket created via tool)
CREATE POLICY "Intake and leadership can read lead-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lead-documents' AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
      OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
      OR public.has_role(auth.uid(), 'intake_coordinator'::app_role)
      OR public.has_role(auth.uid(), 'intake_lead'::app_role)
      OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    )
  );

CREATE POLICY "Intake and leadership can upload lead-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lead-documents' AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
      OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
      OR public.has_role(auth.uid(), 'intake_coordinator'::app_role)
      OR public.has_role(auth.uid(), 'intake_lead'::app_role)
    )
  );

CREATE POLICY "Intake and leadership can delete lead-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lead-documents' AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
      OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
      OR public.has_role(auth.uid(), 'intake_lead'::app_role)
    )
  );
