-- Sprint 04 Phase A: add missing Data API GRANTs.
-- RLS is already enabled and policies already exist on all 8 tables;
-- only table-level privileges were missing, which blocked PostgREST.
-- Anon is intentionally excluded — every policy is auth-scoped.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_leads          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_communications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_tasks          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_events        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_companies    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_contacts     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_activities   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_crm_tasks    TO authenticated;

GRANT ALL ON public.intake_leads          TO service_role;
GRANT ALL ON public.intake_communications TO service_role;
GRANT ALL ON public.intake_tasks          TO service_role;
GRANT ALL ON public.journey_events        TO service_role;
GRANT ALL ON public.referral_companies    TO service_role;
GRANT ALL ON public.referral_contacts     TO service_role;
GRANT ALL ON public.referral_activities   TO service_role;
GRANT ALL ON public.referral_crm_tasks    TO service_role;