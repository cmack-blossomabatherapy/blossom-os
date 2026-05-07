
ALTER TABLE public.academy_tracks ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS pinned_at timestamptz, ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.academy_phases ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS pinned_at timestamptz, ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.academy_weeks ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS pinned_at timestamptz, ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.academy_modules ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS pinned_at timestamptz, ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.academy_module_resources ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS pinned_at timestamptz, ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_academy_phases_archived ON public.academy_phases(is_archived);
CREATE INDEX IF NOT EXISTS idx_academy_weeks_archived ON public.academy_weeks(is_archived);
CREATE INDEX IF NOT EXISTS idx_academy_modules_archived ON public.academy_modules(is_archived);
