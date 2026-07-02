
-- Business Development read-only access to marketing source visibility.
-- Marketing keeps full read/write via can_access_marketing / can_manage_marketing.
-- BD gets SELECT-only via can_access_growth_source_visibility for source handoffs.

DROP POLICY IF EXISTS "Marketing access can read sources" ON public.marketing_sources;
CREATE POLICY "Growth source visibility can read sources"
  ON public.marketing_sources FOR SELECT
  TO authenticated
  USING (public.can_access_growth_source_visibility(auth.uid()));

DROP POLICY IF EXISTS "Marketing access can read source events" ON public.marketing_source_events;
CREATE POLICY "Growth source visibility can read source events"
  ON public.marketing_source_events FOR SELECT
  TO authenticated
  USING (public.can_access_growth_source_visibility(auth.uid()));

DROP POLICY IF EXISTS "Marketing access can read call events" ON public.marketing_call_events;
CREATE POLICY "Growth source visibility can read call events"
  ON public.marketing_call_events FOR SELECT
  TO authenticated
  USING (public.can_access_growth_source_visibility(auth.uid()));

DROP POLICY IF EXISTS "Marketing access can read metrics" ON public.marketing_campaign_metrics;
CREATE POLICY "Growth source visibility can read metrics"
  ON public.marketing_campaign_metrics FOR SELECT
  TO authenticated
  USING (public.can_access_growth_source_visibility(auth.uid()));
