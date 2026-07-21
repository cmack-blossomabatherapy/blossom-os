
-- 1. Config table --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intake_operating_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'INGEST_ONLY'
    CHECK (mode IN ('INGEST_ONLY','FULL')),
  note text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  singleton boolean NOT NULL DEFAULT true UNIQUE
);

GRANT SELECT ON public.intake_operating_mode TO authenticated;
GRANT ALL ON public.intake_operating_mode TO service_role;

ALTER TABLE public.intake_operating_mode ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intake_mode read authenticated" ON public.intake_operating_mode;
CREATE POLICY "intake_mode read authenticated"
  ON public.intake_operating_mode FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "intake_mode admin write" ON public.intake_operating_mode;
CREATE POLICY "intake_mode admin write"
  ON public.intake_operating_mode FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Seed exactly one row (idempotent).
INSERT INTO public.intake_operating_mode (mode, note)
SELECT 'INGEST_ONLY', 'Default preview-only mode. Ingest allowed; outbound actions blocked.'
WHERE NOT EXISTS (SELECT 1 FROM public.intake_operating_mode);

-- 2. Helper --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.intake_actions_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT mode = 'FULL' FROM public.intake_operating_mode ORDER BY created_at ASC LIMIT 1),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.intake_actions_enabled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intake_actions_enabled() TO authenticated, service_role;

-- 3. Guard trigger on intake_communications ------------------------------
CREATE OR REPLACE FUNCTION public.enforce_intake_actions_enabled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_outbound boolean;
BEGIN
  -- Only guard outbound. Inbound webhook ingestion is always allowed.
  is_outbound := COALESCE(lower(NEW.direction), 'outbound') <> 'inbound';
  IF is_outbound AND NOT public.intake_actions_enabled() THEN
    RAISE EXCEPTION 'intake_actions_disabled: Intake is in INGEST_ONLY mode. Outbound communications are blocked.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_intake_actions_enabled() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_intake_actions_enabled ON public.intake_communications;
CREATE TRIGGER trg_enforce_intake_actions_enabled
  BEFORE INSERT ON public.intake_communications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_intake_actions_enabled();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_intake_operating_mode_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_intake_operating_mode_touch ON public.intake_operating_mode;
CREATE TRIGGER trg_intake_operating_mode_touch
  BEFORE UPDATE ON public.intake_operating_mode
  FOR EACH ROW EXECUTE FUNCTION public.tg_intake_operating_mode_touch();
