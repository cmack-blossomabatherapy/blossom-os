DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status') THEN
    CREATE TYPE public.assessment_status AS ENUM (
      'Needs Scheduling',
      'Scheduled',
      'Completed',
      'Treatment Plan Pending',
      'Treatment Plan Submitted'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_type') THEN
    CREATE TYPE public.assessment_type AS ENUM ('Initial', 'Reassessment', 'Update');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_location') THEN
    CREATE TYPE public.assessment_location AS ENUM ('Home', 'School', 'Clinic');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_document_type') THEN
    CREATE TYPE public.assessment_document_type AS ENUM ('Assessment Notes', 'Treatment Plan');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.client_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  assigned_bcba text,
  assessment_type public.assessment_type NOT NULL DEFAULT 'Initial',
  location public.assessment_location NOT NULL DEFAULT 'Clinic',
  scheduled_date date,
  completed_date date,
  treatment_plan_due_date date,
  treatment_plan_completed_date date,
  status public.assessment_status NOT NULL DEFAULT 'Needs Scheduling',
  scheduler text,
  qa_owner text,
  next_action text NOT NULL DEFAULT 'Schedule Assessment',
  blockers text[] NOT NULL DEFAULT '{}',
  alerts text[] NOT NULL DEFAULT '{}',
  notes text,
  stage_entered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  client_id uuid NOT NULL,
  document_type public.assessment_document_type NOT NULL,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  storage_path text,
  qa_visible boolean NOT NULL DEFAULT true,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_assessments_client ON public.client_assessments (client_id);
CREATE INDEX IF NOT EXISTS idx_client_assessments_status ON public.client_assessments (status);
CREATE INDEX IF NOT EXISTS idx_client_assessments_due ON public.client_assessments (treatment_plan_due_date);
CREATE INDEX IF NOT EXISTS idx_assessment_documents_assessment ON public.assessment_documents (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_documents_client ON public.assessment_documents (client_id);

DROP POLICY IF EXISTS "View assessments with permission" ON public.client_assessments;
CREATE POLICY "View assessments with permission"
ON public.client_assessments
FOR SELECT
USING (public.has_permission(auth.uid(), 'clients.view'));

DROP POLICY IF EXISTS "Create assessments with permission" ON public.client_assessments;
CREATE POLICY "Create assessments with permission"
ON public.client_assessments
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'clients.edit'));

DROP POLICY IF EXISTS "Update assessments with permission" ON public.client_assessments;
CREATE POLICY "Update assessments with permission"
ON public.client_assessments
FOR UPDATE
USING (public.has_permission(auth.uid(), 'clients.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'clients.edit'));

DROP POLICY IF EXISTS "Delete assessments with permission" ON public.client_assessments;
CREATE POLICY "Delete assessments with permission"
ON public.client_assessments
FOR DELETE
USING (public.has_permission(auth.uid(), 'clients.delete'));

DROP POLICY IF EXISTS "View assessment docs with permission" ON public.assessment_documents;
CREATE POLICY "View assessment docs with permission"
ON public.assessment_documents
FOR SELECT
USING (public.has_permission(auth.uid(), 'documents.view'));

DROP POLICY IF EXISTS "Create assessment docs with permission" ON public.assessment_documents;
CREATE POLICY "Create assessment docs with permission"
ON public.assessment_documents
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'documents.edit'));

DROP POLICY IF EXISTS "Update assessment docs with permission" ON public.assessment_documents;
CREATE POLICY "Update assessment docs with permission"
ON public.assessment_documents
FOR UPDATE
USING (public.has_permission(auth.uid(), 'documents.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'documents.edit'));

DROP POLICY IF EXISTS "Delete assessment docs with permission" ON public.assessment_documents;
CREATE POLICY "Delete assessment docs with permission"
ON public.assessment_documents
FOR DELETE
USING (public.has_permission(auth.uid(), 'documents.delete'));

CREATE OR REPLACE FUNCTION public.sync_assessment_clinical_intake()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.assigned_bcba := COALESCE(NEW.assigned_bcba, (SELECT bcba FROM public.clients WHERE id = NEW.client_id));
    NEW.stage_entered_at := COALESCE(NEW.stage_entered_at, now());
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.stage_entered_at := now();
  END IF;

  IF NEW.scheduled_date IS NOT NULL AND NEW.status = 'Needs Scheduling' THEN
    NEW.status := 'Scheduled';
    NEW.next_action := 'Confirm Assessment Completion';
  END IF;

  IF NEW.status = 'Scheduled' AND TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (NEW.client_id, 'Confirm Assessment Completion', false, NEW.scheduled_date, 40);
  END IF;

  IF NEW.completed_date IS NOT NULL AND NEW.status IN ('Scheduled', 'Completed') THEN
    NEW.status := 'Treatment Plan Pending';
    NEW.treatment_plan_due_date := COALESCE(NEW.treatment_plan_due_date, NEW.completed_date + 14);
    NEW.next_action := 'Complete Treatment Plan';
  END IF;

  IF NEW.status = 'Treatment Plan Pending' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (NEW.client_id, 'Complete Treatment Plan', false, NEW.treatment_plan_due_date, 41);
  END IF;

  IF NEW.treatment_plan_completed_date IS NOT NULL THEN
    NEW.status := 'Treatment Plan Submitted';
    NEW.next_action := 'QA Review';
  END IF;

  IF NEW.status = 'Treatment Plan Submitted' AND TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.clients
    SET stage = 'QA Review', qa_status = 'In Review', next_action = 'QA review treatment plan', stage_entered_at = now(), assessment_date = COALESCE(assessment_date, NEW.completed_date)
    WHERE id = NEW.client_id;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_assessment_clinical_intake_trigger ON public.client_assessments;
CREATE TRIGGER sync_assessment_clinical_intake_trigger
BEFORE INSERT OR UPDATE ON public.client_assessments
FOR EACH ROW
EXECUTE FUNCTION public.sync_assessment_clinical_intake();

CREATE OR REPLACE FUNCTION public.seed_assessment_from_client_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.auth_status = 'Approved'
     AND COALESCE(NEW.consent_complete, false)
     AND NEW.stage IN ('Schedule Assessment', 'Initial Auth – Approved')
     AND NOT EXISTS (SELECT 1 FROM public.client_assessments WHERE client_id = NEW.id AND assessment_type = 'Initial') THEN
    INSERT INTO public.client_assessments (client_id, assigned_bcba, assessment_type, location, scheduler, qa_owner)
    VALUES (NEW.id, NEW.bcba, 'Initial', 'Clinic', NEW.intake_owner, 'QA Team');

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.id, 'Schedule Assessment', false, CURRENT_DATE, 38),
      (NEW.id, 'Confirm BCBA Assignment', false, CURRENT_DATE, 39);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS seed_assessment_from_client_gate_trigger ON public.clients;
CREATE TRIGGER seed_assessment_from_client_gate_trigger
AFTER INSERT OR UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.seed_assessment_from_client_gate();

REVOKE ALL ON FUNCTION public.sync_assessment_clinical_intake() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_assessment_clinical_intake() FROM anon;
REVOKE ALL ON FUNCTION public.sync_assessment_clinical_intake() FROM authenticated;
REVOKE ALL ON FUNCTION public.seed_assessment_from_client_gate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_assessment_from_client_gate() FROM anon;
REVOKE ALL ON FUNCTION public.seed_assessment_from_client_gate() FROM authenticated;