GRANT SELECT ON public.hr_departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hr_departments TO authenticated;
GRANT ALL ON public.hr_departments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_relationships TO authenticated;
GRANT ALL ON public.employee_relationships TO service_role;

GRANT SELECT ON public.v_employee_directory TO authenticated;
GRANT SELECT ON public.v_employee_directory TO service_role;