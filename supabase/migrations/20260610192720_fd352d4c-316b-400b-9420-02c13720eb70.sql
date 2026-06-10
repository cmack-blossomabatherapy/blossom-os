
CREATE TABLE public.referral_crm_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'referral-crm-files',
  storage_path TEXT NOT NULL,
  uploaded_by UUID,
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_attachments TO authenticated;
GRANT ALL ON public.referral_crm_attachments TO service_role;
ALTER TABLE public.referral_crm_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read attachments" ON public.referral_crm_attachments
  FOR SELECT TO authenticated USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write attachments" ON public.referral_crm_attachments
  FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_attachments_updated
  BEFORE UPDATE ON public.referral_crm_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_crm_attachments_object ON public.referral_crm_attachments(object_type, object_id);
CREATE INDEX idx_crm_attachments_archived ON public.referral_crm_attachments(archived_at);

CREATE TABLE public.referral_crm_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT,
  object_label TEXT,
  summary TEXT,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referral_crm_audit_log TO authenticated;
GRANT ALL ON public.referral_crm_audit_log TO service_role;
ALTER TABLE public.referral_crm_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read audit" ON public.referral_crm_audit_log
  FOR SELECT TO authenticated USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm insert audit" ON public.referral_crm_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE INDEX idx_crm_audit_created ON public.referral_crm_audit_log(created_at DESC);
CREATE INDEX idx_crm_audit_object ON public.referral_crm_audit_log(object_type, object_id);

-- Storage RLS for the referral-crm-files bucket
CREATE POLICY "crm read referral files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm upload referral files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm update referral files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm delete referral files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'referral-crm-files' AND public.can_access_referral_crm(auth.uid()));
