
-- BCBA Assessment & Treatment Plan workspace
-- Stores operational status and metadata only. No clinical narrative content.

CREATE TABLE IF NOT EXISTS public.bcba_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_identifier TEXT NOT NULL,
  assigned_bcba_id UUID,
  assigned_bcba_name TEXT,
  qa_reviewer_id UUID,
  qa_reviewer_name TEXT,
  owner_id UUID,
  owner_name TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'initial',
  status TEXT NOT NULL DEFAULT 'assigned',
  status_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessment_date DATE,
  due_date DATE,
  missing_item TEXT,
  next_action TEXT,
  authorization_id UUID REFERENCES public.client_authorizations(id) ON DELETE SET NULL,
  authorization_dependency TEXT,
  centralreach_client_url TEXT,
  centralreach_assessment_url TEXT,
  notes TEXT,
  on_hold_reason TEXT,
  cancelled_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_assessments_status_check CHECK (status IN (
    'assigned','parent_contact_needed','scheduled','completed',
    'treatment_plan_in_progress','parent_input_needed','parent_signature_needed',
    'submitted_to_qa','qa_changes_requested','resubmitted','ready_for_authorization',
    'completed_final','on_hold','cancelled'
  ))
);

CREATE INDEX IF NOT EXISTS bcba_assessments_bcba_idx ON public.bcba_assessments(assigned_bcba_id);
CREATE INDEX IF NOT EXISTS bcba_assessments_status_idx ON public.bcba_assessments(status);
CREATE INDEX IF NOT EXISTS bcba_assessments_client_idx ON public.bcba_assessments(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_assessments TO authenticated;
GRANT ALL ON public.bcba_assessments TO service_role;
ALTER TABLE public.bcba_assessments ENABLE ROW LEVEL SECURITY;

-- BCBAs see own; leadership/qa/admin see all
CREATE POLICY "bcba_assessments_select" ON public.bcba_assessments FOR SELECT TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR qa_reviewer_id = auth.uid()
  OR owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
);
CREATE POLICY "bcba_assessments_insert" ON public.bcba_assessments FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'bcba'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
);
CREATE POLICY "bcba_assessments_update" ON public.bcba_assessments FOR UPDATE TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR qa_reviewer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
);
CREATE POLICY "bcba_assessments_delete" ON public.bcba_assessments FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Treatment plans (operational tracker only — no clinical content)
CREATE TABLE IF NOT EXISTS public.bcba_treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.bcba_assessments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  status_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  drafted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_to_auth_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  centralreach_plan_url TEXT,
  parent_signature_url TEXT,
  next_action TEXT,
  owner_id UUID,
  owner_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_treatment_plans_status_check CHECK (status IN (
    'not_started','drafting','parent_input_needed','signature_needed','submitted',
    'qa_returned','correction_in_progress','resubmitted','approved',
    'sent_to_authorization','completed'
  ))
);
CREATE INDEX IF NOT EXISTS bcba_treatment_plans_assessment_idx ON public.bcba_treatment_plans(assessment_id);
CREATE INDEX IF NOT EXISTS bcba_treatment_plans_status_idx ON public.bcba_treatment_plans(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_treatment_plans TO authenticated;
GRANT ALL ON public.bcba_treatment_plans TO service_role;
ALTER TABLE public.bcba_treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_tp_select" ON public.bcba_treatment_plans FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND (
    a.assigned_bcba_id = auth.uid() OR a.qa_reviewer_id = auth.uid() OR a.owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  ))
);
CREATE POLICY "bcba_tp_write" ON public.bcba_treatment_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND (
    a.assigned_bcba_id = auth.uid() OR a.qa_reviewer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND (
    a.assigned_bcba_id = auth.uid() OR a.qa_reviewer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  ))
);

-- QA feedback loop
CREATE TABLE IF NOT EXISTS public.bcba_assessment_qa_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.bcba_assessments(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES public.bcba_treatment_plans(id) ON DELETE SET NULL,
  correction_category TEXT NOT NULL,
  reviewer_id UUID,
  reviewer_name TEXT,
  date_returned TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE,
  comment TEXT NOT NULL,
  supporting_link TEXT,
  supporting_file_url TEXT,
  resubmission_date TIMESTAMPTZ,
  resolution TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'open',
  is_repeat_issue BOOLEAN NOT NULL DEFAULT false,
  task_id UUID REFERENCES public.user_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_qa_feedback_status_check CHECK (resolution_status IN ('open','in_progress','resolved','waived'))
);
CREATE INDEX IF NOT EXISTS bcba_qa_feedback_assessment_idx ON public.bcba_assessment_qa_feedback(assessment_id);
CREATE INDEX IF NOT EXISTS bcba_qa_feedback_status_idx ON public.bcba_assessment_qa_feedback(resolution_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_assessment_qa_feedback TO authenticated;
GRANT ALL ON public.bcba_assessment_qa_feedback TO service_role;
ALTER TABLE public.bcba_assessment_qa_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_qa_feedback_select" ON public.bcba_assessment_qa_feedback FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND (
    a.assigned_bcba_id = auth.uid() OR a.qa_reviewer_id = auth.uid() OR a.owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  ))
);
CREATE POLICY "bcba_qa_feedback_write" ON public.bcba_assessment_qa_feedback FOR ALL TO authenticated USING (
  reviewer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND a.assigned_bcba_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
) WITH CHECK (
  reviewer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND a.assigned_bcba_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
);

-- Activity history
CREATE TABLE IF NOT EXISTS public.bcba_assessment_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.bcba_assessments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  actor_id UUID,
  actor_name TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_assessment_activity_assessment_idx ON public.bcba_assessment_activity(assessment_id, created_at DESC);

GRANT SELECT, INSERT ON public.bcba_assessment_activity TO authenticated;
GRANT ALL ON public.bcba_assessment_activity TO service_role;
ALTER TABLE public.bcba_assessment_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_assessment_activity_select" ON public.bcba_assessment_activity FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_assessments a WHERE a.id = assessment_id AND (
    a.assigned_bcba_id = auth.uid() OR a.qa_reviewer_id = auth.uid() OR a.owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  ))
);
CREATE POLICY "bcba_assessment_activity_insert" ON public.bcba_assessment_activity FOR INSERT TO authenticated WITH CHECK (
  actor_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.bcba_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS bcba_assessments_touch ON public.bcba_assessments;
CREATE TRIGGER bcba_assessments_touch BEFORE UPDATE ON public.bcba_assessments
FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();

DROP TRIGGER IF EXISTS bcba_treatment_plans_touch ON public.bcba_treatment_plans;
CREATE TRIGGER bcba_treatment_plans_touch BEFORE UPDATE ON public.bcba_treatment_plans
FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();

DROP TRIGGER IF EXISTS bcba_qa_feedback_touch ON public.bcba_assessment_qa_feedback;
CREATE TRIGGER bcba_qa_feedback_touch BEFORE UPDATE ON public.bcba_assessment_qa_feedback
FOR EACH ROW EXECUTE FUNCTION public.bcba_touch_updated_at();

-- Status change activity trigger + stage timing
CREATE OR REPLACE FUNCTION public.bcba_assessment_log_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bcba_assessment_activity(assessment_id, event_type, to_status, actor_id, message)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(), 'Assessment created');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_entered_at := now();
    INSERT INTO public.bcba_assessment_activity(assessment_id, event_type, from_status, to_status, actor_id, message)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, auth.uid(),
            'Status changed: ' || OLD.status || ' → ' || NEW.status);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bcba_assessment_status_trg ON public.bcba_assessments;
CREATE TRIGGER bcba_assessment_status_trg
BEFORE INSERT OR UPDATE ON public.bcba_assessments
FOR EACH ROW EXECUTE FUNCTION public.bcba_assessment_log_status();

-- Mark repeat issues automatically
CREATE OR REPLACE FUNCTION public.bcba_qa_feedback_flag_repeat()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE prior INT;
BEGIN
  SELECT COUNT(*) INTO prior
  FROM public.bcba_assessment_qa_feedback f
  JOIN public.bcba_assessments a ON a.id = f.assessment_id
  JOIN public.bcba_assessments a2 ON a2.assigned_bcba_id = a.assigned_bcba_id
  WHERE a2.id = NEW.assessment_id
    AND f.correction_category = NEW.correction_category
    AND f.id <> COALESCE(NEW.id, gen_random_uuid());
  IF prior > 0 THEN NEW.is_repeat_issue := true; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bcba_qa_feedback_repeat_trg ON public.bcba_assessment_qa_feedback;
CREATE TRIGGER bcba_qa_feedback_repeat_trg
BEFORE INSERT ON public.bcba_assessment_qa_feedback
FOR EACH ROW EXECUTE FUNCTION public.bcba_qa_feedback_flag_repeat();
