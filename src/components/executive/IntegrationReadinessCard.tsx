/**
 * IntegrationReadinessCard
 *
 * Executive-facing snapshot of integration health across the operating
 * layer. Reads directly from integration_catalog + integration_connections
 * (no secrets exposed) and surfaces:
 *   • overall readiness posture (healthy / attention / risk)
 *   • counts by status
 *   • the top few connections that need attention with last-error hint
 *
 * Safe to drop into any executive/ops page.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plug, RefreshCw } from "lucide-react";
import { ExecCard, HealthPill, type HealthTone } from "@/pages/os/executive/_shared";
import {
  listIntegrationCatalog,
  listIntegrationConnections,
  type IntegrationCatalogRow,
  type IntegrationConnectionRow,
} from "@/lib/os/integrations/backend";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";
import { cn } from "@/lib/utils";

type Props = { className?: string; title?: string };

export function IntegrationReadinessCard({
  className,
  title = "Integration readiness",
}: Props) {
  const [catalog, setCatalog] = useState<IntegrationCatalogRow[]>([]);
  const [conns, setConns] = useState<IntegrationConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, k] = await Promise.all([
          listIntegrationCatalog().catch(() => []),
          listIntegrationConnections().catch(() => []),
        ]);
        if (!cancelled) {
          setCatalog(c);
          setConns(k);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Internal/legacy integrations (e.g. Make.com) must never appear in
  // executive-facing readiness. Filter by the frontend integration registry
  // since the backend catalog does not yet carry an `internalOnly` column.
  const internalOnlyIds = useMemo(
    () => new Set(BLOSSOM_INTEGRATIONS.filter((i) => i.internalOnly).map((i) => i.id)),
    [],
  );
  const visibleConns = useMemo(
    () => conns.filter((c) => !internalOnlyIds.has(c.integration_id)),
    [conns, internalOnlyIds],
  );

  const summary = useMemo(() => {
    const total = visibleConns.length;
    const healthy = visibleConns.filter(
      (c) => c.enabled && (c.status === "connected" || c.status === "active"),
    ).length;
    const errored = visibleConns.filter(
      (c) => c.status === "error" || c.last_error,
    ).length;
    const disabled = visibleConns.filter((c) => !c.enabled).length;
    const tone: HealthTone =
      errored >= 2 ? "risk" : errored === 1 ? "attention" : healthy === 0 ? "neutral" : "healthy";
    const label =
      tone === "risk"
        ? "Attention required"
        : tone === "attention"
          ? "Watch"
          : tone === "neutral"
            ? "Not connected"
            : "Operational";
    return { total, healthy, errored, disabled, tone, label };
  }, [visibleConns]);

  const needsAttention = useMemo(() => {
    return visibleConns
      .filter((c) => c.status === "error" || c.last_error)
      .slice(0, 4)
      .map((c) => {
        const cat = catalog.find((k) => k.id === c.integration_id);
        return { conn: c, name: cat?.display_name ?? c.integration_id };
      });
  }, [visibleConns, catalog]);

  return (
    <ExecCard title={title} hint="Live from the integrations backend" className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Plug className="h-3.5 w-3.5" />
          {loading
            ? "Checking connections…"
            : `${summary.healthy}/${summary.total || 0} connections healthy`}
        </div>
        <HealthPill tone={summary.tone}>{summary.label}</HealthPill>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Healthy" value={summary.healthy} tone="healthy" icon={<CheckCircle2 className="h-3 w-3" />} />
        <Stat label="Errors" value={summary.errored} tone={summary.errored > 0 ? "risk" : "neutral"} icon={<AlertTriangle className="h-3 w-3" />} />
        <Stat label="Disabled" value={summary.disabled} tone="neutral" icon={<RefreshCw className="h-3 w-3" />} />
      </div>

      {needsAttention.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">
            Needs attention
          </div>
          {needsAttention.map(({ conn, name }) => (
            <div
              key={conn.id}
              className="rounded-xl border border-border/60 bg-background/40 p-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-medium text-foreground/90">{name}</div>
                <span className="text-[11px] uppercase tracking-wide text-rose-600">
                  {conn.status}
                </span>
              </div>
              {conn.last_error && (
                <div className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                  {conn.last_error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ExecCard>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: HealthTone;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/40 p-2.5",
        tone === "risk" && "border-rose-200 bg-rose-50/40",
        tone === "healthy" && value > 0 && "border-emerald-200 bg-emerald-50/40",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-[18px] font-semibold text-foreground">{value}</div>
    </div>
  );
}