
CREATE TABLE public.referral_crm_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  object TEXT NOT NULL,
  criteria TEXT,
  static_ids TEXT[],
  criteria_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_lists TO authenticated;
GRANT ALL ON public.referral_crm_lists TO service_role;
ALTER TABLE public.referral_crm_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read lists" ON public.referral_crm_lists FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write lists" ON public.referral_crm_lists FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_lists_updated BEFORE UPDATE ON public.referral_crm_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referral_crm_workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger TEXT,
  actions TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  runs INTEGER NOT NULL DEFAULT 0,
  trigger_type TEXT,
  trigger_config JSONB,
  last_run_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_workflows TO authenticated;
GRANT ALL ON public.referral_crm_workflows TO service_role;
ALTER TABLE public.referral_crm_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read workflows" ON public.referral_crm_workflows FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write workflows" ON public.referral_crm_workflows FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_workflows_updated BEFORE UPDATE ON public.referral_crm_workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referral_crm_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  mobile_phone TEXT,
  state TEXT,
  states TEXT[] NOT NULL DEFAULT '{}',
  team_ids TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_users TO authenticated;
GRANT ALL ON public.referral_crm_users TO service_role;
ALTER TABLE public.referral_crm_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read users" ON public.referral_crm_users FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write users" ON public.referral_crm_users FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_users_updated BEFORE UPDATE ON public.referral_crm_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referral_crm_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  states TEXT[] NOT NULL DEFAULT '{}',
  member_ids TEXT[] NOT NULL DEFAULT '{}',
  lead_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_teams TO authenticated;
GRANT ALL ON public.referral_crm_teams TO service_role;
ALTER TABLE public.referral_crm_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read teams" ON public.referral_crm_teams FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write teams" ON public.referral_crm_teams FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_teams_updated BEFORE UPDATE ON public.referral_crm_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referral_crm_permissions (
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_permissions TO authenticated;
GRANT ALL ON public.referral_crm_permissions TO service_role;
ALTER TABLE public.referral_crm_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read permissions" ON public.referral_crm_permissions FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write permissions" ON public.referral_crm_permissions FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_permissions_updated BEFORE UPDATE ON public.referral_crm_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.referral_crm_custom_fields (
  id TEXT PRIMARY KEY,
  object TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  options TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_custom_fields TO authenticated;
GRANT ALL ON public.referral_crm_custom_fields TO service_role;
ALTER TABLE public.referral_crm_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read custom fields" ON public.referral_crm_custom_fields FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write custom fields" ON public.referral_crm_custom_fields FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_custom_fields_updated BEFORE UPDATE ON public.referral_crm_custom_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
