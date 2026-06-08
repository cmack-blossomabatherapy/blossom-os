INSERT INTO public.academy_tracks (name, description, is_active)
SELECT 'State Director Journey',
       'Operational onboarding for new State Directors — culture, command center, scorecards, staffing, intake, authorizations, and independent state leadership.',
       true
WHERE NOT EXISTS (
  SELECT 1 FROM public.academy_tracks WHERE name = 'State Director Journey'
);