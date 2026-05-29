DROP FUNCTION IF EXISTS public.get_nfc_badge(text);

CREATE OR REPLACE FUNCTION public.get_nfc_badge(_code text)
 RETURNS TABLE(employee_id uuid, employee_code text, display_name text, preferred_name text, job_title text, credential text, pronouns text, photo_url text, email text, phone text, extension text, department_name text, states text[], state text, bio text, about_me text, expertise text[], skills text[], languages text[], leadership_level text, emergency_contact jsonb, nfc_settings jsonb, badge_style text, role_key text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with row as (
    select e.*, d.name as department_name
    from public.employees e
    left join public.hr_departments d on d.id = e.department_id
    where exists (
            select 1 from public.employee_nfc_tags t
             where t.is_active = true
               and t.employee_id = e.id
               and t.tag_code = _code
          )
       or e.id::text = _code
       or e.employee_code = _code
       or e.employee_code = ('dir-' || _code)
    limit 1
  )
  select
    r.id,
    r.employee_code,
    coalesce(
      nullif(trim(coalesce(nullif(trim(r.preferred_name), ''), r.first_name, '') || ' ' || coalesce(r.last_name, '')), ''),
      nullif(trim(coalesce(r.first_name, '') || ' ' || coalesce(r.last_name, '')), ''),
      r.email,
      'Blossom Employee'
    ),
    r.preferred_name,
    r.job_title,
    r.credential,
    r.pronouns,
    r.photo_url,
    r.email,
    r.phone,
    r.extension,
    r.department_name,
    r.states_supported,
    r.state,
    r.bio,
    r.about_me,
    r.expertise,
    r.skills,
    r.languages,
    r.leadership_level::text,
    r.emergency_contact,
    r.nfc_settings,
    case
      when lower(coalesce(r.job_title, '')) ~ '(rbt|bcba|bcaba|behavior tech|behavioral tech|therapist|behavior analyst|registered behavior)'
        then 'parent_safety'
      else 'business_card'
    end,
    case
      when lower(coalesce(r.job_title, '')) ~ 'rbt|registered behavior|behavior tech' then 'rbt'
      when lower(coalesce(r.job_title, '')) ~ 'bcba|bcaba|behavior analyst' then 'bcba'
      when lower(coalesce(r.job_title, '')) ~ 'state director' then 'state_director'
      when lower(coalesce(r.job_title, '')) ~ 'intake' then 'intake'
      when lower(coalesce(r.job_title, '')) ~ 'authoriz' then 'authorizations'
      when lower(coalesce(r.job_title, '')) ~ 'schedul' then 'scheduling'
      when lower(coalesce(r.job_title, '')) ~ 'recruit' then 'recruiting'
      when lower(coalesce(r.job_title, '')) ~ 'hr|human resources|people' then 'hr'
      when lower(coalesce(r.job_title, '')) ~ 'billing|rcm|revenue|finance|payroll' then 'finance'
      when lower(coalesce(r.job_title, '')) ~ 'qa|quality' then 'qa'
      when lower(coalesce(r.job_title, '')) ~ 'marketing|growth|content' then 'marketing'
      when lower(coalesce(r.job_title, '')) ~ 'case manager|family' then 'case_manager'
      when lower(coalesce(r.job_title, '')) ~ 'ceo|coo|cfo|chief|president|executive|vp ' then 'executive'
      when lower(coalesce(r.job_title, '')) ~ 'director' then 'leadership'
      else 'employee'
    end
  from row r;
$function$;

GRANT EXECUTE ON FUNCTION public.get_nfc_badge(text) TO anon, authenticated, service_role;