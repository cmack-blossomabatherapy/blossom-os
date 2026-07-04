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
  v_event_exists boolean;
  v_company_exists boolean;
  v_contact_company uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.can_act_on_bd_source_events(v_uid) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF _event_id IS NULL THEN
    RAISE EXCEPTION 'event id required';
  END IF;
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'company id required';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.marketing_source_events WHERE id = _event_id)
    INTO v_event_exists;
  IF NOT v_event_exists THEN
    RAISE EXCEPTION 'source event % not found', _event_id;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.referral_companies WHERE id = _company_id)
    INTO v_company_exists;
  IF NOT v_company_exists THEN
    RAISE EXCEPTION 'referral partner % not found', _company_id;
  END IF;

  IF _contact_id IS NOT NULL THEN
    SELECT company_id INTO v_contact_company
      FROM public.referral_contacts
     WHERE id = _contact_id;
    IF v_contact_company IS NULL THEN
      RAISE EXCEPTION 'referral contact % not found', _contact_id;
    END IF;
    IF v_contact_company <> _company_id THEN
      RAISE EXCEPTION 'referral contact % does not belong to partner %', _contact_id, _company_id;
    END IF;
  END IF;

  UPDATE public.marketing_source_events
     SET referral_company_id = _company_id,
         referral_contact_id = COALESCE(_contact_id, referral_contact_id),
         status = CASE
           WHEN status IN ('new','received','assigned','') OR status IS NULL THEN 'linked'
           ELSE status
         END,
         sync_status = 'linked',
         updated_at = now()
   WHERE id = _event_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bd_link_source_event_to_referral(uuid, uuid, uuid) TO authenticated;