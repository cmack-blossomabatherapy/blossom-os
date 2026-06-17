DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='intake_communications' AND schemaname='public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_communications';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='intake_tasks' AND schemaname='public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_tasks';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='journey_events' AND schemaname='public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.journey_events';
  END IF;
END $$;

ALTER TABLE public.intake_communications REPLICA IDENTITY FULL;
ALTER TABLE public.intake_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.journey_events REPLICA IDENTITY FULL;