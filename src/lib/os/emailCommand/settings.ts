import { supabase } from "@/integrations/supabase/client";

export interface EmailCcSettings {
  id: string;
  teams_write_enabled: boolean;
  calendar_write_enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

export type EmailCcSettingKey = "teams_write_enabled" | "calendar_write_enabled";

export async function getEmailCcSettings(): Promise<EmailCcSettings | null> {
  const { data, error } = await supabase
    .from("email_cc_settings")
    .select("id, teams_write_enabled, calendar_write_enabled, updated_at, updated_by")
    .eq("id", "global")
    .maybeSingle();
  if (error) {
    console.warn("getEmailCcSettings failed", error);
    return null;
  }
  return (data as EmailCcSettings) ?? null;
}

export async function setEmailCcSetting(
  key: EmailCcSettingKey,
  value: boolean,
): Promise<{ ok: true; row: EmailCcSettings } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("set_email_cc_setting", {
    _key: key,
    _value: value,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data as EmailCcSettings };
}