
CREATE TABLE public.user_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  training_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  progress_percent integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, training_id)
);

CREATE INDEX idx_utp_user_status ON public.user_training_progress (user_id, status, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_training_progress TO authenticated;
GRANT ALL ON public.user_training_progress TO service_role;

ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utp_owner_select" ON public.user_training_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "utp_owner_insert" ON public.user_training_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "utp_owner_update" ON public.user_training_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "utp_owner_delete" ON public.user_training_progress
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_user_training_progress()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_touch_user_training_progress
  BEFORE UPDATE ON public.user_training_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_training_progress();
