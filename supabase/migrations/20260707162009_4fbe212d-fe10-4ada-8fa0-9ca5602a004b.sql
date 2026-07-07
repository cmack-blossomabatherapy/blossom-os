
-- 1) system_tool_audit_logs -----------------------------------------------

CREATE TABLE IF NOT EXISTS public.system_tool_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_area text NOT NULL,
  entity_table text,
  entity_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  actor_email text,
  previous_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.system_tool_audit_logs TO authenticated;
GRANT ALL ON public.system_tool_audit_logs TO service_role;

ALTER TABLE public.system_tool_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sys_tool_audit_admin_select" ON public.system_tool_audit_logs;
CREATE POLICY "sys_tool_audit_admin_select"
ON public.system_tool_audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "sys_tool_audit_admin_insert" ON public.system_tool_audit_logs;
CREATE POLICY "sys_tool_audit_admin_insert"
ON public.system_tool_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE INDEX IF NOT EXISTS system_tool_audit_logs_area_created_idx
  ON public.system_tool_audit_logs (tool_area, created_at DESC);
CREATE INDEX IF NOT EXISTS system_tool_audit_logs_entity_idx
  ON public.system_tool_audit_logs (entity_table, entity_id);
CREATE INDEX IF NOT EXISTS system_tool_audit_logs_actor_idx
  ON public.system_tool_audit_logs (actor_user_id, created_at DESC);


-- 2) Integration catalog honesty ------------------------------------------
-- Catalog status describes intended/readiness state only. Only live proof in
-- integration_connections should ever surface "connected" in the UI.

-- Rows that were seeded as connected but have no proven live connection.
UPDATE public.integration_catalog
   SET status = 'configured',
       updated_at = now()
 WHERE status = 'connected'
   AND id IN ('apploi','ctm','retell','resend','google-ads','meta-ads','eligipro','calendly');

-- Belt & suspenders — the vendors explicitly called out in this pass.
UPDATE public.integration_catalog
   SET status = 'configured',
       updated_at = now()
 WHERE id IN ('centralreach','viventium','ctm','retell','eligipro','calendly')
   AND status = 'connected';

-- Make.com is a legacy internal migration bridge, not user-facing readiness.
UPDATE public.integration_catalog
   SET status = 'disabled',
       updated_at = now()
 WHERE id IN ('make','makecom','make_com');
