import { useMemo, useState } from "react";
import { OSShell } from "../OSShell";
import { Link } from "react-router-dom";
import {
  Flame, AlertTriangle, FileSignature, Bell, Eye, HeartHandshake,
  ClipboardCheck, PlusCircle, UserCheck, RefreshCw, FileText, Activity,
  Archive, CheckCircle2, X,
} from "lucide-react";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import { CASE_STATUSES, SEVERITY_STYLE, type BSCase, type BSCaseStatus } from "./behavioralSupportTypes";
import {
  BehavioralSupportCaseDialog,
  BehavioralSupportNoteDialog,
  BehavioralSupportEscalationDialog,
  BehavioralSupportFollowupDialog,
  BehavioralSupportPlanDialog,
} from "./_dialogs";

export default function BehavioralSupportDashboard() {
  const bs = useBehavioralSupportData();
  const { metrics, loading, error, escalations, followups, plans, activity, cases } = bs;
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const openCase = useMemo(() => cases.find((c) => c.id === openCaseId) ?? null, [cases, openCaseId]);

  const urgent = [...escalations]
    .filter((e) => !["resolved", "archived"].includes(e.status))
    .sort((a, b) => {
      const rank = { crisis: 0, high: 1, medium: 2, low: 3 } as const;
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 5);

  const dueToday = followups
    .filter((f) => f.status !== "completed" && f.status !== "cancelled")
    .slice(0, 5);

  const highRisk = cases
    .filter((c) => (c.severity === "high" || c.severity === "crisis") && !["resolved", "archived"].includes(c.status))
    .slice(0, 5);

  const openPlans = plans
    .filter((p) => ["draft", "active", "monitoring"].includes(p.plan_status))
    .slice(0, 5);

  const activeCases = cases
    .filter((c) => !["resolved", "archived"].includes(c.status))
    .slice(0, 8);

  const SNAPSHOT = [
    { label: "Active crises", value: metrics.activeCrises, hint: "escalations open", icon: Flame },
    { label: "High-risk families", value: metrics.highRiskFamilies, hint: "watchlist", icon: HeartHandshake },
    { label: "Open support plans", value: metrics.openPlans, hint: "in progress", icon: FileSignature },
    { label: "Follow-ups due today", value: metrics.dueToday, hint: `${metrics.overdue} overdue`, icon: Bell },
    { label: "Pending BCBA handoff", value: metrics.pendingBcbaHandoff, hint: "awaiting clinical", icon: UserCheck },
    { label: "Escalations open", value: metrics.escalationsOpen, hint: `${metrics.resolvedThisWeek} resolved this week`, icon: AlertTriangle },
  ];

  const ACTIONS = [
    { label: "New escalation", to: "/behavioral-support/escalations", icon: Flame },
    { label: "New support plan", to: "/behavioral-support/support-plans", icon: FileSignature },
    { label: "Assign follow-up", to: "/behavioral-support/follow-ups", icon: Bell },
    { label: "Supervision visibility", to: "/behavioral-support/supervision-visibility", icon: Eye },
    { label: "Add support note", to: "/behavioral-support/escalations", icon: PlusCircle },
    { label: "Open shared reports", to: "/reports", icon: FileText },
  ];

  return (
    <OSShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Flame className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Behavioral Support Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crisis queue, behavior support plans, follow-ups, and clinical handoff visibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewCaseOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" /> New Case
            </button>
            <button
              onClick={() => void bs.refresh()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SNAPSHOT.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {loading ? <span className="inline-block h-6 w-8 rounded bg-muted animate-pulse" /> : s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Quick actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
            {ACTIONS.map((a) => (
              <Link
                key={a.to + a.label}
                to={a.to}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Active Cases</h2>
            <span className="text-xs text-muted-foreground">({metrics.activeCaseCount})</span>
            <button
              onClick={() => setNewCaseOpen(true)}
              className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" /> New Case
            </button>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[0,1,2].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
          ) : activeCases.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No active cases. Open one to begin tracking a family.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activeCases.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setOpenCaseId(c.id)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.client_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.state ?? "—"} • {c.bcba_name ?? "no BCBA"} • {c.status.replace(/_/g," ")}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLE[c.severity]}`}>
                      {c.severity}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Urgent queue</h2>
              <Link to="/behavioral-support/escalations" className="ml-auto text-xs text-primary hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[0,1,2].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
              </div>
            ) : urgent.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                You're all caught up. No urgent escalations right now.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {urgent.map((e) => (
                  <li key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{e.client_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{e.description}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLE[e.severity]}`}>
                      {e.severity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Needs today</h2>
              <Link to="/behavioral-support/follow-ups" className="ml-auto text-xs text-primary hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[0,1,2].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
              </div>
            ) : dueToday.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No follow-ups scheduled today.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {dueToday.map((f) => (
                  <li key={f.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.client_name}</div>
                      <div className="text-xs text-muted-foreground">{f.followup_type.replace(/_/g, " ")}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(f.due_at).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              <h2 className="text-sm font-semibold">High-risk families</h2>
              <Link to="/behavioral-support/crisis-support" className="ml-auto text-xs text-primary hover:underline">Crisis support</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[0,1,2].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
            ) : highRisk.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No families on the high-risk watchlist.</div>
            ) : (
              <ul className="divide-y divide-border">
                {highRisk.map((c) => (
                  <li key={c.id} className="px-4 py-3 cursor-pointer hover:bg-accent/40" onClick={() => setOpenCaseId(c.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium truncate">{c.client_name}</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLE[c.severity]}`}>{c.severity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.primary_concern ?? "No primary concern noted"}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Open support plans</h2>
              <Link to="/behavioral-support/support-plans" className="ml-auto text-xs text-primary hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[0,1,2].map((i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}</div>
            ) : openPlans.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No open support plans. Create one from a case or escalation.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {openPlans.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="text-sm font-medium truncate">{p.plan_title}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.client_name} • {p.plan_status}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[0,1,2].map((i) => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}</div>
          ) : activity.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Activity will appear here as escalations, plans, and follow-ups are logged.
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-80 overflow-auto">
              {activity.slice(0, 20).map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    {a.body && <div className="text-xs text-muted-foreground truncate">{a.body}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!loading && !error && cases.length === 0 && escalations.length === 0 && plans.length === 0 && (
          <section className="rounded-lg border border-dashed border-border p-8 text-center space-y-3">
            <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Ready for your first case</h2>
            <p className="text-sm text-muted-foreground">
              Nothing has been logged yet. Start by opening a crisis, an escalation, or a support plan.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setNewCaseOpen(true)} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm">Open new case</button>
              <Link to="/behavioral-support/escalations" className="rounded-md border border-border px-3 py-1.5 text-sm">New escalation</Link>
              <Link to="/behavioral-support/support-plans" className="rounded-md border border-border px-3 py-1.5 text-sm">Support plans</Link>
            </div>
          </section>
        )}
      </div>

      <BehavioralSupportCaseDialog
        open={newCaseOpen}
        onOpenChange={setNewCaseOpen}
        onSubmit={async (v) => {
          const created = await bs.createCase({
            client_name: v.client_name,
            state: v.state,
            bcba_name: v.bcba_name,
            rbt_name: v.rbt_name,
            severity: v.severity,
            status: v.status,
            source_system: v.source_system,
            centralreach_client_id: v.centralreach_client_id,
            primary_concern: v.primary_concern,
          });
          if (created && v.initial_note) {
            await bs.addNote({
              case_id: created.id,
              title: `Initial note for ${created.client_name}`,
              body: v.initial_note,
            });
          }
        }}
      />

      {openCase && (
        <CaseDetailDrawer
          caseRow={openCase}
          bs={bs}
          onClose={() => setOpenCaseId(null)}
        />
      )}
    </OSShell>
  );
}

function CaseDetailDrawer({
  caseRow,
  bs,
  onClose,
}: {
  caseRow: BSCase;
  bs: ReturnType<typeof useBehavioralSupportData>;
  onClose: () => void;
}) {
  const linkedEscalations = bs.escalations.filter((e) => e.case_id === caseRow.id);
  const linkedPlans = bs.plans.filter((p) => p.case_id === caseRow.id);
  const linkedFollowups = bs.followups.filter((f) => f.case_id === caseRow.id);
  const timeline = bs.activity.filter((a) => a.case_id === caseRow.id).slice(0, 20);
  const [noteOpen, setNoteOpen] = useState(false);
  const [escOpen, setEscOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        className="bg-card w-full max-w-xl h-full overflow-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{caseRow.client_name}</h2>
            <div className="text-xs text-muted-foreground">
              {caseRow.state ?? "—"} • {caseRow.status.replace(/_/g," ")} • severity {caseRow.severity}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="BCBA">{caseRow.bcba_name ?? "—"}</Field>
          <Field label="RBT">{caseRow.rbt_name ?? "—"}</Field>
          <Field label="Source system">{caseRow.source_system}</Field>
          <Field label="CentralReach client id">{caseRow.centralreach_client_id ?? "—"}</Field>
        </div>
        <Field label="Summary / concern">{caseRow.primary_concern ?? "—"}</Field>

        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <select
              value={caseRow.status}
              onChange={(e) => void bs.updateCase(caseRow.id, {
                status: e.target.value as BSCaseStatus,
                ...(e.target.value === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
              })}
              className="bg-background border border-border rounded px-2 py-1"
            >
              {CASE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
            </select>
          </label>
          <button onClick={() => setNoteOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Add note</button>
          <button onClick={() => setEscOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Create escalation</button>
          <button onClick={() => setPlanOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Create support plan</button>
          <button onClick={() => setFuOpen(true)} className="border border-border rounded px-2 py-1 hover:bg-accent">Create follow-up</button>
          <button
            onClick={() => void bs.resolveCase(caseRow.id)}
            className="border border-emerald-500/40 text-emerald-600 rounded px-2 py-1 hover:bg-emerald-500/10 flex items-center gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
          </button>
          <button
            onClick={() => void bs.archiveCase(caseRow.id)}
            className="border border-border rounded px-2 py-1 hover:bg-accent flex items-center gap-1 text-muted-foreground"
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
        </div>

        <LinkedList title={`Linked escalations (${linkedEscalations.length})`} items={linkedEscalations.map((e) => `${e.escalation_type.replace(/_/g," ")} · ${e.status.replace(/_/g," ")}`)} />
        <LinkedList title={`Linked support plans (${linkedPlans.length})`} items={linkedPlans.map((p) => `${p.plan_title} · ${p.plan_status}`)} />
        <LinkedList title={`Linked follow-ups (${linkedFollowups.length})`} items={linkedFollowups.map((f) => `${f.followup_type.replace(/_/g," ")} · due ${new Date(f.due_at).toLocaleDateString()} · ${f.status.replace(/_/g," ")}`)} />

        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Activity timeline</div>
          {timeline.length === 0 ? (
            <div className="text-xs text-muted-foreground">No activity yet.</div>
          ) : (
            <ul className="text-xs space-y-1.5">
              {timeline.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    {a.body && <div className="text-muted-foreground truncate">{a.body}</div>}
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <BehavioralSupportNoteDialog
          open={noteOpen}
          onOpenChange={setNoteOpen}
          title={`Note on ${caseRow.client_name}`}
          onSubmit={(body) => bs.addNote({ case_id: caseRow.id, title: `Note on ${caseRow.client_name}`, body })}
        />
        <BehavioralSupportEscalationDialog
          open={escOpen}
          onOpenChange={setEscOpen}
          clientName={caseRow.client_name}
          onSubmit={async (description) => {
            await bs.createEscalation({
              case_id: caseRow.id,
              client_name: caseRow.client_name,
              state: caseRow.state,
              bcba_name: caseRow.bcba_name,
              escalation_type: "clinical_support",
              severity: caseRow.severity,
              status: "new",
              description,
            });
          }}
        />
        <BehavioralSupportPlanDialog
          open={planOpen}
          onOpenChange={setPlanOpen}
          clientName={caseRow.client_name}
          onSubmit={async ({ plan_title, notes }) => {
            await bs.createPlan({
              case_id: caseRow.id,
              client_name: caseRow.client_name,
              plan_title,
              plan_status: "draft",
              reason_for_plan: notes ?? null,
              goals: [],
              strategies: [],
              replacement_behaviors: [],
              bcba_owner: caseRow.bcba_name,
            });
          }}
        />
        <BehavioralSupportFollowupDialog
          open={fuOpen}
          onOpenChange={setFuOpen}
          clientName={caseRow.client_name}
          onSubmit={async ({ due_at, followup_type, priority, assigned_to_name, notes }) => {
            await bs.createFollowup({
              case_id: caseRow.id,
              client_name: caseRow.client_name,
              followup_type,
              priority,
              assigned_to_name: assigned_to_name ?? null,
              due_at,
              status: "open",
            });
            if (notes) {
              await bs.addNote({ case_id: caseRow.id, title: `Follow-up notes for ${caseRow.client_name}`, body: notes });
            }
          }}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function LinkedList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">None yet.</div>
      ) : (
        <ul className="text-xs list-disc pl-4 space-y-0.5 text-muted-foreground">
          {items.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}