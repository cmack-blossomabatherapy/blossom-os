import { useMemo, useState } from "react";
import { OSShell } from "../OSShell";
import { Link } from "react-router-dom";
import {
  Stethoscope, UserCheck, Eye, FileCheck2, BarChart3, ClipboardCheck,
  AlertTriangle, ShieldCheck, Plug, ArrowUpRight, Users, FileText,
  Plus, Activity as ActivityIcon,
} from "lucide-react";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { daysUntil } from "@/data/authorizations";
import { useClinicalDirectorData } from "@/hooks/useClinicalDirectorData";
import { useClinicalDirectorActions } from "@/hooks/useClinicalDirectorActions";
import { toast } from "sonner";

const ACTIONS = [
  { label: "BCBA Oversight",         to: "/assigned-bcbas",         icon: UserCheck },
  { label: "Supervision Visibility", to: "/supervision-visibility", icon: Eye },
  { label: "Treatment Plan Reviews", to: "/treatment-plan-reviews", icon: FileCheck2 },
  { label: "Progress Reports",       to: "/reports/progress-reports", icon: BarChart3 },
  { label: "Evaluations",            to: "/evaluations",            icon: ClipboardCheck },
  { label: "Clinical Escalations",   to: "/escalations-followups",  icon: AlertTriangle },
  { label: "QA Dashboard",           to: "/qa-team",                icon: ShieldCheck },
];

export default function ClinicalDirectorDashboard() {
  const [stateFilter, setStateFilter] = useState<string>("");
  const cr = useCentralReachOps({ stateFilter: stateFilter || null });
  const auths = useLiveAuthorizations();
  const clinical = useClinicalDirectorData({ state: stateFilter || null });
  const actions = useClinicalDirectorActions();
  const [creating, setCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; filters: Record<string, unknown> }>>([]);
  const [viewName, setViewName] = useState("");

  useMemo(() => {
    // load saved views once on mount
    void (async () => {
      try { setSavedViews((await actions.listSavedViews()) as never); } catch { /* noop */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveCurrentView() {
    if (!viewName.trim()) return;
    try {
      await actions.saveView(viewName.trim(), { stateFilter });
      setSavedViews((await actions.listSavedViews()) as never);
      setViewName("");
      toast.success("Saved view");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save view"); }
  }

  async function handleCreate() {
    if (!draftTitle.trim()) return;
    try {
      await actions.createWorkItem({
        title: draftTitle.trim(),
        source_type: "manual",
        priority: draftPriority,
        state: stateFilter || null,
      });
      setDraftTitle("");
      setDraftPriority("normal");
      setCreating(false);
      await clinical.reload();
      toast.success("Clinical work item created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create work item");
    }
  }

  const states = useMemo(() => {
    const s = new Set<string>();
    cr.rbtRoster.forEach((r) => r.state && s.add(r.state));
    cr.bcbaRoster.forEach((r) => r.state && s.add(r.state));
    return Array.from(s).sort();
  }, [cr.rbtRoster, cr.bcbaRoster]);

  const supervisionRisk = cr.coverageRisks.filter(
    (r) => r.level === "at_risk" || r.level === "uncovered",
  ).length;

  const treatmentPlansQueued = auths.qaItems.filter(
    (a) => a.stage === "In QA Review" || a.stage === "Awaiting Submission" || a.stage === "Submitted",
  ).length;

  const progressReportsDue = auths.qaItems.filter((a) => {
    const d = daysUntil(a.expirationDate);
    return d !== null && d <= 30;
  }).length;

  const escalations = auths.qaItems.filter((a) => {
    const meta = auths.metaById.get(a.id);
    return a.stage === "Denied" || meta?.priority === "urgent" || meta?.priority === "high";
  }).length;

  const openEvaluations = auths.qaItems.filter(
    (a) => (a.missingRequirements?.length ?? 0) > 0,
  ).length;

  const openClinicalItems = clinical.items.filter(
    (i) => i.status !== "resolved" && i.status !== "archived",
  ).length;

  const crConnected = cr.totalSessions > 0;
  const lastSession = useMemo(() => {
    let latest: string | null = null;
    cr.pairingsByClient.forEach((p) => {
      const d = p.lastRbtSessionDate;
      if (d && (!latest || d > latest)) latest = d;
    });
    return latest;
  }, [cr.pairingsByClient]);

  const snapshot: Array<{ label: string; value: number | string; hint: string; icon: typeof UserCheck; isText?: boolean }> = [
    { label: "BCBAs under oversight", value: cr.counts.bcbaCount,      hint: "active in last 60d", icon: UserCheck },
    { label: "Active clients",        value: cr.counts.activeClients,  hint: "with sessions",       icon: Users },
    { label: "Supervision risk",      value: supervisionRisk,          hint: "uncovered / at-risk", icon: Eye },
    { label: "Treatment plans queued",value: treatmentPlansQueued,     hint: "awaiting review",     icon: FileCheck2 },
    { label: "Progress reports due",  value: progressReportsDue,       hint: "next 30 days",        icon: BarChart3 },
    { label: "Open evaluations",      value: openEvaluations,          hint: "missing items",       icon: ClipboardCheck },
    { label: "Clinical escalations",  value: escalations,              hint: "needs attention",     icon: AlertTriangle },
    { label: "Open clinical items",   value: openClinicalItems,        hint: "clinical_work_items", icon: ClipboardCheck },
    { label: "CentralReach sync",     value: crConnected ? "Data available" : "Not connected", hint: lastSession ? `Last session ${lastSession}` : "No CR data yet", icon: Plug, isText: true },
  ];

  const topRisks = cr.coverageRisks.slice(0, 6);
  const topAging = auths.qaItems
    .filter((a) => a.expirationDate)
    .sort((a, b) => (a.expirationDate! < b.expirationDate! ? -1 : 1))
    .slice(0, 6);

  return (
    <OSShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Stethoscope className="h-4 w-4" /> Clinical Director
            </div>
            <h1 className="text-2xl font-semibold mt-1">Clinical Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Oversight of clinical quality, supervision health, treatment plans, and escalations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-2 text-sm"
              aria-label="State filter"
            >
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <ArrowUpRight className="h-4 w-4" /> Go to Reports
            </Link>
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New Work Item
            </button>
          </div>
        </header>

        {creating && (
          <section className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="text-sm font-semibold">Create Clinical Work Item</div>
            <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Title (e.g., Review supervision plan for Alex R.)"
                className="rounded-md border border-border bg-background px-2 py-2 text-sm"
              />
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as typeof draftPriority)}
                className="rounded-md border border-border bg-background px-2 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!draftTitle.trim()}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Create
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Manual items land as source_type=manual. Items linked to authorizations, supervision, or CentralReach also mirror into their existing activity trails.
            </p>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className={"mt-2 font-semibold " + (s.isText ? "text-base" : "text-2xl")}>
                {cr.loading || auths.loading ? "…" : String(s.value)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Clinical actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3">
            {ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Saved views</h2>
            <div className="flex items-center gap-2">
              <input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Name this view…"
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              />
              <button
                onClick={saveCurrentView}
                className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-90"
              >Save view</button>
            </div>
          </div>
          {savedViews.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved views yet. Persist your current filters into clinical_saved_views.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {savedViews.map((v) => {
                const f = v.filters as { stateFilter?: string };
                const summary = f.stateFilter ? `state: ${f.stateFilter}` : "all states";
                return (
                  <li key={v.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    <button
                      title={`Apply — ${summary}`}
                      onClick={() => setStateFilter(f.stateFilter ?? "")}
                    >
                      {v.name}
                      <span className="ml-1 text-muted-foreground">({summary})</span>
                    </button>
                    <button
                      title="Update saved view with current filters"
                      onClick={async () => {
                        await actions.updateSavedView(v.id, { filters: { stateFilter } });
                        setSavedViews((await actions.listSavedViews()) as never);
                        toast.success("Saved view updated");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >↻</button>
                    <button
                      onClick={async () => { await actions.deleteSavedView(v.id); setSavedViews((s) => s.filter((x) => x.id !== v.id)); }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >×</button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4" /> Supervision Risk</h2>
              <Link to="/supervision-visibility" className="text-xs text-primary hover:underline">Open</Link>
            </div>
            <div className="divide-y divide-border">
              {topRisks.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  No supervision risk data yet. Upload CentralReach billing data to populate this view.
                </div>
              )}
              {topRisks.map((r) => (
                <div key={r.clientName} className="flex items-center justify-between px-4 py-2 text-sm">
                  <div>
                    <div className="font-medium">{r.clientName}</div>
                    <div className="text-xs text-muted-foreground">{r.state ?? "—"} · BCBA {r.bcbaName ?? "unassigned"}</div>
                  </div>
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (r.level === "uncovered" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800")}>
                    {r.level.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Treatment Plan / Progress Report Aging</h2>
              <Link to="/treatment-plan-reviews" className="text-xs text-primary hover:underline">Open</Link>
            </div>
            <div className="divide-y divide-border">
              {topAging.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No authorizations in the pipeline yet.</div>
              )}
              {topAging.map((a) => {
                const d = daysUntil(a.expirationDate);
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div>
                      <div className="font-medium">{a.clientName}</div>
                      <div className="text-xs text-muted-foreground">{a.stage} · exp {a.expirationDate ?? "—"}</div>
                    </div>
                    <span className={"text-xs px-2 py-0.5 rounded-full " + ((d ?? 999) < 0 ? "bg-red-100 text-red-700" : (d ?? 999) < 14 ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground")}>
                      {d === null ? "—" : d < 0 ? `${Math.abs(d)}d overdue` : `${d}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plug className="h-4 w-4" /> CentralReach integration
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {crConnected
              ? `Uploaded CentralReach billing data available (${cr.totalSessions.toLocaleString()} session rows, ${cr.lookbackDays}d lookback). Live API sync not yet enabled.`
              : "No CentralReach data uploaded or synced yet. Upload a billing export in Reports to populate supervision, plan, and progress report queues."}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-2 py-0.5 text-xs">
            <span className={"h-1.5 w-1.5 rounded-full " + (crConnected ? "bg-emerald-500" : "bg-amber-500")} />
            {crConnected ? "Uploaded data available · Sync pending" : "Not connected"}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" /> Recent clinical activity
              <span className="text-xs text-muted-foreground font-normal">
                ({openClinicalItems} open item{openClinicalItems === 1 ? "" : "s"})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {clinical.loading && (
              <div className="p-4 text-sm text-muted-foreground">Loading activity…</div>
            )}
            {!clinical.loading && clinical.activity.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No clinical activity yet. Create a work item to start the audit trail.
              </div>
            )}
            {clinical.activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <div className="font-medium">{a.summary ?? a.event_type}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.event_type} · {a.source_type ?? "clinical"}
                    {a.actor_name ? ` · by ${a.actor_name}` : ""}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </OSShell>
  );
}