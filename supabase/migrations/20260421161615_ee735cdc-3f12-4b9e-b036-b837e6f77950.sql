-- Add must_change_password flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Update handle_new_user to respect pending invites (role + must_change_password)
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
  -- Pull metadata set by admin-invite edge function
  _invited_role := NULLIF(NEW.raw_user_meta_data->>'invited_role', '')::public.app_role;
  IF (NEW.raw_user_meta_data->>'must_change_password') = 'true' THEN
    _must_change := true;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow users to clear their own must_change_password flag (UPDATE policy already lets them update their own profile)
-- No new policy needed: existing "Users update their own profile" covers it.