import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Clock, AlertTriangle, Flame, Search, Plus, X,
  ChevronRight, MessageSquare, CheckCircle2, ArrowUpRight, Sparkles, User,
  MapPin, Calendar, Inbox, Send, Wallet, HeartHandshake, Timer, ShieldAlert,
  CalendarCheck, Activity, BellRing,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OSShell } from "./OSShell";
import { Card, HeaderBtn, PageHeader, Pill, Empty, fullName, fmtDate, type Tone } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------- Types ----------
interface ExceptionRow {
  id: string;
  employee_id: string;
  clinic: string | null;
  kind: string;
  status: string;
  occurred_on: string;
  detail: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
interface IssueRow {
  id: string;
  employee_id: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  owner_role: string | null;
  due_date: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}
interface EmpLite {
  id: string; first_name: string; last_name: string; preferred_name: string | null;
  job_title: string | null; state: string | null; clinic: string | null;
}
interface CommRow {
  id: string; employee_id: string | null; related_issue_id: string | null;
  channel: string; direction: string; category: string;
  subject: string | null; body: string | null; status: string;
  created_at: string; created_by_name: string | null;
}

// ---------- Labels ----------
const KIND_LABEL: Record<string, string> = {
  missed_clock_in: "Missed clock-in",
  missed_clock_out: "Missed clock-out",
  late_arrival: "Late arrival",
  early_departure: "Early departure",
  long_break: "Long break",
  overtime_risk: "Overtime risk",
  manual_edit_pending: "Manual edit pending",
  duplicate_punch: "Duplicate punch",
  outside_clinic: "Outside clinic",
};
const EX_STATUS_LABEL: Record<string, string> = {
  open: "Needs review",
  acknowledged: "In review",
  resolved: "Cleared",
  dismissed: "Dismissed",
};
const EX_STATUS_TONE: Record<string, Tone> = {
  open: "info", acknowledged: "warn", resolved: "ok", dismissed: "muted",
};
const ISSUE_STATUS_LABEL: Record<string, string> = {
  open: "New", in_progress: "In review", escalated: "Escalated",
  resolved: "Cleared", cancelled: "Cancelled",
};
const ISSUE_STATUS_TONE: Record<string, Tone> = {
  open: "info", in_progress: "warn", escalated: "crit", resolved: "ok", cancelled: "muted",
};
const PRIORITY_TONE: Record<string, Tone> = {
  urgent: "crit", high: "warn", normal: "info", low: "muted",
};

const TIME_CATEGORIES = ["missing_time", "attendance_exception", "pto_review", "approval_needed"] as const;

function today() { return new Date().toISOString().slice(0, 10); }
function isOverdueIssue(i: IssueRow) {
  return i.due_date && i.due_date < today() && i.status !== "resolved" && i.status !== "cancelled";
}
function relTime(iso: string) {
  const d = new Date(iso); const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return days < 30 ? `${days}d ago` : fmtDate(iso);
}

// ---------- Unified selection (drawer can show either exception or issue) ----------
type Selected =
  | { kind: "exception"; row: ExceptionRow }
  | { kind: "issue"; row: IssueRow }
  | null;

const VIEW_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All open" },
  { id: "missing", label: "Missing time" },
  { id: "exceptions", label: "Exceptions" },
  { id: "overtime", label: "Overtime" },
  { id: "pto", label: "PTO impact" },
  { id: "follow", label: "Follow-up needed" },
  { id: "overdue", label: "Overdue" },
  { id: "escalated", label: "Escalated" },
  { id: "cleared", label: "Cleared" },
];

export default function OSPayrollTimeAttendance() {
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [emps, setEmps] = useState<Record<string, EmpLite>>({});
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");

  const [selected, setSelected] = useState<Selected>(null);
  const [comms, setComms] = useState<CommRow[]>([]);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const [exRes, isRes] = await Promise.all([
      supabase.from("attendance_exceptions").select("*").order("occurred_on", { ascending: false }).limit(300),
      supabase.from("payroll_issues").select("*")
        .in("category", TIME_CATEGORIES)
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true, nullsFirst: false }).limit(300),
    ]);
    const exRows = (exRes.data ?? []) as ExceptionRow[];
    const isRows = (isRes.data ?? []) as IssueRow[];
    setExceptions(exRows);
    setIssues(isRows);

    const ids = Array.from(new Set([
      ...exRows.map(r => r.employee_id),
      ...isRows.map(r => r.employee_id).filter(Boolean) as string[],
    ]));
    if (ids.length) {
      const { data: ep } = await supabase.from("employees")
        .select("id,first_name,last_name,preferred_name,job_title,state,clinic").in("id", ids);
      const map: Record<string, EmpLite> = {};
      (ep ?? []).forEach((e: any) => { map[e.id] = e; });
      setEmps(map);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // ---------- Combined operational items ----------
  type Item =
    | { type: "exception"; row: ExceptionRow; sortDate: string; emp: EmpLite | null }
    | { type: "issue"; row: IssueRow; sortDate: string; emp: EmpLite | null };

  const items: Item[] = useMemo(() => {
    const a: Item[] = exceptions.map(r => ({
      type: "exception", row: r, sortDate: r.occurred_on,
      emp: emps[r.employee_id] ?? null,
    }));
    const b: Item[] = issues.map(r => ({
      type: "issue", row: r, sortDate: r.due_date ?? r.created_at.slice(0, 10),
      emp: r.employee_id ? (emps[r.employee_id] ?? null) : null,
    }));
    return [...a, ...b];
  }, [exceptions, issues, emps]);

  // ---------- Summary counts ----------
  const counts = useMemo(() => {
    const openEx = exceptions.filter(e => e.status === "open" || e.status === "acknowledged");
    const openIs = issues.filter(i => i.status !== "resolved" && i.status !== "cancelled");
    return {
      missing: openEx.filter(e => e.kind === "missed_clock_in" || e.kind === "missed_clock_out").length
             + openIs.filter(i => i.category === "missing_time").length,
      incomplete: openEx.filter(e => e.kind === "manual_edit_pending" || e.kind === "duplicate_punch").length,
      exceptions: openEx.filter(e =>
        ["late_arrival", "early_departure", "long_break", "overtime_risk", "outside_clinic", "duplicate_punch"].includes(e.kind),
      ).length,
      overtime: openEx.filter(e => e.kind === "overtime_risk").length,
      pto: openIs.filter(i => i.category === "pto_review").length,
      followUp: openIs.filter(i =>
        i.owner_role === "Manager" || i.owner_role === "Employee" || i.category === "approval_needed",
      ).length,
      ready: exceptions.filter(e => e.status === "resolved").length
           + issues.filter(i => i.status === "resolved").length,
      escalated: openIs.filter(i => i.status === "escalated").length,
      overdue: openIs.filter(isOverdueIssue).length,
      totalOpen: openEx.length + openIs.length,
    };
  }, [exceptions, issues]);

  // ---------- Payroll cycle readiness ----------
  const readiness = useMemo(() => {
    const total = counts.totalOpen + counts.ready;
    const pct = total === 0 ? 100 : Math.round((counts.ready / total) * 100);
    let label: string, tone: Tone;
    if (counts.escalated > 0 || counts.overdue > 2) { label = "Blocked"; tone = "crit"; }
    else if (counts.overdue > 0 || counts.totalOpen > 10) { label = "At risk"; tone = "warn"; }
    else if (counts.totalOpen > 0) { label = "Needs review"; tone = "info"; }
    else { label = "Ready"; tone = "ok"; }
    return { pct, label, tone };
  }, [counts]);

  // ---------- States for filter ----------
  const states = useMemo(() => {
    const s = new Set<string>();
    Object.values(emps).forEach(e => e.state && s.add(e.state));
    return ["all", ...Array.from(s).sort()];
  }, [emps]);

  // ---------- Filter / view logic ----------
  const filtered = useMemo(() => {
    let rows = items;

    // View tabs
    if (view === "all") {
      rows = rows.filter(it => it.type === "exception"
        ? (it.row.status === "open" || it.row.status === "acknowledged")
        : (it.row.status !== "resolved" && it.row.status !== "cancelled"));
    } else if (view === "missing") {
      rows = rows.filter(it => it.type === "exception"
        ? (it.row.kind === "missed_clock_in" || it.row.kind === "missed_clock_out")
        : it.row.category === "missing_time");
    } else if (view === "exceptions") {
      rows = rows.filter(it => it.type === "exception" &&
        ["late_arrival", "early_departure", "long_break", "outside_clinic", "duplicate_punch", "manual_edit_pending"].includes(it.row.kind));
    } else if (view === "overtime") {
      rows = rows.filter(it => it.type === "exception" && it.row.kind === "overtime_risk");
    } else if (view === "pto") {
      rows = rows.filter(it => it.type === "issue" && it.row.category === "pto_review");
    } else if (view === "follow") {
      rows = rows.filter(it => it.type === "issue" &&
        (it.row.owner_role === "Manager" || it.row.owner_role === "Employee" || it.row.category === "approval_needed"));
    } else if (view === "overdue") {
      rows = rows.filter(it => it.type === "issue" && isOverdueIssue(it.row));
    } else if (view === "escalated") {
      rows = rows.filter(it => it.type === "issue" && it.row.status === "escalated");
    } else if (view === "cleared") {
      rows = rows.filter(it => it.type === "exception"
        ? it.row.status === "resolved"
        : it.row.status === "resolved");
    }

    if (stateFilter !== "all") rows = rows.filter(it => it.emp?.state === stateFilter);
    if (kindFilter !== "all") {
      rows = rows.filter(it => it.type === "exception" ? it.row.kind === kindFilter : false);
    }
    if (q.trim()) {
      const n = q.toLowerCase();
      rows = rows.filter(it => {
        const title = it.type === "exception" ? KIND_LABEL[it.row.kind] : it.row.title;
        const detail = it.type === "exception" ? (it.row.detail ?? "") : (it.row.description ?? "");
        return title.toLowerCase().includes(n)
          || detail.toLowerCase().includes(n)
          || (it.emp ? fullName(it.emp).toLowerCase().includes(n) : false);
      });
    }

    return [...rows].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  }, [items, view, q, stateFilter, kindFilter]);

  // ---------- Drawer / notes ----------
  async function openExc(row: ExceptionRow) {
    setSelected({ kind: "exception", row }); setNote("");
    const { data } = await supabase.from("payroll_communications").select("*")
      .eq("employee_id", row.employee_id).order("created_at", { ascending: false }).limit(20);
    setComms((data ?? []) as CommRow[]);
  }
  async function openIssue(row: IssueRow) {
    setSelected({ kind: "issue", row }); setNote("");
    const qy = supabase.from("payroll_communications").select("*").order("created_at", { ascending: false }).limit(20);
    const { data } = row.employee_id
      ? await qy.or(`related_issue_id.eq.${row.id},employee_id.eq.${row.employee_id}`)
      : await qy.eq("related_issue_id", row.id);
    setComms((data ?? []) as CommRow[]);
  }

  async function updateExcStatus(id: string, next: string) {
    const patch: any = { status: next };
    if (next === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("attendance_exceptions").update(patch).eq("id", id);
    if (error) { toast.error("Could not update"); return; }
    setExceptions(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    if (selected?.kind === "exception" && selected.row.id === id) {
      setSelected({ kind: "exception", row: { ...selected.row, ...patch } });
    }
    toast.success(EX_STATUS_LABEL[next] || next);
  }
  async function updateIssueStatus(id: string, next: string) {
    const patch: any = { status: next };
    if (next === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("payroll_issues").update(patch).eq("id", id);
    if (error) { toast.error("Could not update"); return; }
    setIssues(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    if (selected?.kind === "issue" && selected.row.id === id) {
      setSelected({ kind: "issue", row: { ...selected.row, ...patch } });
    }
    toast.success(ISSUE_STATUS_LABEL[next] || next);
  }

  async function addNote() {
    if (!selected || !note.trim()) return;
    const empId = selected.kind === "issue" ? selected.row.employee_id : selected.row.employee_id;
    const subject = selected.kind === "issue"
      ? `Note on: ${selected.row.title}`
      : `Note on: ${KIND_LABEL[selected.row.kind]} (${fmtDate(selected.row.occurred_on)})`;
    const payload: any = {
      employee_id: empId, channel: "note", direction: "internal", category: "note",
      subject, body: note.trim(), status: "logged",
    };
    if (selected.kind === "issue") payload.related_issue_id = selected.row.id;
    const { data, error } = await supabase.from("payroll_communications").insert(payload).select().single();
    if (error) { toast.error("Could not add note"); return; }
    setComms(c => [data as CommRow, ...c]);
    setNote(""); toast.success("Note added");
  }

  // ---------- Escalations rail ----------
  const escalations = useMemo(() => {
    const ex = exceptions.filter(e => e.status === "open" &&
      (e.kind === "missed_clock_in" || e.kind === "missed_clock_out" || e.kind === "duplicate_punch"))
      .slice(0, 3);
    const iss = issues.filter(i => i.status === "escalated" || (isOverdueIssue(i) && i.priority === "urgent")).slice(0, 4);
    return { ex, iss };
  }, [exceptions, issues]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          icon={CalendarDays}
          title="Time & Attendance"
          subtitle="Review missing hours, attendance issues, and payroll-impacting time records before payroll closes."
        >
          <HeaderBtn icon={Sparkles} to="/ai/assistant?q=Summarize time and attendance issues for this payroll cycle">Operational Insights</HeaderBtn>
          <HeaderBtn icon={Plus} primary to="/payroll/queue">Log issue</HeaderBtn>
        </PageHeader>

        {/* Inline status chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px]">
          <StatChip label="Open" value={counts.totalOpen} />
          <StatChip label="Missing time" value={counts.missing} tone={counts.missing ? "warn" : "muted"} />
          <StatChip label="Exceptions" value={counts.exceptions} tone={counts.exceptions ? "warn" : "muted"} />
          <StatChip label="PTO conflicts" value={counts.pto} tone={counts.pto ? "info" : "muted"} />
          <StatChip label="Overdue" value={counts.overdue} tone={counts.overdue ? "crit" : "muted"} />
          <StatChip label="Ready for payroll" value={counts.ready} tone="ok" />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SumCard icon={Clock} label="Missing time" value={counts.missing} hint="Hours need review before close" onClick={() => setView("missing")} />
          <SumCard icon={Timer} label="Incomplete records" value={counts.incomplete} hint="Pending edits & duplicates" onClick={() => setView("exceptions")} />
          <SumCard icon={Activity} label="Attendance exceptions" value={counts.exceptions} hint="Late, early, overtime, etc." onClick={() => setView("exceptions")} />
          <SumCard icon={HeartHandshake} label="PTO conflicts" value={counts.pto} hint="Overlap with recorded time" onClick={() => setView("pto")} />
          <SumCard icon={MessageSquare} label="Follow-up needed" value={counts.followUp} hint="Waiting on employee or manager" onClick={() => setView("follow")} />
          <SumCard icon={CheckCircle2} label="Ready for payroll" value={counts.ready} hint="Cleared this cycle" tone="ok" onClick={() => setView("cleared")} />
        </div>

        {/* Payroll cycle readiness */}
        <Card className="p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Payroll cycle readiness</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-semibold tracking-tight">{readiness.pct}%</p>
                <Pill tone={readiness.tone}>{readiness.label}</Pill>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all",
                    readiness.tone === "crit" ? "bg-destructive" :
                    readiness.tone === "warn" ? "bg-amber-500" :
                    readiness.tone === "ok" ? "bg-emerald-500" : "bg-primary")}
                  style={{ width: `${readiness.pct}%` }}
                />
              </div>
            </div>
            <ReadinessStat label="Reviewed" value={counts.ready} />
            <ReadinessStat label="Open items" value={counts.totalOpen} />
            <ReadinessStat label="Overdue" value={counts.overdue} tone={counts.overdue ? "crit" : "muted"} />
            <ReadinessStat label="Escalated" value={counts.escalated} tone={counts.escalated ? "crit" : "muted"} />
          </div>
        </Card>

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

            {/* Filters */}
            <Card className="p-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search employee, issue, note…"
                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/60 border border-border/70 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <FilterSel value={kindFilter} onChange={setKindFilter} opts={["all", ...Object.keys(KIND_LABEL)]} labels={KIND_LABEL} label="Type" />
                <FilterSel value={stateFilter} onChange={setStateFilter} opts={states} label="State" />
                {(q || stateFilter !== "all" || kindFilter !== "all") && (
                  <button onClick={() => { setQ(""); setStateFilter("all"); setKindFilter("all"); }}
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
                <span className="text-[11px] text-muted-foreground">Sorted by date</span>
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
                <Empty icon={Inbox} title="No time or attendance items" hint="Nothing matches the current filters. Try clearing or switching view." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(it => it.type === "exception" ? (
                    <ExceptionListRow key={`e-${it.row.id}`} row={it.row} emp={it.emp} onOpen={() => openExc(it.row)} />
                  ) : (
                    <IssueListRow key={`i-${it.row.id}`} row={it.row} emp={it.emp} onOpen={() => openIssue(it.row)} />
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            {/* Escalations */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-3.5 w-3.5 text-destructive" />
                <h3 className="text-[13px] font-medium tracking-tight">Attendance escalations</h3>
              </div>
              {escalations.ex.length === 0 && escalations.iss.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No escalations. Calm cycle.</p>
              ) : (
                <ul className="space-y-2">
                  {escalations.iss.map(i => {
                    const e = i.employee_id ? emps[i.employee_id] : null;
                    return (
                      <li key={`ei-${i.id}`}>
                        <button onClick={() => openIssue(i)} className="w-full text-left rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 hover:bg-destructive/10 transition">
                          <p className="text-[12.5px] font-medium tracking-tight truncate">{i.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{e ? fullName(e) : "Unassigned"} · due {fmtDate(i.due_date)}</p>
                        </button>
                      </li>
                    );
                  })}
                  {escalations.ex.map(e => {
                    const emp = emps[e.employee_id];
                    return (
                      <li key={`ex-${e.id}`}>
                        <button onClick={() => openExc(e)} className="w-full text-left rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 hover:bg-amber-500/10 transition">
                          <p className="text-[12.5px] font-medium tracking-tight truncate">{KIND_LABEL[e.kind]}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{emp ? fullName(emp) : "—"} · {fmtDate(e.occurred_on)}</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Quick actions */}
            <Card className="p-4">
              <h3 className="text-[13px] font-medium tracking-tight mb-3">Quick actions</h3>
              <div className="space-y-1">
                <RailLink icon={Clock} to="/payroll/queue">Request missing time</RailLink>
                <RailLink icon={AlertTriangle} to="/payroll/queue">Log attendance issue</RailLink>
                <RailLink icon={Wallet} to="/payroll/adjustments">Create payroll adjustment</RailLink>
                <RailLink icon={BellRing} to="/payroll/messages">Send weekly reminder</RailLink>
                <RailLink icon={HeartHandshake} to="/payroll/pto">Review PTO impact</RailLink>
                <RailLink icon={CalendarCheck} to="/payroll/queue">Open payroll queue</RailLink>
              </div>
            </Card>

            {/* Operational Insights */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[13px] font-medium tracking-tight">Operational Insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "Who is missing time this payroll cycle?",
                  "What attendance issues are overdue?",
                  "What could block payroll from closing?",
                  "Which employees have repeated attendance problems?",
                  "Summarize attendance issues by state",
                  "What should I resolve first today?",
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
            const emp = selected.kind === "issue"
              ? (selected.row.employee_id ? emps[selected.row.employee_id] : null)
              : emps[selected.row.employee_id];

            const title = selected.kind === "issue"
              ? selected.row.title
              : KIND_LABEL[selected.row.kind];
            const detail = selected.kind === "issue"
              ? selected.row.description
              : selected.row.detail;

            return (
              <div>
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
                  <div className="flex items-center gap-2 mb-2">
                    {selected.kind === "issue" ? (
                      <>
                        <Pill tone={PRIORITY_TONE[selected.row.priority]}>{selected.row.priority}</Pill>
                        <Pill tone={ISSUE_STATUS_TONE[selected.row.status]}>{ISSUE_STATUS_LABEL[selected.row.status]}</Pill>
                        {isOverdueIssue(selected.row) && <Pill tone="crit">Overdue</Pill>}
                      </>
                    ) : (
                      <>
                        <Pill tone="info">Attendance exception</Pill>
                        <Pill tone={EX_STATUS_TONE[selected.row.status]}>{EX_STATUS_LABEL[selected.row.status]}</Pill>
                      </>
                    )}
                  </div>
                  <SheetTitle className="text-lg font-semibold tracking-tight">{title}</SheetTitle>
                  {detail && <p className="text-[13px] text-muted-foreground mt-1">{detail}</p>}
                </SheetHeader>

                {/* Employee summary */}
                <div className="px-6 py-4 border-b border-border/70">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Employee</p>
                  {emp ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center text-[12px] font-medium">
                        {`${(emp.preferred_name || emp.first_name || "?")[0]}${(emp.last_name || "")[0]}`.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium tracking-tight truncate">{fullName(emp)}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{[emp.job_title, emp.state, emp.clinic].filter(Boolean).join(" · ")}</p>
                      </div>
                      <Link to={`/payroll/profiles?employee=${emp.id}`} className="text-[12px] text-primary inline-flex items-center gap-1 hover:underline">
                        Profile <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : <p className="text-[12px] text-muted-foreground">No employee linked.</p>}
                </div>

                {/* Meta grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-3 text-[12px] border-b border-border/70">
                  {selected.kind === "exception" ? (
                    <>
                      <Meta label="Issue type" value={KIND_LABEL[selected.row.kind]} />
                      <Meta label="Date" value={fmtDate(selected.row.occurred_on)} />
                      <Meta label="Clinic" value={selected.row.clinic || "—"} />
                      <Meta label="Source" value="Time clock · CR" />
                      <Meta label="Logged" value={relTime(selected.row.created_at)} />
                      <Meta label="Updated" value={relTime(selected.row.updated_at)} />
                    </>
                  ) : (
                    <>
                      <Meta label="Type" value={selected.row.category.replace("_", " ")} />
                      <Meta label="Owner" value={selected.row.owner_role || "—"} />
                      <Meta label="Due" value={fmtDate(selected.row.due_date)} />
                      <Meta label="Source" value={selected.row.source || "—"} />
                      <Meta label="Created" value={relTime(selected.row.created_at)} />
                      <Meta label="Updated" value={relTime(selected.row.updated_at)} />
                    </>
                  )}
                </div>

                {/* Resolution checklist */}
                <div className="px-6 py-4 border-b border-border/70">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Resolution checklist</p>
                  <ul className="space-y-1.5 text-[12.5px]">
                    <ChecklistItem text="Missing info collected" />
                    <ChecklistItem text="Employee contacted" />
                    <ChecklistItem text="Manager confirmed" />
                    <ChecklistItem text="Correction submitted" />
                    <ChecklistItem text="Cleared for payroll" />
                  </ul>
                </div>

                {/* Status actions */}
                <div className="px-6 py-4 border-b border-border/70">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Move to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.kind === "exception"
                      ? (["open", "acknowledged", "resolved", "dismissed"] as const).map(s => (
                          <StatusBtn key={s} active={selected.row.status === s} onClick={() => updateExcStatus(selected.row.id, s)}>
                            {EX_STATUS_LABEL[s]}
                          </StatusBtn>
                        ))
                      : (["open", "in_progress", "escalated", "resolved", "cancelled"] as const).map(s => (
                          <StatusBtn key={s} active={selected.row.status === s} onClick={() => updateIssueStatus(selected.row.id, s)}>
                            {ISSUE_STATUS_LABEL[s]}
                          </StatusBtn>
                        ))
                    }
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Link to="/payroll/adjustments" className="h-8 px-3 rounded-xl text-[12px] border border-border/70 bg-card hover:bg-muted inline-flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> Create adjustment
                    </Link>
                    <Link to="/payroll/queue" className="h-8 px-3 rounded-xl text-[12px] border border-border/70 bg-card hover:bg-muted inline-flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Open in queue
                    </Link>
                  </div>
                </div>

                {/* Notes & communication */}
                <div className="px-6 py-4">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Notes & communication</p>
                  <div className="space-y-2 mb-3">
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                      placeholder="Log who you contacted, what was discussed, decisions, and next step…"
                      className="w-full rounded-xl bg-muted/60 border border-border/70 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
                    <div className="flex justify-end gap-2">
                      <Link to="/payroll/messages" className="h-9 px-3 rounded-xl border border-border/70 bg-card text-[12.5px] inline-flex items-center gap-1 hover:bg-muted">
                        <Send className="h-3 w-3" /> Send follow-up
                      </Link>
                      <button onClick={addNote} disabled={!note.trim()}
                        className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-[12.5px] disabled:opacity-40">
                        Add note
                      </button>
                    </div>
                  </div>
                  {comms.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground">No communication logged yet. Everything you record here is timestamped.</p>
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

// ---------- Subcomponents ----------
function ExceptionListRow({ row, emp, onOpen }: { row: ExceptionRow; emp: EmpLite | null; onOpen: () => void }) {
  return (
    <li>
      <button onClick={onOpen} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground">
          {emp ? `${(emp.preferred_name || emp.first_name || "?")[0]}${(emp.last_name || "")[0]}`.toUpperCase() : "—"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[14px] font-medium tracking-tight truncate">{KIND_LABEL[row.kind]}</span>
            <Pill tone={EX_STATUS_TONE[row.status]}>{EX_STATUS_LABEL[row.status]}</Pill>
            <Pill tone="muted">Attendance</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{emp ? fullName(emp) : "—"}{emp?.job_title ? ` · ${emp.job_title}` : ""}</span>
            {emp?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{emp.state}</span>}
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(row.occurred_on)}</span>
            {row.clinic && <span>· {row.clinic}</span>}
            {row.detail && <span className="truncate">· {row.detail}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
      </button>
    </li>
  );
}

function IssueListRow({ row, emp, onOpen }: { row: IssueRow; emp: EmpLite | null; onOpen: () => void }) {
  const overdue = isOverdueIssue(row);
  return (
    <li>
      <button onClick={onOpen} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground">
          {emp ? `${(emp.preferred_name || emp.first_name || "?")[0]}${(emp.last_name || "")[0]}`.toUpperCase() : "—"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[14px] font-medium tracking-tight truncate">{row.title}</span>
            <Pill tone={PRIORITY_TONE[row.priority]}>{row.priority}</Pill>
            <Pill tone={ISSUE_STATUS_TONE[row.status]}>{ISSUE_STATUS_LABEL[row.status]}</Pill>
            {overdue && <Pill tone="crit">Overdue</Pill>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{emp ? fullName(emp) : "Unassigned"}{emp?.job_title ? ` · ${emp.job_title}` : ""}</span>
            {emp?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{emp.state}</span>}
            <span className="capitalize">{row.category.replace("_", " ")}</span>
            {row.owner_role && <span>Owner: {row.owner_role}</span>}
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(row.due_date)}</span>
            <span>· {relTime(row.updated_at)}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
      </button>
    </li>
  );
}

function StatChip({ label, value, tone = "muted" }: { label: string; value: number; tone?: Tone }) {
  const cls =
    tone === "crit" ? "text-destructive" :
    tone === "warn" ? "text-amber-700 dark:text-amber-400" :
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400" :
    tone === "info" ? "text-blue-700 dark:text-blue-400" : "text-foreground";
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

function ReadinessStat({ label, value, tone = "muted" }: { label: string; value: number; tone?: Tone }) {
  const cls =
    tone === "crit" ? "text-destructive" :
    tone === "warn" ? "text-amber-700 dark:text-amber-400" :
    tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <div className="min-w-[88px]">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold tracking-tight mt-0.5", cls)}>{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[13px] mt-0.5 capitalize">{value}</p>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">
      <span className="h-4 w-4 rounded-md border border-border/70 inline-flex items-center justify-center" />
      {text}
    </li>
  );
}

function StatusBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: any }) {
  return (
    <button disabled={active} onClick={onClick}
      className={cn("h-8 px-3 rounded-xl text-[12px] border transition",
        active ? "bg-foreground text-background border-transparent cursor-default"
               : "bg-card border-border/70 hover:bg-muted")}>
      {children}
    </button>
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