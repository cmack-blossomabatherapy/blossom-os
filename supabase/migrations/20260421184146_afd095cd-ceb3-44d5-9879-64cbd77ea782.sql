-- Add editable team-info fields to profiles (job title, responsibilities, contact email mirror, welcome-email tracking)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS responsibilities text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS welcome_sent_by uuid;

-- Backfill profile.email from auth.users for existing rows
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

-- Update handle_new_user to also store the email on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _invited_role public.app_role;
  _must_change boolean := false;
BEGIN
  _invited_role := NULLIF(NEW.raw_user_meta_data->>'invited_role', '')::public.app_role;
  IF (NEW.raw_user_meta_data->>'must_change_password') = 'true' THEN
    _must_change := true;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, email, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    _must_change
  );

  IF _invited_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _invited_role);
  ELSIF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  END IF;

  RETURN NEW;
END;
$function$;

-- Allow admins to edit any profile (name, title, responsibilities, welcome tracking)
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));