/**
 * Blossom OS — Intake Action Guard (runtime).
 *
 * Single in-memory source of truth the LeadsContext / bulk / drawer /
 * detail action helpers consult synchronously before every mutation
 * (moveStage, assignOwner, addTag, bulkUpdate, deleteLeads, updateLead,
 * seeded automation). The mode itself is loaded from
 * public.intake_operating_mode via useIntakeOperatingMode inside
 * LeadsProvider and mirrored here.
 *
 * Default state is `null` (unknown → permit). Once the provider loads
 * a mode, the guard is armed. A live INGEST_ONLY mode short-circuits
 * every operational mutation with a "Preview only" toast and a written
 * preview payload, without ever calling Supabase.
 *
 * The database also blocks these paths (BEFORE INSERT/UPDATE triggers
 * on intake_communications, intake_tasks and intake_leads), so this is
 * strictly the UX layer that keeps users out of raw error toasts.
 */
import { toast } from "sonner";
import type { IntakeMode } from "@/lib/intake/operatingMode";
import { INTAKE_ACTIONS_DISABLED_MESSAGE } from "@/lib/intake/operatingMode";

let currentMode: IntakeMode | null = null;

export function setIntakeActionMode(mode: IntakeMode | null) {
  currentMode = mode;
}

export function getIntakeActionMode(): IntakeMode | null {
  return currentMode;
}

export function isIntakeActionAllowed(): boolean {
  return currentMode !== "INGEST_ONLY";
}

/**
 * Preview payload emitted by a blocked mutation so the caller can log
 * the intended action to its local timeline / preview dialog without
 * writing anything to the database.
 */
export interface BlockedActionPreview {
  blocked: true;
  mode: IntakeMode | null;
  action: string;
  targets: string[];
  detail: Record<string, unknown>;
  message: string;
  timestamp: string;
}

/**
 * Synchronous guard for any intake operational mutation. Returns
 * `null` when the action is allowed (caller proceeds). Returns a
 * BlockedActionPreview when blocked — caller renders the preview UI
 * or emits the toast (already shown here) and must NOT write to DB.
 */
export function guardIntakeMutation(
  action: string,
  targets: string[],
  detail: Record<string, unknown> = {},
  opts: { silent?: boolean; description?: string } = {},
): BlockedActionPreview | null {
  if (currentMode !== "INGEST_ONLY") return null;
  if (!opts.silent) {
    toast.warning(INTAKE_ACTIONS_DISABLED_MESSAGE, {
      description:
        opts.description ??
        `Preview only — would ${action}${targets.length ? ` on ${targets.length} record(s)` : ""}. No data changed.`,
    });
  }
  return {
    blocked: true,
    mode: currentMode,
    action,
    targets,
    detail,
    message: INTAKE_ACTIONS_DISABLED_MESSAGE,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Human-readable summary of what a mutation WOULD have done, suitable
 * for a Preview dialog / lead automation log entry.
 */
export function describePreview(preview: BlockedActionPreview): string {
  const parts = [`Preview only — ${preview.action}`];
  if (preview.targets.length) parts.push(`(${preview.targets.length} target(s))`);
  const detailStr = Object.entries(preview.detail)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");
  if (detailStr) parts.push(`— ${detailStr}`);
  parts.push(`· ${preview.timestamp}`);
  return parts.join(" ");
}