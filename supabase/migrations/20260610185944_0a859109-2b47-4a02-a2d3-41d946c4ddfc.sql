
-- CRM-native referrals (richer than referral_lead_links)
CREATE TABLE public.referral_crm_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  patient_first_name TEXT,
  patient_last_initial TEXT,
  referral_date DATE,
  contact_id UUID REFERENCES public.referral_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.referral_companies(id) ON DELETE SET NULL,
  state TEXT,
  service_type TEXT,
  source_type TEXT,
  referral_status TEXT NOT NULL DEFAULT 'New',
  intake_status TEXT,
  insurance_type TEXT,
  assigned_intake_owner_id TEXT,
  attribution_confidence TEXT,
  lead_id UUID,
  notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_referrals TO authenticated;
GRANT ALL ON public.referral_crm_referrals TO service_role;
ALTER TABLE public.referral_crm_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read referrals" ON public.referral_crm_referrals FOR SELECT TO authenticated USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write referrals" ON public.referral_crm_referrals FOR ALL TO authenticated USING (public.can_access_referral_crm(auth.uid())) WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_referrals_updated BEFORE UPDATE ON public.referral_crm_referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_crm_referrals_contact ON public.referral_crm_referrals(contact_id);
CREATE INDEX idx_crm_referrals_company ON public.referral_crm_referrals(company_id);

-- CRM tasks
CREATE TABLE public.referral_crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT,
  priority TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  assigned_user_id TEXT,
  contact_id UUID REFERENCES public.referral_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.referral_companies(id) ON DELETE SET NULL,
  referral_id UUID,
  notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_tasks TO authenticated;
GRANT ALL ON public.referral_crm_tasks TO service_role;
ALTER TABLE public.referral_crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read tasks" ON public.referral_crm_tasks FOR SELECT TO authenticated USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write tasks" ON public.referral_crm_tasks FOR ALL TO authenticated USING (public.can_access_referral_crm(auth.uid())) WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_crm_tasks_updated BEFORE UPDATE ON public.referral_crm_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_crm_tasks_contact ON public.referral_crm_tasks(contact_id);
CREATE INDEX idx_crm_tasks_company ON public.referral_crm_tasks(company_id);
CREATE INDEX idx_crm_tasks_referral ON public.referral_crm_tasks(referral_id);
