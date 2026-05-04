-- Enums
CREATE TYPE public.training_followup_status AS ENUM ('pending', 'completed', 'snoozed', 'skipped');
CREATE TYPE public.training_audience AS ENUM ('rbt', 'bcba', 'both');

-- Module defaults (admin-managed templates)
CREATE TABLE public.training_module_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL,
  audience public.training_audience NOT NULL DEFAULT 'both',
  module_title text NOT NULL,
  default_offset_days integer NOT NULL DEFAULT 30,
  reminder_offsets_days integer[] NOT NULL DEFAULT ARRAY[7, 1]::integer[],
  coordinator_name text,
  coordinator_email text,
  coordinator_role text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, audience)
);

-- Per-user follow-up instances
CREATE TABLE public.training_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid,
  module_id text NOT NULL,
  module_title text NOT NULL,
  audience public.training_audience NOT NULL DEFAULT 'both',
  due_date date NOT NULL,
  reminder_offsets_days integer[] NOT NULL DEFAULT ARRAY[7, 1]::integer[],
  status public.training_followup_status NOT NULL DEFAULT 'pending',
  coordinator_name text,
  coordinator_email text,
  notes text,
  completed_at timestamptz,
  last_reminder_sent_at timestamptz,
  reminder_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX idx_training_followups_user ON public.training_followups (user_id);
CREATE INDEX idx_training_followups_due ON public.training_followups (due_date) WHERE status = 'pending';

ALTER TABLE public.training_module_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_followups ENABLE ROW LEVEL SECURITY;

-- Defaults: anyone with hr.training.view can read; training-admins (assign perm) can manage
CREATE POLICY "View training defaults"
  ON public.training_module_defaults FOR SELECT
  USING (has_permission(auth.uid(), 'hr.training.view') OR auth.uid() IS NOT NULL);

CREATE POLICY "Manage training defaults"
  ON public.training_module_defaults FOR ALL
  USING (has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign'));

-- Followups: user can view+update own; training admins can manage all
CREATE POLICY "View own or all followups"
  ON public.training_followups FOR SELECT
  USING (auth.uid() = user_id OR has_permission(auth.uid(), 'hr.training.view'));

CREATE POLICY "Insert followups (admin)"
  ON public.training_followups FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'hr.training.assign') OR auth.uid() = user_id);

CREATE POLICY "Update own or admin"
  ON public.training_followups FOR UPDATE
  USING (auth.uid() = user_id OR has_permission(auth.uid(), 'hr.training.assign'))
  WITH CHECK (auth.uid() = user_id OR has_permission(auth.uid(), 'hr.training.assign'));

CREATE POLICY "Delete followups (admin)"
  ON public.training_followups FOR DELETE
  USING (has_permission(auth.uid(), 'hr.training.assign'));

-- Updated_at triggers
CREATE TRIGGER trg_training_defaults_touch
  BEFORE UPDATE ON public.training_module_defaults
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_training_followups_touch
  BEFORE UPDATE ON public.training_followups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();