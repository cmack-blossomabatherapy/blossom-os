CREATE OR REPLACE FUNCTION public.is_clinical_director(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'clinical_director'::app_role)
    OR public.has_role(_user_id, 'clinic_director'::app_role)
    OR public.has_role(_user_id, 'clinical_lead'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_clinical_work(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_clinical_director(_user_id)
    OR public.has_role(_user_id, 'admin'::app_role)
    OR public.has_role(_user_id, 'super_admin'::app_role)
    OR public.has_role(_user_id, 'director_of_operations'::app_role)
    OR public.has_role(_user_id, 'operations_manager'::app_role)
    OR public.has_role(_user_id, 'qa'::app_role)
    OR public.has_role(_user_id, 'qa_director'::app_role)
    OR public.has_role(_user_id, 'behavioral_support'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.can_view_clinical_work(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.can_manage_clinical_work(_user_id)
    OR public.has_role(_user_id, 'executive'::app_role)
    OR public.has_role(_user_id, 'coo'::app_role)
    OR public.has_role(_user_id, 'state_director'::app_role)
    OR public.has_role(_user_id, 'assistant_state_director'::app_role)
    OR public.has_role(_user_id, 'qa_specialist'::app_role);
$$;

-- ---------- clinical_work_items ----------
CREATE TABLE IF NOT EXISTS public.clinical_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'authorization','supervision','evaluation','bcba','client','centralreach','manual'
  )),
  source_record_id TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  bcba_id UUID,
  bcba_name TEXT,
  state TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','reviewed','escalated','resolved','archived')),
  title TEXT NOT NULL,
  notes TEXT,
  owner_user_id UUID,
  owner_name TEXT,
  due_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_work_items TO authenticated;
GRANT ALL ON public.clinical_work_items TO service_role;

ALTER TABLE public.clinical_work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical work items read"
  ON public.clinical_work_items FOR SELECT TO authenticated
  USING (
    public.can_view_clinical_work(auth.uid())
    OR owner_user_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Clinical work items insert"
  ON public.clinical_work_items FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_clinical_work(auth.uid()));

CREATE POLICY "Clinical work items update"
  ON public.clinical_work_items FOR UPDATE TO authenticated
  USING (public.can_manage_clinical_work(auth.uid()) OR owner_user_id = auth.uid())
  WITH CHECK (public.can_manage_clinical_work(auth.uid()) OR owner_user_id = auth.uid());

CREATE POLICY "Clinical work items delete"
  ON public.clinical_work_items FOR DELETE TO authenticated
  USING (
    public.is_clinical_director(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_clinical_work_items_updated_at ON public.clinical_work_items;
CREATE TRIGGER trg_clinical_work_items_updated_at
BEFORE UPDATE ON public.clinical_work_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cwi_status ON public.clinical_work_items(status);
CREATE INDEX IF NOT EXISTS idx_cwi_state ON public.clinical_work_items(state);
CREATE INDEX IF NOT EXISTS idx_cwi_priority ON public.clinical_work_items(priority);
CREATE INDEX IF NOT EXISTS idx_cwi_client ON public.clinical_work_items(client_id);
CREATE INDEX IF NOT EXISTS idx_cwi_bcba ON public.clinical_work_items(bcba_id);
CREATE INDEX IF NOT EXISTS idx_cwi_due ON public.clinical_work_items(due_at);

-- ---------- clinical_activity_log ----------
CREATE TABLE IF NOT EXISTS public.clinical_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id UUID REFERENCES public.clinical_work_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  actor_name TEXT,
  source_type TEXT,
  source_record_id TEXT,
  client_id UUID,
  bcba_id UUID,
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.clinical_activity_log TO authenticated;
GRANT ALL ON public.clinical_activity_log TO service_role;

ALTER TABLE public.clinical_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical activity read"
  ON public.clinical_activity_log FOR SELECT TO authenticated
  USING (public.can_view_clinical_work(auth.uid()) OR actor_user_id = auth.uid());

CREATE POLICY "Clinical activity insert"
  ON public.clinical_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_clinical_work(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_cal_created ON public.clinical_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cal_work_item ON public.clinical_activity_log(work_item_id);

-- ---------- clinical_saved_views ----------
CREATE TABLE IF NOT EXISTS public.clinical_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_saved_views TO authenticated;
GRANT ALL ON public.clinical_saved_views TO service_role;

ALTER TABLE public.clinical_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical saved views read"
  ON public.clinical_saved_views FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_shared = true
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Clinical saved views write own"
  ON public.clinical_saved_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clinical saved views update own"
  ON public.clinical_saved_views FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clinical saved views delete own"
  ON public.clinical_saved_views FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_clinical_saved_views_updated_at ON public.clinical_saved_views;
CREATE TRIGGER trg_clinical_saved_views_updated_at
BEFORE UPDATE ON public.clinical_saved_views
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
