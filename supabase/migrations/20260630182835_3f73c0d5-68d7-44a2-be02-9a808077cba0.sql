INSERT INTO public.role_permissions (role, permission_key)
SELECT 'qa_director'::public.app_role, permission_key
FROM public.role_permissions
WHERE role = 'qa'::public.app_role
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'qa_specialist'::public.app_role, permission_key
FROM public.role_permissions
WHERE role = 'qa'::public.app_role
ON CONFLICT DO NOTHING;