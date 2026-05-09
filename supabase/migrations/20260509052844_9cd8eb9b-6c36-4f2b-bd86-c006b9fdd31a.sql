CREATE TABLE IF NOT EXISTS public.alert_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_id uuid NOT NULL REFERENCES public.critical_alerts(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, alert_id)
);

CREATE INDEX IF NOT EXISTS alert_reads_user_idx ON public.alert_reads (user_id, read_at DESC);

ALTER TABLE public.alert_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alert reads"
  ON public.alert_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own alerts read"
  ON public.alert_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own alert reads"
  ON public.alert_reads FOR DELETE TO authenticated USING (auth.uid() = user_id);
