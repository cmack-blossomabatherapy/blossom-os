
CREATE TABLE IF NOT EXISTS public.rbt_resource_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  bookmarked boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  viewed boolean NOT NULL DEFAULT false,
  last_viewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_resource_prefs TO authenticated;
GRANT ALL ON public.rbt_resource_prefs TO service_role;

ALTER TABLE public.rbt_resource_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own RBT resource prefs"
  ON public.rbt_resource_prefs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Training admins can view all RBT resource prefs"
  ON public.rbt_resource_prefs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'executive_leadership')
  );

CREATE TABLE IF NOT EXISTS public.rbt_readiness_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id uuid,
  trainee_name text NOT NULL,
  state text,
  clinic text,
  certification text NOT NULL DEFAULT 'Not Certified',
  experience_bucket text NOT NULL DEFAULT 'Not Certified',
  start_date date,
  path_id text NOT NULL DEFAULT 'certified_no_experience',
  path_overridden boolean NOT NULL DEFAULT false,
  current_phase_index integer NOT NULL DEFAULT 0,
  current_module_id text,
  lead_rbt_trainer text,
  bcba text,
  training_admin text,
  documentation_reviewer text,
  signoffs jsonb NOT NULL DEFAULT '{}'::jsonb,
  module_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Not Started',
  next_required_action text,
  ready boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_readiness_records TO authenticated;
GRANT ALL ON public.rbt_readiness_records TO service_role;

ALTER TABLE public.rbt_readiness_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RBT sees own readiness"
  ON public.rbt_readiness_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Training leadership manages readiness"
  ON public.rbt_readiness_records FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'executive_leadership')
    OR public.has_role(auth.uid(), 'state_director')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'operations_leadership')
    OR public.has_role(auth.uid(), 'executive_leadership')
    OR public.has_role(auth.uid(), 'state_director')
  );

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS rbt_resource_prefs_touch ON public.rbt_resource_prefs;
CREATE TRIGGER rbt_resource_prefs_touch BEFORE UPDATE ON public.rbt_resource_prefs
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS rbt_readiness_records_touch ON public.rbt_readiness_records;
CREATE TRIGGER rbt_readiness_records_touch BEFORE UPDATE ON public.rbt_readiness_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
