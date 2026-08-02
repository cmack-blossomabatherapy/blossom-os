CREATE TABLE public.org_chart_layout (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  parent_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  parent_override boolean NOT NULL DEFAULT false,
  position_x numeric,
  position_y numeric,
  collapsed boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_chart_layout_employee_unique UNIQUE (employee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_chart_layout TO authenticated;
GRANT ALL ON public.org_chart_layout TO service_role;

ALTER TABLE public.org_chart_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read org chart layout"
  ON public.org_chart_layout FOR SELECT TO authenticated USING (true);

CREATE POLICY "Org chart editors can insert layout"
  ON public.org_chart_layout FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org_chart(auth.uid()));

CREATE POLICY "Org chart editors can update layout"
  ON public.org_chart_layout FOR UPDATE TO authenticated
  USING (public.can_edit_org_chart(auth.uid()))
  WITH CHECK (public.can_edit_org_chart(auth.uid()));

CREATE POLICY "Org chart editors can delete layout"
  ON public.org_chart_layout FOR DELETE TO authenticated
  USING (public.can_edit_org_chart(auth.uid()));

CREATE INDEX org_chart_layout_parent_idx ON public.org_chart_layout (parent_employee_id);

CREATE TRIGGER org_chart_layout_touch
  BEFORE UPDATE ON public.org_chart_layout
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.org_chart_layout;