
CREATE TABLE IF NOT EXISTS public.journey_phase_overrides (
  phase_id text PRIMARY KEY,
  title text,
  objective text,
  intro_video_url text,
  intro_video_poster text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journey_module_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id text NOT NULL,
  module_key text NOT NULL,
  title text,
  blurb text,
  video_url text,
  video_poster text,
  video_duration text,
  video_presenter text,
  hidden boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phase_id, module_key)
);

ALTER TABLE public.journey_phase_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_module_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read phase overrides"
  ON public.journey_phase_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read module overrides"
  ON public.journey_module_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "HR and admins can insert phase overrides"
  ON public.journey_phase_overrides FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
  );

CREATE POLICY "HR and admins can update phase overrides"
  ON public.journey_phase_overrides FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
  );

CREATE POLICY "HR and admins can delete phase overrides"
  ON public.journey_phase_overrides FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
  );

CREATE POLICY "HR and admins can insert module overrides"
  ON public.journey_module_overrides FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
  );

CREATE POLICY "HR and admins can update module overrides"
  ON public.journey_module_overrides FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
    OR public.has_role(auth.uid(), 'training_admin'::app_role)
  );

CREATE POLICY "HR and admins can delete module overrides"
  ON public.journey_module_overrides FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::app_role)
  );

CREATE TRIGGER trg_journey_phase_overrides_updated_at
  BEFORE UPDATE ON public.journey_phase_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_journey_module_overrides_updated_at
  BEFORE UPDATE ON public.journey_module_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_journey_module_overrides_phase ON public.journey_module_overrides(phase_id);
