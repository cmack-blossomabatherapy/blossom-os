
-- system_workflows: admin-managed inventory of Blossom OS workflows
CREATE TABLE public.system_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text,
  owner_name text,
  owner_id uuid,
  current_source text,
  future_module text,
  status text NOT NULL DEFAULT 'Planned',
  priority text NOT NULL DEFAULT 'Medium',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_workflows TO authenticated;
GRANT ALL ON public.system_workflows TO service_role;

ALTER TABLE public.system_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view workflows"
  ON public.system_workflows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert workflows"
  ON public.system_workflows FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can update workflows"
  ON public.system_workflows FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can delete workflows"
  ON public.system_workflows FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER update_system_workflows_updated_at
  BEFORE UPDATE ON public.system_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- system_issues: any user can submit; only admins triage/edit
CREATE TABLE public.system_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  area text,
  description text,
  reported_by_id uuid,
  reported_by_name text,
  owner_name text,
  owner_id uuid,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_issues TO authenticated;
GRANT ALL ON public.system_issues TO service_role;

ALTER TABLE public.system_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view issues"
  ON public.system_issues FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can submit issues"
  ON public.system_issues FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update issues"
  ON public.system_issues FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can delete issues"
  ON public.system_issues FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER update_system_issues_updated_at
  BEFORE UPDATE ON public.system_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_system_issues_status ON public.system_issues(status);
CREATE INDEX idx_system_issues_priority ON public.system_issues(priority);
