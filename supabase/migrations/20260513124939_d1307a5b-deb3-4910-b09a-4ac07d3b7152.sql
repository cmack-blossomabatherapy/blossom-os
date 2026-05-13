
CREATE TABLE IF NOT EXISTS public.journey_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  phase_id TEXT,
  path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_events_user ON public.journey_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journey_events_phase ON public.journey_events(phase_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journey_events_type ON public.journey_events(event_type, created_at DESC);

ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert their own journey events"
ON public.journey_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users read their own journey events"
ON public.journey_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "hr and admins read all journey events"
ON public.journey_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'hr')
  OR public.has_role(auth.uid(), 'hr_admin')
  OR public.has_role(auth.uid(), 'hr_manager')
  OR public.has_role(auth.uid(), 'training_admin')
);
