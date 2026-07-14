import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Sparkles, Workflow,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useWorkQueue } from "@/hooks/useWorkQueue";
import {
  getEscalationLevel, getEscalationRoute, getWorkItemAgeDays,
  groupWorkItemsByDepartment, groupWorkItemsByState, isWorkItemEscalated,
  sortWorkItemsByUrgency, type WorkItem,
} from "@/lib/workQueue/workQueueModel";
import { DueCell, KpiCard, PriorityBadge, StatusBadge } from "./WorkQueueShared";

function isResolvedThisWeek(i: WorkItem) {
  return Boolean(
    i.resolvedAt && Date.now() - new Date(i.resolvedAt).getTime() < 7 * 86_400_000,
  );
}

function EscalationRow({ item, onResolve }: { item: WorkItem; onResolve: (id: string) => void }) {
  const level = getEscalationLevel(item);
  const ageDays = getWorkItemAgeDays(item);
  return (
    <tr className="border-t border-border/60 hover:bg-muted/30">
      <td className="px-3 py-2.5"><PriorityBadge priority={item.priority} /></td>
      <td className="px-3 py-2.5">
        <div className="font-medium text-foreground">{item.title}</div>
        {item.escalationReason && (
          <div className="text-[11px] text-muted-foreground line-clamp-2 max-w-[420px]">
            {item.escalationReason}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.department}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.ownerName ?? "—"}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.state ?? "—"}</td>
      <td className="px-3 py-2.5"><Badge variant="outline" className="text-[10px]">L{level}</Badge></td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{ageDays}d</td>
      <td className="px-3 py-2.5"><DueCell item={item} /></td>
      <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
        {getEscalationRoute(item).join(" → ")}
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="inline-flex gap-1.5">
          {item.relatedLeadId && (
            <Button asChild size="sm" variant="ghost">
              <Link to={`/patient-journey?leadId=${item.relatedLeadId}`}>Open</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link to={`/work-queue?selected=${item.id}`}>Details</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onResolve(item.id)}>Resolve</Button>
        </div>
      </td>
    </tr>
  );
}

function EscalationTable({
  items, onResolve, emptyMessage,
}: {
  items: WorkItem[]; onResolve: (id: string) => void; emptyMessage: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {["Priority","Title","Department","Owner","State","Level","Age","Due","Status","Route",""].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</td></tr>
            ) : (
              items.map((i) => <EscalationRow key={i.id} item={i} onResolve={onResolve} />)
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function EscalationCenterPage() {
  const wq = useWorkQueue();
  const [view, setView] = useState<"department" | "state" | "level" | "critical" | "resolved">("department");

  const escalations = useMemo(
    () => sortWorkItemsByUrgency(wq.items.filter(isWorkItemEscalated)),
    [wq.items],
  );
  const resolved = useMemo(
    () => wq.items.filter(isResolvedThisWeek).filter((i) => i.escalationLevel || i.escalationReason),
    [wq.items],
  );

  const kpi = useMemo(() => ({
    open: escalations.length,
    critical: escalations.filter((i) => i.priority === "critical").length,
    avgAge: escalations.length
      ? Math.round(escalations.reduce((s, i) => s + getWorkItemAgeDays(i), 0) / escalations.length)
      : 0,
    slaMissed: escalations.filter((i) => i.dueDate && new Date(i.dueDate).getTime() < Date.now()).length,
    resolvedThisWeek: resolved.length,
  }), [escalations, resolved]);

  const byDept = useMemo(() => groupWorkItemsByDepartment(escalations), [escalations]);
  const byState = useMemo(() => groupWorkItemsByState(escalations), [escalations]);
  const byLevel = useMemo(() => {
    const buckets = new Map<number, WorkItem[]>();
    for (const i of escalations) {
      const l = getEscalationLevel(i);
      const arr = buckets.get(l) ?? [];
      arr.push(i); buckets.set(l, arr);
    }
    return Array.from(buckets, ([level, items]) => ({ level, items: sortWorkItemsByUrgency(items) }))
      .sort((a, b) => b.level - a.level);
  }, [escalations]);

  const handleResolve = (id: string) => wq.resolveEscalation(id, "Resolved from Escalation Center");

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Operations
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Escalation Center</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Cross-department escalations, ownership, state impact, and resolution accountability.
              State Directors monitor and unblock — they are not the default executor for normal
              departmental work.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/work-queue">Open Work Queue</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/communications/activity-center">Activity Center</Link></Button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard icon={Sparkles} label="Open escalations" value={kpi.open} tone="bg-red-50 text-red-700" />
          <KpiCard icon={AlertTriangle} label="Critical" value={kpi.critical} tone="bg-red-100 text-red-800" />
          <KpiCard icon={Workflow} label="Avg age (days)" value={kpi.avgAge} tone="bg-muted text-muted-foreground" />
          <KpiCard icon={AlertTriangle} label="SLA missed" value={kpi.slaMissed} tone="bg-amber-50 text-amber-700" />
          <KpiCard icon={CheckCircle2} label="Resolved this week" value={kpi.resolvedThisWeek} tone="bg-emerald-50 text-emerald-700" />
        </div>

        <Card className="p-3 rounded-2xl border-border/60">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="department">By Department</TabsTrigger>
              <TabsTrigger value="state">By State</TabsTrigger>
              <TabsTrigger value="level">By Level</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="resolved">Recently Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {view === "department" && (
          <div className="space-y-5">
            {byDept.length === 0 && (
              <Card className="p-10 rounded-2xl text-center text-sm text-muted-foreground">No open escalations across departments.</Card>
            )}
            {byDept.map((g) => (
              <div key={g.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{g.department}</h2>
                  <Badge variant="outline" className="text-[10px]">{g.items.length} open</Badge>
                </div>
                <EscalationTable items={g.items} onResolve={handleResolve} emptyMessage="No escalations." />
              </div>
            ))}
          </div>
        )}

        {view === "state" && (
          <div className="space-y-5">
            {byState.map((g) => (
              <div key={g.state} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{g.state}</h2>
                  <Badge variant="outline" className="text-[10px]">{g.items.length} open</Badge>
                </div>
                <EscalationTable items={g.items} onResolve={handleResolve} emptyMessage="No escalations in this state." />
              </div>
            ))}
          </div>
        )}

        {view === "level" && (
          <div className="space-y-5">
            {byLevel.map((g) => (
              <div key={g.level} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Level {g.level}</h2>
                  <Badge variant="outline" className="text-[10px]">{g.items.length} open</Badge>
                </div>
                <EscalationTable items={g.items} onResolve={handleResolve} emptyMessage="No L{g.level} escalations." />
              </div>
            ))}
          </div>
        )}

        {view === "critical" && (
          <EscalationTable
            items={escalations.filter((i) => i.priority === "critical")}
            onResolve={handleResolve}
            emptyMessage="No critical escalations right now."
          />
        )}

        {view === "resolved" && (
          <EscalationTable
            items={resolved}
            onResolve={handleResolve}
            emptyMessage="No escalations resolved this week yet."
          />
        )}
      </div>
    </OSShell>
  );
}