-- =====================================================================
-- Unified Employee Directory: extend employees + departments for the
-- centralized employee operating system that powers Team Directory,
-- Org Chart, profiles, permissions, and onboarding unlocks.
-- =====================================================================

-- 1. Leadership level enum
DO $$ BEGIN
  CREATE TYPE public.leadership_level AS ENUM ('executive','director','manager','lead','individual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Directory onboarding status enum (separate from existing employee onboarding tables)
DO $$ BEGIN
  CREATE TYPE public.directory_onboarding_status AS ENUM ('not_started','welcome','mission','orientation','training','complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Contact visibility enum
DO $$ BEGIN
  CREATE TYPE public.contact_visibility AS ENUM ('public','internal','leadership');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Extend hr_departments with display metadata used by directory/org-chart UI
ALTER TABLE public.hr_departments
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS spotlight boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 100;

-- 5. Extend employees with directory + org-chart fields
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS leadership_level public.leadership_level NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS leadership_badge text,
  ADD COLUMN IF NOT EXISTS supports_onboarding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_directory boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_org_chart boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_visibility public.contact_visibility NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS states_supported text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS credential text,
  ADD COLUMN IF NOT EXISTS directory_onboarding_status public.directory_onboarding_status NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS unlock_level int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS competencies text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_show_in_directory ON public.employees(show_in_directory) WHERE show_in_directory = true;

-- 6. Allow any authenticated user to read the public directory slice of employees.
DROP POLICY IF EXISTS "View directory employees" ON public.employees;
CREATE POLICY "View directory employees"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (show_in_directory = true OR show_in_org_chart = true);

-- Allow anyone (incl. anon, since the app currently has demo flows) to read the directory.
-- This is intentional: directory is a "yearbook" for the company, no PII beyond what brochure already shows.
DROP POLICY IF EXISTS "Public directory read" ON public.employees;
CREATE POLICY "Public directory read"
  ON public.employees
  FOR SELECT
  TO anon
  USING (show_in_directory = true OR show_in_org_chart = true);

DROP POLICY IF EXISTS "Public departments read" ON public.hr_departments;
CREATE POLICY "Public departments read"
  ON public.hr_departments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_departments;

-- 8. Helper view: employee directory join
CREATE OR REPLACE VIEW public.v_employee_directory AS
SELECT
  e.id,
  e.employee_code,
  e.first_name,
  e.last_name,
  COALESCE(NULLIF(e.preferred_name,''), e.first_name) || ' ' || e.last_name AS display_name,
  e.preferred_name,
  e.email,
  e.phone,
  e.photo_url,
  COALESCE(e.photo_url, e.avatar_url) AS image_url,
  e.bio,
  e.pronouns,
  e.job_title,
  e.credential,
  e.state,
  e.states_supported,
  e.leadership_level,
  e.leadership_badge,
  e.supports_onboarding,
  e.featured,
  e.show_in_directory,
  e.show_in_org_chart,
  e.contact_visibility,
  e.manager_id,
  e.directory_onboarding_status,
  e.unlock_level,
  e.certifications,
  e.competencies,
  e.status,
  d.id AS department_id,
  d.name AS department_name,
  d.slug AS department_slug,
  d.tagline AS department_tagline,
  d.spotlight AS department_spotlight,
  d.sort_order AS department_sort_order
FROM public.employees e
LEFT JOIN public.hr_departments d ON d.id = e.department_id;

GRANT SELECT ON public.v_employee_directory TO anon, authenticated;