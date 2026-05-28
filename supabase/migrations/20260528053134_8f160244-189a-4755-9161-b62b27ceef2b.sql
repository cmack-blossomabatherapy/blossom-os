
-- ============ 1. EXTEND EXISTING TABLES ============
ALTER TABLE public.evaluation_meetings
  ADD COLUMN IF NOT EXISTS meeting_type text,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS attendees text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS follow_up_actions text;

ALTER TABLE public.evaluation_emails
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS scheduled_send_at timestamptz;

-- Allow Cancelled status
ALTER TABLE public.evaluation_emails DROP CONSTRAINT IF EXISTS evaluation_emails_status_check;
ALTER TABLE public.evaluation_emails ADD CONSTRAINT evaluation_emails_status_check
  CHECK (status = ANY (ARRAY['Draft','Queued','Sent','Failed','Cancelled']));

-- ============ 2. FORM TOKENS ============
CREATE TABLE IF NOT EXISTS public.evaluation_form_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  form_id uuid REFERENCES public.evaluation_forms(id) ON DELETE SET NULL,
  response_type text NOT NULL CHECK (response_type IN ('Self','Leadership')),
  recipient_email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eval_form_tokens_eval ON public.evaluation_form_tokens(evaluation_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_form_tokens TO authenticated;
GRANT ALL ON public.evaluation_form_tokens TO service_role;

ALTER TABLE public.evaluation_form_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth full evaluation_form_tokens" ON public.evaluation_form_tokens
  TO authenticated USING (true) WITH CHECK (true);

-- ============ 3. EMAIL TEMPLATES ============
CREATE TABLE IF NOT EXISTS public.evaluation_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  email_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_email_templates TO authenticated;
GRANT ALL ON public.evaluation_email_templates TO service_role;

ALTER TABLE public.evaluation_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth full evaluation_email_templates" ON public.evaluation_email_templates
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_eval_email_templates_updated
  BEFORE UPDATE ON public.evaluation_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 4. SEED EMAIL TEMPLATES ============
INSERT INTO public.evaluation_email_templates (template_key, name, email_type, subject, body) VALUES
('self_request', 'Self Evaluation Request', 'Self Evaluation',
 'Blossom ABA Evaluation Request: {{evaluation_type}} Self Evaluation',
 E'Hi {{employee_first_name}},\n\nIt is time to complete your {{evaluation_type}} self-evaluation for Blossom ABA Therapy.\n\nPlease complete your self-evaluation using the secure link below:\n\n{{form_link}}\n\nDue Date: {{due_date}}\n\nThank you,\nBlossom ABA Therapy'),
('self_reminder', 'Self Evaluation Reminder', 'Self Evaluation Reminder',
 'Reminder: Your {{evaluation_type}} Self Evaluation is due {{due_date}}',
 E'Hi {{employee_first_name}},\n\nThis is a friendly reminder to complete your {{evaluation_type}} self-evaluation.\n\nSecure link: {{form_link}}\nDue: {{due_date}}\n\nThank you,\nBlossom ABA Therapy'),
('leadership_request', 'Leadership Evaluation Request', 'Leadership Evaluation',
 'Leadership Evaluation Needed: {{employee_full_name}}',
 E'Hi {{reviewer_name}},\n\nA leadership evaluation is ready for {{employee_full_name}}.\n\nPlease complete the leadership review using the secure link below:\n\n{{form_link}}\n\nDue Date: {{due_date}}\n\nThank you,\nBlossom ABA Therapy'),
('leadership_reminder', 'Leadership Evaluation Reminder', 'Leadership Evaluation Reminder',
 'Reminder: Leadership review for {{employee_full_name}} is due {{due_date}}',
 E'Hi {{reviewer_name}},\n\nReminder: please complete the leadership evaluation for {{employee_full_name}}.\n\nLink: {{form_link}}\nDue: {{due_date}}\n\nThank you,\nBlossom ABA Therapy'),
('meeting_scheduled', 'Evaluation Meeting Scheduled', 'Meeting',
 'Evaluation Meeting Scheduled: {{evaluation_type}}',
 E'Hi {{employee_first_name}},\n\nYour {{evaluation_type}} evaluation meeting has been scheduled.\n\nMeeting link: {{meeting_link}}\nReviewer: {{reviewer_name}}\n\nThank you,\nBlossom ABA Therapy'),
('overdue_notice', 'Evaluation Overdue Notice', 'Overdue',
 'Overdue: {{evaluation_type}} evaluation for {{employee_full_name}}',
 E'Hi {{employee_first_name}},\n\nYour {{evaluation_type}} evaluation is now past its due date of {{due_date}}.\n\nPlease complete it as soon as possible: {{form_link}}\n\nThank you,\nBlossom ABA Therapy'),
('completed_notice', 'Evaluation Completed Notice', 'Completed',
 'Your {{evaluation_type}} evaluation is complete',
 E'Hi {{employee_first_name}},\n\nYour {{evaluation_type}} evaluation has been finalized. Thank you for your work this cycle.\n\nBlossom ABA Therapy')
ON CONFLICT (template_key) DO NOTHING;

-- ============ 5. SEED 8 FORM TEMPLATES ============
-- helper to construct standardized JSON
WITH bcba_competencies AS (
  SELECT jsonb_build_array(
    'Clinical documentation','Treatment plan quality','Parent communication','RBT supervision',
    'Compliance with Blossom standards','Timeliness','Collaboration','Professionalism',
    'Caseload management','Data-driven decision making'
  ) AS items
), rbt_competencies AS (
  SELECT jsonb_build_array(
    'Attendance and reliability','Session preparedness','Implementation of treatment plans',
    'Data collection accuracy','Communication with BCBA','Parent/family professionalism',
    'Client engagement','Following supervision feedback','Documentation timeliness','Professional conduct'
  ) AS items
), self_open AS (
  SELECT jsonb_build_array(
    'What went well this evaluation period?',
    'What challenges did you experience?',
    'What support would help you perform better?',
    'What goals do you want to focus on next?',
    'Is there anything leadership should know?'
  ) AS items
), leadership_open AS (
  SELECT jsonb_build_array(
    'Strengths observed',
    'Areas needing improvement',
    'Specific examples',
    'Recommended goals',
    'Support plan or coaching needed',
    'Final leadership notes'
  ) AS items
), annual_extra AS (
  SELECT jsonb_build_array(
    'Overall yearly performance summary',
    'Growth over the past year',
    'Major accomplishments',
    'Recurring concerns',
    'Recommended compensation/promotion notes (HR/Exec only)',
    'Annual development plan'
  ) AS items
)
INSERT INTO public.evaluation_forms (name, staff_role, evaluation_type, form_type, questions_json)
SELECT v.name, v.staff_role, v.evaluation_type, v.form_type,
  jsonb_build_object('sections',
    jsonb_build_array(
      jsonb_build_object('title','Performance Ratings','type','ratings',
        'description','1=Needs Immediate Improvement, 2=Developing, 3=Meets Expectations, 4=Exceeds Expectations, 5=Exceptional',
        'items', CASE WHEN v.staff_role='BCBA' THEN (SELECT items FROM bcba_competencies) ELSE (SELECT items FROM rbt_competencies) END),
      jsonb_build_object('title', CASE WHEN v.form_type='Self' THEN 'Self Reflection' ELSE 'Leadership Notes' END,
        'type','longtext',
        'items', CASE WHEN v.form_type='Self' THEN (SELECT items FROM self_open) ELSE (SELECT items FROM leadership_open) END)
    ) ||
    CASE WHEN v.evaluation_type='Annual' THEN
      jsonb_build_array(jsonb_build_object('title','Annual Summary','type','longtext','items',(SELECT items FROM annual_extra)))
    ELSE '[]'::jsonb END ||
    jsonb_build_array(jsonb_build_object('title','Acknowledgment','type','acknowledgment'))
  )
FROM (VALUES
  ('BCBA Quarterly Self Evaluation','BCBA','Quarterly','Self'),
  ('BCBA Annual Self Evaluation','BCBA','Annual','Self'),
  ('BCBA Quarterly Leadership Evaluation','BCBA','Quarterly','Leadership'),
  ('BCBA Annual Leadership Evaluation','BCBA','Annual','Leadership'),
  ('RBT Quarterly Self Evaluation','RBT','Quarterly','Self'),
  ('RBT Annual Self Evaluation','RBT','Annual','Self'),
  ('RBT Quarterly Leadership Evaluation','RBT','Quarterly','Leadership'),
  ('RBT Annual Leadership Evaluation','RBT','Annual','Leadership')
) AS v(name, staff_role, evaluation_type, form_type)
WHERE NOT EXISTS (SELECT 1 FROM public.evaluation_forms ef WHERE ef.name = v.name);

-- ============ 6. PUBLIC RPCS FOR TOKEN-BASED FORMS ============
CREATE OR REPLACE FUNCTION public.get_eval_form_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.evaluation_form_tokens%ROWTYPE;
  e public.evaluations%ROWTYPE;
  s public.evaluation_staff%ROWTYPE;
  c public.evaluation_cycles%ROWTYPE;
  f public.evaluation_forms%ROWTYPE;
  reviewer public.evaluation_staff%ROWTYPE;
  due_date date;
BEGIN
  SELECT * INTO t FROM public.evaluation_form_tokens WHERE id = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
  IF t.expires_at < now() THEN RETURN jsonb_build_object('error','expired'); END IF;

  SELECT * INTO e FROM public.evaluations WHERE id = t.evaluation_id;
  SELECT * INTO s FROM public.evaluation_staff WHERE id = e.staff_id;
  IF e.cycle_id IS NOT NULL THEN SELECT * INTO c FROM public.evaluation_cycles WHERE id = e.cycle_id; END IF;

  IF t.form_id IS NOT NULL THEN
    SELECT * INTO f FROM public.evaluation_forms WHERE id = t.form_id;
  ELSE
    SELECT * INTO f FROM public.evaluation_forms
      WHERE staff_role = s.role AND evaluation_type = e.evaluation_type AND form_type = t.response_type
      ORDER BY active_status DESC LIMIT 1;
  END IF;

  IF s.supervisor_id IS NOT NULL THEN
    SELECT * INTO reviewer FROM public.evaluation_staff WHERE id = s.supervisor_id;
  END IF;

  due_date := CASE
    WHEN t.response_type = 'Self' THEN COALESCE(c.self_due_date, e.next_review_date)
    ELSE COALESCE(c.leadership_due_date, e.next_review_date)
  END;

  RETURN jsonb_build_object(
    'token_id', t.id,
    'response_type', t.response_type,
    'used_at', t.used_at,
    'employee', jsonb_build_object(
      'first_name', s.first_name, 'last_name', s.last_name,
      'role', s.role, 'state', s.state, 'email', s.email
    ),
    'reviewer_name', COALESCE(reviewer.first_name || ' ' || reviewer.last_name, s.supervisor_id::text),
    'evaluation', jsonb_build_object(
      'id', e.id, 'evaluation_type', e.evaluation_type,
      'self_status', e.self_status, 'leadership_status', e.leadership_status
    ),
    'cycle_name', COALESCE(c.name, 'Ad-hoc cycle'),
    'due_date', due_date,
    'form', jsonb_build_object('id', f.id, 'name', f.name, 'questions_json', f.questions_json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eval_form_by_token(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_eval_form_response(
  p_token uuid,
  p_answers jsonb,
  p_signature text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.evaluation_form_tokens%ROWTYPE;
  e public.evaluations%ROWTYPE;
  s public.evaluation_staff%ROWTYPE;
  reviewer public.evaluation_staff%ROWTYPE;
  new_response_id uuid;
  full_answers jsonb;
BEGIN
  SELECT * INTO t FROM public.evaluation_form_tokens WHERE id = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
  IF t.expires_at < now() THEN RETURN jsonb_build_object('error','expired'); END IF;
  IF t.used_at IS NOT NULL THEN RETURN jsonb_build_object('error','already_submitted'); END IF;

  SELECT * INTO e FROM public.evaluations WHERE id = t.evaluation_id;
  SELECT * INTO s FROM public.evaluation_staff WHERE id = e.staff_id;

  full_answers := COALESCE(p_answers, '{}'::jsonb)
    || jsonb_build_object('signature', p_signature, 'signed_at', now());

  INSERT INTO public.evaluation_responses
    (evaluation_id, form_id, response_type, respondent_email, answers_json)
  VALUES (t.evaluation_id, t.form_id, t.response_type, t.recipient_email, full_answers)
  RETURNING id INTO new_response_id;

  UPDATE public.evaluation_form_tokens SET used_at = now() WHERE id = t.id;

  IF t.response_type = 'Self' THEN
    UPDATE public.evaluations
      SET self_status = 'Completed',
          leadership_status = CASE WHEN leadership_status = 'Not Started' THEN 'Not Started' ELSE leadership_status END,
          final_status = CASE WHEN final_status = 'Not Started' THEN 'In Progress' ELSE final_status END
      WHERE id = e.id;

    -- auto-queue leadership email if supervisor exists
    IF s.supervisor_id IS NOT NULL THEN
      SELECT * INTO reviewer FROM public.evaluation_staff WHERE id = s.supervisor_id;
      IF reviewer.email IS NOT NULL THEN
        INSERT INTO public.evaluation_emails
          (evaluation_id, staff_id, cycle_id, recipient_email, email_type, subject, body, template_key, status)
        VALUES (
          e.id, s.id, e.cycle_id, reviewer.email, 'Leadership Evaluation',
          'Leadership Evaluation Needed: ' || s.first_name || ' ' || s.last_name,
          'Hi ' || reviewer.first_name || E',\n\nA leadership evaluation is ready for '
            || s.first_name || ' ' || s.last_name
            || E'. Open the secure link from the Evaluations workspace to complete the review.\n\nThank you,\nBlossom ABA Therapy',
          'leadership_request', 'Queued'
        );
      END IF;
    END IF;
  ELSE
    UPDATE public.evaluations
      SET leadership_status = 'Completed',
          meeting_status = CASE WHEN meeting_status = 'Not Scheduled' THEN 'Not Scheduled' ELSE meeting_status END,
          final_status = CASE WHEN final_status <> 'Complete' THEN 'Needs Meeting' ELSE final_status END
      WHERE id = e.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'response_id', new_response_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_eval_form_response(uuid, jsonb, text) TO anon, authenticated;
