
-- Expand role checks to include "Office"
ALTER TABLE public.evaluation_rules DROP CONSTRAINT IF EXISTS evaluation_rules_role_check;
ALTER TABLE public.evaluation_rules ADD CONSTRAINT evaluation_rules_role_check
  CHECK (role = ANY (ARRAY['BCBA'::text, 'RBT'::text, 'Office'::text]));

ALTER TABLE public.evaluation_staff DROP CONSTRAINT IF EXISTS evaluation_staff_role_check;
ALTER TABLE public.evaluation_staff ADD CONSTRAINT evaluation_staff_role_check
  CHECK (role = ANY (ARRAY['BCBA'::text, 'RBT'::text, 'Office'::text]));

ALTER TABLE public.evaluation_forms DROP CONSTRAINT IF EXISTS evaluation_forms_staff_role_check;
ALTER TABLE public.evaluation_forms ADD CONSTRAINT evaluation_forms_staff_role_check
  CHECK (staff_role = ANY (ARRAY['BCBA'::text, 'RBT'::text, 'Office'::text]));

-- Seed default rules for Office role (disabled by default for 30-Day, enabled for Quarterly and Annual)
INSERT INTO public.evaluation_rules (role, eval_type, enabled, first_offset_days, cadence_days, reminder_days_before)
VALUES
  ('Office', '30-Day',    false, 30,  NULL, 7),
  ('Office', 'Quarterly', true,  90,  90,   14),
  ('Office', 'Annual',    true,  365, 365,  21)
ON CONFLICT (role, eval_type) DO NOTHING;
