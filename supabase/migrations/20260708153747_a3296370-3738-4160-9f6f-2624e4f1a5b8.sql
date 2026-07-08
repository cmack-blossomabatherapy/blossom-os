
-- 1) Allow authenticated users to insert their own audit rows.
DROP POLICY IF EXISTS "sys_tool_audit_admin_insert" ON public.system_tool_audit_logs;
CREATE POLICY "sys_tool_audit_self_insert"
ON public.system_tool_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  actor_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 2) Grant EXECUTE on the authorization state-access function to anon so RLS
-- evaluation never errors. The function is SECURITY DEFINER and returns false
-- for unauthenticated callers, so no data is exposed.
GRANT EXECUTE ON FUNCTION public.has_authorization_state_access(uuid, text) TO anon;
