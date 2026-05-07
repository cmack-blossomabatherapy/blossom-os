CREATE POLICY "Employees can view their own record"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());