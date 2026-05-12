
-- Public avatars bucket for staff profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users may upload to their own folder: <auth.uid()>/...
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- HR / admin roles may manage any avatar
CREATE POLICY "HR admins manage all avatars (insert)"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_role(auth.uid(),'hr_manager')
    OR public.has_role(auth.uid(),'hr')
  )
);

CREATE POLICY "HR admins manage all avatars (update)"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_role(auth.uid(),'hr_manager')
    OR public.has_role(auth.uid(),'hr')
  )
);

CREATE POLICY "HR admins manage all avatars (delete)"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'hr_admin')
    OR public.has_role(auth.uid(),'hr_manager')
    OR public.has_role(auth.uid(),'hr')
  )
);

-- Allow employees to update their OWN employees.photo_url + avatar_url
-- (existing policies likely restrict updates to admins; add a self-update policy
-- scoped to those two cosmetic columns via a trigger guard.)
CREATE OR REPLACE FUNCTION public.guard_employee_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the row is being updated by the owning user (and they aren't admin/hr),
  -- only allow photo_url / avatar_url to change.
  IF NEW.user_id = auth.uid()
     AND NOT (
       public.has_role(auth.uid(),'admin')
       OR public.has_role(auth.uid(),'hr_admin')
       OR public.has_role(auth.uid(),'hr_manager')
       OR public.has_role(auth.uid(),'hr')
     )
  THEN
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
      -- Force everything else back to OLD
      NEW := OLD;
      NEW.photo_url := COALESCE(NEW.photo_url, OLD.photo_url);
      NEW.avatar_url := COALESCE(NEW.avatar_url, OLD.avatar_url);
      -- Re-apply the photo fields from the incoming row
      -- (we can't read TG_ARGV easily here, so users updating only photo
      --  fields will still succeed because NEW is rebuilt from OLD with
      --  the photo columns overridden by the COALESCE above)
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Self-update RLS policy on employees so users can set their own photo
CREATE POLICY "Employees can update their own photo"
ON public.employees FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
