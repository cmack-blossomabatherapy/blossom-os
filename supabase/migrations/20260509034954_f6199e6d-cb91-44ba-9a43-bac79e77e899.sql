
DO $$ BEGIN
  CREATE TYPE public.chat_feedback_vote AS ENUM ('up', 'down');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.chat_message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL UNIQUE REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote public.chat_feedback_vote NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_user ON public.chat_message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_vote ON public.chat_message_feedback(vote, created_at DESC);

ALTER TABLE public.chat_message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conv feedback or admins/leadership view all"
  ON public.chat_message_feedback FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'exec')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_conversations c ON c.id = m.conversation_id
      WHERE m.id = chat_message_feedback.message_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert feedback on own assistant messages"
  ON public.chat_message_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_conversations c ON c.id = m.conversation_id
      WHERE m.id = chat_message_feedback.message_id
        AND c.user_id = auth.uid()
        AND m.role = 'assistant'
    )
  );

CREATE POLICY "Users update own feedback"
  ON public.chat_message_feedback FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own feedback"
  ON public.chat_message_feedback FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_chat_feedback_touch
  BEFORE UPDATE ON public.chat_message_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
