
-- Pass 5: extend app_role enum with the canonical Blossom OS role names.
-- ALTER TYPE ADD VALUE cannot run in a transaction with other DDL, so we use
-- separate DO blocks that no-op if the value already exists.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'executive_leadership') THEN
    ALTER TYPE public.app_role ADD VALUE 'executive_leadership';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'operations_leadership') THEN
    ALTER TYPE public.app_role ADD VALUE 'operations_leadership';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'qa_team') THEN
    ALTER TYPE public.app_role ADD VALUE 'qa_team';
  END IF;
END $$;
