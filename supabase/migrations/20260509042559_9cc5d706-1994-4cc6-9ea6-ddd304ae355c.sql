
CREATE TABLE IF NOT EXISTS public.sop_feedback_weights (
  id boolean PRIMARY KEY DEFAULT true,
  up_same_query_same_filters numeric NOT NULL DEFAULT 1.40,
  up_same_query              numeric NOT NULL DEFAULT 1.25,
  up_same_filters            numeric NOT NULL DEFAULT 1.15,
  up_other                   numeric NOT NULL DEFAULT 1.08,
  down_same_query_same_filters numeric NOT NULL DEFAULT 0.55,
  down_same_query              numeric NOT NULL DEFAULT 0.70,
  down_same_filters            numeric NOT NULL DEFAULT 0.80,
  down_other                   numeric NOT NULL DEFAULT 0.90,
  hide_on_not_relevant       boolean NOT NULL DEFAULT true,
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  updated_by                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT sop_feedback_weights_singleton CHECK (id = true)
);

INSERT INTO public.sop_feedback_weights (id) VALUES (true)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.sop_feedback_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read sop feedback weights" ON public.sop_feedback_weights;
CREATE POLICY "Authenticated can read sop feedback weights"
  ON public.sop_feedback_weights FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update sop feedback weights" ON public.sop_feedback_weights;
CREATE POLICY "Admins can update sop feedback weights"
  ON public.sop_feedback_weights FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert sop feedback weights" ON public.sop_feedback_weights;
CREATE POLICY "Admins can insert sop feedback weights"
  ON public.sop_feedback_weights FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS touch_sop_feedback_weights ON public.sop_feedback_weights;
CREATE TRIGGER touch_sop_feedback_weights
  BEFORE UPDATE ON public.sop_feedback_weights
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
