-- Restrict After-Hours AI routing to the 6 official departments and clean obsolete ones.
DELETE FROM public.phone_ai_call_routing WHERE department NOT IN ('intake','scheduling','state_director','hr','unverified','urgent');

INSERT INTO public.phone_ai_call_routing (department, emails, enabled, notes) VALUES
  ('intake',         '{}', true,  'New families, intake questions, callbacks'),
  ('scheduling',     '{}', true,  'Reschedules, cancellations, schedule changes'),
  ('state_director', '{}', true,  'Escalations, complaints, leadership questions per state'),
  ('hr',             '{}', true,  'Staff/employee issues, HR-related calls'),
  ('urgent',         '{}', true,  'Emergencies, high-urgency callbacks'),
  ('unverified',     '{}', true,  'AI could not classify, webhook unverified, manual review required')
ON CONFLICT (department) DO NOTHING;