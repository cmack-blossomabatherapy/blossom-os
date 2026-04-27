DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qa_review_status') THEN
    CREATE TYPE public.qa_review_status AS ENUM (
      'Awaiting Review',
      'In Review',
      'Issues Found',
      'Ready for Submission',
      'Submitted to Auth'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qa_error_type') THEN
    CREATE TYPE public.qa_error_type AS ENUM (
      'Missing Treatment Plan',
      'Missing Supporting Docs',
      'Formatting Error',
      'Clinical Accuracy',
      'Incomplete Notes',
      'Billing Risk',
      'Other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qa_monitoring_type') THEN
    CREATE TYPE public.qa_monitoring_type AS ENUM ('NoteGuard', 'Amerigroup', 'RBT Check-In');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qa_monitoring_status') THEN
    CREATE TYPE public.qa_monitoring_status AS ENUM ('Open', 'In Progress', 'Resolved');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.client_qa_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  assessment_id uuid,
  assigned_qa_owner text,
  assigned_bcba text,
  treatment_plan_submitted_date date,
  qa_start_date date,
  qa_completed_date date,
  status public.qa_review_status NOT NULL DEFAULT 'Awaiting Review',
  treatment_plan_received boolean NOT NULL DEFAULT false,
  notes_verified boolean NOT NULL DEFAULT false,
  documentation_complete boolean NOT NULL DEFAULT false,
  errors_found boolean NOT NULL DEFAULT false,
  error_types public.qa_error_type[] NOT NULL DEFAULT '{}',
  next_action text NOT NULL DEFAULT 'Review Treatment Plan',
  blockers text[] NOT NULL DEFAULT '{}',
  alerts text[] NOT NULL DEFAULT '{}',
  notes text,
  stage_entered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qa_note_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  rbt_name text,
  bcba_name text,
  monitoring_type public.qa_monitoring_type NOT NULL DEFAULT 'NoteGuard',
  status public.qa_monitoring_status NOT NULL DEFAULT 'Open',
  flagged_notes integer NOT NULL DEFAULT 0,
  notes_checked integer NOT NULL DEFAULT 0,
  errors_found integer NOT NULL DEFAULT 0,
  repeat_issue boolean NOT NULL DEFAULT false,
  new_rbt_monitoring boolean NOT NULL DEFAULT false,
  check_in_due date,
  owner text,
  next_action text NOT NULL DEFAULT 'Review Notes',
  alerts text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_qa_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_note_monitoring ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_qa_reviews_client ON public.client_qa_reviews (client_id);
CREATE INDEX IF NOT EXISTS idx_client_qa_reviews_status ON public.client_qa_reviews (status);
CREATE INDEX IF NOT EXISTS idx_client_qa_reviews_owner ON public.client_qa_reviews (assigned_qa_owner);
CREATE INDEX IF NOT EXISTS idx_qa_note_monitoring_status ON public.qa_note_monitoring (status, monitoring_type);
CREATE INDEX IF NOT EXISTS idx_qa_note_monitoring_client ON public.qa_note_monitoring (client_id);

DROP POLICY IF EXISTS "View QA reviews with permission" ON public.client_qa_reviews;
CREATE POLICY "View QA reviews with permission"
ON public.client_qa_reviews
FOR SELECT
USING (public.has_permission(auth.uid(), 'qa.view') OR public.has_permission(auth.uid(), 'clients.view'));

DROP POLICY IF EXISTS "Create QA reviews with permission" ON public.client_qa_reviews;
CREATE POLICY "Create QA reviews with permission"
ON public.client_qa_reviews
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'clients.edit'));

DROP POLICY IF EXISTS "Update QA reviews with permission" ON public.client_qa_reviews;
CREATE POLICY "Update QA reviews with permission"
ON public.client_qa_reviews
FOR UPDATE
USING (public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'clients.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'clients.edit'));

DROP POLICY IF EXISTS "Delete QA reviews with permission" ON public.client_qa_reviews;
CREATE POLICY "Delete QA reviews with permission"
ON public.client_qa_reviews
FOR DELETE
USING (public.has_permission(auth.uid(), 'clients.delete'));

DROP POLICY IF EXISTS "View QA monitoring with permission" ON public.qa_note_monitoring;
CREATE POLICY "View QA monitoring with permission"
ON public.qa_note_monitoring
FOR SELECT
USING (public.has_permission(auth.uid(), 'qa.view') OR public.has_permission(auth.uid(), 'clients.view'));

DROP POLICY IF EXISTS "Create QA monitoring with permission" ON public.qa_note_monitoring;
CREATE POLICY "Create QA monitoring with permission"
ON public.qa_note_monitoring
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'tasks.edit'));

DROP POLICY IF EXISTS "Update QA monitoring with permission" ON public.qa_note_monitoring;
CREATE POLICY "Update QA monitoring with permission"
ON public.qa_note_monitoring
FOR UPDATE
USING (public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'tasks.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'qa.edit') OR public.has_permission(auth.uid(), 'tasks.edit'));

DROP POLICY IF EXISTS "Delete QA monitoring with permission" ON public.qa_note_monitoring;
CREATE POLICY "Delete QA monitoring with permission"
ON public.qa_note_monitoring
FOR DELETE
USING (public.has_permission(auth.uid(), 'tasks.delete'));

CREATE OR REPLACE FUNCTION public.sync_qa_compliance_engine()
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

  IF NEW.status = 'In Review' AND NEW.qa_start_date IS NULL THEN
    NEW.qa_start_date := CURRENT_DATE;
    NEW.next_action := 'Complete QA checklist';
  END IF;

  IF NEW.errors_found AND NEW.status <> 'Submitted to Auth' THEN
    NEW.status := 'Issues Found';
    NEW.next_action := 'Fix Treatment Plan';
  END IF;

  IF NEW.treatment_plan_received AND NEW.notes_verified AND NEW.documentation_complete AND NOT NEW.errors_found AND NEW.status IN ('In Review', 'Issues Found') THEN
    NEW.status := 'Ready for Submission';
    NEW.qa_completed_date := COALESCE(NEW.qa_completed_date, CURRENT_DATE);
    NEW.next_action := 'Submit to Authorization';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Issues Found' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES
      (NEW.client_id, 'Fix Treatment Plan', false, CURRENT_DATE + 1, 50),
      (NEW.client_id, 'Resubmit documentation', false, CURRENT_DATE + 1, 51);

    UPDATE public.clients
    SET stage = 'QA Issues / Fix Required', qa_status = 'In Review', next_action = 'BCBA must fix QA issues', stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Ready for Submission' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.client_authorizations (client_id, kind, status, treatment_plan_received, qa_status, next_action, payor, state)
    SELECT c.id, 'Treatment', 'Not Submitted', true, 'Complete', 'Submit Treatment Authorization', c.payor, c.state
    FROM public.clients c
    WHERE c.id = NEW.client_id
      AND NOT EXISTS (
        SELECT 1 FROM public.client_authorizations ca
        WHERE ca.client_id = NEW.client_id AND ca.kind = 'Treatment'
      );

    UPDATE public.clients
    SET stage = 'Treatment Auth – Awaiting Submission', qa_status = 'Complete', next_action = 'Submit Treatment Authorization', stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'Submitted to Auth' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.clients
    SET stage = 'Treatment Auth – Awaiting Submission', qa_status = 'Complete', next_action = 'Submit Treatment Authorization', stage_entered_at = now()
    WHERE id = NEW.client_id;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_qa_compliance_engine_trigger ON public.client_qa_reviews;
CREATE TRIGGER sync_qa_compliance_engine_trigger
BEFORE INSERT OR UPDATE ON public.client_qa_reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_qa_compliance_engine();

CREATE OR REPLACE FUNCTION public.seed_qa_from_assessment_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'Treatment Plan Submitted'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
     AND NOT EXISTS (SELECT 1 FROM public.client_qa_reviews WHERE assessment_id = NEW.id) THEN
    INSERT INTO public.client_qa_reviews (
      client_id,
      assessment_id,
      assigned_qa_owner,
      assigned_bcba,
      treatment_plan_submitted_date,
      treatment_plan_received,
      next_action
    )
    VALUES (
      NEW.client_id,
      NEW.id,
      COALESCE(NEW.qa_owner, 'QA Team'),
      NEW.assigned_bcba,
      COALESCE(NEW.treatment_plan_completed_date, CURRENT_DATE),
      true,
      'Review Treatment Plan'
    );

    INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
    VALUES (NEW.client_id, 'Review Treatment Plan', false, CURRENT_DATE, 49);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS seed_qa_from_assessment_submission_trigger ON public.client_assessments;
CREATE TRIGGER seed_qa_from_assessment_submission_trigger
AFTER INSERT OR UPDATE ON public.client_assessments
FOR EACH ROW
EXECUTE FUNCTION public.seed_qa_from_assessment_submission();

CREATE OR REPLACE FUNCTION public.sync_qa_note_monitoring_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.flagged_notes > 0 OR NEW.errors_found > 0 OR NEW.new_rbt_monitoring) THEN
    IF NEW.client_id IS NOT NULL THEN
      INSERT INTO public.client_tasks (client_id, title, completed, due_date, position)
      VALUES (
        NEW.client_id,
        CASE WHEN NEW.new_rbt_monitoring THEN 'Check RBT Performance' ELSE 'Review Notes' END,
        false,
        COALESCE(NEW.check_in_due, CURRENT_DATE),
        52
      );
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_qa_note_monitoring_tasks_trigger ON public.qa_note_monitoring;
CREATE TRIGGER sync_qa_note_monitoring_tasks_trigger
BEFORE INSERT OR UPDATE ON public.qa_note_monitoring
FOR EACH ROW
EXECUTE FUNCTION public.sync_qa_note_monitoring_tasks();

REVOKE ALL ON FUNCTION public.sync_qa_compliance_engine() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_qa_compliance_engine() FROM anon;
REVOKE ALL ON FUNCTION public.sync_qa_compliance_engine() FROM authenticated;
REVOKE ALL ON FUNCTION public.seed_qa_from_assessment_submission() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_qa_from_assessment_submission() FROM anon;
REVOKE ALL ON FUNCTION public.seed_qa_from_assessment_submission() FROM authenticated;
REVOKE ALL ON FUNCTION public.sync_qa_note_monitoring_tasks() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_qa_note_monitoring_tasks() FROM anon;
REVOKE ALL ON FUNCTION public.sync_qa_note_monitoring_tasks() FROM authenticated;