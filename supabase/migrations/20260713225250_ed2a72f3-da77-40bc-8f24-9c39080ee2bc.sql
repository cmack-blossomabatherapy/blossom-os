-- 1. Extend knowledge_chunks with resource visibility metadata
ALTER TABLE public.knowledge_chunks
  ADD COLUMN IF NOT EXISTS resource_id text,
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS visibility_level text,
  ADD COLUMN IF NOT EXISTS visible_to_roles text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_sensitive boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS resource_type text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_resource_id
  ON public.knowledge_chunks (resource_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_visibility
  ON public.knowledge_chunks (visibility_level);

-- 2. Tighten SELECT on knowledge_chunks (was USING (true))
DROP POLICY IF EXISTS "Knowledge readable by signed-in users" ON public.knowledge_chunks;

CREATE POLICY "Role-scoped chunk visibility"
  ON public.knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    -- Legacy general-knowledge chunks not tied to a Resource Library row stay readable to signed-in users
    OR (resource_id IS NULL AND (visibility_level IS NULL OR visibility_level = 'all_staff'))
    -- Resource-linked chunks follow Resource Library visibility rules
    OR public.hr_resource_visible(
         auth.uid(),
         visibility_level,
         visible_to_roles,
         COALESCE(tags, '{}'::text[]),
         COALESCE(is_sensitive, false)
       )
  );

CREATE POLICY "Service role and admins write chunks"
  ON public.knowledge_chunks
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 3. Ingestion tracking on hr_resources
ALTER TABLE public.hr_resources
  ADD COLUMN IF NOT EXISTS ingest_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ingest_error text,
  ADD COLUMN IF NOT EXISTS chunk_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ingested_at timestamptz,
  ADD COLUMN IF NOT EXISTS transcript_available boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_hr_resources_ingest_status
  ON public.hr_resources (ingest_status);

-- Rows that have no file can never be ingested — mark them accordingly.
UPDATE public.hr_resources
   SET ingest_status = 'no_file'
 WHERE ingest_status = 'pending'
   AND (upload_status = 'missing_file' OR storage_path IS NULL OR storage_path = '');

-- 4. Role-aware retrieval RPC (SECURITY INVOKER: caller's RLS applies)
DROP FUNCTION IF EXISTS public.match_resource_chunks(vector, integer, text, text);

CREATE OR REPLACE FUNCTION public.match_resource_chunks(
  query_embedding vector(1536),
  match_count integer DEFAULT 8,
  filter_department text DEFAULT NULL,
  filter_resource_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  resource_id text,
  source_title text,
  content text,
  chunk_index integer,
  storage_bucket text,
  storage_path text,
  department text,
  resource_type text,
  visibility_level text,
  similarity double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.resource_id,
    c.source_title,
    c.content,
    c.chunk_index,
    c.storage_bucket,
    c.storage_path,
    c.department,
    c.resource_type,
    c.visibility_level,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_department IS NULL OR c.department = filter_department)
    AND (filter_resource_type IS NULL OR c.resource_type = filter_resource_type)
  ORDER BY c.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

GRANT EXECUTE ON FUNCTION public.match_resource_chunks(vector, integer, text, text)
  TO authenticated, service_role;