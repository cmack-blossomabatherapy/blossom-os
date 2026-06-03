
-- Shared trigger for updated_at (re-use if exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Helper: marketing CRM access predicate
CREATE OR REPLACE FUNCTION public.can_access_referral_crm(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin'::public.app_role)
      OR public.has_role(_uid, 'marketing'::public.app_role)
      OR public.has_role(_uid, 'exec'::public.app_role)
      OR public.has_role(_uid, 'ops_manager'::public.app_role)
$$;

-- =========================================================================
-- referral_import_batches
-- =========================================================================
CREATE TABLE public.referral_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  total_rows int NOT NULL DEFAULT 0,
  successful_rows int NOT NULL DEFAULT 0,
  failed_rows int NOT NULL DEFAULT 0,
  duplicate_contacts int NOT NULL DEFAULT 0,
  duplicate_companies int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Processing'
    CHECK (status IN ('Processing','Completed','Completed with Errors','Failed')),
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_import_batches TO authenticated;
GRANT ALL ON public.referral_import_batches TO service_role;
ALTER TABLE public.referral_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read batches" ON public.referral_import_batches FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write batches" ON public.referral_import_batches FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_import_batches_updated
  BEFORE UPDATE ON public.referral_import_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- referral_companies
-- =========================================================================
CREATE TABLE public.referral_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(coalesce(company_name,''), '[^a-zA-Z0-9]', '', 'g'))) STORED,
  company_type text,
  website_url text,
  domain text,
  main_phone text,
  main_email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  zip_code text,
  full_address text,
  service_area text,
  notes text,
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active','Inactive','Needs Review','Duplicate','Archived')),
  relationship_stage text NOT NULL DEFAULT 'New'
    CHECK (relationship_stage IN ('New','Active','Warm','Strong Partner','Needs Follow-Up','Dormant','Do Not Contact')),
  relationship_owner text,
  referral_count int NOT NULL DEFAULT 0,
  last_referral_date date,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  source text,
  import_batch_id uuid REFERENCES public.referral_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ref_companies_normalized ON public.referral_companies(normalized_name);
CREATE INDEX idx_ref_companies_domain ON public.referral_companies(domain);
CREATE INDEX idx_ref_companies_state ON public.referral_companies(state);
CREATE INDEX idx_ref_companies_owner ON public.referral_companies(relationship_owner);
CREATE INDEX idx_ref_companies_followup ON public.referral_companies(next_follow_up_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_companies TO authenticated;
GRANT ALL ON public.referral_companies TO service_role;
ALTER TABLE public.referral_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read companies" ON public.referral_companies FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write companies" ON public.referral_companies FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_companies_updated
  BEFORE UPDATE ON public.referral_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- referral_contacts
-- =========================================================================
CREATE TABLE public.referral_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.referral_companies(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  full_name text,
  title text,
  role_type text,
  email text,
  phone text,
  mobile_phone text,
  direct_phone text,
  website_url text,
  linkedin_url text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  zip_code text,
  full_address text,
  contact_owner text,
  status text NOT NULL DEFAULT 'New'
    CHECK (status IN ('Active','Needs Follow-Up','New','Connected','Unresponsive','Do Not Contact','Duplicate','Archived')),
  relationship_stage text NOT NULL DEFAULT 'New Contact'
    CHECK (relationship_stage IN ('New Contact','First Outreach','Connected','Active Referral Source','Strong Partner','Dormant','Needs Follow-Up')),
  preferred_contact_method text
    CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('Email','Phone','Text','In-Person','Unknown')),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  number_of_referrals_sent int NOT NULL DEFAULT 0,
  number_of_sales_activities int NOT NULL DEFAULT 0,
  number_of_times_contacted int NOT NULL DEFAULT 0,
  last_activity_date timestamptz,
  recent_email_opened_at timestamptz,
  last_meeting_booked_at timestamptz,
  notes text,
  source text,
  original_record_id text,
  import_batch_id uuid REFERENCES public.referral_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ref_contacts_company ON public.referral_contacts(company_id);
CREATE INDEX idx_ref_contacts_email ON public.referral_contacts(lower(email));
CREATE INDEX idx_ref_contacts_phone ON public.referral_contacts(phone);
CREATE INDEX idx_ref_contacts_owner ON public.referral_contacts(contact_owner);
CREATE INDEX idx_ref_contacts_followup ON public.referral_contacts(next_follow_up_at);
CREATE INDEX idx_ref_contacts_state ON public.referral_contacts(state);
CREATE INDEX idx_ref_contacts_original ON public.referral_contacts(original_record_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_contacts TO authenticated;
GRANT ALL ON public.referral_contacts TO service_role;
ALTER TABLE public.referral_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read contacts" ON public.referral_contacts FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write contacts" ON public.referral_contacts FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_contacts_updated
  BEFORE UPDATE ON public.referral_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- referral_activities
-- =========================================================================
CREATE TABLE public.referral_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.referral_contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.referral_companies(id) ON DELETE CASCADE,
  activity_type text NOT NULL
    CHECK (activity_type IN ('Call','Email','Meeting','Visit','Event','Referral Received','Follow-Up','Note','Task','Other')),
  activity_date timestamptz NOT NULL DEFAULT now(),
  subject text,
  notes text,
  outcome text
    CHECK (outcome IS NULL OR outcome IN ('Connected','Left Message','Sent Email','Meeting Booked','Referral Sent','Needs Follow-Up','No Response','Not Interested','Other')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_follow_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ref_activities_contact ON public.referral_activities(contact_id);
CREATE INDEX idx_ref_activities_company ON public.referral_activities(company_id);
CREATE INDEX idx_ref_activities_date ON public.referral_activities(activity_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_activities TO authenticated;
GRANT ALL ON public.referral_activities TO service_role;
ALTER TABLE public.referral_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read activities" ON public.referral_activities FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write activities" ON public.referral_activities FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_activities_updated
  BEFORE UPDATE ON public.referral_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- referral_lead_links (future lead attribution)
-- =========================================================================
CREATE TABLE public.referral_lead_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  referral_contact_id uuid REFERENCES public.referral_contacts(id) ON DELETE SET NULL,
  referral_company_id uuid REFERENCES public.referral_companies(id) ON DELETE SET NULL,
  referral_source_type text
    CHECK (referral_source_type IS NULL OR referral_source_type IN ('Physician Referral','School Referral','Parent Referral','Community Referral','Professional Referral','Recruiting Referral','Other')),
  referral_date date,
  attribution_confidence text
    CHECK (attribution_confidence IS NULL OR attribution_confidence IN ('Confirmed','Likely','Manual','Unknown')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ref_lead_links_lead ON public.referral_lead_links(lead_id);
CREATE INDEX idx_ref_lead_links_contact ON public.referral_lead_links(referral_contact_id);
CREATE INDEX idx_ref_lead_links_company ON public.referral_lead_links(referral_company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_lead_links TO authenticated;
GRANT ALL ON public.referral_lead_links TO service_role;
ALTER TABLE public.referral_lead_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm read lead links" ON public.referral_lead_links FOR SELECT TO authenticated
  USING (public.can_access_referral_crm(auth.uid()));
CREATE POLICY "crm write lead links" ON public.referral_lead_links FOR ALL TO authenticated
  USING (public.can_access_referral_crm(auth.uid()))
  WITH CHECK (public.can_access_referral_crm(auth.uid()));
CREATE TRIGGER trg_referral_lead_links_updated
  BEFORE UPDATE ON public.referral_lead_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- Rollup trigger: company referral_count + dates from contacts
-- =========================================================================
CREATE OR REPLACE FUNCTION public.recalc_referral_company_rollup(_company_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _company_id IS NULL THEN RETURN; END IF;
  UPDATE public.referral_companies c SET
    referral_count = COALESCE((SELECT SUM(number_of_referrals_sent) FROM public.referral_contacts WHERE company_id = _company_id), 0),
    last_contacted_at = (SELECT MAX(last_contacted_at) FROM public.referral_contacts WHERE company_id = _company_id),
    next_follow_up_at = (SELECT MIN(next_follow_up_at) FROM public.referral_contacts WHERE company_id = _company_id AND next_follow_up_at IS NOT NULL)
  WHERE c.id = _company_id;
END $$;

CREATE OR REPLACE FUNCTION public.trg_referral_contacts_rollup()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_referral_company_rollup(OLD.company_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_referral_company_rollup(NEW.company_id);
  IF TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id THEN
    PERFORM public.recalc_referral_company_rollup(OLD.company_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_referral_contacts_rollup_aiud
  AFTER INSERT OR UPDATE OR DELETE ON public.referral_contacts
  FOR EACH ROW EXECUTE FUNCTION public.trg_referral_contacts_rollup();
