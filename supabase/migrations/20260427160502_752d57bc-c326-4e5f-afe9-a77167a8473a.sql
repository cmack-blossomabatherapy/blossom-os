DO $$ BEGIN
  CREATE TYPE public.intake_pipeline_stage AS ENUM (
    'New Lead',
    'In Contact',
    'Sent Form',
    'Missing Information',
    'Form Received',
    'Sent to VOB',
    'VOB Completed',
    'Can''t Reach',
    'Can Not Submit Auth',
    'Sent Packet - Can''t Reach',
    'Non-Qualified',
    'Needs DX'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_priority AS ENUM ('Hot', 'Warm', 'Cold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_call_status AS ENUM ('Not Attempted', 'Attempted', 'Contacted', 'Connected', 'Left Voicemail', 'Wrong Number', 'Final Attempt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_form_status AS ENUM ('Not Sent', 'Sent', 'Viewed', 'Complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_consent_status AS ENUM ('Not Sent', 'Sent', 'Complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_form_review_status AS ENUM ('Pending', 'Complete', 'Missing Info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_vob_status AS ENUM ('Not Sent', 'Sent', 'Received', 'Approved', 'Payment Plan Required');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_task_type AS ENUM (
    'Contact Lead',
    'Follow Up',
    'Send Form',
    'Collect Missing Info',
    'Review Intake Packet',
    'Set Insurance',
    'Set Form Review Status',
    'Add to Eligipro',
    'Add to CentralReach',
    'Collect Missing Documentation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_task_status AS ENUM ('Open', 'In Progress', 'Completed', 'Blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_communication_type AS ENUM ('call', 'sms', 'email', 'note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intake_document_type AS ENUM ('Initial Form', 'Insurance Card', 'VOB File', 'Consent Form', 'DX Document', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.intake_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_name TEXT NOT NULL,
  child_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  state TEXT NOT NULL,
  lead_source TEXT NOT NULL DEFAULT 'Website',
  pipeline_stage public.intake_pipeline_stage NOT NULL DEFAULT 'New Lead',
  assigned_intake_coordinator TEXT,
  priority public.intake_priority NOT NULL DEFAULT 'Warm',
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  contact_attempts_count INTEGER NOT NULL DEFAULT 0,
  call_status public.intake_call_status NOT NULL DEFAULT 'Not Attempted',
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  form_status public.intake_form_status NOT NULL DEFAULT 'Not Sent',
  initial_form_link TEXT,
  consent_form_status public.intake_consent_status NOT NULL DEFAULT 'Not Sent',
  insurance TEXT,
  insurance_type TEXT,
  form_review_status public.intake_form_review_status NOT NULL DEFAULT 'Pending',
  notes TEXT,
  vob_status public.intake_vob_status NOT NULL DEFAULT 'Not Sent',
  vob_file_path TEXT,
  payment_plan_needed BOOLEAN NOT NULL DEFAULT false,
  next_action TEXT NOT NULL DEFAULT 'Contact Lead',
  next_task_due DATE,
  blockers TEXT[] NOT NULL DEFAULT '{}',
  ready_for_client_conversion BOOLEAN NOT NULL DEFAULT false,
  non_qualified_reason TEXT,
  stage_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intake_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  task_type public.intake_task_type NOT NULL,
  title TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  status public.intake_task_status NOT NULL DEFAULT 'Open',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intake_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  communication_type public.intake_communication_type NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  call_outcome public.intake_call_status,
  subject TEXT,
  preview TEXT NOT NULL,
  duration_seconds INTEGER,
  logged_by UUID,
  logged_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intake_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  document_type public.intake_document_type NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  missing_flag BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID,
  uploaded_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_leads_stage ON public.intake_leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_intake_leads_owner ON public.intake_leads(assigned_intake_coordinator);
CREATE INDEX IF NOT EXISTS idx_intake_leads_next_task_due ON public.intake_leads(next_task_due);
CREATE INDEX IF NOT EXISTS idx_intake_tasks_lead_status ON public.intake_tasks(lead_id, status);
CREATE INDEX IF NOT EXISTS idx_intake_communications_lead_created ON public.intake_communications(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_documents_lead ON public.intake_documents(lead_id);

ALTER TABLE public.intake_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View intake leads with permission" ON public.intake_leads FOR SELECT USING (public.has_permission(auth.uid(), 'leads.view'));
CREATE POLICY "Create intake leads with permission" ON public.intake_leads FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'leads.create'));
CREATE POLICY "Update intake leads with permission" ON public.intake_leads FOR UPDATE USING (public.has_permission(auth.uid(), 'leads.edit')) WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Delete intake leads with permission" ON public.intake_leads FOR DELETE USING (public.has_permission(auth.uid(), 'leads.delete'));

CREATE POLICY "View intake tasks with permission" ON public.intake_tasks FOR SELECT USING (public.has_permission(auth.uid(), 'leads.view'));
CREATE POLICY "Create intake tasks with permission" ON public.intake_tasks FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Update intake tasks with permission" ON public.intake_tasks FOR UPDATE USING (public.has_permission(auth.uid(), 'leads.edit')) WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Delete intake tasks with permission" ON public.intake_tasks FOR DELETE USING (public.has_permission(auth.uid(), 'leads.delete'));

CREATE POLICY "View intake communications with permission" ON public.intake_communications FOR SELECT USING (public.has_permission(auth.uid(), 'leads.view'));
CREATE POLICY "Create intake communications with permission" ON public.intake_communications FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Update intake communications with permission" ON public.intake_communications FOR UPDATE USING (public.has_permission(auth.uid(), 'leads.edit')) WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Delete intake communications with permission" ON public.intake_communications FOR DELETE USING (public.has_permission(auth.uid(), 'leads.delete'));

CREATE POLICY "View intake documents with permission" ON public.intake_documents FOR SELECT USING (public.has_permission(auth.uid(), 'leads.view'));
CREATE POLICY "Create intake documents with permission" ON public.intake_documents FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Update intake documents with permission" ON public.intake_documents FOR UPDATE USING (public.has_permission(auth.uid(), 'leads.edit')) WITH CHECK (public.has_permission(auth.uid(), 'leads.edit'));
CREATE POLICY "Delete intake documents with permission" ON public.intake_documents FOR DELETE USING (public.has_permission(auth.uid(), 'leads.delete'));

CREATE OR REPLACE FUNCTION public.set_intake_lead_stage_entered_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    NEW.stage_entered_at = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_intake_lead_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.pipeline_stage := 'New Lead';
    NEW.next_action := COALESCE(NULLIF(NEW.next_action, ''), 'Contact Lead');
  END IF;

  IF NEW.call_status = 'Connected' AND NEW.pipeline_stage = 'New Lead' THEN
    NEW.pipeline_stage := 'In Contact';
  ELSIF NEW.call_status = 'Final Attempt' THEN
    NEW.pipeline_stage := 'Can''t Reach';
  END IF;

  IF NEW.form_status = 'Sent' AND NEW.pipeline_stage IN ('New Lead', 'In Contact') THEN
    NEW.pipeline_stage := 'Sent Form';
  ELSIF NEW.form_status = 'Complete' AND NEW.pipeline_stage IN ('Sent Form', 'Missing Information') THEN
    NEW.pipeline_stage := 'Form Received';
  END IF;

  IF NEW.form_review_status = 'Missing Info' THEN
    NEW.pipeline_stage := 'Missing Information';
  ELSIF NEW.form_review_status = 'Complete' AND NEW.pipeline_stage = 'Form Received' THEN
    NEW.pipeline_stage := 'Sent to VOB';
  END IF;

  IF NEW.vob_status = 'Sent' AND NEW.pipeline_stage = 'Form Received' THEN
    NEW.pipeline_stage := 'Sent to VOB';
  ELSIF NEW.vob_status = 'Received' THEN
    NEW.pipeline_stage := 'VOB Completed';
  END IF;

  IF NEW.vob_status IN ('Approved', 'Payment Plan Required') THEN
    NEW.ready_for_client_conversion := true;
    NEW.payment_plan_needed := NEW.vob_status = 'Payment Plan Required';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_intake_lead_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
    VALUES (NEW.id, 'Contact Lead', 'Contact Lead', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by);
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage) THEN
    IF NEW.pipeline_stage = 'Form Received' THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES
        (NEW.id, 'Review Intake Packet', 'Review Intake Packet', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Set Insurance', 'Set Insurance', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Set Form Review Status', 'Set Form Review Status', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by);
    ELSIF NEW.pipeline_stage = 'Missing Information' THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES (NEW.id, 'Collect Missing Info', 'Collect Missing Info', NEW.assigned_intake_coordinator, CURRENT_DATE + 1, NEW.created_by);
    ELSIF NEW.pipeline_stage = 'Sent to VOB' THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES
        (NEW.id, 'Add to Eligipro', 'Add to Eligipro', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Add to CentralReach', 'Add to CentralReach', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by);
    ELSIF NEW.pipeline_stage = 'Can Not Submit Auth' THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES (NEW.id, 'Collect Missing Documentation', 'Collect Missing Documentation', NEW.assigned_intake_coordinator, CURRENT_DATE + 1, NEW.created_by);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_intake_leads_automation ON public.intake_leads;
CREATE TRIGGER before_intake_leads_automation
BEFORE INSERT OR UPDATE ON public.intake_leads
FOR EACH ROW
EXECUTE FUNCTION public.apply_intake_lead_automation();

DROP TRIGGER IF EXISTS before_intake_leads_stage_timestamp ON public.intake_leads;
CREATE TRIGGER before_intake_leads_stage_timestamp
BEFORE UPDATE ON public.intake_leads
FOR EACH ROW
EXECUTE FUNCTION public.set_intake_lead_stage_entered_at();

DROP TRIGGER IF EXISTS after_intake_leads_seed_tasks ON public.intake_leads;
CREATE TRIGGER after_intake_leads_seed_tasks
AFTER INSERT OR UPDATE ON public.intake_leads
FOR EACH ROW
EXECUTE FUNCTION public.seed_intake_lead_tasks();

DROP TRIGGER IF EXISTS touch_intake_tasks_updated_at ON public.intake_tasks;
CREATE TRIGGER touch_intake_tasks_updated_at
BEFORE UPDATE ON public.intake_tasks
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();