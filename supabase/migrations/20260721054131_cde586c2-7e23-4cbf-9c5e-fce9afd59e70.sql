
-- ============================================================================
-- RBT Training Academy — Core schema, config, assignments, retention, RLS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend rbt_pathway_progress with operational fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.rbt_pathway_progress
  ADD COLUMN IF NOT EXISTS evidence_type    text,
  ADD COLUMN IF NOT EXISTS scheduled_at     timestamptz,
  ADD COLUMN IF NOT EXISTS owner_role       text,
  ADD COLUMN IF NOT EXISTS signoff_by       uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS signoff_at       timestamptz,
  ADD COLUMN IF NOT EXISTS signoff_role     text,
  ADD COLUMN IF NOT EXISTS support_needed   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_request_id uuid;

CREATE INDEX IF NOT EXISTS rbt_pathway_progress_employee_idx
  ON public.rbt_pathway_progress(employee_id);
CREATE INDEX IF NOT EXISTS rbt_pathway_progress_support_needed_idx
  ON public.rbt_pathway_progress(support_needed) WHERE support_needed;

-- ---------------------------------------------------------------------------
-- 2. Training configuration (thresholds + toggles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbt_training_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,
  value        jsonb NOT NULL,
  description  text,
  updated_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rbt_training_config TO authenticated;
GRANT ALL    ON public.rbt_training_config TO service_role;

ALTER TABLE public.rbt_training_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_config_read"
  ON public.rbt_training_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_config_admin_write"
  ON public.rbt_training_config FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'training_admin'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'training_admin'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role)
  );

CREATE TRIGGER trg_rbt_training_config_updated
  BEFORE UPDATE ON public.rbt_training_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed non-overlapping competency-score bands (the document's overlapping
-- 36-48 / 47-60 ranges are resolved deterministically as:
--   score <= 36  -> repeat Lead RBT session + new evaluation
--   37-47        -> staff case + Lead RBT attends entire first session
--   48-60        -> staff case + BCBA supervises first session
INSERT INTO public.rbt_training_config (key, value, description)
VALUES
  (
    'developing_rbt_bands',
    jsonb_build_array(
      jsonb_build_object('min', 0,  'max', 36, 'action', 'repeat_lead_session'),
      jsonb_build_object('min', 37, 'max', 47, 'action', 'staff_case_lead_first_session'),
      jsonb_build_object('min', 48, 'max', 60, 'action', 'staff_case_bcba_first_session')
    ),
    'Score bands for Certified RBTs with under 2 years of experience. Non-overlapping.'
  ),
  (
    'certification_min_client_demos',
    jsonb_build_object('required', 3),
    'Minimum in-person client demonstrations before competency signoff for the Certification track.'
  ),
  (
    'retention_checkin_days_after_first_session',
    jsonb_build_object('days', 14),
    'Days after first-session support before a retention check-in is due.'
  )
ON CONFLICT (key) DO NOTHING;

-- Validate: no overlap, no gap in developing bands (checked once here, and
-- again by the app before saves).
DO $$
DECLARE
  bands jsonb;
  prev_max int;
  band jsonb;
  cur_min int;
  cur_max int;
BEGIN
  SELECT value INTO bands FROM public.rbt_training_config
   WHERE key = 'developing_rbt_bands';
  prev_max := -1;
  FOR band IN SELECT * FROM jsonb_array_elements(bands) LOOP
    cur_min := (band->>'min')::int;
    cur_max := (band->>'max')::int;
    IF cur_min <> prev_max + 1 THEN
      RAISE EXCEPTION 'developing_rbt_bands has gap/overlap at %', band;
    END IF;
    prev_max := cur_max;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Owner assignments (named training/resource ownership -> real user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbt_training_owner_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key    text NOT NULL UNIQUE,  -- e.g. 'training_lead_becca', 'floater_lead_rbt', 'session_note_reviewer'
  label        text NOT NULL,
  description  text,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id  uuid,                      -- optional, resolved by app
  assigned_by  uuid REFERENCES auth.users(id),
  assigned_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rbt_training_owner_assignments TO authenticated;
GRANT ALL    ON public.rbt_training_owner_assignments TO service_role;

ALTER TABLE public.rbt_training_owner_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_owners_read"
  ON public.rbt_training_owner_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_owners_admin_write"
  ON public.rbt_training_owner_assignments FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'training_admin'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'training_admin'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role)
  );

CREATE TRIGGER trg_rbt_training_owner_assignments_updated
  BEFORE UPDATE ON public.rbt_training_owner_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed owner slots (no user_id -> shows as unassigned diagnostic to Training Admin)
INSERT INTO public.rbt_training_owner_assignments (owner_key, label, description)
VALUES
  ('training_lead_becca',        'Training Lead (Becca)',        'Owns new-hire orientation, competency prep/review, in-person scheduling, Lead RBT support, trainee feedback, Zoom competency, exam assistance, competency signoff.'),
  ('training_lead_bre',          'Training Lead (Bre)',          'Co-owns new-hire orientation, competency prep/review, in-person scheduling, Lead RBT support, trainee feedback, Zoom competency, exam assistance, competency signoff.'),
  ('floater_lead_rbt',           'Floater / Traveling Lead RBT', 'Owns clinic role-play, ABA basics/session notes/data-collection Zoom, exam help, post-exam check, trainee first-session support (possibly second), evaluation, two-week follow-up, ongoing support/travel/substitution, trainer check-ins.'),
  ('role_play_content_hannah',   'Role-Play Handouts (Hannah)',  'Owns role-play topic handouts and the laminated competency form.'),
  ('session_note_reviewer_anju', 'Session-Note Reviewer (Anju)', 'Reviews trainee session notes and returns feedback.'),
  ('assessment_forms_becca',     'Assessment Forms (Becca)',     'Owns the editable session-note exercise, evaluation form, and two-week check-in form.')
ON CONFLICT (owner_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Trainee assignments (RBT -> Lead RBT / Floater / BCBA)
--    Explicit only. Never derived from CentralReach.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.rbt_trainer_kind AS ENUM (
    'lead_rbt', 'floater_lead_rbt', 'assigned_bcba'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.rbt_trainee_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_user_id uuid NOT NULL,
  trainer_user_id uuid NOT NULL,
  trainer_kind    public.rbt_trainer_kind NOT NULL,
  pathway_id      uuid REFERENCES public.rbt_pathways(id) ON DELETE SET NULL,
  active          boolean NOT NULL DEFAULT true,
  assigned_by     uuid REFERENCES auth.users(id),
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rbt_trainee_assignments_unique_active
  ON public.rbt_trainee_assignments(trainee_user_id, trainer_kind)
  WHERE active;

CREATE INDEX IF NOT EXISTS rbt_trainee_assignments_trainer_idx
  ON public.rbt_trainee_assignments(trainer_user_id, active);
CREATE INDEX IF NOT EXISTS rbt_trainee_assignments_trainee_idx
  ON public.rbt_trainee_assignments(trainee_user_id, active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_trainee_assignments TO authenticated;
GRANT ALL ON public.rbt_trainee_assignments TO service_role;

ALTER TABLE public.rbt_trainee_assignments ENABLE ROW LEVEL SECURITY;

-- The trainee sees their own assignments; assigned trainer/BCBA sees rows
-- where they are the trainer; Admin/HR/Training Admin see all.
CREATE POLICY "trainee_assignments_read"
  ON public.rbt_trainee_assignments FOR SELECT TO authenticated
  USING (
    trainee_user_id = auth.uid()
    OR trainer_user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

CREATE POLICY "trainee_assignments_admin_write"
  ON public.rbt_trainee_assignments FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

CREATE TRIGGER trg_rbt_trainee_assignments_updated
  BEFORE UPDATE ON public.rbt_trainee_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 5. SECURITY DEFINER helpers for scoped trainer/BCBA access
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rbt_is_assigned_trainer(_user uuid, _trainee uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rbt_trainee_assignments
     WHERE trainee_user_id = _trainee
       AND trainer_user_id = _user
       AND active
       AND trainer_kind IN ('lead_rbt','floater_lead_rbt')
  );
$$;

CREATE OR REPLACE FUNCTION public.rbt_is_assigned_bcba(_user uuid, _trainee uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rbt_trainee_assignments
     WHERE trainee_user_id = _trainee
       AND trainer_user_id = _user
       AND active
       AND trainer_kind = 'assigned_bcba'
  );
$$;

REVOKE ALL ON FUNCTION public.rbt_is_assigned_trainer(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rbt_is_assigned_bcba(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rbt_is_assigned_trainer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rbt_is_assigned_bcba(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Extend rbt_pathway_progress RLS so assigned trainer/BCBA can act
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "rbt own progress read"   ON public.rbt_pathway_progress;
DROP POLICY IF EXISTS "rbt own progress update" ON public.rbt_pathway_progress;
DROP POLICY IF EXISTS "rbt own progress write"  ON public.rbt_pathway_progress;

CREATE POLICY "rbt_progress_read"
  ON public.rbt_pathway_progress FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.rbt_is_assigned_trainer(auth.uid(), employee_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), employee_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

CREATE POLICY "rbt_progress_insert"
  ON public.rbt_pathway_progress FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    OR public.rbt_is_assigned_trainer(auth.uid(), employee_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), employee_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

CREATE POLICY "rbt_progress_update"
  ON public.rbt_pathway_progress FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.rbt_is_assigned_trainer(auth.uid(), employee_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), employee_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR public.rbt_is_assigned_trainer(auth.uid(), employee_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), employee_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

-- Enforce that BCBA-only signoff rows can only be signed by a BCBA / admin
CREATE OR REPLACE FUNCTION public.rbt_check_progress_signoff()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.signoff_role = 'bcba' AND NEW.signoff_by IS NOT NULL THEN
    IF NOT (
      has_role(NEW.signoff_by, 'bcba'::app_role)
      OR has_role(NEW.signoff_by, 'clinical_director'::app_role)
      OR has_role(NEW.signoff_by, 'clinical_lead'::app_role)
      OR has_role(NEW.signoff_by, 'admin'::app_role)
      OR has_role(NEW.signoff_by, 'super_admin'::app_role)
    ) THEN
      RAISE EXCEPTION 'signoff_role=bcba requires signoff_by to hold a BCBA/clinical role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rbt_pathway_progress_check_signoff
  ON public.rbt_pathway_progress;
CREATE TRIGGER rbt_pathway_progress_check_signoff
  BEFORE INSERT OR UPDATE ON public.rbt_pathway_progress
  FOR EACH ROW EXECUTE FUNCTION public.rbt_check_progress_signoff();

-- ---------------------------------------------------------------------------
-- 7. Retention: two-week check-in after first-session support
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.rbt_checkin_status AS ENUM (
    'due', 'overdue', 'completed', 'escalated', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.rbt_retention_checkins (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_user_id          uuid NOT NULL,
  first_session_at         timestamptz,
  due_at                   timestamptz NOT NULL,
  completed_at             timestamptz,
  status                   public.rbt_checkin_status NOT NULL DEFAULT 'due',
  owner_key                text NOT NULL DEFAULT 'floater_lead_rbt',
  owner_user_id            uuid REFERENCES auth.users(id),
  overall_feeling          text,
  family_barriers          text,
  bcba_barriers            text,
  bcba_supervised          boolean,
  bcba_instructions_given  boolean,
  confidence_1_5           smallint CHECK (confidence_1_5 BETWEEN 1 AND 5),
  additional_support_needed boolean NOT NULL DEFAULT false,
  additional_support_notes text,
  escalated_at             timestamptz,
  escalated_reason         text,
  created_by               uuid REFERENCES auth.users(id),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rbt_retention_checkins_trainee_idx
  ON public.rbt_retention_checkins(trainee_user_id);
CREATE INDEX IF NOT EXISTS rbt_retention_checkins_status_due_idx
  ON public.rbt_retention_checkins(status, due_at);

GRANT SELECT, INSERT, UPDATE ON public.rbt_retention_checkins TO authenticated;
GRANT ALL ON public.rbt_retention_checkins TO service_role;

ALTER TABLE public.rbt_retention_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retention_read"
  ON public.rbt_retention_checkins FOR SELECT TO authenticated
  USING (
    trainee_user_id = auth.uid()
    OR public.rbt_is_assigned_trainer(auth.uid(), trainee_user_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), trainee_user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

-- Only the assigned trainer/BCBA/Admin/HR can create and complete a check-in.
-- The trainee themselves cannot self-complete a retention check-in.
CREATE POLICY "retention_trainer_write"
  ON public.rbt_retention_checkins FOR INSERT TO authenticated
  WITH CHECK (
    public.rbt_is_assigned_trainer(auth.uid(), trainee_user_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), trainee_user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

CREATE POLICY "retention_trainer_update"
  ON public.rbt_retention_checkins FOR UPDATE TO authenticated
  USING (
    public.rbt_is_assigned_trainer(auth.uid(), trainee_user_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), trainee_user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  )
  WITH CHECK (
    public.rbt_is_assigned_trainer(auth.uid(), trainee_user_id)
    OR public.rbt_is_assigned_bcba(auth.uid(), trainee_user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'training_admin'::app_role)
    OR has_role(auth.uid(), 'hr'::app_role)
  );

CREATE TRIGGER trg_rbt_retention_checkins_updated
  BEFORE UPDATE ON public.rbt_retention_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 8. Fellowship-readiness helper
--    Consumed by the RBT app and Fellowship Explorer to gate the pathway.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rbt_academy_ready_for_fellowship(_employee uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH active AS (
    SELECT a.pathway_id
      FROM public.rbt_pathway_assignments a
     WHERE a.employee_id = _employee AND a.active
     ORDER BY a.assigned_at DESC
     LIMIT 1
  ),
  required AS (
    SELECT s.id
      FROM public.rbt_pathway_steps s
      JOIN active ON active.pathway_id = s.pathway_id
     WHERE s.required
  ),
  done AS (
    SELECT p.pathway_step_id
      FROM public.rbt_pathway_progress p
      JOIN required r ON r.id = p.pathway_step_id
     WHERE p.employee_id = _employee AND p.status = 'complete'
  )
  SELECT (SELECT COUNT(*) FROM required) > 0
     AND (SELECT COUNT(*) FROM done) = (SELECT COUNT(*) FROM required);
$$;

REVOKE ALL ON FUNCTION public.rbt_academy_ready_for_fellowship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rbt_academy_ready_for_fellowship(uuid) TO authenticated;
