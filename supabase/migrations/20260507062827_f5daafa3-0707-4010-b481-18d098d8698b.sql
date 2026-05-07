
-- 1) Pin support on courses
ALTER TABLE public.training_courses
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

-- 2) Training tracks
CREATE TABLE IF NOT EXISTS public.training_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  role_targets text[] NOT NULL DEFAULT '{}',
  auto_assign_on_hire boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tracks viewable by signed-in users"
  ON public.training_tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Training managers manage tracks"
  ON public.training_tracks FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'hr.training.assign') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_admin'))
  WITH CHECK (public.has_permission(auth.uid(),'hr.training.assign') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_admin'));

CREATE TRIGGER training_tracks_touch BEFORE UPDATE ON public.training_tracks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Track courses
CREATE TABLE IF NOT EXISTS public.training_track_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.training_tracks(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  due_after_days integer,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_track_courses_track ON public.training_track_courses(track_id);
ALTER TABLE public.training_track_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Track courses viewable by signed-in users"
  ON public.training_track_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Training managers manage track courses"
  ON public.training_track_courses FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'hr.training.assign') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_admin'))
  WITH CHECK (public.has_permission(auth.uid(),'hr.training.assign') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr_admin'));

-- 4) Chat conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON public.chat_conversations(user_id, last_message_at DESC);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
  ON public.chat_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER chat_conversations_touch BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5) Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own conv messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users insert own conv messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users delete own conv messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- 6) Knowledge chunks (FTS-based v1, embedding column reserved)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid,
  source_title text NOT NULL,
  source_url text,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  search tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(source_title,'') || ' ' || coalesce(content,''))) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_search ON public.knowledge_chunks USING gin(search);
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON public.knowledge_chunks(source_type, source_id);
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge readable by signed-in users"
  ON public.knowledge_chunks FOR SELECT TO authenticated USING (true);
-- INSERT/DELETE via service role only (no policies = denied for anon/authenticated)

-- 7) Seed two starter tracks
INSERT INTO public.training_tracks (name, description, role_targets, auto_assign_on_hire)
SELECT 'RBT Track', 'Core onboarding and ongoing learning path for Registered Behavior Technicians.', ARRAY['rbt']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.training_tracks WHERE name = 'RBT Track');

INSERT INTO public.training_tracks (name, description, role_targets, auto_assign_on_hire)
SELECT 'BCBA Track', 'Clinical, supervisory, and compliance learning path for BCBAs.', ARRAY['bcba']::text[], true
WHERE NOT EXISTS (SELECT 1 FROM public.training_tracks WHERE name = 'BCBA Track');
