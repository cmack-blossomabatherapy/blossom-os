CREATE TABLE public.training_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  context text NOT NULL,
  question_key text NOT NULL,
  question_text text,
  answer text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, context, question_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_reflections TO authenticated;
GRANT ALL ON public.training_reflections TO service_role;

ALTER TABLE public.training_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training reflections"
  ON public.training_reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Training admins read all reflections"
  ON public.training_reflections
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'training_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
    OR public.has_role(auth.uid(), 'exec'::public.app_role)
    OR public.has_role(auth.uid(), 'ops_manager'::public.app_role)
  );

CREATE INDEX idx_training_reflections_user ON public.training_reflections(user_id);
CREATE INDEX idx_training_reflections_context ON public.training_reflections(context);

CREATE OR REPLACE FUNCTION public.training_reflections_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_training_reflections_updated_at
  BEFORE UPDATE ON public.training_reflections
  FOR EACH ROW EXECUTE FUNCTION public.training_reflections_touch_updated_at();