CREATE POLICY "Employee self-enroll"
ON public.academy_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = academy_enrollments.employee_id
      AND e.user_id = auth.uid()
  )
);