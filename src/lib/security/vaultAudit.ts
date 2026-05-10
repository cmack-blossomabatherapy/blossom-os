import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Action = Database["public"]["Enums"]["login_access_action"];
type Method = Database["public"]["Enums"]["unlock_method"];

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  return "Web";
}

export async function logVaultEvent(args: {
  userId: string;
  loginId?: string | null;
  action: Action;
}) {
  try {
    await supabase.from("login_access_logs").insert({
      user_id: args.userId,
      login_id: args.loginId ?? null,
      action: args.action,
      device: deviceLabel(),
    });
  } catch {
    /* swallow */
  }
}

export async function logUnlockEvent(args: {
  userId: string;
  method: Method;
  success: boolean;
}) {
  try {
    await supabase.from("secure_unlock_events").insert({
      user_id: args.userId,
      method: args.method,
      success: args.success,
      device: deviceLabel(),
    });
  } catch {
    /* ignore */
  }
}