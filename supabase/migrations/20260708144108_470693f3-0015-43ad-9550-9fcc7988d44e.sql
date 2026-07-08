
-- Report saved snapshots metadata (BCBA, Cancellation, etc.).
-- Heavy payloads (raw CSV rows) stay in IndexedDB per browser; this table
-- stores the metadata list so it follows users across devices and survives
-- localStorage clears.
CREATE TABLE IF NOT EXISTS public.report_saved_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,                -- e.g. 'bcba_productivity', 'cancellation_cc'
  client_id TEXT NOT NULL,            -- browser-generated id used by the IndexedDB payload
  name TEXT NOT NULL,
  primary_file_name TEXT,
  aux_file_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_saved_snapshots TO authenticated;
GRANT ALL ON public.report_saved_snapshots TO service_role;
ALTER TABLE public.report_saved_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_saved_snapshots_own_select
  ON public.report_saved_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY report_saved_snapshots_own_write
  ON public.report_saved_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY report_saved_snapshots_own_update
  ON public.report_saved_snapshots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY report_saved_snapshots_own_delete
  ON public.report_saved_snapshots FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS report_saved_snapshots_user_scope_idx
  ON public.report_saved_snapshots (user_id, scope, saved_at DESC);

-- Report row-level follow-ups (cancellation "todo/contacted/resolved" chip,
-- plus any future per-row follow-up state). Keyed by (user, scope, row_key)
-- so the /reports view can persist without depending only on localStorage.
CREATE TABLE IF NOT EXISTS public.report_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,               -- e.g. 'cancellation_cc'
  row_key TEXT NOT NULL,             -- caller-defined stable identifier for the row
  status TEXT NOT NULL,              -- 'todo' | 'contacted' | 'resolved' | custom
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, scope, row_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_followups TO authenticated;
GRANT ALL ON public.report_followups TO service_role;
ALTER TABLE public.report_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_followups_own_all
  ON public.report_followups FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS report_followups_user_scope_idx
  ON public.report_followups (user_id, scope, updated_at DESC);

-- updated_at trigger reused across both tables.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS report_saved_snapshots_touch ON public.report_saved_snapshots;
CREATE TRIGGER report_saved_snapshots_touch
  BEFORE UPDATE ON public.report_saved_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS report_followups_touch ON public.report_followups;
CREATE TRIGGER report_followups_touch
  BEFORE UPDATE ON public.report_followups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
