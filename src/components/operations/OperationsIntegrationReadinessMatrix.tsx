/**
 * OperationsIntegrationReadinessMatrix
 *
 * Operations Leadership completion pass — the full "matrix" view of every
 * integration Blossom OS depends on. Replaces the old summary-only
 * IntegrationReadinessCard on `/operations/command-center`.
 *
 * Data model:
 *   • Static registry from `BLOSSOM_INTEGRATIONS` (business purpose,
 *     owner, criticality, methods, dependent modules, notes).
 *   • Overlaid with live `integration_connections` rows so the "Current
 *     status" column tells the truth: `connected` only when a real
 *     connection row confirms it, `error` when the last run failed, etc.
 *   • `internalOnly` entries (e.g. Make.com legacy bridge) are excluded
 *     from this Operations view — see the Admin > Integrations legacy
 *     section for those.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Circle, ExternalLink, Filter,
  Plug, RefreshCw, Search, Zap,
} from "lucide-react";
import { ExecCard } from "@/pages/os/executive/_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BLOSSOM_INTEGRATIONS } from "@/lib/os/integrations/integrationRegistry";
import {
  listIntegrationConnections,
  type IntegrationConnectionRow,
} from "@/lib/os/integrations/backend";
import type {
  BlossomIntegration, IntegrationMethod, IntegrationStatus,
} from "@/lib/os/integrations/types";
import { cn } from "@/lib/utils";

const METHOD_LABELS: Record<IntegrationMethod, string> = {
  api: "API",
  webhook: "Webhook",
  oauth: "OAuth",
  file_import: "File import",
  manual_upload: "Manual",
  embedded_link: "Embedded link",
  planned: "Planned",
};

type Readiness =
  | "connected"
  | "configured"
  | "planned"
  | "coming_soon"
  | "needs_attention"
  | "error"
  | "not_configured";

function toneClass(r: Readiness): string {
  switch (r) {
    case "connected": return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "configured": return "border-sky-200 bg-sky-50 text-sky-800";
    case "planned": return "border-slate-200 bg-slate-50 text-slate-700";
    case "coming_soon": return "border-slate-200 bg-slate-50 text-slate-700";
    case "needs_attention": return "border-amber-200 bg-amber-50 text-amber-800";
    case "error": return "border-rose-200 bg-rose-50 text-rose-700";
    default: return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function readinessLabel(r: Readiness): string {
  return ({
    connected: "Connected",
    configured: "Configured",
    planned: "Planned",
    coming_soon: "Coming soon",
    needs_attention: "Needs attention",
    error: "Error",
    not_configured: "Not configured",
  } as Record<Readiness, string>)[r];
}

/** Map integration row + registry entry to a truthful readiness. */
function deriveReadiness(
  reg: BlossomIntegration,
  live: IntegrationConnectionRow | undefined,
): Readiness {
  if (live) {
    if (live.status === "error" || live.last_error) return "error";
    if (!live.enabled) return "needs_attention";
    if (live.status === "connected" || live.status === "active") return "connected";
    if (live.status === "configured") return "configured";
    return "needs_attention";
  }
  switch (reg.status as IntegrationStatus) {
    case "connected": return "configured"; // never trust static "connected"
    case "configured": return "configured";
    case "planned": return "planned";
    case "maybe": return "planned";
    case "needs_attention": return "needs_attention";
    case "error": return "error";
    case "disabled": return "not_configured";
    default: return "not_configured";
  }
}

function nextAction(reg: BlossomIntegration, r: Readiness): string {
  if (r === "connected") return "Monitor sync runs";
  if (r === "error") return "Investigate last error";
  if (r === "needs_attention") return "Re-enable or reconnect";
  if (r === "configured") return "Verify live sync";
  if (r === "planned") return "Schedule provider setup";
  if (r === "coming_soon") return "Awaiting release";
  return reg.methods.includes("planned")
    ? "Confirm vendor + credentials"
    : "Add credentials in Admin > Integrations";
}

function CriticalityBadge({ level }: { level: BlossomIntegration["criticality"] }) {
  const map: Record<BlossomIntegration["criticality"], string> = {
    critical: "border-rose-200 bg-rose-50 text-rose-700",
    standard: "border-sky-200 bg-sky-50 text-sky-800",
    optional: "border-slate-200 bg-slate-50 text-slate-700",
    maybe: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wide", map[level])}>
      {level}
    </Badge>
  );
}

function ReadinessPill({ r }: { r: Readiness }) {
  const Icon =
    r === "connected" ? CheckCircle2 :
    r === "error" ? AlertTriangle :
    r === "needs_attention" ? AlertTriangle :
    r === "planned" || r === "coming_soon" || r === "not_configured" ? Circle :
    Zap;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", toneClass(r))}>
      <Icon className="h-3 w-3" /> {readinessLabel(r)}
    </span>
  );
}

export function OperationsIntegrationReadinessMatrix({
  className,
  title = "Operations integration readiness",
}: {
  className?: string;
  title?: string;
}) {
  const [conns, setConns] = useState<IntegrationConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Readiness | "all">("all");
  const [critFilter, setCritFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await listIntegrationConnections().catch(() => []);
        if (!cancelled) setConns(c);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    // Prefer production connections when multiple exist for one integration.
    const liveById = new Map<string, IntegrationConnectionRow>();
    for (const c of conns) {
      if (c.environment === "production" || !liveById.has(c.integration_id)) {
        liveById.set(c.integration_id, c);
      }
    }
    return BLOSSOM_INTEGRATIONS
      .filter((i) => !i.internalOnly) // Make.com etc. hidden per Operations spec
      .map((reg) => {
        const live = liveById.get(reg.id);
        const readiness = deriveReadiness(reg, live);
        return {
          reg, live, readiness,
          lastChecked: live?.last_tested_at ?? live?.updated_at ?? null,
        };
      })
      .sort((a, b) => {
        const rank = (r: Readiness) =>
          r === "error" ? 0 :
          r === "needs_attention" ? 1 :
          r === "connected" ? 2 :
          r === "configured" ? 3 :
          r === "planned" ? 4 :
          r === "coming_soon" ? 5 : 6;
        return rank(a.readiness) - rank(b.readiness) || a.reg.displayName.localeCompare(b.reg.displayName);
      });
  }, [conns]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.readiness !== statusFilter) return false;
      if (critFilter !== "all" && r.reg.criticality !== critFilter) return false;
      if (!needle) return true;
      return (
        r.reg.displayName.toLowerCase().includes(needle) ||
        r.reg.ownerDepartment.toLowerCase().includes(needle) ||
        r.reg.dependentModules.join(" ").toLowerCase().includes(needle) ||
        (r.reg.notes ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter, critFilter]);

  return (
    <ExecCard title={title} hint="Registry × live integration_connections" className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integration, owner, module…" className="h-8 pl-7 text-[13px]" />
        </div>
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Readiness | "all")}>
          <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="configured">Configured</SelectItem>
            <SelectItem value="needs_attention">Needs attention</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="not_configured">Not configured</SelectItem>
          </SelectContent>
        </Select>
        <Select value={critFilter} onValueChange={setCritFilter}>
          <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All criticality</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild size="sm" variant="ghost" className="h-8 gap-1">
          <Link to="/admin/integrations">
            <Plug className="h-3.5 w-3.5" /> Admin
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading matrix…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/40">
          <table className="w-full text-[12.5px]">
            <thead className="bg-muted/40 text-[10.5px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Integration</th>
                <th className="px-3 py-2 text-left font-medium">Owner</th>
                <th className="px-3 py-2 text-left font-medium">Crit.</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Method</th>
                <th className="px-3 py-2 text-left font-medium">Modules</th>
                <th className="px-3 py-2 text-left font-medium">Next action</th>
                <th className="px-3 py-2 text-left font-medium">Last checked</th>
                <th className="px-3 py-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">No integrations match.</td></tr>
              ) : filtered.map(({ reg, live, readiness, lastChecked }) => (
                <tr key={reg.id} className="border-t border-border/60 align-top hover:bg-muted/20">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground/90">{reg.displayName}</div>
                    <div className="text-[11px] text-muted-foreground">{reg.notes?.slice(0, 90)}{(reg.notes?.length ?? 0) > 90 ? "…" : ""}</div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{reg.ownerDepartment}</td>
                  <td className="px-3 py-2.5"><CriticalityBadge level={reg.criticality} /></td>
                  <td className="px-3 py-2.5">
                    <ReadinessPill r={readiness} />
                    {live?.last_error && (
                      <div className="mt-1 line-clamp-1 text-[11px] text-rose-600" title={live.last_error}>
                        {live.last_error}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {reg.methods.length === 0 ? "unknown" : reg.methods.map((m) => METHOD_LABELS[m] ?? m).join(", ")}
                  </td>
                  <td className="px-3 py-2.5">
                    {reg.dependentModules.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {reg.dependentModules.slice(0, 4).map((m) => (
                          <Badge key={m} variant="secondary" className="rounded-full px-1.5 py-0 text-[10px] font-normal">{m}</Badge>
                        ))}
                        {reg.dependentModules.length > 4 && (
                          <span className="text-[10.5px] text-muted-foreground">+{reg.dependentModules.length - 4}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-foreground/85">{nextAction(reg, readiness)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {lastChecked ? new Date(lastChecked).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                      <Link to={`/admin/integrations?id=${reg.id}`} title={`Open ${reg.displayName}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ExecCard>
  );
}

export default OperationsIntegrationReadinessMatrix;