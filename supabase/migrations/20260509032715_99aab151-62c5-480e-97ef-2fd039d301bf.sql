
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.sop_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  owner text,
  source text NOT NULL DEFAULT 'paste',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sop_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid NOT NULL REFERENCES public.sop_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section text NOT NULL,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  char_length integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sop_sections_sop ON public.sop_sections(sop_id, position);
CREATE INDEX idx_sop_sections_user ON public.sop_sections(user_id);
CREATE INDEX idx_sop_documents_user ON public.sop_documents(user_id);

ALTER TABLE public.sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own SOPs - select" ON public.sop_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own SOPs - insert" ON public.sop_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own SOPs - update" ON public.sop_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own SOPs - delete" ON public.sop_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Own SOP sections - select" ON public.sop_sections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own SOP sections - insert" ON public.sop_sections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own SOP sections - update" ON public.sop_sections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own SOP sections - delete" ON public.sop_sections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_sop_documents_updated_at
  BEFORE UPDATE ON public.sop_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sop_sections_updated_at
  BEFORE UPDATE ON public.sop_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_sop_document()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.sop_documents SET updated_at = now()
  WHERE id = COALESCE(NEW.sop_id, OLD.sop_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_touch_sop_doc_on_section
  AFTER INSERT OR UPDATE OR DELETE ON public.sop_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_sop_document();
