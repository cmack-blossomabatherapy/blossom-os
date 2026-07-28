-- Recruiting / HR can read Apploi candidate + job records only.
CREATE POLICY "Recruiting can view apploi records"
ON public.integration_normalized_records
FOR SELECT
TO authenticated
USING (
  integration_id = 'apploi'
  AND record_kind IN ('candidate', 'job')
  AND (
    public.has_role(auth.uid(), 'recruiting_lead'::app_role)
    OR public.has_role(auth.uid(), 'recruiting_coordinator'::app_role)
    OR public.has_role(auth.uid(), 'recruiting_assistant'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
    OR public.has_role(auth.uid(), 'hr_lead'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::app_role)
  )
);

CREATE OR REPLACE FUNCTION public.apploi_sync_health()
RETURNS TABLE (
  connection_status text,
  enabled boolean,
  last_synced_at timestamptz,
  last_run_status text,
  jobs_count bigint,
  candidates_count bigint,
  applicant_scope_available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(c.status, 'not_configured') AS connection_status,
    COALESCE(c.enabled, false) AS enabled,
    r.completed_at AS last_synced_at,
    r.status AS last_run_status,
    (SELECT count(*) FROM public.integration_normalized_records n
       WHERE n.integration_id = 'apploi' AND n.record_kind = 'job') AS jobs_count,
    (SELECT count(*) FROM public.integration_normalized_records n
       WHERE n.integration_id = 'apploi' AND n.record_kind = 'candidate') AS candidates_count,
    EXISTS (SELECT 1 FROM public.integration_normalized_records n
       WHERE n.integration_id = 'apploi' AND n.record_kind = 'candidate') AS applicant_scope_available
  FROM (SELECT 1) x
  LEFT JOIN public.integration_connections c
    ON c.integration_id = 'apploi' AND c.environment = 'production'
  LEFT JOIN LATERAL (
    SELECT status, completed_at
    FROM public.integration_sync_runs
    WHERE integration_id = 'apploi'
    ORDER BY started_at DESC
    LIMIT 1
  ) r ON true;
$$;

REVOKE ALL ON FUNCTION public.apploi_sync_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apploi_sync_health() TO authenticated;