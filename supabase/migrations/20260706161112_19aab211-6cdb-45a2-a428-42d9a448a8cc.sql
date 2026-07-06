
CREATE TABLE IF NOT EXISTS public.state_operational_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL UNIQUE,
  state_name text,
  health_score integer CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
  health_label text CHECK (health_label IS NULL OR health_label IN ('Healthy','Stable','Watch','Risk','Critical')),
  active_clients integer NOT NULL DEFAULT 0,
  authorized_hours numeric NOT NULL DEFAULT 0,
  scheduled_hours numeric NOT NULL DEFAULT 0,
  delivered_hours numeric NOT NULL DEFAULT 0,
  staffing_gaps integer NOT NULL DEFAULT 0,
  intake_pipeline integer NOT NULL DEFAULT 0,
  auths_expiring_30d integer NOT NULL DEFAULT 0,
  clinical_risks integer NOT NULL DEFAULT 0,
  recruiting_needs integer NOT NULL DEFAULT 0,
  cancellation_risk integer NOT NULL DEFAULT 0,
  open_escalations integer NOT NULL DEFAULT 0,
  open_tasks integer NOT NULL DEFAULT 0,
  aging_blockers integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','integration','live','seed')),
  source_updated_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_operational_metrics_state ON public.state_operational_metrics (state_code);
CREATE INDEX IF NOT EXISTS idx_state_operational_metrics_source ON public.state_operational_metrics (source);
CREATE INDEX IF NOT EXISTS idx_state_operational_metrics_updated ON public.state_operational_metrics (updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_operational_metrics TO authenticated;
GRANT ALL ON public.state_operational_metrics TO service_role;

ALTER TABLE public.state_operational_metrics ENABLE ROW LEVEL SECURITY;

-- Read: leadership sees all states; state-scoped roles see their state only.
CREATE POLICY "State metrics: leadership + state-scoped read"
ON public.state_operational_metrics FOR SELECT
TO authenticated
USING (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
);

-- Write: leadership/admin can write any state; state-scoped roles only their own state.
CREATE POLICY "State metrics: leadership write"
ON public.state_operational_metrics FOR INSERT
TO authenticated
WITH CHECK (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
);

CREATE POLICY "State metrics: leadership update"
ON public.state_operational_metrics FOR UPDATE
TO authenticated
USING (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
)
WITH CHECK (
  public.user_is_leadership()
  OR (public.user_is_state_scoped_role() AND state_code = public.user_state_code())
);

CREATE POLICY "State metrics: leadership delete"
ON public.state_operational_metrics FOR DELETE
TO authenticated
USING (public.user_is_leadership());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.state_operational_metrics_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_state_operational_metrics_touch ON public.state_operational_metrics;
CREATE TRIGGER trg_state_operational_metrics_touch
BEFORE UPDATE ON public.state_operational_metrics
FOR EACH ROW EXECUTE FUNCTION public.state_operational_metrics_touch();
