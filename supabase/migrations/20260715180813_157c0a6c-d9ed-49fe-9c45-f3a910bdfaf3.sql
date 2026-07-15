
CREATE TABLE public.academy_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  journey_slug TEXT,
  track_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT academy_lesson_progress_uq UNIQUE (user_id, module_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_lesson_progress TO authenticated;
GRANT ALL ON public.academy_lesson_progress TO service_role;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners view own lesson progress"
  ON public.academy_lesson_progress FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Learners insert own lesson progress"
  ON public.academy_lesson_progress FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Learners update own lesson progress"
  ON public.academy_lesson_progress FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Learners delete own lesson progress"
  ON public.academy_lesson_progress FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_academy_lesson_progress_user ON public.academy_lesson_progress (user_id);
CREATE INDEX idx_academy_lesson_progress_user_module ON public.academy_lesson_progress (user_id, module_id);

CREATE OR REPLACE FUNCTION public.trg_academy_lesson_progress_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_academy_lesson_progress_touch
  BEFORE UPDATE ON public.academy_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_academy_lesson_progress_touch();


CREATE TABLE public.academy_last_position (
  user_id UUID NOT NULL PRIMARY KEY,
  journey_slug TEXT NOT NULL,
  track_id TEXT,
  module_id TEXT NOT NULL,
  lesson_id TEXT,
  module_title TEXT,
  lesson_title TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_last_position TO authenticated;
GRANT ALL ON public.academy_last_position TO service_role;
ALTER TABLE public.academy_last_position ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners view own last position"
  ON public.academy_last_position FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Learners insert own last position"
  ON public.academy_last_position FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Learners update own last position"
  ON public.academy_last_position FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Learners delete own last position"
  ON public.academy_last_position FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.trg_academy_last_position_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_academy_last_position_touch
  BEFORE UPDATE ON public.academy_last_position
  FOR EACH ROW EXECUTE FUNCTION public.trg_academy_last_position_touch();
