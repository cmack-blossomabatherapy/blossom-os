DROP POLICY IF EXISTS "Public tag lookup" ON public.employee_nfc_tags;
REVOKE SELECT ON public.employee_nfc_tags FROM anon;

CREATE POLICY "Authenticated read nfc tags"
  ON public.employee_nfc_tags FOR SELECT
  TO authenticated
  USING (true);