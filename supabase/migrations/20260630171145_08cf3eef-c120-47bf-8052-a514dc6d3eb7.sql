
CREATE TABLE public.scheduling_contact_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  contact_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  subject TEXT,
  body TEXT,
  outcome TEXT,
  follow_up_at TIMESTAMPTZ,
  state TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_contact_attempts TO authenticated;
GRANT ALL ON public.scheduling_contact_attempts TO service_role;
ALTER TABLE public.scheduling_contact_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduling_contact_attempts_read_auth" ON public.scheduling_contact_attempts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "scheduling_contact_attempts_insert_auth" ON public.scheduling_contact_attempts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scheduling_contact_attempts_update_auth" ON public.scheduling_contact_attempts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scheduling_contact_attempts_delete_admin" ON public.scheduling_contact_attempts
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
CREATE INDEX scheduling_contact_attempts_client_idx ON public.scheduling_contact_attempts(client_id);
CREATE INDEX scheduling_contact_attempts_type_idx ON public.scheduling_contact_attempts(contact_type);
CREATE INDEX scheduling_contact_attempts_created_idx ON public.scheduling_contact_attempts(created_at DESC);
CREATE TRIGGER scheduling_contact_attempts_set_updated_at
  BEFORE UPDATE ON public.scheduling_contact_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
