insert into public.user_roles (user_id, role)
select 'c77dcf1e-c155-4f5d-bc23-e2c47b39e091'::uuid, 'marketing'::app_role
where not exists (
  select 1 from public.user_roles
  where user_id = 'c77dcf1e-c155-4f5d-bc23-e2c47b39e091'::uuid
    and role = 'marketing'::app_role
);

delete from public.user_roles
where user_id = 'c77dcf1e-c155-4f5d-bc23-e2c47b39e091'::uuid
  and role = 'staff'::app_role;