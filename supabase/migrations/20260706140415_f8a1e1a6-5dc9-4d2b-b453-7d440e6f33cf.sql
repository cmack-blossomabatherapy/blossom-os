
-- =========================================================================
-- RBT Pass 5: rbt_resources + rbt_competency_records
-- =========================================================================

-- ---------- rbt_resources ----------
CREATE TABLE IF NOT EXISTS public.rbt_resources (
  id                text PRIMARY KEY,
  title             text NOT NULL,
  type              text NOT NULL,
  url               text,
  description       text,
  body              text,
  module_ids        text[] NOT NULL DEFAULT '{}',
  minutes           integer,
  category          text,
  tags              text[] NOT NULL DEFAULT '{}',
  required          boolean NOT NULL DEFAULT false,
  tracks            text[] NOT NULL DEFAULT '{}',
  seeded            boolean NOT NULL DEFAULT false,
  is_hidden         boolean NOT NULL DEFAULT false,
  created_by        uuid,
  -- CentralReach integration contract (future)
  centralreach_id   text,
  source_system     text NOT NULL DEFAULT 'blossom_os',
  source_updated_at timestamptz,
  sync_status       text NOT NULL DEFAULT 'local',
  sync_error        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_resources TO authenticated;
GRANT ALL ON public.rbt_resources TO service_role;

ALTER TABLE public.rbt_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rbt_resources_read_visible" ON public.rbt_resources;
CREATE POLICY "rbt_resources_read_visible"
  ON public.rbt_resources FOR SELECT
  TO authenticated
  USING (
    is_hidden = false
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

DROP POLICY IF EXISTS "rbt_resources_admin_insert" ON public.rbt_resources;
CREATE POLICY "rbt_resources_admin_insert"
  ON public.rbt_resources FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

DROP POLICY IF EXISTS "rbt_resources_admin_update" ON public.rbt_resources;
CREATE POLICY "rbt_resources_admin_update"
  ON public.rbt_resources FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

DROP POLICY IF EXISTS "rbt_resources_admin_delete" ON public.rbt_resources;
CREATE POLICY "rbt_resources_admin_delete"
  ON public.rbt_resources FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

CREATE INDEX IF NOT EXISTS rbt_resources_category_idx ON public.rbt_resources(category);
CREATE INDEX IF NOT EXISTS rbt_resources_is_hidden_idx ON public.rbt_resources(is_hidden);

DROP TRIGGER IF EXISTS rbt_resources_touch ON public.rbt_resources;
CREATE TRIGGER rbt_resources_touch BEFORE UPDATE ON public.rbt_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- rbt_competency_records ----------
CREATE TABLE IF NOT EXISTS public.rbt_competency_records (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id             text NOT NULL,
  user_id                uuid,
  track_id               text NOT NULL,
  task_status            jsonb NOT NULL DEFAULT '{}'::jsonb,
  with_client_task_ids   text[] NOT NULL DEFAULT '{}',
  responsible_assessor   jsonb NOT NULL DEFAULT '{}'::jsonb,
  assistant_assessor     jsonb,
  forty_hour_completed_at         timestamptz,
  certification_target_date       date,
  final_attestation_at            timestamptz,
  assessor_name          text,
  assessor_role          text,
  completed_at           timestamptz,
  -- CentralReach integration contract (future)
  centralreach_id        text,
  source_system          text NOT NULL DEFAULT 'blossom_os',
  source_updated_at      timestamptz,
  sync_status            text NOT NULL DEFAULT 'local',
  sync_error             text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trainee_id, track_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_competency_records TO authenticated;
GRANT ALL ON public.rbt_competency_records TO service_role;

ALTER TABLE public.rbt_competency_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rbt_competency_read_own_or_admin" ON public.rbt_competency_records;
CREATE POLICY "rbt_competency_read_own_or_admin"
  ON public.rbt_competency_records FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'bcba'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

DROP POLICY IF EXISTS "rbt_competency_write_own_or_admin" ON public.rbt_competency_records;
CREATE POLICY "rbt_competency_write_own_or_admin"
  ON public.rbt_competency_records FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'bcba'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

DROP POLICY IF EXISTS "rbt_competency_update_own_or_admin" ON public.rbt_competency_records;
CREATE POLICY "rbt_competency_update_own_or_admin"
  ON public.rbt_competency_records FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'bcba'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'bcba'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

DROP POLICY IF EXISTS "rbt_competency_delete_admin" ON public.rbt_competency_records;
CREATE POLICY "rbt_competency_delete_admin"
  ON public.rbt_competency_records FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'coo'::app_role)
  );

CREATE INDEX IF NOT EXISTS rbt_competency_trainee_idx ON public.rbt_competency_records(trainee_id);
CREATE INDEX IF NOT EXISTS rbt_competency_user_idx ON public.rbt_competency_records(user_id);

DROP TRIGGER IF EXISTS rbt_competency_touch ON public.rbt_competency_records;
CREATE TRIGGER rbt_competency_touch BEFORE UPDATE ON public.rbt_competency_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
