
CREATE TABLE public.recruiting_workflow_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board TEXT NOT NULL,
  item_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  candidate_id TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board, item_id)
);

ALTER TABLE public.recruiting_workflow_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view workflow stages"
  ON public.recruiting_workflow_stages FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert workflow stages"
  ON public.recruiting_workflow_stages FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update workflow stages"
  ON public.recruiting_workflow_stages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete workflow stages"
  ON public.recruiting_workflow_stages FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_recruiting_workflow_stages_updated_at
  BEFORE UPDATE ON public.recruiting_workflow_stages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_recruiting_workflow_stages_board ON public.recruiting_workflow_stages(board);

ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_workflow_stages;
