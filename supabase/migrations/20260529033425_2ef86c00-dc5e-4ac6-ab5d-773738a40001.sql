
CREATE TABLE public.device_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type TEXT NOT NULL CHECK (device_type IN ('tablet','hotspot','laptop','phone','other')),
  name TEXT NOT NULL,
  serial TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','assigned','retired','repair')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_inventory TO authenticated;
GRANT ALL ON public.device_inventory TO service_role;

ALTER TABLE public.device_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view inventory"
  ON public.device_inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "HR/admin can manage inventory"
  ON public.device_inventory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE TRIGGER trg_device_inventory_updated
  BEFORE UPDATE ON public.device_inventory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.employee_devices
  ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES public.device_inventory(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employee_devices_inventory ON public.employee_devices(inventory_id);

CREATE OR REPLACE FUNCTION public.sync_device_inventory_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.inventory_id IS NOT NULL THEN
    UPDATE public.device_inventory SET status = 'assigned' WHERE id = NEW.inventory_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.inventory_id IS NOT NULL THEN
    IF NEW.status = 'returned' AND (OLD.status IS DISTINCT FROM 'returned') THEN
      UPDATE public.device_inventory SET status = 'available' WHERE id = NEW.inventory_id;
    ELSIF NEW.status = 'assigned' AND (OLD.status IS DISTINCT FROM 'assigned') THEN
      UPDATE public.device_inventory SET status = 'assigned' WHERE id = NEW.inventory_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.inventory_id IS NOT NULL THEN
    UPDATE public.device_inventory SET status = 'available' WHERE id = OLD.inventory_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_employee_devices_sync_inventory ON public.employee_devices;
CREATE TRIGGER trg_employee_devices_sync_inventory
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_devices
  FOR EACH ROW EXECUTE FUNCTION public.sync_device_inventory_status();

INSERT INTO public.device_inventory (device_type, name, serial, status) VALUES
  ('tablet','iPad Air 11" — Pool A','APL-IPA-001','available'),
  ('tablet','iPad Air 11" — Pool B','APL-IPA-002','available'),
  ('tablet','iPad 10th gen — Pool A','APL-IP10-001','available'),
  ('hotspot','Verizon Jetpack MiFi 8800L','VZW-MF-001','available'),
  ('hotspot','T-Mobile 5G Hotspot','TMO-5G-001','available'),
  ('laptop','MacBook Air M3 13"','APL-MBA-001','available'),
  ('phone','iPhone SE — Therapy line','APL-SE-001','available');
