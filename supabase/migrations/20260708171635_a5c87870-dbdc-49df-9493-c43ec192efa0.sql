
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_created_at_desc
  ON public.system_tool_audit_logs (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_area_created
  ON public.system_tool_audit_logs (tool_area, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_action_created
  ON public.system_tool_audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_actor_user
  ON public.system_tool_audit_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_actor_email_lower
  ON public.system_tool_audit_logs (lower(actor_email));
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_entity_id
  ON public.system_tool_audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_sys_tool_audit_entity_table
  ON public.system_tool_audit_logs (entity_table);
