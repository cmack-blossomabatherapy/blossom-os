DO $$ BEGIN
  CREATE TYPE public.financial_review_status AS ENUM ('Pending Review', 'Approved', 'Payment Plan Required', 'Not Viable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_plan_status AS ENUM ('Not Required', 'Sent', 'Awaiting Signature', 'Signed', 'Approved', 'Declined', 'Not Qualified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.intake_leads
  ADD COLUMN IF NOT EXISTS primary_insurance TEXT,
  ADD COLUMN IF NOT EXISTS secondary_insurance TEXT,
  ADD COLUMN IF NOT EXISTS in_network BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS out_of_network BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deductible_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deductible_remaining NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coinsurance_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS copay NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_out_of_pocket NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_insurance_coverage_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_client_responsibility NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_weekly_hours NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_monthly_revenue NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS financial_status public.financial_review_status NOT NULL DEFAULT 'Pending Review',
  ADD COLUMN IF NOT EXISTS financial_decision_notes TEXT,
  ADD COLUMN IF NOT EXISTS financial_owner TEXT NOT NULL DEFAULT 'Gabi',
  ADD COLUMN IF NOT EXISTS payment_plan_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_plan_signed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_plan_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_plan_status public.payment_plan_status NOT NULL DEFAULT 'Not Required',
  ADD COLUMN IF NOT EXISTS financial_stage_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS financial_blockers TEXT[] NOT NULL DEFAULT '{}';

DO $$ BEGIN
  ALTER TYPE public.intake_task_type ADD VALUE IF NOT EXISTS 'Submit to Solum';
  ALTER TYPE public.intake_task_type ADD VALUE IF NOT EXISTS 'Send Payment Plan';
  ALTER TYPE public.intake_task_type ADD VALUE IF NOT EXISTS 'Follow Up with Family';
  ALTER TYPE public.intake_task_type ADD VALUE IF NOT EXISTS 'Confirm Payment Plan Signed';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_intake_leads_financial_status ON public.intake_leads(financial_status);
CREATE INDEX IF NOT EXISTS idx_intake_leads_financial_owner ON public.intake_leads(financial_owner);
CREATE INDEX IF NOT EXISTS idx_intake_leads_payment_plan_status ON public.intake_leads(payment_plan_status);

CREATE OR REPLACE FUNCTION public.apply_financial_gate_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.financial_status IS DISTINCT FROM OLD.financial_status THEN
    NEW.financial_stage_entered_at = now();
  END IF;

  IF NEW.pipeline_stage = 'Sent to VOB' AND NEW.vob_status = 'Not Sent' THEN
    NEW.vob_status := 'Sent';
  END IF;

  IF NEW.vob_status = 'Received' AND NEW.financial_status = 'Pending Review' THEN
    NEW.next_action := 'Financial review by Gabi';
  END IF;

  IF LOWER(COALESCE(NEW.primary_insurance, NEW.insurance, '')) LIKE '%medicaid%' THEN
    NEW.financial_status := 'Approved';
    NEW.ready_for_client_conversion := true;
    NEW.payment_plan_needed := false;
  END IF;

  IF NEW.financial_status = 'Approved' THEN
    NEW.ready_for_client_conversion := true;
    NEW.payment_plan_needed := false;
    NEW.next_action := 'Move to Client Pipeline';
  ELSIF NEW.financial_status = 'Payment Plan Required' THEN
    NEW.payment_plan_needed := true;
    NEW.payment_plan_status := CASE WHEN NEW.payment_plan_signed THEN 'Signed' ELSE NEW.payment_plan_status END;
    NEW.next_action := 'Send and confirm payment plan';
  ELSIF NEW.financial_status = 'Not Viable' THEN
    NEW.pipeline_stage := 'Non-Qualified';
    NEW.ready_for_client_conversion := false;
    NEW.next_action := 'Notify intake and leadership';
  END IF;

  IF NEW.payment_plan_signed THEN
    NEW.payment_plan_status := 'Signed';
    NEW.ready_for_client_conversion := true;
    NEW.next_action := 'Move to Client Pipeline';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_financial_gate_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pipeline_stage = 'Sent to VOB' AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
    VALUES
      (NEW.id, 'Submit to Solum', 'Submit to Solum', NEW.financial_owner, CURRENT_DATE, NEW.created_by),
      (NEW.id, 'Add to Eligipro', 'Add to Eligipro', NEW.financial_owner, CURRENT_DATE, NEW.created_by),
      (NEW.id, 'Add to CentralReach', 'Add to CentralReach', NEW.financial_owner, CURRENT_DATE, NEW.created_by);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.financial_status = 'Payment Plan Required' AND OLD.financial_status IS DISTINCT FROM NEW.financial_status THEN
    INSERT INTO public.intake_tasks (lead_id, task_type, title, owner, due_date, created_by)
    VALUES
      (NEW.id, 'Send Payment Plan', 'Send Payment Plan', NEW.financial_owner, CURRENT_DATE, NEW.created_by),
      (NEW.id, 'Follow Up with Family', 'Follow Up with Family', NEW.financial_owner, CURRENT_DATE + 2, NEW.created_by),
      (NEW.id, 'Confirm Payment Plan Signed', 'Confirm Payment Plan Signed', NEW.financial_owner, CURRENT_DATE + 3, NEW.created_by);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_intake_leads_financial_gate ON public.intake_leads;
CREATE TRIGGER before_intake_leads_financial_gate
BEFORE INSERT OR UPDATE ON public.intake_leads
FOR EACH ROW
EXECUTE FUNCTION public.apply_financial_gate_automation();

DROP TRIGGER IF EXISTS after_intake_leads_financial_tasks ON public.intake_leads;
CREATE TRIGGER after_intake_leads_financial_tasks
AFTER UPDATE ON public.intake_leads
FOR EACH ROW
EXECUTE FUNCTION public.seed_financial_gate_tasks();

REVOKE ALL ON FUNCTION public.apply_financial_gate_automation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_financial_gate_tasks() FROM PUBLIC, anon, authenticated;