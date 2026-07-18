
-- 1. Extend enum with new sync types
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'assignments';
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'documentation';
ALTER TYPE public.cr_sync_type_key ADD VALUE IF NOT EXISTS 'dashboard_audit';
