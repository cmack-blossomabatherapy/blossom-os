-- 1) Extend the supervision log with the structured post-supervision record
ALTER TABLE public.bcba_supervision_logs
  ADD COLUMN IF NOT EXISTS supervision_format text,
  ADD COLUMN IF NOT EXISTS individual_or_group text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS observation_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cases_discussed uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills_reviewed text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS training_assigned text,
  ADD COLUMN IF NOT EXISTS followup_action text,
  ADD COLUMN IF NOT EXISTS next_supervision_date date,
  ADD COLUMN IF NOT EXISTS rbt_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS bcba_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- 2) Admin configuration: operational vs required documentation
CREATE TABLE IF NOT EXISTS public.bcba_supervision_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text UNIQUE NOT NULL,
  label text NOT NULL,
  section text,
  is_required_documentation boolean NOT NULL DEFAULT false,
  is_operational_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_supervision_config TO authenticated;
GRANT ALL    ON public.bcba_supervision_config TO service_role;
ALTER TABLE public.bcba_supervision_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads supervision config"
  ON public.bcba_supervision_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage supervision config"
  ON public.bcba_supervision_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.touch_bcba_supervision_config() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_touch_bcba_supervision_config ON public.bcba_supervision_config;
CREATE TRIGGER trg_touch_bcba_supervision_config
  BEFORE UPDATE ON public.bcba_supervision_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_bcba_supervision_config();

INSERT INTO public.bcba_supervision_config(field_key, label, section, is_required_documentation)
VALUES
  ('occurred_at',           'Date',                    'core',     true),
  ('minutes',               'Duration',                'core',     true),
  ('supervision_format',    'Format',                  'core',     true),
  ('individual_or_group',   'Individual / group',      'core',     true),
  ('observation_completed', 'Observation completed',   'core',     false),
  ('cases_discussed',       'Cases discussed',         'content',  true),
  ('skills_reviewed',       'Skills reviewed',         'content',  false),
  ('feedback',              'Feedback provided',       'content',  true),
  ('training_assigned',     'Training assigned',       'followup', false),
  ('followup_action',       'Follow-up action',        'followup', false),
  ('next_supervision_date', 'Next supervision date',   'followup', true),
  ('rbt_acknowledged_at',   'RBT acknowledgment',      'sign',     true),
  ('bcba_signed_at',        'BCBA signature',          'sign',     true),
  ('attachment_url',        'Supporting attachment',   'attach',   false)
ON CONFLICT (field_key) DO NOTHING;

-- 3) Audit history — never silently mutate a supervision record
CREATE TABLE IF NOT EXISTS public.bcba_supervision_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_log_id uuid REFERENCES public.bcba_supervision_logs(id) ON DELETE CASCADE,
  actor_id uuid,
  event text NOT NULL,
  payload jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bcba_supervision_audit TO authenticated;
GRANT ALL             ON public.bcba_supervision_audit TO service_role;
ALTER TABLE public.bcba_supervision_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read supervision audit"
  ON public.bcba_supervision_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert supervision audit as self"
  ON public.bcba_supervision_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());

-- 4) Escalation ledger — one row per (rbt, month, level)
CREATE TABLE IF NOT EXISTS public.bcba_supervision_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rbt_employee_id uuid NOT NULL,
  bcba_id uuid,
  month_key text NOT NULL,
  level text NOT NULL DEFAULT 'early_reminder',
  status text NOT NULL DEFAULT 'open',
  reason text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (rbt_employee_id, month_key, level)
);
GRANT SELECT, INSERT, UPDATE ON public.bcba_supervision_escalations TO authenticated;
GRANT ALL                     ON public.bcba_supervision_escalations TO service_role;
ALTER TABLE public.bcba_supervision_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read supervision escalations"
  ON public.bcba_supervision_escalations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert supervision escalations"
  ON public.bcba_supervision_escalations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update supervision escalations"
  ON public.bcba_supervision_escalations FOR UPDATE TO authenticated USING (true);