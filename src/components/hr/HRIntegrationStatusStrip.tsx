import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Compact, honest HR integration strip.
 *
 * Shows real connection status for Viventium, Stellar Checks, and
 * CentralReach pulled from `integration_catalog`. Never fabricates a
 * "connected" or "synced" state — if a row is missing or not connected
 * we say so plainly. Used across the HR surfaces (Compliance, Requests,
 * Employee Support, Messages, Training & Certs) so operators see the
 * same readiness signal wherever they work.
 */

type ProviderKey = "viventium" | "stellar_checks" | "centralreach";

const PROVIDERS: { key: ProviderKey; label: string }[] = [
  { key: "viventium", label: "Viventium" },
  { key: "stellar_checks", label: "Stellar Checks" },
  { key: "centralreach", label: "CentralReach" },
];

type CatalogRow = { id: string; status: string };

function toneClass(status: string): string {
  if (status === "connected") return "text-emerald-600";
  if (status === "error") return "text-red-600";
  if (status === "in_progress" || status === "pending") return "text-amber-600";
  return "text-muted-foreground";
}

function label(status: string): string {
  if (status === "connected") return "connected";
  if (status === "not_configured") return "not connected";
  return status.replace(/_/g, " ");
}

export function HRIntegrationStatusStrip({ className }: { className?: string }) {
  const [rows, setRows] = useState<Record<ProviderKey, CatalogRow | null>>({
    viventium: null,
    stellar_checks: null,
    centralreach: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("integration_catalog")
        .select("id,status")
        .in("id", ["viventium", "stellar_checks", "centralreach"]);
      if (cancelled || !data) return;
      const next: Record<ProviderKey, CatalogRow | null> = {
        viventium: null,
        stellar_checks: null,
        centralreach: null,
      };
      for (const r of data as CatalogRow[]) {
        if (r.id in next) next[r.id as ProviderKey] = r;
      }
      setRows(next);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-[11.5px]",
        className,
      )}
      aria-label="HR integration readiness"
    >
      <span className="uppercase tracking-wider text-muted-foreground/80 text-[10.5px]">Integrations</span>
      {PROVIDERS.map((p) => {
        const row = rows[p.key];
        const status = row?.status ?? "not_configured";
        return (
          <span key={p.key} className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{p.label}:</span>
            <span className={cn("font-medium", toneClass(status))}>
              {label(status)}
            </span>
          </span>
        );
      })}
    </div>
  );
}