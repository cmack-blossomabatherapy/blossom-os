
CREATE TABLE IF NOT EXISTS public.leadership_video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_key text NOT NULL,
  position_seconds numeric NOT NULL DEFAULT 0,
  duration_seconds numeric,
  completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_key)
);

ALTER TABLE public.leadership_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own video progress"
  ON public.leadership_video_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own video progress"
  ON public.leadership_video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own video progress"
  ON public.leadership_video_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own video progress"
  ON public.leadership_video_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER leadership_video_progress_touch
  BEFORE UPDATE ON public.leadership_video_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_leadership_video_progress_user
  ON public.leadership_video_progress (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leadership_video_progress;
