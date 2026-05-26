CREATE OR REPLACE FUNCTION public.match_knowledge_chunks_v2(
  query_embedding vector(1536),
  match_count INT DEFAULT 6,
  min_similarity FLOAT DEFAULT 0.4,
  _roles TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  source_title TEXT,
  source_url TEXT,
  content TEXT,
  similarity FLOAT,
  category TEXT
)
LANGUAGE SQL STABLE SET search_path = public
AS $$
  SELECT
    kc.id,
    kc.document_id,
    kc.source_title,
    kc.source_url,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    COALESCE(kd.category, 'general') AS category
  FROM public.knowledge_chunks kc
  LEFT JOIN public.knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) >= min_similarity
    AND (
      kd.id IS NULL
      OR kd.role_visibility IS NULL
      OR _roles IS NULL
      OR kd.role_visibility && _roles
    )
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;