
-- ============================================================================
-- HR SUITE — PHASE 1 FOUNDATION
-- ============================================================================

-- 1. EXPAND APP_ROLE ENUM ----------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recruiting_assistant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'payroll_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'state_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinic_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dept_manager';
