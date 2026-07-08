
-- Fix 1: Restrict lead-documents storage bucket to leads.view/leads.edit permission holders
DROP POLICY IF EXISTS "Authenticated read lead-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload lead-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update lead-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete lead-documents" ON storage.objects;

CREATE POLICY "Leads.view read lead-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lead-documents' AND public.has_permission(auth.uid(), 'leads.view'));

CREATE POLICY "Leads.edit upload lead-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lead-documents' AND public.has_permission(auth.uid(), 'leads.edit'));

CREATE POLICY "Leads.edit update lead-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lead-documents' AND public.has_permission(auth.uid(), 'leads.edit'))
WITH CHECK (bucket_id = 'lead-documents' AND public.has_permission(auth.uid(), 'leads.edit'));

CREATE POLICY "Leads.edit delete lead-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lead-documents' AND public.has_permission(auth.uid(), 'leads.edit'));

-- Fix 2: Restrict phone_ai_call_notifications SELECT to phone/intake staff roles (same as phone_ai_calls)
DROP POLICY IF EXISTS "auth read notif" ON public.phone_ai_call_notifications;

CREATE POLICY "phone_ai_call_notifications_role_read"
ON public.phone_ai_call_notifications FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'systems_admin'::app_role)
  OR has_role(auth.uid(), 'ops_manager'::app_role)
  OR has_role(auth.uid(), 'phone_support'::app_role)
  OR has_role(auth.uid(), 'intake'::app_role)
  OR has_role(auth.uid(), 'intake_lead'::app_role)
  OR has_role(auth.uid(), 'intake_coordinator'::app_role)
);
