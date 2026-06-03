
CREATE TABLE IF NOT EXISTS public.phone_ai_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id text UNIQUE NOT NULL,
  agent_id text,
  call_status text,
  caller_name text,
  caller_type text,
  phone_number text,
  preferred_callback_time text,
  state text,
  child_age text,
  insurance_provider text,
  insurance_type text,
  reason_for_call text,
  call_summary text,
  urgency_level text,
  sentiment text,
  caller_emotion text,
  call_outcome text,
  needs_intake_follow_up boolean DEFAULT false,
  emergency_flag boolean DEFAULT false,
  department_to_notify text,
  handling_instructions text,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  recording_url text,
  transcript text,
  transcript_object jsonb,
  custom_analysis_data jsonb,
  raw_retell_payload jsonb,
  follow_up_status text DEFAULT 'new',
  follow_up_notes text,
  owner_id uuid REFERENCES auth.users(id),
  source text DEFAULT 'webhook',
  verification_status text DEFAULT 'unverified',
  call_started_at timestamptz,
  call_ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_ai_calls_created_at ON public.phone_ai_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_ai_calls_follow_up_status ON public.phone_ai_calls(follow_up_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_ai_calls TO authenticated;
GRANT ALL ON public.phone_ai_calls TO service_role;

ALTER TABLE public.phone_ai_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read phone_ai_calls"
  ON public.phone_ai_calls FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can update phone_ai_calls"
  ON public.phone_ai_calls FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can insert phone_ai_calls"
  ON public.phone_ai_calls FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.phone_ai_calls_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_phone_ai_calls_updated_at ON public.phone_ai_calls;
CREATE TRIGGER trg_phone_ai_calls_updated_at
  BEFORE UPDATE ON public.phone_ai_calls
  FOR EACH ROW EXECUTE FUNCTION public.phone_ai_calls_set_updated_at();
