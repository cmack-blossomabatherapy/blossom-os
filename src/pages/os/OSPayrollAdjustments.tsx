import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, Plus, Search, X, ChevronRight, Sparkles, User, MapPin, Calendar,
  Inbox, Receipt, Clock, ArrowDownUp, Flame, CheckCircle2, AlertTriangle,
  Briefcase, Send, FileText, ArrowUpRight, ShieldCheck, Banknote,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, HeaderBtn, PageHeader, Pill, Empty, fullName, fmtDate, fmtMoney, type Tone } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdjRow {
  id: string;
  employee_id: string;
  payroll_run_id: string | null;
  adjustment_type: string;
  amount: number | string;
  hours: number | string;
  reason: string | null;
  status: string;
  requested_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
interface EmpLite {
  id: string; first_name: string; last_name: string; preferred_name: string | null;
  job_title: string | null; state: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  bonus: "Bonus / Stipend",
  correction: "Correction",
  retro: "Retro Pay",
  reimbursement: "Reimbursement",
  deduction: "Deduction Change",
  other: "Other",
};
const TYPE_ICON: Record<string, any> = {
  bonus: Banknote, correction: ArrowDownUp, retro: Clock,
  reimbursement: Receipt, deduction: Briefcase, other: FileText,
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  applied: "Processed",
  rejected: "Rejected",
};
const STATUS_TONE: Record<string, Tone> = {
  pending: "warn", approved: "info", applied: "ok", rejected: "crit",
};

function today() { return new Date().toISOString().slice(0, 10); }
function relTime(iso: string) {
  const d = new Date(iso); const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return days < 30 ? `${days}d ago` : fmtDate(iso);
}
function ageDays(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

const VIEW_TABS = [
  { id: "all", label: "All open" },
  { id: "approval", label: "Awaiting approval" },
  { id: "reimbursements", label: "Reimbursements" },
  { id: "attendance", label: "Attendance corrections" },
  { id: "retro", label: "Retro pay" },
  { id: "deductions", label: "Deductions" },
  { id: "bonuses", label: "Bonuses" },
  { id: "overdue", label: "Overdue" },
  { id: "rejected", label: "Rejected" },
  { id: "processed", label: "Processed" },
];

export default function OSPayrollAdjustments() {
  const [rows, setRows] = useState<AdjRow[]>([]);
  const [emps, setEmps] = useState<Record<string, EmpLite>>({});
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [state, setState] = useState("all");

  const [selected, setSelected] = useState<AdjRow | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("payroll_adjustments").select("*")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false }).limit(500);
    const arr = (data ?? []) as AdjRow[];
    setRows(arr);
    const ids = Array.from(new Set(arr.map(r => r.employee_id).filter(Boolean)));
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

  async function patchRow(id: string, patch: Partial<AdjRow>) {
    const { error } = await supabase.from("payroll_adjustments").update(patch as any).eq("id", id);
    if (error) { toast.error("Update failed"); return false; }
    setRows(p => p.map(r => r.id === id ? { ...r, ...patch } as AdjRow : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, ...patch } as AdjRow : s);
    return true;
  }
  async function approve(r: AdjRow) {
    const ok = await patchRow(r.id, { status: "approved", approved_at: new Date().toISOString(), approved_by_name: "Payroll Coordinator" });
    if (ok) toast.success("Approved");
  }
  async function process(r: AdjRow) {
    const ok = await patchRow(r.id, { status: "applied", applied_at: new Date().toISOString() });
    if (ok) toast.success("Marked processed");
  }
  async function reject(r: AdjRow) {
    const ok = await patchRow(r.id, { status: "rejected" });
    if (ok) toast.success("Rejected");
  }
  async function appendNote() {
    if (!selected || !note.trim()) return;
    const stamp = new Date().toLocaleString();
    const next = `${selected.notes ? selected.notes + "\n\n" : ""}— ${stamp} · Payroll\n${note.trim()}`;
    const ok = await patchRow(selected.id, { notes: next });
    if (ok) { setNote(""); toast.success("Note added"); }
  }

  // Aggregates
  const counts = useMemo(() => {
    const open = rows.filter(r => r.status === "pending");
    const overdue = open.filter(r => ageDays(r.created_at) > 5);
    return {
      pending: open.length,
      approved: rows.filter(r => r.status === "approved").length,
      processedRecent: rows.filter(r => r.status === "applied").length,
      reimbursements: open.filter(r => r.adjustment_type === "reimbursement").length,
      reimbursementsAmt: open.filter(r => r.adjustment_type === "reimbursement").reduce((s, r) => s + Number(r.amount || 0), 0),
      overdue: overdue.length,
      corrections: open.filter(r => r.adjustment_type === "correction").length,
      retro: open.filter(r => r.adjustment_type === "retro").length,
      deductions: open.filter(r => r.adjustment_type === "deduction").length,
      bonuses: open.filter(r => r.adjustment_type === "bonus").length,
      directDeposit: open.filter(r => r.adjustment_type === "other" && (r.reason || "").toLowerCase().includes("direct deposit")).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let arr = rows;
    if (view === "all") arr = arr.filter(r => r.status === "pending" || r.status === "approved");
    else if (view === "approval") arr = arr.filter(r => r.status === "pending");
    else if (view === "reimbursements") arr = arr.filter(r => r.adjustment_type === "reimbursement");
    else if (view === "attendance") arr = arr.filter(r => r.adjustment_type === "correction" && Number(r.hours) !== 0);
    else if (view === "retro") arr = arr.filter(r => r.adjustment_type === "retro");
    else if (view === "deductions") arr = arr.filter(r => r.adjustment_type === "deduction");
    else if (view === "bonuses") arr = arr.filter(r => r.adjustment_type === "bonus");
    else if (view === "overdue") arr = arr.filter(r => r.status === "pending" && ageDays(r.created_at) > 5);
    else if (view === "rejected") arr = arr.filter(r => r.status === "rejected");
    else if (view === "processed") arr = arr.filter(r => r.status === "applied");

    if (status !== "all") arr = arr.filter(r => r.status === status);
    if (type !== "all") arr = arr.filter(r => r.adjustment_type === type);
    if (state !== "all") arr = arr.filter(r => emps[r.employee_id]?.state === state);
    if (q.trim()) {
      const n = q.toLowerCase();
      arr = arr.filter(r => {
        const e = emps[r.employee_id];
        return (r.reason || "").toLowerCase().includes(n) ||
          (r.notes || "").toLowerCase().includes(n) ||
          (e ? fullName(e).toLowerCase().includes(n) : false);
      });
    }
    return [...arr].sort((a, b) => {
      const sOrder: Record<string, number> = { pending: 0, approved: 1, applied: 2, rejected: 3 };
      const d = (sOrder[a.status] ?? 9) - (sOrder[b.status] ?? 9);
      return d !== 0 ? d : b.created_at.localeCompare(a.created_at);
    });
  }, [rows, emps, view, status, type, state, q]);

  const states = useMemo(() => {
    const s = new Set<string>();
    Object.values(emps).forEach(e => e.state && s.add(e.state));
    return ["all", ...Array.from(s).sort()];
  }, [emps]);

  const risks = useMemo(() => rows.filter(r => {
    if (r.status !== "pending") return false;
    return ageDays(r.created_at) > 5 || (r.adjustment_type === "other" && (r.reason || "").toLowerCase().includes("direct deposit")) || (r.adjustment_type === "correction" && (r.reason || "").toLowerCase().includes("missing"));
  }).slice(0, 5), [rows]);

  const reimbursements = useMemo(
    () => rows.filter(r => r.adjustment_type === "reimbursement" && r.status !== "applied").slice(0, 6),
    [rows],
  );
  const attendance = useMemo(
    () => rows.filter(r => r.adjustment_type === "correction" && r.status === "pending" && Number(r.hours) !== 0).slice(0, 6),
    [rows],
  );

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader icon={Wallet} title="Payroll Adjustments"
          subtitle="Manage payroll corrections, reimbursements, deductions, and payroll change workflows.">
          <HeaderBtn icon={Sparkles} to="/ai/assistant?q=What payroll adjustments are overdue?">Operational Insights</HeaderBtn>
          <HeaderBtn icon={Plus} primary to="/payroll/adjustments?new=1">New adjustment</HeaderBtn>
        </PageHeader>

        {/* Operational metrics chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[12px]">
          <Chip label="Pending" value={counts.pending} />
          <Chip label="Awaiting approval" value={counts.pending} />
          <Chip label="Processed" value={counts.processedRecent} tone="ok" />
          <Chip label="Reimbursements" value={counts.reimbursements} />
          <Chip label="Overdue" value={counts.overdue} tone={counts.overdue ? "crit" : "muted"} />
          <Chip label="Risks" value={risks.length} tone={risks.length ? "warn" : "muted"} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SumCard icon={ArrowDownUp} label="Hours corrections" value={counts.corrections} hint="Missing/incorrect time" onClick={() => { setView("attendance"); }} />
          <SumCard icon={Receipt} label="Reimbursements" value={counts.reimbursements} hint={`${fmtMoney(counts.reimbursementsAmt)} pending`} onClick={() => setView("reimbursements")} />
          <SumCard icon={Briefcase} label="Deduction changes" value={counts.deductions} hint="Benefits & withholding" onClick={() => setView("deductions")} />
          <SumCard icon={Clock} label="Retro pay" value={counts.retro} hint="Rate / hour back-corrections" onClick={() => setView("retro")} />
          <SumCard icon={ShieldCheck} label="Direct deposit" value={counts.directDeposit} hint="Bank info updates" />
          <SumCard icon={Flame} label="Escalated" value={counts.overdue} hint="Open > 5 days" tone="crit" onClick={() => setView("overdue")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
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
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search employee, reason, note…"
                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/60 border border-border/70 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <Sel value={status} onChange={setStatus} opts={["all","pending","approved","applied","rejected"]} labels={STATUS_LABEL} label="Status" />
                <Sel value={type} onChange={setType} opts={["all", ...Object.keys(TYPE_LABEL)]} labels={TYPE_LABEL} label="Type" />
                <Sel value={state} onChange={setState} opts={states} label="State" />
                {(q || status !== "all" || type !== "all" || state !== "all") && (
                  <button onClick={() => { setQ(""); setStatus("all"); setType("all"); setState("all"); }}
                    className="h-9 px-2.5 rounded-xl text-[12px] text-muted-foreground hover:bg-muted inline-flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
            </Card>

            {/* Adjustments list */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">{filtered.length} adjustment{filtered.length === 1 ? "" : "s"}</p>
                <span className="text-[11px] text-muted-foreground">Sorted by status · newest</span>
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
                <Empty icon={Inbox} title="No adjustments" hint="Nothing matches the current filters." />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(r => {
                    const e = emps[r.employee_id];
                    const Icon = TYPE_ICON[r.adjustment_type] ?? FileText;
                    const overdue = r.status === "pending" && ageDays(r.created_at) > 5;
                    return (
                      <li key={r.id}>
                        <button onClick={() => setSelected(r)} className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-start gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted grid place-items-center">
                            <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[14px] font-medium tracking-tight truncate">
                                {e ? fullName(e) : "Unknown"} · {TYPE_LABEL[r.adjustment_type]}
                              </span>
                              <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status] ?? r.status}</Pill>
                              {overdue && <Pill tone="crit">Overdue</Pill>}
                            </div>
                            {r.reason && <p className="text-[12.5px] text-muted-foreground truncate">{r.reason}</p>}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground mt-1">
                              {e?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                              {Number(r.amount) !== 0 && <span className="font-medium text-foreground">{fmtMoney(Number(r.amount))}</span>}
                              {Number(r.hours) !== 0 && <span>{Number(r.hours)} hrs</span>}
                              {r.requested_by_name && <span>Requested by {r.requested_by_name}</span>}
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Submitted {fmtDate(r.created_at)}</span>
                              <span>· {relTime(r.updated_at)}</span>
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

            {/* Reimbursement Center + Attendance Corrections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Reimbursement center</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{fmtMoney(counts.reimbursementsAmt)} pending</span>
                </div>
                {reimbursements.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No open reimbursements.</p>
                ) : (
                  <ul className="space-y-2">
                    {reimbursements.map(r => {
                      const e = emps[r.employee_id];
                      return (
                        <li key={r.id}>
                          <button onClick={() => setSelected(r)} className="w-full text-left rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unknown"}</p>
                              <span className="text-[12px] font-medium">{fmtMoney(Number(r.amount))}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.reason}</p>
                            <div className="mt-1.5"><Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill></div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-[13px] font-medium tracking-tight">Attendance corrections</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">CentralReach</span>
                </div>
                {attendance.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No open attendance corrections.</p>
                ) : (
                  <ul className="space-y-2">
                    {attendance.map(r => {
                      const e = emps[r.employee_id];
                      const hrs = Number(r.hours);
                      return (
                        <li key={r.id}>
                          <button onClick={() => setSelected(r)} className="w-full text-left rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/60 p-2.5 transition">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unknown"}</p>
                              <span className={cn("text-[12px] font-medium", hrs < 0 ? "text-destructive" : "text-foreground")}>
                                {hrs > 0 ? "+" : ""}{hrs} hrs
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.reason}</p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <h3 className="text-[13px] font-medium tracking-tight">Payroll risks</h3>
              </div>
              {risks.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No payroll risks. Calm cycle.</p>
              ) : (
                <ul className="space-y-2">
                  {risks.map(r => {
                    const e = emps[r.employee_id];
                    return (
                      <li key={r.id}>
                        <button onClick={() => setSelected(r)} className="w-full text-left rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 hover:bg-amber-500/10 transition">
                          <p className="text-[12.5px] font-medium tracking-tight truncate">{e ? fullName(e) : "Unknown"}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.reason}</p>
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
                <RailLink icon={Plus} to="/payroll/adjustments?new=1">Create adjustment</RailLink>
                <RailLink icon={Receipt} to="/payroll/adjustments?new=reimbursement">Add reimbursement</RailLink>
                <RailLink icon={Clock} to="/payroll/time-attendance">Request missing hours</RailLink>
                <RailLink icon={FileText} to="/payroll/adjustments?upload=1">Upload documentation</RailLink>
                <RailLink icon={Flame} to="/payroll/issues">Escalate adjustment</RailLink>
                <RailLink icon={Inbox} to="/payroll/queue">Open Payroll Queue</RailLink>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[13px] font-medium tracking-tight">Operational Insights</h3>
              </div>
              <div className="space-y-1.5">
                {[
                  "What adjustments are overdue?",
                  "Which reimbursements are unresolved?",
                  "What corrections could delay payroll?",
                  "Summarize unresolved adjustments",
                  "Show high-risk payroll corrections",
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
            const e = emps[selected.employee_id];
            const Icon = TYPE_ICON[selected.adjustment_type] ?? FileText;
            const overdue = selected.status === "pending" && ageDays(selected.created_at) > 5;
            return (
              <div>
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Pill>
                    {overdue && <Pill tone="crit">Overdue</Pill>}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="text-lg font-semibold tracking-tight">{TYPE_LABEL[selected.adjustment_type]}</SheetTitle>
                      {selected.reason && <p className="text-[13px] text-muted-foreground mt-1">{selected.reason}</p>}
                    </div>
                  </div>
                </SheetHeader>

                {/* Employee */}
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

                {/* Meta */}
                <div className="px-6 py-4 grid grid-cols-2 gap-3 text-[12px] border-b border-border/70">
                  <Meta label="Amount" value={Number(selected.amount) !== 0 ? fmtMoney(Number(selected.amount)) : "—"} />
                  <Meta label="Hours" value={Number(selected.hours) !== 0 ? `${Number(selected.hours)} hrs` : "—"} />
                  <Meta label="Requested by" value={selected.requested_by_name || "—"} />
                  <Meta label="Submitted" value={fmtDate(selected.created_at)} />
                  <Meta label="Approved by" value={selected.approved_by_name || "—"} />
                  <Meta label="Approved" value={selected.approved_at ? fmtDate(selected.approved_at) : "—"} />
                </div>

                {/* Approval workflow */}
                <div className="px-6 py-4 border-b border-border/70">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-3">Approval workflow</p>
                  <ApprovalStep label="Payroll review" done={["approved","applied"].includes(selected.status)} active={selected.status === "pending"} />
                  <ApprovalStep label="Finance / HR approval" done={selected.status === "applied"} active={selected.status === "approved"} />
                  <ApprovalStep label="Processed in payroll" done={selected.status === "applied"} active={false} last />
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-b border-border/70 flex flex-wrap gap-2">
                  {selected.status === "pending" && (
                    <>
                      <ActionBtn primary icon={CheckCircle2} onClick={() => approve(selected)}>Approve</ActionBtn>
                      <ActionBtn icon={X} onClick={() => reject(selected)}>Reject</ActionBtn>
                    </>
                  )}
                  {selected.status === "approved" && (
                    <ActionBtn primary icon={CheckCircle2} onClick={() => process(selected)}>Mark processed</ActionBtn>
                  )}
                  <ActionBtn icon={Send} onClick={() => toast.info("Logged — written follow-up")}>Request info</ActionBtn>
                  <ActionBtn icon={Flame} onClick={() => patchRow(selected.id, { notes: (selected.notes ? selected.notes + "\n\n" : "") + `— ${new Date().toLocaleString()} · Escalated` }).then(() => toast.success("Escalated"))}>Escalate</ActionBtn>
                </div>

                {/* Documentation / notes */}
                <div className="px-6 py-4">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mb-2">Documentation & notes</p>
                  <div className="space-y-2 mb-3">
                    <textarea value={note} onChange={ev => setNote(ev.target.value)} rows={3}
                      placeholder="Log a note, call summary, approval reason, or next step…"
                      className="w-full rounded-xl bg-muted/60 border border-border/70 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
                    <div className="flex justify-end">
                      <button onClick={appendNote} disabled={!note.trim()}
                        className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-[12.5px] disabled:opacity-40">
                        Save note
                      </button>
                    </div>
                  </div>
                  {selected.notes ? (
                    <pre className="text-[12.5px] text-muted-foreground whitespace-pre-wrap font-sans rounded-xl border border-border/70 bg-muted/30 p-3">{selected.notes}</pre>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">No notes yet. Everything logged here is recorded.</p>
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

function Chip({ label, value, tone = "muted" }: { label: string; value: number; tone?: Tone }) {
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

function Sel({ value, onChange, opts, labels, label }: {
  value: string; onChange: (v: string) => void; opts: string[]; labels?: Record<string, string>; label: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-9 rounded-xl bg-muted/60 border border-border/70 text-[12.5px] px-2.5 focus:outline-none focus:ring-2 focus:ring-ring">
      {opts.map(o => <option key={o} value={o}>{o === "all" ? `${label}: All` : (labels?.[o] ?? o)}</option>)}
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

function ApprovalStep({ label, done, active, last }: { label: string; done: boolean; active: boolean; last?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("h-6 w-6 rounded-full grid place-items-center text-[10px] border",
          done ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
               : active ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400"
               : "bg-muted border-border/70 text-muted-foreground")}>
          {done ? <CheckCircle2 className="h-3 w-3" /> : active ? "·" : ""}
        </div>
        {!last && <div className="w-px flex-1 bg-border/70 my-1 min-h-[18px]" />}
      </div>
      <div className="pb-3 flex-1">
        <p className="text-[13px] font-medium tracking-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground">{done ? "Complete" : active ? "Awaiting action" : "Not started"}</p>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, children, onClick, primary }: { icon: any; children: any; onClick?: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] transition",
        primary ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border border-border/70 bg-card hover:bg-muted")}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{children}
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