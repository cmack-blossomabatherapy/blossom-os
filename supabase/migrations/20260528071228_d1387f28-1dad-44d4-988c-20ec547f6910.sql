-- 1. Replace get_eval_form_by_token to drop all cycle references
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
  f public.evaluation_forms%ROWTYPE;
  reviewer public.evaluation_staff%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.evaluation_form_tokens WHERE id = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
  IF t.expires_at < now() THEN RETURN jsonb_build_object('error','expired'); END IF;

  SELECT * INTO e FROM public.evaluations WHERE id = t.evaluation_id;
  SELECT * INTO s FROM public.evaluation_staff WHERE id = e.staff_id;

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
    'due_date', e.next_review_date,
    'form', jsonb_build_object('id', f.id, 'name', f.name, 'questions_json', f.questions_json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eval_form_by_token(uuid) TO anon, authenticated;

-- 2. Replace submit_eval_form_response so it no longer inserts cycle_id
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

    IF s.supervisor_id IS NOT NULL THEN
      SELECT * INTO reviewer FROM public.evaluation_staff WHERE id = s.supervisor_id;
      IF reviewer.email IS NOT NULL THEN
        INSERT INTO public.evaluation_emails
          (evaluation_id, staff_id, recipient_email, email_type, subject, body, template_key, status)
        VALUES (
          e.id, s.id, reviewer.email, 'Leadership Evaluation',
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

-- 3. Drop cycle_id columns and the evaluation_cycles table
DROP INDEX IF EXISTS public.idx_evaluations_cycle;
ALTER TABLE public.evaluations       DROP COLUMN IF EXISTS cycle_id;
ALTER TABLE public.evaluation_emails DROP COLUMN IF EXISTS cycle_id;
DROP TABLE IF EXISTS public.evaluation_cycles CASCADE;