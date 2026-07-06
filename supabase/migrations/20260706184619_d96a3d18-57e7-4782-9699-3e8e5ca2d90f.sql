
CREATE TABLE IF NOT EXISTS public.org_chart_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  email TEXT,
  avatar_url TEXT,
  accent_color TEXT,
  parent_id UUID REFERENCES public.org_chart_nodes(id) ON DELETE SET NULL,
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_chart_nodes_parent_idx ON public.org_chart_nodes(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_chart_nodes TO authenticated;
GRANT ALL ON public.org_chart_nodes TO service_role;

ALTER TABLE public.org_chart_nodes ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper for org chart edit access
CREATE OR REPLACE FUNCTION public.can_edit_org_chart(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'super_admin'::app_role,
        'admin'::app_role,
        'systems_admin'::app_role,
        'hr'::app_role,
        'hr_lead'::app_role,
        'hr_manager'::app_role,
        'hr_admin'::app_role
      )
  );
$$;

CREATE POLICY "Authenticated can view org chart"
  ON public.org_chart_nodes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can insert org nodes"
  ON public.org_chart_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit_org_chart(auth.uid()));

CREATE POLICY "HR and admins can update org nodes"
  ON public.org_chart_nodes
  FOR UPDATE
  TO authenticated
  USING (public.can_edit_org_chart(auth.uid()))
  WITH CHECK (public.can_edit_org_chart(auth.uid()));

CREATE POLICY "HR and admins can delete org nodes"
  ON public.org_chart_nodes
  FOR DELETE
  TO authenticated
  USING (public.can_edit_org_chart(auth.uid()));

CREATE TRIGGER update_org_chart_nodes_updated_at
  BEFORE UPDATE ON public.org_chart_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
