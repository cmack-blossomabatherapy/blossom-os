
-- RPC: record a sign-in event for the current user's employee
CREATE OR REPLACE FUNCTION public.log_sign_in()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _emp_id uuid;
  _name text;
  _last timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT id, NULLIF(trim(concat_ws(' ', first_name, last_name)), '')
    INTO _emp_id, _name
  FROM public.employees
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF _emp_id IS NULL THEN RETURN; END IF;

  -- De-dupe: skip if we already logged a sign-in for this user in the last 60 seconds
  SELECT max(created_at) INTO _last
  FROM public.employee_timeline
  WHERE employee_id = _emp_id AND event_type = 'signed_in';

  IF _last IS NOT NULL AND _last > now() - interval '60 seconds' THEN
    RETURN;
  END IF;

  INSERT INTO public.employee_timeline
    (employee_id, event_type, description, metadata, created_by, created_by_name)
  VALUES
    (_emp_id, 'signed_in', 'Signed in to Blossom OS',
     jsonb_build_object('user_id', auth.uid()),
     auth.uid(), _name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sign_in() TO authenticated;

-- Backfill: insert the last known sign-in from auth.users for each employee
INSERT INTO public.employee_timeline (employee_id, event_type, description, metadata, created_at, created_by, created_by_name)
SELECT e.id,
       'signed_in',
       'Signed in to Blossom OS',
       jsonb_build_object('user_id', u.id, 'source', 'backfill'),
       u.last_sign_in_at,
       u.id,
       NULLIF(trim(concat_ws(' ', e.first_name, e.last_name)), '')
FROM auth.users u
JOIN public.employees e ON e.user_id = u.id
WHERE u.last_sign_in_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.employee_timeline t
    WHERE t.employee_id = e.id
      AND t.event_type = 'signed_in'
      AND t.created_at = u.last_sign_in_at
  );
