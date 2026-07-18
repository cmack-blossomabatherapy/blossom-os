-- 1) Shared assignment model — additive fields
ALTER TABLE public.rbt_client_assignments
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS first_session_date timestamptz,
  ADD COLUMN IF NOT EXISTS lead_rbt_support_status text,
  ADD COLUMN IF NOT EXISTS supervision_plan text,
  ADD COLUMN IF NOT EXISTS training_recommendations text,
  ADD COLUMN IF NOT EXISTS open_concerns_count integer NOT NULL DEFAULT 0;

-- 2) Scope checklist items by audience (rbt | bcba)
ALTER TABLE public.rbt_first_session_checklist_items
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'rbt';

-- 3) Track BCBA follow-up lifecycle so responses cannot disappear
ALTER TABLE public.rbt_first_session_bcba_followups
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_note text;

-- 4) Seed BCBA pre-start checklist (idempotent)
INSERT INTO public.rbt_first_session_checklist_items(key, label, description, order_index, audience, is_active)
VALUES
  ('bcba_review_assignment',  'Review RBT assignment',                  'Confirm the assignment details and case fit.',                       1, 'bcba', true),
  ('bcba_contact_rbt',        'Contact RBT',                            'Introduce yourself and set expectations before the first session.',  2, 'bcba', true),
  ('bcba_clinical_directions','Confirm clinical directions are available','RBT can access the current treatment plan and goals.',            3, 'bcba', true),
  ('bcba_cr_access',          'Confirm CentralReach access',            'RBT is on the case in CentralReach.',                                4, 'bcba', true),
  ('bcba_supervision_plan',   'Confirm first supervision plan',         'A supervision session is scheduled.',                                5, 'bcba', true),
  ('bcba_lead_rbt',           'Confirm Lead RBT attendance',            'Lead RBT is scheduled if applicable.',                               6, 'bcba', true),
  ('bcba_family_intro',       'Confirm family introduction plan',       'Family or caregiver has been notified.',                             7, 'bcba', true),
  ('bcba_readiness_ack',      'Acknowledge readiness',                  'You are ready to begin.',                                            8, 'bcba', true)
ON CONFLICT (key) DO NOTHING;