-- Add Monday Leads board–style columns to public.intake_leads so manual Add Lead
-- and future CTM/LeadTrap/Ads/website-form imports can persist into a single
-- canonical lead table. All columns are nullable / have safe defaults so the
-- existing data and policies are unchanged.

ALTER TABLE public.intake_leads
  ADD COLUMN IF NOT EXISTS patient_first_name      text,
  ADD COLUMN IF NOT EXISTS patient_last_name       text,
  ADD COLUMN IF NOT EXISTS dob                     date,
  ADD COLUMN IF NOT EXISTS parent_first_name       text,
  ADD COLUMN IF NOT EXISTS parent_last_name        text,
  ADD COLUMN IF NOT EXISTS parent_2_name           text,
  ADD COLUMN IF NOT EXISTS parent_2_email          text,
  ADD COLUMN IF NOT EXISTS parent_cell_phone       text,
  ADD COLUMN IF NOT EXISTS home_phone              text,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text,
  ADD COLUMN IF NOT EXISTS lead_type               text,
  ADD COLUMN IF NOT EXISTS utm_source              text,
  ADD COLUMN IF NOT EXISTS utm_medium              text,
  ADD COLUMN IF NOT EXISTS utm_campaign            text,
  ADD COLUMN IF NOT EXISTS referral_source         text,
  ADD COLUMN IF NOT EXISTS referral_partner        text,
  ADD COLUMN IF NOT EXISTS origination_date        date,
  ADD COLUMN IF NOT EXISTS last_contact_date       date,
  ADD COLUMN IF NOT EXISTS regular_call_log        text,
  ADD COLUMN IF NOT EXISTS et_call_log             text,
  ADD COLUMN IF NOT EXISTS message_comments        text,
  ADD COLUMN IF NOT EXISTS diagnosis_status        text,
  ADD COLUMN IF NOT EXISTS dx_needed               boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monday_item_id          text,
  ADD COLUMN IF NOT EXISTS monday_group            text,
  ADD COLUMN IF NOT EXISTS source_metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS original_column_data    jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags                    text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_intake_leads_monday_item_id ON public.intake_leads (monday_item_id);
CREATE INDEX IF NOT EXISTS idx_intake_leads_lead_source     ON public.intake_leads (lead_source);
CREATE INDEX IF NOT EXISTS idx_intake_leads_state           ON public.intake_leads (state);
