
-- 1. Stages (configurable)
CREATE TABLE IF NOT EXISTS public.bcba_fellowship_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_fellowship_stages TO authenticated;
GRANT ALL ON public.bcba_fellowship_stages TO service_role;
ALTER TABLE public.bcba_fellowship_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fs_select" ON public.bcba_fellowship_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "fs_write" ON public.bcba_fellowship_stages FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

-- Seed stage names only (no rules)
INSERT INTO public.bcba_fellowship_stages (key, label, display_order, is_terminal) VALUES
  ('interest',           'Interest',           10,  false),
  ('eligibility_review', 'Eligibility review', 20,  false),
  ('applicant',          'Applicant',          30,  false),
  ('accepted',           'Accepted',           40,  false),
  ('active',             'Active',             50,  false),
  ('paused',             'Paused',             60,  false),
  ('at_risk',            'At risk',            70,  false),
  ('completed',          'Completed',          80,  true),
  ('bcba_transition',    'BCBA transition',    90,  true),
  ('withdrawn',          'Withdrawn',         100,  true)
ON CONFLICT (key) DO NOTHING;

-- 2. Program content (admin-authored; empty by default)
CREATE TABLE IF NOT EXISTS public.bcba_fellowship_program_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bcba_fellowship_program_content TO authenticated;
GRANT ALL ON public.bcba_fellowship_program_content TO service_role;
ALTER TABLE public.bcba_fellowship_program_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fpc_select" ON public.bcba_fellowship_program_content FOR SELECT TO authenticated USING (
  is_published = true
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "fpc_write" ON public.bcba_fellowship_program_content FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

-- 3. Fellows
CREATE TABLE IF NOT EXISTS public.bcba_fellowship_fellows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT,
  state TEXT,
  clinic TEXT,
  stage_key TEXT NOT NULL DEFAULT 'interest',
  rbt_role_status TEXT,
  start_date DATE,
  target_completion_date DATE,
  coursework_status TEXT,
  fieldwork_status TEXT,
  restricted_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  unrestricted_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  supervision_status TEXT,
  monthly_documentation_status TEXT,
  next_meeting_at TIMESTAMPTZ,
  support_need TEXT,
  readiness_status TEXT,
  hours_last_source_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ff_stage_idx ON public.bcba_fellowship_fellows(stage_key);
CREATE INDEX IF NOT EXISTS ff_user_idx ON public.bcba_fellowship_fellows(user_id);
GRANT SELECT, INSERT, UPDATE ON public.bcba_fellowship_fellows TO authenticated;
GRANT ALL ON public.bcba_fellowship_fellows TO service_role;
ALTER TABLE public.bcba_fellowship_fellows ENABLE ROW LEVEL SECURITY;

-- 4. Assignments
CREATE TABLE IF NOT EXISTS public.bcba_fellowship_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fellow_id UUID NOT NULL REFERENCES public.bcba_fellowship_fellows(id) ON DELETE CASCADE,
  bcba_id UUID NOT NULL,
  bcba_name TEXT,
  role TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT fa_role_check CHECK (role IN (
    'fellowship_supervisor','mentor','fieldwork_reviewer',
    'skills_evaluator','program_advisor','transition_coach'
  ))
);
CREATE INDEX IF NOT EXISTS fa_fellow_idx ON public.bcba_fellowship_assignments(fellow_id);
CREATE INDEX IF NOT EXISTS fa_bcba_idx ON public.bcba_fellowship_assignments(bcba_id);
GRANT SELECT, INSERT, UPDATE ON public.bcba_fellowship_assignments TO authenticated;
GRANT ALL ON public.bcba_fellowship_assignments TO service_role;
ALTER TABLE public.bcba_fellowship_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Security-definer access check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_fellowship_access(_user_id UUID, _fellow_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bcba_fellowship_assignments a
    WHERE a.fellow_id = _fellow_id
      AND a.bcba_id = _user_id
      AND a.active = true
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_fellowship_access(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_fellowship_access(UUID, UUID) TO authenticated, service_role;

-- Fellow RLS: assigned supervisors/mentors + leadership + the fellow themselves
CREATE POLICY "ff_select" ON public.bcba_fellowship_fellows FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_fellowship_access(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "ff_insert" ON public.bcba_fellowship_fellows FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "ff_update" ON public.bcba_fellowship_fellows FOR UPDATE TO authenticated USING (
  public.has_fellowship_access(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

-- Assignment RLS
CREATE POLICY "fa_select" ON public.bcba_fellowship_assignments FOR SELECT TO authenticated USING (
  bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "fa_write" ON public.bcba_fellowship_assignments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

-- 6. Reviews (fellowship supervision workflows — distinct from RBT supervision)
CREATE TABLE IF NOT EXISTS public.bcba_fellowship_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fellow_id UUID NOT NULL REFERENCES public.bcba_fellowship_fellows(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewer_name TEXT,
  review_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  outcome_summary TEXT,
  next_steps TEXT,
  follow_up_date DATE,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fr_type_check CHECK (review_type IN (
    'monthly_review','fieldwork_review','unrestricted_activity_review',
    'coursework_checkin','development_feedback','mentor_meeting',
    'readiness_review','exam_prep_transition'
  )),
  CONSTRAINT fr_status_check CHECK (status IN ('scheduled','in_progress','completed','missed','cancelled'))
);
CREATE INDEX IF NOT EXISTS fr_fellow_idx ON public.bcba_fellowship_reviews(fellow_id);
CREATE INDEX IF NOT EXISTS fr_reviewer_idx ON public.bcba_fellowship_reviews(reviewer_id);
GRANT SELECT, INSERT, UPDATE ON public.bcba_fellowship_reviews TO authenticated;
GRANT ALL ON public.bcba_fellowship_reviews TO service_role;
ALTER TABLE public.bcba_fellowship_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fr_select" ON public.bcba_fellowship_reviews FOR SELECT TO authenticated USING (
  reviewer_id = auth.uid()
  OR public.has_fellowship_access(auth.uid(), fellow_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "fr_insert" ON public.bcba_fellowship_reviews FOR INSERT TO authenticated WITH CHECK (
  (reviewer_id = auth.uid() AND public.has_fellowship_access(auth.uid(), fellow_id))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "fr_update" ON public.bcba_fellowship_reviews FOR UPDATE TO authenticated USING (
  reviewer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

-- 7. Audit
CREATE TABLE IF NOT EXISTS public.bcba_fellowship_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  fellow_id UUID,
  changed_by UUID,
  changed_field TEXT,
  old_value TEXT,
  new_value TEXT,
  action TEXT NOT NULL DEFAULT 'update',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fau_fellow_idx ON public.bcba_fellowship_audit(fellow_id);
GRANT SELECT, INSERT ON public.bcba_fellowship_audit TO authenticated;
GRANT ALL ON public.bcba_fellowship_audit TO service_role;
ALTER TABLE public.bcba_fellowship_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fau_select" ON public.bcba_fellowship_audit FOR SELECT TO authenticated USING (
  (fellow_id IS NOT NULL AND public.has_fellowship_access(auth.uid(), fellow_id))
  OR changed_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "fau_insert" ON public.bcba_fellowship_audit FOR INSERT TO authenticated WITH CHECK (
  changed_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- 8. Auto-audit trigger for reviews (every insert/update logged)
CREATE OR REPLACE FUNCTION public.bcba_fellowship_review_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bcba_fellowship_audit(entity_table, entity_id, fellow_id, changed_by, action, new_value)
    VALUES ('bcba_fellowship_reviews', NEW.id, NEW.fellow_id, NEW.reviewer_id, 'create',
            format('type=%s status=%s', NEW.review_type, NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.bcba_fellowship_audit(entity_table, entity_id, fellow_id, changed_by, changed_field, old_value, new_value, action)
      VALUES ('bcba_fellowship_reviews', NEW.id, NEW.fellow_id, NEW.reviewer_id, 'status', OLD.status, NEW.status, 'update');
    END IF;
    IF NEW.outcome_summary IS DISTINCT FROM OLD.outcome_summary THEN
      INSERT INTO public.bcba_fellowship_audit(entity_table, entity_id, fellow_id, changed_by, changed_field, action)
      VALUES ('bcba_fellowship_reviews', NEW.id, NEW.fellow_id, NEW.reviewer_id, 'outcome_summary', 'update');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS fr_audit ON public.bcba_fellowship_reviews;
CREATE TRIGGER fr_audit AFTER INSERT OR UPDATE ON public.bcba_fellowship_reviews
FOR EACH ROW EXECUTE FUNCTION public.bcba_fellowship_review_audit();

-- 9. Touch triggers
DROP TRIGGER IF EXISTS fs_touch ON public.bcba_fellowship_stages;
CREATE TRIGGER fs_touch BEFORE UPDATE ON public.bcba_fellowship_stages
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS fpc_touch ON public.bcba_fellowship_program_content;
CREATE TRIGGER fpc_touch BEFORE UPDATE ON public.bcba_fellowship_program_content
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS ff_touch ON public.bcba_fellowship_fellows;
CREATE TRIGGER ff_touch BEFORE UPDATE ON public.bcba_fellowship_fellows
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS fr_touch ON public.bcba_fellowship_reviews;
CREATE TRIGGER fr_touch BEFORE UPDATE ON public.bcba_fellowship_reviews
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
