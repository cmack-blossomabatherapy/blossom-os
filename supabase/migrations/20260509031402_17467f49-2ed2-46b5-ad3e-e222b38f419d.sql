
CREATE TABLE IF NOT EXISTS public.onboarding_milestone_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase text NOT NULL,
  item text NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, phase, item)
);

ALTER TABLE public.onboarding_milestone_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own onboarding progress"
  ON public.onboarding_milestone_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own onboarding progress"
  ON public.onboarding_milestone_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own onboarding progress"
  ON public.onboarding_milestone_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own onboarding progress"
  ON public.onboarding_milestone_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER onboarding_milestone_progress_touch
  BEFORE UPDATE ON public.onboarding_milestone_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user
  ON public.onboarding_milestone_progress (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_milestone_progress;
