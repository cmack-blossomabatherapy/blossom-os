
CREATE TABLE public.email_command_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_message_id TEXT NOT NULL,
  conversation_id TEXT,
  provider TEXT NOT NULL DEFAULT 'outlook',
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ,
  is_unread BOOLEAN DEFAULT TRUE,
  importance TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  workflow_tag TEXT,
  suggested_owner TEXT,
  urgency TEXT,
  risk_level TEXT,
  web_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, external_message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_command_items TO authenticated;
GRANT ALL ON public.email_command_items TO service_role;
ALTER TABLE public.email_command_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ECC items: owner read" ON public.email_command_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ECC items: owner write" ON public.email_command_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.email_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_command_item_id UUID NOT NULL REFERENCES public.email_command_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_summary TEXT,
  recommended_action TEXT,
  recommended_channel TEXT,
  suggested_owner TEXT,
  confidence NUMERIC,
  reason TEXT,
  workflow_tag TEXT,
  draft_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_recommendations TO authenticated;
GRANT ALL ON public.email_recommendations TO service_role;
ALTER TABLE public.email_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ECC rec: owner read" ON public.email_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ECC rec: owner write" ON public.email_recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.email_action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_command_item_id UUID NOT NULL REFERENCES public.email_command_items(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.email_recommendations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_action_queue TO authenticated;
GRANT ALL ON public.email_action_queue TO service_role;
ALTER TABLE public.email_action_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ECC queue: owner read" ON public.email_action_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ECC queue: owner write" ON public.email_action_queue FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.email_action_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_command_item_id UUID REFERENCES public.email_command_items(id) ON DELETE SET NULL,
  action_queue_id UUID REFERENCES public.email_action_queue(id) ON DELETE SET NULL,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  provider TEXT,
  status TEXT NOT NULL,
  payload_summary TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_action_audit TO authenticated;
GRANT ALL ON public.email_action_audit TO service_role;
ALTER TABLE public.email_action_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ECC audit: owner read" ON public.email_action_audit FOR SELECT TO authenticated USING (auth.uid() = actor_user_id);
CREATE POLICY "ECC audit: owner insert" ON public.email_action_audit FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_user_id);

CREATE INDEX idx_ecc_items_user ON public.email_command_items(user_id, received_at DESC);
CREATE INDEX idx_ecc_rec_item ON public.email_recommendations(email_command_item_id);
CREATE INDEX idx_ecc_queue_user_status ON public.email_action_queue(user_id, status);
CREATE INDEX idx_ecc_audit_actor ON public.email_action_audit(actor_user_id, created_at DESC);
