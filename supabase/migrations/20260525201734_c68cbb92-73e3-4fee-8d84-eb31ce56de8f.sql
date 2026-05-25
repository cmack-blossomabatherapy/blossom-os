
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.recruiting_role AS ENUM ('RBT', 'BCBA', 'BT', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.recruiting_state AS ENUM ('GA','NC','TN','VA','MD','FL','TX','SC','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.recruiting_pipeline_stage AS ENUM (
    'New Applicant','Phone Screen','Interview Scheduled','Interview Complete',
    'Offer Sent','Offer Accepted','Background Check','Orientation Scheduled',
    'Onboarding','Ready to Staff','Staffed','Withdrawn','Rejected','On Hold'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ HELPER ============
CREATE OR REPLACE FUNCTION public.recruiting_can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id,'admin')
    OR public.has_role(_user_id,'ops_manager')
    OR public.has_role(_user_id,'hr_admin')
    OR public.has_role(_user_id,'hr_manager')
    OR public.has_role(_user_id,'hr')
    OR public.has_role(_user_id,'recruiting_assistant')
    OR public.has_role(_user_id,'staff')
$$;

-- ============ CANDIDATES ============
CREATE TABLE IF NOT EXISTS public.recruiting_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  role public.recruiting_role NOT NULL DEFAULT 'RBT',
  state public.recruiting_state NOT NULL DEFAULT 'GA',
  city text,
  pipeline_stage public.recruiting_pipeline_stage NOT NULL DEFAULT 'New Applicant',
  source text,
  recruiter text,
  recruiter_user_id uuid,
  applied_date date NOT NULL DEFAULT CURRENT_DATE,
  stage_entered_at timestamptz NOT NULL DEFAULT now(),
  next_action text,
  next_action_due date,
  resume_url text,
  notes text,
  tags text[] DEFAULT '{}',
  rating int CHECK (rating BETWEEN 0 AND 5),
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rc_stage ON public.recruiting_candidates(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_rc_state ON public.recruiting_candidates(state);
CREATE INDEX IF NOT EXISTS idx_rc_role  ON public.recruiting_candidates(role);

ALTER TABLE public.recruiting_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View candidates" ON public.recruiting_candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert candidates" ON public.recruiting_candidates FOR INSERT TO authenticated WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE POLICY "Update candidates" ON public.recruiting_candidates FOR UPDATE TO authenticated USING (public.recruiting_can_write(auth.uid()));
CREATE POLICY "Delete candidates" ON public.recruiting_candidates FOR DELETE TO authenticated USING (public.recruiting_can_write(auth.uid()));

CREATE TRIGGER trg_rc_updated_at BEFORE UPDATE ON public.recruiting_candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Track stage_entered_at
CREATE OR REPLACE FUNCTION public.recruiting_track_stage_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    NEW.stage_entered_at = now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_rc_stage_change BEFORE UPDATE ON public.recruiting_candidates
  FOR EACH ROW EXECUTE FUNCTION public.recruiting_track_stage_change();

-- ============ INTERVIEWS ============
CREATE TABLE IF NOT EXISTS public.recruiting_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  interview_type text NOT NULL DEFAULT 'Phone Screen',
  scheduled_at timestamptz,
  completed_at timestamptz,
  panel text,
  outcome text,
  notes text,
  status text NOT NULL DEFAULT 'Scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ri_candidate ON public.recruiting_interviews(candidate_id);
ALTER TABLE public.recruiting_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View interviews" ON public.recruiting_interviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write interviews" ON public.recruiting_interviews FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_ri_updated_at BEFORE UPDATE ON public.recruiting_interviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ OFFERS ============
CREATE TABLE IF NOT EXISTS public.recruiting_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending',
  hourly_rate numeric(8,2),
  hours_per_week int,
  start_date date,
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ro_candidate ON public.recruiting_offers(candidate_id);
ALTER TABLE public.recruiting_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View offers" ON public.recruiting_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write offers" ON public.recruiting_offers FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_ro_updated_at BEFORE UPDATE ON public.recruiting_offers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ BACKGROUND CHECKS ============
CREATE TABLE IF NOT EXISTS public.recruiting_background_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  vendor text DEFAULT 'Checkr',
  status text NOT NULL DEFAULT 'Not Started',
  initiated_at timestamptz,
  cleared_at timestamptz,
  blocker text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rbc_candidate ON public.recruiting_background_checks(candidate_id);
ALTER TABLE public.recruiting_background_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View bg" ON public.recruiting_background_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write bg" ON public.recruiting_background_checks FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_rbc_updated_at BEFORE UPDATE ON public.recruiting_background_checks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ORIENTATION SLOTS ============
CREATE TABLE IF NOT EXISTS public.recruiting_orientation_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  scheduled_date date,
  scheduled_time text,
  format text DEFAULT 'Virtual',
  status text NOT NULL DEFAULT 'Scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ros_candidate ON public.recruiting_orientation_slots(candidate_id);
ALTER TABLE public.recruiting_orientation_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View orient" ON public.recruiting_orientation_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write orient" ON public.recruiting_orientation_slots FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_ros_updated_at BEFORE UPDATE ON public.recruiting_orientation_slots FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ONBOARDING TASKS (recruiting-scoped) ============
CREATE TABLE IF NOT EXISTS public.recruiting_onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  title text NOT NULL,
  category text DEFAULT 'Paperwork',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  due_date date,
  position int DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, task_key)
);
CREATE INDEX IF NOT EXISTS idx_rot_candidate ON public.recruiting_onboarding_tasks(candidate_id);
ALTER TABLE public.recruiting_onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View onb tasks" ON public.recruiting_onboarding_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write onb tasks" ON public.recruiting_onboarding_tasks FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_rot_updated_at BEFORE UPDATE ON public.recruiting_onboarding_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STAFFING NEEDS ============
CREATE TABLE IF NOT EXISTS public.recruiting_staffing_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_label text NOT NULL,
  state public.recruiting_state NOT NULL DEFAULT 'GA',
  role_needed public.recruiting_role NOT NULL DEFAULT 'RBT',
  hours_per_week int,
  status text NOT NULL DEFAULT 'Open',
  priority text DEFAULT 'Normal',
  matched_candidate_id uuid REFERENCES public.recruiting_candidates(id) ON DELETE SET NULL,
  opened_at date NOT NULL DEFAULT CURRENT_DATE,
  filled_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recruiting_staffing_needs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View staff needs" ON public.recruiting_staffing_needs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write staff needs" ON public.recruiting_staffing_needs FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_rsn_updated_at BEFORE UPDATE ON public.recruiting_staffing_needs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ FOLLOW-UPS ============
CREATE TABLE IF NOT EXISTS public.recruiting_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text DEFAULT 'General',
  owner text,
  due_date date,
  status text NOT NULL DEFAULT 'Open',
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rfu_candidate ON public.recruiting_followups(candidate_id);
ALTER TABLE public.recruiting_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View followups" ON public.recruiting_followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write followups" ON public.recruiting_followups FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_rfu_updated_at BEFORE UPDATE ON public.recruiting_followups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ESCALATIONS ============
CREATE TABLE IF NOT EXISTS public.recruiting_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  title text NOT NULL,
  reason text,
  severity text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  owner text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_re_candidate ON public.recruiting_escalations(candidate_id);
ALTER TABLE public.recruiting_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View esc" ON public.recruiting_escalations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write esc" ON public.recruiting_escalations FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));
CREATE TRIGGER trg_re_updated_at BEFORE UPDATE ON public.recruiting_escalations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS public.recruiting_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.recruiting_candidates(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound',
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sender text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rm_candidate ON public.recruiting_messages(candidate_id);
ALTER TABLE public.recruiting_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View msgs" ON public.recruiting_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write msgs" ON public.recruiting_messages FOR ALL TO authenticated USING (public.recruiting_can_write(auth.uid())) WITH CHECK (public.recruiting_can_write(auth.uid()));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_interviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_background_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_orientation_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_onboarding_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_staffing_needs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_followups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_escalations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiting_messages;
