
ALTER TABLE public.hr_resources
  ADD COLUMN IF NOT EXISTS resource_id text,
  ADD COLUMN IF NOT EXISTS manifest_upload_path text,
  ADD COLUMN IF NOT EXISTS import_batch integer,
  ADD COLUMN IF NOT EXISTS pending_reason text,
  ADD COLUMN IF NOT EXISTS visibility_level text,
  ADD COLUMN IF NOT EXISTS state_scope text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS topic_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_acknowledgement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_related boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sop_related boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS last_reviewed_date date;

CREATE UNIQUE INDEX IF NOT EXISTS hr_resources_resource_id_key
  ON public.hr_resources(resource_id) WHERE resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS hr_resources_attachment_status_idx
  ON public.hr_resources(attachment_status);

CREATE INDEX IF NOT EXISTS hr_resources_import_batch_idx
  ON public.hr_resources(import_batch);
