CREATE TABLE IF NOT EXISTS public.state_daily_health_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  wins TEXT,
  blockers TEXT,
  intake_status TEXT,
  staffing_status TEXT,
  scheduling_status TEXT,
  authorizations_status TEXT,
  recruiting_status TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state_code, note_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_daily_health_notes TO authenticated;
GRANT ALL ON public.state_daily_health_notes TO service_role;

ALTER TABLE public.state_daily_health_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "state_health_notes_read"
  ON public.state_daily_health_notes
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'executive')
    OR public.has_role(auth.uid(), 'director_of_operations')
    OR public.has_role(auth.uid(), 'operations_manager')
    OR public.has_role(auth.uid(), 'state_director')
    OR public.has_role(auth.uid(), 'assistant_state_director')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.state = state_daily_health_notes.state_code
    )
  );

CREATE POLICY "state_health_notes_insert"
  ON public.state_daily_health_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.state = state_daily_health_notes.state_code
    )
  );

CREATE POLICY "state_health_notes_update"
  ON public.state_daily_health_notes
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.state = state_daily_health_notes.state_code
    )
  );

DROP TRIGGER IF EXISTS trg_state_daily_health_notes_updated_at ON public.state_daily_health_notes;
CREATE TRIGGER trg_state_daily_health_notes_updated_at
  BEFORE UPDATE ON public.state_daily_health_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.state_daily_health_notes REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.state_daily_health_notes;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;