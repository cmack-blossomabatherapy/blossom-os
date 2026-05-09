
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- critical_alerts: canonical alert rows
CREATE TABLE IF NOT EXISTS public.critical_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'critical' CHECK (severity IN ('info','warning','critical')),
  title text NOT NULL,
  message text,
  record_id uuid,
  record_type text,
  deep_link text NOT NULL,
  due_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  assignee_user_id uuid,
  pushed_at timestamptz,
  push_attempts int NOT NULL DEFAULT 0,
  push_last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS critical_alerts_scan_idx
  ON public.critical_alerts (severity, due_at, pushed_at)
  WHERE pushed_at IS NULL AND status = 'open';

CREATE TRIGGER critical_alerts_touch_updated_at
  BEFORE UPDATE ON public.critical_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.critical_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view critical alerts"
  ON public.critical_alerts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert critical alerts"
  ON public.critical_alerts FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update critical alerts"
  ON public.critical_alerts FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete critical alerts"
  ON public.critical_alerts FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- push_subscriptions: per-device web push subscription
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
