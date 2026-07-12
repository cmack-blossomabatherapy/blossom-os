
CREATE TABLE IF NOT EXISTS public.phone_dial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_number_e164 text NOT NULL,
  linked_lead_id uuid REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  linked_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  linked_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  context_label text,
  dialed_at timestamptz NOT NULL DEFAULT now(),
  matched_ctm_call_id uuid REFERENCES public.ctm_call_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.phone_dial_events TO authenticated;
GRANT ALL ON public.phone_dial_events TO service_role;

ALTER TABLE public.phone_dial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own dial events"
  ON public.phone_dial_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own dial events"
  ON public.phone_dial_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Ops leadership read all dial events"
  ON public.phone_dial_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
    OR public.has_role(auth.uid(), 'intake'::app_role)
    OR public.has_role(auth.uid(), 'state_director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE INDEX IF NOT EXISTS idx_phone_dial_events_user_time
  ON public.phone_dial_events (user_id, dialed_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_dial_events_target
  ON public.phone_dial_events (target_number_e164, dialed_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_dial_events_lead
  ON public.phone_dial_events (linked_lead_id) WHERE linked_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phone_dial_events_client
  ON public.phone_dial_events (linked_client_id) WHERE linked_client_id IS NOT NULL;

ALTER TABLE public.ctm_call_events
  ADD COLUMN IF NOT EXISTS matched_lead_id uuid REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matched_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matched_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matched_agent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_dial_event_id uuid REFERENCES public.phone_dial_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ctm_call_events_from ON public.ctm_call_events (from_number);
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_to ON public.ctm_call_events (to_number);
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_called_at ON public.ctm_call_events (called_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_matched_lead ON public.ctm_call_events (matched_lead_id) WHERE matched_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_matched_client ON public.ctm_call_events (matched_client_id) WHERE matched_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_matched_employee ON public.ctm_call_events (matched_employee_id) WHERE matched_employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_matched_agent ON public.ctm_call_events (matched_agent_user_id) WHERE matched_agent_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ctm_call_events_transcript_fts
  ON public.ctm_call_events USING GIN (to_tsvector('english', coalesce(transcript, '')));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ctm_call_events'
      AND policyname = 'Phone-authorized roles read CTM calls'
  ) THEN
    CREATE POLICY "Phone-authorized roles read CTM calls"
      ON public.ctm_call_events FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(), 'super_admin'::app_role)
        OR public.has_role(auth.uid(), 'executive_leadership'::app_role)
        OR public.has_role(auth.uid(), 'operations_leadership'::app_role)
        OR public.has_role(auth.uid(), 'intake'::app_role)
        OR public.has_role(auth.uid(), 'state_director'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;
