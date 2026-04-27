ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS clinic text,
ADD COLUMN IF NOT EXISTS part_of_leadership boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS dashboard_access text NOT NULL DEFAULT 'department',
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_part_of_leadership ON public.profiles(part_of_leadership);
CREATE INDEX IF NOT EXISTS idx_profiles_dashboard_access ON public.profiles(dashboard_access);