
CREATE TABLE IF NOT EXISTS public.alert_sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  label text,
  category text NOT NULL CHECK (category IN ('task','approval','overdue','compliance')),
  payor text,
  state text,
  -- Hours relative to due_at. Negative = before due, positive = after due.
  warning_offset_hours integer NOT NULL DEFAULT 0,
  critical_offset_hours integer NOT NULL DEFAULT 24,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alert_sla_rules_threshold_order CHECK (critical_offset_hours >= warning_offset_hours)
);

CREATE UNIQUE INDEX IF NOT EXISTS alert_sla_rules_scope_idx
  ON public.alert_sla_rules (alert_type, COALESCE(payor, ''), COALESCE(state, ''));

CREATE TRIGGER alert_sla_rules_touch_updated_at
  BEFORE UPDATE ON public.alert_sla_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.alert_sla_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view alert SLA rules"
  ON public.alert_sla_rules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage alert SLA rules - insert"
  ON public.alert_sla_rules FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage alert SLA rules - update"
  ON public.alert_sla_rules FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage alert SLA rules - delete"
  ON public.alert_sla_rules FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.resolve_alert_sla(_alert_type text, _payor text, _state text)
RETURNS TABLE(
  rule_id uuid,
  alert_type text,
  category text,
  warning_offset_hours integer,
  critical_offset_hours integer,
  payor text,
  state text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, alert_type, category, warning_offset_hours, critical_offset_hours, payor, state
  FROM public.alert_sla_rules
  WHERE active = true
    AND alert_type = _alert_type
    AND (payor IS NULL OR payor = _payor)
    AND (state IS NULL OR state = _state)
  ORDER BY
    (CASE WHEN payor IS NOT NULL AND state IS NOT NULL THEN 0
          WHEN state IS NOT NULL THEN 1
          WHEN payor IS NOT NULL THEN 2
          ELSE 3 END)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_alert_sla(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_alert_sla(text, text, text) TO authenticated;

-- Seed defaults (wildcard payor/state). Negative = hours before due.
INSERT INTO public.alert_sla_rules (alert_type, label, category, warning_offset_hours, critical_offset_hours, notes) VALUES
  ('task_overdue',           'Client task',                  'task',       0,    48,   'Warn at due, critical 2d overdue'),
  ('intake_task_overdue',    'Intake task',                  'task',       0,    48,   'Warn at due, critical 2d overdue'),
  ('compliance_flag',        'Compliance flag',              'compliance', 0,    24,   'Warn at open, critical after 1d'),
  ('authorization_expiring', 'Authorization expiring',       'overdue',   -720, -168,  'Warn 30d before, critical 7d before'),
  ('authorization_denied',   'Authorization denied',         'overdue',    0,    0,    'Always critical'),
  ('reauth_at_risk',         'Reauth at risk',               'overdue',   -168, -72,   'Warn 7d before, critical 3d before'),
  ('payroll_pending',        'Payroll awaiting release',     'approval',   0,    24,   'Approval queue SLA'),
  ('test',                   'Test alert',                   'overdue',    0,    0,    'Used by Send-test action')
ON CONFLICT DO NOTHING;
