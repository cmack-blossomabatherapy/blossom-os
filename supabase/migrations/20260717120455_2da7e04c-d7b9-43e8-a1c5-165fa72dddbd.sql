
CREATE TABLE IF NOT EXISTS public.rbt_dashboard_cards (
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
  required_action jsonb DEFAULT NULL,
  cta_label text,
  cta_link text,
  icon text,
  color text DEFAULT 'slate',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_dashboard_cards TO authenticated;
GRANT ALL ON public.rbt_dashboard_cards TO service_role;
ALTER TABLE public.rbt_dashboard_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_read_authenticated" ON public.rbt_dashboard_cards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cards_write_admin" ON public.rbt_dashboard_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.rbt_dashboard_card_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.rbt_dashboard_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT ON public.rbt_dashboard_card_engagement TO authenticated;
GRANT ALL ON public.rbt_dashboard_card_engagement TO service_role;
ALTER TABLE public.rbt_dashboard_card_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engagement_read_own_or_admin" ON public.rbt_dashboard_card_engagement
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "engagement_insert_own" ON public.rbt_dashboard_card_engagement
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TRIGGER rbt_dashboard_cards_updated
  BEFORE UPDATE ON public.rbt_dashboard_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 12 default cards. Empty lifecycle_stages / target_roles = shown to all.
INSERT INTO public.rbt_dashboard_cards (card_type, title, subtitle, priority, color, icon, cta_label, cta_link) VALUES
  ('greeting',            'Good morning',              'Welcome back',                        10,  'primary','Sparkles',NULL,NULL),
  ('next_best_action',    'Your next best action',     'One focused thing to move forward',   20,  'primary','ArrowRight','View','/rbt/app/home'),
  ('todays_schedule',     'Today',                     'Your sessions and appointments',      30,  'sky',    'Calendar','Open schedule','/rbt/app/schedule'),
  ('journey_progress',    'Your journey',              'Where you are in your RBT journey',   40,  'violet', 'Route',   'View','/rbt/app/me'),
  ('training_progress',   'Training progress',         'Continue where you left off',         50,  'violet', 'GraduationCap','Continue','/rbt/app/learn'),
  ('supervision_status',  'Supervision',               'Your monthly supervision hours',      60,  'emerald','UserCheck','View','/rbt/app/me'),
  ('credential_alert',    'Credential alert',          'Action needed to stay credentialed',  15,  'amber',  'ShieldAlert','Review','/rbt/app/me'),
  ('recognition',         'Recognition',               'You are appreciated',                 70,  'fuchsia','Award',   NULL, NULL),
  ('growth_opportunity',  'Growth opportunity',        'A step you can take today',           80,  'indigo', 'TrendingUp','Explore','/rbt/app/learn'),
  ('support_shortcut',    'Need a hand?',              'Reach a teammate quickly',            90,  'blue',   'LifeBuoy','Get support','/rbt/app/support'),
  ('important_announcement','Announcement',            NULL,                                  25,  'amber',  'Megaphone',NULL,NULL),
  ('centralreach_status', 'CentralReach data',         'Sync freshness',                      95,  'zinc',   'RefreshCw',NULL,NULL)
ON CONFLICT DO NOTHING;
