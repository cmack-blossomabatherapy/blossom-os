
CREATE TABLE public.escalation_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'escalation',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  state text,
  linked_entity_type text,
  linked_entity_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.escalation_thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.escalation_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_escthreads_to ON public.escalation_threads (to_user_id, status, updated_at DESC);
CREATE INDEX idx_escthreads_from ON public.escalation_threads (from_user_id, status, updated_at DESC);
CREATE INDEX idx_escmsgs_thread ON public.escalation_thread_messages (thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escalation_threads TO authenticated;
GRANT ALL ON public.escalation_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escalation_thread_messages TO authenticated;
GRANT ALL ON public.escalation_thread_messages TO service_role;

ALTER TABLE public.escalation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esc_threads_participants_select" ON public.escalation_threads
  FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "esc_threads_sender_insert" ON public.escalation_threads
  FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "esc_threads_participants_update" ON public.escalation_threads
  FOR UPDATE TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid())
  WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "esc_msgs_participants_select" ON public.escalation_thread_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.escalation_threads t
                 WHERE t.id = thread_id AND (t.from_user_id = auth.uid() OR t.to_user_id = auth.uid())));
CREATE POLICY "esc_msgs_participants_insert" ON public.escalation_thread_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.escalation_threads t
    WHERE t.id = thread_id AND (t.from_user_id = auth.uid() OR t.to_user_id = auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.touch_escalation_thread()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.escalation_threads SET updated_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_touch_escalation_thread
  AFTER INSERT ON public.escalation_thread_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_escalation_thread();

ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_thread_messages;
