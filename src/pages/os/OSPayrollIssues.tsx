import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Plus, Search, X, ChevronRight, Sparkles, User, MapPin,
  Calendar, Inbox, CheckCircle2, Flame, Send, Wallet,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, KpiCard, HeaderBtn, PageHeader, Pill, Empty, fullName, fmtDate, type Tone } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

const CATEGORY_LABEL: Record<string, string> = {
  missing_time: "Missing Time", adjustment: "Adjustment", pto_review: "PTO Review",
  benefits: "Benefits", employee_question: "Employee Question",
  attendance_exception: "Attendance", approval_needed: "Approval Needed",
  blocker: "Blocker", reminder: "Reminder", escalation: "Escalation", other: "Other",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In progress", escalated: "Escalated",
  resolved: "Resolved", cancelled: "Cancelled",
};
const STATUS_TONE: Record<string, Tone> = {
  open: "info", in_progress: "warn", escalated: "crit", resolved: "ok", cancelled: "muted",
};
const PRIORITY_TONE: Record<string, Tone> = {
  urgent: "crit", high: "warn", normal: "info", low: "muted",
};
const CATEGORIES = Object.keys(CATEGORY_LABEL);
const PRIORITIES = ["low", "normal", "high", "urgent"];

function today() { return new Date().toISOString().slice(0, 10); }
function isOverdue(i: IssueRow) {
  return !!i.due_date && i.due_date < today() && i.status !== "resolved" && i.status !== "cancelled";
}
function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d < 30 ? `${d}d ago` : fmtDate(iso);
}

const VIEW_TABS = [
  { id: "open", label: "Open" },
  { id: "overdue", label: "Overdue" },
  { id: "escalated", label: "Escalated" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All history" },
];

export default function OSPayrollIssues() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [emps, setEmps] = useState<Record<string, EmpLite>>({});
  const [allEmps, setAllEmps] = useState<EmpLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState("open");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");

  const [selected, setSelected] = useState<IssueRow | null>(null);
  const [resolution, setResolution] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", employee_id: "", category: "other",
    priority: "normal", due_date: "", owner_role: "Payroll",
  });

  async function load() {
    setLoading(true);
    const { data: is } = await supabase
      .from("payroll_issues").select("*")
      .order("created_at", { ascending: false }).limit(500);
    const rows = (is ?? []) as IssueRow[];
    setIssues(rows);
    const { data: ep } = await supabase.from("employees")
      .select("id,first_name,last_name,preferred_name,job_title,state")
      .eq("status", "active" as never).order("last_name").limit(500);
    const list = (ep ?? []) as EmpLite[];
    setAllEmps(list);
    const map: Record<string, EmpLite> = {};
    list.forEach(e => { map[e.id] = e; });
    setEmps(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createIssue() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      employee_id: form.employee_id || null,
      category: form.category,
      priority: form.priority,
      status: "open",
      owner_role: form.owner_role || null,
      due_date: form.due_date || null,
      source: "manual",
    };
    const { data, error } = await supabase.from("payroll_issues")
      .insert(payload).select().single();
    if (error) { toast.error("Could not create issue"); return; }
    setIssues(prev => [data as IssueRow, ...prev]);
    setCreateOpen(false);
    setForm({ title: "", description: "", employee_id: "", category: "other",
      priority: "normal", due_date: "", owner_role: "Payroll" });
    toast.success("Issue logged");
  }

  async function updateStatus(id: string, next: string, extra: Partial<IssueRow> = {}) {
    const patch: any = { status: next, ...extra };
    if (next === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("payroll_issues").update(patch).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    setIssues(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, ...patch } : s);
    toast.success(`Marked ${STATUS_LABEL[next] || next}`);
  }

  async function saveResolution() {
    if (!selected) return;
    await updateStatus(selected.id, "resolved", { resolution: resolution.trim() || selected.resolution });
    setResolution("");
  }

  const counts = useMemo(() => {
    const open = issues.filter(i => i.status !== "resolved" && i.status !== "cancelled");
    return {
      open: open.length,
      overdue: open.filter(isOverdue).length,
      escalated: issues.filter(i => i.status === "escalated").length,
      resolved30: issues.filter(i => i.status === "resolved" && i.resolved_at &&
        (Date.now() - new Date(i.resolved_at).getTime()) < 30 * 86400000).length,
    };
  }, [issues]);

  const filtered = useMemo(() => {
    let rows = issues;
    if (view === "open") rows = rows.filter(i => i.status === "open" || i.status === "in_progress");
    else if (view === "overdue") rows = rows.filter(isOverdue);
    else if (view === "escalated") rows = rows.filter(i => i.status === "escalated");
    else if (view === "resolved") rows = rows.filter(i => i.status === "resolved");

    if (category !== "all") rows = rows.filter(i => i.category === category);
    if (priority !== "all") rows = rows.filter(i => i.priority === priority);
    if (q.trim()) {
      const n = q.toLowerCase();
      rows = rows.filter(i => {
        const e = i.employee_id ? emps[i.employee_id] : null;
        return i.title.toLowerCase().includes(n)
          || (i.description ?? "").toLowerCase().includes(n)
          || (e ? fullName(e).toLowerCase().includes(n) : false);
      });
    }
    const pOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...rows].sort((a, b) => {
      const pa = pOrder[a.priority] ?? 9, pb = pOrder[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.due_date || "9999").localeCompare(b.due_date || "9999");
    });
  }, [issues, emps, view, category, priority, q]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          icon={AlertTriangle}
          title="Payroll Issues"
          subtitle="Log, track, and resolve every payroll problem with full documentation."
        >
          <HeaderBtn icon={Sparkles} to="/ai/assistant?q=Summarize open payroll issues and risk">Ask Blossom AI</HeaderBtn>
          <HeaderBtn icon={Plus} primary onClick={() => setCreateOpen(true)}>Log issue</HeaderBtn>
        </PageHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Open issues" value={counts.open} tone="info" />
          <KpiCard label="Overdue" value={counts.overdue} tone={counts.overdue ? "crit" : "muted"} />
          <KpiCard label="Escalated" value={counts.escalated} tone={counts.escalated ? "crit" : "muted"} />
          <KpiCard label="Resolved (30d)" value={counts.resolved30} tone="ok" />
        </div>

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

        <Card className="p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, employee, description…"
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/60 border border-border/70 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="h-9 px-3 rounded-xl bg-muted/60 border border-border/70 text-[13px]">
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="h-9 px-3 rounded-xl bg-muted/60 border border-border/70 text-[13px]">
              <option value="all">All priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {(q || category !== "all" || priority !== "all") && (
              <button onClick={() => { setQ(""); setCategory("all"); setPriority("all"); }}
                className="h-9 px-2.5 rounded-xl text-[12px] text-muted-foreground hover:bg-muted inline-flex items-center gap-1">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">{filtered.length} issue{filtered.length === 1 ? "" : "s"}</p>
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
            <Empty icon={Inbox} title="No issues" hint="Nothing matches the current filters."
              action={<HeaderBtn icon={Plus} primary onClick={() => setCreateOpen(true)}>Log first issue</HeaderBtn>} />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map(i => {
                const e = i.employee_id ? emps[i.employee_id] : null;
                const overdue = isOverdue(i);
                return (
                  <li key={i.id}>
                    <button onClick={() => { setSelected(i); setResolution(i.resolution ?? ""); }}
                      className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition flex items-start gap-3">
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
                          <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{e ? fullName(e) : "Unassigned"}</span>
                          {e?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.state}</span>}
                          <span>{CATEGORY_LABEL[i.category] ?? i.category}</span>
                          {i.due_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Due {fmtDate(i.due_date)}</span>}
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

        {/* Detail drawer */}
        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selected && (() => {
              const e = selected.employee_id ? emps[selected.employee_id] : null;
              return (
                <>
                  <SheetHeader>
                    <SheetTitle className="text-left">{selected.title}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={PRIORITY_TONE[selected.priority]}>{selected.priority}</Pill>
                      <Pill tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Pill>
                      <Pill tone="muted">{CATEGORY_LABEL[selected.category]}</Pill>
                      {isOverdue(selected) && <Pill tone="crit">Overdue</Pill>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[12px]">
                      <Field label="Employee" value={e ? fullName(e) : "—"} />
                      <Field label="Role" value={e?.job_title ?? "—"} />
                      <Field label="State" value={e?.state ?? "—"} />
                      <Field label="Owner" value={selected.owner_role ?? "—"} />
                      <Field label="Due" value={fmtDate(selected.due_date)} />
                      <Field label="Created" value={fmtDate(selected.created_at)} />
                    </div>
                    {selected.description && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Resolution notes</p>
                      <Textarea value={resolution} onChange={e => setResolution(e.target.value)}
                        placeholder="Document how this was resolved, what was decided, any follow-up…"
                        className="min-h-[100px] text-[13px]" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                      {selected.status !== "in_progress" && selected.status !== "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "in_progress")}>
                          <Wallet className="h-3.5 w-3.5 mr-1" />Start working
                        </Button>
                      )}
                      {selected.status !== "escalated" && selected.status !== "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "escalated")}>
                          <Flame className="h-3.5 w-3.5 mr-1" />Escalate
                        </Button>
                      )}
                      {selected.status !== "resolved" && (
                        <Button size="sm" onClick={saveResolution}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark resolved
                        </Button>
                      )}
                      {selected.status === "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "open", { resolved_at: null as any })}>
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </SheetContent>
        </Sheet>

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log payroll issue</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Missing time for week of May 18" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Employee</Label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md bg-background border border-input text-[13px]">
                  <option value="">— Unassigned —</option>
                  {allEmps.map(e => (
                    <option key={e.id} value={e.id}>{fullName(e)}{e.state ? ` · ${e.state}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md bg-background border border-input text-[13px]">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md bg-background border border-input text-[13px]">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Due date</Label>
                  <Input type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Owner role</Label>
                  <Input value={form.owner_role}
                    onChange={e => setForm(f => ({ ...f, owner_role: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What happened, what's blocking, what's needed…"
                  className="min-h-[90px] text-[13px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createIssue}><Send className="h-3.5 w-3.5 mr-1" />Log issue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OSShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[13px] text-foreground mt-0.5">{value}</p>
    </div>
  );
}