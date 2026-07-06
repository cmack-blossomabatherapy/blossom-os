
CREATE TABLE public.operations_work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general_task',
  department text NOT NULL DEFAULT 'Operations Leadership',
  owner_id uuid,
  owner_name text,
  assigned_role text,
  state text,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  due_date timestamptz,
  escalated_at timestamptz,
  resolved_at timestamptz,
  snoozed_until timestamptz,
  related_lead_id text,
  related_patient_id text,
  related_user_id uuid,
  source_system text,
  tags text[] NOT NULL DEFAULT '{}',
  escalation_reason text,
  escalation_level int,
  resolution_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations_work_items TO authenticated;
GRANT ALL ON public.operations_work_items TO service_role;

ALTER TABLE public.operations_work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view work items"
  ON public.operations_work_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can create work items"
  ON public.operations_work_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update work items"
  ON public.operations_work_items FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete work items"
  ON public.operations_work_items FOR DELETE
  TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER update_operations_work_items_updated_at
  BEFORE UPDATE ON public.operations_work_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ops_wi_status ON public.operations_work_items(status);
CREATE INDEX idx_ops_wi_department ON public.operations_work_items(department);
CREATE INDEX idx_ops_wi_owner ON public.operations_work_items(owner_id);
CREATE INDEX idx_ops_wi_state ON public.operations_work_items(state);

CREATE TABLE public.operations_work_item_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id uuid NOT NULL REFERENCES public.operations_work_items(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  actor_id uuid,
  actor_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.operations_work_item_events TO authenticated;
GRANT ALL ON public.operations_work_item_events TO service_role;

ALTER TABLE public.operations_work_item_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view work item events"
  ON public.operations_work_item_events FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can log work item events"
  ON public.operations_work_item_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_ops_wi_events_item ON public.operations_work_item_events(work_item_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_work_items;
