DO $$
DECLARE
  tbl text;
  recruiting_tables text[] := ARRAY[
    'recruiting_candidates',
    'recruiting_interviews',
    'recruiting_offers',
    'recruiting_background_checks',
    'recruiting_orientation_slots',
    'recruiting_onboarding_tasks',
    'recruiting_staffing_needs',
    'recruiting_followups',
    'recruiting_escalations',
    'recruiting_messages',
    'recruiting_activity_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY recruiting_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      IF tbl = 'recruiting_activity_events' THEN
        EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', tbl);
      ELSE
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
      END IF;
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
    END IF;
  END LOOP;
END $$;