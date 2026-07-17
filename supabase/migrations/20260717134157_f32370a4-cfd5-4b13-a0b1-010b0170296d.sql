
CREATE OR REPLACE FUNCTION public._training_status_rank(_s text)
 RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $function$
  SELECT CASE _s WHEN 'completed' THEN 3 WHEN 'in_progress' THEN 2 WHEN 'overdue' THEN 1 ELSE 0 END
$function$;

CREATE OR REPLACE FUNCTION public.bcba_normalize_client_name(_name text)
 RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $function$ SELECT lower(regexp_replace(coalesce(_name, ''), '\s+', ' ', 'g')); $function$;

CREATE OR REPLACE FUNCTION public.rbt_preboarding_touch()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.rbt_touch_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END $function$;

CREATE OR REPLACE FUNCTION public.set_updated_at_access_requests()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.tg_knowledge_documents_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;
