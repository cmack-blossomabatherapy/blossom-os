-- Clear all employee-linked seed data and HR-test artifacts to make room for the real directory.
DELETE FROM public.attendance_exceptions;
DELETE FROM public.time_clock_punches;
DELETE FROM public.hours_timesheet_entries;
DELETE FROM public.hours_timesheets;
DELETE FROM public.payroll_run_items;
DELETE FROM public.employee_bonuses;
DELETE FROM public.employee_pay_changes;
DELETE FROM public.employee_reviews;
DELETE FROM public.employee_trainings;
DELETE FROM public.employee_cases;
DELETE FROM public.employee_notes;
DELETE FROM public.employee_timeline;
DELETE FROM public.employee_relationships;
DELETE FROM public.employee_onboarding_tasks;
DELETE FROM public.employee_onboarding;
DELETE FROM public.employee_documents_hr;
DELETE FROM public.employees;

-- Add a "Marketing" department since it's referenced in the real directory.
INSERT INTO public.hr_departments (name, category, description)
VALUES ('Marketing', 'Marketing', 'Brand, digital marketing, and growth')
ON CONFLICT DO NOTHING;
