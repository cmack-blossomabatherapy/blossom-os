
-- 1) Purge Markdown README/.md junk from the resource library
DELETE FROM public.hr_resources
WHERE lower(coalesce(file_name,'')) LIKE '%.md'
   OR lower(coalesce(title,'')) LIKE '%.md'
   OR lower(coalesce(storage_path,'')) LIKE '%.md'
   OR lower(coalesce(mime_type,'')) IN ('text/markdown','text/x-markdown')
   OR lower(coalesce(title,'')) IN ('readme','read me');

-- 2) Relabel resource_type based on title cues (priority order)
-- SOP
UPDATE public.hr_resources
SET resource_type = 'sop'
WHERE (lower(title) LIKE '%sop%' OR lower(title) LIKE '%standard operating procedure%')
  AND lower(coalesce(resource_type,'')) <> 'sop';

-- Checklist
UPDATE public.hr_resources
SET resource_type = 'checklist'
WHERE lower(title) LIKE '%checklist%'
  AND lower(coalesce(resource_type,'')) NOT IN ('sop','checklist');

-- Template
UPDATE public.hr_resources
SET resource_type = 'template'
WHERE lower(title) LIKE '%template%'
  AND lower(coalesce(resource_type,'')) NOT IN ('sop','checklist','template');

-- Form
UPDATE public.hr_resources
SET resource_type = 'form'
WHERE lower(title) LIKE '%form%'
  AND lower(coalesce(resource_type,'')) NOT IN ('sop','checklist','template','form');

-- Workflow / Playbook
UPDATE public.hr_resources
SET resource_type = 'workflow'
WHERE (lower(title) LIKE '%workflow%' OR lower(title) LIKE '%playbook%' OR lower(title) LIKE '%process map%')
  AND lower(coalesce(resource_type,'')) NOT IN ('sop','checklist','template','form','workflow');

-- Guide
UPDATE public.hr_resources
SET resource_type = 'guide'
WHERE (lower(title) LIKE '%guide%' OR lower(title) LIKE '%how to%' OR lower(title) LIKE '%how-to%')
  AND lower(coalesce(resource_type,'')) NOT IN ('sop','checklist','template','form','workflow','guide');

-- Video (based on mime/extension) — ensure resource_type reflects video
UPDATE public.hr_resources
SET resource_type = 'video'
WHERE (lower(coalesce(mime_type,'')) LIKE 'video/%'
       OR lower(coalesce(file_name,'')) ~ '\.(mp4|mov|m4v|webm)$'
       OR storage_bucket = 'resource-videos')
  AND lower(coalesce(resource_type,'')) <> 'video';

-- Set sop_related flag consistently
UPDATE public.hr_resources
SET sop_related = TRUE
WHERE lower(coalesce(resource_type,'')) = 'sop' AND sop_related IS DISTINCT FROM TRUE;
