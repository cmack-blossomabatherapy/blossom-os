
-- 1) Tighten the 5 permissive INSERT policies (avoid USING/WITH CHECK true).
-- phone_ai_calls: keep service-role only, but non-trivial WITH CHECK.
DROP POLICY IF EXISTS "Service role inserts phone_ai_calls" ON public.phone_ai_calls;
CREATE POLICY "Service role inserts phone_ai_calls"
  ON public.phone_ai_calls FOR INSERT TO service_role
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "service insert notif" ON public.phone_ai_call_notifications;
CREATE POLICY "service insert notif"
  ON public.phone_ai_call_notifications FOR INSERT TO service_role
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Audit tables are written only by SECURITY DEFINER triggers (which bypass RLS).
-- Restrict INSERT to service_role with a non-trivial check so client callers can't append.
DROP POLICY IF EXISTS "rbt_training_audit_insert" ON public.rbt_training_audit;
CREATE POLICY "rbt_training_audit_insert"
  ON public.rbt_training_audit FOR INSERT TO service_role
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "audit_insert" ON public.rbt_support_audit;
CREATE POLICY "audit_insert"
  ON public.rbt_support_audit FOR INSERT TO service_role
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "audit_service_write" ON public.rbt_notification_audit;
CREATE POLICY "audit_service_write"
  ON public.rbt_notification_audit FOR INSERT TO service_role
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 2) Revoke anon EXECUTE from every public SECURITY DEFINER function,
-- except the token-based public endpoints intentionally callable without auth.
DO $$
DECLARE
  r RECORD;
  keep_names text[] := ARRAY[
    'get_nfc_badge',
    'get_eval_form_by_token',
    'submit_eval_form_response',
    'search_eval_reviewers'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT (p.proname = ANY(keep_names))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon',
                   r.proname, r.args);
  END LOOP;
END
$$;
