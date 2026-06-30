
-- 1) Add 'avoid' to family_pref_importance enum
ALTER TYPE family_pref_importance ADD VALUE IF NOT EXISTS 'avoid';

-- 2) staffing_case_activity
CREATE TABLE IF NOT EXISTS public.staffing_case_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  client_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('note','escalation','blocked','task','handoff','status_change')),
  title TEXT NOT NULL,
  detail TEXT,
  owner TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','watching','cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staffing_case_activity TO authenticated;
GRANT ALL ON public.staffing_case_activity TO service_role;

ALTER TABLE public.staffing_case_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View staffing case activity with permission"
  ON public.staffing_case_activity FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'staffing.view') OR has_permission(auth.uid(), 'clients.view'));

CREATE POLICY "Insert staffing case activity with permission"
  ON public.staffing_case_activity FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'staffing.edit') OR has_permission(auth.uid(), 'clients.edit'));

CREATE POLICY "Update staffing case activity with permission"
  ON public.staffing_case_activity FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'staffing.edit'))
  WITH CHECK (has_permission(auth.uid(), 'staffing.edit'));

CREATE POLICY "Delete staffing case activity with permission"
  ON public.staffing_case_activity FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'staffing.edit'));

CREATE INDEX IF NOT EXISTS idx_staffing_case_activity_client ON public.staffing_case_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_staffing_case_activity_status ON public.staffing_case_activity(status);

CREATE OR REPLACE FUNCTION public.touch_staffing_case_activity()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS touch_staffing_case_activity_trigger ON public.staffing_case_activity;
CREATE TRIGGER touch_staffing_case_activity_trigger
  BEFORE UPDATE ON public.staffing_case_activity
  FOR EACH ROW EXECUTE FUNCTION public.touch_staffing_case_activity();

-- 3) staffing_integration_handoffs
CREATE TABLE IF NOT EXISTS public.staffing_integration_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_record_id UUID,
  provider TEXT,
  candidate_name TEXT NOT NULL,
  candidate_role TEXT,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'ready_for_staffing'
    CHECK (status IN ('ready_for_staffing','added_to_pool','hold','returned_to_recruiting')),
  hold_reason TEXT,
  notes TEXT,
  assigned_owner TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staffing_integration_handoffs TO authenticated;
GRANT ALL ON public.staffing_integration_handoffs TO service_role;

ALTER TABLE public.staffing_integration_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View staffing handoffs with permission"
  ON public.staffing_integration_handoffs FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'staffing.view') OR has_permission(auth.uid(), 'recruiting.view'));

CREATE POLICY "Insert staffing handoffs with permission"
  ON public.staffing_integration_handoffs FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'staffing.edit'));

CREATE POLICY "Update staffing handoffs with permission"
  ON public.staffing_integration_handoffs FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'staffing.edit'))
  WITH CHECK (has_permission(auth.uid(), 'staffing.edit'));

CREATE POLICY "Delete staffing handoffs with permission"
  ON public.staffing_integration_handoffs FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'staffing.edit'));

CREATE INDEX IF NOT EXISTS idx_staffing_handoffs_status ON public.staffing_integration_handoffs(status);
CREATE INDEX IF NOT EXISTS idx_staffing_handoffs_record ON public.staffing_integration_handoffs(integration_record_id);

CREATE OR REPLACE FUNCTION public.touch_staffing_integration_handoffs()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS touch_staffing_integration_handoffs_trigger ON public.staffing_integration_handoffs;
CREATE TRIGGER touch_staffing_integration_handoffs_trigger
  BEFORE UPDATE ON public.staffing_integration_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.touch_staffing_integration_handoffs();
