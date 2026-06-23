-- Export 85: Add canonical Family / Lead pipeline stages to intake_pipeline_stage enum.
-- Old Monday-era values are preserved for legacy imports.
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Lead Captured';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'First Contact Attempt';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Engagement Track';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Qualification';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Intake Packet Sent';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Intake Packet Follow Up';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Intake Complete';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Benefits Verification';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Assessment Scheduling';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'QA / Treatment Plan Authorization';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Authorization Pending';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Staffing Match';
ALTER TYPE public.intake_pipeline_stage ADD VALUE IF NOT EXISTS 'Ready to Start Services';