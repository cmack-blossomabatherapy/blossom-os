-- ============================================================================
-- 1. ROLES INFRASTRUCTURE
-- ============================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'viewer');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: any signed-in role
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Helper: can edit (admin or staff)
CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'staff')
  )
$$;

-- user_roles policies
CREATE POLICY "Users view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 2. PROFILES
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile + default 'staff' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  -- First user becomes admin, everyone else gets staff
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
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

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- 3. CLIENTS
-- ============================================================================
CREATE TYPE public.client_stage AS ENUM (
  'BCBA Assignment', 'Pending Initial Auth', 'Waiting on Consent Forms',
  'Schedule Assessment', 'Assessment Scheduled', 'In QA',
  'Pending Treatment Auth', 'Staffing Needed', 'Restaffing Needed',
  'Pending Start Date', 'Active', 'Flaked', 'Discharged', 'Services on Pause'
);
CREATE TYPE public.auth_status AS ENUM ('Not Submitted', 'Submitted', 'Approved', 'Denied', 'Expired');
CREATE TYPE public.staffing_status AS ENUM ('Not Needed', 'Needed', 'In Progress', 'Assigned');
CREATE TYPE public.qa_status AS ENUM ('Not Started', 'In Review', 'Complete');

CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  child_age TEXT,
  state TEXT NOT NULL,
  clinic TEXT NOT NULL,
  stage public.client_stage NOT NULL DEFAULT 'BCBA Assignment',
  bcba TEXT,
  rbt TEXT,
  intake_owner TEXT,
  auth_status public.auth_status NOT NULL DEFAULT 'Not Submitted',
  staffing_status public.staffing_status NOT NULL DEFAULT 'Not Needed',
  qa_status public.qa_status NOT NULL DEFAULT 'Not Started',
  payor TEXT NOT NULL DEFAULT '',
  next_action TEXT DEFAULT '',
  next_task_due DATE,
  assessment_date DATE,
  start_date DATE,
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vob_completed_at TIMESTAMPTZ,
  blockers TEXT[] NOT NULL DEFAULT '{}',
  automation_log TEXT[] NOT NULL DEFAULT '{}',
  staffing_history JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users view clients" ON public.clients
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Editors create clients" ON public.clients
  FOR INSERT WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors update clients" ON public.clients
  FOR UPDATE USING (public.can_edit(auth.uid()));
CREATE POLICY "Admins delete clients" ON public.clients
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER clients_touch BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_clients_stage ON public.clients(stage);
CREATE INDEX idx_clients_state ON public.clients(state);
CREATE INDEX idx_clients_clinic ON public.clients(clinic);

-- ============================================================================
-- 4. CLIENT_TASKS
-- ============================================================================
CREATE TABLE public.client_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view tasks" ON public.client_tasks
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Editors insert tasks" ON public.client_tasks
  FOR INSERT WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors update tasks" ON public.client_tasks
  FOR UPDATE USING (public.can_edit(auth.uid()));
CREATE POLICY "Editors delete tasks" ON public.client_tasks
  FOR DELETE USING (public.can_edit(auth.uid()));

CREATE TRIGGER client_tasks_touch BEFORE UPDATE ON public.client_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_client_tasks_client ON public.client_tasks(client_id);

-- ============================================================================
-- 5. CLIENT_DOCUMENTS
-- ============================================================================
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PDF',
  storage_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view documents" ON public.client_documents
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Editors insert documents" ON public.client_documents
  FOR INSERT WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors update documents" ON public.client_documents
  FOR UPDATE USING (public.can_edit(auth.uid()));
CREATE POLICY "Editors delete documents" ON public.client_documents
  FOR DELETE USING (public.can_edit(auth.uid()));

CREATE INDEX idx_client_documents_client ON public.client_documents(client_id);

-- ============================================================================
-- 6. CLIENT_TIMELINE
-- ============================================================================
CREATE TYPE public.timeline_event_type AS ENUM ('system', 'auth', 'staffing', 'schedule', 'qa', 'note', 'stage');

CREATE TABLE public.client_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_type public.timeline_event_type NOT NULL DEFAULT 'note',
  description TEXT NOT NULL,
  user_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view timeline" ON public.client_timeline
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Editors insert timeline" ON public.client_timeline
  FOR INSERT WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admins delete timeline" ON public.client_timeline
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_client_timeline_client ON public.client_timeline(client_id, created_at DESC);

-- ============================================================================
-- 7. CLIENT_AUTHORIZATIONS
-- ============================================================================
CREATE TYPE public.auth_kind AS ENUM ('Initial', 'Treatment');

CREATE TABLE public.client_authorizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  kind public.auth_kind NOT NULL,
  status public.auth_status NOT NULL DEFAULT 'Not Submitted',
  submitted_date DATE,
  approved_date DATE,
  expiration_date DATE,
  hours TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view auths" ON public.client_authorizations
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Editors insert auths" ON public.client_authorizations
  FOR INSERT WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors update auths" ON public.client_authorizations
  FOR UPDATE USING (public.can_edit(auth.uid()));
CREATE POLICY "Editors delete auths" ON public.client_authorizations
  FOR DELETE USING (public.can_edit(auth.uid()));

CREATE TRIGGER client_authorizations_touch BEFORE UPDATE ON public.client_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_client_auths_client ON public.client_authorizations(client_id);

-- ============================================================================
-- 8. CLIENT_SCHEDULE_SLOTS
-- ============================================================================
CREATE TYPE public.schedule_day AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

CREATE TABLE public.client_schedule_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  day public.schedule_day NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  rbt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, day, start_time, end_time)
);

ALTER TABLE public.client_schedule_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view schedule" ON public.client_schedule_slots
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Editors insert schedule" ON public.client_schedule_slots
  FOR INSERT WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors update schedule" ON public.client_schedule_slots
  FOR UPDATE USING (public.can_edit(auth.uid()));
CREATE POLICY "Editors delete schedule" ON public.client_schedule_slots
  FOR DELETE USING (public.can_edit(auth.uid()));

CREATE INDEX idx_client_schedule_client ON public.client_schedule_slots(client_id);

-- ============================================================================
-- 9. REALTIME
-- ============================================================================
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.client_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.client_documents REPLICA IDENTITY FULL;
ALTER TABLE public.client_timeline REPLICA IDENTITY FULL;
ALTER TABLE public.client_authorizations REPLICA IDENTITY FULL;
ALTER TABLE public.client_schedule_slots REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_authorizations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_schedule_slots;