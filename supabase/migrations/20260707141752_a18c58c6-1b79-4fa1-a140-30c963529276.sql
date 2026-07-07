-- Executive Leadership Pass 2: tighten reads, auto-completed_at, indexes.

-- 1) Tighten SELECT on leadership-sensitive tables to is_leadership().
DO $$
BEGIN
  -- executive_decisions
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='executive_decisions' AND policyname='exec_decisions_read') THEN
    DROP POLICY exec_decisions_read ON public.executive_decisions;
  END IF;
  CREATE POLICY exec_decisions_read ON public.executive_decisions FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

  -- executive_briefings
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='executive_briefings' AND policyname='exec_briefings_read') THEN
    DROP POLICY exec_briefings_read ON public.executive_briefings;
  END IF;
  CREATE POLICY exec_briefings_read ON public.executive_briefings FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

  -- executive_updates: leadership sees drafts; published updates remain visible to all authenticated (company-wide broadcast).
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='executive_updates' AND policyname='exec_updates_read') THEN
    DROP POLICY exec_updates_read ON public.executive_updates;
  END IF;
  CREATE POLICY exec_updates_read ON public.executive_updates FOR SELECT TO authenticated
    USING (public.is_leadership(auth.uid()) OR published_at IS NOT NULL);

  -- executive_risks
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='executive_risks' AND policyname='exec_risks_read') THEN
    DROP POLICY exec_risks_read ON public.executive_risks;
  END IF;
  CREATE POLICY exec_risks_read ON public.executive_risks FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

  -- executive_kpi_snapshots
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='executive_kpi_snapshots' AND policyname='exec_kpi_read') THEN
    DROP POLICY exec_kpi_read ON public.executive_kpi_snapshots;
  END IF;
  CREATE POLICY exec_kpi_read ON public.executive_kpi_snapshots FOR SELECT TO authenticated USING (public.is_leadership(auth.uid()));

  -- executive_work_items: leadership sees all; other authenticated users see only rows they created (their own submissions).
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='executive_work_items' AND policyname='exec_work_items_read') THEN
    DROP POLICY exec_work_items_read ON public.executive_work_items;
  END IF;
  CREATE POLICY exec_work_items_read ON public.executive_work_items FOR SELECT TO authenticated
    USING (public.is_leadership(auth.uid()) OR created_by = auth.uid());
END $$;

-- 2) Auto-manage completed_at based on status transitions.
CREATE OR REPLACE FUNCTION public.executive_work_items_set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('completed','resolved','done') THEN
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exec_work_items_completed_at ON public.executive_work_items;
CREATE TRIGGER trg_exec_work_items_completed_at
BEFORE INSERT OR UPDATE OF status ON public.executive_work_items
FOR EACH ROW EXECUTE FUNCTION public.executive_work_items_set_completed_at();

-- Mirror trigger for executive_risks (resolved/mitigated → resolved_at handling if column exists).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='executive_risks' AND column_name='resolved_at'
  ) THEN
    EXECUTE $trig$
      CREATE OR REPLACE FUNCTION public.executive_risks_set_resolved_at()
      RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $body$
      BEGIN
        IF NEW.status IN ('resolved','mitigated','closed') THEN
          IF NEW.resolved_at IS NULL THEN NEW.resolved_at := now(); END IF;
        ELSE
          NEW.resolved_at := NULL;
        END IF;
        RETURN NEW;
      END;
      $body$;
    $trig$;
    DROP TRIGGER IF EXISTS trg_exec_risks_resolved_at ON public.executive_risks;
    CREATE TRIGGER trg_exec_risks_resolved_at
    BEFORE INSERT OR UPDATE OF status ON public.executive_risks
    FOR EACH ROW EXECUTE FUNCTION public.executive_risks_set_resolved_at();
  END IF;
END $$;

-- 3) Helpful indexes for common Executive queries.
CREATE INDEX IF NOT EXISTS idx_exec_work_items_status      ON public.executive_work_items(status);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_priority    ON public.executive_work_items(priority);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_department  ON public.executive_work_items(department);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_state_code  ON public.executive_work_items(state_code);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_owner       ON public.executive_work_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_due_date    ON public.executive_work_items(due_date);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_created_at  ON public.executive_work_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_work_items_category    ON public.executive_work_items(category);

CREATE INDEX IF NOT EXISTS idx_exec_decisions_created_at   ON public.executive_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_risks_status           ON public.executive_risks(status);
CREATE INDEX IF NOT EXISTS idx_exec_risks_created_at       ON public.executive_risks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_updates_published_at   ON public.executive_updates(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_activity_created_at    ON public.executive_activity_log(created_at DESC);