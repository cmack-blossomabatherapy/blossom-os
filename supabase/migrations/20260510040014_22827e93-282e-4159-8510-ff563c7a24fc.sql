-- ============================================
-- Employee Hub: HR self-service, PTO, login vault
-- All additive. Nothing existing is dropped or altered.
-- ============================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.pto_request_type AS ENUM ('vacation','sick','personal','unpaid','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pto_request_status AS ENUM ('draft','submitted','pending_review','approved','denied','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.login_access_action AS ENUM ('viewed','copied_username','copied_password','opened','unlock_failed','unlock_success');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.unlock_method AS ENUM ('pin','passkey');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: is_vault_admin (admin OR hr_admin OR ops_manager)
CREATE OR REPLACE FUNCTION public.is_vault_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'hr_admin'::public.app_role)
      OR public.has_role(_user_id, 'ops_manager'::public.app_role)
$$;

-- ============================================
-- 1. employee_hr_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.employee_hr_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  manager_id uuid,
  department text,
  location_state text,
  pto_balance_hours numeric DEFAULT 0,
  sick_balance_hours numeric DEFAULT 0,
  pay_frequency text,
  payroll_provider text,
  last_pay_date date,
  next_pay_date date,
  payroll_login_url text,
  time_system_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_hr_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own HR profile" ON public.employee_hr_profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Users insert own HR profile" ON public.employee_hr_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own HR profile" ON public.employee_hr_profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Vault admins delete HR profile" ON public.employee_hr_profiles
  FOR DELETE USING (public.is_vault_admin(auth.uid()));

CREATE TRIGGER trg_employee_hr_profiles_updated_at
  BEFORE UPDATE ON public.employee_hr_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- 2. pto_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.pto_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pto_type public.pto_request_type NOT NULL DEFAULT 'vacation',
  start_date date NOT NULL,
  end_date date NOT NULL,
  partial_day boolean NOT NULL DEFAULT false,
  hours numeric NOT NULL DEFAULT 0,
  reason text,
  status public.pto_request_status NOT NULL DEFAULT 'draft',
  manager_id uuid,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pto_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own PTO" ON public.pto_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = manager_id
    OR public.is_vault_admin(auth.uid())
  );
CREATE POLICY "Users insert own PTO" ON public.pto_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own draft/cancel" ON public.pto_requests
  FOR UPDATE USING (
    (auth.uid() = user_id AND status IN ('draft','submitted','pending_review'))
    OR auth.uid() = manager_id
    OR public.is_vault_admin(auth.uid())
  );
CREATE POLICY "Users delete own draft" ON public.pto_requests
  FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

CREATE INDEX IF NOT EXISTS idx_pto_user ON public.pto_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pto_manager ON public.pto_requests(manager_id);

CREATE TRIGGER trg_pto_requests_updated_at
  BEFORE UPDATE ON public.pto_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- 3. employee_hours_snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS public.employee_hours_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  scheduled_hours numeric NOT NULL DEFAULT 0,
  source text DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
ALTER TABLE public.employee_hours_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own hours" ON public.employee_hours_snapshots
  FOR SELECT USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Vault admins manage hours" ON public.employee_hours_snapshots
  FOR ALL USING (public.is_vault_admin(auth.uid())) WITH CHECK (public.is_vault_admin(auth.uid()));

-- ============================================
-- 4. hr_documents
-- ============================================
CREATE TABLE IF NOT EXISTS public.hr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'policy',
  description text,
  file_url text,
  external_url text,
  audience text[] DEFAULT '{}',
  requires_acknowledgement boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active HR docs" ON public.hr_documents
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Vault admins manage HR docs" ON public.hr_documents
  FOR ALL USING (public.is_vault_admin(auth.uid())) WITH CHECK (public.is_vault_admin(auth.uid()));

CREATE TRIGGER trg_hr_documents_updated_at
  BEFORE UPDATE ON public.hr_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- 5. hr_document_acknowledgements
-- ============================================
CREATE TABLE IF NOT EXISTS public.hr_document_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.hr_documents(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);
ALTER TABLE public.hr_document_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own acks" ON public.hr_document_acknowledgements
  FOR SELECT USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Users insert own acks" ON public.hr_document_acknowledgements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. employee_logins (vault)
-- ============================================
CREATE TABLE IF NOT EXISTS public.employee_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  system_name text NOT NULL,
  system_category text DEFAULT 'general',
  login_url text,
  username text,
  encrypted_password text,
  notes text,
  assigned_by uuid,
  password_rotates_at date,
  password_reset_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own logins" ON public.employee_logins
  FOR SELECT USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Vault admins insert logins" ON public.employee_logins
  FOR INSERT WITH CHECK (public.is_vault_admin(auth.uid()));
CREATE POLICY "Vault admins update logins" ON public.employee_logins
  FOR UPDATE USING (public.is_vault_admin(auth.uid())) WITH CHECK (public.is_vault_admin(auth.uid()));
CREATE POLICY "Vault admins delete logins" ON public.employee_logins
  FOR DELETE USING (public.is_vault_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_logins_user ON public.employee_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_logins_active ON public.employee_logins(is_active);

CREATE TRIGGER trg_employee_logins_updated_at
  BEFORE UPDATE ON public.employee_logins
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- 7. login_access_logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.login_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_id uuid REFERENCES public.employee_logins(id) ON DELETE SET NULL,
  action public.login_access_action NOT NULL,
  device text,
  ip text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.login_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own access logs" ON public.login_access_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Users insert own access logs" ON public.login_access_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.login_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_login ON public.login_access_logs(login_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON public.login_access_logs(occurred_at DESC);

-- ============================================
-- 8. employee_pin_settings
-- ============================================
CREATE TABLE IF NOT EXISTS public.employee_pin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  pin_salt text NOT NULL,
  iterations integer NOT NULL DEFAULT 100000,
  last_set_at timestamptz NOT NULL DEFAULT now(),
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  passkey_credential_id text,
  passkey_public_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_pin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pin settings" ON public.employee_pin_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pin settings" ON public.employee_pin_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pin settings" ON public.employee_pin_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_employee_pin_settings_updated_at
  BEFORE UPDATE ON public.employee_pin_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- 9. secure_unlock_events
-- ============================================
CREATE TABLE IF NOT EXISTS public.secure_unlock_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method public.unlock_method NOT NULL,
  success boolean NOT NULL,
  device text,
  ip text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.secure_unlock_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own unlock events" ON public.secure_unlock_events
  FOR SELECT USING (auth.uid() = user_id OR public.is_vault_admin(auth.uid()));
CREATE POLICY "Users insert own unlock events" ON public.secure_unlock_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_unlock_user_time ON public.secure_unlock_events(user_id, occurred_at DESC);
