INSERT INTO public.user_roles (user_id, role)
SELECT 'a6d01474-ada0-4f17-9796-dee838f2c1f4'::uuid, r::app_role
FROM unnest(ARRAY['admin','exec','ops_manager','hr_admin','hr_manager','training_admin']) AS r
ON CONFLICT (user_id, role) DO NOTHING;