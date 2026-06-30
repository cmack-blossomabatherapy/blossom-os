-- Expand write access to the actual Credentialing Team
CREATE OR REPLACE FUNCTION public.has_credentialing_write_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN (
        'admin','super_admin','systems_admin',
        'credentialing_lead','credentialing_team',
        'credentialing','credentialing_coordinator'
      )
  );
$$;

-- Owner name columns (owner_id preserved for future user linking)
ALTER TABLE public.credentialing_records
  ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.credentialing_tasks
  ADD COLUMN IF NOT EXISTS owner_name text;

CREATE INDEX IF NOT EXISTS idx_cred_records_owner_name
  ON public.credentialing_records(owner_name);
CREATE INDEX IF NOT EXISTS idx_cred_tasks_owner_name
  ON public.credentialing_tasks(owner_name);
