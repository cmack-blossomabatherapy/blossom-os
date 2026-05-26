
CREATE OR REPLACE FUNCTION public.ai_admin_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 1. AI memory entries
CREATE TABLE IF NOT EXISTS public.ai_memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global','role','department')),
  scope_value text,
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_memory_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read ai memory" ON public.ai_memory_entries FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert ai memory" ON public.ai_memory_entries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update ai memory" ON public.ai_memory_entries FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete ai memory" ON public.ai_memory_entries FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS ai_memory_entries_scope_idx ON public.ai_memory_entries(scope, scope_value) WHERE active;
CREATE TRIGGER ai_memory_entries_updated_at BEFORE UPDATE ON public.ai_memory_entries FOR EACH ROW EXECUTE FUNCTION public.ai_admin_touch_updated_at();

-- 2. Approved answers
CREATE TABLE IF NOT EXISTS public.ai_approved_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_approved_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read approved answers" ON public.ai_approved_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert approved answers" ON public.ai_approved_answers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update approved answers" ON public.ai_approved_answers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete approved answers" ON public.ai_approved_answers FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER ai_approved_answers_updated_at BEFORE UPDATE ON public.ai_approved_answers FOR EACH ROW EXECUTE FUNCTION public.ai_admin_touch_updated_at();

-- 3. Appearance settings (singleton)
CREATE TABLE IF NOT EXISTS public.ai_appearance_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  greeting text NOT NULL DEFAULT 'Hi — I''m Blossom AI. Ask me anything about your work, your trainings, or our SOPs.',
  tone text NOT NULL DEFAULT 'warm' CHECK (tone IN ('concise','warm','formal')),
  suggested_prompts jsonb NOT NULL DEFAULT '["Summarize my open trainings","What is the VOB process?","Show me the RBT onboarding SOP","Who do I contact for payroll questions?"]'::jsonb,
  widgets jsonb NOT NULL DEFAULT '{"show_quick_actions": true, "show_insights": true, "show_history": true}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ai_appearance_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.ai_appearance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads appearance" ON public.ai_appearance_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update appearance" ON public.ai_appearance_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert appearance" ON public.ai_appearance_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER ai_appearance_settings_updated_at BEFORE UPDATE ON public.ai_appearance_settings FOR EACH ROW EXECUTE FUNCTION public.ai_admin_touch_updated_at();

-- 4. AI message feedback
CREATE TABLE IF NOT EXISTS public.ai_message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid,
  message_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_message_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own feedback" ON public.ai_message_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all feedback" ON public.ai_message_feedback FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
