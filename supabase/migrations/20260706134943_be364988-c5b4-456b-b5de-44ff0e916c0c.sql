-- Case Manager narrow timeline insert policy.
-- Adds a scoped INSERT policy on public.client_timeline so Case Managers can
-- append events for the clients they are actively assigned to WITHOUT needing
-- broad clients.edit. Existing "Insert timeline with permission" policy stays
-- so users with clients.edit continue to work.

CREATE POLICY "Case managers insert assigned client timeline"
ON public.client_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_case_manager()
  AND client_id IS NOT NULL
  AND public.is_case_manager_for_client(client_id)
);
