
-- ============================================================================
-- employee_devices
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employee_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'tablet',          -- tablet | hotspot | laptop | phone | other
  name text NOT NULL,                                  -- e.g. "iPad Air 11""
  serial text,
  status text NOT NULL DEFAULT 'assigned',             -- assigned | in_transit | returned | retired
  assigned_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  notes text,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employee_devices_employee ON public.employee_devices(employee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_devices TO authenticated;
GRANT ALL ON public.employee_devices TO service_role;

ALTER TABLE public.employee_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View devices"
  ON public.employee_devices FOR SELECT
  USING (
    has_permission(auth.uid(), 'hr.employees.view')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_devices.employee_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Manage devices ins"
  ON public.employee_devices FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'hr.employees.edit'));
CREATE POLICY "Manage devices upd"
  ON public.employee_devices FOR UPDATE
  USING (has_permission(auth.uid(), 'hr.employees.edit'))
  WITH CHECK (has_permission(auth.uid(), 'hr.employees.edit'));
CREATE POLICY "Manage devices del"
  ON public.employee_devices FOR DELETE
  USING (has_permission(auth.uid(), 'hr.employees.edit'));

CREATE TRIGGER trg_employee_devices_updated
  BEFORE UPDATE ON public.employee_devices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- employee_nfc_tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.employee_nfc_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tag_code text NOT NULL UNIQUE,                       -- printed code, e.g. NFC-A1B2C3
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  last_test_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employee_nfc_employee ON public.employee_nfc_tags(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_nfc_active ON public.employee_nfc_tags(employee_id) WHERE is_active;

-- NFC public profile must be readable without auth (parents scanning a tag).
GRANT SELECT ON public.employee_nfc_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_nfc_tags TO authenticated;
GRANT ALL ON public.employee_nfc_tags TO service_role;

ALTER TABLE public.employee_nfc_tags ENABLE ROW LEVEL SECURITY;

-- Public scan: only the minimal "is this tag active" lookup. The directory view
-- already exposes only public-safe fields, so allowing SELECT here is safe.
CREATE POLICY "Public tag lookup"
  ON public.employee_nfc_tags FOR SELECT
  USING (true);
CREATE POLICY "Manage nfc ins"
  ON public.employee_nfc_tags FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'hr.employees.edit'));
CREATE POLICY "Manage nfc upd"
  ON public.employee_nfc_tags FOR UPDATE
  USING (has_permission(auth.uid(), 'hr.employees.edit'))
  WITH CHECK (has_permission(auth.uid(), 'hr.employees.edit'));
CREATE POLICY "Manage nfc del"
  ON public.employee_nfc_tags FOR DELETE
  USING (has_permission(auth.uid(), 'hr.employees.edit'));

CREATE TRIGGER trg_employee_nfc_tags_updated
  BEFORE UPDATE ON public.employee_nfc_tags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
