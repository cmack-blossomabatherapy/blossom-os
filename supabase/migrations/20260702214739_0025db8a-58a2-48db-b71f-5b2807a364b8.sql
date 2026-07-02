
-- ============================================================================
-- Case Manager workflow tables
-- ============================================================================

CREATE TABLE public.case_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID NOT NULL,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  centralreach_client_id TEXT,
  centralreach_patient_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  centralreach_last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_assignments TO authenticated;
GRANT ALL ON public.case_manager_assignments TO service_role;
ALTER TABLE public.case_manager_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  note_type TEXT NOT NULL DEFAULT 'parent_concern',
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  owner_user_id UUID,
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  linked_service_issue_id UUID,
  linked_escalation_id UUID,
  centralreach_client_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_notes TO authenticated;
GRANT ALL ON public.case_manager_notes TO service_role;
ALTER TABLE public.case_manager_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID,
  assigned_to_user_id UUID,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  category TEXT NOT NULL DEFAULT 'parent_contact',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_note TEXT,
  recurring_cadence TEXT,
  linked_service_issue_id UUID,
  linked_escalation_id UUID,
  centralreach_client_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_follow_ups TO authenticated;
GRANT ALL ON public.case_manager_follow_ups TO service_role;
ALTER TABLE public.case_manager_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  channel TEXT NOT NULL DEFAULT 'call',
  direction TEXT NOT NULL DEFAULT 'outbound',
  contact_name TEXT,
  subject TEXT,
  summary TEXT NOT NULL,
  outcome TEXT,
  sentiment TEXT,
  needs_followup BOOLEAN NOT NULL DEFAULT FALSE,
  followup_at TIMESTAMPTZ,
  linked_service_issue_id UUID,
  linked_escalation_id UUID,
  source_system TEXT DEFAULT 'blossom_os',
  centralreach_client_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_communications TO authenticated;
GRANT ALL ON public.case_manager_communications TO service_role;
ALTER TABLE public.case_manager_communications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_service_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  issue_type TEXT NOT NULL DEFAULT 'service_interruption',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  owner_department TEXT,
  assigned_owner_user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  parent_impact TEXT,
  action_plan TEXT,
  resolution_note TEXT,
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  linked_escalation_id UUID,
  centralreach_client_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_service_issues TO authenticated;
GRANT ALL ON public.case_manager_service_issues TO service_role;
ALTER TABLE public.case_manager_service_issues ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  escalation_type TEXT NOT NULL DEFAULT 'service',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  reason TEXT NOT NULL,
  summary TEXT,
  owner_department TEXT,
  assigned_owner_user_id UUID,
  escalated_to_role TEXT,
  parent_communication_needed BOOLEAN NOT NULL DEFAULT FALSE,
  sla_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  linked_service_issue_id UUID,
  updates JSONB NOT NULL DEFAULT '[]'::jsonb,
  centralreach_client_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_escalations TO authenticated;
GRANT ALL ON public.case_manager_escalations TO service_role;
ALTER TABLE public.case_manager_escalations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_manager_user_id UUID,
  client_id UUID,
  client_name TEXT,
  state TEXT,
  handoff_type TEXT NOT NULL DEFAULT 'scheduling',
  to_department TEXT NOT NULL,
  assigned_to_user_id UUID,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  request_note TEXT,
  response_note TEXT,
  resolved_at TIMESTAMPTZ,
  centralreach_client_id TEXT,
  centralreach_sync_status TEXT DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_handoffs TO authenticated;
GRANT ALL ON public.case_manager_handoffs TO service_role;
ALTER TABLE public.case_manager_handoffs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_manager_community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  notes TEXT,
  state TEXT,
  city TEXT,
  county TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_manager_community_resources TO authenticated;
GRANT ALL ON public.case_manager_community_resources TO service_role;
ALTER TABLE public.case_manager_community_resources ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_case_manager_for_client(_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.case_manager_assignments a
    WHERE a.client_id = _client_id
      AND a.case_manager_user_id = auth.uid()
      AND a.active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_case_manager()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'case_manager'::app_role)
      OR public.has_role(auth.uid(), 'director_of_operations'::app_role)
      OR public.has_role(auth.uid(), 'operations_manager'::app_role)
      OR public.has_role(auth.uid(), 'state_director'::app_role)
      OR public.has_role(auth.uid(), 'assistant_state_director'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.is_cm_oversight()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'director_of_operations'::app_role)
      OR public.has_role(auth.uid(), 'operations_manager'::app_role)
      OR public.has_role(auth.uid(), 'state_director'::app_role)
      OR public.has_role(auth.uid(), 'assistant_state_director'::app_role);
$$;

-- Indexes
CREATE INDEX idx_cm_assignments_user ON public.case_manager_assignments(case_manager_user_id) WHERE active;
CREATE INDEX idx_cm_assignments_client ON public.case_manager_assignments(client_id) WHERE active;
CREATE INDEX idx_cm_notes_client ON public.case_manager_notes(client_id);
CREATE INDEX idx_cm_notes_status ON public.case_manager_notes(status);
CREATE INDEX idx_cm_notes_user ON public.case_manager_notes(case_manager_user_id);
CREATE INDEX idx_cm_followups_client ON public.case_manager_follow_ups(client_id);
CREATE INDEX idx_cm_followups_due ON public.case_manager_follow_ups(due_at) WHERE status = 'open';
CREATE INDEX idx_cm_followups_user ON public.case_manager_follow_ups(case_manager_user_id);
CREATE INDEX idx_cm_comms_client ON public.case_manager_communications(client_id);
CREATE INDEX idx_cm_comms_occurred ON public.case_manager_communications(occurred_at DESC);
CREATE INDEX idx_cm_comms_followup ON public.case_manager_communications(followup_at) WHERE needs_followup;
CREATE INDEX idx_cm_issues_status ON public.case_manager_service_issues(status);
CREATE INDEX idx_cm_issues_client ON public.case_manager_service_issues(client_id);
CREATE INDEX idx_cm_esc_status ON public.case_manager_escalations(status);
CREATE INDEX idx_cm_esc_client ON public.case_manager_escalations(client_id);
CREATE INDEX idx_cm_handoffs_status ON public.case_manager_handoffs(status);
CREATE INDEX idx_cm_handoffs_client ON public.case_manager_handoffs(client_id);
CREATE INDEX idx_cm_community_state ON public.case_manager_community_resources(state);
CREATE INDEX idx_cm_community_category ON public.case_manager_community_resources(category);

-- Policies
CREATE POLICY "cm_assignments_admin_all" ON public.case_manager_assignments
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_assignments_self_select" ON public.case_manager_assignments
  FOR SELECT TO authenticated USING (case_manager_user_id = auth.uid());

CREATE POLICY "cm_notes_admin_all" ON public.case_manager_notes
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_notes_cm_select" ON public.case_manager_notes
  FOR SELECT TO authenticated USING (
    case_manager_user_id = auth.uid() OR created_by = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
  );
CREATE POLICY "cm_notes_cm_write" ON public.case_manager_notes
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_notes_cm_update" ON public.case_manager_notes
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR case_manager_user_id = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
  );

CREATE POLICY "cm_followups_admin_all" ON public.case_manager_follow_ups
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_followups_select" ON public.case_manager_follow_ups
  FOR SELECT TO authenticated USING (
    case_manager_user_id = auth.uid() OR assigned_to_user_id = auth.uid() OR created_by = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
  );
CREATE POLICY "cm_followups_insert" ON public.case_manager_follow_ups
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_followups_update" ON public.case_manager_follow_ups
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR case_manager_user_id = auth.uid() OR assigned_to_user_id = auth.uid()
  );

CREATE POLICY "cm_comms_admin_all" ON public.case_manager_communications
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_comms_select" ON public.case_manager_communications
  FOR SELECT TO authenticated USING (
    case_manager_user_id = auth.uid() OR created_by = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
  );
CREATE POLICY "cm_comms_insert" ON public.case_manager_communications
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_comms_update" ON public.case_manager_communications
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR case_manager_user_id = auth.uid()
  );

CREATE POLICY "cm_issues_admin_all" ON public.case_manager_service_issues
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_issues_select" ON public.case_manager_service_issues
  FOR SELECT TO authenticated USING (
    case_manager_user_id = auth.uid() OR assigned_owner_user_id = auth.uid() OR created_by = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
  );
CREATE POLICY "cm_issues_insert" ON public.case_manager_service_issues
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_issues_update" ON public.case_manager_service_issues
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR case_manager_user_id = auth.uid() OR assigned_owner_user_id = auth.uid()
  );

CREATE POLICY "cm_esc_admin_all" ON public.case_manager_escalations
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_esc_select" ON public.case_manager_escalations
  FOR SELECT TO authenticated USING (
    case_manager_user_id = auth.uid() OR assigned_owner_user_id = auth.uid() OR created_by = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
    OR public.has_role(auth.uid(), 'qa'::app_role)
  );
CREATE POLICY "cm_esc_insert" ON public.case_manager_escalations
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_esc_update" ON public.case_manager_escalations
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR case_manager_user_id = auth.uid() OR assigned_owner_user_id = auth.uid()
  );

CREATE POLICY "cm_handoffs_admin_all" ON public.case_manager_handoffs
  FOR ALL TO authenticated USING (public.is_cm_oversight()) WITH CHECK (public.is_cm_oversight());
CREATE POLICY "cm_handoffs_select" ON public.case_manager_handoffs
  FOR SELECT TO authenticated USING (
    case_manager_user_id = auth.uid() OR assigned_to_user_id = auth.uid() OR created_by = auth.uid()
    OR (client_id IS NOT NULL AND public.is_case_manager_for_client(client_id))
    OR public.has_role(auth.uid(), 'scheduling'::app_role)
    OR public.has_role(auth.uid(), 'staffing'::app_role)
    OR public.has_role(auth.uid(), 'authorization_manager'::app_role)
    OR public.has_role(auth.uid(), 'authorization_coordinator'::app_role)
  );
CREATE POLICY "cm_handoffs_insert" ON public.case_manager_handoffs
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_handoffs_update" ON public.case_manager_handoffs
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR case_manager_user_id = auth.uid() OR assigned_to_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'scheduling'::app_role)
    OR public.has_role(auth.uid(), 'staffing'::app_role)
    OR public.has_role(auth.uid(), 'authorization_manager'::app_role)
    OR public.has_role(auth.uid(), 'authorization_coordinator'::app_role)
  );

CREATE POLICY "cm_community_select_all" ON public.case_manager_community_resources
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "cm_community_write" ON public.case_manager_community_resources
  FOR INSERT TO authenticated WITH CHECK (public.is_active_case_manager());
CREATE POLICY "cm_community_update" ON public.case_manager_community_resources
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR public.is_active_case_manager()
  );
CREATE POLICY "cm_community_delete" ON public.case_manager_community_resources
  FOR DELETE TO authenticated USING (public.is_cm_oversight());

-- updated_at triggers
CREATE TRIGGER trg_cm_assignments_updated_at BEFORE UPDATE ON public.case_manager_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_notes_updated_at BEFORE UPDATE ON public.case_manager_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_followups_updated_at BEFORE UPDATE ON public.case_manager_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_comms_updated_at BEFORE UPDATE ON public.case_manager_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_issues_updated_at BEFORE UPDATE ON public.case_manager_service_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_esc_updated_at BEFORE UPDATE ON public.case_manager_escalations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_handoffs_updated_at BEFORE UPDATE ON public.case_manager_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cm_community_updated_at BEFORE UPDATE ON public.case_manager_community_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
