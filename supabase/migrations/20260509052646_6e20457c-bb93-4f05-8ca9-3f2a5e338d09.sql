CREATE TABLE IF NOT EXISTS public.push_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

ALTER TABLE public.push_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own push prefs"
  ON public.push_notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own push prefs"
  ON public.push_notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own push prefs"
  ON public.push_notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own push prefs"
  ON public.push_notification_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_push_pref_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_push_prefs_updated_at
  BEFORE UPDATE ON public.push_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_push_pref_updated_at();
