
CREATE OR REPLACE FUNCTION public.can_access_marketing(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN (
        'admin','super_admin','exec','executive','executive_leadership',
        'ops_manager','marketing','marketing_team','marketing_growth_lead'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_marketing(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN (
        'admin','super_admin','ops_manager','marketing','marketing_team','marketing_growth_lead'
      )
  );
$$;

DROP POLICY IF EXISTS "Marketing can read sources" ON public.marketing_sources;
DROP POLICY IF EXISTS "Marketing can write sources" ON public.marketing_sources;
CREATE POLICY "Marketing access can read sources" ON public.marketing_sources FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert sources" ON public.marketing_sources FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update sources" ON public.marketing_sources FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete sources" ON public.marketing_sources FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing can read campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Marketing can write campaigns" ON public.marketing_campaigns;
CREATE POLICY "Marketing access can read campaigns" ON public.marketing_campaigns FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert campaigns" ON public.marketing_campaigns FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update campaigns" ON public.marketing_campaigns FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete campaigns" ON public.marketing_campaigns FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing can read events" ON public.marketing_source_events;
DROP POLICY IF EXISTS "Marketing can write events" ON public.marketing_source_events;
CREATE POLICY "Marketing access can read source events" ON public.marketing_source_events FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert source events" ON public.marketing_source_events FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update source events" ON public.marketing_source_events FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete source events" ON public.marketing_source_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing can read metrics" ON public.marketing_campaign_metrics;
DROP POLICY IF EXISTS "Marketing can write metrics" ON public.marketing_campaign_metrics;
CREATE POLICY "Marketing access can read metrics" ON public.marketing_campaign_metrics FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert metrics" ON public.marketing_campaign_metrics FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update metrics" ON public.marketing_campaign_metrics FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete metrics" ON public.marketing_campaign_metrics FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing can read call events" ON public.marketing_call_events;
DROP POLICY IF EXISTS "Marketing can write call events" ON public.marketing_call_events;
CREATE POLICY "Marketing access can read call events" ON public.marketing_call_events FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert call events" ON public.marketing_call_events FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update call events" ON public.marketing_call_events FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete call events" ON public.marketing_call_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing can read email events" ON public.marketing_email_events;
DROP POLICY IF EXISTS "Marketing can write email events" ON public.marketing_email_events;
CREATE POLICY "Marketing access can read email events" ON public.marketing_email_events FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert email events" ON public.marketing_email_events FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update email events" ON public.marketing_email_events FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete email events" ON public.marketing_email_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing roles can read work items" ON public.marketing_work_items;
DROP POLICY IF EXISTS "Marketing roles can insert work items" ON public.marketing_work_items;
DROP POLICY IF EXISTS "Marketing roles can update work items" ON public.marketing_work_items;
DROP POLICY IF EXISTS "Admins can delete work items" ON public.marketing_work_items;
CREATE POLICY "Marketing access can read work items" ON public.marketing_work_items FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert work items" ON public.marketing_work_items FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update work items" ON public.marketing_work_items FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete work items" ON public.marketing_work_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing roles can read web metrics" ON public.marketing_web_metrics;
DROP POLICY IF EXISTS "Marketing roles can insert web metrics" ON public.marketing_web_metrics;
DROP POLICY IF EXISTS "Marketing roles can update web metrics" ON public.marketing_web_metrics;
DROP POLICY IF EXISTS "Admins can delete web metrics" ON public.marketing_web_metrics;
CREATE POLICY "Marketing access can read web metrics" ON public.marketing_web_metrics FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert web metrics" ON public.marketing_web_metrics FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update web metrics" ON public.marketing_web_metrics FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete web metrics" ON public.marketing_web_metrics FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Marketing roles can read reputation events" ON public.marketing_reputation_events;
DROP POLICY IF EXISTS "Marketing roles can insert reputation events" ON public.marketing_reputation_events;
DROP POLICY IF EXISTS "Marketing roles can update reputation events" ON public.marketing_reputation_events;
DROP POLICY IF EXISTS "Admins can delete reputation events" ON public.marketing_reputation_events;
CREATE POLICY "Marketing access can read reputation events" ON public.marketing_reputation_events FOR SELECT TO authenticated USING (public.can_access_marketing(auth.uid()));
CREATE POLICY "Marketing managers can insert reputation events" ON public.marketing_reputation_events FOR INSERT TO authenticated WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Marketing managers can update reputation events" ON public.marketing_reputation_events FOR UPDATE TO authenticated USING (public.can_manage_marketing(auth.uid())) WITH CHECK (public.can_manage_marketing(auth.uid()));
CREATE POLICY "Admins can delete reputation events" ON public.marketing_reputation_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

GRANT EXECUTE ON FUNCTION public.can_access_marketing(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_marketing(uuid) TO authenticated, service_role;
