
-- Finding 2: allow RBTs to save career interests via their employee record id
DROP POLICY IF EXISTS "rbt own career upsert" ON public.rbt_career_interests;
DROP POLICY IF EXISTS "rbt own career update" ON public.rbt_career_interests;
DROP POLICY IF EXISTS "rbt own career read" ON public.rbt_career_interests;

CREATE POLICY "rbt own career read" ON public.rbt_career_interests
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = rbt_career_interests.employee_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr')
    OR public.has_role(auth.uid(),'training_admin')
  );

CREATE POLICY "rbt own career upsert" ON public.rbt_career_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = rbt_career_interests.employee_id AND e.user_id = auth.uid())
  );

CREATE POLICY "rbt own career update" ON public.rbt_career_interests
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = rbt_career_interests.employee_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = rbt_career_interests.employee_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

-- Finding 3: allow anon to EXECUTE has_role so RLS policies referencing it
-- don't fail with "permission denied for function has_role" on signed-out
-- requests. The function is SECURITY DEFINER and returns false for a null
-- auth.uid(), so exposing EXECUTE to anon is safe.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
