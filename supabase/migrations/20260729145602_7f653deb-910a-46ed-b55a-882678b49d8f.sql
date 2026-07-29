ALTER TABLE public.recruiting_staffing_needs
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS service_setting text,
  ADD COLUMN IF NOT EXISTS desired_start_date date,
  ADD COLUMN IF NOT EXISTS required_availability text,
  ADD COLUMN IF NOT EXISTS preference_notes text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS entered_by uuid,
  ADD COLUMN IF NOT EXISTS handoff_status text NOT NULL DEFAULT 'proposed',
  ADD COLUMN IF NOT EXISTS handoff_blocker text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_reason text;

ALTER TABLE public.recruiting_staffing_needs
  DROP CONSTRAINT IF EXISTS recruiting_staffing_needs_handoff_status_chk;
ALTER TABLE public.recruiting_staffing_needs
  ADD CONSTRAINT recruiting_staffing_needs_handoff_status_chk
  CHECK (handoff_status IN ('proposed','pending_review','accepted','declined','cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_staffing_handoff
  ON public.recruiting_staffing_needs (lower(client_label), role_needed, matched_candidate_id)
  WHERE matched_candidate_id IS NOT NULL
    AND handoff_status IN ('proposed','pending_review','accepted');

CREATE TABLE IF NOT EXISTS public.recruiting_staffing_need_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.recruiting_staffing_needs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.recruiting_staffing_need_events TO authenticated;
GRANT ALL ON public.recruiting_staffing_need_events TO service_role;
ALTER TABLE public.recruiting_staffing_need_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read staffing need events" ON public.recruiting_staffing_need_events;
CREATE POLICY "Read staffing need events"
  ON public.recruiting_staffing_need_events FOR SELECT TO authenticated
  USING (public.recruiting_can_read(auth.uid()) OR public.has_permission(auth.uid(), 'staffing.view'));

DROP POLICY IF EXISTS "Write staffing need events" ON public.recruiting_staffing_need_events;
CREATE POLICY "Write staffing need events"
  ON public.recruiting_staffing_need_events FOR INSERT TO authenticated
  WITH CHECK (public.recruiting_can_write(auth.uid()) OR public.has_permission(auth.uid(), 'staffing.edit'));

CREATE INDEX IF NOT EXISTS idx_rsn_events_need ON public.recruiting_staffing_need_events(need_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsn_handoff_status ON public.recruiting_staffing_needs(handoff_status, role_needed);