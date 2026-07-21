/**
 * Blossom OS — Intake Operating Mode.
 *
 * Single source of truth for whether operational (outbound) intake actions
 * are allowed. Backed by public.intake_operating_mode; server-enforced by
 * public.intake_actions_enabled() and a BEFORE INSERT trigger on
 * intake_communications. This module gives the UI a fast, cached read so
 * we can disable buttons and render "Preview only" messaging without
 * needing a round-trip on every click.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type IntakeMode = "INGEST_ONLY" | "FULL";

export interface IntakeOperatingModeState {
  mode: IntakeMode;
  note: string | null;
  updatedAt: string | null;
}

export const INTAKE_MODE_QUERY_KEY = ["intake", "operating-mode"] as const;
export const INTAKE_ACTIONS_DISABLED_MESSAGE =
  "Preview only — Intake actions are not enabled";

export async function fetchIntakeOperatingMode(): Promise<IntakeOperatingModeState> {
  const { data, error } = await supabase
    .from("intake_operating_mode")
    .select("mode,note,updated_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    // Fail closed: assume ingest-only if we can't read the mode.
    return { mode: "INGEST_ONLY", note: null, updatedAt: null };
  }
  const raw = (data?.mode as string | undefined) ?? "INGEST_ONLY";
  const mode: IntakeMode = raw === "FULL" ? "FULL" : "INGEST_ONLY";
  return {
    mode,
    note: (data?.note as string | null) ?? null,
    updatedAt: (data?.updated_at as string | null) ?? null,
  };
}

export function useIntakeOperatingMode() {
  return useQuery({
    queryKey: INTAKE_MODE_QUERY_KEY,
    queryFn: fetchIntakeOperatingMode,
    staleTime: 30_000,
  });
}

/**
 * Client-side guard for any operational intake action (call/sms/email/
 * outbound webhook/etc.). Returns true when the action should proceed.
 *
 * The database also blocks these actions via a trigger — this is a fast
 * UX layer so users see "Preview only" instead of a raw DB error.
 */
export function guardIntakeAction(
  mode: IntakeMode | undefined,
  opts?: { silent?: boolean; description?: string }
): boolean {
  if (mode === "FULL") return true;
  if (!opts?.silent) {
    toast.warning(INTAKE_ACTIONS_DISABLED_MESSAGE, {
      description:
        opts?.description ??
        "Intake is in INGEST_ONLY mode. Ingestion runs, but outbound actions are blocked.",
    });
  }
  return false;
}