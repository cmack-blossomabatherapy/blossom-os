
-- RBT Pass 3: CentralReach readiness + realtime enablement.

ALTER TABLE public.rbt_supervision            ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.rbt_supervision            ADD COLUMN IF NOT EXISTS centralreach_reference  text;
ALTER TABLE public.rbt_messages               ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.rbt_messages               ADD COLUMN IF NOT EXISTS centralreach_reference  text;
ALTER TABLE public.rbt_help_requests          ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.rbt_help_requests          ADD COLUMN IF NOT EXISTS centralreach_reference  text;
ALTER TABLE public.rbt_session_support_logs   ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.rbt_session_support_logs   ADD COLUMN IF NOT EXISTS centralreach_reference  text;

ALTER TABLE public.rbt_client_assignments   REPLICA IDENTITY FULL;
ALTER TABLE public.rbt_sessions             REPLICA IDENTITY FULL;
ALTER TABLE public.rbt_supervision          REPLICA IDENTITY FULL;
ALTER TABLE public.rbt_messages             REPLICA IDENTITY FULL;
ALTER TABLE public.rbt_help_requests        REPLICA IDENTITY FULL;
ALTER TABLE public.rbt_session_support_logs REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rbt_client_assignments;   EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rbt_sessions;             EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rbt_supervision;          EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rbt_messages;             EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rbt_help_requests;        EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rbt_session_support_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
