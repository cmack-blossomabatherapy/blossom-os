
CREATE TABLE IF NOT EXISTS public.phone_system_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_system_state TO authenticated;
GRANT ALL ON public.phone_system_state TO service_role;

ALTER TABLE public.phone_system_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read phone system"
  ON public.phone_system_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert phone system"
  ON public.phone_system_state FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update phone system"
  ON public.phone_system_state FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete phone system"
  ON public.phone_system_state FOR DELETE
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.phone_system_state_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS phone_system_state_touch ON public.phone_system_state;
CREATE TRIGGER phone_system_state_touch
BEFORE INSERT OR UPDATE ON public.phone_system_state
FOR EACH ROW EXECUTE FUNCTION public.phone_system_state_touch();

ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_system_state;
