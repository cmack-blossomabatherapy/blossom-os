
CREATE TABLE public.phone_ai_call_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL UNIQUE,
  emails text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_ai_call_routing TO authenticated;
GRANT ALL ON public.phone_ai_call_routing TO service_role;

ALTER TABLE public.phone_ai_call_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read routing" ON public.phone_ai_call_routing FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write routing" ON public.phone_ai_call_routing FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.phone_ai_call_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES public.phone_ai_calls(id) ON DELETE CASCADE,
  retell_call_id text,
  department text,
  recipients text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.phone_ai_call_notifications TO authenticated;
GRANT ALL ON public.phone_ai_call_notifications TO service_role;

ALTER TABLE public.phone_ai_call_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read notif" ON public.phone_ai_call_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "service insert notif" ON public.phone_ai_call_notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.tg_phone_ai_call_routing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER phone_ai_call_routing_updated_at
BEFORE UPDATE ON public.phone_ai_call_routing
FOR EACH ROW EXECUTE FUNCTION public.tg_phone_ai_call_routing_updated_at();

INSERT INTO public.phone_ai_call_routing (department, emails, enabled, notes) VALUES
  ('intake',     '{}', true,  'General intake follow-ups'),
  ('urgent',     '{}', true,  'Emergency / urgent flagged calls'),
  ('billing',    '{}', true,  'Billing and insurance questions'),
  ('scheduling', '{}', true,  'Scheduling / appointment requests'),
  ('hr',         '{}', true,  'HR / staffing related calls'),
  ('unverified', '{}', true,  'Calls AI could not classify or webhook unverified')
ON CONFLICT (department) DO NOTHING;
