-- =========================================================================
-- 1. Expand app_role enum
-- =========================================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'exec';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ops_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intake';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auth_team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'qa';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scheduling';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staffing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinic';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'phone_support';
