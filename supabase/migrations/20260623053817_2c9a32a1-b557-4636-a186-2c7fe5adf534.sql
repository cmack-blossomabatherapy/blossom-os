-- Export 86 — canonicalize intake pipeline at the database layer.

-- 1. Default stage for new leads is now the canonical "Lead Captured".
ALTER TABLE public.intake_leads
  ALTER COLUMN pipeline_stage SET DEFAULT 'Lead Captured';

-- 2. Replace the automation trigger with canonical Family / Lead behavior.
CREATE OR REPLACE FUNCTION public.apply_intake_lead_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert: do NOT overwrite a provided pipeline_stage. Default to canonical
  -- "Lead Captured" only when the caller left it null.
  IF TG_OP = 'INSERT' THEN
    IF NEW.pipeline_stage IS NULL THEN
      NEW.pipeline_stage := 'Lead Captured';
    END IF;
    NEW.next_action := COALESCE(NULLIF(NEW.next_action, ''), 'Contact Lead');
  END IF;

  -- Call outcome → canonical engagement progression.
  IF NEW.call_status = 'Connected'
     AND NEW.pipeline_stage IN ('Lead Captured', 'New Lead') THEN
    NEW.pipeline_stage := 'First Contact Attempt';
  ELSIF NEW.call_status = 'Connected'
     AND NEW.pipeline_stage = 'First Contact Attempt' THEN
    NEW.pipeline_stage := 'Engagement Track';
  ELSIF NEW.call_status = 'Final Attempt' THEN
    -- Legacy terminal "Can't Reach" bucket preserved for back-compat reads.
    NEW.pipeline_stage := 'Can''t Reach';
  END IF;

  -- Intake packet flow → canonical stages.
  IF NEW.form_status = 'Sent'
     AND NEW.pipeline_stage IN ('Lead Captured', 'New Lead', 'First Contact Attempt', 'Engagement Track', 'Qualification', 'In Contact') THEN
    NEW.pipeline_stage := 'Intake Packet Sent';
  ELSIF NEW.form_status = 'Complete'
     AND NEW.pipeline_stage IN ('Intake Packet Sent', 'Intake Packet Follow Up', 'Sent Form', 'Missing Information') THEN
    NEW.pipeline_stage := 'Intake Complete';
  END IF;

  -- Form review outcomes → canonical stages.
  IF NEW.form_review_status = 'Missing Info' THEN
    NEW.pipeline_stage := 'Intake Packet Follow Up';
  ELSIF NEW.form_review_status = 'Complete'
     AND NEW.pipeline_stage IN ('Intake Complete', 'Form Received') THEN
    NEW.pipeline_stage := 'Benefits Verification';
  END IF;

  -- VOB / benefits flow → canonical stages.
  IF NEW.vob_status = 'Sent'
     AND NEW.pipeline_stage IN ('Intake Complete', 'Form Received', 'Benefits Verification') THEN
    NEW.pipeline_stage := 'Benefits Verification';
  ELSIF NEW.vob_status = 'Received'
     AND NEW.pipeline_stage IN ('Benefits Verification', 'Intake Complete', 'Sent to VOB') THEN
    NEW.pipeline_stage := 'Assessment Scheduling';
  END IF;

  IF NEW.vob_status IN ('Approved', 'Payment Plan Required') THEN
    NEW.ready_for_client_conversion := true;
    NEW.payment_plan_needed := NEW.vob_status = 'Payment Plan Required';
    IF NEW.pipeline_stage IN ('Benefits Verification', 'Sent to VOB', 'VOB Completed') THEN
      NEW.pipeline_stage := 'Assessment Scheduling';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Replace the task seeder with canonical-stage triggers.
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
    IF NEW.pipeline_stage IN ('Intake Complete', 'Form Received') THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES
        (NEW.id, 'Review Intake Packet', 'Review Intake Packet', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Set Insurance', 'Set Insurance', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Set Form Review Status', 'Set Form Review Status', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by);
    ELSIF NEW.pipeline_stage IN ('Intake Packet Follow Up', 'Missing Information') THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES (NEW.id, 'Collect Missing Info', 'Collect Missing Info', NEW.assigned_intake_coordinator, CURRENT_DATE + 1, NEW.created_by);
    ELSIF NEW.pipeline_stage IN ('Benefits Verification', 'Sent to VOB') THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES
        (NEW.id, 'Run Benefits Verification', 'Run Benefits Verification', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Add to Eligipro', 'Add to Eligipro', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by),
        (NEW.id, 'Add to CentralReach', 'Add to CentralReach', NEW.assigned_intake_coordinator, CURRENT_DATE, NEW.created_by);
    ELSIF NEW.pipeline_stage IN ('QA / Treatment Plan Authorization', 'Authorization Pending', 'Can Not Submit Auth') THEN
      INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
      VALUES (NEW.id, 'Collect Missing Documentation', 'Collect Missing Documentation', NEW.assigned_intake_coordinator, CURRENT_DATE + 1, NEW.created_by);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_intake_lead_automation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_intake_lead_tasks() FROM PUBLIC, anon, authenticated;