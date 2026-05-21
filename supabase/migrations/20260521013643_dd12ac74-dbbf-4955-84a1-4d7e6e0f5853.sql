
-- 1) Wipe employee roster (history tables untouched)
DELETE FROM public.employees;

-- 2) Seed test State Director auth user (idempotent)
DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'teststatedirector@blossomabatherapy.com';

  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'teststatedirector@blossomabatherapy.com',
      crypt('Blossom@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Test State Director"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'teststatedirector@blossomabatherapy.com', 'email_verified', true),
      'email', v_user_id::text, now(), now(), now()
    );
  ELSE
    v_user_id := v_existing;
    -- Reset password if user existed
    UPDATE auth.users
      SET encrypted_password = crypt('Blossom@123', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Profile
  INSERT INTO public.profiles (user_id, display_name, email, state, part_of_leadership, dashboard_access, active)
  VALUES (v_user_id, 'Test State Director', 'teststatedirector@blossomabatherapy.com', 'NC', true, 'department', true)
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        state = EXCLUDED.state,
        part_of_leadership = true,
        active = true,
        updated_at = now();

  -- Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'state_director')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
