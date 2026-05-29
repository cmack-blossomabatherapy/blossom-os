CREATE OR REPLACE FUNCTION public.compute_profile_completion(emp public.employees)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (
    (CASE WHEN COALESCE(emp.photo_url, emp.avatar_url) IS NOT NULL AND COALESCE(emp.photo_url, emp.avatar_url) <> '' THEN 20 ELSE 0 END) +
    (CASE WHEN COALESCE(emp.bio, emp.about_me) IS NOT NULL AND length(COALESCE(emp.bio, emp.about_me)) > 20 THEN 20 ELSE 0 END) +
    (CASE WHEN array_length(emp.skills, 1) > 0 OR array_length(emp.expertise, 1) > 0 THEN 20 ELSE 0 END) +
    (CASE WHEN (emp.email IS NOT NULL AND emp.email <> '') AND (emp.phone IS NOT NULL AND emp.phone <> '') THEN 20 ELSE 0 END) +
    (CASE WHEN emp.emergency_contact IS NOT NULL AND emp.emergency_contact ? 'name' THEN 20 ELSE 0 END)
  )::integer
$$;