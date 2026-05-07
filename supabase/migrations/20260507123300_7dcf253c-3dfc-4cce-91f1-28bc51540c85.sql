INSERT INTO public.hr_settings (key, value, description) VALUES
  ('notifications.training', jsonb_build_object(
    'enabled', true,
    'channels', jsonb_build_object('in_app', true, 'email', true),
    'recipients', jsonb_build_object('assignee', true, 'supervisor', false, 'hr_admin', true),
    'events', jsonb_build_object(
      'assigned',      jsonb_build_object('enabled', true,  'channels', ARRAY['in_app','email']),
      'due_soon',      jsonb_build_object('enabled', true,  'lead_days', 3,  'channels', ARRAY['in_app','email']),
      'overdue',       jsonb_build_object('enabled', true,  'channels', ARRAY['in_app','email']),
      'completed',     jsonb_build_object('enabled', true,  'channels', ARRAY['in_app']),
      'quiz_failed',   jsonb_build_object('enabled', true,  'channels', ARRAY['in_app','email']),
      'cert_expiring', jsonb_build_object('enabled', true,  'lead_days', 30, 'channels', ARRAY['in_app','email']),
      'new_course',    jsonb_build_object('enabled', false, 'channels', ARRAY['in_app'])
    ),
    'digest',      jsonb_build_object('enabled', false, 'frequency', 'weekly', 'day', 'mon', 'hour', 8),
    'quiet_hours', jsonb_build_object('enabled', false, 'start', '20:00', 'end', '07:00')
  ), 'Notification rules for training assignments, due dates, completions, and certifications.')
ON CONFLICT (key) DO NOTHING;