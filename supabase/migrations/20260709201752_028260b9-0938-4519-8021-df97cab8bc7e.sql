
CREATE OR REPLACE FUNCTION public.tg_company_home_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_company_home(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_uid, 'super_admin')
    OR public.has_role(_uid, 'admin')
    OR public.has_role(_uid, 'systems_admin')
    OR public.has_role(_uid, 'hr')
    OR public.has_role(_uid, 'hr_lead')
    OR public.has_role(_uid, 'hr_admin')
    OR public.has_role(_uid, 'hr_manager');
$$;

-- ============ company_calendar_events ============
CREATE TABLE public.company_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'company_event',
  starts_on date NOT NULL,
  ends_on date,
  all_day boolean NOT NULL DEFAULT true,
  location text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_calendar_events TO authenticated;
GRANT ALL ON public.company_calendar_events TO service_role;
ALTER TABLE public.company_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_view_authenticated" ON public.company_calendar_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_manage" ON public.company_calendar_events
  FOR ALL TO authenticated
  USING (public.can_manage_company_home(auth.uid()))
  WITH CHECK (public.can_manage_company_home(auth.uid()));

CREATE TRIGGER company_calendar_events_updated_at
  BEFORE UPDATE ON public.company_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_company_home_updated_at();
CREATE INDEX idx_company_calendar_events_starts_on ON public.company_calendar_events(starts_on);

-- ============ company_updates ============
CREATE TABLE public.company_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  author_name text,
  pinned boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_updates TO authenticated;
GRANT ALL ON public.company_updates TO service_role;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "updates_view" ON public.company_updates
  FOR SELECT TO authenticated
  USING (published = true OR public.can_manage_company_home(auth.uid()));
CREATE POLICY "updates_manage" ON public.company_updates
  FOR ALL TO authenticated
  USING (public.can_manage_company_home(auth.uid()))
  WITH CHECK (public.can_manage_company_home(auth.uid()));

CREATE TRIGGER company_updates_updated_at
  BEFORE UPDATE ON public.company_updates
  FOR EACH ROW EXECUTE FUNCTION public.tg_company_home_updated_at();
CREATE INDEX idx_company_updates_published_at ON public.company_updates(published_at DESC);

-- ============ company_highlights ============
CREATE TABLE public.company_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  image_url text,
  link_url text,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_highlights TO authenticated;
GRANT ALL ON public.company_highlights TO service_role;
ALTER TABLE public.company_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "highlights_view" ON public.company_highlights
  FOR SELECT TO authenticated
  USING (published = true OR public.can_manage_company_home(auth.uid()));
CREATE POLICY "highlights_manage" ON public.company_highlights
  FOR ALL TO authenticated
  USING (public.can_manage_company_home(auth.uid()))
  WITH CHECK (public.can_manage_company_home(auth.uid()));

CREATE TRIGGER company_highlights_updated_at
  BEFORE UPDATE ON public.company_highlights
  FOR EACH ROW EXECUTE FUNCTION public.tg_company_home_updated_at();
