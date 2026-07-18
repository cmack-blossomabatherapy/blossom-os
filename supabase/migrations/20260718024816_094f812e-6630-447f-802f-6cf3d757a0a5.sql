
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS centralreach_id text;
ALTER TABLE public.clients   ADD COLUMN IF NOT EXISTS centralreach_id text;

CREATE UNIQUE INDEX IF NOT EXISTS employees_centralreach_id_key
  ON public.employees (centralreach_id)
  WHERE centralreach_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clients_centralreach_id_key
  ON public.clients (centralreach_id)
  WHERE centralreach_id IS NOT NULL;
