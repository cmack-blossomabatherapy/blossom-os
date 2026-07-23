-- 1) Rename and reshape the table
ALTER TABLE public.email_templates RENAME TO intake_communication_templates;

ALTER TABLE public.intake_communication_templates
  DROP CONSTRAINT IF EXISTS email_templates_template_key_key;

ALTER TABLE public.intake_communication_templates
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.intake_communication_templates
  ADD CONSTRAINT intake_communication_templates_channel_key_key
  UNIQUE (channel, template_key);

-- 2) Rebuild access rules: admins write, authenticated read active
DROP POLICY IF EXISTS "Admins can view templates" ON public.intake_communication_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.intake_communication_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.intake_communication_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.intake_communication_templates;

CREATE POLICY "Authenticated can view active templates"
  ON public.intake_communication_templates
  FOR SELECT
  TO authenticated
  USING (
    is_active
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

CREATE POLICY "Super admins can insert templates"
  ON public.intake_communication_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

CREATE POLICY "Super admins can update templates"
  ON public.intake_communication_templates
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

CREATE POLICY "Super admins can delete templates"
  ON public.intake_communication_templates
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'systems_admin'::app_role)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_communication_templates TO authenticated;
GRANT ALL ON public.intake_communication_templates TO service_role;

-- 3) Seed the 13 registry entries. ON CONFLICT DO NOTHING keeps existing rows intact.
INSERT INTO public.intake_communication_templates
  (template_key, channel, display_name, description, used_in, subject, body, provider, stage, use_case, team, merge_fields, is_active)
VALUES
  ('intake-packet', 'email', 'Send Intake Packet',
   'First packet sent to a new family after qualification.',
   'Lead drawer → Send Intake Packet',
   'Your Blossom ABA intake packet for {{patient_first_name}}',
   $body$Hi {{parent_first_name}},

Thanks for reaching out about {{patient_first_name}} — we're excited to help. I've attached your intake packet below. When you have a moment, please fill it out and reply with anything you'd like us to know.

If you have any questions, just reply to this email — I'm happy to walk you through it.

Warmly,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_qualified', 'intake_packet', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('missing-info-reminder', 'email', 'Missing Info Reminder',
   'Gentle nudge when an intake packet is missing fields or documents.',
   'Intake → Packet Follow Up / Missing Info',
   'Quick follow-up on {{patient_first_name}}''s intake',
   $body$Hi {{parent_first_name}},

Just checking back in on {{patient_first_name}}'s intake. There are a couple of items we still need to move forward — would you mind sending those over when you get a chance?

If anything is unclear, reply here and I'll walk you through it.

Thanks so much,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_in_progress', 'missing_info', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('vob-update', 'email', 'Benefits Verification Update',
   'Share the result of benefits verification with the family.',
   'Benefits Verification workspace',
   'Benefits update for {{patient_first_name}}',
   $body$Hi {{parent_first_name}},

I wanted to share where we are with {{patient_first_name}}'s benefits verification. Here's what we've confirmed so far — let me know if you have any questions.

Thanks,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'vob', 'benefits_update', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('general-follow-up', 'email', 'General Follow-Up',
   'Open-ended check-in when no specific template fits.',
   'Lead drawer → Send Email',
   'Checking in on {{patient_first_name}}',
   $body$Hi {{parent_first_name}},

Just checking in to see how things are going on your end. Let me know if there's anything we can do to help move {{patient_first_name}}'s start forward.

Talk soon,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'any', 'general_follow_up', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('document-request-insurance-card', 'email', 'Request: Insurance Card',
   'Ask the family to send a photo or PDF of their insurance card.',
   'Lead drawer → Documents → Request Insurance Card',
   'Could you send {{patient_first_name}}''s insurance card?',
   $body$Hi {{parent_first_name}},

It was great connecting about {{patient_first_name}}. To keep the intake moving, could you send over a quick photo or PDF of the front and back of your insurance card when you get a moment? You can reply directly to this email with it attached.

Thanks so much — let me know if anything else comes up.
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_in_progress', 'document_request', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('document-request-diagnosis', 'email', 'Request: Diagnosis Documentation',
   'Request the formal diagnosis paperwork from the family.',
   'Lead drawer → Documents → Request Diagnosis',
   'Diagnosis documentation for {{patient_first_name}}',
   $body$Hi {{parent_first_name}},

To get {{patient_first_name}} ready for services, we need a copy of the formal diagnosis report (usually from your pediatrician or evaluating clinician). Could you send that over when you have a chance? A PDF or clear photo works perfectly.

Thanks so much,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_in_progress', 'document_request', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('document-request-consent-form', 'email', 'Request: Consent Form',
   'Reminder to sign and return the consent form.',
   'Lead drawer → Documents → Request Consent Form',
   'Consent form for {{patient_first_name}}',
   $body$Hi {{parent_first_name}},

Just a quick reminder on the consent form for {{patient_first_name}}. Whenever you have a few minutes, please sign and send it back so we can move to the next step.

Reply if you'd like me to resend the link.

Thanks,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_in_progress', 'document_request', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('document-request-intake-packet', 'email', 'Request: Intake Packet',
   'Nudge to complete the intake packet that was already sent.',
   'Lead drawer → Documents → Request Intake Packet',
   'Following up on {{patient_first_name}}''s intake packet',
   $body$Hi {{parent_first_name}},

Following up on the intake packet I sent for {{patient_first_name}}. When you get a moment, could you finish it up and send it back? Happy to jump on a quick call if anything is confusing.

Thanks so much,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_in_progress', 'document_request', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('document-request-generic', 'email', 'Request: Document (Generic)',
   'Fallback request when the document type isn''t one of the known ones.',
   'Lead drawer → Documents → Request',
   'Quick document request for {{patient_first_name}}',
   $body$Hi {{parent_first_name}},

We're missing one item to keep {{patient_first_name}}'s intake moving — could you send it over when you get a moment? A PDF or clear photo is perfect.

Thanks so much,
{{intake_coordinator_name}}
Blossom ABA Therapy$body$,
   'Mailchimp Email', 'intake_in_progress', 'document_request', 'intake',
   '["parent_first_name","patient_first_name","intake_coordinator_name"]'::jsonb, true),

  ('missing-info-reminder', 'sms', 'Missing Info Reminder (SMS)',
   'Short text nudge for missing intake info.',
   'Intake → Packet Follow Up / Missing Info',
   NULL,
   $body$Hi {{parent_first_name}} — Blossom ABA here. We're still missing a couple of items to move {{patient_first_name}}'s intake forward. Reply here when you can!$body$,
   'Mailchimp SMS', 'intake_in_progress', 'missing_info', 'intake',
   '["parent_first_name","patient_first_name"]'::jsonb, true),

  ('appointment-confirmation', 'sms', 'Appointment Confirmation (SMS)',
   'Confirms an upcoming assessment or session.',
   'Scheduling → Assessment confirmation',
   NULL,
   $body$Hi {{parent_first_name}} — confirming {{patient_first_name}}'s appointment on {{appointment_date}}. Reply YES to confirm or call us to reschedule.$body$,
   'Mailchimp SMS', 'scheduled', 'appointment', 'scheduling',
   '["parent_first_name","patient_first_name","appointment_date"]'::jsonb, true),

  ('intake-packet-reminder', 'sms', 'Intake Packet Reminder (SMS)',
   'Nudge after intake packet has been sent.',
   'Lead drawer → Quick reminder',
   NULL,
   $body$Hi {{parent_first_name}} — just a friendly reminder to finish {{patient_first_name}}'s intake packet when you get a sec. Let us know if you need help!$body$,
   'Mailchimp SMS', 'intake_in_progress', 'intake_packet', 'intake',
   '["parent_first_name","patient_first_name"]'::jsonb, true),

  ('general-follow-up', 'sms', 'General Follow-Up (SMS)',
   'Generic check-in text.',
   'Lead drawer → Send Text',
   NULL,
   $body$Hi {{parent_first_name}} — checking in on {{patient_first_name}}. Let us know if we can help with anything!$body$,
   'Mailchimp SMS', 'any', 'general_follow_up', 'intake',
   '["parent_first_name","patient_first_name"]'::jsonb, true)
ON CONFLICT (channel, template_key) DO NOTHING;