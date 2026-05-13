DO $$
DECLARE
  v_user uuid;
  v_employee uuid;
  v_enroll uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE email = 'testhr@blossomabatherapy.com';
  IF v_user IS NULL THEN RAISE NOTICE 'testhr user not found'; RETURN; END IF;

  DELETE FROM public.user_roles
   WHERE user_id = v_user
     AND role IN ('hr','hr_admin','hr_manager','admin','training_admin','exec','ops_manager');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user, 'staff')
  ON CONFLICT DO NOTHING;

  UPDATE public.onboarding_state
     SET completed_steps = '{}',
         modules_complete = '{}',
         acknowledgements = '{}',
         quiz_passed = false,
         notes = '{}'::jsonb,
         checkins = '{}'::jsonb,
         completed_at = NULL,
         certificate_id = NULL,
         reset_count = COALESCE(reset_count,0) + 1,
         updated_at = now()
   WHERE user_id = v_user;

  DELETE FROM public.onboarding_milestone_progress WHERE user_id = v_user;

  SELECT id INTO v_employee FROM public.employees WHERE email = 'testhr@blossomabatherapy.com';
  IF v_employee IS NOT NULL THEN
    DELETE FROM public.employee_onboarding_tasks
     WHERE onboarding_id IN (SELECT id FROM public.employee_onboarding WHERE employee_id = v_employee);
    FOR v_enroll IN SELECT id FROM public.academy_enrollments WHERE employee_id = v_employee LOOP
      DELETE FROM public.academy_user_certificates WHERE enrollment_id = v_enroll;
      DELETE FROM public.academy_progress WHERE enrollment_id = v_enroll;
      UPDATE public.academy_enrollments
         SET status = 'active', current_week_id = NULL, updated_at = now()
       WHERE id = v_enroll;
    END LOOP;
  END IF;

  UPDATE public.profiles
     SET new_state_employee = false,
         part_of_leadership = false,
         updated_at = now()
   WHERE user_id = v_user;
END $$;