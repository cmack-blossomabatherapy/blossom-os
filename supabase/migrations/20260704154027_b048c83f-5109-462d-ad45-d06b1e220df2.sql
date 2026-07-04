
-- BCBA Pass 3: CentralReach readiness + realtime enablement for BCBA workflow tables.

-- 1) CentralReach sync status columns (honest, pending_import by default).
ALTER TABLE public.bcba_action_tasks           ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.bcba_supervision_logs       ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.bcba_supervision_logs       ADD COLUMN IF NOT EXISTS centralreach_client_id  text;
ALTER TABLE public.bcba_parent_training_logs   ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.bcba_parent_training_logs   ADD COLUMN IF NOT EXISTS centralreach_client_id  text;
ALTER TABLE public.bcba_treatment_plan_items   ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.bcba_client_notes           ADD COLUMN IF NOT EXISTS centralreach_sync_status text NOT NULL DEFAULT 'pending_import';
ALTER TABLE public.bcba_client_notes           ADD COLUMN IF NOT EXISTS centralreach_client_id  text;
ALTER TABLE public.bcba_client_notes           ADD COLUMN IF NOT EXISTS centralreach_reference  text;

-- 2) Enable realtime for BCBA workflow tables.
ALTER TABLE public.bcba_action_tasks         REPLICA IDENTITY FULL;
ALTER TABLE public.bcba_supervision_logs     REPLICA IDENTITY FULL;
ALTER TABLE public.bcba_parent_training_logs REPLICA IDENTITY FULL;
ALTER TABLE public.bcba_treatment_plan_items REPLICA IDENTITY FULL;
ALTER TABLE public.bcba_client_notes         REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bcba_action_tasks;         EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bcba_supervision_logs;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bcba_parent_training_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bcba_treatment_plan_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bcba_client_notes;         EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
