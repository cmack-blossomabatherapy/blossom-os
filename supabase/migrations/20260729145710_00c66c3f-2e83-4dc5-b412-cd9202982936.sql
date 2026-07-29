CREATE OR REPLACE FUNCTION public.recruiting_client_staffing_options(_search text DEFAULT NULL, _limit int DEFAULT 25)
RETURNS TABLE(client_id uuid, display_label text, state text, clinic text, service_location text, staffing_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    -- Minimum identifying label only: first name + last initial.
    trim(split_part(coalesce(c.child_name,''), ' ', 1) || ' ' ||
         left(coalesce(nullif(split_part(coalesce(c.child_name,''), ' ', 2), ''), ''), 1)) AS display_label,
    c.state::text,
    c.clinic,
    c.service_location,
    c.staffing_status::text
  FROM public.clients c
  WHERE (public.recruiting_can_read(auth.uid()) OR public.has_permission(auth.uid(), 'staffing.view'))
    AND (
      _search IS NULL OR _search = ''
      OR c.child_name ILIKE '%' || _search || '%'
      OR c.state::text ILIKE '%' || _search || '%'
      OR coalesce(c.clinic,'') ILIKE '%' || _search || '%'
    )
  ORDER BY c.child_name
  LIMIT least(coalesce(_limit, 25), 100);
$$;

REVOKE ALL ON FUNCTION public.recruiting_client_staffing_options(text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.recruiting_client_staffing_options(text, int) TO authenticated;