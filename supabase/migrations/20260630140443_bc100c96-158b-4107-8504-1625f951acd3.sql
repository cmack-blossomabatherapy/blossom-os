
CREATE TABLE public.qa_work_item_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT 'monday_authorizations_raw',
  source_record_id text NOT NULL,
  monday_item_id text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  assigned_qa_owner text,
  qa_status text,
  priority text,
  next_action text,
  blockers text[] NOT NULL DEFAULT '{}',
  alerts text[] NOT NULL DEFAULT '{}'::text[],
  notes text,
  escalated boolean NOT NULL DEFAULT false,
  escalation_reason text,
  last_action_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_system, source_record_id)
);

CREATE INDEX idx_qa_work_item_overrides_owner ON public.qa_work_item_overrides(assigned_qa_owner);
CREATE INDEX idx_qa_work_item_overrides_status ON public.qa_work_item_overrides(qa_status);
CREATE INDEX idx_qa_work_item_overrides_client ON public.qa_work_item_overrides(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_work_item_overrides TO authenticated;
GRANT ALL ON public.qa_work_item_overrides TO service_role;

ALTER TABLE public.qa_work_item_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View QA overrides with QA or clients permission"
  ON public.qa_work_item_overrides FOR SELECT
  USING (
    public.has_permission(auth.uid(), 'qa.view')
    OR public.has_permission(auth.uid(), 'clients.view')
  );

CREATE POLICY "Mutate QA overrides with QA edit permission"
  ON public.qa_work_item_overrides FOR ALL
  USING (
    public.has_permission(auth.uid(), 'qa.edit')
    OR public.has_permission(auth.uid(), 'clients.edit')
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'qa.edit')
    OR public.has_permission(auth.uid(), 'clients.edit')
  );

CREATE TRIGGER update_qa_work_item_overrides_updated_at
  BEFORE UPDATE ON public.qa_work_item_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
