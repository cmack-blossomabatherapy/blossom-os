
CREATE TABLE IF NOT EXISTS public.evaluation_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid,
  staff_id uuid,
  action text NOT NULL,
  actor text,
  details_json jsonb DEFAULT '{}'::jsonb,
  override_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eval_audit_eval ON public.evaluation_audit_log(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_eval_audit_staff ON public.evaluation_audit_log(staff_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_audit_log TO anon, authenticated;
GRANT ALL ON public.evaluation_audit_log TO service_role;
ALTER TABLE public.evaluation_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit log open read" ON public.evaluation_audit_log FOR SELECT USING (true);
CREATE POLICY "audit log open insert" ON public.evaluation_audit_log FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.evaluation_settings (
  id int PRIMARY KEY DEFAULT 1,
  quarterly_enabled boolean NOT NULL DEFAULT true,
  annual_enabled boolean NOT NULL DEFAULT true,
  default_bcba_frequency text NOT NULL DEFAULT 'Quarterly',
  default_rbt_frequency text NOT NULL DEFAULT 'Quarterly',
  auto_create_next boolean NOT NULL DEFAULT false,
  self_due_days int NOT NULL DEFAULT 14,
  leadership_due_days int NOT NULL DEFAULT 7,
  meeting_due_days int NOT NULL DEFAULT 14,
  finalize_due_days int NOT NULL DEFAULT 7,
  reminder_7_before boolean NOT NULL DEFAULT true,
  reminder_3_before boolean NOT NULL DEFAULT true,
  reminder_on_due boolean NOT NULL DEFAULT true,
  reminder_3_overdue boolean NOT NULL DEFAULT true,
  reminder_7_overdue boolean NOT NULL DEFAULT true,
  reminder_weekly_overdue boolean NOT NULL DEFAULT true,
  sender_name text DEFAULT 'Blossom ABA Therapy',
  sender_email text,
  reply_to_email text,
  email_connected boolean NOT NULL DEFAULT false,
  staff_can_view_past boolean NOT NULL DEFAULT true,
  staff_can_download boolean NOT NULL DEFAULT true,
  reviewer_can_view_past boolean NOT NULL DEFAULT true,
  state_director_scope boolean NOT NULL DEFAULT true,
  hr_sees_all_states boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_settings TO anon, authenticated;
GRANT ALL ON public.evaluation_settings TO service_role;
ALTER TABLE public.evaluation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings open read" ON public.evaluation_settings FOR SELECT USING (true);
CREATE POLICY "settings open write" ON public.evaluation_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.evaluation_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
