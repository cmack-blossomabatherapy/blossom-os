import { useEffect, useMemo, useState } from "react";
import {
  KanbanSquare, AlertTriangle, Clock, Flame, Search, Plus, Filter, X,
  ChevronRight, MessageSquare, CheckCircle2, ArrowUpRight, Sparkles, User,
  MapPin, Calendar, Inbox, FileText, Send, Wallet, HeartHandshake, Briefcase,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Card, KpiCard, HeaderBtn, PageHeader, Pill, Empty, fullName, fmtDate, type Tone } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IssueRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  owner_role: string | null;
  due_date: string | null;
  resolution: string | null;
  source: string | null;
  employee_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
interface EmpLite {
  id: string; first_name: string; last_name: string; preferred_name: string | null;
  job_title: string | null; state: string | null;
}
interface CommRow {
  id: string; employee_id: string | null; related_issue_id: string | null;
  channel: string; direction: string; category: string;
  subject: string | null; body: string | null; status: string;
  created_at: string; created_by_name: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  missing_time: "Missing Time",
  adjustment: "Adjustment",
  pto_review: "PTO Review",
  benefits: "Benefits",
  employee_question: "Employee Question",
  attendance_exception: "Attendance",
  approval_needed: "Approval Needed",
  blocker: "Blocker",
  reminder: "Reminder",
  escalation: "Escalation",
  other: "Other",
};
const STATUS_LABEL: Record<string, string> = {
  open: "New",
  in_progress: "In Review",
  escalated: "Escalated",
  resolved: "Resolved",
  cancelled: "Cancelled",
};
const STATUS_TONE: Record<string, Tone> = {
  open: "info",
  in_progress: "warn",
  escalated: "crit",
  resolved: "ok",
  cancelled: "muted",
};
const PRIORITY_TONE: Record<string, Tone> = {
  urgent: "crit", high: "warn", normal: "info", low: "muted",
};

function today() { return new Date().toISOString().slice(0, 10); }
function isOverdue(i: IssueRow) {
  return i.due_date && i.due_date < today() && i.status !== "resolved" && i.status !== "cancelled";
}
function relTime(iso: string) {
  const d = new Date(iso); const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return days < 30 ? `${days}d ago` : fmtDate(iso);
}

const STATUS_OPTS = ["all", "open", "in_progress", "escalated", "resolved"];
const PRIORITY_OPTS = ["all", "urgent", "high", "normal", "low"];
const CATEGORY_OPTS = ["all", ...Object.keys(CATEGORY_LABEL)];
const VIEW_TABS: { id: string; label: string; icon?: any }[] = [
  { id: "all", label: "All open" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "blocked", label: "Blocked" },
  { id: "waiting_employee", label: "Waiting on employee" },
  { id: "missing_time", label: "Missing time" },
  { id: "adjustments", label: "Adjustments" },
  { id: "nj", label: "NJ payroll" },
  { id: "escalated", label: "Escalated" },
  { id: "resolved", label: "Resolved" },
];

export default function OSPayrollQueue() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [emps, setEmps] = useState<Record<string, EmpLite>>({});
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [state, setState] = useState("all");

  const [selected, setSelected] = useState<IssueRow | null>(null);
  const [comms, setComms] = useState<CommRow[]>([]);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const { data: is } = await supabase
      .from("payroll_issues").select("*").order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false }).limit(500);
    const rows = (is ?? []) as IssueRow[];
    setIssues(rows);
    const ids = Array.from(new Set(rows.map(r => r.employee_id).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: ep } = await supabase.from("employees")
        .select("id,first_name,last_name,preferred_name,job_title,state").in("id", ids);
      const map: Record<string, EmpLite> = {};
      (ep ?? []).forEach((e: any) => { map[e.id] = e; });
      setEmps(map);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function loadComms(issueId: string, employeeId: string | null) {
    const q = supabase.from("payroll_communications").select("*")
      .order("created_at", { ascending: false }).limit(40);
    const { data } = employeeId
      ? await q.or(`related_issue_id.eq.${issueId},employee_id.eq.${employeeId}`)
      : await q.eq("related_issue_id", issueId);
    setComms((data ?? []) as CommRow[]);
  }

  function openItem(i: IssueRow) {
    setSelected(i); setNote("");
    loadComms(i.id, i.employee_id);
  }

  async function updateStatus(id: string, next: string) {
    const patch: any = { status: next };
    if (next === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("payroll_issues").update(patch).eq("id", id);
    if (error) { toast.error("Could not update status"); return; }
    toast.success(`Marked ${STATUS_LABEL[next] || next}`);
    setIssues(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, ...patch } : s);
  }

  async function addNote() {
    if (!selected || !note.trim()) return;
    const { data, error } = await supabase.from("payroll_communications").insert({
      employee_id: selected.employee_id, related_issue_id: selected.id,
      channel: "note", direction: "internal", category: "note",
      subject: `Note on: ${selected.title}`, body: note.trim(), status: "logged",
    } as any).select().single();
    if (error) { toast.error("Could not add note"); return; }
    setComms(c => [data as CommRow, ...c]);
    setNote(""); toast.success("Note added");
  }

  // Summary counts
  const counts = useMemo(() => {
    const open = issues.filter(i => i.status !== "resolved" && i.status !== "cancelled");
    return {
      total: open.length,
      dueToday: open.filter(i => i.due_date === today()).length,
      overdue: open.filter(isOverdue).length,
      escalated: issues.filter(i => i.status === "escalated").length,
      blocked: issues.filter(i => i.status === "open" && i.priority === "urgent").length,
      resolvedRecent: issues.filter(i => i.status === "resolved").length,
      missingTime: open.filter(i => i.category === "missing_time").length,
      adjustments: open.filter(i => i.category === "adjustment").length,
      ptoReview: open.filter(i => i.category === "pto_review").length,
      employeeQ: open.filter(i => i.category === "employee_question").length,
      benefits: open.filter(i => i.category === "benefits").length,
    };
  }, [issues]);

  // Apply view + filters
  const filtered = useMemo(() => {
    let rows = issues;
    if (view === "all") rows = rows.filter(i => i.status !== "resolved" && i.status !== "cancelled");
    else if (view === "today") rows = rows.filter(i => i.due_date === today() && i.status !== "resolved");
    else if (view === "overdue") rows = rows.filter(isOverdue);
    else if (view === "blocked") rows = rows.filter(i => i.priority === "urgent" && i.status !== "resolved");
    else if (view === "waiting_employee") rows = rows.filter(i => i.owner_role === "Employee" || i.category === "employee_question");
    else if (view === "missing_time") rows = rows.filter(i => i.category === "missing_time");
    else if (view === "adjustments") rows = rows.filter(i => i.category === "adjustment");
    else if (view === "nj") rows = rows.filter(i => {
      const e = i.employee_id ? emps[i.employee_id] : null; return e?.state === "NJ";
    });
    else if (view === "escalated") rows = rows.filter(i => i.status === "escalated");
    else if (view === "resolved") rows = rows.filter(i => i.status === "resolved");

    if (status !== "all") rows = rows.filter(i => i.status === status);
    if (priority !== "all") rows = rows.filter(i => i.priority === priority);
    if (category !== "all") rows = rows.filter(i => i.category === category);
    if (state !== "all") rows = rows.filter(i => {
      const e = i.employee_id ? emps[i.employee_id] : null; return e?.state === state;
    });
    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter(i => {
        const e = i.employee_id ? emps[i.employee_id] : null;
        return (
          i.title.toLowerCase().includes(needle) ||
          (i.description ?? "").toLowerCase().includes(needle) ||
          (e ? fullName(e).toLowerCase().includes(needle) : false)
        );
      });
    }
    // Sort: priority then due date asc
    const pOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...rows].sort((a, b) => {
      const pa = pOrder[a.priority] ?? 9, pb = pOrder[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.due_date || "9999").localeCompare(b.due_date || "9999");
    });
  }, [issues, emps, view, status, priority, category, state, q]);

  const states = useMemo(() => {
    const s = new Set<string>();
    Object.values(emps).forEach(e => e.state && s.add(e.state));
    return ["all", ...Array.from(s).sort()];
  }, [emps]);

  const escalations = useMemo(
    () => issues.filter(i => i.status === "escalated" || (isOverdue(i) && i.priority === "urgent")).slice(0, 6),
    [issues],
  );

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          icon={KanbanSquare}
          title="Payroll Queue"
          subtitle="Track every payroll task, blocker, follow-up, and issue in one calm operating queue."
        >
          <HeaderBtn icon={Sparkles} to="/ai/assistant?q=Summarize today's payroll queue">Operational Insights</HeaderBtn>
          <HeaderBtn icon={Plus} primary to="/payroll/issues">Log issue</HeaderBtn>
        </PageHeader>

        {/* Inline status indicators */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <StatChip label="Open" value={counts.total} />
          <StatChip label="Due today" value={counts.dueToday} tone={counts.dueToday ? "warn" : "muted"} />
          <StatChip label="Overdue" value={counts.overdue} tone={counts.overdue ? "crit" : "muted"} />
          <StatChip label="Escalated" value={counts.escalated} tone={counts.escalated ? "crit" : "muted"} />
          <StatChip label="Resolved" value={counts.resolvedRecent} tone="ok" />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SumCard icon={Clock} label="Missing time" value={counts.missingTime} hint="Employees need time reviewed" onClick={() => { setView("missing_time"); setCategory("all"); }} />
          <SumCard icon={Wallet} label="Adjustments" value={counts.adjustments} hint="Corrections & retro pay" onClick={() => { setView("adjustments"); }} />
          <SumCard icon={HeartHandshake} label="PTO review" value={counts.ptoReview} hint="Awaiting confirmation" onClick={() => { setView("all"); setCategory("pto_review"); }} />
          <SumCard icon={MessageSquare} label="Employee Qs" value={counts.employeeQ} hint="Awaiting follow-up" onClick={() => { setView("all"); setCategory("employee_question"); }} />
          <SumCard icon={Briefcase} label="Benefits" value={counts.benefits} hint="Deduction & enrollment" onClick={() => { setView("all"); setCategory("benefits"); }} />
          <SumCard icon={Flame} label="Escalated" value={counts.escalated} hint="Needs leadership help" tone="crit" onClick={() => setView("escalated")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main column */}
          <div className="min-w-0">
            {/* View tabs */}
            <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
              {VIEW_TABS.map(t => (
                <button key={t.id} onClick={() => setView(t.id)}
                  className={cn("shrink-0 h-8 px-3 rounded-full text-[12px] border transition",
                    view === t.id
                      ? "bg-foreground text-background border-transparent"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filter bar */}
            <Card className="p-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search employee, title, note…"
                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/60 border border-border/70 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <FilterSel value={status} onChange={setStatus} opts={STATUS_OPTS} labels={STATUS_LABEL} label="Status" />
                <FilterSel value={priority} onChange={setPriority} opts={PRIORITY_OPTS} label="Priority" />
                <FilterSel value={category} onChange={setCategory} opts={CATEGORY_OPTS} labels={CATEGORY_LABEL} label="Type" />
                <FilterSel value={state} onChange={setState} opts={states} label="State" />
                {(q || status !== "all" || priority !== "all" || category !== "all" || state !== "all") && (
                  <button onClick={() => { setQ(""); setStatus("all"); setPriority("all"); setCategory("all"); setState("all"); }}
                    className="h-9 px-2.5 rounded-xl text-[12px] text-muted-foreground hover:bg-muted inline-flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
            </Card>

            {/* List */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">{filtered.length} item{filtered.length === 1 ? "" : "s"}</p>
                <span className="text-[11px] text-muted-foreground">Sorted by priority · due date</span>
              </div>
              {loading ? (
                <div className="divide-y divide-border/60">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-4 py-4 animate-pulse">
                      <div className="h-3 w-40 bg-muted rounded mb-2" />
                      <div className="h-3 w-72 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <Empty icon={Inbox} title="No payroll items" hint="Nothing matches the current filters. Try clearing or switching view." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(i => {
                    const e = i.employee_id ? emps[i.employee_id] : null;
                    const overdue = isOverdue(i);
                    return (
                      <li key={i.id}>
                        <button onClick={() => openItem(i)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-start gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground">
                            {e ? `${(e.preferred_name || e.first_name || "?")[0]}${(e.last_name || "")[0]}`.toUpperCase() : "—"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium tracking-tight truncate">{i.title}</span>
                              <Pill tone={PRIORITY_TONE[i.priority]}>{i.priority}</Pill>
                              <Pill tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status] || i.status}</Pill>
                              {overdue && <Pill tone="crit">Overdue</Pill>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{e ? fullName(e) : "Unassigned"}{e?.job_title ? ` · ${e.job_title}` : ""}</span>
                              {e?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              <span>{CATEGORY_LABEL[i.category] ?? i.category}</span>
                              {i.owner_role && <span>Owner: {i.owner_role}</span>}
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(i.due_date)}</span>
                              {i.source && <span>· {i.source}</span>}
                              <span>· {relTime(i.updated_at)}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-3.5 w-3.5 text-destructive" />
                <h3 className="text-[13px] font-medium tracking-tight">Escalations</h3>
              </div>
              {escalations.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No escalations. Calm cycle.</p>
              ) : (
                <ul className="space-y-2">
                  {escalations.map(i => {
                    const e = i.employee_id ? emps[i.employee_id] : null;
                    return (
                      <li key={i.id}>
                        <button onClick={() => openItem(i)} className="w-full text-left rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 hover:bg-destructive/10 transition">
                          <p className="text-[12.5px] font-medium tracking-tight truncate">{i.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{e ? fullName(e) : "Unassigned"} · {CATEGORY_LABEL[i.category]}</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-[13px] font-medium tracking-tight mb-3">Quick actions</h3>
              <div className="space-y-1">
                <RailLink icon={Plus} to="/payroll/issues">Log payroll issue</RailLink>
                <RailLink icon={Wallet} to="/payroll/adjustments">Add adjustment</RailLink>
                <RailLink icon={Clock} to="/payroll/time-attendance">Request missing time</RailLink>
                <RailLink icon={HeartHandshake} to="/payroll/pto">Add PTO follow-up</RailLink>
                <RailLink icon={Briefcase} to="/payroll/benefits">Add benefits follow-up</RailLink>
                <RailLink icon={Send} to="/payroll/messages">Send payroll reminder</RailLink>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[13px] font-medium tracking-tight">Operational Insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "What payroll items are overdue?",
                  "What could block this payroll cycle?",
                  "Which employees are waiting on follow-up?",
                  "Summarize today's payroll queue",
                  "Show unresolved NJ payroll items",
                ].map(p => (
                  <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                    className="block text-[12px] text-muted-foreground hover:text-foreground rounded-lg px-2 py-1.5 hover:bg-muted transition">
                    “{p}”
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          {selected && (() => {
            const e = selected.employee_id ? emps[selected.employee_id] : null;
            const overdue = isOverdue(selected);
            return (
              <div>
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill tone={PRIORITY_TONE[selected.priority]}>{selected.priority}</Pill>
                    <Pill tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status] || selected.status}</Pill>
                    {overdue && <Pill tone="crit">Overdue</Pill>}
                  </div>
                  <SheetTitle className="text-lg font-semibold tracking-tight">{selected.title}</SheetTitle>
                  {selected.description && <p className="text-[13px] text-muted-foreground mt-1">{selected.description}</p>}
                </SheetHeader>

                {/* Employee summary */}
                <div className="px-6 py-4 border-b border-border/70">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Employee</p>
                  {e ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center text-[12px] font-medium">
                        {`${(e.preferred_name || e.first_name || "?")[0]}${(e.last_name || "")[0]}`.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium tracking-tight truncate">{fullName(e)}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{[e.job_title, e.state].filter(Boolean).join(" · ")}</p>
                      </div>
                      <Link to={`/payroll/profiles?employee=${e.id}`} className="text-[12px] text-primary inline-flex items-center gap-1 hover:underline">
                        Profile <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : <p className="text-[12px] text-muted-foreground">No employee linked.</p>}
                </div>

                {/* Meta grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-3 text-[12px] border-b border-border/70">
                  <Meta label="Type" value={CATEGORY_LABEL[selected.category] ?? selected.category} />
                  <Meta label="Owner" value={selected.owner_role || "—"} />
                  <Meta label="Due" value={fmtDate(selected.due_date)} />
                  <Meta label="Source" value={selected.source || "—"} />
                  <Meta label="Created" value={relTime(selected.created_at)} />
                  <Meta label="Updated" value={relTime(selected.updated_at)} />
                </div>

                {/* Status actions */}
                <div className="px-6 py-4 border-b border-border/70">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Move to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["open", "in_progress", "escalated", "resolved", "cancelled"] as const).map(s => (
                      <button key={s} disabled={selected.status === s}
                        onClick={() => updateStatus(selected.id, s)}
                        className={cn("h-8 px-3 rounded-xl text-[12px] border transition",
                          selected.status === s
                            ? "bg-foreground text-background border-transparent cursor-default"
                            : "bg-card border-border/70 hover:bg-muted")}>
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes & timeline */}
                <div className="px-6 py-4">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Notes & communication</p>
                  <div className="space-y-2 mb-3">
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                      placeholder="Log a note, call summary, or follow-up…"
                      className="w-full rounded-xl bg-muted/60 border border-border/70 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
                    <div className="flex justify-end">
                      <button onClick={addNote} disabled={!note.trim()}
                        className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-[12.5px] disabled:opacity-40">
                        Add note
                      </button>
                    </div>
                  </div>
                  {comms.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground">No notes yet. Everything you log here is recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {comms.map(c => (
                        <li key={c.id} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[11.5px] font-medium tracking-tight">
                              {c.channel === "note" ? "Note" : c.channel} · {c.created_by_name || "Payroll"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{relTime(c.created_at)}</p>
                          </div>
                          {c.subject && <p className="text-[12.5px] font-medium">{c.subject}</p>}
                          {c.body && <p className="text-[12.5px] text-muted-foreground whitespace-pre-wrap">{c.body}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

function StatChip({ label, value, tone = "muted" }: { label: string; value: number; tone?: Tone }) {
  const cls =
    tone === "crit" ? "text-destructive" :
    tone === "warn" ? "text-amber-700 dark:text-amber-400" :
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/70 px-2.5 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", cls)}>{value}</span>
    </span>
  );
}

function SumCard({ icon: Icon, label, value, hint, tone, onClick }: {
  icon: any; label: string; value: number; hint: string; tone?: Tone; onClick?: () => void;
}) {
  const accent =
    tone === "crit" ? "text-destructive" :
    tone === "warn" ? "text-amber-700 dark:text-amber-400" :
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <button onClick={onClick}
      className="text-left rounded-2xl border border-border/70 bg-card p-4 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)] transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={cn("text-2xl font-semibold tracking-tight", accent)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{hint}</p>
    </button>
  );
}

function FilterSel({ value, onChange, opts, labels, label }: {
  value: string; onChange: (v: string) => void; opts: string[]; labels?: Record<string, string>; label: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-9 rounded-xl bg-muted/60 border border-border/70 text-[12.5px] px-2.5 focus:outline-none focus:ring-2 focus:ring-ring">
      {opts.map(o => (
        <option key={o} value={o}>{o === "all" ? `${label}: All` : (labels?.[o] ?? o)}</option>
      ))}
    </select>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[13px] mt-0.5">{value}</p>
    </div>
  );
}

function RailLink({ icon: Icon, to, children }: { icon: any; to: string; children: any }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-[12.5px] hover:bg-muted transition group">
      <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />{children}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}