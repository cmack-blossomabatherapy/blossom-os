DROP POLICY IF EXISTS "cr_id_queue_no_client_write" ON public.cr_identity_mapping_queue;

CREATE POLICY "cr_id_queue_hub_insert"
ON public.cr_identity_mapping_queue
FOR INSERT
TO authenticated
WITH CHECK (public.cr_hub_can_manage());