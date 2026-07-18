
-- Timeline events
CREATE TABLE public.bcba_productivity_discrepancy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discrepancy_id uuid NOT NULL REFERENCES public.bcba_productivity_discrepancies(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL, -- created | status_changed | comment | attachment_added | attachment_removed | resolved | reopened
  from_status text,
  to_status text,
  comment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bcba_prod_disc_events_disc_idx ON public.bcba_productivity_discrepancy_events(discrepancy_id, created_at DESC);

GRANT SELECT, INSERT ON public.bcba_productivity_discrepancy_events TO authenticated;
GRANT ALL ON public.bcba_productivity_discrepancy_events TO service_role;

ALTER TABLE public.bcba_productivity_discrepancy_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disc_events_select" ON public.bcba_productivity_discrepancy_events
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bcba_productivity_discrepancies d
  WHERE d.id = discrepancy_id
    AND (
      d.bcba_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role)
      OR has_role(auth.uid(), 'clinical_director'::app_role)
      OR has_role(auth.uid(), 'operations_leadership'::app_role)
      OR has_role(auth.uid(), 'qa'::app_role)
      OR has_role(auth.uid(), 'state_director'::app_role)
    )
));

CREATE POLICY "disc_events_insert" ON public.bcba_productivity_discrepancy_events
FOR INSERT TO authenticated
WITH CHECK (
  (actor_id = auth.uid() OR actor_id IS NULL)
  AND EXISTS (
    SELECT 1 FROM public.bcba_productivity_discrepancies d
    WHERE d.id = discrepancy_id
      AND (
        d.bcba_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
        OR has_role(auth.uid(), 'clinical_director'::app_role)
        OR has_role(auth.uid(), 'operations_leadership'::app_role)
        OR has_role(auth.uid(), 'qa'::app_role)
      )
  )
);

-- Attachments (metadata; files live in storage bucket bcba-discrepancy-evidence)
CREATE TABLE public.bcba_productivity_discrepancy_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discrepancy_id uuid NOT NULL REFERENCES public.bcba_productivity_discrepancies(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  content_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bcba_prod_disc_att_disc_idx ON public.bcba_productivity_discrepancy_attachments(discrepancy_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.bcba_productivity_discrepancy_attachments TO authenticated;
GRANT ALL ON public.bcba_productivity_discrepancy_attachments TO service_role;

ALTER TABLE public.bcba_productivity_discrepancy_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disc_att_select" ON public.bcba_productivity_discrepancy_attachments
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bcba_productivity_discrepancies d
  WHERE d.id = discrepancy_id
    AND (
      d.bcba_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role)
      OR has_role(auth.uid(), 'clinical_director'::app_role)
      OR has_role(auth.uid(), 'operations_leadership'::app_role)
      OR has_role(auth.uid(), 'qa'::app_role)
      OR has_role(auth.uid(), 'state_director'::app_role)
    )
));

CREATE POLICY "disc_att_insert" ON public.bcba_productivity_discrepancy_attachments
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bcba_productivity_discrepancies d
    WHERE d.id = discrepancy_id
      AND (
        d.bcba_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
        OR has_role(auth.uid(), 'clinical_director'::app_role)
        OR has_role(auth.uid(), 'operations_leadership'::app_role)
        OR has_role(auth.uid(), 'qa'::app_role)
      )
  )
);

CREATE POLICY "disc_att_delete" ON public.bcba_productivity_discrepancy_attachments
FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow BCBA (owner) to update their own discrepancy status (e.g., resolve/reopen).
-- Existing update policy only allows admins; add an owner-scoped policy.
CREATE POLICY "bcba_prod_disc_update_own" ON public.bcba_productivity_discrepancies
FOR UPDATE TO authenticated
USING (bcba_id = auth.uid())
WITH CHECK (bcba_id = auth.uid());

-- Trigger: log creation and status changes into events table
CREATE OR REPLACE FUNCTION public.bcba_prod_disc_log_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bcba_productivity_discrepancy_events(discrepancy_id, actor_id, event_type, to_status, comment)
    VALUES (NEW.id, auth.uid(), 'created', NEW.status, NEW.detail);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.bcba_productivity_discrepancy_events(discrepancy_id, actor_id, event_type, from_status, to_status, comment)
    VALUES (
      NEW.id, auth.uid(),
      CASE WHEN NEW.status = 'resolved' THEN 'resolved'
           WHEN OLD.status = 'resolved' AND NEW.status <> 'resolved' THEN 'reopened'
           ELSE 'status_changed' END,
      OLD.status, NEW.status,
      NEW.resolution_note
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bcba_prod_disc_log_event_ins
AFTER INSERT ON public.bcba_productivity_discrepancies
FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_log_event();

CREATE TRIGGER bcba_prod_disc_log_event_upd
AFTER UPDATE ON public.bcba_productivity_discrepancies
FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_log_event();

-- Trigger: log attachment additions
CREATE OR REPLACE FUNCTION public.bcba_prod_disc_log_attachment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bcba_productivity_discrepancy_events(discrepancy_id, actor_id, event_type, comment, metadata)
    VALUES (NEW.discrepancy_id, NEW.uploaded_by, 'attachment_added', NEW.file_name,
            jsonb_build_object('attachment_id', NEW.id, 'storage_path', NEW.storage_path));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.bcba_productivity_discrepancy_events(discrepancy_id, actor_id, event_type, comment, metadata)
    VALUES (OLD.discrepancy_id, auth.uid(), 'attachment_removed', OLD.file_name,
            jsonb_build_object('attachment_id', OLD.id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER bcba_prod_disc_log_att_ins
AFTER INSERT ON public.bcba_productivity_discrepancy_attachments
FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_log_attachment();

CREATE TRIGGER bcba_prod_disc_log_att_del
AFTER DELETE ON public.bcba_productivity_discrepancy_attachments
FOR EACH ROW EXECUTE FUNCTION public.bcba_prod_disc_log_attachment();

-- Storage RLS: bucket is private. Grant access to owners and reviewer roles.
-- Path convention: <discrepancy_id>/<uuid>-<filename>
CREATE POLICY "bcba_disc_evidence_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'bcba-discrepancy-evidence'
  AND EXISTS (
    SELECT 1 FROM public.bcba_productivity_discrepancies d
    WHERE d.id::text = split_part(name, '/', 1)
      AND (
        d.bcba_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
        OR has_role(auth.uid(), 'clinical_director'::app_role)
        OR has_role(auth.uid(), 'operations_leadership'::app_role)
        OR has_role(auth.uid(), 'qa'::app_role)
        OR has_role(auth.uid(), 'state_director'::app_role)
      )
  )
);

CREATE POLICY "bcba_disc_evidence_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bcba-discrepancy-evidence'
  AND EXISTS (
    SELECT 1 FROM public.bcba_productivity_discrepancies d
    WHERE d.id::text = split_part(name, '/', 1)
      AND (
        d.bcba_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
        OR has_role(auth.uid(), 'clinical_director'::app_role)
        OR has_role(auth.uid(), 'operations_leadership'::app_role)
        OR has_role(auth.uid(), 'qa'::app_role)
      )
  )
);

CREATE POLICY "bcba_disc_evidence_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'bcba-discrepancy-evidence'
  AND (
    owner = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);
