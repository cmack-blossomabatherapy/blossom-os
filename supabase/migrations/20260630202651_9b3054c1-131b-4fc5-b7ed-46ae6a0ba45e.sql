
-- Helper: who can write Scheduling overlay state
CREATE OR REPLACE FUNCTION public.has_scheduling_write_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'super_admin','admin','systems_admin','ops_manager','exec','executive',
        'state_director','scheduling','scheduling_lead','scheduling_coordinator',
        'staffing_coordinator'
      )
  );
$$;

-- updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. scheduling_client_overrides ────────────────────────────────────────────
CREATE TABLE public.scheduling_client_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key text NOT NULL UNIQUE,
  client_name text,
  source_system text NOT NULL DEFAULT 'monday_clients_raw',
  source_record_id text,
  state text,
  rbt_name text,
  start_date date,
  staffing_status text,
  scheduling_status text,
  centralreach_sync_status text NOT NULL DEFAULT 'not_ready',
  centralreach_reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_client_overrides TO authenticated;
GRANT ALL ON public.scheduling_client_overrides TO service_role;

ALTER TABLE public.scheduling_client_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sched_overrides_select_authenticated"
ON public.scheduling_client_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "sched_overrides_insert_writers"
ON public.scheduling_client_overrides FOR INSERT TO authenticated
WITH CHECK (public.has_scheduling_write_access(auth.uid()));

CREATE POLICY "sched_overrides_update_writers"
ON public.scheduling_client_overrides FOR UPDATE TO authenticated
USING (public.has_scheduling_write_access(auth.uid()))
WITH CHECK (public.has_scheduling_write_access(auth.uid()));

CREATE POLICY "sched_overrides_delete_admin"
ON public.scheduling_client_overrides FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'systems_admin'::app_role)
);

CREATE INDEX scheduling_client_overrides_client_key_idx ON public.scheduling_client_overrides (client_key);
CREATE INDEX scheduling_client_overrides_state_idx ON public.scheduling_client_overrides (state);
CREATE INDEX scheduling_client_overrides_cr_idx ON public.scheduling_client_overrides (centralreach_sync_status);
CREATE INDEX scheduling_client_overrides_updated_idx ON public.scheduling_client_overrides (updated_at DESC);

CREATE TRIGGER trg_sched_overrides_updated_at
BEFORE UPDATE ON public.scheduling_client_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. scheduling_client_schedule_slots ───────────────────────────────────────
CREATE TABLE public.scheduling_client_schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key text NOT NULL,
  client_name text,
  source_system text NOT NULL DEFAULT 'monday_clients_raw',
  source_record_id text,
  state text,
  day text NOT NULL CHECK (day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time text NOT NULL,
  end_time text NOT NULL,
  rbt_name text,
  location text,
  notes text,
  centralreach_sync_status text NOT NULL DEFAULT 'not_ready',
  centralreach_reference_id text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_key, day, start_time, end_time)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduling_client_schedule_slots TO authenticated;
GRANT ALL ON public.scheduling_client_schedule_slots TO service_role;

ALTER TABLE public.scheduling_client_schedule_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sched_slots_select_authenticated"
ON public.scheduling_client_schedule_slots FOR SELECT TO authenticated USING (true);

CREATE POLICY "sched_slots_insert_writers"
ON public.scheduling_client_schedule_slots FOR INSERT TO authenticated
WITH CHECK (public.has_scheduling_write_access(auth.uid()));

CREATE POLICY "sched_slots_update_writers"
ON public.scheduling_client_schedule_slots FOR UPDATE TO authenticated
USING (public.has_scheduling_write_access(auth.uid()))
WITH CHECK (public.has_scheduling_write_access(auth.uid()));

CREATE POLICY "sched_slots_delete_writers"
ON public.scheduling_client_schedule_slots FOR DELETE TO authenticated
USING (public.has_scheduling_write_access(auth.uid()));

CREATE INDEX sched_slots_client_day_idx ON public.scheduling_client_schedule_slots (client_key, day);
CREATE INDEX sched_slots_state_idx ON public.scheduling_client_schedule_slots (state);
CREATE INDEX sched_slots_cr_idx ON public.scheduling_client_schedule_slots (centralreach_sync_status);

CREATE TRIGGER trg_sched_slots_updated_at
BEFORE UPDATE ON public.scheduling_client_schedule_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
