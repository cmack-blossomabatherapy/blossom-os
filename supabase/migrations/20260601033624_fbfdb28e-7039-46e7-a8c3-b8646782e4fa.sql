
-- Restrict write access on recruiting_workflow_stages to recruiting staff only
DROP POLICY IF EXISTS "Authenticated can insert workflow stages" ON public.recruiting_workflow_stages;
DROP POLICY IF EXISTS "Authenticated can update workflow stages" ON public.recruiting_workflow_stages;
DROP POLICY IF EXISTS "Authenticated can delete workflow stages" ON public.recruiting_workflow_stages;

CREATE POLICY "Recruiting can insert workflow stages"
ON public.recruiting_workflow_stages
FOR INSERT TO authenticated
WITH CHECK (public.recruiting_can_write(auth.uid()));

CREATE POLICY "Recruiting can update workflow stages"
ON public.recruiting_workflow_stages
FOR UPDATE TO authenticated
USING (public.recruiting_can_write(auth.uid()))
WITH CHECK (public.recruiting_can_write(auth.uid()));

CREATE POLICY "Recruiting can delete workflow stages"
ON public.recruiting_workflow_stages
FOR DELETE TO authenticated
USING (public.recruiting_can_write(auth.uid()));

-- Restrict write access on interview_outcome_checks to recruiting staff only
DROP POLICY IF EXISTS "Authenticated can insert interview checks" ON public.interview_outcome_checks;
DROP POLICY IF EXISTS "Authenticated can update interview checks" ON public.interview_outcome_checks;
DROP POLICY IF EXISTS "Authenticated can delete interview checks" ON public.interview_outcome_checks;

CREATE POLICY "Recruiting can insert interview checks"
ON public.interview_outcome_checks
FOR INSERT TO authenticated
WITH CHECK (public.recruiting_can_write(auth.uid()));

CREATE POLICY "Recruiting can update interview checks"
ON public.interview_outcome_checks
FOR UPDATE TO authenticated
USING (public.recruiting_can_write(auth.uid()))
WITH CHECK (public.recruiting_can_write(auth.uid()));

CREATE POLICY "Recruiting can delete interview checks"
ON public.interview_outcome_checks
FOR DELETE TO authenticated
USING (public.recruiting_can_write(auth.uid()));
