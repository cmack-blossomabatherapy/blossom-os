-- Extend the app_role enum to match the future Blossom org structure.
-- Existing values are preserved so current role assignments keep working.
-- New canonical values are additive.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'systems_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'executive';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director_of_operations';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing_growth_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing_team';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intake_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intake_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_benefits_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_benefits_team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'authorization_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'authorization_coordinator';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'qa_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'qa_specialist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinical_lead';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scheduling_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scheduling_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staffing_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staffing_coordinator';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recruiting_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recruiting_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'payroll_lead';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'billing_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'credentialing_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rcm_team';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant_state_director';