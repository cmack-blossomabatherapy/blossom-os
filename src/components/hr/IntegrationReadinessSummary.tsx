import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { OnboardingReadinessRow } from "./IntegrationReadinessPanel";

/**
 * Honest aggregate readiness across a list of onboarding rows.
 *
 * Per provider it shows: catalog connection state (from integration_catalog)
 * and how many rows report `synced` (or `ready`). Never claims sync activity
 * unless the provider is actually connected AND rows record a `synced` status.
 */

type ProviderKey = "viventium" | "stellar_checks" | "centralreach";

const PROVIDERS: { key: ProviderKey; label: string; column: string }[] = [
  { key: "viventium", label: "Viventium", column: "viventium" },
  { key: "stellar_checks", label: "Stellar Checks", column: "stellar" },
  { key: "centralreach", label: "CentralReach", column: "centralreach" },
];

type CatalogRow = { id: string; status: string };

export function IntegrationReadinessSummary({
  rows,
  className,
}: {
  rows: OnboardingReadinessRow[];
  className?: string;
}) {
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
      for (const r of data as CatalogRow[]) {
        if (r.id in next) next[r.id as ProviderKey] = r.status;
      }
      setCatalog(next);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = rows.length;

  return (
    <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
      {PROVIDERS.map((p) => {
        const catalogStatus = catalog[p.key];
        const connected = catalogStatus === "connected";
        let synced = 0;
        if (connected) {
          for (const r of rows) {
            const rs = (r as Record<string, unknown>)[`${p.column}_status`] as string | undefined;
            if (rs === "synced" || rs === "ready") synced++;
          }
        }
        return (
          <div key={p.key} className="rounded-lg border border-border/70 bg-background/60 p-2.5">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{p.label}</p>
            <p className={cn(
              "mt-1 text-[12px] font-medium",
              connected ? "text-emerald-600" : "text-muted-foreground",
            )}>
              {connected ? `connected · ${synced}/${total} synced` : "not connected"}
            </p>
            {!connected && (
              <p className="mt-0.5 text-[10.5px] text-muted-foreground/80">
                No records will sync until this integration is connected.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
