
ALTER TABLE public.intake_tasks ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE public.intake_tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.intake_tasks(id) ON DELETE CASCADE;
ALTER TABLE public.intake_tasks ADD COLUMN IF NOT EXISTS related_record_type text;
ALTER TABLE public.intake_tasks ADD COLUMN IF NOT EXISTS related_record_id text;
ALTER TABLE public.intake_tasks ADD COLUMN IF NOT EXISTS related_record_label text;
ALTER TABLE public.intake_tasks ADD COLUMN IF NOT EXISTS related_url text;
CREATE INDEX IF NOT EXISTS intake_tasks_parent_task_id_idx ON public.intake_tasks(parent_task_id);
