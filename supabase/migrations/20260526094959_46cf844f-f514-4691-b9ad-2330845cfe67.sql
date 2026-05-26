
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.knowledge_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON public.knowledge_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  role_visibility TEXT[] DEFAULT NULL,
  source_kind TEXT NOT NULL DEFAULT 'manual',
  file_path TEXT,
  file_mime TEXT,
  file_size_bytes BIGINT,
  source_url TEXT,
  raw_content TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  ingest_status TEXT NOT NULL DEFAULT 'pending',
  ingest_error TEXT,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON public.knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON public.knowledge_documents(category);

ALTER TABLE public.knowledge_chunks
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON public.knowledge_chunks(document_id);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- platform admin check (the existing 'admin' role in app_role enum acts as Super Admin)
CREATE OR REPLACE FUNCTION public.is_platform_admin(_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Super admins manage knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Super admins manage knowledge documents"
  ON public.knowledge_documents
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_knowledge_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_knowledge_documents_updated_at ON public.knowledge_documents;
CREATE TRIGGER trg_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_knowledge_documents_updated_at();

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 6,
  min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  source_title TEXT,
  source_url TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE SET search_path = public
AS $$
  SELECT
    kc.id,
    kc.source_title,
    kc.source_url,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) >= min_similarity
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-documents', 'knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Super admins read knowledge files" ON storage.objects;
CREATE POLICY "Super admins read knowledge files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'knowledge-documents' AND public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins upload knowledge files" ON storage.objects;
CREATE POLICY "Super admins upload knowledge files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'knowledge-documents' AND public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins update knowledge files" ON storage.objects;
CREATE POLICY "Super admins update knowledge files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'knowledge-documents' AND public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins delete knowledge files" ON storage.objects;
CREATE POLICY "Super admins delete knowledge files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'knowledge-documents' AND public.is_platform_admin(auth.uid()));
