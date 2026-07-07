ALTER TABLE public.system_workflows ALTER COLUMN related_integration_id TYPE text USING related_integration_id::text;
ALTER TABLE public.system_issues ALTER COLUMN related_integration_id TYPE text USING related_integration_id::text;
COMMENT ON COLUMN public.system_workflows.related_integration_id IS 'Text registry key from the Blossom integration registry (e.g. centralreach, viventium, ctm). Not a UUID.';
COMMENT ON COLUMN public.system_issues.related_integration_id IS 'Text registry key from the Blossom integration registry (e.g. centralreach, viventium, ctm). Not a UUID.';