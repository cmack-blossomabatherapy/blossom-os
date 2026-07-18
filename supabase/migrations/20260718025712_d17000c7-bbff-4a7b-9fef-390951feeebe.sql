
-- Seed rules
INSERT INTO public.bcba_notification_rules
  (event_key, domain, category, title_template, body_template, action_label, deep_link_template, channels, required, sensitive, respect_quiet_hours, dedupe_window_minutes, active)
VALUES
  ('bcba.metric_changed', 'productivity', 'update',
   'Metric updated: {{metric_label}}',
   '{{metric_label}} moved from {{prev_value}} to {{new_value}} (source {{source_date}}).',
   'Open drill-down',
   '/bcba/productivity?metric={{metric_key}}',
   ARRAY['in_app'], false, false, true, 30, true),
  ('bcba.capacity_status_changed', 'capacity', 'action_required',
   'Capacity status: {{new_status_label}}',
   'Your capacity advisory changed from {{prev_status_label}} to {{new_status_label}} (source {{source_date}}).',
   'View capacity',
   '/bcba/productivity?tab=capacity',
   ARRAY['in_app'], false, false, true, 60, true)
ON CONFLICT (event_key) DO UPDATE
SET title_template = EXCLUDED.title_template,
    body_template = EXCLUDED.body_template,
    action_label = EXCLUDED.action_label,
    deep_link_template = EXCLUDED.deep_link_template,
    updated_at = now();

-- Productivity diff trigger
CREATE OR REPLACE FUNCTION public.bcba_productivity_snapshot_diff_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev public.bcba_productivity_snapshots%ROWTYPE;
  target_user uuid;
  m record;
  metrics text[] := ARRAY[
    'clinical_hours','billable_hours','assessment_hours','parent_training_hours','supervision_hours',
    'documentation_on_time_pct','qa_return_rate_pct','service_utilization_pct',
    'caseload_size','assigned_rbt_count','open_risks','cancelled_appointments',
    'mtd_actual_hours','mtd_target_hours','forecast_hours',
    'progress_reports_late','treatment_plans_qa_returned'
  ];
  labels jsonb := jsonb_build_object(
    'clinical_hours','Clinical hours','billable_hours','Billable hours','assessment_hours','Assessment hours',
    'parent_training_hours','Parent training','supervision_hours','Supervision',
    'documentation_on_time_pct','Documentation timeliness','qa_return_rate_pct','QA return rate',
    'service_utilization_pct','Service utilization','caseload_size','Caseload size',
    'assigned_rbt_count','Assigned RBTs','open_risks','Open risks','cancelled_appointments','Cancellations',
    'mtd_actual_hours','MTD actual','mtd_target_hours','MTD target','forecast_hours','Forecast',
    'progress_reports_late','Late progress reports','treatment_plans_qa_returned','TPs in QA correction'
  );
  metric_key text;
  prev_val numeric;
  new_val numeric;
  delta numeric;
  threshold numeric;
  source_ts text;
BEGIN
  SELECT id INTO target_user FROM public.employees WHERE id = NEW.bcba_id LIMIT 1;
  IF target_user IS NULL THEN
    target_user := NEW.bcba_id;
  END IF;

  SELECT * INTO prev
  FROM public.bcba_productivity_snapshots
  WHERE bcba_id = NEW.bcba_id AND id <> NEW.id
  ORDER BY period_end DESC, updated_at DESC
  LIMIT 1;

  IF prev.id IS NULL THEN
    RETURN NEW;
  END IF;

  FOREACH metric_key IN ARRAY metrics LOOP
    EXECUTE format('SELECT ($1).%I::numeric, ($2).%I::numeric', metric_key, metric_key)
      INTO prev_val, new_val USING prev, NEW;
    IF prev_val IS NULL OR new_val IS NULL THEN CONTINUE; END IF;
    delta := new_val - prev_val;
    -- thresholds: percentages 5pt, hours 0.5, counts 1
    IF metric_key LIKE '%_pct' THEN threshold := 5;
    ELSIF metric_key LIKE '%_hours' OR metric_key IN ('mtd_actual_hours','mtd_target_hours','forecast_hours') THEN threshold := 0.5;
    ELSE threshold := 1;
    END IF;
    IF abs(delta) < threshold THEN CONTINUE; END IF;

    source_ts := COALESCE(NEW.source_dates->>metric_key, to_char(NEW.updated_at,'YYYY-MM-DD"T"HH24:MI:SSOF'));

    PERFORM public.emit_bcba_notification(
      'bcba.metric_changed',
      target_user,
      jsonb_build_object(
        'metric_key', metric_key,
        'metric_label', labels->>metric_key,
        'prev_value', prev_val,
        'new_value', new_val,
        'delta', delta,
        'source_date', source_ts,
        'snapshot_id', NEW.id,
        'period_start', NEW.period_start,
        'period_end', NEW.period_end
      ),
      '/bcba/productivity?metric=' || metric_key
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bcba_productivity_diff_alerts ON public.bcba_productivity_snapshots;
CREATE TRIGGER trg_bcba_productivity_diff_alerts
AFTER INSERT ON public.bcba_productivity_snapshots
FOR EACH ROW EXECUTE FUNCTION public.bcba_productivity_snapshot_diff_alerts();

-- Capacity status change trigger
CREATE OR REPLACE FUNCTION public.bcba_capacity_snapshot_status_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev public.bcba_capacity_snapshots%ROWTYPE;
  target_user uuid;
  status_labels jsonb := jsonb_build_object(
    'available','Available',
    'approaching_capacity','Approaching capacity',
    'at_capacity','At capacity',
    'over_capacity','Over capacity',
    'review_required','Review required'
  );
  source_ts text;
BEGIN
  SELECT id INTO target_user FROM public.employees WHERE id = NEW.bcba_id LIMIT 1;
  IF target_user IS NULL THEN
    target_user := NEW.bcba_id;
  END IF;

  SELECT * INTO prev
  FROM public.bcba_capacity_snapshots
  WHERE bcba_id = NEW.bcba_id AND id <> NEW.id
  ORDER BY period_end DESC, updated_at DESC
  LIMIT 1;

  IF prev.id IS NULL OR prev.capacity_status = NEW.capacity_status THEN
    RETURN NEW;
  END IF;

  source_ts := COALESCE(NEW.source_dates->>'capacity_status', to_char(NEW.updated_at,'YYYY-MM-DD"T"HH24:MI:SSOF'));

  PERFORM public.emit_bcba_notification(
    'bcba.capacity_status_changed',
    target_user,
    jsonb_build_object(
      'prev_status', prev.capacity_status,
      'prev_status_label', status_labels->>prev.capacity_status::text,
      'new_status', NEW.capacity_status,
      'new_status_label', status_labels->>NEW.capacity_status::text,
      'source_date', source_ts,
      'snapshot_id', NEW.id,
      'period_start', NEW.period_start,
      'period_end', NEW.period_end,
      'reasoning', COALESCE(NEW.reasoning, '[]'::jsonb)
    ),
    '/bcba/productivity?tab=capacity'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bcba_capacity_status_alerts ON public.bcba_capacity_snapshots;
CREATE TRIGGER trg_bcba_capacity_status_alerts
AFTER INSERT ON public.bcba_capacity_snapshots
FOR EACH ROW EXECUTE FUNCTION public.bcba_capacity_snapshot_status_alerts();
