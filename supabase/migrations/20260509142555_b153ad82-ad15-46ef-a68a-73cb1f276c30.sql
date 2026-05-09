
-- Access requests table for admin approval workflow
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  clinic TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_requests_status ON public.access_requests(status, created_at DESC);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Admin/HR allowlist function (mirrors src/lib/adminAccess.ts during rollout)
CREATE OR REPLACE FUNCTION public.is_access_request_reviewer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _has_role BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT lower(email) INTO _email FROM auth.users WHERE id = _user_id;
  IF _email IN ('testhr@blossomabatherapy.com','cmack@blossomabatherapy.com','hr@blossomabatherapy.com') THEN
    RETURN TRUE;
  END IF;

  -- If a user_roles table exists, also allow admin/hr roles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_roles') THEN
    EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role::text IN (''admin'',''hr'',''hr_admin'',''hr_manager'',''exec'',''ops_manager'',''training_admin''))'
      INTO _has_role USING _user_id;
    IF _has_role THEN RETURN TRUE; END IF;
  END IF;

  RETURN FALSE;
END;
$$;

CREATE POLICY "Reviewers can view access requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (public.is_access_request_reviewer(auth.uid()));

CREATE POLICY "Reviewers can update access requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (public.is_access_request_reviewer(auth.uid()))
WITH CHECK (public.is_access_request_reviewer(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_access_requests()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_access_requests();
