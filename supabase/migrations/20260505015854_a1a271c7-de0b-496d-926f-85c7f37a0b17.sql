-- Storage bucket for journey step attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('journey-attachments', 'journey-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Table to track attachments tied to a journey step for a user
CREATE TABLE public.journey_step_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  journey_key TEXT NOT NULL,
  step_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID NOT NULL,
  uploaded_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_journey_step_attachments_lookup
  ON public.journey_step_attachments(user_id, journey_key, step_id);

ALTER TABLE public.journey_step_attachments ENABLE ROW LEVEL SECURITY;

-- The journey owner can see/manage their own attachments
CREATE POLICY "Users can view own step attachments"
ON public.journey_step_attachments FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = uploaded_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'hr_admin')
  OR public.has_role(auth.uid(), 'ops_manager'));

CREATE POLICY "Users can insert attachments for themselves or as HR/admin"
ON public.journey_step_attachments FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'ops_manager')
  )
);

CREATE POLICY "Users can update own attachments or HR/admin"
ON public.journey_step_attachments FOR UPDATE
USING (auth.uid() = uploaded_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'hr_admin')
  OR public.has_role(auth.uid(), 'ops_manager'));

CREATE POLICY "Users can delete own attachments or HR/admin"
ON public.journey_step_attachments FOR DELETE
USING (auth.uid() = uploaded_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'hr_admin')
  OR public.has_role(auth.uid(), 'ops_manager'));

CREATE TRIGGER update_journey_step_attachments_updated_at
BEFORE UPDATE ON public.journey_step_attachments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage policies for journey-attachments bucket.
-- Path convention: {user_id}/{journey_key}/{step_id}/{filename}
CREATE POLICY "Users can view own journey attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journey-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'ops_manager')
  )
);

CREATE POLICY "Users can upload own journey attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journey-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'ops_manager')
  )
);

CREATE POLICY "Users can delete own journey attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journey-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'ops_manager')
  )
);