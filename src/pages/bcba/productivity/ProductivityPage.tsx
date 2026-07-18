import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, Flag, Info, Activity, Users, TrendingUp, ShieldAlert } from "lucide-react";
import {
  useMyProductivitySnapshot, useMyCapacitySnapshot,
  useAllProductivity, useAllCapacity,
} from "./useProductivity";
import {
  METRIC_DEFINITIONS, findDefinition,
  CAPACITY_LABELS, CAPACITY_STYLES, CAPACITY_ORDER,
  buildProductivityExplanations, capacityExplanations,
  fmtDate, fmtHours,
  type ProductivitySnapshot, type CapacitySnapshot, type CapacityStatus,
} from "./pipeline";
import ReportDiscrepancyDialog from "./ReportDiscrepancyDialog";
import MetricDrilldownDialog from "./MetricDrilldownDialog";

function MetricLabel({ metricKey, children }: { metricKey: string; children: React.ReactNode }) {
  const def = findDefinition(metricKey);
  if (!def) return <>{children}</>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-3 w-3 text-muted-foreground/70" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          <div className="font-medium mb-1">{def.label}</div>
          <div className="text-muted-foreground">{def.definition}</div>
          <div className="mt-1 text-muted-foreground">Source: {def.source} · {def.cadence}</div>
          {!def.bcbaControlled && (
            <div className="mt-1 text-[11px] text-amber-600">Not solely BCBA-controlled.</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SourceStamp({ sources, k }: { sources: Record<string, string>; k: string }) {
  const d = sources?.[k];
  if (!d) return null;
  return <span className="text-[11px] text-muted-foreground">as of {fmtDate(d)}</span>;
}

function MetricCard({
  metricKey, primary, secondary, sources, onFlag, onDrill,
}: {
  metricKey: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  sources: Record<string, string>;
  onFlag: (k: string) => void;
  onDrill?: (k: string) => void;
}) {
  return (
    <Card className="border-border/60 hover:border-primary/40 hover:shadow-sm transition cursor-pointer" onClick={() => onDrill?.(metricKey)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <MetricLabel metricKey={metricKey}>
            <span className="text-xs font-medium text-muted-foreground">{findDefinition(metricKey)?.label ?? metricKey}</span>
          </MetricLabel>
          <button
            onClick={(e) => { e.stopPropagation(); onFlag(metricKey); }}
            className="text-muted-foreground/60 hover:text-foreground transition"
            aria-label="Report discrepancy"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{primary}</div>
        {secondary && <div className="text-xs text-muted-foreground mt-1">{secondary}</div>}
        <div className="mt-2 flex items-center justify-between">
          <SourceStamp sources={sources} k={metricKey} />
          <span className="text-[10px] text-muted-foreground/60">View source →</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CapacityBadge({ status }: { status: CapacityStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${CAPACITY_STYLES[status]}`}>
      {CAPACITY_LABELS[status]}
    </span>
  );
}

function MyProductivity({ snapshot }: { snapshot: ProductivitySnapshot | null }) {
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagMetric, setFlagMetric] = useState<string | undefined>();
  const openFlag = (k: string) => { setFlagMetric(k); setFlagOpen(true); };
  const [drillMetric, setDrillMetric] = useState<string | null>(null);
  const openDrill = (k: string) => setDrillMetric(k);

  if (!snapshot) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No productivity snapshot available yet. Data appears once nightly syncs complete.
      </CardContent></Card>
    );
  }

  const explanations = buildProductivityExplanations(snapshot);
  const cancelHrs = Number(snapshot.cancelled_hours_family) + Number(snapshot.cancelled_hours_provider) + Number(snapshot.cancelled_hours_other);
  const targetPct = Number(snapshot.mtd_target_hours) > 0
    ? Math.min(100, (Number(snapshot.mtd_actual_hours) / Number(snapshot.mtd_target_hours)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Explanations first — never a single opaque % */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Where you stand this month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Month-to-date pace</span>
              <span className="font-medium">
                {fmtHours(snapshot.mtd_actual_hours)} of {fmtHours(snapshot.mtd_target_hours)} target
              </span>
            </div>
            <Progress value={targetPct} className="mt-2 h-2" />
          </div>
          <ul className="space-y-1.5 text-sm">
            {explanations.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-muted-foreground pt-1">
            Period {fmtDate(snapshot.period_start)} – {fmtDate(snapshot.period_end)} · updated {fmtDate(snapshot.updated_at)}
          </div>
        </CardContent>
      </Card>

      {/* Caseload */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Caseload</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard metricKey="caseload_size"     primary={snapshot.caseload_size}       sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="assigned_rbt_count" primary={snapshot.assigned_rbt_count} sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="service_utilization_pct" primary={`${Number(snapshot.service_utilization_pct).toFixed(0)}%`} secondary="Delivered ÷ authorized" sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="open_risks" primary={snapshot.open_risks} secondary="Active clinical or ops risks" sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
        </div>
      </div>

      {/* Hours */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Hours delivered</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard metricKey="clinical_hours"        primary={fmtHours(snapshot.clinical_hours)}        sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="billable_hours"        primary={fmtHours(snapshot.billable_hours)}        sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="assessment_hours"      primary={fmtHours(snapshot.assessment_hours)}      sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="parent_training_hours" primary={fmtHours(snapshot.parent_training_hours)} sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="supervision_hours"     primary={fmtHours(snapshot.supervision_hours)}     sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
        </div>
      </div>

      {/* Documentation & QA */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Documentation & quality</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard metricKey="progress_reports"
            primary={`${snapshot.progress_reports_on_time} on time`}
            secondary={`${snapshot.progress_reports_late} late · ${snapshot.progress_reports_upcoming} upcoming`}
            sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="treatment_plans"
            primary={`${snapshot.treatment_plans_open} open`}
            secondary={`${snapshot.treatment_plans_qa_returned} in QA correction`}
            sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="documentation_on_time_pct" primary={`${Number(snapshot.documentation_on_time_pct).toFixed(0)}%`} sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="qa_return_rate_pct"       primary={`${Number(snapshot.qa_return_rate_pct).toFixed(0)}%`} sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
        </div>
      </div>

      {/* Cancellations — separated from controllable performance */}
      <Card className="border-amber-200/60 bg-amber-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Cancellation impact
            <Badge variant="outline" className="ml-1 text-[10px]">Not scored against you</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Cancelled appts</div>
              <div className="text-lg font-semibold">{snapshot.cancelled_appointments}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Family</div>
              <div className="text-lg font-semibold">{fmtHours(snapshot.cancelled_hours_family)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Provider</div>
              <div className="text-lg font-semibold">{fmtHours(snapshot.cancelled_hours_provider)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Other</div>
              <div className="text-lg font-semibold">{fmtHours(snapshot.cancelled_hours_other)}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            {cancelHrs.toFixed(1)} hours cancelled this period. Cancellations are shown separately so they don't distort your productivity view.
          </div>
        </CardContent>
      </Card>

      {/* Forecast */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Forecast</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard metricKey="mtd_target_hours" primary={fmtHours(snapshot.mtd_target_hours)} sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="mtd_actual_hours" primary={fmtHours(snapshot.mtd_actual_hours)} sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
          <MetricCard metricKey="forecast_hours"   primary={fmtHours(snapshot.forecast_hours)}   secondary="Projected end-of-month" sources={snapshot.source_dates} onFlag={openFlag} onDrill={openDrill} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => { setFlagMetric(undefined); setFlagOpen(true); }}>
          <Flag className="h-3.5 w-3.5 mr-1.5" /> Report a data discrepancy
        </Button>
      </div>

      <ReportDiscrepancyDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        snapshotId={snapshot.id}
        bcbaId={snapshot.bcba_id}
        initialMetric={flagMetric}
      />

      <MetricDrilldownDialog
        open={!!drillMetric}
        onOpenChange={(o) => !o && setDrillMetric(null)}
        metricKey={drillMetric}
        snapshot={snapshot}
        kind="productivity"
      />
    </div>
  );
}

function MyCapacity({ snapshot }: { snapshot: CapacitySnapshot | null }) {
  const [drillMetric, setDrillMetric] = useState<string | null>(null);
  const openDrill = (k: string) => setDrillMetric(k);
  if (!snapshot) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        Capacity view will appear once your caseload and schedule data have synced.
      </CardContent></Card>
    );
  }
  const notes = capacityExplanations(snapshot);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Capacity view
            </CardTitle>
            <CapacityBadge status={snapshot.capacity_status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground flex items-start gap-2">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Capacity is advisory. It is not used to automatically assign new cases — a human always reviews staffing decisions.</span>
          </div>
          {notes.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span><span>{n}</span></li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard metricKey="caseload_size"     primary={snapshot.active_clients} secondary="Active clients" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="assigned_rbt_count" primary={snapshot.active_rbts} secondary="Active RBTs" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="supervision_hours"  primary={fmtHours(snapshot.supervision_load_hours)} secondary="Supervision load" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="assessment_hours"   primary={snapshot.new_assessments} secondary="New assessments" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="progress_reports"   primary={snapshot.reports_due} secondary="Reports due" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="parent_training_hours" primary={snapshot.parent_training_workload} secondary="Parent training workload" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="forecast_hours"     primary={fmtHours(snapshot.projected_service_hours)} secondary="Projected service hours" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
        <MetricCard metricKey="open_risks"         primary={snapshot.open_qa_corrections} secondary="Open QA corrections" sources={snapshot.source_dates} onFlag={() => {}} onDrill={openDrill} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Scheduled hours</div>
          <div className="text-lg font-semibold">{fmtHours(snapshot.scheduled_hours)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Open staffing gap</div>
          <div className="text-lg font-semibold">{fmtHours(snapshot.open_staffing_gap_hours)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Upcoming leave</div>
          <div className="text-lg font-semibold">{snapshot.upcoming_leave_days} days</div>
        </CardContent></Card>
      </div>

      <MetricDrilldownDialog
        open={!!drillMetric}
        onOpenChange={(o) => !o && setDrillMetric(null)}
        metricKey={drillMetric}
        snapshot={snapshot}
        kind="capacity"
      />
    </div>
  );
}

function LeadershipView() {
  const productivity = useAllProductivity();
  const capacity = useAllCapacity();

  const rollup = useMemo(() => {
    const rows: Record<CapacityStatus, number> = {
      available: 0, approaching_capacity: 0, at_capacity: 0, over_capacity: 0, review_required: 0,
    };
    (capacity.data ?? []).forEach((c) => { rows[c.capacity_status] = (rows[c.capacity_status] ?? 0) + 1; });
    return rows;
  }, [capacity.data]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Capacity roll-up</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CAPACITY_ORDER.map((s) => (
            <Card key={s}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{CAPACITY_LABELS[s]}</div>
                <div className="text-2xl font-semibold mt-1">{rollup[s] ?? 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">BCBA capacity — latest snapshots</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  <th className="p-3 font-medium">BCBA</th>
                  <th className="p-3 font-medium">State</th>
                  <th className="p-3 font-medium">Clients</th>
                  <th className="p-3 font-medium">RBTs</th>
                  <th className="p-3 font-medium">Reports due</th>
                  <th className="p-3 font-medium">QA corrections</th>
                  <th className="p-3 font-medium">Staffing gap</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(capacity.data ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-border/50">
                    <td className="p-3">{c.bcba_name ?? c.bcba_id.slice(0, 8)}</td>
                    <td className="p-3 text-muted-foreground">{c.state ?? "—"}</td>
                    <td className="p-3">{c.active_clients}</td>
                    <td className="p-3">{c.active_rbts}</td>
                    <td className="p-3">{c.reports_due}</td>
                    <td className="p-3">{c.open_qa_corrections}</td>
                    <td className="p-3">{fmtHours(c.open_staffing_gap_hours)}</td>
                    <td className="p-3"><CapacityBadge status={c.capacity_status} /></td>
                  </tr>
                ))}
                {(capacity.data ?? []).length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No capacity snapshots yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Productivity snapshots</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  <th className="p-3 font-medium">BCBA</th>
                  <th className="p-3 font-medium">Caseload</th>
                  <th className="p-3 font-medium">Billable</th>
                  <th className="p-3 font-medium">MTD</th>
                  <th className="p-3 font-medium">Forecast</th>
                  <th className="p-3 font-medium">Doc %</th>
                  <th className="p-3 font-medium">QA return</th>
                  <th className="p-3 font-medium">Cancellations</th>
                </tr>
              </thead>
              <tbody>
                {(productivity.data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border/50">
                    <td className="p-3">{p.bcba_name ?? p.bcba_id.slice(0, 8)}</td>
                    <td className="p-3">{p.caseload_size}</td>
                    <td className="p-3">{fmtHours(p.billable_hours)}</td>
                    <td className="p-3">{fmtHours(p.mtd_actual_hours)} / {fmtHours(p.mtd_target_hours)}</td>
                    <td className="p-3">{fmtHours(p.forecast_hours)}</td>
                    <td className="p-3">{Number(p.documentation_on_time_pct).toFixed(0)}%</td>
                    <td className="p-3">{Number(p.qa_return_rate_pct).toFixed(0)}%</td>
                    <td className="p-3">{p.cancelled_appointments}</td>
                  </tr>
                ))}
                {(productivity.data ?? []).length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No productivity snapshots yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Metric definitions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {METRIC_DEFINITIONS.map((d) => (
              <div key={d.key} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{d.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{d.definition}</div>
                <div className="text-[11px] text-muted-foreground mt-2">Source: {d.source} · {d.cadence}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductivityPage() {
  const [params, setParams] = useSearchParams();
  const [uid, setUid] = useState<string | null>(null);
  const [canLead, setCanLead] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUid(user?.id ?? null);
      if (!user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roleSet = new Set((roles ?? []).map((r: any) => r.role));
      const leadRoles = ["admin","super_admin","clinical_director","operations_leadership","state_director","qa","qa_director","scheduling_lead"];
      setCanLead(leadRoles.some((r) => roleSet.has(r)));
    })();
  }, []);

  const productivity = useMyProductivitySnapshot(uid);
  const capacity = useMyCapacitySnapshot(uid);

  const initialTab = params.get("tab") ?? "productivity";
  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Productivity & Capacity</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transparent, explainable views of your work. Metrics show their source and update dates. Capacity is advisory — never used to auto-assign cases.
        </p>
      </div>

      <Tabs value={initialTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="productivity"><Activity className="h-3.5 w-3.5 mr-1.5" /> My productivity</TabsTrigger>
          <TabsTrigger value="capacity"><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> My capacity</TabsTrigger>
          {canLead && <TabsTrigger value="leadership"><Users className="h-3.5 w-3.5 mr-1.5" /> Leadership</TabsTrigger>}
        </TabsList>

        <TabsContent value="productivity" className="mt-4">
          {productivity.isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
          ) : (
            <MyProductivity snapshot={productivity.data ?? null} />
          )}
        </TabsContent>

        <TabsContent value="capacity" className="mt-4">
          {capacity.isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
          ) : (
            <MyCapacity snapshot={capacity.data ?? null} />
          )}
        </TabsContent>

        {canLead && (
          <TabsContent value="leadership" className="mt-4">
            <LeadershipView />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}