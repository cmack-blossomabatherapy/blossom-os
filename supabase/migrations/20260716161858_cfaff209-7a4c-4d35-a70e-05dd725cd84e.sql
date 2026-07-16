
-- 1) CTM call events: drop the permissive USING(true) read policy
DROP POLICY IF EXISTS "ctm_call_events_auth_read" ON public.ctm_call_events;

-- 2) lead_documents table: drop permissive true policies
DROP POLICY IF EXISTS "Authenticated can read lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Authenticated can insert lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Authenticated can update lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Authenticated can delete lead documents" ON public.lead_documents;

-- 3) lead-documents storage bucket: drop permissive true policies
DROP POLICY IF EXISTS "Authenticated can read lead documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert lead documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update lead documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete lead documents" ON storage.objects;

-- 4) phone_ai_call_notifications: restrict insert to service_role only
DROP POLICY IF EXISTS "service insert notif" ON public.phone_ai_call_notifications;
CREATE POLICY "service insert notif"
  ON public.phone_ai_call_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);
