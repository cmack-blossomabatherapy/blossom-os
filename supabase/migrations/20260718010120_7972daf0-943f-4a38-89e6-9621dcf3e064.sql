
CREATE TABLE IF NOT EXISTS public.bcba_parent_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_identifier TEXT NOT NULL,
  assigned_bcba_id UUID,
  assigned_bcba_name TEXT,
  payer TEXT,
  state TEXT,

  required_frequency TEXT NOT NULL DEFAULT 'monthly',
  required_per_month INT NOT NULL DEFAULT 1,

  scheduled_sessions INT NOT NULL DEFAULT 0,
  completed_sessions INT NOT NULL DEFAULT 0,
  cancelled_sessions INT NOT NULL DEFAULT 0,
  reschedule_needed BOOLEAN NOT NULL DEFAULT false,
  documentation_pending BOOLEAN NOT NULL DEFAULT false,

  last_completed_date DATE,
  next_scheduled_date DATE,
  barrier TEXT,

  status TEXT NOT NULL DEFAULT 'on_track',

  centralreach_url TEXT,
  centralreach_source_date TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,

  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bcba_pt_status_check CHECK (status IN (
    'on_track','due_soon','overdue','repeated_cancellations',
    'family_barrier','scheduling_help_needed','documentation_pending'
  )),
  CONSTRAINT bcba_pt_freq_check CHECK (required_frequency IN ('weekly','biweekly','monthly','quarterly','custom'))
);
CREATE INDEX IF NOT EXISTS bcba_pt_bcba_idx ON public.bcba_parent_training_records(assigned_bcba_id);
CREATE INDEX IF NOT EXISTS bcba_pt_status_idx ON public.bcba_parent_training_records(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_parent_training_records TO authenticated;
GRANT ALL ON public.bcba_parent_training_records TO service_role;
ALTER TABLE public.bcba_parent_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pt_select" ON public.bcba_parent_training_records FOR SELECT TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling'::public.app_role)
);
CREATE POLICY "bcba_pt_insert" ON public.bcba_parent_training_records FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'bcba'::public.app_role)
);
CREATE POLICY "bcba_pt_update" ON public.bcba_parent_training_records FOR UPDATE TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
);
CREATE POLICY "bcba_pt_delete" ON public.bcba_parent_training_records FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_parent_training_support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.bcba_parent_training_records(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  detail TEXT,
  requested_by_id UUID,
  requested_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  task_id UUID REFERENCES public.user_tasks(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_pt_support_category_check CHECK (category IN (
    'schedule_followup','family_barrier','scheduling_support','outreach_complete','centralreach_link','operational_note','other'
  )),
  CONSTRAINT bcba_pt_support_status_check CHECK (status IN ('open','in_progress','resolved','cancelled'))
);
CREATE INDEX IF NOT EXISTS bcba_pt_support_record_idx ON public.bcba_parent_training_support_requests(record_id);

GRANT SELECT, INSERT, UPDATE ON public.bcba_parent_training_support_requests TO authenticated;
GRANT ALL ON public.bcba_parent_training_support_requests TO service_role;
ALTER TABLE public.bcba_parent_training_support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pt_support_select" ON public.bcba_parent_training_support_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_parent_training_records r WHERE r.id = record_id AND (
    r.assigned_bcba_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'state_director'::public.app_role)
    OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
    OR public.has_role(auth.uid(), 'scheduling'::public.app_role)
  ))
);
CREATE POLICY "bcba_pt_support_insert" ON public.bcba_parent_training_support_requests FOR INSERT TO authenticated WITH CHECK (
  requested_by_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "bcba_pt_support_update" ON public.bcba_parent_training_support_requests FOR UPDATE TO authenticated USING (
  requested_by_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_parent_training_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.bcba_parent_training_records(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_pt_activity_idx ON public.bcba_parent_training_activity(record_id, created_at DESC);

GRANT SELECT, INSERT ON public.bcba_parent_training_activity TO authenticated;
GRANT ALL ON public.bcba_parent_training_activity TO service_role;
ALTER TABLE public.bcba_parent_training_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_pt_activity_select" ON public.bcba_parent_training_activity FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.bcba_parent_training_records r WHERE r.id = record_id AND (
    r.assigned_bcba_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
    OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
    OR public.has_role(auth.uid(), 'qa'::public.app_role)
    OR public.has_role(auth.uid(), 'state_director'::public.app_role)
    OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
  ))
);
CREATE POLICY "bcba_pt_activity_insert" ON public.bcba_parent_training_activity FOR INSERT TO authenticated WITH CHECK (
  actor_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Service utilization (per client per period)
CREATE TABLE IF NOT EXISTS public.bcba_service_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_identifier TEXT NOT NULL,
  assigned_bcba_id UUID,
  assigned_bcba_name TEXT,
  payer TEXT,
  state TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  authorized_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  scheduled_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivered_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  cancelled_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  remaining_hours NUMERIC(10,2) GENERATED ALWAYS AS (authorized_hours - delivered_hours) STORED,

  utilization_trend TEXT NOT NULL DEFAULT 'steady',
  underutilization_risk TEXT NOT NULL DEFAULT 'none',
  staffing_gap_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  family_cancellation_pattern TEXT NOT NULL DEFAULT 'none',
  provider_cancellation_pattern TEXT NOT NULL DEFAULT 'none',
  contributing_factors JSONB DEFAULT '[]'::jsonb,

  centralreach_source_date TIMESTAMPTZ,
  centralreach_url TEXT,
  data_freshness_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_util_trend_check CHECK (utilization_trend IN ('improving','steady','declining','volatile')),
  CONSTRAINT bcba_util_risk_check CHECK (underutilization_risk IN ('none','watch','elevated','critical')),
  CONSTRAINT bcba_util_family_check CHECK (family_cancellation_pattern IN ('none','occasional','frequent','chronic')),
  CONSTRAINT bcba_util_provider_check CHECK (provider_cancellation_pattern IN ('none','occasional','frequent','chronic'))
);
CREATE INDEX IF NOT EXISTS bcba_util_bcba_idx ON public.bcba_service_utilization(assigned_bcba_id);
CREATE INDEX IF NOT EXISTS bcba_util_risk_idx ON public.bcba_service_utilization(underutilization_risk);
CREATE INDEX IF NOT EXISTS bcba_util_period_idx ON public.bcba_service_utilization(period_start, period_end);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_service_utilization TO authenticated;
GRANT ALL ON public.bcba_service_utilization TO service_role;
ALTER TABLE public.bcba_service_utilization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_util_select" ON public.bcba_service_utilization FOR SELECT TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling'::public.app_role)
  OR public.has_role(auth.uid(), 'auth_team'::public.app_role)
  OR public.has_role(auth.uid(), 'authorization_manager'::public.app_role)
);
CREATE POLICY "bcba_util_insert" ON public.bcba_service_utilization FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_util_update" ON public.bcba_service_utilization FOR UPDATE TO authenticated USING (
  assigned_bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_util_delete" ON public.bcba_service_utilization FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- touch triggers (reuse bcba_pr_touch_updated_at from prior migration)
DROP TRIGGER IF EXISTS bcba_pt_touch ON public.bcba_parent_training_records;
CREATE TRIGGER bcba_pt_touch BEFORE UPDATE ON public.bcba_parent_training_records
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS bcba_pt_support_touch ON public.bcba_parent_training_support_requests;
CREATE TRIGGER bcba_pt_support_touch BEFORE UPDATE ON public.bcba_parent_training_support_requests
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();
DROP TRIGGER IF EXISTS bcba_util_touch ON public.bcba_service_utilization;
CREATE TRIGGER bcba_util_touch BEFORE UPDATE ON public.bcba_service_utilization
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

-- Log status changes on parent-training records
CREATE OR REPLACE FUNCTION public.bcba_pt_log_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bcba_parent_training_activity(record_id, event_type, actor_id, message)
    VALUES (NEW.id, 'created', auth.uid(), 'Parent training record created');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.bcba_parent_training_activity(record_id, event_type, actor_id, message)
    VALUES (NEW.id, 'status_change', auth.uid(),
            'Status: ' || OLD.status || ' → ' || NEW.status);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bcba_pt_status_trg ON public.bcba_parent_training_records;
CREATE TRIGGER bcba_pt_status_trg
BEFORE INSERT OR UPDATE ON public.bcba_parent_training_records
FOR EACH ROW EXECUTE FUNCTION public.bcba_pt_log_status();
