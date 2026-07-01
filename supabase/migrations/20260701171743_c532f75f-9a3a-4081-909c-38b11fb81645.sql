-- Marketing Pass 106: harden RLS for marketing operational tables.
-- Drops broad USING (true) WITH CHECK (true) policies and replaces them with role-gated ones.

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business_development';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

-- marketing_work_items ----------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view marketing work items" ON public.marketing_work_items;
DROP POLICY IF EXISTS "Authenticated can manage marketing work items" ON public.marketing_work_items;

CREATE POLICY "Marketing roles can read work items"
  ON public.marketing_work_items FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing roles can insert work items"
  ON public.marketing_work_items FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing roles can update work items"
  ON public.marketing_work_items FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Admins can delete work items"
  ON public.marketing_work_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- marketing_web_metrics ---------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view web metrics" ON public.marketing_web_metrics;
DROP POLICY IF EXISTS "Authenticated can manage web metrics" ON public.marketing_web_metrics;

CREATE POLICY "Marketing roles can read web metrics"
  ON public.marketing_web_metrics FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing roles can insert web metrics"
  ON public.marketing_web_metrics FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing roles can update web metrics"
  ON public.marketing_web_metrics FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Admins can delete web metrics"
  ON public.marketing_web_metrics FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- marketing_reputation_events --------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view reputation events" ON public.marketing_reputation_events;
DROP POLICY IF EXISTS "Authenticated can manage reputation events" ON public.marketing_reputation_events;

CREATE POLICY "Marketing roles can read reputation events"
  ON public.marketing_reputation_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing roles can insert reputation events"
  ON public.marketing_reputation_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Marketing roles can update reputation events"
  ON public.marketing_reputation_events FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'marketing')
  );

CREATE POLICY "Admins can delete reputation events"
  ON public.marketing_reputation_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));