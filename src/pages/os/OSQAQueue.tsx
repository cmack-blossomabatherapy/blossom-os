import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  UserCheck, Brain, Clock, Inbox, FileSignature, AlertTriangle, X,
  ChevronRight, Users, Activity, History,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import { useQAWorkflow } from "@/hooks/useQAWorkflow";
import { toQAWorkItemRef } from "@/lib/os/qa/qaRefs";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { QABulkActionDialog, type QABulkVariant } from "@/components/qa/QABulkActionDialog";
import { useQADeepLink } from "@/hooks/useQADeepLink";

// QA Queue — central operational workflow queue for QA execution.
// Real data only via useLiveAuthorizations (monday_authorizations_raw).

type Tone = "ok" | "warn" | "crit";
type TabKey = "active" | "review" | "missing" | "expiring" | "escalation" | "completed";

const QA_TEAM = [
  "Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger",
];

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}
function relTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function toneClasses(t: Tone) {
  switch (t) {
    case "crit": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}
function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap",
      toneClasses(tone),
    )}>{children}</span>
  );
}
function EmptyState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

// ---------- Workflow classification ----------
function workflowTypeOf(a: Authorization): string {
  if (a.authType === "Reauth") return "Treatment Plan Review";
  if (a.stage === "Expiring Soon") return "Expiring Authorization";
  if (a.stage === "Denied") return "Escalated Review";
  if (a.missingInfo) return "Missing Documentation";
  if (a.stage === "In QA Review") return "Authorization Review";
  if (a.stage === "Awaiting Submission") return "Ready for Submission";
  return "Progress Report Collection";
}
function workflowStatus(a: Authorization): string {
  if (a.stage === "Denied") return "Escalated";
  if (a.missingInfo) return "Missing Information";
  if (a.stage === "Expiring Soon") return "Expiring Soon";
  if (a.stage === "In QA Review") return "In QA Review";
  if (a.stage === "Awaiting Submission") return a.daysInStage > 5 ? "Waiting on BCBA" : "Awaiting Review";
  if (a.stage === "Approved") return "Completed";
  if (a.stage === "Submitted") return "Ready for Submission";
  return a.stage;
}
function urgencyOf(a: Authorization): Tone {
  if (a.stage === "Denied") return "crit";
  const exp = daysUntil(a.expirationDate);
  if (exp !== null && exp >= 0 && exp <= 7) return "crit";
  if (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) return "crit";
  if (a.missingInfo) return "warn";
  if (exp !== null && exp >= 0 && exp <= 30) return "warn";
  if (a.daysInStage > 5) return "warn";
  return "ok";
}
function blockerOf(a: Authorization): string | null {
  if (a.stage === "Denied") return a.denialReason ? `Denial: ${a.denialReason}` : "Awaiting denial response";
  if (a.missingInfo) return a.missingRequirements[0] ?? "Missing documentation";
  if (a.stage === "Awaiting Submission" && a.daysInStage > 5) return "Waiting on BCBA response";
  return null;
}
function isActive(a: Authorization): boolean {
  return a.stage !== "Approved" && a.stage !== "Flaked Client";
}
function isCompletedRecent(a: Authorization): boolean {
  if (a.stage !== "Approved" || !a.approvedDate) return false;
  const d = daysUntil(a.approvedDate);
  return d !== null && d >= -14 && d <= 0;
}
function isEscalation(a: Authorization): boolean {
  if (a.stage === "Denied") return true;
  const exp = daysUntil(a.expirationDate);
  if (exp !== null && exp >= 0 && exp <= 7) return true;
  if (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) return true;
  return false;
}
function isExpiringSoon(a: Authorization): boolean {
  const d = daysUntil(a.expirationDate);
  return d !== null && d >= 0 && d <= 90 && a.stage !== "Approved";
}

// ---------- Page ----------
export default function OSQAQueue() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const wf = useQAWorkflow();

  const [tab, setTab] = useState<TabKey>("active");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkVariant, setBulkVariant] = useState<QABulkVariant | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const openBulk = (v: QABulkVariant) => { setBulkVariant(v); setBulkOpen(true); };

  // QA Pass 5: honor ?id= / ?focus= / ?bcba= / ?client= deep links.
  useQADeepLink({
    items,
    loading,
    setOpenId,
    setQuery,
    // OSQAQueue has no dedicated BCBA dropdown — funnel into search.
  });

  const states = useMemo(
    () => Array.from(new Set(items.map(a => a.state).filter(Boolean))).sort(),
    [items],
  );
  const types = useMemo(
    () => Array.from(new Set(items.map(a => workflowTypeOf(a)))).sort(),
    [items],
  );
  const owners = useMemo(() => {
    const s = new Set<string>();
    items.forEach(a => {
      if (a.qaOwner) s.add(a.qaOwner);
      if (a.coordinator) s.add(a.coordinator);
    });
    return Array.from(s).sort();
  }, [items]);
  const statuses = useMemo(
    () => Array.from(new Set(items.map(a => workflowStatus(a)))).sort(),
    [items],
  );

  const tabbed = useMemo(() => ({
    active:     items.filter(isActive),
    review:     items.filter(a => a.stage === "In QA Review"),
    missing:    items.filter(a => a.missingInfo),
    expiring:   items.filter(isExpiringSoon),
    escalation: items.filter(isEscalation),
    completed:  items.filter(isCompletedRecent),
  } as Record<TabKey, Authorization[]>), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(a => {
      if (stateFilter !== "all" && a.state !== stateFilter) return false;
      if (typeFilter !== "all" && workflowTypeOf(a) !== typeFilter) return false;
      if (ownerFilter !== "all" && a.qaOwner !== ownerFilter && a.coordinator !== ownerFilter) return false;
      if (urgencyFilter !== "all" && urgencyOf(a) !== urgencyFilter) return false;
      if (statusFilter !== "all" && workflowStatus(a) !== statusFilter) return false;
      if (q) {
        const hay = [a.clientName, a.payor, a.state, a.coordinator, a.qaOwner ?? "", a.stage, workflowTypeOf(a)]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((x, y) => {
      const rank = (z: Authorization) => urgencyOf(z) === "crit" ? 3 : urgencyOf(z) === "warn" ? 2 : 1;
      return rank(y) - rank(x) || y.daysInStage - x.daysInStage;
    });
  }, [tabbed, tab, query, stateFilter, typeFilter, ownerFilter, urgencyFilter, statusFilter]);

  const counts = useMemo(() => ({
    active: tabbed.active.length,
    review: tabbed.review.length,
    missing: tabbed.missing.length,
    expiring: tabbed.expiring.length,
    escalation: tabbed.escalation.length,
    completed: tabbed.completed.length,
  }), [tabbed]);

  useEffect(() => { setSelected(new Set()); }, [tab]);
  const toggleSel = (id: string) => setSelected(p => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const allVisibleSelected = visible.length > 0 && visible.every(a => selected.has(a.id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(visible.map(a => a.id)));
  };

  const selectedRefs = useMemo(
    () =>
      items
        .filter(a => selected.has(a.id))
        .map(a => toQAWorkItemRef(a, sourceById.get(a.id))),
    [items, selected, sourceById],
  );
  const [bulkBusy, setBulkBusy] = useState(false);
  const runBulk = async (fn: () => Promise<unknown>) => {
    if (bulkBusy || selectedRefs.length === 0) return;
    setBulkBusy(true);
    try {
      await fn();
      setSelected(new Set());
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  };
  const bulkAssign      = () => openBulk({ kind: "assign", defaultValue: "" });
  const bulkFollowUp    = () => openBulk({ kind: "followUp", defaultValue: "Follow-up requested" });
  const bulkMarkReviewed= () => openBulk({ kind: "markReviewed" });
  const bulkEscalate    = () => openBulk({ kind: "escalate", defaultValue: "Escalated from QA queue" });

  const handleBulkSubmit = async (value: string) => {
    if (!bulkVariant) return;
    const closeAfter = () => { setBulkOpen(false); setBulkVariant(null); };
    try {
      switch (bulkVariant.kind) {
        case "assign":
          await runBulk(() => wf.bulkAssign(selectedRefs, value || null));
          break;
        case "followUp":
          await runBulk(async () => {
            for (const ref of selectedRefs) await wf.sendFollowUp(ref, value);
          });
          break;
        case "markReviewed":
          await runBulk(() => wf.bulkStartReview(selectedRefs, null));
          break;
        case "escalate":
          await runBulk(async () => {
            for (const ref of selectedRefs) await wf.escalate(ref, value);
          });
          break;
      }
    } finally {
      closeAfter();
    }
  };

  const priorities = useMemo(() => {
    return [...tabbed.escalation, ...tabbed.expiring]
      .sort((a, b) => (daysUntil(a.expirationDate) ?? 999) - (daysUntil(b.expirationDate) ?? 999))
      .slice(0, 6);
  }, [tabbed]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = items.filter(a => a.qaOwner === name || a.coordinator === name);
      const open = owned.filter(isActive).length;
      const overdue = owned.filter(a => a.daysInStage > 7 && isActive(a)).length;
      const blocked = owned.filter(a => a.missingInfo && isActive(a)).length;
      return { name, open, overdue, blocked };
    });
  }, [items]);

  const openItem = items.find(a => a.id === openId) ?? null;
  const urgentCount = counts.escalation +
    tabbed.expiring.filter(a => (daysUntil(a.expirationDate) ?? 999) <= 14).length;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "active",     label: "All Active",         count: counts.active },
    { key: "review",     label: "Needs Review",       count: counts.review,     tone: "warn" },
    { key: "missing",    label: "Missing Info",       count: counts.missing,    tone: "warn" },
    { key: "expiring",   label: "Expiring Soon",      count: counts.expiring,   tone: "warn" },
    { key: "escalation", label: "Escalations",        count: counts.escalation, tone: "crit" },
    { key: "completed",  label: "Completed Recently", count: counts.completed,  tone: "ok" },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">QA Queue</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Manage active QA reviews, blockers, follow-ups, and workflow progression.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.active} in queue
              </span>
              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {urgentCount} urgent
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, authorization, BCBA, workflow, status, or escalation..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Workflow"
              options={[{ value: "all", label: "All workflows" }, ...types.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="Owner"
              options={[{ value: "all", label: "All owners" }, ...owners.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={urgencyFilter} onChange={setUrgencyFilter} label="Urgency"
              options={[
                { value: "all", label: "All urgency" },
                { value: "crit", label: "Critical" },
                { value: "warn", label: "High" },
                { value: "ok", label: "Normal" },
              ]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status"
              options={[{ value: "all", label: "All statuses" }, ...statuses.map(s => ({ value: s, label: s }))]} />
          </div>
        </header>

        {/* TABS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition whitespace-nowrap border",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border/70 hover:bg-muted",
                )}
              >
                {t.label}
                <span className={cn(
                  "tabular-nums text-[11px] px-1.5 py-0.5 rounded-full",
                  active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>{t.count}</span>
                {t.tone === "crit" && !active && t.count > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                )}
              </button>
            );
          })}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <main className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                {selected.size === 0
                  ? `${visible.length} ${visible.length === 1 ? "workflow" : "workflows"}`
                  : `${selected.size} selected`}
              </label>
              {selected.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <BulkBtn icon={UserCheck} label="Assign"        onClick={bulkAssign}      disabled={bulkBusy} />
                  <BulkBtn icon={Send}      label="Follow-up"     onClick={bulkFollowUp}    disabled={bulkBusy} />
                  <BulkBtn icon={CheckCircle2} label="Mark reviewed" onClick={bulkMarkReviewed} disabled={bulkBusy} />
                  <BulkBtn icon={Flame}     label="Escalate" tone="crit" onClick={bulkEscalate} disabled={bulkBusy} />
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <Card key={i} className="p-5"><div className="h-16 rounded-lg bg-muted animate-pulse" /></Card>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <Card>
                <EmptyState
                  icon={CheckCircle2}
                  title={
                    tab === "missing"    ? "No blocked workflows right now." :
                    tab === "escalation" ? "No escalations requiring attention." :
                    tab === "expiring"   ? "No items expiring in this window." :
                    tab === "review"     ? "No reviews waiting in this queue." :
                    tab === "completed"  ? "No recently completed reviews." :
                                           "Nothing in this queue. You're caught up."
                  }
                />
              </Card>
            ) : (
              <ul className="space-y-3">
                {visible.map(a => (
                  <QueueCard
                    key={a.id}
                    auth={a}
                    selected={selected.has(a.id)}
                    onToggleSelect={() => toggleSel(a.id)}
                    onOpen={() => setOpenId(a.id)}
                  />
                ))}
              </ul>
            )}
          </main>

          <aside className="space-y-5">
            <section>
              <SectionLabel>Today's priorities</SectionLabel>
              <Card>
                {priorities.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent priorities." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(a => {
                      const exp = daysUntil(a.expirationDate);
                      const tone = urgencyOf(a);
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {workflowTypeOf(a)} · {a.state}
                                </div>
                              </div>
                              <Pill tone={tone}>
                                {a.stage === "Denied" ? "Denied" :
                                 exp !== null && exp <= 14 ? `${exp}d exp` :
                                 `${a.daysInStage}d`}
                              </Pill>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>

            <section>
              <SectionLabel>Team workload</SectionLabel>
              <Card>
                <ul className="divide-y divide-border/60">
                  {workload.map(w => (
                    <li key={w.name} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-semibold shrink-0">
                            {w.name.split(" ").map(s => s[0]).join("").slice(0,2)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{w.name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{w.open}</span>
                      </div>
                      {(w.overdue > 0 || w.blocked > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-9 flex-wrap">
                          {w.overdue > 0 && <Pill tone="crit">{w.overdue} overdue</Pill>}
                          {w.blocked > 0 && <Pill tone="warn">{w.blocked} blocked</Pill>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section>
              <SectionLabel>Operational Insights</SectionLabel>
              <Card className="p-4 bg-gradient-to-br from-primary/5 via-card to-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Brain className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <div className="text-xs text-muted-foreground">QA operational copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "What should QA prioritize first?",
                    "Which workflows are blocked?",
                    "Which PRs are overdue?",
                    "What auths are expiring soon?",
                    "Which BCBAs need follow-up?",
                  ].map(p => (
                    <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                      className="block text-[12px] px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted transition text-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" strokeWidth={2} />
                      {p}
                    </Link>
                  ))}
                </div>
              </Card>
            </section>
          </aside>
        </div>
      </div>

      {openItem && (
        <DetailSlideout
          auth={openItem}
          onClose={() => setOpenId(null)}
          onChanged={refresh}
          sourceSystem={sourceById.get(openItem.id)}
        />
      )}
      <QABulkActionDialog
        open={bulkOpen}
        onOpenChange={(o) => { if (!o) { setBulkOpen(false); setBulkVariant(null); } }}
        variant={bulkVariant}
        selectedCount={selectedRefs.length}
        busy={bulkBusy}
        onSubmit={handleBulkSubmit}
      />
    </OSShell>
  );
}

// ---------- Sub-components ----------
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
      {children}
    </div>
  );
}

function FilterSelect({
  value, onChange, label, options,
}: {
  value: string; onChange: (v: string) => void; label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-full pl-3 pr-8 text-xs border transition appearance-none cursor-pointer",
          value === "all"
            ? "bg-card border-border/70 text-foreground hover:bg-muted"
            : "bg-primary/10 border-primary/30 text-primary",
        )}
        aria-label={label}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground rotate-90 pointer-events-none" />
    </div>
  );
}

function BulkBtn({ icon: Icon, label, tone, onClick, disabled }: { icon: React.ElementType; label: string; tone?: Tone; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn(
      "h-8 px-3 rounded-lg text-xs font-medium border transition inline-flex items-center gap-1.5",
      disabled && "opacity-50 cursor-not-allowed",
      tone === "crit"
        ? "border-destructive/20 text-destructive hover:bg-destructive/5"
        : "border-border/70 text-foreground bg-card hover:bg-muted",
    )}>
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function QueueCard({
  auth: a, selected, onToggleSelect, onOpen,
}: {
  auth: Authorization; selected: boolean; onToggleSelect: () => void; onOpen: () => void;
}) {
  const tone = urgencyOf(a);
  const status = workflowStatus(a);
  const type = workflowTypeOf(a);
  const due = daysUntil(a.nextTaskDue);
  const exp = daysUntil(a.expirationDate);
  const blocker = blockerOf(a);
  const accent =
    tone === "crit" ? "before:bg-destructive/70" :
    tone === "warn" ? "before:bg-amber-500/70" :
                      "before:bg-emerald-500/50";

  return (
    <li>
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full",
        accent,
        selected && "ring-1 ring-primary/30",
      )}>
        <div className="flex items-start gap-3 p-5">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={e => e.stopPropagation()}
            className="mt-1 h-3.5 w-3.5 rounded border-border accent-primary shrink-0"
          />
          <button onClick={onOpen} className="flex-1 text-left min-w-0">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl grid place-items-center border shrink-0",
                toneClasses(tone),
              )}>
                <FileSignature className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{a.clientName}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{type}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {a.payor} · {a.state} · {status}
                </div>

                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <Pill tone={tone}>
                    {tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}
                  </Pill>
                  {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
                  {a.stage === "Denied" && <Pill tone="crit">Escalated</Pill>}
                  {exp !== null && exp <= 30 && exp >= 0 && (
                    <Pill tone={exp <= 7 ? "crit" : "warn"}>Exp in {exp}d</Pill>
                  )}
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    QA: {a.qaOwner ?? a.coordinator ?? "Unassigned"}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    BCBA: {a.coordinator}
                  </span>
                  {due !== null && (
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `Due in ${due}d`}
                    </span>
                  )}
                </div>

                {blocker && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 border border-border/60 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                    <div className="text-[12px] text-foreground">
                      <span className="text-muted-foreground">Blocker:</span> {blocker}
                    </div>
                  </div>
                )}
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Next: {a.nextAction} · Updated {relTime(a.lastActivity)}
                </div>
              </div>
            </div>
          </button>

          <div className="hidden md:flex flex-col gap-1.5 shrink-0">
            <IconBtn title="Open record"   icon={ExternalLink}   onClick={onOpen} />
            <IconBtn title="Mark reviewed" icon={CheckCircle2}   onClick={onOpen} />
            <IconBtn title="Send follow-up" icon={Send}          onClick={onOpen} />
            <IconBtn title="Escalate"      icon={Flame} tone="crit" onClick={onOpen} />
          </div>
        </div>
      </Card>
    </li>
  );
}

function IconBtn({
  icon: Icon, title, tone, to, onClick,
}: { icon: React.ElementType; title: string; tone?: Tone; to?: string; onClick?: () => void }) {
  const cls = cn(
    "h-8 w-8 rounded-lg grid place-items-center border transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
  );
  if (to) return <Link to={to} title={title} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>;
  return <button title={title} onClick={onClick} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function DetailSlideout({ auth: a, onClose, onChanged, sourceSystem }: { auth: Authorization; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const tone = urgencyOf(a);
  const type = workflowTypeOf(a);
  const status = workflowStatus(a);
  const blocker = blockerOf(a);
  const exp = daysUntil(a.expirationDate);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card border-l border-border/70 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{type}</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground truncate">{a.clientName}</h2>
            <div className="text-xs text-muted-foreground mt-0.5">{a.payor} · {a.state}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={tone}>{tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}</Pill>
            <Pill tone={a.stage === "Denied" ? "crit" : a.stage === "Approved" ? "ok" : "warn"}>{status}</Pill>
            {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
            {exp !== null && exp >= 0 && exp <= 30 && <Pill tone={exp <= 7 ? "crit" : "warn"}>Exp in {exp}d</Pill>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Fact label="QA owner"      value={a.qaOwner ?? "Unassigned"} />
            <Fact label="BCBA"          value={a.coordinator} />
            <Fact label="Auth type"     value={a.authType} />
            <Fact label="Stage"         value={a.stage} />
            <Fact label="Days in stage" value={`${a.daysInStage}d`} />
            <Fact label="Hours"         value={String(a.hours ?? "—")} />
            <Fact label="Submitted"     value={a.submittedDate ?? "—"} />
            <Fact label="Approved"      value={a.approvedDate ?? "—"} />
            <Fact label="Expires"       value={a.expirationDate ?? "—"} />
            <Fact label="Next due"      value={a.nextTaskDue ?? "—"} />
          </div>

          <section>
            <SectionLabel>Next required action</SectionLabel>
            <Card className="p-3.5 text-sm text-foreground">{a.nextAction}</Card>
          </section>

          {blocker && (
            <section>
              <SectionLabel>Blockers</SectionLabel>
              <Card className="p-3.5">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-foreground">{blocker}</span>
                </div>
                {a.missingRequirements.length > 1 && (
                  <ul className="mt-2 ml-6 list-disc text-xs text-muted-foreground space-y-0.5">
                    {a.missingRequirements.slice(1).map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                )}
              </Card>
            </section>
          )}

          {a.denialReason && (
            <section>
              <SectionLabel>Denial reason</SectionLabel>
              <Card className="p-3.5 text-sm text-destructive">{a.denialReason}</Card>
            </section>
          )}

          <section>
            <SectionLabel>Workflow timeline</SectionLabel>
            <Card className="p-3">
              {a.timeline.length === 0 ? (
                <EmptyState icon={History} title="No activity yet." />
              ) : (
                <ol className="space-y-3">
                  {a.timeline.slice(0, 8).map(e => (
                    <li key={e.id} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-muted grid place-items-center shrink-0">
                        <Activity className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-foreground">{e.description}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{relTime(e.timestamp)}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </section>

          <section className="space-y-2 pt-1">
            <SectionLabel>Actions</SectionLabel>
            <QAActionsPanel auth={a} variant="queue" sourceSystem={sourceSystem} onChanged={onChanged} />
          </section>
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}
function ActionBtn({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone?: Tone }) {
  return (
    <button className={cn(
      "h-9 px-3 rounded-xl text-xs font-medium border transition inline-flex items-center justify-center gap-1.5",
      tone === "crit"
        ? "border-destructive/20 text-destructive hover:bg-destructive/5"
        : "border-border/70 text-foreground bg-card hover:bg-muted",
    )}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}
