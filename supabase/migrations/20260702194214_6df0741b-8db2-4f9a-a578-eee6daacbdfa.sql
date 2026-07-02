
-- HR activity events (durable audit/timeline for HR workflows)
CREATE TABLE IF NOT EXISTS public.hr_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid,
  onboarding_id uuid,
  case_id uuid,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_activity_events TO authenticated;
GRANT ALL ON public.hr_activity_events TO service_role;
ALTER TABLE public.hr_activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR staff read events" ON public.hr_activity_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR staff insert events" ON public.hr_activity_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "HR staff update events" ON public.hr_activity_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_hr_activity_events_employee ON public.hr_activity_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_activity_events_onboarding ON public.hr_activity_events(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_hr_activity_events_case ON public.hr_activity_events(case_id);
CREATE INDEX IF NOT EXISTS idx_hr_activity_events_created ON public.hr_activity_events(created_at DESC);

-- HR messages (durable queue for messaging; no fake provider sends)
CREATE TABLE IF NOT EXISTS public.hr_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid,
  case_id uuid,
  subject text,
  body text NOT NULL,
  channels text[] NOT NULL DEFAULT '{}'::text[],
  route_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_messages TO authenticated;
GRANT ALL ON public.hr_messages TO service_role;
ALTER TABLE public.hr_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR staff read messages" ON public.hr_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR staff insert messages" ON public.hr_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "HR staff update messages" ON public.hr_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_hr_messages_employee ON public.hr_messages(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_messages_status ON public.hr_messages(status);
CREATE INDEX IF NOT EXISTS idx_hr_messages_created ON public.hr_messages(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_hr_messages_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_hr_messages_updated_at ON public.hr_messages;
CREATE TRIGGER trg_hr_messages_updated_at BEFORE UPDATE ON public.hr_messages
FOR EACH ROW EXECUTE FUNCTION public.set_hr_messages_updated_at();

-- Seed a small set of HR resources if none exist yet (idempotent by title)
INSERT INTO public.hr_resources (title, description, kind, category, is_pinned, is_active, upload_status, sensitivity, resource_type, tags, departments, visibility_roles, source_note)
SELECT * FROM (VALUES
  ('HR Onboarding SOP', 'End-to-end operational onboarding workflow for new hires.', 'policy'::hr_resource_kind, 'onboarding'::hr_resource_category, true, true, 'published', 'public_internal', 'SOP', ARRAY['onboarding','new-hire']::text[], ARRAY['hr']::text[], ARRAY['hr_team','hr_director']::text[], 'Seeded by HR completion pass'),
  ('Viventium Readiness Checklist', 'Fields and documents required before an employee is Viventium-ready.', 'policy'::hr_resource_kind, 'onboarding'::hr_resource_category, true, true, 'published', 'public_internal', 'Checklist', ARRAY['viventium','readiness']::text[], ARRAY['hr']::text[], ARRAY['hr_team']::text[], 'Seeded by HR completion pass'),
  ('Stellar Checks Background Workflow', 'How HR runs and tracks Stellar background checks.', 'policy'::hr_resource_kind, 'onboarding'::hr_resource_category, false, true, 'published', 'public_internal', 'Workflow', ARRAY['stellar','background']::text[], ARRAY['hr']::text[], ARRAY['hr_team']::text[], 'Seeded by HR completion pass'),
  ('CentralReach Clinical Credentialing Handoff', 'Checklist for handing off clinicians to CentralReach.', 'policy'::hr_resource_kind, 'onboarding'::hr_resource_category, false, true, 'published', 'public_internal', 'Checklist', ARRAY['centralreach','credentialing']::text[], ARRAY['hr']::text[], ARRAY['hr_team']::text[], 'Seeded by HR completion pass'),
  ('Employee Support Escalation Guide', 'Escalation paths and ownership for HR support cases.', 'policy'::hr_resource_kind, 'general'::hr_resource_category, false, true, 'published', 'public_internal', 'Guide', ARRAY['support','escalation']::text[], ARRAY['hr']::text[], ARRAY['hr_team']::text[], 'Seeded by HR completion pass'),
  ('Training & Certification Tracking Guide', 'How HR tracks and renews required trainings and certifications.', 'policy'::hr_resource_kind, 'training'::hr_resource_category, false, true, 'published', 'public_internal', 'Guide', ARRAY['training','certifications']::text[], ARRAY['hr']::text[], ARRAY['hr_team']::text[], 'Seeded by HR completion pass')
) AS v(title, description, kind, category, is_pinned, is_active, upload_status, sensitivity, resource_type, tags, departments, visibility_roles, source_note)
WHERE NOT EXISTS (SELECT 1 FROM public.hr_resources r WHERE r.title = v.title);
