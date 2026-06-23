CREATE TABLE IF NOT EXISTS public.email_cc_settings (
  id text PRIMARY KEY DEFAULT 'global',
  teams_write_enabled boolean NOT NULL DEFAULT false,
  calendar_write_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.email_cc_settings TO authenticated;
GRANT ALL ON public.email_cc_settings TO service_role;

ALTER TABLE public.email_cc_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_cc_settings_select_auth" ON public.email_cc_settings;
CREATE POLICY "email_cc_settings_select_auth"
  ON public.email_cc_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "email_cc_settings_admin_update" ON public.email_cc_settings;
CREATE POLICY "email_cc_settings_admin_update"
  ON public.email_cc_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.email_cc_settings (id) VALUES ('global')
  ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_email_cc_setting(_key text, _value boolean)
RETURNS public.email_cc_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.email_cc_settings;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _key NOT IN ('teams_write_enabled', 'calendar_write_enabled') THEN
    RAISE EXCEPTION 'invalid_key';
  END IF;

  IF _key = 'teams_write_enabled' THEN
    UPDATE public.email_cc_settings
       SET teams_write_enabled = _value, updated_at = now(), updated_by = auth.uid()
     WHERE id = 'global'
     RETURNING * INTO _row;
  ELSE
    UPDATE public.email_cc_settings
       SET calendar_write_enabled = _value, updated_at = now(), updated_by = auth.uid()
     WHERE id = 'global'
     RETURNING * INTO _row;
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_email_cc_setting(text, boolean) TO authenticated;