DO $$ BEGIN
  CREATE TYPE public.family_pref_type AS ENUM ('schedule','language','gender','location','continuity','clinical_fit','family_request','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.family_pref_importance AS ENUM ('must_have','nice_to_have');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.family_pref_status AS ENUM ('active','resolved','no_longer_applicable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.family_staffing_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  client_name text NOT NULL,
  state text,
  preference_type public.family_pref_type NOT NULL DEFAULT 'family_request',
  preference_detail text NOT NULL,
  importance public.family_pref_importance NOT NULL DEFAULT 'nice_to_have',
  status public.family_pref_status NOT NULL DEFAULT 'active',
  notes text,
  linked_match_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_staffing_preferences TO authenticated;
GRANT ALL ON public.family_staffing_preferences TO service_role;

ALTER TABLE public.family_staffing_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View family preferences with permission" ON public.family_staffing_preferences;
CREATE POLICY "View family preferences with permission"
ON public.family_staffing_preferences FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(),'staffing.view') OR public.has_permission(auth.uid(),'clients.view'));

DROP POLICY IF EXISTS "Create family preferences with permission" ON public.family_staffing_preferences;
CREATE POLICY "Create family preferences with permission"
ON public.family_staffing_preferences FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(),'staffing.edit') OR public.has_permission(auth.uid(),'clients.edit'));

DROP POLICY IF EXISTS "Update family preferences with permission" ON public.family_staffing_preferences;
CREATE POLICY "Update family preferences with permission"
ON public.family_staffing_preferences FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(),'staffing.edit') OR public.has_permission(auth.uid(),'clients.edit'))
WITH CHECK (public.has_permission(auth.uid(),'staffing.edit') OR public.has_permission(auth.uid(),'clients.edit'));

DROP POLICY IF EXISTS "Delete family preferences with permission" ON public.family_staffing_preferences;
CREATE POLICY "Delete family preferences with permission"
ON public.family_staffing_preferences FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(),'staffing.edit'));

CREATE INDEX IF NOT EXISTS idx_family_prefs_client_id ON public.family_staffing_preferences(client_id);
CREATE INDEX IF NOT EXISTS idx_family_prefs_status   ON public.family_staffing_preferences(status);

CREATE OR REPLACE FUNCTION public.touch_family_staffing_preferences()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS touch_family_staffing_preferences_trigger ON public.family_staffing_preferences;
CREATE TRIGGER touch_family_staffing_preferences_trigger
BEFORE UPDATE ON public.family_staffing_preferences
FOR EACH ROW EXECUTE FUNCTION public.touch_family_staffing_preferences();

REVOKE ALL ON FUNCTION public.touch_family_staffing_preferences() FROM PUBLIC, anon, authenticated;