
-- device_inventory
DROP POLICY IF EXISTS "Authenticated can view inventory" ON public.device_inventory;
CREATE POLICY "Admin and HR can view inventory"
  ON public.device_inventory FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- email_cc_settings
DROP POLICY IF EXISTS "email_cc_settings_select_auth" ON public.email_cc_settings;
CREATE POLICY "email_cc_settings_admin_select"
  ON public.email_cc_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- email_templates
DROP POLICY IF EXISTS "Authenticated can view templates" ON public.email_templates;
CREATE POLICY "Admins can view templates"
  ON public.email_templates FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- phone_ai_call_routing
DROP POLICY IF EXISTS "auth read routing" ON public.phone_ai_call_routing;
CREATE POLICY "Admins and ops read routing"
  ON public.phone_ai_call_routing FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));

-- phone_system_state
DROP POLICY IF EXISTS "Authenticated can read phone system" ON public.phone_system_state;
CREATE POLICY "Admins and ops read phone system"
  ON public.phone_system_state FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'ops_manager'::app_role));

-- training_quizzes
DROP POLICY IF EXISTS "Training quizzes are visible to signed in users" ON public.training_quizzes;
CREATE POLICY "Training quizzes visible to trainers and admins"
  ON public.training_quizzes FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'exec'::app_role)
    OR has_role(auth.uid(), 'ops_manager'::app_role)
    OR has_permission(auth.uid(), 'hr.training.view'::text)
  );

-- training_quiz_questions (contains correct_answer)
DROP POLICY IF EXISTS "Training quiz questions are visible to signed in users" ON public.training_quiz_questions;
CREATE POLICY "Training quiz questions visible to trainers and admins"
  ON public.training_quiz_questions FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'exec'::app_role)
    OR has_role(auth.uid(), 'ops_manager'::app_role)
    OR has_permission(auth.uid(), 'hr.training.view'::text)
  );
