
CREATE OR REPLACE FUNCTION public.admin_set_chunk_embedding(_id uuid, _emb text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.knowledge_chunks SET embedding = _emb::vector WHERE id = _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_chunk_embedding(uuid, text) TO authenticated, anon, service_role;
