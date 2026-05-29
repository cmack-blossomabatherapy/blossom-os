
create or replace function public.get_nfc_badge(_code text)
returns table (
  employee_id uuid,
  display_name text,
  job_title text,
  photo_url text,
  email text,
  phone text,
  department_name text,
  states text[],
  state text,
  badge_style text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as employee_id,
    coalesce(nullif(trim(coalesce(e.preferred_name, '') || ' ' || coalesce(e.last_name, '')), ''),
             nullif(trim(coalesce(e.first_name, '') || ' ' || coalesce(e.last_name, '')), ''),
             e.email,
             'Blossom Employee') as display_name,
    e.job_title,
    e.photo_url,
    e.email,
    e.phone,
    d.name as department_name,
    e.states_supported as states,
    e.state,
    case
      when lower(coalesce(e.job_title, '')) ~ '(rbt|bcba|bcaba|behavior tech|behavioral tech|therapist|behavior analyst|registered behavior)'
        then 'parent_safety'
      else 'business_card'
    end as badge_style
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
  limit 1;
$$;

grant execute on function public.get_nfc_badge(text) to anon, authenticated, service_role;
