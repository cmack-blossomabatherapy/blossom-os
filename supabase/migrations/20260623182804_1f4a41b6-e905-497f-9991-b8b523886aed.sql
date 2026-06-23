
-- Storage policies for the lead-documents bucket
CREATE POLICY "Authenticated read lead-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-documents');

CREATE POLICY "Authenticated upload lead-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-documents');

CREATE POLICY "Authenticated update lead-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lead-documents');

CREATE POLICY "Authenticated delete lead-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lead-documents');

-- Automated email templates registry
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  display_name TEXT NOT NULL,
  description TEXT,
  used_in TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  provider TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view templates"
  ON public.email_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert templates"
  ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
  ON public.email_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
  ON public.email_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_email_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.tg_email_templates_updated_at();
