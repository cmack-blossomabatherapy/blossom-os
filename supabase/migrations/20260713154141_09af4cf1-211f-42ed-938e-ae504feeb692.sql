
DROP INDEX IF EXISTS public.hr_resources_resource_id_key;
ALTER TABLE public.hr_resources
  ADD CONSTRAINT hr_resources_resource_id_key UNIQUE (resource_id);
