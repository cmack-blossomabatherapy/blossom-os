
DROP POLICY IF EXISTS "RBT updates own readiness progress" ON public.rbt_readiness_records;
CREATE POLICY "RBT updates own readiness progress"
ON public.rbt_readiness_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
