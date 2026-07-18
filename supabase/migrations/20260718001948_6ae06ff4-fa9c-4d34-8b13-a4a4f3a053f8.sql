
-- BCBA dashboard-card framework (mirrors rbt_dashboard_cards)
CREATE TABLE IF NOT EXISTS public.bcba_dashboard_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type text NOT NULL,
  title text NOT NULL,
  subtitle text,
  body text,
  priority integer NOT NULL DEFAULT 100,
  is_enabled boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  lifecycle_stages text[] NOT NULL DEFAULT '{}',
  target_roles text[] NOT NULL DEFAULT '{}',
  target_states text[] NOT NULL DEFAULT '{}',
  target_clinics text[] NOT NULL DEFAULT '{}',
  target_user_ids uuid[] NOT NULL DEFAULT '{}',
  required_action jsonb,
  data_source text,
  freshness_hint text,
  cta_label text,
  cta_link text,
  icon text,
  color text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bcba_dashboard_cards TO authenticated;
GRANT ALL ON public.bcba_dashboard_cards TO service_role;

ALTER TABLE public.bcba_dashboard_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_dashboard_cards_read_authenticated"
  ON public.bcba_dashboard_cards FOR SELECT
  TO authenticated
  USING (is_enabled = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "bcba_dashboard_cards_admin_write"
  ON public.bcba_dashboard_cards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER bcba_dashboard_cards_updated_at
  BEFORE UPDATE ON public.bcba_dashboard_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS bcba_dashboard_cards_enabled_priority_idx
  ON public.bcba_dashboard_cards (is_enabled, priority);

-- Engagement log
CREATE TABLE IF NOT EXISTS public.bcba_dashboard_card_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.bcba_dashboard_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view','click','dismiss')),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.bcba_dashboard_card_engagement TO authenticated;
GRANT ALL ON public.bcba_dashboard_card_engagement TO service_role;

ALTER TABLE public.bcba_dashboard_card_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_card_engagement_insert_own"
  ON public.bcba_dashboard_card_engagement FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bcba_card_engagement_read_own_or_admin"
  ON public.bcba_dashboard_card_engagement FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS bcba_card_engagement_user_idx
  ON public.bcba_dashboard_card_engagement (user_id, created_at DESC);

-- Seed example cards (all disabled by default so admins can enable when ready)
INSERT INTO public.bcba_dashboard_cards (card_type, title, subtitle, priority, is_enabled, target_roles, cta_label, cta_link, data_source, icon)
VALUES
  ('todays_schedule',        'Today''s Schedule',       'Sessions, supervisions, meetings',      10, true,  ARRAY['bcba'], 'Open schedule',       '/bcba/caseload',                'centralreach', 'Calendar'),
  ('next_best_actions',      'Next Best Actions',       'What to tackle next',                   20, true,  ARRAY['bcba'], 'View work',           '/bcba/clinical',                'blossom',      'Sparkles'),
  ('caseload_health',        'Caseload Health',         'Status across your clients',            30, true,  ARRAY['bcba'], 'Open caseload',       '/bcba/caseload',                'blossom',      'Activity'),
  ('my_rbt_team',            'My RBT Team',             'RBTs assigned to your clients',         40, true,  ARRAY['bcba'], 'View team',           '/bcba/rbts',                    'blossom',      'Users'),
  ('progress_reports_due',   'Progress Reports Due',    'Reports approaching deadline',          50, true,  ARRAY['bcba'], 'Open reports',        '/bcba/clinical/reports',        'blossom',      'FileText'),
  ('assessments_due',        'Assessments Due',         'Assessments in progress or upcoming',   60, true,  ARRAY['bcba'], 'Open assessments',    '/bcba/clinical/assessments',    'blossom',      'ClipboardList'),
  ('qa_corrections',         'QA Corrections',          'Items routed to you',                   70, true,  ARRAY['bcba'], 'Open QA queue',       '/bcba/clinical/qa',             'blossom',      'ShieldCheck'),
  ('supervision_risk',       'Supervision Risk',        'RBTs approaching supervision limits',   80, true,  ARRAY['bcba'], 'Review supervision',  '/bcba/rbts',                    'blossom',      'AlertTriangle'),
  ('parent_training',        'Parent Training',         'Cadence and upcoming targets',          90, true,  ARRAY['bcba'], 'Open parent training','/bcba/clinical/parent-training','blossom',      'HeartHandshake'),
  ('productivity_snapshot',  'Productivity Snapshot',   'Billable pulse this period',           100, true,  ARRAY['bcba'], 'View details',        '/bcba/me',                      'centralreach', 'BarChart3'),
  ('credential_alert',       'Credential Alert',        'Expirations to plan around',           110, true,  ARRAY['bcba'], 'Open credentials',    '/bcba/me',                      'blossom',      'BadgeCheck'),
  ('support_requests',       'Support Requests',        'Open items and updates',               120, true,  ARRAY['bcba'], 'Open support',        '/bcba/support',                 'blossom',      'LifeBuoy'),
  ('learning_due',           'Learning Due',            'Assigned modules and deadlines',       130, true,  ARRAY['bcba'], 'Open Academy',        '/bcba/learn',                   'blossom',      'GraduationCap'),
  ('recognition',            'Recognition',             'Kudos and shout-outs',                 140, false, ARRAY['bcba'], 'View',                '/bcba/me',                      'blossom',      'Award'),
  ('fellowship_supervision', 'Fellowship Supervision',  'Fellowship candidates you support',    150, false, ARRAY['bcba','fellowship_supervisor'], 'Open fellowship', '/bcba/rbts', 'blossom', 'Sparkles')
ON CONFLICT DO NOTHING;
