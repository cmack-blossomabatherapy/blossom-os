CREATE TABLE IF NOT EXISTS public.bcba_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text,
  client_name text NOT NULL,
  bcba_name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcba_assignment_history_client_identity CHECK (coalesce(nullif(btrim(client_id), ''), nullif(btrim(client_name), '')) IS NOT NULL),
  CONSTRAINT bcba_assignment_history_date_order CHECK (end_date IS NULL OR end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcba_assignment_history TO authenticated;
GRANT ALL ON public.bcba_assignment_history TO service_role;

ALTER TABLE public.bcba_assignment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read BCBA assignment history" ON public.bcba_assignment_history;
CREATE POLICY "Authenticated users can read BCBA assignment history"
ON public.bcba_assignment_history
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can maintain BCBA assignment history" ON public.bcba_assignment_history;
CREATE POLICY "Authenticated users can maintain BCBA assignment history"
ON public.bcba_assignment_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_bcba_assignment_history_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_bcba_assignment_history_updated_at ON public.bcba_assignment_history;
CREATE TRIGGER update_bcba_assignment_history_updated_at
BEFORE UPDATE ON public.bcba_assignment_history
FOR EACH ROW
EXECUTE FUNCTION public.update_bcba_assignment_history_updated_at();

CREATE INDEX IF NOT EXISTS idx_bcba_assignment_history_client_id_dates
ON public.bcba_assignment_history (client_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_bcba_assignment_history_client_name_dates
ON public.bcba_assignment_history (lower(client_name), start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_bcba_assignment_history_bcba_name
ON public.bcba_assignment_history (bcba_name);