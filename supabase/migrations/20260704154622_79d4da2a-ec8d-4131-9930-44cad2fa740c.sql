
ALTER TABLE public.state_operational_tasks       REPLICA IDENTITY FULL;
ALTER TABLE public.state_operational_escalations REPLICA IDENTITY FULL;
ALTER TABLE public.state_operational_notes       REPLICA IDENTITY FULL;
ALTER TABLE public.state_operational_activity    REPLICA IDENTITY FULL;
ALTER TABLE public.state_department_handoffs     REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.state_operational_tasks;       EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.state_operational_escalations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.state_operational_notes;       EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.state_operational_activity;    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.state_department_handoffs;     EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
