
CREATE TABLE public.training_role_journey_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_slug text NOT NULL UNIQUE,
  path_slug text NOT NULL,
  notes text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.training_role_journey_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.training_role_journey_assignments TO authenticated;
GRANT ALL ON public.training_role_journey_assignments TO service_role;

ALTER TABLE public.training_role_journey_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read role journey assignments"
  ON public.training_role_journey_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR and admins can insert role journey assignments"
  ON public.training_role_journey_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_manager')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
  );

CREATE POLICY "HR and admins can update role journey assignments"
  ON public.training_role_journey_assignments
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_manager')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
  );

CREATE POLICY "HR and admins can delete role journey assignments"
  ON public.training_role_journey_assignments
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'hr_admin')
    OR public.has_role(auth.uid(), 'hr_manager')
    OR public.has_role(auth.uid(), 'hr_lead')
    OR public.has_role(auth.uid(), 'training_admin')
  );

CREATE TRIGGER update_training_role_journey_assignments_updated_at
  BEFORE UPDATE ON public.training_role_journey_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
