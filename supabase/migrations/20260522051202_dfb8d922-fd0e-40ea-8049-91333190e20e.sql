DO $$
DECLARE
  v_uid uuid;
  v_email text := 'testintake@blossomabatherapy.com';
  v_pwd text := 'Blossom@123';
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(v_pwd, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name','Test Intake Coordinator','invited_role','intake'),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', v_uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pwd, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = v_uid;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, email, job_title, department, active)
  VALUES (v_uid, 'Test Intake Coordinator', v_email, 'Intake Coordinator', 'Intake', true)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, job_title = EXCLUDED.job_title, department = EXCLUDED.department, active = true;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'intake'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;