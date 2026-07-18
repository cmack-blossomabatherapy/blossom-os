
CREATE TABLE IF NOT EXISTS public.bcba_support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bcba_id UUID NOT NULL,
  bcba_name TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  detail TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal',
  state TEXT,
  clinic TEXT,
  client_ref TEXT,
  rbt_ref TEXT,
  owner_id UUID,
  owner_name TEXT,
  owner_team TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  sla_hours INT NOT NULL DEFAULT 48,
  due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  contains_client_details BOOLEAN NOT NULL DEFAULT false,
  task_id UUID REFERENCES public.user_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_sr_urgency_check CHECK (urgency IN ('low','normal','high','urgent')),
  CONSTRAINT bcba_sr_status_check CHECK (status IN ('open','routed','in_progress','waiting_on_bcba','resolved','closed','escalated')),
  CONSTRAINT bcba_sr_category_check CHECK (category IN (
    'authorization','progress_report','qa','scheduling','staffing','rbt_performance',
    'parent_caregiver','centralreach','billing','assessment','clinical_leadership',
    'safety','credentialing','fellowship','other'
  ))
);
CREATE INDEX IF NOT EXISTS bcba_sr_bcba_idx ON public.bcba_support_requests(bcba_id);
CREATE INDEX IF NOT EXISTS bcba_sr_owner_idx ON public.bcba_support_requests(owner_id);
CREATE INDEX IF NOT EXISTS bcba_sr_status_idx ON public.bcba_support_requests(status);
CREATE INDEX IF NOT EXISTS bcba_sr_category_idx ON public.bcba_support_requests(category);

GRANT SELECT, INSERT, UPDATE ON public.bcba_support_requests TO authenticated;
GRANT ALL ON public.bcba_support_requests TO service_role;
ALTER TABLE public.bcba_support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_sr_select" ON public.bcba_support_requests FOR SELECT TO authenticated USING (
  bcba_id = auth.uid()
  OR owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
  OR public.has_role(auth.uid(), 'qa'::public.app_role)
  OR public.has_role(auth.uid(), 'qa_director'::public.app_role)
  OR public.has_role(auth.uid(), 'state_director'::public.app_role)
  OR public.has_role(auth.uid(), 'scheduling_lead'::public.app_role)
);
CREATE POLICY "bcba_sr_insert" ON public.bcba_support_requests FOR INSERT TO authenticated WITH CHECK (
  bcba_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "bcba_sr_update" ON public.bcba_support_requests FOR UPDATE TO authenticated USING (
  bcba_id = auth.uid()
  OR owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_support_request_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.bcba_support_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'comment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_sru_type_check CHECK (update_type IN ('comment','status_change','routing','resolution','escalation','system'))
);
CREATE INDEX IF NOT EXISTS bcba_sru_req_idx ON public.bcba_support_request_updates(request_id);

GRANT SELECT, INSERT ON public.bcba_support_request_updates TO authenticated;
GRANT ALL ON public.bcba_support_request_updates TO service_role;
ALTER TABLE public.bcba_support_request_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_sru_select" ON public.bcba_support_request_updates FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.bcba_support_requests r
    WHERE r.id = bcba_support_request_updates.request_id
      AND (
        r.bcba_id = auth.uid()
        OR r.owner_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
        OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
        OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
        OR public.has_role(auth.uid(), 'qa'::public.app_role)
        OR public.has_role(auth.uid(), 'state_director'::public.app_role)
      )
  )
);
CREATE POLICY "bcba_sru_insert" ON public.bcba_support_request_updates FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.bcba_support_requests r
    WHERE r.id = bcba_support_request_updates.request_id
      AND (
        r.bcba_id = auth.uid()
        OR r.owner_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
        OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
        OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
        OR public.has_role(auth.uid(), 'qa'::public.app_role)
        OR public.has_role(auth.uid(), 'state_director'::public.app_role)
      )
  )
);

CREATE TABLE IF NOT EXISTS public.bcba_support_request_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.bcba_support_requests(id) ON DELETE CASCADE,
  changed_by UUID,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_sra_req_idx ON public.bcba_support_request_audit(request_id);

GRANT SELECT, INSERT ON public.bcba_support_request_audit TO authenticated;
GRANT ALL ON public.bcba_support_request_audit TO service_role;
ALTER TABLE public.bcba_support_request_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_sra_select" ON public.bcba_support_request_audit FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.bcba_support_requests r
    WHERE r.id = bcba_support_request_audit.request_id
      AND (
        r.bcba_id = auth.uid()
        OR r.owner_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
        OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
        OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
      )
  )
);
CREATE POLICY "bcba_sra_insert" ON public.bcba_support_request_audit FOR INSERT TO authenticated WITH CHECK (
  changed_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_support_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  team TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  slack_handle TEXT,
  states TEXT[] NOT NULL DEFAULT '{}',
  clinics TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  friendly_role TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bcba_sc_team_idx ON public.bcba_support_contacts(team);

GRANT SELECT ON public.bcba_support_contacts TO authenticated;
GRANT ALL ON public.bcba_support_contacts TO service_role;
ALTER TABLE public.bcba_support_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_sc_select" ON public.bcba_support_contacts FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "bcba_sc_insert" ON public.bcba_support_contacts FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_sc_update" ON public.bcba_support_contacts FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.bcba_academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section_key TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_pct INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bcba_ap_status_check CHECK (status IN ('not_started','in_progress','completed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS bcba_ap_user_section_idx ON public.bcba_academy_progress(user_id, section_key);

GRANT SELECT, INSERT, UPDATE ON public.bcba_academy_progress TO authenticated;
GRANT ALL ON public.bcba_academy_progress TO service_role;
ALTER TABLE public.bcba_academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bcba_ap_select" ON public.bcba_academy_progress FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'clinical_director'::public.app_role)
  OR public.has_role(auth.uid(), 'operations_leadership'::public.app_role)
);
CREATE POLICY "bcba_ap_upsert" ON public.bcba_academy_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bcba_ap_update" ON public.bcba_academy_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- touch triggers (reuse bcba_pr_touch_updated_at from earlier migrations)
DROP TRIGGER IF EXISTS bcba_sr_touch ON public.bcba_support_requests;
CREATE TRIGGER bcba_sr_touch BEFORE UPDATE ON public.bcba_support_requests
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

DROP TRIGGER IF EXISTS bcba_sc_touch ON public.bcba_support_contacts;
CREATE TRIGGER bcba_sc_touch BEFORE UPDATE ON public.bcba_support_contacts
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

DROP TRIGGER IF EXISTS bcba_ap_touch ON public.bcba_academy_progress;
CREATE TRIGGER bcba_ap_touch BEFORE UPDATE ON public.bcba_academy_progress
FOR EACH ROW EXECUTE FUNCTION public.bcba_pr_touch_updated_at();

-- Auto-set due_at from sla_hours on insert if missing
CREATE OR REPLACE FUNCTION public.bcba_sr_set_due()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.due_at IS NULL AND NEW.sla_hours IS NOT NULL THEN
    NEW.due_at := now() + (NEW.sla_hours || ' hours')::interval;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bcba_sr_set_due_trg ON public.bcba_support_requests;
CREATE TRIGGER bcba_sr_set_due_trg BEFORE INSERT ON public.bcba_support_requests
FOR EACH ROW EXECUTE FUNCTION public.bcba_sr_set_due();
