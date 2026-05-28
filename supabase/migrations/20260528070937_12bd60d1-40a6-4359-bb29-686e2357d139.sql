UPDATE public.evaluation_email_templates
SET
  subject = regexp_replace(subject, '\s*\{\{\s*cycle_name\s*\}\}', '', 'g'),
  body    = regexp_replace(body,    '\s*\{\{\s*cycle_name\s*\}\}', '', 'g');