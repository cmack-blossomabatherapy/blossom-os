-- Search active evaluation staff for the reviewer picker on the public form.
-- Token-gated so this can't be used to scrape staff anonymously.
CREATE OR REPLACE FUNCTION public.search_eval_reviewers(p_token uuid, p_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.evaluation_form_tokens%ROWTYPE;
  q text;
BEGIN
  SELECT * INTO t FROM public.evaluation_form_tokens WHERE id = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
  IF t.expires_at < now() THEN RETURN jsonb_build_object('error','expired'); END IF;

  q := '%' || lower(coalesce(p_query, '')) || '%';

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', s.id,
      'first_name', s.first_name,
      'last_name', s.last_name,
      'role', s.role,
      'state', s.state,
      'email', s.email
    ) ORDER BY s.first_name, s.last_name)
    FROM (
      SELECT * FROM public.evaluation_staff
      WHERE active_status = true
        AND (
          lower(first_name) LIKE q
          OR lower(last_name) LIKE q
          OR lower(first_name || ' ' || last_name) LIKE q
          OR lower(email) LIKE q
        )
      ORDER BY first_name, last_name
      LIMIT 20
    ) s
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_eval_reviewers(uuid, text) TO anon, authenticated;

-- Updated submit function: accepts reviewer id, records it on the evaluation
-- and stores reviewer display name into answers_json so the PDF can render it.
CREATE OR REPLACE FUNCTION public.submit_eval_form_response(
  p_token uuid,
  p_answers jsonb,
  p_signature text DEFAULT NULL,
  p_reviewer_id uuid DEFAULT NULL
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
  picked_reviewer public.evaluation_staff%ROWTYPE;
  new_response_id uuid;
  full_answers jsonb;
BEGIN
  SELECT * INTO t FROM public.evaluation_form_tokens WHERE id = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','invalid_token'); END IF;
  IF t.expires_at < now() THEN RETURN jsonb_build_object('error','expired'); END IF;
  IF t.used_at IS NOT NULL THEN RETURN jsonb_build_object('error','already_submitted'); END IF;

  SELECT * INTO e FROM public.evaluations WHERE id = t.evaluation_id;
  SELECT * INTO s FROM public.evaluation_staff WHERE id = e.staff_id;

  IF p_reviewer_id IS NOT NULL THEN
    SELECT * INTO picked_reviewer FROM public.evaluation_staff WHERE id = p_reviewer_id;
  END IF;

  full_answers := COALESCE(p_answers, '{}'::jsonb)
    || jsonb_build_object('signature', p_signature, 'signed_at', now());

  IF picked_reviewer.id IS NOT NULL THEN
    full_answers := full_answers || jsonb_build_object(
      'reviewer_id', picked_reviewer.id,
      'reviewer_name', picked_reviewer.first_name || ' ' || picked_reviewer.last_name,
      'reviewer_role', picked_reviewer.role,
      'reviewer_email', picked_reviewer.email
    );
  END IF;

  INSERT INTO public.evaluation_responses
    (evaluation_id, form_id, response_type, respondent_email, answers_json)
  VALUES (
    t.evaluation_id,
    t.form_id,
    t.response_type,
    COALESCE(picked_reviewer.email, t.recipient_email),
    full_answers
  )
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
          final_status = CASE WHEN final_status <> 'Complete' THEN 'Needs Meeting' ELSE final_status END,
          assigned_reviewer_id = COALESCE(p_reviewer_id, assigned_reviewer_id)
      WHERE id = e.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'response_id', new_response_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_eval_form_response(uuid, jsonb, text, uuid) TO anon, authenticated;
-- Keep old 3-arg signature working for any in-flight calls
GRANT EXECUTE ON FUNCTION public.submit_eval_form_response(uuid, jsonb, text) TO anon, authenticated;