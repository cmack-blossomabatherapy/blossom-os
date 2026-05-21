
-- Table to track uploaded data files
CREATE TABLE public.data_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_system TEXT NOT NULL,
  source_key TEXT NOT NULL,
  source_label TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  notes TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_uploads_source_key ON public.data_uploads(source_key);
CREATE INDEX idx_data_uploads_uploaded_at ON public.data_uploads(uploaded_at DESC);

ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view data uploads"
  ON public.data_uploads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert data uploads"
  ON public.data_uploads FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete data uploads"
  ON public.data_uploads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Private storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('data-uploads', 'data-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read data upload files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'data-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload data upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'data-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete data upload files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'data-uploads' AND public.has_role(auth.uid(), 'admin'));
