CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','expired','skipped')),
  attempt integer NOT NULL DEFAULT 1,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS push_deliveries_sent_unique
  ON public.push_deliveries (alert_id, user_id, endpoint)
  WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS push_deliveries_alert_user_idx
  ON public.push_deliveries (alert_id, user_id);

ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view push deliveries"
  ON public.push_deliveries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
