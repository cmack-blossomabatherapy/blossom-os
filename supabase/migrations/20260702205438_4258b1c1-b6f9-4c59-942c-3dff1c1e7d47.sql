
-- Helper: is the current user an HR-facing operator?
CREATE OR REPLACE FUNCTION public.is_hr_operator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin'::public.app_role,
        'super_admin'::public.app_role,
        'hr'::public.app_role,
        'hr_admin'::public.app_role,
        'hr_manager'::public.app_role,
        'hr_lead'::public.app_role,
        'training_admin'::public.app_role,
        'exec'::public.app_role,
        'ops_manager'::public.app_role
      )
  )
$$;

-- Tighten hr_activity_events RLS
DROP POLICY IF EXISTS "HR staff read events" ON public.hr_activity_events;
DROP POLICY IF EXISTS "HR staff insert events" ON public.hr_activity_events;
DROP POLICY IF EXISTS "HR staff update events" ON public.hr_activity_events;

CREATE POLICY "HR operators read events"
  ON public.hr_activity_events FOR SELECT
  TO authenticated
  USING (public.is_hr_operator(auth.uid()));

CREATE POLICY "HR operators insert events"
  ON public.hr_activity_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hr_operator(auth.uid()));

CREATE POLICY "HR admins update events"
  ON public.hr_activity_events FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_lead'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_lead'::public.app_role)
  );

-- Tighten hr_messages RLS
DROP POLICY IF EXISTS "HR staff read messages" ON public.hr_messages;
DROP POLICY IF EXISTS "HR staff insert messages" ON public.hr_messages;
DROP POLICY IF EXISTS "HR staff update messages" ON public.hr_messages;

CREATE POLICY "HR operators read messages"
  ON public.hr_messages FOR SELECT
  TO authenticated
  USING (public.is_hr_operator(auth.uid()));

CREATE POLICY "HR operators insert messages"
  ON public.hr_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hr_operator(auth.uid()));

CREATE POLICY "HR admins update messages"
  ON public.hr_messages FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_lead'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_lead'::public.app_role)
  );
