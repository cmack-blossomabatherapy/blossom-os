CREATE OR REPLACE VIEW public.v_intake_ctm_calls_safe
WITH (security_invoker = on) AS
SELECT
  c.id, c.ctm_call_id, c.direction, c.status, c.tracking_number,
  CASE WHEN public.has_role(auth.uid(), 'super_admin'::public.app_role)
         OR public.has_role(auth.uid(), 'admin'::public.app_role)
       THEN c.from_number
       ELSE regexp_replace(coalesce(c.from_number, ''), '(.{0,10})(.{4})$', '***-\2')
  END AS from_number,
  c.caller_city, c.caller_state, c.duration_seconds, c.talk_time_seconds,
  c.source_name, c.campaign_name, c.called_at, c.ended_at, c.tags,
  c.resolved_state, c.resolved_source_id, c.resolved_campaign_id,
  c.intake_lead_id, c.matched_lead_id, c.matched_client_id,
  c.matched_employee_id, c.matched_agent_user_id, c.linked_at,
  CASE
    WHEN c.matched_lead_id IS NOT NULL OR c.intake_lead_id IS NOT NULL THEN 'linked'
    WHEN c.duration_seconds IS NULL OR c.duration_seconds < 3 THEN 'unmatched_short'
    WHEN c.tracking_number IS NULL THEN 'unmatched_no_tracking'
    ELSE 'unmatched'
  END AS link_status,
  c.created_at, c.updated_at
FROM public.ctm_call_events c;
COMMENT ON VIEW public.v_intake_ctm_calls_safe IS
'Safe projection of ctm_call_events. Excludes raw jsonb, transcript, and recording_url. Row visibility inherits from ctm_call_events RLS via security_invoker=on. Non-admin callers see a masked from_number.';
GRANT SELECT ON public.v_intake_ctm_calls_safe TO authenticated;

CREATE OR REPLACE VIEW public.v_intake_provider_readiness
WITH (security_invoker = on) AS
SELECT
  ic.id AS connection_id, ic.integration_id,
  cat.display_name, cat.category, cat.owner_department, cat.criticality,
  ic.connection_type, ic.environment, ic.status, ic.enabled,
  ic.last_tested_at, ic.last_success_at, ic.last_error_at, ic.last_error,
  ic.updated_at
FROM public.integration_connections ic
LEFT JOIN public.integration_catalog cat ON cat.id = ic.integration_id;
GRANT SELECT ON public.v_intake_provider_readiness TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_is_authorized_reader()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'intake'::public.app_role)
    OR public.has_role(auth.uid(), 'intake_coordinator'::public.app_role)
    OR public.has_role(auth.uid(), 'intake_lead'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'director_of_operations'::public.app_role);
$$;
GRANT EXECUTE ON FUNCTION public.intake_is_authorized_reader() TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_provider_readiness()
RETURNS TABLE (
  integration_id text, display_name text, category text, environment text,
  status text, enabled boolean, last_success_at timestamptz,
  last_error_at timestamptz, last_error text, freshness_seconds bigint
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ic.integration_id, cat.display_name, cat.category, ic.environment,
    ic.status, ic.enabled, ic.last_success_at, ic.last_error_at, ic.last_error,
    CASE WHEN ic.last_success_at IS NULL THEN NULL
         ELSE extract(epoch FROM (now() - ic.last_success_at))::bigint END AS freshness_seconds
  FROM public.integration_connections ic
  LEFT JOIN public.integration_catalog cat ON cat.id = ic.integration_id
  WHERE public.intake_is_authorized_reader();
$$;
REVOKE ALL ON FUNCTION public.intake_provider_readiness() FROM public;
GRANT EXECUTE ON FUNCTION public.intake_provider_readiness() TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_review_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.intake_is_authorized_reader() THEN
    RAISE EXCEPTION 'not authorized' USING errcode = '42501';
  END IF;
  SELECT jsonb_build_object(
    'operating_mode', (SELECT mode FROM public.intake_operating_mode ORDER BY created_at DESC LIMIT 1),
    'leads_total', (SELECT count(*) FROM public.intake_leads),
    'leads_by_stage', (SELECT coalesce(jsonb_object_agg(pipeline_stage, cnt), '{}'::jsonb) FROM
      (SELECT coalesce(pipeline_stage, 'unassigned') AS pipeline_stage, count(*) AS cnt FROM public.intake_leads GROUP BY 1) s),
    'leads_by_state', (SELECT coalesce(jsonb_object_agg(state, cnt), '{}'::jsonb) FROM
      (SELECT coalesce(state, 'unknown') AS state, count(*) AS cnt FROM public.intake_leads GROUP BY 1) s),
    'leads_by_source', (SELECT coalesce(jsonb_object_agg(source, cnt), '{}'::jsonb) FROM
      (SELECT coalesce(source, 'unknown') AS source, count(*) AS cnt FROM public.intake_leads GROUP BY 1) s),
    'ctm_calls_total', (SELECT count(*) FROM public.ctm_call_events),
    'ctm_calls_linked', (SELECT count(*) FROM public.ctm_call_events WHERE matched_lead_id IS NOT NULL OR intake_lead_id IS NOT NULL),
    'ctm_calls_unmatched', (SELECT count(*) FROM public.ctm_call_events WHERE matched_lead_id IS NULL AND intake_lead_id IS NULL),
    'ctm_unmatched_tracking_numbers', (SELECT count(*) FROM public.ctm_unmatched_tracking_numbers),
    'promotion_states', (SELECT coalesce(jsonb_object_agg(state, cnt), '{}'::jsonb) FROM
      (SELECT state, count(*) AS cnt FROM public.intake_promotion_state GROUP BY 1) s),
    'normalized_records', (SELECT coalesce(jsonb_object_agg(record_status, cnt), '{}'::jsonb) FROM
      (SELECT record_status, count(*) AS cnt FROM public.integration_normalized_records GROUP BY 1) s),
    'source_events_last_24h', (SELECT count(*) FROM public.intake_lead_source_events WHERE created_at > now() - interval '24 hours'),
    'generated_at', now()
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.intake_review_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.intake_review_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.intake_admin_reprocess_normalized_record(_record_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE outcome jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'super_admin'::public.app_role)
       OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'admin only' USING errcode = '42501';
  END IF;
  SELECT public.promote_normalized_record(_record_id) INTO outcome;
  RETURN outcome;
END;
$$;
REVOKE ALL ON FUNCTION public.intake_admin_reprocess_normalized_record(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.intake_admin_reprocess_normalized_record(uuid) TO authenticated;