
-- Add identity columns
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS extension text,
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS expertise text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nfc_settings jsonb NOT NULL DEFAULT jsonb_build_object(
    'enabled', true,
    'public', true,
    'internal', true,
    'business_card', true,
    'emergency', false
  ),
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb;

-- Profile completion: 5 buckets, 20 points each
CREATE OR REPLACE FUNCTION public.compute_profile_completion(emp public.employees)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT (
    (CASE WHEN COALESCE(emp.photo_url, emp.avatar_url) IS NOT NULL AND COALESCE(emp.photo_url, emp.avatar_url) <> '' THEN 20 ELSE 0 END) +
    (CASE WHEN COALESCE(emp.bio, emp.about_me) IS NOT NULL AND length(COALESCE(emp.bio, emp.about_me)) > 20 THEN 20 ELSE 0 END) +
    (CASE WHEN array_length(emp.skills, 1) > 0 OR array_length(emp.expertise, 1) > 0 THEN 20 ELSE 0 END) +
    (CASE WHEN (emp.email IS NOT NULL AND emp.email <> '') AND (emp.phone IS NOT NULL AND emp.phone <> '') THEN 20 ELSE 0 END) +
    (CASE WHEN emp.emergency_contact IS NOT NULL AND emp.emergency_contact ? 'name' THEN 20 ELSE 0 END)
  )::integer
$$;

CREATE OR REPLACE VIEW public.employee_profile_completion
WITH (security_invoker = on) AS
SELECT
  e.id AS employee_id,
  public.compute_profile_completion(e) AS score,
  (COALESCE(e.photo_url, e.avatar_url) IS NOT NULL AND COALESCE(e.photo_url, e.avatar_url) <> '') AS has_photo,
  (COALESCE(e.bio, e.about_me) IS NOT NULL AND length(COALESCE(e.bio, e.about_me)) > 20) AS has_bio,
  (array_length(e.skills, 1) > 0 OR array_length(e.expertise, 1) > 0) AS has_skills,
  ((e.email IS NOT NULL AND e.email <> '') AND (e.phone IS NOT NULL AND e.phone <> '')) AS has_contact,
  (e.emergency_contact IS NOT NULL AND e.emergency_contact ? 'name') AS has_emergency
FROM public.employees e;

GRANT SELECT ON public.employee_profile_completion TO authenticated;
GRANT SELECT ON public.employee_profile_completion TO service_role;
