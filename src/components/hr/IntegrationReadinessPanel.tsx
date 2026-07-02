import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Honest HR integration readiness panel.
 *
 * Renders per-provider readiness for a single onboarding row against the
 * integration_catalog. Never claims "synced" unless the provider is
 * `connected` AND the row records a `synced` status with a real timestamp.
 */

type ProviderKey = "viventium" | "stellar_checks" | "centralreach";

const PROVIDER_META: Record<ProviderKey, { label: string; column: string }> = {
  viventium: { label: "Viventium", column: "viventium" },
  stellar_checks: { label: "Stellar Checks", column: "stellar" },
  centralreach: { label: "CentralReach", column: "centralreach" },
};

export type ReadinessFilter = "all" | "missing_connected" | "missing_synced" | "missing_any";

export type ProviderCatalogStatus = Record<ProviderKey, string>;

const DEFAULT_CATALOG: ProviderCatalogStatus = {
  viventium: "not_configured",
  stellar_checks: "not_configured",
  centralreach: "not_configured",
};

/** Shared hook: reads current integration_catalog status for the three HR providers. */
export function useIntegrationCatalogStatus() {
  const [catalog, setCatalog] = useState<ProviderCatalogStatus>(DEFAULT_CATALOG);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("integration_catalog")
        .select("id,status")
        .in("id", ["viventium", "stellar_checks", "centralreach"]);
      if (cancelled) return;
      if (data) {
        const next: ProviderCatalogStatus = { ...DEFAULT_CATALOG };
        for (const c of data as CatalogRow[]) {
          if (c.id in next) next[c.id as ProviderKey] = c.status;
        }
        setCatalog(next);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);
  return { catalog, loading };
}

/**
 * Returns true when a row is "unready" per the requested filter.
 *  - missing_connected: at least one provider is not connected in the catalog.
 *  - missing_synced:    at least one connected provider has no synced row (with timestamp).
 *  - missing_any:       either of the above is true.
 *  - all:               always true (no filter applied).
 */
export function rowMatchesReadinessFilter(
  row: OnboardingReadinessRow,
  catalog: ProviderCatalogStatus,
  filter: ReadinessFilter,
): boolean {
  if (filter === "all") return true;
  const providers = Object.keys(PROVIDER_META) as ProviderKey[];
  let missingConnected = false;
  let missingSynced = false;
  for (const key of providers) {
    const col = PROVIDER_META[key].column;
    const connected = catalog[key] === "connected";
    if (!connected) { missingConnected = true; continue; }
    const rs = (row[`${col}_status` as keyof OnboardingReadinessRow] as string) ?? "not_started";
    const at = row[`${col}_synced_at` as keyof OnboardingReadinessRow] as string | null | undefined;
    const synced = (rs === "synced" || rs === "ready") && !!at;
    if (!synced) missingSynced = true;
  }
  if (filter === "missing_connected") return missingConnected;
  if (filter === "missing_synced") return missingSynced;
  return missingConnected || missingSynced; // missing_any
}

/** Compact chip row for filtering by integration readiness. */
export function ReadinessFilterChips({
  value,
  onChange,
  counts,
  className,
}: {
  value: ReadinessFilter;
  onChange: (v: ReadinessFilter) => void;
  counts?: Partial<Record<ReadinessFilter, number>>;
  className?: string;
}) {
  const items: [ReadinessFilter, string][] = [
    ["all", "All"],
    ["missing_connected", "Missing connected"],
    ["missing_synced", "Missing synced"],
    ["missing_any", "Any gap"],
  ];
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map(([k, label]) => {
        const active = value === k;
        const n = counts?.[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={cn(
              "h-7 px-2.5 rounded-lg text-[11.5px] transition-colors border",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted",
            )}
          >
            {label}{typeof n === "number" ? ` · ${n}` : ""}
          </button>
        );
      })}
    </div>
  );
}

export interface OnboardingReadinessRow {
  viventium_status?: string | null;
  viventium_synced_at?: string | null;
  viventium_notes?: string | null;
  stellar_status?: string | null;
  stellar_synced_at?: string | null;
  stellar_notes?: string | null;
  centralreach_status?: string | null;
  centralreach_synced_at?: string | null;
  centralreach_notes?: string | null;
}

interface CatalogRow { id: string; status: string }

type Tone = "ok" | "warn" | "crit" | "muted";

export type IntegrationProviderKey = ProviderKey;

export interface ProviderRouteStatus {
  key: ProviderKey;
  label: string;
  connected: boolean;
  synced: boolean;
  syncedAt: string | null;
  reason: string; // human-readable reason when not routable
  routable: boolean;
}

/**
 * Compute per-provider routing eligibility from the catalog + a single
 * onboarding readiness row. A provider is routable only when the catalog
 * says `connected` AND the row records a `synced` status with a real
 * timestamp.
 */
export function useIntegrationRouteAvailability(row: OnboardingReadinessRow | null | undefined) {
  const [catalog, setCatalog] = useState<Record<ProviderKey, string>>({
    viventium: "not_configured",
    stellar_checks: "not_configured",
    centralreach: "not_configured",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("integration_catalog")
        .select("id,status")
        .in("id", ["viventium", "stellar_checks", "centralreach"]);
      if (cancelled) return;
      if (data) {
        const next: Record<ProviderKey, string> = {
          viventium: "not_configured",
          stellar_checks: "not_configured",
          centralreach: "not_configured",
        };
        for (const c of data as CatalogRow[]) {
          if (c.id in next) next[c.id as ProviderKey] = c.status;
        }
        setCatalog(next);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const providers: ProviderRouteStatus[] = (Object.keys(PROVIDER_META) as ProviderKey[]).map((key) => {
    const meta = PROVIDER_META[key];
    const catalogStatus = catalog[key];
    const connected = catalogStatus === "connected";
    const rowStatus = row
      ? ((row[`${meta.column}_status` as keyof OnboardingReadinessRow] as string) ?? "not_started")
      : "not_started";
    const syncedAt = row
      ? ((row[`${meta.column}_synced_at` as keyof OnboardingReadinessRow] as string | null | undefined) ?? null)
      : null;
    const synced = (rowStatus === "synced" || rowStatus === "ready") && !!syncedAt;
    const routable = connected && synced;
    let reason = "";
    if (!connected) reason = "Integration not connected";
    else if (!row) reason = "No onboarding record for this employee";
    else if (!synced) reason = `Not synced (status: ${rowStatus.replace(/_/g, " ")})`;
    return { key, label: meta.label, connected, synced, syncedAt, reason, routable };
  });

  return { providers, loading };
}

function toneFor(catalogStatus: string, rowStatus: string): Tone {
  if (catalogStatus !== "connected") return "muted";
  if (rowStatus === "synced" || rowStatus === "ready") return "ok";
  if (rowStatus === "error") return "crit";
  if (rowStatus === "in_progress" || rowStatus === "pending") return "warn";
  return "muted";
}

function displayValue(catalogStatus: string, rowStatus: string, syncedAt: string | null | undefined): string {
  if (catalogStatus !== "connected") return "not connected";
  if (rowStatus === "synced" && syncedAt) return `synced ${new Date(syncedAt).toLocaleDateString()}`;
  return rowStatus.replace(/_/g, " ");
}

export function IntegrationReadinessPanel({ row, className }: { row: OnboardingReadinessRow; className?: string }) {
  const [catalog, setCatalog] = useState<Record<ProviderKey, string>>({
    viventium: "not_configured",
    stellar_checks: "not_configured",
    centralreach: "not_configured",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("integration_catalog")
        .select("id,status")
        .in("id", ["viventium", "stellar_checks", "centralreach"]);
      if (cancelled || !data) return;
      const next = { ...catalog };
      for (const c of data as CatalogRow[]) {
        if (c.id in next) next[c.id as ProviderKey] = c.status;
      }
      setCatalog(next);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {(Object.keys(PROVIDER_META) as ProviderKey[]).map((key) => {
        const meta = PROVIDER_META[key];
        const rowStatus = (row[`${meta.column}_status` as keyof OnboardingReadinessRow] as string) ?? "not_started";
        const syncedAt = row[`${meta.column}_synced_at` as keyof OnboardingReadinessRow] as string | null | undefined;
        const catalogStatus = catalog[key];
        const tone = toneFor(catalogStatus, rowStatus);
        return (
          <div key={key} className="rounded-lg border border-border/70 bg-background/50 p-2.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{meta.label}</p>
            <p className={cn(
              "mt-1 text-[12px] font-medium",
              tone === "ok" && "text-emerald-600",
              tone === "warn" && "text-amber-600",
              tone === "crit" && "text-red-600",
              tone === "muted" && "text-muted-foreground",
            )}>
              {displayValue(catalogStatus, rowStatus, syncedAt)}
            </p>
            {catalogStatus !== "connected" && (
              <p className="mt-0.5 text-[10.5px] text-muted-foreground/80">Integration not connected yet</p>
            )}
          </div>
        );
      })}
    </div>
  );
}