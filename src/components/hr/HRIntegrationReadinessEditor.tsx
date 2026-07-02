import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logHrEvent } from "@/lib/hr/activityEvents";
import { useIntegrationCatalogStatus, type OnboardingReadinessRow } from "./IntegrationReadinessPanel";
import { cn } from "@/lib/utils";
import { Save, AlertTriangle } from "lucide-react";

/**
 * Reusable HR integration readiness editor.
 *
 * Writes durable updates to `employee_onboarding` per provider and always
 * records a `hr_activity_events` audit row. Enforces validation rules:
 *  - status `synced` requires an external id OR a note.
 *  - status `error` requires a note.
 *
 * This editor never claims a provider is "connected". It only manages the
 * internal readiness/status tracking that Blossom OS uses today until real
 * integrations are wired up.
 */

type ProviderKey = "viventium" | "stellar_checks" | "centralreach";
const PROVIDERS: { key: ProviderKey; column: "viventium" | "stellar" | "centralreach"; label: string }[] = [
  { key: "viventium", column: "viventium", label: "Viventium" },
  { key: "stellar_checks", column: "stellar", label: "Stellar Checks" },
  { key: "centralreach", column: "centralreach", label: "CentralReach" },
];

export const READINESS_STATUSES = [
  "not_started",
  "pending",
  "in_progress",
  "ready",
  "synced",
  "error",
  "not_applicable",
] as const;
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];

export function validateReadinessUpdate(
  status: ReadinessStatus,
  externalId: string | null | undefined,
  notes: string | null | undefined,
): { ok: boolean; reason?: string } {
  const hasId = !!externalId?.trim();
  const hasNotes = !!notes?.trim();
  if (status === "synced" && !hasId && !hasNotes) {
    return { ok: false, reason: "Synced status requires an external ID or a note explaining why no ID exists." };
  }
  if (status === "error" && !hasNotes) {
    return { ok: false, reason: "Error status requires a note describing the failure." };
  }
  return { ok: true };
}

export interface HRIntegrationReadinessEditorProps {
  onboardingId: string;
  employeeId?: string | null;
  row: OnboardingReadinessRow & { [key: string]: any };
  onSaved?: () => void;
  className?: string;
}

interface DraftRow {
  status: ReadinessStatus;
  externalId: string;
  notes: string;
}

export function HRIntegrationReadinessEditor({ onboardingId, employeeId, row, onSaved, className }: HRIntegrationReadinessEditorProps) {
  const { catalog } = useIntegrationCatalogStatus();
  const [saving, setSaving] = useState<ProviderKey | null>(null);
  const [drafts, setDrafts] = useState<Record<ProviderKey, DraftRow>>(() => {
    const initial = {} as Record<ProviderKey, DraftRow>;
    for (const p of PROVIDERS) {
      initial[p.key] = {
        status: ((row?.[`${p.column}_status`] as ReadinessStatus) ?? "not_started"),
        externalId: (row?.[`${p.column}_external_id`] as string) ?? "",
        notes: (row?.[`${p.column}_notes`] as string) ?? "",
      };
    }
    return initial;
  });

  const update = (key: ProviderKey, patch: Partial<DraftRow>) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const save = async (p: (typeof PROVIDERS)[number]) => {
    const draft = drafts[p.key];
    const check = validateReadinessUpdate(draft.status, draft.externalId, draft.notes);
    if (!check.ok) {
      toast({ title: "Cannot save", description: check.reason });
      return;
    }
    setSaving(p.key);
    const now = new Date().toISOString();
    const update: Record<string, any> = {
      [`${p.column}_status`]: draft.status,
      [`${p.column}_external_id`]: draft.externalId || null,
      [`${p.column}_notes`]: draft.notes || null,
    };
    // Record a synced_at timestamp only for terminal states.
    if (draft.status === "synced" || draft.status === "ready") {
      update[`${p.column}_synced_at`] = now;
    }
    const { error } = await (supabase.from("employee_onboarding" as never) as any)
      .update(update)
      .eq("id", onboardingId);
    setSaving(null);
    if (error) {
      toast({ title: "Save failed", description: error.message });
      return;
    }
    await logHrEvent({
      eventType: "integration_readiness_updated",
      title: `${p.label} readiness set to ${draft.status.replace(/_/g, " ")}`,
      description: draft.notes || null,
      employeeId: employeeId ?? null,
      onboardingId,
      metadata: {
        provider: p.key,
        status: draft.status,
        external_id: draft.externalId || null,
        catalog_status: catalog[p.key] ?? "not_configured",
      },
    });
    toast({ title: `${p.label} readiness updated` });
    onSaved?.();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {PROVIDERS.map((p) => {
        const draft = drafts[p.key];
        const catalogStatus = catalog[p.key] ?? "not_configured";
        const connected = catalogStatus === "connected";
        return (
          <div key={p.key} className="rounded-xl border border-border/70 bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[12.5px] font-medium tracking-tight">{p.label}</p>
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Catalog: {catalogStatus.replace(/_/g, " ")}
                </p>
              </div>
              {!connected && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  Not connected — internal tracking only
                </span>
              )}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="text-[11px] text-muted-foreground space-y-1">
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => update(p.key, { status: e.target.value as ReadinessStatus })}
                  className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-[12px]"
                >
                  {READINESS_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-muted-foreground space-y-1">
                <span>External ID / reference</span>
                <input
                  value={draft.externalId}
                  onChange={(e) => update(p.key, { externalId: e.target.value })}
                  placeholder="Provider ID"
                  className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-[12px]"
                />
              </label>
              <label className="text-[11px] text-muted-foreground space-y-1">
                <span>Notes</span>
                <input
                  value={draft.notes}
                  onChange={(e) => update(p.key, { notes: e.target.value })}
                  placeholder="Context / blockers"
                  className="w-full h-8 rounded-lg border border-border/70 bg-card px-2 text-[12px]"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => save(p)}
                disabled={saving === p.key}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-3 w-3" /> {saving === p.key ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}