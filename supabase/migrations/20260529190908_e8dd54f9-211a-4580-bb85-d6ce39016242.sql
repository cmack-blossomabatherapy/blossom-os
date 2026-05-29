
CREATE OR REPLACE FUNCTION public.guard_employee_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id = auth.uid()
     AND NOT (
       public.has_role(auth.uid(),'admin')
       OR public.has_role(auth.uid(),'hr_admin')
       OR public.has_role(auth.uid(),'hr_manager')
       OR public.has_role(auth.uid(),'hr')
     )
  THEN
    -- Lock everything except the self-editable fields: photo, name, address, meeting link, pronouns, bio
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.employee_code := OLD.employee_code;
    NEW.job_title := OLD.job_title;
    NEW.department_id := OLD.department_id;
    NEW.manager_id := OLD.manager_id;
    NEW.state := OLD.state;
    NEW.states_supported := OLD.states_supported;
    NEW.status := OLD.status;
    NEW.employment_type := OLD.employment_type;
    NEW.pay_type := OLD.pay_type;
    NEW.pay_rate := OLD.pay_rate;
    NEW.work_setting := OLD.work_setting;
    NEW.hire_date := OLD.hire_date;
    NEW.start_date := OLD.start_date;
    NEW.termination_date := OLD.termination_date;
    NEW.viventium_employee_id := OLD.viventium_employee_id;
    NEW.viventium_sync_status := OLD.viventium_sync_status;
    NEW.viventium_last_sync := OLD.viventium_last_sync;
    NEW.email := OLD.email;
    NEW.credential := OLD.credential;
    NEW.leadership_level := OLD.leadership_level;
    NEW.leadership_badge := OLD.leadership_badge;
    NEW.kiosk_enabled := OLD.kiosk_enabled;
    NEW.kiosk_pin := OLD.kiosk_pin;
    NEW.nfc_settings := OLD.nfc_settings;
    NEW.show_in_directory := OLD.show_in_directory;
    NEW.show_in_org_chart := OLD.show_in_org_chart;
    NEW.contact_visibility := OLD.contact_visibility;
    NEW.resource_hub_access := OLD.resource_hub_access;
    NEW.supports_onboarding := OLD.supports_onboarding;
    NEW.featured := OLD.featured;
    NEW.grandfathered := OLD.grandfathered;
    NEW.unlock_level := OLD.unlock_level;
    NEW.directory_onboarding_status := OLD.directory_onboarding_status;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END;
$$;
