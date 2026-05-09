CREATE TABLE public.mobile_alert_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_key text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, alert_key)
);

CREATE INDEX idx_mobile_alert_dismissals_user ON public.mobile_alert_dismissals (user_id);

ALTER TABLE public.mobile_alert_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissals"
  ON public.mobile_alert_dismissals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own dismissals"
  ON public.mobile_alert_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own dismissals"
  ON public.mobile_alert_dismissals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);