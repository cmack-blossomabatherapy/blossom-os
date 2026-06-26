DROP VIEW IF EXISTS public.v_employee_directory;
CREATE VIEW public.v_employee_directory AS
SELECT
  e.id,
  e.user_id,
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

ALTER VIEW public.v_employee_directory SET (security_invoker = true);
GRANT SELECT ON public.v_employee_directory TO anon, authenticated;