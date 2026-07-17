
-- 1) hr_resources: pinned-first, updated-desc pagination for active published rows
CREATE INDEX IF NOT EXISTS idx_hr_resources_active_pinned_updated
ON public.hr_resources (is_pinned DESC, updated_at DESC)
WHERE is_active = true AND upload_status = 'published';

-- 2) employees: last_name sort used by the directory view and search
CREATE INDEX IF NOT EXISTS idx_employees_last_name
ON public.employees (last_name);
