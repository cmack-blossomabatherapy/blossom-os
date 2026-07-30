import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  UserX, AlarmClock, Hourglass, TrendingUp, Signal, PhoneCall, FileCheck2, Users, ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Lead } from "@/data/leads";
import {
  canonicalFamilyLeadStage,
  isLeadOutOfPipeline,
  isReadyToStartStage,
  getLeadWorkflowRisk,
} from "@/lib/intake/intakeWorkflow";
import { useIntakeCtmHealthSummary } from "@/hooks/useIntakeCtmHealthSummary";

const DAY = 24 * 60 * 60 * 1000;
/** Canonical stages that make up the CentralReach admission packet. */
const PACKET_STAGES = ["Intake Packet Sent", "Intake Packet Follow Up", "Intake Complete"] as const;

function Tile({
  label, value, hint, icon: Icon, to, tone = "default",
}: {
  label: string; value: string; hint: string;
  icon: typeof UserX; to: string; tone?: "default" | "warn" | "risk";
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/60 bg-card px-4 py-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid place-items-center h-8 w-8 rounded-xl",
            tone === "risk" ? "bg-rose-500/10 text-rose-600"
              : tone === "warn" ? "bg-amber-500/10 text-amber-600"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-0.5 text-[13px] font-medium">{label}</p>
      <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-1">{hint}</p>
    </Link>
  );
}

/**
 * Director of Intake command block — every metric is computed from live
 * lead records and live CTM tables. Nothing here is seeded or sampled.
 */
export function IntakeDirectorInsights({
  leads, loading,
}: { leads: Lead[]; loading: boolean }) {
  const ctm = useIntakeCtmHealthSummary(true);

  const m = useMemo(() => {
    const open = leads.filter((l) => !isLeadOutOfPipeline(l.status));
    const unassigned = open.filter((l) => !(l.owner ?? "").trim() || /unassigned/i.test(l.owner ?? ""));
    const slaRisk = open.filter((l) => {
      const level = getLeadWorkflowRisk(l).level;
      return level === "risk" || level === "urgent";
    });
    const stalled = open.filter((l) => (l.daysInStage ?? 0) >= 14);
    const now = Date.now();
    const createdLast30 = leads.filter((l) => {
      const d = new Date(l.createdAt).getTime();
      return Number.isFinite(d) && now - d <= 30 * DAY;
    });
    const readyLast30 = leads.filter((l) => {
      if (!isReadyToStartStage(l.status)) return false;
      const d = new Date(l.updatedAt).getTime();
      return Number.isFinite(d) && now - d <= 30 * DAY;
    });
    const conversion = createdLast30.length
      ? Math.round((readyLast30.length / createdLast30.length) * 100)
      : 0;
    const packet = open.filter((l) =>
      (PACKET_STAGES as readonly string[]).includes(canonicalFamilyLeadStage(l.status)),
    );
    const packetBlocked = packet.filter(
      (l) => canonicalFamilyLeadStage(l.status) === "Intake Packet Follow Up",
    );

    const sourceMap = new Map<string, { total: number; ready: number }>();
    leads.forEach((l) => {
      const k = l.source || "Unknown";
      const cur = sourceMap.get(k) ?? { total: 0, ready: 0 };
      cur.total += 1;
      if (isReadyToStartStage(l.status)) cur.ready += 1;
      sourceMap.set(k, cur);
    });
    const sources = [...sourceMap.entries()]
      .map(([source, v]) => ({
        source, ...v,
        rate: v.total ? Math.round((v.ready / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const coordMap = new Map<string, { total: number; risk: number; stalled: number }>();
    open.forEach((l) => {
      const k = (l.owner ?? "").trim() || "Unassigned";
      const cur = coordMap.get(k) ?? { total: 0, risk: 0, stalled: 0 };
      cur.total += 1;
      const level = getLeadWorkflowRisk(l).level;
      if (level === "risk" || level === "urgent") cur.risk += 1;
      if ((l.daysInStage ?? 0) >= 14) cur.stalled += 1;
      coordMap.set(k, cur);
    });
    const coordinators = [...coordMap.entries()]
      .map(([owner, v]) => ({ owner, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      openCount: open.length,
      unassigned: unassigned.length,
      slaRisk: slaRisk.length,
      stalled: stalled.length,
      conversion,
      readyLast30: readyLast30.length,
      createdLast30: createdLast30.length,
      packet: packet.length,
      packetBlocked: packetBlocked.length,
      sources,
      coordinators,
    };
  }, [leads]);

  const n = (v: number) => (loading ? "…" : v.toLocaleString());

  return (
    <section data-testid="intake-director-insights" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Director command view</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Department workload, risk and throughput across every coordinator — live records only.
          </p>
        </div>
        <Link to="/intake/review-queues" className="text-xs text-primary hover:underline">
          CTM Review &amp; Health →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Unassigned leads" value={n(m.unassigned)} hint="Open families with no coordinator"
          icon={UserX} to="/intake/assignments" tone={m.unassigned ? "risk" : "default"} />
        <Tile label="SLA risk" value={n(m.slaRisk)} hint="At-risk or overdue follow-ups"
          icon={AlarmClock} to="/intake/tasks" tone={m.slaRisk ? "warn" : "default"} />
        <Tile label="Stalled journeys" value={n(m.stalled)} hint="14+ days in the same stage"
          icon={Hourglass} to="/intake/lead-to-active" tone={m.stalled ? "warn" : "default"} />
        <Tile label="Conversion (30d)" value={loading ? "…" : `${m.conversion}%`}
          hint={`${m.readyLast30} ready of ${m.createdLast30} new`} icon={TrendingUp} to="/reports?dept=intake" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Packet readiness */}
        <div className="rounded-2xl border border-border/60 bg-card p-4" data-testid="intake-director-packet-readiness">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileCheck2 className="h-4 w-4" /> Packet readiness
            </h3>
            <Link to="/intake/cr-packet-prep" className="text-xs text-primary hover:underline">Packet prep →</Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-semibold tabular-nums">{n(m.packet)}</div>
              <div className="text-[11px] text-muted-foreground">In packet stages</div>
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums text-amber-600">{n(m.packetBlocked)}</div>
              <div className="text-[11px] text-muted-foreground">Awaiting documents</div>
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums text-emerald-600">{n(m.readyLast30)}</div>
              <div className="text-[11px] text-muted-foreground">Handed off (30d)</div>
            </div>
          </div>
          <Link to="/intake/missing-information" className="mt-3 inline-block text-xs text-primary hover:underline">
            Work missing information →
          </Link>
        </div>

        {/* CTM health */}
        <div className="rounded-2xl border border-border/60 bg-card p-4" data-testid="intake-director-ctm-health">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <PhoneCall className="h-4 w-4" /> CTM health
            </h3>
            {ctm.data && (
              <Badge variant="outline" className={cn(
                "text-[10px]",
                ctm.data.lastSyncStatus === "error"
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700",
              )}>
                {ctm.data.lastSyncStatus ?? "no runs"}
              </Badge>
            )}
          </div>
          {ctm.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading CTM health…</p>
          ) : ctm.error ? (
            <p className="mt-3 text-xs text-muted-foreground">
              CTM health is unavailable for your account.
            </p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-semibold tabular-nums">{ctm.data?.callsLast7d ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Calls (7d)</div>
                </div>
                <div>
                  <div className="text-xl font-semibold tabular-nums text-amber-600">{ctm.data?.unlinkedCalls ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Unlinked</div>
                </div>
                <div>
                  <div className="text-xl font-semibold tabular-nums">{ctm.data?.disqualifiedLast7d ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Not qualified (7d)</div>
                </div>
              </div>
              {!ctm.data?.configured && (
                <p className="mt-2 text-[11px] text-amber-700">
                  Running on default qualification rules — save rules in Templates &amp; Configuration.
                </p>
              )}
            </>
          )}
          <Link to="/intake/review-queues" className="mt-3 inline-block text-xs text-primary hover:underline">
            Open review queues →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coordinator workload */}
        <div className="rounded-2xl border border-border/60 bg-card p-4" data-testid="intake-director-coordinator-workload">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" /> Coordinator workload
          </h3>
          {m.coordinators.length === 0 ? (
            <p className="text-xs text-muted-foreground">No open families in this scope.</p>
          ) : (
            <div className="divide-y">
              {m.coordinators.map((c) => (
                <Link key={c.owner} to={`/leads?owner=${encodeURIComponent(c.owner)}`}
                  className="flex items-center justify-between py-1.5 text-sm hover:text-primary transition">
                  <span className="truncate font-medium">{c.owner}</span>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground shrink-0">
                    {c.total} open
                    {c.risk > 0 && <span className="text-amber-600"> · {c.risk} at risk</span>}
                    {c.stalled > 0 && <span className="text-rose-600"> · {c.stalled} stalled</span>}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Source performance */}
        <div className="rounded-2xl border border-border/60 bg-card p-4" data-testid="intake-director-source-performance">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Signal className="h-4 w-4" /> Source performance
          </h3>
          {m.sources.length === 0 ? (
            <p className="text-xs text-muted-foreground">No lead sources recorded yet.</p>
          ) : (
            <div className="divide-y">
              {m.sources.map((s) => (
                <Link key={s.source} to={`/leads?source=${encodeURIComponent(s.source)}`}
                  className="flex items-center justify-between py-1.5 text-sm hover:text-primary transition">
                  <span className="truncate font-medium">{s.source}</span>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground shrink-0">
                    {s.total} leads · {s.rate}% ready
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
