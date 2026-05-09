-- ============ onboarding_state table ============
CREATE TABLE IF NOT EXISTS public.onboarding_state (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_steps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  modules_complete TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  acknowledgements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  quiz_passed BOOLEAN NOT NULL DEFAULT false,
  path TEXT NOT NULL DEFAULT 'existing_state',
  notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  checkins JSONB NOT NULL DEFAULT '{"chad":[],"shira":[]}'::jsonb,
  completed_at TIMESTAMPTZ,
  certificate_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validate `path` via trigger (avoid CHECK constraints that lock us in).
CREATE OR REPLACE FUNCTION public.validate_onboarding_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.path IS NULL OR NEW.path NOT IN ('existing_state','new_state') THEN
    RAISE EXCEPTION 'invalid onboarding path: %', NEW.path;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_onboarding_state ON public.onboarding_state;
CREATE TRIGGER trg_validate_onboarding_state
  BEFORE INSERT OR UPDATE ON public.onboarding_state
  FOR EACH ROW EXECUTE FUNCTION public.validate_onboarding_state();

-- ============ RLS ============
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;

-- Self access (read/write own row).
CREATE POLICY "Users can view their own onboarding state"
  ON public.onboarding_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding state"
  ON public.onboarding_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding state"
  ON public.onboarding_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin/HR/training-admin read-only visibility, via the existing has_role() helper.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Staff admins can view all onboarding state"
        ON public.onboarding_state FOR SELECT
        TO authenticated
        USING (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'hr_admin'::app_role)
          OR public.has_role(auth.uid(), 'hr_manager'::app_role)
          OR public.has_role(auth.uid(), 'training_admin'::app_role)
        )
    $POLICY$;
  END IF;
END
$$;

-- ============ Auto-create row on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.onboarding_state (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_onboarding_state ON auth.users;
CREATE TRIGGER on_auth_user_created_onboarding_state
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding_state();

-- Backfill rows for existing users.
INSERT INTO public.onboarding_state (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Helpful index for staff-admin scans.
CREATE INDEX IF NOT EXISTS idx_onboarding_state_completed_at
  ON public.onboarding_state (completed_at);
