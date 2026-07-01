
-- ========== MAPSLY OBJECT MAP ==========
CREATE TABLE public.mapsly_object_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client','employee','lead','candidate','referral')),
  entity_id UUID NOT NULL,
  mapsly_object_type TEXT NOT NULL,
  mapsly_record_id TEXT NOT NULL,
  last_pushed_at TIMESTAMPTZ,
  last_pulled_at TIMESTAMPTZ,
  last_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id),
  UNIQUE (mapsly_object_type, mapsly_record_id)
);
GRANT SELECT ON public.mapsly_object_map TO authenticated;
GRANT ALL ON public.mapsly_object_map TO service_role;
ALTER TABLE public.mapsly_object_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read mapsly object map"
  ON public.mapsly_object_map FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== MAPSLY SYNC LOG ==========
CREATE TABLE public.mapsly_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL CHECK (direction IN ('push','pull','webhook')),
  entity_type TEXT,
  status TEXT NOT NULL,
  records_processed INT NOT NULL DEFAULT 0,
  records_succeeded INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  message TEXT,
  payload JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mapsly_sync_log TO authenticated;
GRANT ALL ON public.mapsly_sync_log TO service_role;
ALTER TABLE public.mapsly_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read mapsly sync log"
  ON public.mapsly_sync_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== MILEAGE TRIPS ==========
CREATE TABLE public.mileage_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  role TEXT,
  trip_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  origin_address TEXT,
  origin_lat NUMERIC,
  origin_lon NUMERIC,
  destination_address TEXT,
  destination_lat NUMERIC,
  destination_lon NUMERIC,
  miles NUMERIC NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL DEFAULT 'patient' CHECK (purpose IN ('patient','training','supervision','meeting','other')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'mapsly' CHECK (source IN ('mapsly','manual','import')),
  mapsly_trip_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','reimbursed')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reimbursement_export_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mileage_trips_employee_date_idx ON public.mileage_trips (employee_id, trip_date);
CREATE INDEX mileage_trips_status_idx ON public.mileage_trips (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mileage_trips TO authenticated;
GRANT ALL ON public.mileage_trips TO service_role;
ALTER TABLE public.mileage_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read own mileage trips"
  ON public.mileage_trips FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = mileage_trips.employee_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Employees log own mileage trips"
  ON public.mileage_trips FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id = mileage_trips.employee_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Admins manage all mileage trips"
  ON public.mileage_trips FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete mileage trips"
  ON public.mileage_trips FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== MILEAGE REIMBURSEMENT EXPORTS ==========
CREATE TABLE public.mileage_reimbursement_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trip_count INT NOT NULL DEFAULT 0,
  total_miles NUMERIC NOT NULL DEFAULT 0,
  rate_per_mile NUMERIC NOT NULL DEFAULT 0.67,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','exported','submitted','paid')),
  export_file_path TEXT,
  exported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mileage_reimbursement_exports TO authenticated;
GRANT ALL ON public.mileage_reimbursement_exports TO service_role;
ALTER TABLE public.mileage_reimbursement_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reimbursement exports"
  ON public.mileage_reimbursement_exports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== BD TERRITORIES ==========
CREATE TABLE public.bd_territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  region TEXT,
  owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  owner_name TEXT,
  color TEXT DEFAULT '#2B7BD5',
  center_lat NUMERIC,
  center_lon NUMERIC,
  boundary_geojson JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bd_territories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bd_territories TO authenticated;
GRANT ALL ON public.bd_territories TO service_role;
ALTER TABLE public.bd_territories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read bd_territories"
  ON public.bd_territories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bd_territories"
  ON public.bd_territories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update bd_territories"
  ON public.bd_territories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete bd_territories"
  ON public.bd_territories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== BD TERRITORY LEADS (map pins) ==========
CREATE TABLE public.bd_territory_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID REFERENCES public.bd_territories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'referral' CHECK (kind IN ('referral','partner','prospect','clinic','school')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat NUMERIC,
  lon NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  last_visit_at TIMESTAMPTZ,
  next_visit_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bd_territory_leads_territory_idx ON public.bd_territory_leads (territory_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bd_territory_leads TO authenticated;
GRANT ALL ON public.bd_territory_leads TO service_role;
ALTER TABLE public.bd_territory_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read bd_territory_leads"
  ON public.bd_territory_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bd_territory_leads insert"
  ON public.bd_territory_leads FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage bd_territory_leads update"
  ON public.bd_territory_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage bd_territory_leads delete"
  ON public.bd_territory_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== updated_at triggers ==========
CREATE TRIGGER trg_mapsly_object_map_updated
  BEFORE UPDATE ON public.mapsly_object_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mileage_trips_updated
  BEFORE UPDATE ON public.mileage_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mileage_reimbursement_exports_updated
  BEFORE UPDATE ON public.mileage_reimbursement_exports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bd_territories_updated
  BEFORE UPDATE ON public.bd_territories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bd_territory_leads_updated
  BEFORE UPDATE ON public.bd_territory_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
