import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare, Search, X, Sparkles, MapPin, Calendar, Plus, Send,
  CheckCircle2, BellRing, Inbox, AlertTriangle, Flame, ArrowUpRight,
  Megaphone, Users2, ClipboardCheck, FileWarning, Wallet, Clock,
  ChevronRight, Filter, ListChecks, Mail, Phone, StickyNote,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card, HeaderBtn, PageHeader, Pill, Empty, KpiCard, fullName, fmtDate, type Tone } from "./_PayrollAtoms";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ---------------- Types ---------------- */
interface Emp {
  id: string;
  first_name: string; last_name: string; preferred_name: string | null;
  job_title: string | null; state: string | null; clinic: string | null;
  avatar_url: string | null; photo_url: string | null;
}
interface Comm {
  id: string;
  employee_id: string | null;
  channel: "message" | "email" | "call" | "note";
  direction: "inbound" | "outbound" | "internal";
  category: string;
  subject: string | null;
  body: string | null;
  status: string;
  related_issue_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

/* ---------------- Maps ---------------- */
const CATEGORY_LABEL: Record<string, string> = {
  reminder: "Payroll Reminder",
  attendance_followup: "Attendance Follow-Up",
  adjustment_communication: "Adjustment Comm",
  pto_communication: "PTO Communication",
  deduction_communication: "Benefits / Deduction",
  clarification: "Payroll Clarification",
  payroll_announcement: "Announcement",
  escalation: "Escalation",
  missing_documentation: "Missing Documentation",
  follow_up: "Follow-Up",
  documentation: "Documentation",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  delivered: "Delivered",
  viewed: "Viewed",
  waiting_response: "Waiting on Response",
  follow_up_needed: "Follow-Up Needed",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
  open: "Open",
};

const STATUS_TONE: Record<string, Tone> = {
  draft: "muted",
  sent: "info",
  delivered: "info",
  viewed: "ok",
  waiting_response: "warn",
  follow_up_needed: "warn",
  escalated: "crit",
  resolved: "ok",
  closed: "muted",
  open: "info",
};

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  message: MessageSquare,
  call: Phone,
  note: StickyNote,
};

const PRIORITY_OF = (c: Comm): "low" | "normal" | "high" | "urgent" => {
  if (c.status === "escalated") return "urgent";
  if (c.category === "missing_documentation" || c.status === "follow_up_needed") return "high";
  if (c.status === "waiting_response") return "high";
  if (c.category === "payroll_announcement") return "low";
  return "normal";
};
const PRIORITY_TONE: Record<string, Tone> = { urgent: "crit", high: "warn", normal: "info", low: "muted" };

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function isOverdue(c: Comm) {
  return (c.status === "waiting_response" || c.status === "follow_up_needed") && daysAgo(c.created_at) >= 3;
}

/* ---------------- Component ---------------- */
export default function OSPayrollMessages() {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [comms, setComms] = useState<Comm[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fState, setFState] = useState<string>("all");
  const [fPriority, setFPriority] = useState<string>("all");

  const [selected, setSelected] = useState<Comm | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  // Compose dialog (Send Reminder / New Update)
  const [composeMode, setComposeMode] = useState<null | "reminder" | "announcement">(null);
  const [composeEmp, setComposeEmp] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  function openCompose(mode: "reminder" | "announcement") {
    setComposeMode(mode);
    setComposeEmp("");
    setComposeSubject(mode === "reminder" ? "Payroll reminder" : "Payroll update");
    setComposeBody("");
  }

  async function sendCompose() {
    if (!composeMode) return;
    if (!composeSubject.trim() || !composeBody.trim()) {
      toast.error("Subject and message are required"); return;
    }
    if (composeMode === "reminder" && !composeEmp) {
      toast.error("Choose an employee for this reminder"); return;
    }
    const payload: any = {
      employee_id: composeMode === "reminder" ? composeEmp : null,
      channel: "message",
      direction: "outbound",
      category: composeMode === "reminder" ? "reminder" : "payroll_announcement",
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      status: "sent",
      created_by_name: "Payroll Team",
    };
    const { data, error } = await supabase.from("payroll_communications").insert(payload).select().single();
    if (error || !data) { toast.error("Failed to send"); return; }
    setComms(prev => [data as Comm, ...prev]);
    setComposeMode(null);
    toast.success(composeMode === "reminder" ? "Reminder sent" : "Update posted");
  }

  useEffect(() => {
    (async () => {
      const [eRes, cRes] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name, preferred_name, job_title, state, clinic, avatar_url, photo_url").limit(500),
        supabase.from("payroll_communications").select("*").order("created_at", { ascending: false }).limit(300),
      ]);
      setEmps((eRes.data as Emp[]) || []);
      setComms((cRes.data as Comm[]) || []);
      setLoading(false);
    })();
  }, []);

  const empMap = useMemo(() => new Map(emps.map(e => [e.id, e])), [emps]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return comms.filter(c => {
      if (fCat !== "all" && c.category !== fCat) return false;
      if (fStatus !== "all" && c.status !== fStatus) return false;
      if (fPriority !== "all" && PRIORITY_OF(c) !== fPriority) return false;
      const emp = c.employee_id ? empMap.get(c.employee_id) : null;
      if (fState !== "all" && (emp?.state || "—") !== fState) return false;
      if (!ql) return true;
      const hay = [
        c.subject, c.body, c.category, c.status, c.created_by_name,
        emp ? fullName(emp) : "", emp?.state || "", emp?.job_title || "",
      ].join(" ").toLowerCase();
      return hay.includes(ql);
    });
  }, [comms, q, fCat, fStatus, fState, fPriority, empMap]);

  /* Summary counts */
  const summary = useMemo(() => {
    const remindersPending = comms.filter(c => c.category === "reminder" && c.status !== "resolved" && c.status !== "closed").length;
    const followUps = comms.filter(c => c.status === "follow_up_needed" || (c.status === "waiting_response" && isOverdue(c))).length;
    const updatesSent = comms.filter(c => c.category === "payroll_announcement").length;
    const attendanceComm = comms.filter(c => c.category === "attendance_followup").length;
    const unresolved = comms.filter(c => c.status === "waiting_response").length;
    const escalated = comms.filter(c => c.status === "escalated").length;
    const sentToday = comms.filter(c => daysAgo(c.created_at) === 0).length;
    const remindersDue = comms.filter(c => c.category === "reminder" && (c.status === "sent" || c.status === "delivered" || c.status === "follow_up_needed")).length;
    return { remindersPending, followUps, updatesSent, attendanceComm, unresolved, escalated, sentToday, remindersDue };
  }, [comms]);

  const reminders = useMemo(() => comms.filter(c => c.category === "reminder").slice(0, 8), [comms]);
  const followUpList = useMemo(() => comms.filter(c => c.status === "waiting_response" || c.status === "follow_up_needed").slice(0, 8), [comms]);
  const announcements = useMemo(() => comms.filter(c => c.category === "payroll_announcement").slice(0, 6), [comms]);
  const escalations = useMemo(() => comms.filter(c => c.status === "escalated" || isOverdue(c)).slice(0, 8), [comms]);

  const states = useMemo(() => Array.from(new Set(emps.map(e => e.state).filter(Boolean))).sort() as string[], [emps]);
  const categories = useMemo(() => Array.from(new Set(comms.map(c => c.category))).sort(), [comms]);

  /* Actions */
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("payroll_communications").update({ status }).eq("id", id);
    if (error) return toast.error("Failed to update");
    setComms(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
    toast.success("Status updated");
  }

  async function addNote() {
    if (!selected || !noteDraft.trim()) return;
    const { data, error } = await supabase.from("payroll_communications").insert({
      employee_id: selected.employee_id,
      channel: "note",
      direction: "internal",
      category: selected.category,
      subject: `Re: ${selected.subject || "Note"}`,
      body: noteDraft.trim(),
      status: "open",
      related_issue_id: selected.related_issue_id,
      created_by_name: "Payroll Team",
    }).select().single();
    if (error || !data) return toast.error("Failed to add note");
    setComms(prev => [data as Comm, ...prev]);
    setNoteDraft("");
    toast.success("Note added to communication log");
  }

  return (
    <OSShell>
      <div className="px-4 md:px-8 lg:px-10 py-6 md:py-8 max-w-[1400px] mx-auto">
        <PageHeader
          icon={MessageSquare}
          title="Payroll Messages & Updates"
          subtitle="Centralized payroll communication, reminders, updates, and employee follow-up tracking."
        >
          <HeaderBtn icon={Plus} primary onClick={() => openCompose("reminder")}>Send Reminder</HeaderBtn>
          <HeaderBtn icon={Megaphone} onClick={() => openCompose("announcement")}>New Update</HeaderBtn>
          <HeaderBtn icon={ListChecks} to="/payroll/queue">Payroll Queue</HeaderBtn>
        </PageHeader>

        {/* Tiny pulse */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground mb-5">
          <span><strong className="text-foreground">{summary.sentToday}</strong> sent today</span>
          <span>·</span>
          <span><strong className="text-foreground">{summary.followUps}</strong> follow-ups pending</span>
          <span>·</span>
          <span><strong className="text-foreground">{summary.unresolved}</strong> awaiting response</span>
          <span>·</span>
          <span><strong className="text-foreground">{summary.remindersDue}</strong> reminders due</span>
          <span>·</span>
          <span className={summary.escalated > 0 ? "text-destructive" : ""}><strong>{summary.escalated}</strong> escalated</span>
          <span>·</span>
          <span><strong className="text-foreground">{summary.updatesSent}</strong> updates active</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => { setFCat("reminder"); setFStatus("all"); }} className="text-left">
            <KpiCard label="Reminders Pending" value={summary.remindersPending} hint="Need follow-up" tone={summary.remindersPending > 0 ? "warn" : "ok"} />
          </button>
          <button onClick={() => { setFStatus("follow_up_needed"); }} className="text-left">
            <KpiCard label="Follow-Ups Needed" value={summary.followUps} hint="Open employee follow-ups" tone={summary.followUps > 0 ? "warn" : "ok"} />
          </button>
          <button onClick={() => { setFCat("payroll_announcement"); }} className="text-left">
            <KpiCard label="Updates Sent" value={summary.updatesSent} hint="Active announcements" tone="info" />
          </button>
          <button onClick={() => { setFCat("attendance_followup"); }} className="text-left">
            <KpiCard label="Attendance Comm" value={summary.attendanceComm} hint="Clarifications open" tone="info" />
          </button>
          <button onClick={() => { setFStatus("waiting_response"); }} className="text-left">
            <KpiCard label="Unresolved Responses" value={summary.unresolved} hint="Awaiting employee" tone={summary.unresolved > 0 ? "warn" : "ok"} />
          </button>
          <button onClick={() => { setFStatus("escalated"); }} className="text-left">
            <KpiCard label="Escalated" value={summary.escalated} hint="Needs leadership" tone={summary.escalated > 0 ? "crit" : "ok"} />
          </button>
        </div>

        {/* Filters */}
        <Card className="p-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search employees, subjects, messages…"
                className="w-full h-10 rounded-xl bg-muted/60 border border-border pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Select value={fCat} onChange={setFCat} options={[["all", "All Types"], ...categories.map(c => [c, CATEGORY_LABEL[c] || c] as [string, string])]} />
            <Select value={fStatus} onChange={setFStatus} options={[["all","All Statuses"], ...Object.entries(STATUS_LABEL)]} />
            <Select value={fPriority} onChange={setFPriority} options={[["all","All Priority"],["urgent","Urgent"],["high","High"],["normal","Normal"],["low","Low"]]} />
            <Select value={fState} onChange={setFState} options={[["all","All States"], ...states.map(s => [s, s] as [string, string])]} />
            {(q || fCat !== "all" || fStatus !== "all" || fState !== "all" || fPriority !== "all") && (
              <button onClick={() => { setQ(""); setFCat("all"); setFStatus("all"); setFState("all"); setFPriority("all"); }}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-xl text-[12px] text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Payroll Messages Feed</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{filtered.length} of {comms.length} communications</p>
                </div>
                <Pill tone="info"><Filter className="h-3 w-3" /> Live</Pill>
              </div>
              <div className="divide-y divide-border/60">
                {loading ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
                ) : filtered.length === 0 ? (
                  <Empty icon={Inbox} title="No communications match" hint="Adjust your filters to see more results." />
                ) : filtered.slice(0, 60).map(c => (
                  <CommRow key={c.id} c={c} emp={c.employee_id ? empMap.get(c.employee_id) : null} onOpen={() => setSelected(c)} />
                ))}
              </div>
            </Card>

            {/* Reminder Center */}
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-muted-foreground" /> Payroll Reminder Center
                  </h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Transitioning from biweekly → weekly reminder cadence.</p>
                </div>
                <HeaderBtn icon={Send} primary onClick={() => openCompose("reminder")}>Send Reminder</HeaderBtn>
              </div>
              <div className="divide-y divide-border/60">
                {reminders.length === 0 ? (
                  <Empty icon={CheckCircle2} title="No active reminders" />
                ) : reminders.map(c => (
                  <CommRow key={c.id} c={c} emp={c.employee_id ? empMap.get(c.employee_id) : null} onOpen={() => setSelected(c)} compact />
                ))}
              </div>
            </Card>

            {/* Announcements */}
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" /> Payroll Announcements & Updates
                </h2>
                <HeaderBtn icon={Plus} onClick={() => openCompose("announcement")}>New Update</HeaderBtn>
              </div>
              <div className="divide-y divide-border/60">
                {announcements.length === 0 ? (
                  <Empty icon={Megaphone} title="No active announcements" />
                ) : announcements.map(c => (
                  <CommRow key={c.id} c={c} emp={c.employee_id ? empMap.get(c.employee_id) : null} onOpen={() => setSelected(c)} compact />
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Follow-up tracking */}
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/70">
                <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-muted-foreground" /> Employee Follow-Ups
                </h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Unresolved & overdue employee conversations.</p>
              </div>
              <div className="divide-y divide-border/60">
                {followUpList.length === 0 ? (
                  <Empty icon={CheckCircle2} title="All caught up" hint="No follow-ups pending." />
                ) : followUpList.map(c => (
                  <CommRow key={c.id} c={c} emp={c.employee_id ? empMap.get(c.employee_id) : null} onOpen={() => setSelected(c)} compact />
                ))}
              </div>
            </Card>

            {/* Escalations */}
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/70">
                <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                  <Flame className="h-4 w-4 text-destructive" /> Escalations & Unresolved
                </h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Routed to Payroll, HR, Finance, Leadership.</p>
              </div>
              <div className="divide-y divide-border/60">
                {escalations.length === 0 ? (
                  <Empty icon={CheckCircle2} title="No escalations" />
                ) : escalations.map(c => (
                  <CommRow key={c.id} c={c} emp={c.employee_id ? empMap.get(c.employee_id) : null} onOpen={() => setSelected(c)} compact />
                ))}
              </div>
            </Card>

            {/* Operational Insights */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-xl bg-primary/10 grid place-items-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">Operational Insights</h3>
                  <p className="text-[11px] text-muted-foreground">Payroll Communication</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {[
                  "What payroll reminders are overdue?",
                  "Which employees still need follow-up?",
                  "Summarize today's payroll communication risks.",
                  "Which employees repeatedly miss reminders?",
                  "What conversations affect this cycle's payroll?",
                  "What follow-ups should I prioritize today?",
                ].map(p => (
                  <button key={p} onClick={() => setAiPrompt(p)}
                    className="w-full text-left text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg px-2.5 py-1.5 transition">
                    {p}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Ask anything about payroll comms…"
                  className="w-full h-9 rounded-xl bg-muted/60 border border-border pl-3 pr-9 text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="absolute right-1 top-1 h-7 w-7 rounded-lg grid place-items-center text-muted-foreground hover:bg-muted">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selected && <DetailDrawer
            c={selected}
            emp={selected.employee_id ? empMap.get(selected.employee_id) : null}
            related={comms.filter(x => x.employee_id === selected.employee_id).slice(0, 12)}
            noteDraft={noteDraft} setNoteDraft={setNoteDraft}
            onAddNote={addNote}
            onStatus={(s) => updateStatus(selected.id, s)}
          />}
        </SheetContent>
      </Sheet>

      {/* Compose dialog */}
      <Dialog open={!!composeMode} onOpenChange={(o) => !o && setComposeMode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {composeMode === "reminder" ? "Send payroll reminder" : "New payroll announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {composeMode === "reminder" && (
              <div>
                <Label className="text-xs text-muted-foreground">Employee</Label>
                <select value={composeEmp} onChange={e => setComposeEmp(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-background border border-input text-[13px]">
                  <option value="">— Select employee —</option>
                  {emps.map(e => (
                    <option key={e.id} value={e.id}>{fullName(e)}{e.state ? ` · ${e.state}` : ""}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <Input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea value={composeBody} onChange={e => setComposeBody(e.target.value)}
                placeholder={composeMode === "reminder"
                  ? "What needs to be submitted, when, and any follow-up context…"
                  : "What's changing, who it affects, what they need to do…"}
                className="min-h-[120px] text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeMode(null)}>Cancel</Button>
            <Button onClick={sendCompose}>
              <Send className="h-3.5 w-3.5 mr-1" />
              {composeMode === "reminder" ? "Send reminder" : "Post update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OSShell>
  );
}

/* ---------------- Sub-components ---------------- */
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-[12.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function CommRow({ c, emp, onOpen, compact }: { c: Comm; emp?: Emp | null; onOpen: () => void; compact?: boolean }) {
  const Channel = CHANNEL_ICON[c.channel] || MessageSquare;
  const overdue = isOverdue(c);
  const priority = PRIORITY_OF(c);
  return (
    <button onClick={onOpen} className="w-full text-left px-5 py-4 hover:bg-muted/40 transition flex gap-3 group">
      <div className="h-8 w-8 rounded-xl bg-muted grid place-items-center shrink-0 mt-0.5">
        <Channel className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-medium tracking-tight truncate">
            {emp ? fullName(emp) : (c.category === "payroll_announcement" ? "All employees" : "—")}
          </span>
          <Pill tone="muted">{CATEGORY_LABEL[c.category] || c.category}</Pill>
          <Pill tone={STATUS_TONE[c.status] || "muted"}>{STATUS_LABEL[c.status] || c.status}</Pill>
          {priority === "urgent" && <Pill tone="crit"><Flame className="h-3 w-3" /> Urgent</Pill>}
          {overdue && c.status !== "escalated" && <Pill tone="warn"><Clock className="h-3 w-3" /> Overdue</Pill>}
        </div>
        {c.subject && <p className="text-[13px] mt-1 truncate">{c.subject}</p>}
        {!compact && c.body && <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{c.body}</p>}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
          {emp?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {emp.state}</span>}
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(c.created_at)}</span>
          {c.created_by_name && <span className="truncate">by {c.created_by_name}</span>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60 self-center opacity-0 group-hover:opacity-100 transition" />
    </button>
  );
}

function DetailDrawer({
  c, emp, related, noteDraft, setNoteDraft, onAddNote, onStatus,
}: {
  c: Comm; emp?: Emp | null; related: Comm[];
  noteDraft: string; setNoteDraft: (s: string) => void;
  onAddNote: () => void; onStatus: (s: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Pill tone="muted">{CATEGORY_LABEL[c.category] || c.category}</Pill>
          <Pill tone={STATUS_TONE[c.status] || "muted"}>{STATUS_LABEL[c.status] || c.status}</Pill>
          <Pill tone={PRIORITY_TONE[PRIORITY_OF(c)]}>{PRIORITY_OF(c).toUpperCase()}</Pill>
        </div>
        <SheetTitle className="text-lg tracking-tight">{c.subject || "Payroll communication"}</SheetTitle>
        {emp && (
          <div className="flex items-center gap-3 mt-2 text-[12.5px] text-muted-foreground">
            <span className="font-medium text-foreground">{fullName(emp)}</span>
            {emp.job_title && <span>· {emp.job_title}</span>}
            {emp.state && <span>· {emp.state}</span>}
          </div>
        )}
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Overview */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Communication Overview</h3>
          <Card className="p-4 grid grid-cols-2 gap-3 text-[12.5px]">
            <div><p className="text-muted-foreground">Channel</p><p className="font-medium capitalize">{c.channel}</p></div>
            <div><p className="text-muted-foreground">Direction</p><p className="font-medium capitalize">{c.direction}</p></div>
            <div><p className="text-muted-foreground">Sent</p><p className="font-medium">{fmtDate(c.created_at)}</p></div>
            <div><p className="text-muted-foreground">Owner</p><p className="font-medium">{c.created_by_name || "Payroll Team"}</p></div>
          </Card>
        </section>

        {/* Body */}
        {c.body && (
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Message</h3>
            <Card className="p-4 text-[13px] leading-relaxed whitespace-pre-wrap">{c.body}</Card>
          </section>
        )}

        {/* Resolution Checklist */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Resolution Checklist</h3>
          <Card className="p-4 space-y-2">
            {[
              { k: "contacted", l: "Employee contacted" },
              { k: "followup", l: "Follow-up completed" },
              { k: "doc", l: "Documentation received" },
              { k: "payroll", l: "Payroll reviewed" },
              { k: "resolved", l: "Issue resolved" },
            ].map(item => (
              <label key={item.k} className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span>{item.l}</span>
              </label>
            ))}
          </Card>
        </section>

        {/* Timeline */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Message Timeline ({related.length})</h3>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border/60">
              {related.map(r => {
                const Ch = CHANNEL_ICON[r.channel] || MessageSquare;
                return (
                  <div key={r.id} className="px-4 py-3 flex gap-2.5">
                    <Ch className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12.5px] font-medium truncate">{r.subject || CATEGORY_LABEL[r.category]}</span>
                        <Pill tone={STATUS_TONE[r.status] || "muted"}>{STATUS_LABEL[r.status] || r.status}</Pill>
                      </div>
                      {r.body && <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{r.body}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">{fmtDate(r.created_at)} · {r.created_by_name || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Note logger */}
        <section>
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Add Note / Log Communication</h3>
          <Card className="p-4 space-y-2">
            <textarea
              value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
              placeholder="Log who was contacted, what was discussed, follow-up needed, payroll impact…"
              rows={3}
              className="w-full rounded-xl bg-muted/60 border border-border p-3 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex items-center justify-end">
              <button onClick={onAddNote} disabled={!noteDraft.trim()}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground text-[13px] hover:opacity-90 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> Save Note
              </button>
            </div>
          </Card>
        </section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/70 p-4 flex flex-wrap gap-2">
        <button onClick={() => onStatus("resolved")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground text-[13px] hover:opacity-90">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
        </button>
        <button onClick={() => onStatus("follow_up_needed")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-[13px] hover:bg-muted">
          <Send className="h-3.5 w-3.5" /> Send Follow-Up
        </button>
        <button onClick={() => onStatus("escalated")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-[13px] hover:bg-muted">
          <Flame className="h-3.5 w-3.5" /> Escalate
        </button>
        {emp && (
          <Link to={`/payroll/profiles?employee=${emp.id}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-[13px] hover:bg-muted ml-auto">
            Open Profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}