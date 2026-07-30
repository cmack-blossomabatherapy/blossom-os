CREATE OR REPLACE FUNCTION public.initialize_rbt_preboarding(_employee_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inserted integer := 0; emp_state text;
BEGIN
  SELECT state INTO emp_state FROM public.employees WHERE id = _employee_id;
  INSERT INTO public.rbt_preboarding_items (employee_id, requirement_key, owner_role, due_at)
  SELECT _employee_id, r.key, r.owner_role,
         CASE WHEN r.default_due_offset_days IS NOT NULL THEN now() + (r.default_due_offset_days || ' days')::interval END
  FROM public.rbt_preboarding_requirements r
  WHERE r.is_active = true
    AND (r.applies_to_states IS NULL OR array_length(r.applies_to_states,1) IS NULL OR emp_state = ANY(r.applies_to_states))
  ON CONFLICT (employee_id, requirement_key) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$function$;