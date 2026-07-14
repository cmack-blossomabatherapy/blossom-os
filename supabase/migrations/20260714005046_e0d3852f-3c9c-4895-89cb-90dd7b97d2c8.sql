
-- 1. Columns
ALTER TABLE public.user_goals
  ADD COLUMN IF NOT EXISTS goal_type text NOT NULL DEFAULT 'assigned'
    CHECK (goal_type IN ('assigned','personal','team')),
  ADD COLUMN IF NOT EXISTS quarter text;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_people_manager boolean NOT NULL DEFAULT false;

-- 2. Helper functions
CREATE OR REPLACE FUNCTION public.is_strict_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','ceo','coo','director_of_operations',
                   'exec','executive','executive_leadership')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_people_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE user_id = _user_id AND is_people_manager = true
  );
$$;

CREATE OR REPLACE FUNCTION public.manages_employee(_manager uuid, _employee uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees emp
    JOIN public.employees mgr ON mgr.id = emp.manager_id
    WHERE emp.user_id = _employee
      AND mgr.user_id = _manager
      AND mgr.is_people_manager = true
  );
$$;

-- 3. Rewrite INSERT policy on user_goals
DROP POLICY IF EXISTS "Leadership assigns goals" ON public.user_goals;

CREATE POLICY "Create goals (personal, team, or leadership)"
ON public.user_goals
FOR INSERT
WITH CHECK (
  assigned_by_id = auth.uid()
  AND (
    -- personal goal for oneself
    (goal_type = 'personal' AND owner_id = auth.uid())
    -- strict leadership assigning a quarterly goal
    OR (goal_type = 'assigned' AND public.is_strict_leadership(auth.uid()))
    -- people manager assigning to a direct report
    OR (goal_type = 'team' AND public.manages_employee(auth.uid(), owner_id))
  )
);
