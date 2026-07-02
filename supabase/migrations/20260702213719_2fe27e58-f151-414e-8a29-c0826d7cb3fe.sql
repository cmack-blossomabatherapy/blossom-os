
-- Helper: does auth.uid() own this employee row?
CREATE OR REPLACE FUNCTION public.is_employee_self(_employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.employees e WHERE e.id = _employee_id AND e.user_id = auth.uid())
$$;

-- Helper: elevated oversight roles for RBT data
CREATE OR REPLACE FUNCTION public.can_oversee_rbt()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'bcba')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
    OR public.has_role(auth.uid(), 'state_director')
    OR public.has_role(auth.uid(), 'assistant_state_director')
    OR public.has_role(auth.uid(), 'clinic_director')
    OR public.has_role(auth.uid(), 'ops_manager')
    OR public.has_role(auth.uid(), 'operations_manager')
$$;

-- =========================================================================
-- rbt_client_assignments
-- =========================================================================
CREATE TABLE public.rbt_client_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rbt_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  client_id uuid,
  client_name text NOT NULL,
  state text,
  clinic text,
  assigned_bcba_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  case_manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  authorized_service_codes text[] DEFAULT '{}',
  safety_notes text,
  family_preferences text,
  schedule_summary text,
  start_date date,
  status text NOT NULL DEFAULT 'active',
  centralreach_client_id text,
  centralreach_payload jsonb,
  centralreach_sync_status text DEFAULT 'pending',
  centralreach_last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rbt_client_assignments_rbt_idx ON public.rbt_client_assignments(rbt_employee_id);
CREATE INDEX rbt_client_assignments_client_idx ON public.rbt_client_assignments(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_client_assignments TO authenticated;
GRANT ALL ON public.rbt_client_assignments TO service_role;
ALTER TABLE public.rbt_client_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_client_assignments_read" ON public.rbt_client_assignments
  FOR SELECT TO authenticated
  USING (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt());
CREATE POLICY "rbt_client_assignments_write_oversight" ON public.rbt_client_assignments
  FOR ALL TO authenticated
  USING (public.can_oversee_rbt())
  WITH CHECK (public.can_oversee_rbt());
CREATE TRIGGER rbt_client_assignments_updated_at
  BEFORE UPDATE ON public.rbt_client_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- rbt_sessions
-- =========================================================================
CREATE TABLE public.rbt_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rbt_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  client_id uuid,
  client_name text NOT NULL,
  bcba_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  service_code text,
  session_status text NOT NULL DEFAULT 'scheduled',
  attendance_status text,
  cancellation_reason text,
  confirmed_by_rbt_at timestamptz,
  acknowledged_by_rbt_at timestamptz,
  centralreach_session_id text,
  centralreach_payload jsonb,
  centralreach_sync_status text DEFAULT 'pending',
  centralreach_last_synced_at timestamptz,
  centralreach_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rbt_sessions_rbt_date_idx ON public.rbt_sessions(rbt_employee_id, session_date);
CREATE INDEX rbt_sessions_client_idx ON public.rbt_sessions(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_sessions TO authenticated;
GRANT ALL ON public.rbt_sessions TO service_role;
ALTER TABLE public.rbt_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_sessions_read" ON public.rbt_sessions
  FOR SELECT TO authenticated
  USING (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt());
CREATE POLICY "rbt_sessions_update_self" ON public.rbt_sessions
  FOR UPDATE TO authenticated
  USING (public.is_employee_self(rbt_employee_id))
  WITH CHECK (public.is_employee_self(rbt_employee_id));
CREATE POLICY "rbt_sessions_write_oversight" ON public.rbt_sessions
  FOR ALL TO authenticated
  USING (public.can_oversee_rbt())
  WITH CHECK (public.can_oversee_rbt());
CREATE TRIGGER rbt_sessions_updated_at
  BEFORE UPDATE ON public.rbt_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- rbt_session_support_logs
-- =========================================================================
CREATE TABLE public.rbt_session_support_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.rbt_sessions(id) ON DELETE SET NULL,
  rbt_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  client_id uuid,
  checklist_completed jsonb DEFAULT '{}'::jsonb,
  prep_notes text,
  issue_type text,
  issue_description text,
  escalation_level text DEFAULT 'normal',
  routed_to_role text,
  routed_to_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX rbt_session_support_logs_rbt_idx ON public.rbt_session_support_logs(rbt_employee_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_session_support_logs TO authenticated;
GRANT ALL ON public.rbt_session_support_logs TO service_role;
ALTER TABLE public.rbt_session_support_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_session_support_read" ON public.rbt_session_support_logs
  FOR SELECT TO authenticated
  USING (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt());
CREATE POLICY "rbt_session_support_insert_self" ON public.rbt_session_support_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_employee_self(rbt_employee_id));
CREATE POLICY "rbt_session_support_update_self" ON public.rbt_session_support_logs
  FOR UPDATE TO authenticated
  USING (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt())
  WITH CHECK (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt());
CREATE TRIGGER rbt_session_support_logs_updated_at
  BEFORE UPDATE ON public.rbt_session_support_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- rbt_supervision
-- =========================================================================
CREATE TABLE public.rbt_supervision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rbt_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  bcba_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  supervision_date date NOT NULL,
  supervision_type text,
  client_id uuid,
  notes text,
  feedback text,
  competency_area text,
  status text NOT NULL DEFAULT 'scheduled',
  signed_by_bcba_at timestamptz,
  acknowledged_by_rbt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rbt_supervision_rbt_idx ON public.rbt_supervision(rbt_employee_id, supervision_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_supervision TO authenticated;
GRANT ALL ON public.rbt_supervision TO service_role;
ALTER TABLE public.rbt_supervision ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_supervision_read" ON public.rbt_supervision
  FOR SELECT TO authenticated
  USING (
    public.is_employee_self(rbt_employee_id)
    OR public.is_employee_self(bcba_id)
    OR public.can_oversee_rbt()
  );
CREATE POLICY "rbt_supervision_update_self_ack" ON public.rbt_supervision
  FOR UPDATE TO authenticated
  USING (public.is_employee_self(rbt_employee_id))
  WITH CHECK (public.is_employee_self(rbt_employee_id));
CREATE POLICY "rbt_supervision_write_oversight" ON public.rbt_supervision
  FOR ALL TO authenticated
  USING (public.can_oversee_rbt() OR public.is_employee_self(bcba_id))
  WITH CHECK (public.can_oversee_rbt() OR public.is_employee_self(bcba_id));
CREATE TRIGGER rbt_supervision_updated_at
  BEFORE UPDATE ON public.rbt_supervision
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- rbt_messages
-- =========================================================================
CREATE TABLE public.rbt_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  sender_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  source_system text DEFAULT 'blossom_os',
  message_type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  related_client_id uuid,
  related_session_id uuid,
  related_training_module_id uuid,
  action_required boolean NOT NULL DEFAULT false,
  due_at timestamptz,
  read_at timestamptz,
  completed_at timestamptz,
  priority text DEFAULT 'normal',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rbt_messages_recipient_idx ON public.rbt_messages(recipient_employee_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_messages TO authenticated;
GRANT ALL ON public.rbt_messages TO service_role;
ALTER TABLE public.rbt_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_messages_read" ON public.rbt_messages
  FOR SELECT TO authenticated
  USING (public.is_employee_self(recipient_employee_id) OR public.can_oversee_rbt());
CREATE POLICY "rbt_messages_update_self" ON public.rbt_messages
  FOR UPDATE TO authenticated
  USING (public.is_employee_self(recipient_employee_id))
  WITH CHECK (public.is_employee_self(recipient_employee_id));
CREATE POLICY "rbt_messages_write_oversight" ON public.rbt_messages
  FOR ALL TO authenticated
  USING (public.can_oversee_rbt())
  WITH CHECK (public.can_oversee_rbt());
CREATE TRIGGER rbt_messages_updated_at
  BEFORE UPDATE ON public.rbt_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- rbt_help_requests
-- =========================================================================
CREATE TABLE public.rbt_help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rbt_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category text NOT NULL,
  urgency text NOT NULL DEFAULT 'normal',
  related_client_id uuid,
  related_session_id uuid,
  description text NOT NULL,
  preferred_contact_method text,
  routed_to_role text,
  routed_to_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rbt_help_requests_rbt_idx ON public.rbt_help_requests(rbt_employee_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbt_help_requests TO authenticated;
GRANT ALL ON public.rbt_help_requests TO service_role;
ALTER TABLE public.rbt_help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbt_help_requests_read" ON public.rbt_help_requests
  FOR SELECT TO authenticated
  USING (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt());
CREATE POLICY "rbt_help_requests_insert_self" ON public.rbt_help_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_employee_self(rbt_employee_id));
CREATE POLICY "rbt_help_requests_update_self" ON public.rbt_help_requests
  FOR UPDATE TO authenticated
  USING (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt())
  WITH CHECK (public.is_employee_self(rbt_employee_id) OR public.can_oversee_rbt());
CREATE TRIGGER rbt_help_requests_updated_at
  BEFORE UPDATE ON public.rbt_help_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
