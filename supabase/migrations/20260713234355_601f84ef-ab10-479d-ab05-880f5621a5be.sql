
-- Helper: is the current user in leadership?
CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'super_admin','ceo','coo','director_of_operations',
        'exec','executive','executive_leadership','operations_leadership','admin'
      )
  );
$$;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.user_task_status AS ENUM ('open','in_progress','done','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_task_priority AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_goal_status AS ENUM (
    'draft_milestones','pending_approval','changes_requested','active','completed','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_goal_milestone_status AS ENUM (
    'pending','approved','changes_requested','in_progress','done'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared updated_at trigger (create if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================================
-- USER TASKS
-- =========================================================================
CREATE TABLE public.user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee_id uuid NOT NULL,
  assigned_by_id uuid NOT NULL,
  due_at timestamptz,
  priority public.user_task_priority NOT NULL DEFAULT 'medium',
  status public.user_task_status NOT NULL DEFAULT 'open',
  related_record_type text,
  related_record_id text,
  related_record_label text,
  related_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_tasks_assignee ON public.user_tasks(assignee_id, status, due_at);
CREATE INDEX idx_user_tasks_assigned_by ON public.user_tasks(assigned_by_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tasks TO authenticated;
GRANT ALL ON public.user_tasks TO service_role;

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own or assigned tasks"
  ON public.user_tasks FOR SELECT TO authenticated
  USING (
    assignee_id = auth.uid()
    OR assigned_by_id = auth.uid()
    OR public.is_leadership(auth.uid())
  );

CREATE POLICY "Users create tasks they assign"
  ON public.user_tasks FOR INSERT TO authenticated
  WITH CHECK (assigned_by_id = auth.uid());

CREATE POLICY "Assignee or assigner update tasks"
  ON public.user_tasks FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid()
    OR assigned_by_id = auth.uid()
    OR public.is_leadership(auth.uid())
  )
  WITH CHECK (
    assignee_id = auth.uid()
    OR assigned_by_id = auth.uid()
    OR public.is_leadership(auth.uid())
  );

CREATE POLICY "Assigner or leadership delete tasks"
  ON public.user_tasks FOR DELETE TO authenticated
  USING (assigned_by_id = auth.uid() OR public.is_leadership(auth.uid()));

CREATE TRIGGER trg_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- USER GOALS
-- =========================================================================
CREATE TABLE public.user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  owner_id uuid NOT NULL,
  assigned_by_id uuid NOT NULL,
  target_date date,
  priority public.user_task_priority NOT NULL DEFAULT 'medium',
  status public.user_goal_status NOT NULL DEFAULT 'draft_milestones',
  approval_notes text,
  approved_by_id uuid,
  approved_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_goals_owner ON public.user_goals(owner_id, status);
CREATE INDEX idx_user_goals_status ON public.user_goals(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goals TO authenticated;
GRANT ALL ON public.user_goals TO service_role;

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own goals or leadership all"
  ON public.user_goals FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR assigned_by_id = auth.uid() OR public.is_leadership(auth.uid()));

CREATE POLICY "Leadership assigns goals"
  ON public.user_goals FOR INSERT TO authenticated
  WITH CHECK (public.is_leadership(auth.uid()) AND assigned_by_id = auth.uid());

CREATE POLICY "Owner or leadership update goals"
  ON public.user_goals FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_leadership(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_leadership(auth.uid()));

CREATE POLICY "Leadership delete goals"
  ON public.user_goals FOR DELETE TO authenticated
  USING (public.is_leadership(auth.uid()));

CREATE TRIGGER trg_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- USER GOAL MILESTONES
-- =========================================================================
CREATE TABLE public.user_goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  success_criteria text,
  target_date date,
  status public.user_goal_milestone_status NOT NULL DEFAULT 'pending',
  order_index int NOT NULL DEFAULT 0,
  approval_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_goal_milestones_goal ON public.user_goal_milestones(goal_id, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goal_milestones TO authenticated;
GRANT ALL ON public.user_goal_milestones TO service_role;

ALTER TABLE public.user_goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read milestones with goal"
  ON public.user_goal_milestones FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR g.assigned_by_id = auth.uid() OR public.is_leadership(auth.uid()))
  ));

CREATE POLICY "Insert milestones on own goal or leadership"
  ON public.user_goal_milestones FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR public.is_leadership(auth.uid()))
  ));

CREATE POLICY "Update milestones on own goal or leadership"
  ON public.user_goal_milestones FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR public.is_leadership(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR public.is_leadership(auth.uid()))
  ));

CREATE POLICY "Delete milestones on own goal or leadership"
  ON public.user_goal_milestones FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR public.is_leadership(auth.uid()))
  ));

CREATE TRIGGER trg_user_goal_milestones_updated_at
  BEFORE UPDATE ON public.user_goal_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- USER GOAL ACTIVITY
-- =========================================================================
CREATE TABLE public.user_goal_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_goal_activity_goal ON public.user_goal_activity(goal_id, created_at DESC);

GRANT SELECT, INSERT ON public.user_goal_activity TO authenticated;
GRANT ALL ON public.user_goal_activity TO service_role;

ALTER TABLE public.user_goal_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read activity with goal"
  ON public.user_goal_activity FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR g.assigned_by_id = auth.uid() OR public.is_leadership(auth.uid()))
  ));

CREATE POLICY "Insert own activity"
  ON public.user_goal_activity FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_goals g
    WHERE g.id = goal_id
      AND (g.owner_id = auth.uid() OR g.assigned_by_id = auth.uid() OR public.is_leadership(auth.uid()))
  ));
