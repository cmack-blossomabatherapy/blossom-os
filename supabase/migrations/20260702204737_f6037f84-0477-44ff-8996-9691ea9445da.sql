
-- Allow-list helper for BD source-event actions.
CREATE OR REPLACE FUNCTION public.can_act_on_bd_source_events(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_access_marketing(_uid)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _uid
          AND role::text IN ('business_development','marketing_growth_lead')
      );
$$;

GRANT EXECUTE ON FUNCTION public.can_act_on_bd_source_events(uuid) TO authenticated, service_role;

-- Assign a source event to the current user.
CREATE OR REPLACE FUNCTION public.bd_assign_source_event(_event_id uuid)
RETURNS public.marketing_source_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketing_source_events;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.can_act_on_bd_source_events(v_uid) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.marketing_source_events
     SET assigned_to = v_uid,
         assigned_at = now(),
         status = CASE
           WHEN status IN ('new','received','') OR status IS NULL THEN 'assigned'
           ELSE status
         END,
         updated_at = now()
   WHERE id = _event_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'source event % not found', _event_id;
  END IF;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bd_assign_source_event(uuid) TO authenticated;

-- Mark a source event reviewed.
CREATE OR REPLACE FUNCTION public.bd_mark_source_event_reviewed(_event_id uuid)
RETURNS public.marketing_source_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketing_source_events;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.can_act_on_bd_source_events(v_uid) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.marketing_source_events
     SET reviewed_by = v_uid,
         reviewed_at = now(),
         status = 'reviewed',
         updated_at = now()
   WHERE id = _event_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'source event % not found', _event_id;
  END IF;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bd_mark_source_event_reviewed(uuid) TO authenticated;

-- Link a source event to an existing referral company (and optional contact).
CREATE OR REPLACE FUNCTION public.bd_link_source_event_to_referral(
  _event_id uuid,
  _company_id uuid,
  _contact_id uuid DEFAULT NULL
)
RETURNS public.marketing_source_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketing_source_events;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.can_act_on_bd_source_events(v_uid) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'company id required';
  END IF;

  UPDATE public.marketing_source_events
     SET referral_company_id = _company_id,
         referral_contact_id = COALESCE(_contact_id, referral_contact_id),
         status = CASE
           WHEN status IN ('new','received','assigned','') OR status IS NULL THEN 'linked'
           ELSE status
         END,
         sync_status = COALESCE(sync_status, 'linked'),
         updated_at = now()
   WHERE id = _event_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'source event % not found', _event_id;
  END IF;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bd_link_source_event_to_referral(uuid, uuid, uuid) TO authenticated;
