
-- ====== Route locks ======
CREATE TABLE public.onboarding_route_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global lock
  route_pattern text NOT NULL,
  reason text NOT NULL,
  locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_orl_user ON public.onboarding_route_locks(user_id) WHERE active;
CREATE INDEX idx_orl_global ON public.onboarding_route_locks(active) WHERE user_id IS NULL;

ALTER TABLE public.onboarding_route_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all route locks"
ON public.onboarding_route_locks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'training_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'training_admin'::app_role)
);

CREATE POLICY "Users see locks affecting them"
ON public.onboarding_route_locks
FOR SELECT
TO authenticated
USING (
  active AND (user_id IS NULL OR user_id = auth.uid())
);

-- ====== Allow admins to insert audit notes ======
CREATE POLICY "Admins write audit log entries"
ON public.onboarding_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'hr_admin'::app_role)
  OR has_role(auth.uid(), 'hr_manager'::app_role)
  OR has_role(auth.uid(), 'training_admin'::app_role)
);

-- ====== Phase rollback function ======
CREATE OR REPLACE FUNCTION public.admin_rollback_onboarding(
  target_user uuid,
  target_phase text,
  keep_modules text[],
  keep_steps text[],
  keep_acks text[],
  note text DEFAULT NULL,
  reset_quiz boolean DEFAULT true,
  clear_certificate boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  prev_modules text[];
  prev_steps text[];
  prev_acks text[];
  prev_completed_at timestamptz;
  prev_certificate text;
  prev_quiz boolean;
BEGIN
  is_admin := has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'hr_admin'::app_role)
    OR has_role(auth.uid(), 'hr_manager'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role);
  IF NOT is_admin THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT modules_complete, completed_steps, acknowledgements, completed_at, certificate_id, quiz_passed
    INTO prev_modules, prev_steps, prev_acks, prev_completed_at, prev_certificate, prev_quiz
  FROM public.onboarding_state WHERE user_id = target_user;

  IF prev_modules IS NULL THEN
    RAISE EXCEPTION 'no onboarding state for user';
  END IF;

  UPDATE public.onboarding_state
  SET
    modules_complete = ARRAY(SELECT unnest(prev_modules) INTERSECT SELECT unnest(coalesce(keep_modules, '{}'::text[]))),
    completed_steps  = ARRAY(SELECT unnest(prev_steps)   INTERSECT SELECT unnest(coalesce(keep_steps,   '{}'::text[]))),
    acknowledgements = ARRAY(SELECT unnest(prev_acks)    INTERSECT SELECT unnest(coalesce(keep_acks,    '{}'::text[]))),
    quiz_passed      = CASE WHEN reset_quiz THEN false ELSE quiz_passed END,
    completed_at     = NULL,
    certificate_id   = CASE WHEN clear_certificate THEN NULL ELSE certificate_id END,
    updated_at       = now()
  WHERE user_id = target_user;

  INSERT INTO public.onboarding_audit_log (user_id, actor_id, event_type, target_key, source, metadata)
  VALUES (
    target_user,
    auth.uid(),
    'phase_rollback',
    target_phase,
    'admin',
    jsonb_build_object(
      'phase', target_phase,
      'note', note,
      'removed_modules', ARRAY(SELECT unnest(prev_modules) EXCEPT SELECT unnest(coalesce(keep_modules, '{}'::text[]))),
      'removed_steps',   ARRAY(SELECT unnest(prev_steps)   EXCEPT SELECT unnest(coalesce(keep_steps,   '{}'::text[]))),
      'removed_acks',    ARRAY(SELECT unnest(prev_acks)    EXCEPT SELECT unnest(coalesce(keep_acks,    '{}'::text[]))),
      'reset_quiz', reset_quiz AND prev_quiz,
      'cleared_certificate', clear_certificate AND prev_certificate IS NOT NULL,
      'was_completed', prev_completed_at IS NOT NULL
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_rollback_onboarding(uuid, text, text[], text[], text[], text, boolean, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_rollback_onboarding(uuid, text, text[], text[], text[], text, boolean, boolean) TO authenticated;
