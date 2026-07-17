
-- Fix Security Definer view: recreate with security_invoker so RLS on underlying tables applies to the calling user
CREATE OR REPLACE VIEW public.rbt_assigned_clients_min_v
WITH (security_invoker = true) AS
SELECT a.rbt_employee_id AS employee_id,
    a.client_id,
    COALESCE(NULLIF(regexp_replace(upper(array_to_string(ARRAY( SELECT "left"(part.part, 1) AS "left"
           FROM regexp_split_to_table(COALESCE(c.child_name, a.client_name, ''::text), '\s+'::text) part(part)
          WHERE length(part.part) > 0), ''::text)), '[^A-Z]'::text, ''::text, 'g'::text), ''::text), 'C'::text) AS client_initials,
    a.authorized_service_codes,
    a.clinic,
    a.state,
    a.start_date,
    a.status,
    a.assigned_bcba_id
   FROM public.rbt_client_assignments a
     LEFT JOIN public.clients c ON c.id = a.client_id;
