CREATE OR REPLACE FUNCTION public.report_c2s_documentation_proxy_page(
  p_from date,
  p_to date,
  p_limit integer DEFAULT 1000,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(employee_id uuid, provider_display_name text, role_group text, state text, date_of_service date, documentation_date date, lag_days integer, timeliness_status text, proxy_category text, used_authoritative_completion boolean, provenance text, source_quality text, last_seen_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT r.*
  FROM public.report_c2s_documentation_proxy(p_from, p_to) r
  CROSS JOIN (SELECT auth.uid() AS uid) g
  WHERE g.uid IS NOT NULL
  -- Total order over EVERY returned column. Rows still tied after all of these
  -- are byte-identical, so their relative order cannot affect a paged read.
  ORDER BY
    r.date_of_service,
    coalesce(r.employee_id::text, ''),
    coalesce(r.provider_display_name, ''),
    coalesce(r.role_group, ''),
    coalesce(r.state, ''),
    coalesce(r.documentation_date::text, ''),
    coalesce(r.lag_days, -2147483647),
    coalesce(r.timeliness_status, ''),
    coalesce(r.proxy_category, ''),
    coalesce(r.used_authoritative_completion, false),
    coalesce(r.provenance, ''),
    coalesce(r.source_quality, ''),
    coalesce(r.last_seen_at, '-infinity'::timestamptz)
  LIMIT greatest(coalesce(p_limit, 1000), 1)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$function$;

REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy_page(date, date, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.report_c2s_documentation_proxy_page(date, date, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.report_c2s_documentation_proxy_page(date, date, integer, integer) TO authenticated;