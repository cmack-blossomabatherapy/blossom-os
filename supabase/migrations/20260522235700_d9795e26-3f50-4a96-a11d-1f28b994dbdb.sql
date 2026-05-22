
-- 1. Fix is_access_request_reviewer: remove hardcoded emails
CREATE OR REPLACE FUNCTION public.is_access_request_reviewer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','hr','hr_admin','hr_manager','exec','ops_manager','training_admin')
  )
$$;

-- Add an INSERT policy so reviewers can create access requests through the app
DROP POLICY IF EXISTS "Reviewers can insert access requests" ON public.access_requests;
CREATE POLICY "Reviewers can insert access requests"
  ON public.access_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_access_request_reviewer(auth.uid()));

-- 2. Academy audit log: require user_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert their own academy audit entries" ON public.academy_audit_log;
CREATE POLICY "Users can insert their own academy audit entries"
  ON public.academy_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. User roles: drop privilege-escalation policies
DROP POLICY IF EXISTS "HR admins can grant training_admin" ON public.user_roles;
DROP POLICY IF EXISTS "HR admins can revoke training_admin" ON public.user_roles;

-- 4. Profiles: restrict broad read
DROP POLICY IF EXISTS "Signed-in users view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin and HR view all profiles" ON public.profiles;

CREATE POLICY "Users view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin and HR view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'exec')
    OR public.has_role(auth.uid(),'ops_manager')
    OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_role(auth.uid(),'hr_manager')
    OR public.has_role(auth.uid(),'hr')
    OR public.has_role(auth.uid(),'training_admin')
  );

-- 5. Employees: remove anonymous directory access (require auth)
DROP POLICY IF EXISTS "Public directory read" ON public.employees;

-- 6. Employee notes: respect visibility column
DROP POLICY IF EXISTS "View emp notes" ON public.employee_notes;
CREATE POLICY "View emp notes"
  ON public.employee_notes FOR SELECT TO authenticated
  USING (
    has_permission(auth.uid(), 'hr.notes.view')
    AND (
      visibility <> 'hr_only'
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr_admin')
      OR public.has_role(auth.uid(),'hr_manager')
      OR public.has_role(auth.uid(),'hr')
    )
  );

-- 7. Journey-resources storage bucket: restrict writes to admin/HR
DROP POLICY IF EXISTS "Authenticated delete journey-resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update journey-resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload journey-resources" ON storage.objects;

CREATE POLICY "Admin/HR upload journey-resources"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'journey-resources' AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr_admin')
      OR public.has_role(auth.uid(),'hr_manager')
      OR public.has_role(auth.uid(),'hr')
      OR public.has_role(auth.uid(),'training_admin')
    )
  );

CREATE POLICY "Admin/HR update journey-resources"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'journey-resources' AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr_admin')
      OR public.has_role(auth.uid(),'hr_manager')
      OR public.has_role(auth.uid(),'hr')
      OR public.has_role(auth.uid(),'training_admin')
    )
  );

CREATE POLICY "Admin/HR delete journey-resources"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'journey-resources' AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'hr_admin')
      OR public.has_role(auth.uid(),'hr_manager')
      OR public.has_role(auth.uid(),'hr')
      OR public.has_role(auth.uid(),'training_admin')
    )
  );
