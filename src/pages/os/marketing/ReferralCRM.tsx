import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Building2, HeartHandshake, ListChecks, ListFilter,
  Workflow, BarChart3, Upload, Download, Settings2, ShieldCheck, Trash2,
  Plus, Search, X, CheckCircle2, Pencil, RotateCcw, Activity, AlertCircle,
  ChevronRight, Tag, UserPlus, Paperclip, FileText, History, Phone, Mail,
  Calendar, StickyNote, FileUp,
} from "lucide-react";
import { MktgPage } from "./_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useCrm, crm, fullName, activeContacts, activeCompanies, activeReferrals,
  userName, companyName, evalList, STATES,
  type Contact, type Company, type Referral, type Task, type ID,
  type ActivityEvent, type Attachment,
} from "@/lib/os/referralCrm/store";
import {
  WORKFLOW_TRIGGERS, WORKFLOW_ACTIONS,
  type ListCriteria, type WorkflowTrigger,
} from "@/lib/os/referralCrm/store";

type ModuleId =
  | "dashboard" | "contacts" | "companies" | "referrals" | "tasks" | "lists"
  | "workflows" | "reports" | "imports" | "exports" | "duplicates"
  | "settings" | "users" | "deleted" | "files" | "audit" | "activities" | "search";

const MODULES: { id: ModuleId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Global Search", icon: Search },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "referrals", label: "Referrals", icon: HeartHandshake },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "activities", label: "Activities", icon: Activity },
  { id: "lists", label: "Lists", icon: ListFilter },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "files", label: "Files", icon: Paperclip },
  { id: "imports", label: "Imports", icon: Upload },
  { id: "exports", label: "Exports", icon: Download },
  { id: "duplicates", label: "Duplicate Mgmt", icon: ShieldCheck },
  { id: "audit", label: "Audit Log", icon: History },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "users", label: "Users & Permissions", icon: UserPlus },
  { id: "deleted", label: "Deleted Records", icon: Trash2 },
];

// ---------- shared atoms ----------
function Kpi({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function daysSince(d?: string) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

// ===========================================================
// Dashboard
// ===========================================================
function DashboardModule() {
  const s = useCrm();
  const ct = activeContacts(s);
  const co = activeCompanies(s);
  const rf = activeReferrals(s);
  const openTasks = s.tasks.filter((t) => t.status !== "Completed");
  const overdue = openTasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now());
  const activePartners = co.filter((c) => c.activeReferralPartner).length;
  const inactive60 = co.filter((c) => daysSince(c.lastContactedDate) > 60);
  const inactive90 = co.filter((c) => daysSince(c.lastContactedDate) > 90);

  const byState = STATES.map((st) => ({
    st, count: rf.filter((r) => r.state === st).length,
  }));
  const contactsByState = STATES.map((st) => ({ st, count: ct.filter((c) => c.state === st).length }));
  const companiesByState = STATES.map((st) => ({ st, count: co.filter((c) => c.state === st).length }));
  const topPartners = [...co].sort((a, b) => b.referralCount - a.referralCount).slice(0, 5);

  const last30 = (iso?: string) => !!iso && daysSince(iso) <= 30;
  const newSources30 = co.filter((c) => last30(c.createdAt)).length;
  const outreachDone30 = s.tasks.filter((t) => t.status === "Completed" && last30(t.createdAt)).length;
  const callsDone30 = s.activity.filter((a) => a.type === "call" && last30(a.createdAt)).length;
  const meetingsDone30 = s.activity.filter((a) => a.type === "meeting" && last30(a.createdAt)).length;
  const llScheduled = co.filter((c) => c.lunchLearnStatus === "Scheduled").length
    + ct.filter((c) => c.lunchLearnStatus === "Scheduled").length;
  const llCompleted = co.filter((c) => c.lunchLearnStatus === "Completed").length
    + ct.filter((c) => c.lunchLearnStatus === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Contacts" value={ct.length} icon={Users} />
        <Kpi label="Companies" value={co.length} icon={Building2} />
        <Kpi label="Referrals" value={rf.length} icon={HeartHandshake} />
        <Kpi label="Open Tasks" value={openTasks.length} hint={`${overdue.length} overdue`} icon={ListChecks} />
        <Kpi label="Active Partners" value={activePartners} icon={ShieldCheck} />
        <Kpi label="No Activity 60d+" value={inactive60.length} hint={`${inactive90.length} at 90d+`} icon={AlertCircle} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="New Sources (30d)" value={newSources30} icon={Plus} />
        <Kpi label="Outreach Tasks Done (30d)" value={outreachDone30} icon={CheckCircle2} />
        <Kpi label="Calls (30d)" value={callsDone30} icon={Phone} />
        <Kpi label="Meetings (30d)" value={meetingsDone30} icon={Calendar} />
        <Kpi label="L&L Scheduled" value={llScheduled} icon={Calendar} />
        <Kpi label="L&L Completed" value={llCompleted} icon={CheckCircle2} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <StateBars title="Contacts by State" rows={contactsByState} />
        <StateBars title="Companies by State" rows={companiesByState} />
        <div className="rounded-2xl border bg-card p-5">
          <SectionHeader title="Referrals by State" subtitle="YTD totals from referral records" />
          <div className="space-y-2">
            {byState.map(({ st, count }) => {
              const max = Math.max(1, ...byState.map((b) => b.count));
              return (
                <div key={st} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-muted-foreground tabular-nums">{st}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/70" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <SectionHeader title="Top Referral Partners" />
          <div className="divide-y">
            {topPartners.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.companyType} · {c.state}</p>
                </div>
                <Badge variant="secondary" className="tabular-nums">{c.referralCount} referrals</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <SectionHeader title="Companies with No Activity" subtitle="Reach out to keep partners warm" />
          {inactive60.length === 0 ? (
            <p className="text-sm text-muted-foreground">All companies have recent activity.</p>
          ) : (
            <div className="divide-y">
              {inactive60.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.state} · last contact {fmtDate(c.lastContactedDate)}</p>
                  </div>
                  <Badge variant={daysSince(c.lastContactedDate) > 90 ? "destructive" : "secondary"}>
                    {daysSince(c.lastContactedDate) > 90 ? "90d+" : "60d+"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <SectionHeader title="Overdue Tasks" />
          {overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No overdue tasks.</p>
          ) : (
            <div className="divide-y">
              {overdue.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{userName(s, t.assignedUserId)} · due {fmtDate(t.dueDate)}</p>
                  </div>
                  <Badge className="bg-destructive/10 text-destructive">Overdue</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <SectionHeader title="Recent Outreach Activity" />
          <div className="divide-y">
            {s.activity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 text-sm">
                <Activity className="size-3.5 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p>{a.message}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StateBars({ title, rows }: { title: string; rows: { st: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border bg-card p-5">
      <SectionHeader title={title} />
      <div className="space-y-2">
        {rows.map(({ st, count }) => (
          <div key={st} className="flex items-center gap-3 text-sm">
            <span className="w-10 text-muted-foreground tabular-nums">{st}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary/70" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right tabular-nums font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================
// Contacts
// ===========================================================
const CONTACT_VIEWS = [
  { id: "all", label: "All Contacts" },
  { id: "nc", label: "NC Referral Sources" },
  { id: "missing-email", label: "Missing Email" },
  { id: "active", label: "Active Referral Partners" },
  { id: "ll-needed", label: "Lunch & Learn Needed" },
] as const;

function ContactsModule({ onOpenContact, onOpenCompany }: { onOpenContact: (id: ID) => void; onOpenCompany: (id: ID) => void }) {
  const s = useCrm();
  const [view, setView] = useState<(typeof CONTACT_VIEWS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    let r = activeContacts(s);
    if (view === "nc") r = r.filter((c) => c.state === "NC" && !!c.referralSourceType);
    if (view === "missing-email") r = r.filter((c) => !c.email);
    if (view === "active") r = r.filter((c) => c.referralPartnerStatus === "Active Referral Partner");
    if (view === "ll-needed") r = r.filter((c) =>
      c.lunchLearnStatus === "Not Scheduled" && (c.relationshipStrength === "Warm" || c.relationshipStrength === "Strong"));
    if (stateFilter !== "all") r = r.filter((c) => c.state === stateFilter);
    if (q) {
      const ql = q.toLowerCase();
      r = r.filter((c) => fullName(c).toLowerCase().includes(ql) || c.email?.toLowerCase().includes(ql) || c.jobTitle?.toLowerCase().includes(ql));
    }
    return r;
  }, [s, view, q, stateFilter]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id: ID) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const bulkAssign = (uid: ID) => {
    selected.forEach((id) => crm.updateContact(id, { ownerId: uid }));
    toast({ title: `Assigned ${selected.size} contact(s)` });
    setSelected(new Set());
  };
  const bulkTag = () => {
    const tag = window.prompt("Tag to add:");
    if (!tag) return;
    selected.forEach((id) => {
      const c = s.contacts.find((x) => x.id === id);
      if (c && !c.tags.includes(tag)) crm.updateContact(id, { tags: [...c.tags, tag] });
    });
    toast({ title: `Tagged ${selected.size} contact(s)` });
    setSelected(new Set());
  };
  const bulkDelete = () => {
    selected.forEach((id) => crm.softDeleteContact(id));
    toast({ title: `${selected.size} contact(s) moved to Deleted` });
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" /> New Contact
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {CONTACT_VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-colors",
              view === v.id ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted")}>
            {v.label}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="rounded-xl bg-foreground text-background px-3 py-2 flex items-center gap-2 text-sm">
          <button onClick={() => setSelected(new Set())} className="size-6 grid place-items-center rounded hover:bg-background/10">
            <X className="size-3.5" />
          </button>
          <span className="font-medium">{selected.size} selected</span>
          <span className="mx-1 h-4 w-px bg-background/20" />
          <Select onValueChange={bulkAssign}>
            <SelectTrigger className="h-7 w-[160px] bg-transparent border-background/20 text-xs text-background">
              <SelectValue placeholder="Assign owner" />
            </SelectTrigger>
            <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkTag}>
            <Tag className="size-3 mr-1" /> Add tag
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={() => {
            const ids = Array.from(selected);
            const data = s.contacts.filter((c) => ids.includes(c.id)).map((c) => ({
              id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
              jobTitle: c.jobTitle, companyName: companyName(s, c.companyId), state: c.state,
              ownerName: userName(s, c.ownerId), referralCount: c.referralCount,
              referralPartnerStatus: c.referralPartnerStatus, lastContactedDate: c.lastContactedDate,
              tags: c.tags.join("|"),
            }));
            downloadCsv(`contacts-selected-${Date.now()}.csv`, rowsToCsv(data));
            crm.recordExport(`Exported ${data.length} selected contacts`);
            toast({ title: `Exported ${data.length} contact(s)` });
          }}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkDelete}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Company</th>
                <th className="text-left px-3 py-2 font-medium">Title</th>
                <th className="text-left px-3 py-2 font-medium">State</th>
                <th className="text-left px-3 py-2 font-medium">Owner</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">Referrals</th>
                <th className="text-left px-3 py-2 font-medium">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} /></td>
                  <td className="px-3 py-2">
                    <button className="font-medium hover:text-primary" onClick={() => onOpenContact(c.id)}>{fullName(c)}</button>
                    <p className="text-xs text-muted-foreground">{c.email || "—"}</p>
                  </td>
                  <td className="px-3 py-2">
                    {c.companyId ? (
                      <button className="hover:text-primary" onClick={() => onOpenCompany(c.companyId!)}>{companyName(s, c.companyId)}</button>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.jobTitle || "—"}</td>
                  <td className="px-3 py-2">{c.state || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, c.ownerId)}</td>
                  <td className="px-3 py-2">{c.referralPartnerStatus ? <Badge variant="secondary">{c.referralPartnerStatus}</Badge> : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.referralCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.lastContactedDate)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-10">No contacts match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewContactDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function NewContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const s = useCrm();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", state: "", companyId: "" });
  const submit = () => {
    if (!f.firstName || !f.lastName) { toast({ title: "First + last name required", variant: "destructive" as never }); return; }
    crm.addContact({ ...f, companyId: f.companyId || undefined });
    toast({ title: "Contact created" });
    onOpenChange(false);
    setF({ firstName: "", lastName: "", email: "", phone: "", state: "", companyId: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First name</Label><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
          <div><Label className="text-xs">Last name</Label><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="Pick state" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Company</Label>
            <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick company" /></SelectTrigger>
              <SelectContent>{s.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Companies
// ===========================================================
const COMPANY_VIEWS = [
  { id: "all", label: "All Companies" },
  { id: "active", label: "Active Partners" },
  { id: "tier-a", label: "Tier A" },
  { id: "targets", label: "New Targets" },
] as const;

function CompaniesModule({ onOpen }: { onOpen: (id: ID) => void }) {
  const s = useCrm();
  const [view, setView] = useState<(typeof COMPANY_VIEWS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [creating, setCreating] = useState(false);
  const [bulkTaskOpen, setBulkTaskOpen] = useState(false);

  const rows = useMemo(() => {
    let r = activeCompanies(s);
    if (view === "active") r = r.filter((c) => c.activeReferralPartner);
    if (view === "tier-a") r = r.filter((c) => c.relationshipTier === "Tier A");
    if (view === "targets") r = r.filter((c) => c.referralPartnerStatus === "New Target");
    if (q) { const ql = q.toLowerCase(); r = r.filter((c) => c.name.toLowerCase().includes(ql) || c.city?.toLowerCase().includes(ql)); }
    return r;
  }, [s, view, q]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: ID) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const ids = () => Array.from(selected);
  const clear = () => setSelected(new Set());
  const bulkAssignOwner = (uid: ID) => {
    ids().forEach((id) => crm.updateCompany(id, { ownerId: uid }));
    toast({ title: `Assigned ${selected.size} company(ies)` }); clear();
  };
  const bulkPartnerStatus = (v: string) => {
    ids().forEach((id) => crm.updateCompany(id, { referralPartnerStatus: v, activeReferralPartner: v === "Active Referral Partner" }));
    toast({ title: `Updated partner status on ${selected.size}` }); clear();
  };
  const bulkTier = (v: string) => {
    ids().forEach((id) => crm.updateCompany(id, { relationshipTier: v as Company["relationshipTier"] }));
    toast({ title: `Updated tier on ${selected.size}` }); clear();
  };
  const bulkAddTag = () => {
    const tag = window.prompt("Tag to add:"); if (!tag) return;
    ids().forEach((id) => {
      const c = s.companies.find((x) => x.id === id);
      if (c && !c.tags.includes(tag)) crm.updateCompany(id, { tags: [...c.tags, tag] });
    });
    toast({ title: `Tagged ${selected.size} company(ies)` }); clear();
  };
  const bulkRemoveTag = () => {
    const tag = window.prompt("Tag to remove:"); if (!tag) return;
    ids().forEach((id) => {
      const c = s.companies.find((x) => x.id === id);
      if (c && c.tags.includes(tag)) crm.updateCompany(id, { tags: c.tags.filter((t) => t !== tag) });
    });
    toast({ title: `Removed tag from ${selected.size}` }); clear();
  };
  const bulkExport = () => {
    const data = s.companies.filter((c) => selected.has(c.id)).map((c) => ({
      id: c.id, name: c.name, companyType: c.companyType, city: c.city, state: c.state,
      referralPartnerStatus: c.referralPartnerStatus, relationshipTier: c.relationshipTier,
      activeReferralPartner: c.activeReferralPartner, ownerName: userName(s, c.ownerId),
      referralCount: c.referralCount, referralsYTD: c.referralsYTD,
      lastReferralDate: c.lastReferralDate, lastContactedDate: c.lastContactedDate,
      mainPhone: c.mainPhone, generalEmail: c.generalEmail, website: c.website,
      tags: c.tags.join("|"),
    }));
    downloadCsv(`companies-selected-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} selected companies`);
    toast({ title: `Exported ${data.length} company(ies)` });
  };
  const bulkDelete = () => {
    ids().forEach((id) => crm.softDeleteCompany(id));
    toast({ title: `${selected.size} company(ies) deleted` }); clear();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies…" className="pl-8 h-9 text-sm" />
        </div>
        <div className="flex-1" />
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setCreating(true)}><Plus className="size-3.5" /> New Company</Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {COMPANY_VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-colors",
              view === v.id ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted")}>
            {v.label}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="rounded-xl bg-foreground text-background px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
          <button onClick={clear} className="size-6 grid place-items-center rounded hover:bg-background/10">
            <X className="size-3.5" />
          </button>
          <span className="font-medium">{selected.size} selected</span>
          <span className="mx-1 h-4 w-px bg-background/20" />
          <Select onValueChange={bulkAssignOwner}>
            <SelectTrigger className="h-7 w-[150px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Assign owner" /></SelectTrigger>
            <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={bulkPartnerStatus}>
            <SelectTrigger className="h-7 w-[170px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Partner status" /></SelectTrigger>
            <SelectContent>{["Active Referral Partner", "Warm Relationship", "Connected", "New Target", "Inactive"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={bulkTier}>
            <SelectTrigger className="h-7 w-[110px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>{["Tier A", "Tier B", "Tier C"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkAddTag}>
            <Tag className="size-3 mr-1" /> Add tag
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkRemoveTag}>
            <X className="size-3 mr-1" /> Remove tag
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={() => setBulkTaskOpen(true)}>
            <ListChecks className="size-3 mr-1" /> Create task
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkExport}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkDelete}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="text-left px-3 py-2 font-medium">Company</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">State</th>
                <th className="text-left px-3 py-2 font-medium">Tier</th>
                <th className="text-left px-3 py-2 font-medium">Owner</th>
                <th className="text-right px-3 py-2 font-medium">YTD</th>
                <th className="text-left px-3 py-2 font-medium">Last Referral</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} /></td>
                  <td className="px-3 py-2">
                    <button className="font-medium hover:text-primary" onClick={() => onOpen(c.id)}>{c.name}</button>
                    <p className="text-xs text-muted-foreground">{c.city || ""}{c.city && c.state ? ", " : ""}{c.state || ""}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.companyType || "—"}</td>
                  <td className="px-3 py-2">{c.state || "—"}</td>
                  <td className="px-3 py-2">{c.relationshipTier ? <Badge variant="secondary">{c.relationshipTier}</Badge> : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, c.ownerId)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.referralsYTD}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.lastReferralDate)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground py-10">No companies match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <NewCompanyDialog open={creating} onOpenChange={setCreating} />
      <BulkCreateTaskDialog
        open={bulkTaskOpen}
        onOpenChange={setBulkTaskOpen}
        targetCount={selected.size}
        onSubmit={(payload) => {
          ids().forEach((cid) => crm.addTask({ ...payload, companyId: cid }));
          toast({ title: `Created ${selected.size} task(s)` });
          setBulkTaskOpen(false); clear();
        }}
      />
    </div>
  );
}

function NewCompanyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const [f, setF] = useState({ name: "", companyType: "", state: "", city: "" });
  const submit = () => {
    if (!f.name) { toast({ title: "Company name required" }); return; }
    crm.addCompany(f);
    toast({ title: "Company created" });
    onOpenChange(false);
    setF({ name: "", companyType: "", state: "", city: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label className="text-xs">Type</Label><Input value={f.companyType} onChange={(e) => setF({ ...f, companyType: e.target.value })} placeholder="Pediatrician Office, Diagnostic Center…" /></div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="Pick state" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Shared bulk create-task dialog
// ===========================================================
function BulkCreateTaskDialog({
  open, onOpenChange, targetCount, onSubmit,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  targetCount: number;
  onSubmit: (payload: { title: string; type: Task["type"]; priority: Task["priority"]; assignedUserId?: ID; dueDate?: string; notes?: string }) => void;
}) {
  const s = useCrm();
  const [f, setF] = useState({ title: "", type: "Call" as Task["type"], priority: "Medium" as Task["priority"], assignedUserId: "", dueDate: "", notes: "" });
  const submit = () => {
    if (!f.title) { toast({ title: "Title required" }); return; }
    onSubmit({
      title: f.title, type: f.type, priority: f.priority,
      assignedUserId: f.assignedUserId || undefined,
      dueDate: f.dueDate || undefined, notes: f.notes || undefined,
    });
    setF({ title: "", type: "Call", priority: "Medium", assignedUserId: "", dueDate: "", notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create task for {targetCount} record(s)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as Task["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Call", "Email", "Meeting", "Lunch & Learn", "Follow-Up", "Other"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as Task["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Low", "Medium", "High"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Owner</Label>
              <Select value={f.assignedUserId} onValueChange={(v) => setF({ ...f, assignedUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due date</Label><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create {targetCount} task(s)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Referrals
// ===========================================================
function ReferralsModule() {
  const s = useCrm();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [logId, setLogId] = useState<ID | null>(null);
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [bulkTaskOpen, setBulkTaskOpen] = useState(false);
  const rows = activeReferrals(s);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: ID) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const ids = () => Array.from(selected);
  const clear = () => setSelected(new Set());
  const bulkStatus = (v: string) => {
    ids().forEach((id) => crm.updateReferral(id, { referralStatus: v as Referral["referralStatus"] }));
    toast({ title: `Updated status on ${selected.size}` }); clear();
  };
  const bulkIntakeStatus = () => {
    const v = window.prompt("New intake status:"); if (!v) return;
    ids().forEach((id) => crm.updateReferral(id, { intakeStatus: v }));
    toast({ title: `Updated intake status on ${selected.size}` }); clear();
  };
  const bulkAssignIntake = (uid: ID) => {
    ids().forEach((id) => crm.updateReferral(id, { assignedIntakeOwnerId: uid }));
    toast({ title: `Assigned intake owner on ${selected.size}` }); clear();
  };
  const bulkExport = () => {
    const data = s.referrals.filter((r) => selected.has(r.id)).map((r) => ({
      id: r.id, name: r.name, referralDate: r.referralDate,
      companyName: companyName(s, r.companyId),
      contactName: r.contactId ? fullName(s.contacts.find((c) => c.id === r.contactId)!) : "",
      state: r.state, serviceType: r.serviceType, referralStatus: r.referralStatus,
      intakeStatus: r.intakeStatus, insuranceType: r.insuranceType,
      intakeOwner: userName(s, r.assignedIntakeOwnerId),
      notes: r.notes,
    }));
    downloadCsv(`referrals-selected-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} selected referrals`);
    toast({ title: `Exported ${data.length} referral(s)` });
  };
  const bulkDelete = () => {
    ids().forEach((id) => crm.softDeleteReferral(id));
    toast({ title: `${selected.size} referral(s) deleted` }); clear();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" /> New Referral
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="rounded-xl bg-foreground text-background px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
          <button onClick={clear} className="size-6 grid place-items-center rounded hover:bg-background/10"><X className="size-3.5" /></button>
          <span className="font-medium">{selected.size} selected</span>
          <span className="mx-1 h-4 w-px bg-background/20" />
          <Select onValueChange={bulkStatus}>
            <SelectTrigger className="h-7 w-[160px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Referral status" /></SelectTrigger>
            <SelectContent>{["New", "In Review", "Intake Form Sent", "Scheduled", "Active", "Closed", "Lost"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkIntakeStatus}>
            <Pencil className="size-3 mr-1" /> Intake status
          </Button>
          <Select onValueChange={bulkAssignIntake}>
            <SelectTrigger className="h-7 w-[160px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Intake owner" /></SelectTrigger>
            <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={() => setBulkTaskOpen(true)}>
            <ListChecks className="size-3 mr-1" /> Create task
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkExport}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkDelete}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="text-left px-3 py-2 font-medium">Patient</th>
                <th className="text-left px-3 py-2 font-medium">Source Company</th>
                <th className="text-left px-3 py-2 font-medium">Source Contact</th>
                <th className="text-left px-3 py-2 font-medium">State</th>
                <th className="text-left px-3 py-2 font-medium">Service</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Insurance</th>
                <th className="text-left px-3 py-2 font-medium">Intake Owner</th>
                <th className="text-left px-3 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} /></td>
                  <td className="px-3 py-2 font-medium">
                    <button className="hover:text-primary" onClick={() => setEditingId(r.id)}>{r.name}</button>
                  </td>
                  <td className="px-3 py-2">{companyName(s, r.companyId)}</td>
                  <td className="px-3 py-2">{r.contactId ? fullName(s.contacts.find((c) => c.id === r.contactId)!) : "—"}</td>
                  <td className="px-3 py-2">{r.state || "—"}</td>
                  <td className="px-3 py-2">{r.serviceType || "—"}</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{r.referralStatus}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{r.insuranceType || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, r.assignedIntakeOwnerId)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span>{fmtDate(r.referralDate)}</span>
                      <div className="flex items-center gap-1">
                        <button className="text-muted-foreground hover:text-primary" title="Log activity" onClick={() => setLogId(r.id)}>
                          <Activity className="size-3" />
                        </button>
                        <button className="text-muted-foreground hover:text-primary" title="Edit" onClick={() => setEditingId(r.id)}>
                          <Pencil className="size-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={10} className="text-center text-muted-foreground py-10">No referrals yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <NewReferralDialog open={creating} onOpenChange={setCreating} />
      <EditReferralDialog id={editingId} open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)} />
      <LogActivityDialog open={!!logId} onOpenChange={(o) => !o && setLogId(null)} referralId={logId ?? undefined} />
      <BulkCreateTaskDialog
        open={bulkTaskOpen}
        onOpenChange={setBulkTaskOpen}
        targetCount={selected.size}
        onSubmit={(payload) => {
          ids().forEach((rid) => {
            const r = s.referrals.find((x) => x.id === rid);
            crm.addTask({ ...payload, referralId: rid, companyId: r?.companyId, contactId: r?.contactId });
          });
          toast({ title: `Created ${selected.size} task(s)` });
          setBulkTaskOpen(false); clear();
        }}
      />
    </div>
  );
}

function NewReferralDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const s = useCrm();
  const [f, setF] = useState({ patientFirstName: "", patientLastInitial: "", companyId: "", contactId: "", state: "", serviceType: "", insuranceType: "" });
  const submit = () => {
    if (!f.patientFirstName || !f.patientLastInitial) { toast({ title: "Patient name required" }); return; }
    crm.addReferral({
      patientFirstName: f.patientFirstName, patientLastInitial: f.patientLastInitial,
      companyId: f.companyId || undefined, contactId: f.contactId || undefined,
      state: f.state || undefined, serviceType: f.serviceType || undefined,
      insuranceType: f.insuranceType || undefined, referralStatus: "New",
      assignedIntakeOwnerId: "u-intake",
    });
    toast({ title: "Referral created — partner stats updated" });
    onOpenChange(false);
    setF({ patientFirstName: "", patientLastInitial: "", companyId: "", contactId: "", state: "", serviceType: "", insuranceType: "" });
  };
  const eligibleContacts = s.contacts.filter((c) => !f.companyId || c.companyId === f.companyId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Patient first name</Label><Input value={f.patientFirstName} onChange={(e) => setF({ ...f, patientFirstName: e.target.value })} /></div>
          <div><Label className="text-xs">Last initial</Label><Input value={f.patientLastInitial} onChange={(e) => setF({ ...f, patientLastInitial: e.target.value.slice(0, 1).toUpperCase() })} /></div>
          <div><Label className="text-xs">Source company</Label>
            <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick company" /></SelectTrigger>
              <SelectContent>{s.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Source contact</Label>
            <Select value={f.contactId} onValueChange={(v) => setF({ ...f, contactId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick contact" /></SelectTrigger>
              <SelectContent>{eligibleContacts.map((c) => <SelectItem key={c.id} value={c.id}>{fullName(c)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="Pick state" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Service type</Label><Input value={f.serviceType} onChange={(e) => setF({ ...f, serviceType: e.target.value })} placeholder="In-Home ABA, Center-Based…" /></div>
          <div className="col-span-2"><Label className="text-xs">Insurance</Label><Input value={f.insuranceType} onChange={(e) => setF({ ...f, insuranceType: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Tasks
// ===========================================================
function TasksModule() {
  const s = useCrm();
  const [groupBy, setGroupBy] = useState<"owner" | "state" | "status">("owner");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<ID>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of s.tasks) {
      let key = "Unassigned";
      if (groupBy === "owner") key = userName(s, t.assignedUserId);
      else if (groupBy === "state") {
        const co = s.companies.find((c) => c.id === t.companyId);
        key = co?.state ?? "—";
      } else key = t.status;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [s, groupBy]);

  const visibleIds = s.tasks.map((t) => t.id);
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(visibleIds));
  const toggleOne = (id: ID) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const ids = () => Array.from(selected);
  const clear = () => setSelected(new Set());
  const bulkComplete = () => {
    ids().forEach((id) => crm.updateTask(id, { status: "Completed" }));
    toast({ title: `Completed ${selected.size} task(s)` }); clear();
  };
  const bulkAssign = (uid: ID) => {
    ids().forEach((id) => crm.updateTask(id, { assignedUserId: uid }));
    toast({ title: `Reassigned ${selected.size} task(s)` }); clear();
  };
  const bulkPriority = (v: string) => {
    ids().forEach((id) => crm.updateTask(id, { priority: v as Task["priority"] }));
    toast({ title: `Updated priority on ${selected.size}` }); clear();
  };
  const bulkDueDate = () => {
    const v = window.prompt("Due date (YYYY-MM-DD):"); if (!v) return;
    ids().forEach((id) => crm.updateTask(id, { dueDate: v }));
    toast({ title: `Updated due date on ${selected.size}` }); clear();
  };
  const bulkDelete = () => {
    ids().forEach((id) => crm.deleteTask(id));
    toast({ title: `${selected.size} task(s) deleted` }); clear();
  };
  const bulkExport = () => {
    const data = s.tasks.filter((t) => selected.has(t.id)).map((t) => ({
      id: t.id, title: t.title, type: t.type, priority: t.priority, status: t.status,
      dueDate: t.dueDate, assignedUser: userName(s, t.assignedUserId),
      company: companyName(s, t.companyId),
      contact: t.contactId ? fullName(s.contacts.find((c) => c.id === t.contactId)!) : "",
      referralId: t.referralId, notes: t.notes, createdAt: t.createdAt,
    }));
    downloadCsv(`tasks-selected-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} selected tasks`);
    toast({ title: `Exported ${data.length} task(s)` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Group by</Label>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "owner" | "state" | "status")}>
          <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <label className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={allChecked} onCheckedChange={toggleAll} /> Select all
        </label>
        <div className="flex-1" />
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setCreating(true)}><Plus className="size-3.5" /> New Task</Button>
      </div>

      {selected.size > 0 && (
        <div className="rounded-xl bg-foreground text-background px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
          <button onClick={clear} className="size-6 grid place-items-center rounded hover:bg-background/10"><X className="size-3.5" /></button>
          <span className="font-medium">{selected.size} selected</span>
          <span className="mx-1 h-4 w-px bg-background/20" />
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkComplete}>
            <CheckCircle2 className="size-3 mr-1" /> Complete
          </Button>
          <Select onValueChange={bulkAssign}>
            <SelectTrigger className="h-7 w-[150px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Reassign owner" /></SelectTrigger>
            <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={bulkPriority}>
            <SelectTrigger className="h-7 w-[120px] bg-transparent border-background/20 text-xs text-background"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>{["Low", "Medium", "High"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkDueDate}>
            <Calendar className="size-3 mr-1" /> Due date
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkExport}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkDelete}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {groups.map(([key, items]) => (
          <div key={key} className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2 bg-muted/40 text-sm font-semibold flex items-center justify-between">
              <span>{key}</span>
              <Badge variant="secondary" className="tabular-nums">{items.length}</Badge>
            </div>
            <div className="divide-y">
              {items.map((t) => {
                const overdue = t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "Completed";
                return (
                  <div key={t.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleOne(t.id)} />
                    <button
                      className={cn("size-4 rounded border flex items-center justify-center",
                        t.status === "Completed" ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}
                      onClick={() => crm.updateTask(t.id, { status: t.status === "Completed" ? "Open" : "Completed" })}
                    >
                      {t.status === "Completed" && <CheckCircle2 className="size-3" />}
                    </button>
                    <div className="flex-1">
                      <p className={cn("font-medium", t.status === "Completed" && "line-through text-muted-foreground")}>{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.type} · {companyName(s, t.companyId)} · {userName(s, t.assignedUserId)}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn(t.priority === "High" && "bg-destructive/10 text-destructive")}>{t.priority}</Badge>
                    <span className={cn("text-xs tabular-nums", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {fmtDate(t.dueDate)}
                    </span>
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => crm.deleteTask(t.id)}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <NewTaskDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function NewTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const s = useCrm();
  const [f, setF] = useState({ title: "", type: "Call", assignedUserId: "", companyId: "", priority: "Medium", dueDate: "" });
  const submit = () => {
    if (!f.title) { toast({ title: "Title required" }); return; }
    crm.addTask({
      title: f.title, type: f.type as Task["type"],
      assignedUserId: f.assignedUserId || undefined, companyId: f.companyId || undefined,
      priority: f.priority as Task["priority"], dueDate: f.dueDate || undefined,
    });
    toast({ title: "Task created" });
    onOpenChange(false);
    setF({ title: "", type: "Call", assignedUserId: "", companyId: "", priority: "Medium", dueDate: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Call", "Email", "Meeting", "Lunch & Learn", "Follow-Up", "Other"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Low", "Medium", "High"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Owner</Label>
              <Select value={f.assignedUserId} onValueChange={(v) => setF({ ...f, assignedUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Company</Label>
              <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="Pick company" /></SelectTrigger>
                <SelectContent>{s.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Due date</Label><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Lists
// ===========================================================
function ListsModule() {
  const s = useCrm();
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [creating, setCreating] = useState(false);
  const [staticListIdForAdd, setStaticListIdForAdd] = useState<ID | null>(null);

  const editing = useMemo(() => s.lists.find((l) => l.id === editingId) ?? null, [s.lists, editingId]);
  const staticList = useMemo(() => s.lists.find((l) => l.id === staticListIdForAdd) ?? null, [s.lists, staticListIdForAdd]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Lists"
        subtitle="Static lists hold a manual set of records. Active lists evaluate criteria live."
        right={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />Create list</Button>}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        {s.lists.map((l) => {
          const matches = evalList(s, l);
          return (
            <div key={l.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{l.name}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase">{l.kind}</Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">{l.object}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {l.kind === "active"
                      ? (l.criteriaRules ? describeCriteria(l.criteriaRules) : (l.criteria ?? "—"))
                      : `Static list of ${l.staticIds?.length ?? 0} ${l.object}`}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary tabular-nums shrink-0">{matches.length} matches</Badge>
              </div>
              <div className="mt-3 divide-y text-sm max-h-48 overflow-y-auto">
                {matches.slice(0, 10).map((m) => (
                  <div key={m.id} className="py-1.5 flex justify-between gap-2">
                    <span className="truncate">{"firstName" in m ? fullName(m as Contact) : (m as Company).name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{(m as Contact).state || (m as Company).state}</span>
                      {l.kind === "static" && (
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => { crm.removeRecordFromStaticList(l.id, m.id); toast({ title: "Removed" }); }}
                          title="Remove from list"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {matches.length === 0 && <p className="text-muted-foreground py-4">No matches.</p>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  {l.createdAt ? `Created ${fmtDate(l.createdAt)}` : ""}
                </p>
                <div className="flex gap-1">
                  {l.kind === "static" && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setStaticListIdForAdd(l.id)}>
                      <Plus className="size-3 mr-1" />Add records
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingId(l.id)}>
                    <Pencil className="size-3 mr-1" />Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive"
                          onClick={() => {
                            if (confirm(`Delete list "${l.name}"?`)) {
                              crm.deleteList(l.id);
                              toast({ title: "List deleted" });
                            }
                          }}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <ListEditorDialog
          list={editing ?? undefined}
          onClose={() => { setCreating(false); setEditingId(null); }}
        />
      )}
      {staticList && (
        <StaticListAddDialog list={staticList} onClose={() => setStaticListIdForAdd(null)} />
      )}
    </div>
  );
}

function describeCriteria(c: ListCriteria): string {
  const parts: string[] = [];
  if (c.state) parts.push(`state = ${c.state}`);
  if (c.companyType) parts.push(`type = ${c.companyType}`);
  if (c.referralSourceType) parts.push(`source = ${c.referralSourceType}`);
  if (c.referralPartnerStatus) parts.push(`partner status = ${c.referralPartnerStatus}`);
  if (c.relationshipTier) parts.push(`tier = ${c.relationshipTier}`);
  if (typeof c.lastContactedOlderThanDays === "number") parts.push(`last contacted > ${c.lastContactedOlderThanDays}d ago`);
  if (typeof c.referralCountGte === "number") parts.push(`referrals ≥ ${c.referralCountGte}`);
  if (c.missingEmail) parts.push("missing email");
  if (c.missingPhone) parts.push("missing phone");
  if (c.nextFollowUpEmpty) parts.push("no next follow-up");
  return parts.length ? parts.join(" AND ") : "no criteria";
}

function ListEditorDialog({ list, onClose }: { list?: ReturnType<typeof useCrm>["lists"][number]; onClose: () => void }) {
  const isEdit = !!list;
  const [name, setName] = useState(list?.name ?? "");
  const [object, setObject] = useState<"contacts" | "companies">(list?.object ?? "contacts");
  const [kind, setKind] = useState<"static" | "active">(list?.kind ?? "active");
  const [criteria, setCriteria] = useState<ListCriteria>(list?.criteriaRules ?? {});

  function save() {
    if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    if (isEdit && list) {
      crm.updateList(list.id, {
        name: name.trim(), object, kind,
        criteriaRules: kind === "active" ? criteria : undefined,
        staticIds: kind === "static" ? (list.staticIds ?? []) : undefined,
      });
      toast({ title: "List updated" });
    } else {
      crm.addList({
        name: name.trim(), object, kind,
        criteriaRules: kind === "active" ? criteria : undefined,
        staticIds: kind === "static" ? [] : undefined,
      });
      toast({ title: "List created" });
    }
    onClose();
  }

  const upd = <K extends keyof ListCriteria>(k: K, v: ListCriteria[K]) =>
    setCriteria((c) => ({ ...c, [k]: v === "" || v === undefined ? undefined : v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Edit list" : "Create list"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NC Active Pediatricians" />
            </div>
            <div>
              <Label className="text-xs">Object</Label>
              <Select value={object} onValueChange={(v) => setObject(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (criteria)</SelectItem>
                  <SelectItem value="static">Static (manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind === "active" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/30">
              <div>
                <Label className="text-xs">State</Label>
                <Select value={criteria.state ?? "any"} onValueChange={(v) => upd("state", v === "any" ? undefined : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Company type</Label>
                <Input value={criteria.companyType ?? ""} placeholder="Pediatrician Office…"
                       onChange={(e) => upd("companyType", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Referral source type</Label>
                <Input value={criteria.referralSourceType ?? ""} placeholder="Pediatrician, School…"
                       onChange={(e) => upd("referralSourceType", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Referral partner status</Label>
                <Input value={criteria.referralPartnerStatus ?? ""} placeholder="Active Referral Partner…"
                       onChange={(e) => upd("referralPartnerStatus", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Relationship tier (companies)</Label>
                <Select value={criteria.relationshipTier ?? "any"} onValueChange={(v) => upd("relationshipTier", v === "any" ? undefined : v)}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Tier A">Tier A</SelectItem>
                    <SelectItem value="Tier B">Tier B</SelectItem>
                    <SelectItem value="Tier C">Tier C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Last contacted older than (days)</Label>
                <Input type="number" value={criteria.lastContactedOlderThanDays ?? ""}
                       onChange={(e) => upd("lastContactedOlderThanDays", e.target.value === "" ? undefined : Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Referral count ≥</Label>
                <Input type="number" value={criteria.referralCountGte ?? ""}
                       onChange={(e) => upd("referralCountGte", e.target.value === "" ? undefined : Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-4 col-span-2 pt-1">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={!!criteria.missingEmail} onCheckedChange={(v) => upd("missingEmail", !!v)} />
                  Missing email
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={!!criteria.missingPhone} onCheckedChange={(v) => upd("missingPhone", !!v)} />
                  Missing phone
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={!!criteria.nextFollowUpEmpty} onCheckedChange={(v) => upd("nextFollowUpEmpty", !!v)} />
                  Next follow-up empty
                </label>
              </div>
            </div>
          )}

          {kind === "static" && (
            <p className="text-xs text-muted-foreground rounded-lg border p-3 bg-muted/30">
              Static lists hold a manual set of records. After creating, use “Add records” on the list card to add or remove contacts/companies.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{isEdit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaticListAddDialog({ list, onClose }: { list: ReturnType<typeof useCrm>["lists"][number]; onClose: () => void }) {
  const s = useCrm();
  const [q, setQ] = useState("");
  const pool = list.object === "contacts" ? activeContacts(s) : activeCompanies(s);
  const member = new Set(list.staticIds ?? []);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool.filter((r) => {
      const label = "firstName" in r ? fullName(r as Contact) : (r as Company).name;
      return !needle || label.toLowerCase().includes(needle);
    }).slice(0, 50);
  }, [pool, q]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Manage records — {list.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${list.object}…`} />
          <div className="max-h-80 overflow-y-auto divide-y border rounded-lg">
            {filtered.map((r) => {
              const isMember = member.has(r.id);
              const label = "firstName" in r ? fullName(r as Contact) : (r as Company).name;
              return (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate">{label}</span>
                  {isMember ? (
                    <Button variant="outline" size="sm" className="h-7 text-xs"
                            onClick={() => crm.removeRecordFromStaticList(list.id, r.id)}>
                      <X className="size-3 mr-1" />Remove
                    </Button>
                  ) : (
                    <Button size="sm" className="h-7 text-xs"
                            onClick={() => crm.addRecordToStaticList(list.id, r.id)}>
                      <Plus className="size-3 mr-1" />Add
                    </Button>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground p-4">No matches.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Workflows
// ===========================================================
function WorkflowsModule() {
  const s = useCrm();
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [creating, setCreating] = useState(false);
  const editing = useMemo(() => s.workflows.find((w) => w.id === editingId) ?? null, [s.workflows, editingId]);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Workflows"
        subtitle="Automations that respond to CRM events. Run any workflow on-demand to test it."
        right={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />Create workflow</Button>}
      />
      {s.workflows.map((w) => (
        <div key={w.id} className="rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{w.name}</h3>
                <Badge variant={w.enabled ? "default" : "secondary"} className={w.enabled ? "bg-emerald-500/15 text-emerald-700" : ""}>
                  {w.enabled ? "Enabled" : "Disabled"}
                </Badge>
                {w.triggerType && (
                  <Badge variant="outline" className="text-[10px]">
                    {WORKFLOW_TRIGGERS.find((t) => t.id === w.triggerType)?.label ?? w.triggerType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-foreground">Trigger:</span> {w.trigger}</p>
              <ul className="mt-2 space-y-0.5">
                {w.actions.map((a, i) => (
                  <li key={i} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <ChevronRight className="size-3" /> {a}
                  </li>
                ))}
                {w.actions.length === 0 && <li className="text-xs text-muted-foreground italic">No actions configured.</li>}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">
                {w.runs} runs · last {fmtDate(w.lastRun)}
                {w.lastRunResult ? <> · <span className="text-foreground">{w.lastRunResult}</span></> : null}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Switch checked={w.enabled} onCheckedChange={() => crm.toggleWorkflow(w.id)} />
              <Button variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => { const r = crm.runWorkflow(w.id); toast({ title: `Ran ${w.name}`, description: r }); }}>
                Run now
              </Button>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(w.id)}>
                  <Pencil className="size-3 mr-1" />Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive"
                        onClick={() => {
                          if (confirm(`Delete workflow "${w.name}"?`)) {
                            crm.deleteWorkflow(w.id);
                            toast({ title: "Workflow deleted" });
                          }
                        }}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {(creating || editing) && (
        <WorkflowEditorDialog
          workflow={editing ?? undefined}
          onClose={() => { setCreating(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

function WorkflowEditorDialog({
  workflow, onClose,
}: { workflow?: ReturnType<typeof useCrm>["workflows"][number]; onClose: () => void }) {
  const isEdit = !!workflow;
  const [name, setName] = useState(workflow?.name ?? "");
  const [enabled, setEnabled] = useState(workflow?.enabled ?? true);
  const [triggerType, setTriggerType] = useState<WorkflowTrigger | undefined>(workflow?.triggerType);
  const [days, setDays] = useState<number | "">(workflow?.triggerConfig?.days ?? "");
  const [count, setCount] = useState<number | "">(workflow?.triggerConfig?.count ?? "");
  const [actions, setActions] = useState<string[]>(workflow?.actions ?? []);
  const [newAction, setNewAction] = useState<string>(WORKFLOW_ACTIONS[0].label);
  const [newActionDetail, setNewActionDetail] = useState("");

  function save() {
    if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    const triggerLabel = triggerType ? WORKFLOW_TRIGGERS.find((t) => t.id === triggerType)?.label ?? "Manual" : "Manual";
    const cfg: { days?: number; count?: number } = {};
    if (typeof days === "number") cfg.days = days;
    if (typeof count === "number") cfg.count = count;
    if (isEdit && workflow) {
      crm.updateWorkflow(workflow.id, {
        name: name.trim(), enabled, triggerType, trigger: triggerLabel,
        triggerConfig: cfg, actions,
      });
      toast({ title: "Workflow updated" });
    } else {
      crm.addWorkflow({
        name: name.trim(), enabled, triggerType, trigger: triggerLabel,
        triggerConfig: cfg, actions,
      });
      toast({ title: "Workflow created" });
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Edit workflow" : "Create workflow"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Re-engage stalled partners" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <span className="text-xs">{enabled ? "Enabled" : "Disabled"}</span>
          </div>
          <div>
            <Label className="text-xs">Trigger</Label>
            <Select value={triggerType ?? ""} onValueChange={(v) => setTriggerType(v as WorkflowTrigger)}>
              <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
              <SelectContent>
                {WORKFLOW_TRIGGERS.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(triggerType === "no_activity_days") && (
            <div>
              <Label className="text-xs">Days without activity</Label>
              <Input type="number" value={days} onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))} placeholder="60" />
            </div>
          )}
          {(triggerType === "referral_count_reaches") && (
            <div>
              <Label className="text-xs">Referral count threshold</Label>
              <Input type="number" value={count} onChange={(e) => setCount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="10" />
            </div>
          )}

          <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
            <Label className="text-xs">Actions</Label>
            <ul className="space-y-1">
              {actions.map((a, i) => (
                <li key={i} className="flex items-center justify-between text-xs bg-background rounded px-2 py-1">
                  <span>{a}</span>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => setActions((arr) => arr.filter((_, idx) => idx !== i))}>
                    <X className="size-3" />
                  </button>
                </li>
              ))}
              {actions.length === 0 && <li className="text-xs text-muted-foreground italic">No actions yet.</li>}
            </ul>
            <div className="flex gap-2">
              <Select value={newAction} onValueChange={setNewAction}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORKFLOW_ACTIONS.map((a) => <SelectItem key={a.id} value={a.label}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="Optional detail (e.g. tag name, owner, list)"
                     value={newActionDetail} onChange={(e) => setNewActionDetail(e.target.value)} />
              <Button size="sm" onClick={() => {
                const label = newActionDetail ? `${newAction} — ${newActionDetail}` : newAction;
                setActions((arr) => [...arr, label]);
                setNewActionDetail("");
              }}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{isEdit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================
// Reports
// ===========================================================
function ReportsModule() {
  const s = useCrm();
  const [range, setRange] = useState<"30" | "60" | "90" | "ytd" | "all">("90");
  const [stateF, setStateF] = useState<string>("all");
  const [ownerF, setOwnerF] = useState<string>("all");
  const [typeF, setTypeF] = useState<string>("all");
  const [srcF, setSrcF] = useState<string>("all");
  const [partnerF, setPartnerF] = useState<string>("all");

  const since = useMemo(() => {
    if (range === "all") return 0;
    if (range === "ytd") return new Date(new Date().getFullYear(), 0, 1).getTime();
    return Date.now() - Number(range) * 86_400_000;
  }, [range]);
  const inRange = (iso?: string) => !iso || new Date(iso).getTime() >= since;

  const companyTypes = useMemo(
    () => Array.from(new Set(s.companies.map((c) => c.companyType).filter(Boolean))) as string[],
    [s.companies],
  );
  const sourceTypes = useMemo(
    () => Array.from(new Set(s.contacts.map((c) => c.referralSourceType).filter(Boolean))) as string[],
    [s.contacts],
  );
  const partnerStatuses = useMemo(
    () => Array.from(new Set([
      ...s.companies.map((c) => c.referralPartnerStatus),
      ...s.contacts.map((c) => c.referralPartnerStatus),
    ].filter(Boolean))) as string[],
    [s.companies, s.contacts],
  );

  const cos = useMemo(() => activeCompanies(s).filter((c) =>
    (stateF === "all" || c.state === stateF) &&
    (ownerF === "all" || c.ownerId === ownerF) &&
    (typeF === "all" || c.companyType === typeF) &&
    (partnerF === "all" || c.referralPartnerStatus === partnerF)
  ), [s, stateF, ownerF, typeF, partnerF]);

  const cts = useMemo(() => activeContacts(s).filter((c) =>
    (stateF === "all" || c.state === stateF) &&
    (ownerF === "all" || c.ownerId === ownerF) &&
    (srcF === "all" || c.referralSourceType === srcF) &&
    (partnerF === "all" || c.referralPartnerStatus === partnerF)
  ), [s, stateF, ownerF, srcF, partnerF]);

  const refs = useMemo(() => activeReferrals(s).filter((r) =>
    (stateF === "all" || r.state === stateF) &&
    inRange(r.referralDate) &&
    (ownerF === "all" || s.companies.find((x) => x.id === r.companyId)?.ownerId === ownerF)
  ), [s, stateF, ownerF, since]);

  // Reports
  const topPartners = [...cos].sort((a, b) => b.referralCount - a.referralCount).slice(0, 10);
  const noActivity = cos
    .map((c) => ({ c, days: daysSince(c.lastContactedDate) }))
    .filter((x) => x.days > 60)
    .sort((a, b) => b.days - a.days);

  const byState = STATES.map((st) => {
    const ssCos = cos.filter((c) => c.state === st);
    const ssRefs = refs.filter((r) => r.state === st);
    const ssCts = cts.filter((c) => c.state === st);
    return {
      st,
      companies: ssCos.length,
      contacts: ssCts.length,
      referrals: ssRefs.length,
      activePartners: ssCos.filter((c) => c.activeReferralPartner).length,
    };
  });

  const outreach = s.users.map((u) => {
    const userTasks = s.tasks.filter((t) => t.assignedUserId === u.id && inRange(t.createdAt));
    const userActs = s.activity.filter((a) => a.userId === u.id && inRange(a.createdAt));
    return {
      user: u.name,
      calls: userActs.filter((a) => a.type === "call").length,
      emails: userActs.filter((a) => a.type === "email").length,
      meetings: userActs.filter((a) => a.type === "meeting").length,
      tasksCompleted: userTasks.filter((t) => t.status === "Completed").length,
      tasksOpen: userTasks.filter((t) => t.status !== "Completed").length,
    };
  });

  const bySourceType = sourceTypes.map((t) => ({
    type: t,
    contacts: cts.filter((c) => c.referralSourceType === t).length,
    referrals: refs.filter((r) => {
      const ct = s.contacts.find((x) => x.id === r.contactId);
      return ct?.referralSourceType === t;
    }).length,
  })).sort((a, b) => b.referrals - a.referrals);

  const byCompany = cos.map((c) => ({
    name: c.name, state: c.state, type: c.companyType,
    referrals: refs.filter((r) => r.companyId === c.id).length,
  })).filter((x) => x.referrals > 0).sort((a, b) => b.referrals - a.referrals).slice(0, 15);

  const byContact = cts.map((c) => ({
    name: fullName(c), company: companyName(s, c.companyId), state: c.state,
    referrals: refs.filter((r) => r.contactId === c.id).length,
  })).filter((x) => x.referrals > 0).sort((a, b) => b.referrals - a.referrals).slice(0, 15);

  const llContactsScheduled = cts.filter((c) => c.lunchLearnStatus === "Scheduled").length;
  const llContactsCompleted = cts.filter((c) => c.lunchLearnStatus === "Completed").length;
  const llCompaniesScheduled = cos.filter((c) => c.lunchLearnStatus === "Scheduled").length;
  const llCompaniesCompleted = cos.filter((c) => c.lunchLearnStatus === "Completed").length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl border bg-card p-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">Filters</span>
        <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateF} onValueChange={setStateF}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ownerF} onValueChange={setOwnerF}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Owner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeF} onValueChange={setTypeF}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Company Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All company types</SelectItem>
            {companyTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={srcF} onValueChange={setSrcF}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Source Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All source types</SelectItem>
            {sourceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={partnerF} onValueChange={setPartnerF}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Partner Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All partner statuses</SelectItem>
            {partnerStatuses.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Top Referral Partners */}
      <ReportTable title="Top Referral Partners"
        headers={["Company", "Type", "State", "Referrals"]}
        rows={topPartners.map((c) => [c.name, c.companyType ?? "—", c.state ?? "—",
          <span className="tabular-nums font-medium">{c.referralCount}</span>])} />

      {/* No Activity */}
      <div className="rounded-2xl border bg-card p-5">
        <SectionHeader title="No Activity 60 / 90 Day Report" subtitle="Companies needing outreach" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr><th className="text-left py-2">Company</th><th className="text-left">State</th><th className="text-left">Owner</th><th className="text-left">Last Contact</th><th className="text-right">Days</th></tr>
            </thead>
            <tbody>
              {noActivity.length === 0 && (
                <tr><td colSpan={5} className="py-3 text-muted-foreground">All companies have recent activity.</td></tr>
              )}
              {noActivity.slice(0, 20).map(({ c, days }) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2">{c.name}</td>
                  <td>{c.state ?? "—"}</td>
                  <td>{userName(s, c.ownerId)}</td>
                  <td>{fmtDate(c.lastContactedDate)}</td>
                  <td className="text-right">
                    <Badge variant={days > 90 ? "destructive" : "secondary"} className="tabular-nums">{Number.isFinite(days) ? `${days}d` : "—"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Performance */}
      <ReportTable title="State Performance Report"
        headers={["State", "Companies", "Contacts", "Referrals", "Active Partners"]}
        rows={byState.map((r) => [r.st, r.companies, r.contacts, r.referrals, r.activePartners])} />

      {/* Outreach Productivity */}
      <ReportTable title="Outreach Productivity Report"
        headers={["Owner", "Calls", "Emails", "Meetings", "Tasks Done", "Tasks Open"]}
        rows={outreach.map((r) => [r.user, r.calls, r.emails, r.meetings, r.tasksCompleted, r.tasksOpen])} />

      {/* Referral Source Type */}
      <ReportTable title="Referral Source Type Report"
        headers={["Source Type", "Contacts", "Referrals"]}
        rows={bySourceType.map((r) => [r.type, r.contacts, r.referrals])} />

      {/* Referrals by Company */}
      <ReportTable title="Referrals by Company"
        headers={["Company", "Type", "State", "Referrals"]}
        rows={byCompany.map((r) => [r.name, r.type ?? "—", r.state ?? "—", r.referrals])} />

      {/* Referrals by Contact */}
      <ReportTable title="Referrals by Contact"
        headers={["Contact", "Company", "State", "Referrals"]}
        rows={byContact.map((r) => [r.name, r.company, r.state ?? "—", r.referrals])} />

      {/* Lunch & Learn */}
      <div className="rounded-2xl border bg-card p-5">
        <SectionHeader title="Lunch & Learn Summary" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Companies Scheduled" value={llCompaniesScheduled} icon={Calendar} />
          <Kpi label="Companies Completed" value={llCompaniesCompleted} icon={CheckCircle2} />
          <Kpi label="Contacts Scheduled" value={llContactsScheduled} icon={Calendar} />
          <Kpi label="Contacts Completed" value={llContactsCompleted} icon={CheckCircle2} />
        </div>
      </div>
    </div>
  );
}

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <SectionHeader title={title} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground">
            <tr>
              {headers.map((h, i) => (
                <th key={h} className={cn("py-2", i === 0 ? "text-left" : "text-right")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={headers.length} className="py-3 text-muted-foreground">No data for current filters.</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t">
                {r.map((cell, i) => (
                  <td key={i} className={cn("py-2", i === 0 ? "text-left" : "text-right tabular-nums")}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================
// CSV helpers (frontend only)
// ===========================================================
function escapeCsv(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function rowsToCsv(rows: Record<string, unknown>[], headers?: string[]): string {
  if (!rows.length) return headers?.join(",") ?? "";
  const hs = headers ?? Object.keys(rows[0]);
  const head = hs.join(",");
  const body = rows.map((r) => hs.map((h) => escapeCsv(r[h])).join(",")).join("\n");
  return `${head}\n${body}`;
}
function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const out: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); out.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  const headers = (out.shift() ?? []).map((h) => h.trim());
  const rows = out.filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
  return { headers, rows };
}

// ===========================================================
// Exports — real CSV downloads
// ===========================================================
function ExportsModule() {
  const s = useCrm();
  const exportContacts = () => {
    const data = activeContacts(s).map((c) => ({
      id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
      jobTitle: c.jobTitle, companyName: companyName(s, c.companyId), state: c.state,
      ownerName: userName(s, c.ownerId), referralCount: c.referralCount,
      referralPartnerStatus: c.referralPartnerStatus, lastContactedDate: c.lastContactedDate,
      tags: c.tags.join("|"),
    }));
    downloadCsv(`contacts-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} contacts`);
    toast({ title: `Exported ${data.length} contacts` });
  };
  const exportCompanies = () => {
    const data = activeCompanies(s).map((c) => ({
      id: c.id, name: c.name, companyType: c.companyType, website: c.website, phone: c.mainPhone,
      city: c.city, state: c.state, ownerName: userName(s, c.ownerId), tier: c.relationshipTier,
      activePartner: c.activeReferralPartner ? "yes" : "no", referralsYTD: c.referralsYTD,
      lastReferralDate: c.lastReferralDate, tags: c.tags.join("|"),
    }));
    downloadCsv(`companies-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} companies`);
    toast({ title: `Exported ${data.length} companies` });
  };
  const exportReferrals = () => {
    const data = activeReferrals(s).map((r) => ({
      id: r.id, patient: r.name, referralDate: r.referralDate,
      sourceCompany: companyName(s, r.companyId),
      sourceContact: r.contactId ? fullName(s.contacts.find((c) => c.id === r.contactId)!) : "",
      state: r.state, serviceType: r.serviceType, status: r.referralStatus,
      intakeStatus: r.intakeStatus, insurance: r.insuranceType,
      intakeOwner: userName(s, r.assignedIntakeOwnerId),
    }));
    downloadCsv(`referrals-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} referrals`);
    toast({ title: `Exported ${data.length} referrals` });
  };
  const exportTasks = () => {
    const data = s.tasks.map((t) => ({
      id: t.id, title: t.title, type: t.type, status: t.status, priority: t.priority,
      dueDate: t.dueDate, owner: userName(s, t.assignedUserId),
      company: companyName(s, t.companyId), notes: t.notes,
    }));
    downloadCsv(`tasks-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} tasks`);
    toast({ title: `Exported ${data.length} tasks` });
  };
  const items = [
    { id: "contacts", label: "Contacts", fn: exportContacts, count: activeContacts(s).length },
    { id: "companies", label: "Companies", fn: exportCompanies, count: activeCompanies(s).length },
    { id: "referrals", label: "Referrals", fn: exportReferrals, count: activeReferrals(s).length },
    { id: "tasks", label: "Tasks", fn: exportTasks, count: s.tasks.length },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((o) => (
        <div key={o.id} className="rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{o.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{o.count} active records</p>
            </div>
            <Button size="sm" className="h-8" onClick={o.fn}>
              <Download className="size-3 mr-1" /> Download CSV
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// Imports — paste/upload CSV → preview → commit
// ===========================================================
type ImportObject = "contacts" | "companies" | "referrals";
const IMPORT_FIELDS: Record<ImportObject, { key: string; label: string; required?: boolean }[]> = {
  contacts: [
    { key: "firstName", label: "First Name", required: true },
    { key: "lastName", label: "Last Name", required: true },
    { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
    { key: "jobTitle", label: "Job Title" }, { key: "state", label: "State" },
    { key: "companyName", label: "Company Name" },
    { key: "companyCity", label: "Company City" },
    { key: "companyState", label: "Company State" },
    { key: "companyWebsite", label: "Company Website" },
    { key: "companyPhone", label: "Company Phone" },
  ],
  companies: [
    { key: "name", label: "Name", required: true },
    { key: "companyType", label: "Type" }, { key: "city", label: "City" },
    { key: "state", label: "State" }, { key: "website", label: "Website" },
    { key: "mainPhone", label: "Phone" },
  ],
  referrals: [
    { key: "patientFirstName", label: "Patient First Name", required: true },
    { key: "patientLastInitial", label: "Patient Last Initial", required: true },
    { key: "companyName", label: "Source Company Name" },
    { key: "state", label: "State" }, { key: "serviceType", label: "Service Type" },
    { key: "insuranceType", label: "Insurance" },
  ],
};

function autoMap(headers: string[], fields: { key: string; label: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    const hit = headers.find((h) => h.toLowerCase().replace(/[\s_-]/g, "") === f.key.toLowerCase());
    const hit2 = hit ?? headers.find((h) => h.toLowerCase() === f.label.toLowerCase());
    if (hit2) map[f.key] = hit2;
  }
  return map;
}

// ---------- duplicate detection helpers (shared with imports) ----------
function normName(s?: string) { return (s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function normPhone(s?: string) { return (s || "").replace(/\D/g, ""); }
function normDomain(website?: string, email?: string): string {
  if (website) {
    try {
      const u = website.startsWith("http") ? website : `https://${website}`;
      const h = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
      if (h) return h;
    } catch { /* ignore */ }
    const h = website.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    if (h) return h;
  }
  if (email && email.includes("@")) {
    const d = email.split("@")[1]?.toLowerCase().trim();
    if (d && !/(gmail|yahoo|hotmail|outlook|aol|icloud)\./i.test(d)) return d;
  }
  return "";
}

function findContactDuplicate(
  contacts: Contact[],
  row: { firstName?: string; lastName?: string; email?: string; phone?: string; companyId?: string },
): { contact: Contact; reason: string } | null {
  if (row.email) {
    const hit = contacts.find((c) => c.email && c.email.toLowerCase() === row.email!.toLowerCase());
    if (hit) return { contact: hit, reason: "email" };
  }
  if (row.phone) {
    const p = normPhone(row.phone);
    if (p) {
      const hit = contacts.find((c) => normPhone(c.phone) === p || normPhone(c.mobilePhone) === p);
      if (hit) return { contact: hit, reason: "phone" };
    }
  }
  if (row.firstName && row.lastName && row.companyId) {
    const hit = contacts.find((c) =>
      c.companyId === row.companyId &&
      c.firstName.toLowerCase() === row.firstName!.toLowerCase() &&
      c.lastName.toLowerCase() === row.lastName!.toLowerCase());
    if (hit) return { contact: hit, reason: "name+company" };
  }
  return null;
}

function findCompanyDuplicate(
  companies: Company[],
  row: { name?: string; website?: string; phone?: string; city?: string; state?: string },
): { company: Company; reason: string } | null {
  if (row.name) {
    const n = normName(row.name);
    const hit = companies.find((c) => normName(c.name) === n);
    if (hit) return { company: hit, reason: "name" };
  }
  const d = normDomain(row.website);
  if (d) {
    const hit = companies.find((c) => normDomain(c.website) === d);
    if (hit) return { company: hit, reason: "domain" };
  }
  if (row.phone) {
    const p = normPhone(row.phone);
    if (p) {
      const hit = companies.find((c) => normPhone(c.mainPhone) === p);
      if (hit) return { company: hit, reason: "phone" };
    }
  }
  if (row.name && row.city && row.state) {
    const n = normName(row.name);
    const hit = companies.find((c) =>
      normName(c.name).includes(n.slice(0, 6)) &&
      (c.city || "").toLowerCase() === row.city!.toLowerCase() &&
      (c.state || "").toLowerCase() === row.state!.toLowerCase());
    if (hit) return { company: hit, reason: "name+city+state" };
  }
  return null;
}

type ImportMode = "skip" | "merge" | "create";
type PlanItem =
  | { kind: "create"; row: Record<string, string>; data: Record<string, unknown> }
  | { kind: "dup"; row: Record<string, string>; data: Record<string, unknown>; matchId: string; matchLabel: string; reason: string }
  | { kind: "error"; row: Record<string, string>; reason: string };

function ImportsModule() {
  const s = useCrm();
  const [object, setObject] = useState<ImportObject>("contacts");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<ImportMode>("skip");

  const onFile = async (file: File) => { const t = await file.text(); setText(t); doParse(t); };
  const doParse = (raw: string) => {
    const p = parseCsv(raw);
    setParsed(p);
    setMap(autoMap(p.headers, IMPORT_FIELDS[object]));
  };

  // Build an import plan: classify every row as create / dup / error.
  const plan: PlanItem[] = useMemo(() => {
    if (!parsed) return [];
    const items: PlanItem[] = [];
    const get = (row: Record<string, string>, k: string) => map[k] ? (row[map[k]] ?? "").trim() : "";
    for (const row of parsed.rows) {
      if (object === "contacts") {
        const firstName = get(row, "firstName"), lastName = get(row, "lastName");
        if (!firstName || !lastName) { items.push({ kind: "error", row, reason: "Missing First Name or Last Name" }); continue; }
        // resolve / detect company for this contact row
        const compName = get(row, "companyName");
        let companyId: string | undefined;
        if (compName) {
          const compMatch = findCompanyDuplicate(activeCompanies(s), {
            name: compName,
            website: get(row, "companyWebsite") || undefined,
            phone: get(row, "companyPhone") || undefined,
            city: get(row, "companyCity") || undefined,
            state: get(row, "companyState") || undefined,
          });
          companyId = compMatch?.company.id;
        }
        const data = {
          firstName, lastName,
          email: get(row, "email") || undefined,
          phone: get(row, "phone") || undefined,
          jobTitle: get(row, "jobTitle") || undefined,
          state: get(row, "state") || undefined,
          companyId,
          _companyName: compName || undefined,
          _companyCity: get(row, "companyCity") || undefined,
          _companyState: get(row, "companyState") || undefined,
          _companyWebsite: get(row, "companyWebsite") || undefined,
          _companyPhone: get(row, "companyPhone") || undefined,
        } as Record<string, unknown>;
        const dup = findContactDuplicate(activeContacts(s), { firstName, lastName, email: data.email as string | undefined, phone: data.phone as string | undefined, companyId });
        if (dup) {
          items.push({ kind: "dup", row, data, matchId: dup.contact.id, matchLabel: `${dup.contact.firstName} ${dup.contact.lastName}`, reason: dup.reason });
        } else {
          items.push({ kind: "create", row, data });
        }
      } else if (object === "companies") {
        const name = get(row, "name");
        if (!name) { items.push({ kind: "error", row, reason: "Missing Name" }); continue; }
        const data = {
          name, companyType: get(row, "companyType") || undefined,
          city: get(row, "city") || undefined, state: get(row, "state") || undefined,
          website: get(row, "website") || undefined, mainPhone: get(row, "mainPhone") || undefined,
        } as Record<string, unknown>;
        const dup = findCompanyDuplicate(activeCompanies(s), {
          name, website: data.website as string | undefined,
          phone: data.mainPhone as string | undefined,
          city: data.city as string | undefined, state: data.state as string | undefined,
        });
        if (dup) {
          items.push({ kind: "dup", row, data, matchId: dup.company.id, matchLabel: dup.company.name, reason: dup.reason });
        } else {
          items.push({ kind: "create", row, data });
        }
      } else {
        const pf = get(row, "patientFirstName"), pl = get(row, "patientLastInitial");
        if (!pf || !pl) { items.push({ kind: "error", row, reason: "Missing patient name fields" }); continue; }
        const compName = get(row, "companyName");
        const company = compName ? findCompanyDuplicate(activeCompanies(s), { name: compName })?.company : undefined;
        const data = {
          patientFirstName: pf, patientLastInitial: pl.slice(0, 1).toUpperCase(),
          companyId: company?.id,
          state: get(row, "state") || undefined,
          serviceType: get(row, "serviceType") || undefined,
          insuranceType: get(row, "insuranceType") || undefined,
        } as Record<string, unknown>;
        items.push({ kind: "create", row, data });
      }
    }
    return items;
  }, [parsed, map, object, s]);

  const counts = useMemo(() => ({
    create: plan.filter((p) => p.kind === "create").length,
    dup: plan.filter((p) => p.kind === "dup").length,
    error: plan.filter((p) => p.kind === "error").length,
  }), [plan]);

  const downloadErrorReport = () => {
    const errs = plan.filter((p): p is Extract<PlanItem, { kind: "error" }> => p.kind === "error");
    if (!parsed || !errs.length) return;
    const headers = ["__reason", ...parsed.headers];
    const rows = errs.map((e) => {
      const r: Record<string, string> = { __reason: e.reason };
      for (const h of parsed.headers) r[h] = e.row[h] ?? "";
      return r;
    });
    downloadCsv(`import-errors-${Date.now()}.csv`, rowsToCsv(rows, headers));
  };

  const commit = () => {
    if (!parsed) return;
    let created = 0, merged = 0, skipped = 0;
    const failed = counts.error;

    for (const item of plan) {
      if (item.kind === "error") continue;
      if (item.kind === "dup") {
        if (mode === "skip") { skipped++; continue; }
        if (mode === "merge") {
          if (object === "contacts") {
            crm.updateContact(item.matchId, {
              email: (item.data.email as string) || undefined,
              phone: (item.data.phone as string) || undefined,
              jobTitle: (item.data.jobTitle as string) || undefined,
              state: (item.data.state as string) || undefined,
              companyId: (item.data.companyId as string) || undefined,
            });
          } else if (object === "companies") {
            crm.updateCompany(item.matchId, {
              companyType: (item.data.companyType as string) || undefined,
              city: (item.data.city as string) || undefined,
              state: (item.data.state as string) || undefined,
              website: (item.data.website as string) || undefined,
              mainPhone: (item.data.mainPhone as string) || undefined,
            });
          }
          merged++;
          continue;
        }
        // mode === "create" — fall through to create anyway
      }
      // CREATE path
      if (object === "contacts") {
        let companyId = item.data.companyId as string | undefined;
        const compName = item.data._companyName as string | undefined;
        if (!companyId && compName) {
          // duplicate-aware: reuse existing match first
          const compMatch = findCompanyDuplicate(activeCompanies(s), {
            name: compName,
            website: item.data._companyWebsite as string | undefined,
            phone: item.data._companyPhone as string | undefined,
            city: item.data._companyCity as string | undefined,
            state: item.data._companyState as string | undefined,
          });
          companyId = compMatch?.company.id ?? crm.addCompany({
            name: compName,
            city: item.data._companyCity as string | undefined,
            state: (item.data._companyState as string) || (item.data.state as string) || undefined,
            website: item.data._companyWebsite as string | undefined,
            mainPhone: item.data._companyPhone as string | undefined,
          }).id;
        }
        crm.addContact({
          firstName: item.data.firstName as string,
          lastName: item.data.lastName as string,
          email: item.data.email as string | undefined,
          phone: item.data.phone as string | undefined,
          jobTitle: item.data.jobTitle as string | undefined,
          state: item.data.state as string | undefined,
          companyId,
        });
      } else if (object === "companies") {
        crm.addCompany({
          name: item.data.name as string,
          companyType: item.data.companyType as string | undefined,
          city: item.data.city as string | undefined,
          state: item.data.state as string | undefined,
          website: item.data.website as string | undefined,
          mainPhone: item.data.mainPhone as string | undefined,
        });
      } else {
        crm.addReferral({
          patientFirstName: item.data.patientFirstName as string,
          patientLastInitial: item.data.patientLastInitial as string,
          companyId: item.data.companyId as string | undefined,
          state: item.data.state as string | undefined,
          serviceType: item.data.serviceType as string | undefined,
          insuranceType: item.data.insuranceType as string | undefined,
        });
      }
      created++;
    }

    crm.recordImport(
      `Imported ${object}: ${created} created, ${merged} merged, ${skipped} skipped, ${failed} failed (mode: ${mode})`
    );
    toast({
      title: `Import complete`,
      description: `${created} created · ${merged} merged · ${skipped} skipped · ${failed} failed`,
    });
    setText(""); setParsed(null); setMap({});
  };

  const fields = IMPORT_FIELDS[object];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs">Import into</Label>
          <Select value={object} onValueChange={(v: ImportObject) => { setObject(v); if (parsed) setMap(autoMap(parsed.headers, IMPORT_FIELDS[v])); }}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contacts">Contacts</SelectItem>
              <SelectItem value="companies">Companies</SelectItem>
              <SelectItem value="referrals">Referrals</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <input id="csv-file" type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <Button size="sm" variant="outline" className="h-9" onClick={() => document.getElementById("csv-file")?.click()}>
            <Upload className="size-3.5 mr-1.5" /> Choose file
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or paste CSV here (first row = headers)…"
          rows={6}
          className="font-mono text-xs"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={() => doParse(text)} disabled={!text.trim()}>Parse CSV</Button>
        </div>
      </div>

      {parsed && (
        <>
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3">Column Mapping</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className="flex items-center gap-2 text-xs">
                  <span className="w-40 text-muted-foreground">
                    {f.label}{f.required && <span className="text-destructive"> *</span>}
                  </span>
                  <Select value={map[f.key] ?? "__none"} onValueChange={(v) => setMap({ ...map, [f.key]: v === "__none" ? "" : v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— ignore —</SelectItem>
                      {parsed.headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Import Review</h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Duplicate mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as ImportMode)}>
                  <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip duplicates</SelectItem>
                    <SelectItem value="merge">Merge into existing</SelectItem>
                    <SelectItem value="create">Create anyway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-background p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Will create</p>
                <p className="text-2xl font-semibold tabular-nums text-emerald-700">{counts.create}</p>
              </div>
              <div className="rounded-xl border bg-background p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Duplicates</p>
                <p className="text-2xl font-semibold tabular-nums text-amber-700">{counts.dup}</p>
              </div>
              <div className="rounded-xl border bg-background p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Errors</p>
                <p className="text-2xl font-semibold tabular-nums text-destructive">{counts.error}</p>
              </div>
            </div>

            {counts.dup > 0 && (
              <div className="rounded-xl border overflow-hidden">
                <div className="px-3 py-2 text-xs font-medium bg-muted/40">Duplicate matches (first 10)</div>
                <table className="w-full text-xs">
                  <thead className="bg-muted/20"><tr>
                    <th className="text-left px-3 py-1.5">Row</th>
                    <th className="text-left px-3 py-1.5">Matched record</th>
                    <th className="text-left px-3 py-1.5">Reason</th>
                  </tr></thead>
                  <tbody>
                    {plan.filter((p) => p.kind === "dup").slice(0, 10).map((p, i) => {
                      const dup = p as Extract<PlanItem, { kind: "dup" }>;
                      const label = object === "contacts"
                        ? `${dup.data.firstName} ${dup.data.lastName}`
                        : (dup.data.name as string) || "—";
                      return (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{label}</td>
                          <td className="px-3 py-1.5">{dup.matchLabel}</td>
                          <td className="px-3 py-1.5"><Badge variant="secondary" className="text-[10px]">{dup.reason}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {counts.error > 0 && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">{counts.error} rows will be skipped (errors).</p>
                  <Button size="sm" variant="outline" className="h-7 mt-2" onClick={downloadErrorReport}>
                    <Download className="size-3 mr-1" /> Download error report CSV
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/40">
              Source preview · first 10 of {parsed.rows.length} rows
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr>{parsed.headers.map((h) => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t">
                      {parsed.headers.map((h) => <td key={h} className="px-3 py-1.5">{r[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setParsed(null); setText(""); }}>Cancel</Button>
            <Button size="sm" onClick={commit}>Run import</Button>
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================================
// Duplicate management — real merge
// ===========================================================
function DuplicatesModule() {
  const s = useCrm();
  const [tab, setTab] = useState<"contacts" | "companies">("contacts");
  const [ignored, setIgnored] = useState<Set<string>>(new Set());

  const contactPairs = useMemo(() => {
    const out: { a: Contact; b: Contact; reason: string }[] = [];
    const cs = activeContacts(s);
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j];
        const key = `ct|${[a.id, b.id].sort().join("|")}`;
        if (ignored.has(key)) continue;
        const sameEmail = a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase();
        const samePhone = a.phone && b.phone && normPhone(a.phone) === normPhone(b.phone);
        const sameName = a.lastName && a.lastName.toLowerCase() === b.lastName.toLowerCase()
          && a.firstName?.[0]?.toLowerCase() === b.firstName?.[0]?.toLowerCase()
          && a.companyId && a.companyId === b.companyId;
        if (sameEmail || samePhone || sameName) {
          out.push({ a, b, reason: sameEmail ? "Same email" : samePhone ? "Same phone" : "Same name + company" });
        }
      }
    }
    return out;
  }, [s, ignored]);

  const companyPairs = useMemo(() => {
    const out: { a: Company; b: Company; reason: string }[] = [];
    const cs = activeCompanies(s);
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j];
        const key = `co|${[a.id, b.id].sort().join("|")}`;
        if (ignored.has(key)) continue;
        const sameName = normName(a.name) && normName(a.name) === normName(b.name);
        const da = normDomain(a.website, a.generalEmail);
        const db = normDomain(b.website, b.generalEmail);
        const sameDomain = da && da === db;
        const sameMain = a.mainPhone && b.mainPhone && normPhone(a.mainPhone) === normPhone(b.mainPhone);
        const sameNCS = a.name && b.name && a.city && b.city && a.state && b.state
          && normName(a.name).slice(0, 6) === normName(b.name).slice(0, 6)
          && a.city.toLowerCase() === b.city.toLowerCase()
          && a.state.toLowerCase() === b.state.toLowerCase();
        if (sameName || sameDomain || sameMain || sameNCS) {
          const reason = sameName ? "Same company name"
            : sameDomain ? "Same website domain"
            : sameMain ? "Same phone"
            : "Same name + city + state";
          out.push({ a, b, reason });
        }
      }
    }
    return out;
  }, [s, ignored]);

  const mergeContact = (winner: Contact, loser: Contact) => {
    crm.mergeContacts(winner.id, loser.id);
    toast({ title: `Merged "${loser.firstName} ${loser.lastName}" into "${winner.firstName} ${winner.lastName}"` });
  };
  const mergeCompany = (winner: Company, loser: Company) => {
    crm.mergeCompanies(winner.id, loser.id);
    toast({ title: `Merged "${loser.name}" into "${winner.name}"` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant={tab === "contacts" ? "default" : "outline"} className="h-8" onClick={() => setTab("contacts")}>
          Contacts <Badge variant="secondary" className="ml-2 text-[10px]">{contactPairs.length}</Badge>
        </Button>
        <Button size="sm" variant={tab === "companies" ? "default" : "outline"} className="h-8" onClick={() => setTab("companies")}>
          Companies <Badge variant="secondary" className="ml-2 text-[10px]">{companyPairs.length}</Badge>
        </Button>
      </div>

      {tab === "contacts" && (
        <>
          {contactPairs.length === 0 && (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              No likely contact duplicates detected.
            </div>
          )}
          {contactPairs.map((p) => {
            const key = `ct|${[p.a.id, p.b.id].sort().join("|")}`;
            return (
              <div key={key} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Possible contact duplicate</h3>
                  <Badge variant="secondary" className="text-[10px]">{p.reason}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[p.a, p.b].map((c, idx) => {
                    const other = idx === 0 ? p.b : p.a;
                    return (
                      <div key={c.id} className="rounded-xl border p-3 text-sm space-y-1">
                        <p className="font-medium">{fullName(c)}</p>
                        <p className="text-xs text-muted-foreground">{c.email || "no email"}</p>
                        <p className="text-xs text-muted-foreground">{c.phone || "no phone"}</p>
                        <p className="text-xs text-muted-foreground">{c.jobTitle || "—"} · {c.referralCount} referrals</p>
                        <p className="text-xs text-muted-foreground">{companyName(s, c.companyId)}</p>
                        <Button size="sm" className="h-7 mt-2 w-full" onClick={() => mergeContact(c, other)}>
                          Keep this · merge other in
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm" variant="outline" onClick={() => setIgnored(new Set([...ignored, key]))}>Not a duplicate</Button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === "companies" && (
        <>
          {companyPairs.length === 0 && (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              No likely company duplicates detected.
            </div>
          )}
          {companyPairs.map((p) => {
            const key = `co|${[p.a.id, p.b.id].sort().join("|")}`;
            return (
              <div key={key} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Possible company duplicate</h3>
                  <Badge variant="secondary" className="text-[10px]">{p.reason}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[p.a, p.b].map((c, idx) => {
                    const other = idx === 0 ? p.b : p.a;
                    const contactCount = s.contacts.filter((x) => x.companyId === c.id && !x.deletedAt).length;
                    return (
                      <div key={c.id} className="rounded-xl border p-3 text-sm space-y-1">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.website || "no website"}</p>
                        <p className="text-xs text-muted-foreground">{c.mainPhone || "no phone"}</p>
                        <p className="text-xs text-muted-foreground">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</p>
                        <p className="text-xs text-muted-foreground">{contactCount} contacts · {c.referralCount} referrals</p>
                        <Button size="sm" className="h-7 mt-2 w-full" onClick={() => mergeCompany(c, other)}>
                          Keep this · merge other in
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm" variant="outline" onClick={() => setIgnored(new Set([...ignored, key]))}>Not a duplicate</Button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ===========================================================
// Settings + Users + Deleted
// ===========================================================
function SettingsModule() {
  const s = useCrm();
  const [object, setObject] = useState<"contact" | "company" | "referral">("contact");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"text" | "number" | "date" | "select" | "boolean">("text");

  const add = () => {
    if (!label.trim()) { toast({ title: "Field label required" }); return; }
    crm.addCustomField({ object, label: label.trim(), type });
    setLabel("");
    toast({ title: "Field added" });
  };

  const fields = s.customFields;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">General</h3>
        <p className="text-xs text-muted-foreground mt-1">CRM-wide preferences.</p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between"><span>Default territory by state</span><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><span>Auto-create welcome task on new contact</span><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><span>Notify owner on referral received</span><Switch defaultChecked /></div>
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">Custom Fields</h3>
        <p className="text-xs text-muted-foreground mt-1">Add custom fields to Contacts, Companies, or Referrals.</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Field label" className="h-9 text-sm" />
          <Select value={object} onValueChange={(v: "contact" | "company" | "referral") => setObject(v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => setType(v as "text" | "number" | "date" | "select" | "boolean")}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["text", "number", "date", "select", "boolean"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-9" onClick={add}><Plus className="size-3.5 mr-1" /> Add</Button>
        </div>
        <div className="mt-4 divide-y text-sm">
          {fields.length === 0 && <p className="text-xs text-muted-foreground py-4">No custom fields yet.</p>}
          {fields.map((f) => (
            <div key={f.id} className="py-2 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.object} · {f.type}</p>
              </div>
              <button onClick={() => { crm.removeCustomField(f.id); toast({ title: "Field removed" }); }} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// Files / Attachments module
// ===========================================================
function FilesModule() {
  const s = useCrm();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const objectLabel = (a: Attachment): string => {
    if (a.objectType === "contact") {
      const c = s.contacts.find((x) => x.id === a.objectId); return c ? fullName(c) : a.objectId;
    }
    if (a.objectType === "company") return s.companies.find((x) => x.id === a.objectId)?.name ?? a.objectId;
    return s.referrals.find((x) => x.id === a.objectId)?.name ?? a.objectId;
  };
  const rows = s.attachments.filter((a) => {
    if (type !== "all" && a.objectType !== type) return false;
    if (q && !a.fileName.toLowerCase().includes(q.toLowerCase()) && !objectLabel(a).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All objects</SelectItem>
            <SelectItem value="contact">Contacts</SelectItem>
            <SelectItem value="company">Companies</SelectItem>
            <SelectItem value="referral">Referrals</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">File</th>
                <th className="text-left px-3 py-2 font-medium">Attached to</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-left px-3 py-2 font-medium">Uploaded by</th>
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{a.fileName}</span>
                  </td>
                  <td className="px-3 py-2"><span className="text-muted-foreground capitalize">{a.objectType}: </span>{objectLabel(a)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.category || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, a.uploadedByUserId)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(a.uploadedAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { crm.removeAttachment(a.id); toast({ title: "File removed" }); }} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-10">No files yet. Attach from a contact, company, or referral.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// Audit Log module
// ===========================================================
const AUDIT_ICON: Record<string, typeof Activity> = {
  create: Plus, update: Pencil, delete: Trash2, restore: RotateCcw,
  merge: ShieldCheck, import: Upload, export: Download,
  workflow_toggle: Workflow, workflow_run: Workflow,
  attachment_added: Paperclip, attachment_removed: Paperclip,
  field_added: Settings2, field_removed: Settings2,
};

function AuditModule() {
  const s = useCrm();
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("all");
  const rows = s.auditLog.filter((r) => {
    if (action !== "all" && r.action !== action) return false;
    if (q) {
      const ql = q.toLowerCase();
      if (!r.summary.toLowerCase().includes(ql) && !(r.objectLabel ?? "").toLowerCase().includes(ql) && !r.actor.toLowerCase().includes(ql)) return false;
    }
    return true;
  });
  const actions = Array.from(new Set(s.auditLog.map((r) => r.action)));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search audit log…" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">When</th>
                <th className="text-left px-3 py-2 font-medium">Actor</th>
                <th className="text-left px-3 py-2 font-medium">Action</th>
                <th className="text-left px-3 py-2 font-medium">Object</th>
                <th className="text-left px-3 py-2 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const Icon = AUDIT_ICON[r.action] ?? Activity;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{new Date(r.at).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.actor}</td>
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5 text-xs"><Icon className="size-3" /> {r.action}</span></td>
                    <td className="px-3 py-2"><span className="text-muted-foreground capitalize">{r.objectType}: </span>{r.objectLabel || r.objectId || "—"}</td>
                    <td className="px-3 py-2">{r.summary}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-10">No audit entries.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// Activities center
// ===========================================================
const ACTIVITY_ICON: Partial<Record<ActivityEvent["type"], typeof Activity>> = {
  note: StickyNote, call: Phone, email: Mail, meeting: Calendar, task: ListChecks,
  referral_received: HeartHandshake, file_uploaded: Paperclip,
};
const ACTIVITY_FILTERS: { id: "all" | ActivityEvent["type"]; label: string }[] = [
  { id: "all", label: "All" }, { id: "note", label: "Notes" }, { id: "call", label: "Calls" },
  { id: "email", label: "Emails" }, { id: "meeting", label: "Meetings" },
  { id: "task", label: "Tasks" }, { id: "referral_received", label: "Referrals" },
  { id: "file_uploaded", label: "Files" },
];

function ActivitiesModule() {
  const s = useCrm();
  const [f, setF] = useState<"all" | ActivityEvent["type"]>("all");
  const rows = s.activity.filter((a) => f === "all" || a.type === f);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {ACTIVITY_FILTERS.map((x) => (
          <button key={x.id} onClick={() => setF(x.id)}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-colors",
              f === x.id ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted")}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border bg-card divide-y">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No activity in this view.</p>}
        {rows.map((a) => {
          const Icon = ACTIVITY_ICON[a.type] ?? Activity;
          const targetName = a.contactId
            ? fullName(s.contacts.find((c) => c.id === a.contactId) ?? { firstName: "?", lastName: "" } as Contact)
            : a.companyId
              ? companyName(s, a.companyId)
              : a.referralId
                ? (s.referrals.find((r) => r.id === a.referralId)?.name ?? "—")
                : "—";
          return (
            <div key={a.id} className="px-4 py-3 flex items-start gap-3 text-sm">
              <div className="size-7 rounded-lg bg-muted grid place-items-center shrink-0">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="capitalize">{a.type.replace("_", " ")}</span> · {targetName} · {fmtDate(a.createdAt)}{a.userId ? ` · ${userName(s, a.userId)}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================
// Edit dialogs
// ===========================================================
function EditContactDialog({ id, open, onOpenChange }: { id: ID | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useCrm();
  const c = s.contacts.find((x) => x.id === id);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", state: "", companyId: "", ownerId: "", notes: "" });
  useEffect(() => {
    if (c) setF({
      firstName: c.firstName, lastName: c.lastName, email: c.email ?? "", phone: c.phone ?? "",
      jobTitle: c.jobTitle ?? "", state: c.state ?? "", companyId: c.companyId ?? "",
      ownerId: c.ownerId ?? "", notes: c.notes ?? "",
    });
  }, [c?.id, open]);
  if (!c) return null;
  const save = () => {
    crm.updateContact(c.id, {
      firstName: f.firstName, lastName: f.lastName, email: f.email || undefined, phone: f.phone || undefined,
      jobTitle: f.jobTitle || undefined, state: f.state || undefined,
      companyId: f.companyId || undefined, ownerId: f.ownerId || undefined, notes: f.notes || undefined,
    });
    toast({ title: "Contact updated" });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First name</Label><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
          <div><Label className="text-xs">Last name</Label><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label className="text-xs">Title</Label><Input value={f.jobTitle} onChange={(e) => setF({ ...f, jobTitle: e.target.value })} /></div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Company</Label>
            <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{s.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Owner</Label>
            <Select value={f.ownerId} onValueChange={(v) => setF({ ...f, ownerId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({ id, open, onOpenChange }: { id: ID | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useCrm();
  const c = s.companies.find((x) => x.id === id);
  const [f, setF] = useState({ name: "", companyType: "", city: "", state: "", website: "", mainPhone: "", ownerId: "", relationshipTier: "", notes: "" });
  useEffect(() => {
    if (c) setF({
      name: c.name, companyType: c.companyType ?? "", city: c.city ?? "", state: c.state ?? "",
      website: c.website ?? "", mainPhone: c.mainPhone ?? "", ownerId: c.ownerId ?? "",
      relationshipTier: c.relationshipTier ?? "", notes: c.notes ?? "",
    });
  }, [c?.id, open]);
  if (!c) return null;
  const save = () => {
    crm.updateCompany(c.id, {
      name: f.name, companyType: f.companyType || undefined,
      city: f.city || undefined, state: f.state || undefined,
      website: f.website || undefined, mainPhone: f.mainPhone || undefined,
      ownerId: f.ownerId || undefined,
      relationshipTier: (f.relationshipTier || undefined) as Company["relationshipTier"],
      notes: f.notes || undefined,
    });
    toast({ title: "Company updated" });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label className="text-xs">Type</Label><Input value={f.companyType} onChange={(e) => setF({ ...f, companyType: e.target.value })} /></div>
          <div><Label className="text-xs">Website</Label><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
          <div><Label className="text-xs">City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Phone</Label><Input value={f.mainPhone} onChange={(e) => setF({ ...f, mainPhone: e.target.value })} /></div>
          <div><Label className="text-xs">Owner</Label>
            <Select value={f.ownerId} onValueChange={(v) => setF({ ...f, ownerId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Tier</Label>
            <Select value={f.relationshipTier} onValueChange={(v) => setF({ ...f, relationshipTier: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{["Tier A", "Tier B", "Tier C"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditReferralDialog({ id, open, onOpenChange }: { id: ID | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useCrm();
  const r = s.referrals.find((x) => x.id === id);
  const [f, setF] = useState({ patientFirstName: "", patientLastInitial: "", referralStatus: "New", intakeStatus: "", serviceType: "", insuranceType: "", state: "", companyId: "", contactId: "", assignedIntakeOwnerId: "", notes: "" });
  const [logging, setLogging] = useState(false);
  useEffect(() => {
    if (r) setF({
      patientFirstName: r.patientFirstName, patientLastInitial: r.patientLastInitial,
      referralStatus: r.referralStatus, intakeStatus: r.intakeStatus ?? "",
      serviceType: r.serviceType ?? "", insuranceType: r.insuranceType ?? "",
      state: r.state ?? "", companyId: r.companyId ?? "", contactId: r.contactId ?? "",
      assignedIntakeOwnerId: r.assignedIntakeOwnerId ?? "", notes: r.notes ?? "",
    });
  }, [r?.id, open]);
  if (!r) return null;
  const save = () => {
    crm.updateReferral(r.id, {
      patientFirstName: f.patientFirstName, patientLastInitial: f.patientLastInitial,
      name: `${f.patientFirstName} ${f.patientLastInitial}.`,
      referralStatus: f.referralStatus as Referral["referralStatus"],
      intakeStatus: f.intakeStatus || undefined,
      serviceType: f.serviceType || undefined, insuranceType: f.insuranceType || undefined,
      state: f.state || undefined, companyId: f.companyId || undefined,
      contactId: f.contactId || undefined,
      assignedIntakeOwnerId: f.assignedIntakeOwnerId || undefined,
      notes: f.notes || undefined,
    });
    toast({ title: "Referral updated" });
    onOpenChange(false);
  };
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Referral</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Patient first name</Label><Input value={f.patientFirstName} onChange={(e) => setF({ ...f, patientFirstName: e.target.value })} /></div>
          <div><Label className="text-xs">Last initial</Label><Input value={f.patientLastInitial} onChange={(e) => setF({ ...f, patientLastInitial: e.target.value.slice(0, 1).toUpperCase() })} /></div>
          <div><Label className="text-xs">Status</Label>
            <Select value={f.referralStatus} onValueChange={(v) => setF({ ...f, referralStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["New", "In Review", "Intake Form Sent", "Scheduled", "Active", "Closed", "Lost"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Intake status</Label><Input value={f.intakeStatus} onChange={(e) => setF({ ...f, intakeStatus: e.target.value })} /></div>
          <div><Label className="text-xs">Service type</Label><Input value={f.serviceType} onChange={(e) => setF({ ...f, serviceType: e.target.value })} /></div>
          <div><Label className="text-xs">Insurance</Label><Input value={f.insuranceType} onChange={(e) => setF({ ...f, insuranceType: e.target.value })} /></div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Source company</Label>
            <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{s.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setLogging(true)}>
            <Activity className="size-3.5 mr-1" /> Log Activity
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <LogActivityDialog open={logging} onOpenChange={setLogging} referralId={r.id} />
    </>
  );
}

// ===========================================================
// Log activity dialog (Note / Call / Email / Meeting / Task / File)
// ===========================================================
const LOG_TYPES: { id: ActivityEvent["type"]; label: string; icon: typeof Activity }[] = [
  { id: "note", label: "Note", icon: StickyNote },
  { id: "call", label: "Call", icon: Phone },
  { id: "email", label: "Email", icon: Mail },
  { id: "meeting", label: "Meeting", icon: Calendar },
  { id: "task", label: "Task", icon: ListChecks },
  { id: "file_uploaded", label: "File", icon: FileUp },
];

function LogActivityDialog({ open, onOpenChange, contactId, companyId, referralId }:
  { open: boolean; onOpenChange: (o: boolean) => void; contactId?: ID; companyId?: ID; referralId?: ID }) {
  const [type, setType] = useState<ActivityEvent["type"]>("note");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const reset = () => { setMessage(""); setFileName(""); setTaskTitle(""); setTaskDue(""); setType("note"); };

  const submit = () => {
    if (type === "task") {
      if (!taskTitle.trim()) { toast({ title: "Task title required" }); return; }
      crm.addTask({ title: taskTitle, type: "Other", contactId, companyId, referralId, dueDate: taskDue || undefined });
    } else if (type === "file_uploaded") {
      if (!fileName.trim()) { toast({ title: "File name required" }); return; }
      const objectType = contactId ? "contact" : companyId ? "company" : referralId ? "referral" : "contact";
      const objectId = (contactId ?? companyId ?? referralId)!;
      crm.addAttachment({ fileName, objectType, objectId, category: "Other" });
    } else {
      if (!message.trim()) { toast({ title: "Add a message" }); return; }
      crm.logCustomActivity({ type, message, contactId, companyId, referralId });
    }
    toast({ title: "Activity logged" });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-1.5">
          {LOG_TYPES.map((lt) => {
            const I = lt.icon;
            return (
              <button key={lt.id} onClick={() => setType(lt.id)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5",
                  type === lt.id ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-transparent hover:bg-muted")}>
                <I className="size-3.5" /> {lt.label}
              </button>
            );
          })}
        </div>
        {type === "task" ? (
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Task title</Label><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /></div>
            <div><Label className="text-xs">Due date</Label><Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></div>
          </div>
        ) : type === "file_uploaded" ? (
          <div className="space-y-2 mt-2">
            <Label className="text-xs">File name</Label>
            <Input placeholder="e.g. Welcome packet.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Metadata only — no upload required.</p>
          </div>
        ) : (
          <Textarea placeholder={`Log a ${type}…`} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PERMISSIONS = ["View", "Edit", "Delete", "Import", "Export", "Manage Users"];
const ROLES = [
  { id: "admin", name: "Admin", perms: [true, true, true, true, true, true] },
  { id: "marketing_director", name: "Marketing Director", perms: [true, true, true, true, true, false] },
  { id: "outreach_rep", name: "Outreach Rep", perms: [true, true, false, false, true, false] },
  { id: "intake", name: "Intake Team", perms: [true, true, false, false, false, false] },
  { id: "state_director", name: "State Director", perms: [true, false, false, false, true, false] },
  { id: "read_only", name: "Read Only", perms: [true, false, false, false, false, false] },
];

function UsersModule() {
  const s = useCrm();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">Users</h3>
        <div className="mt-3 divide-y text-sm">
          {s.users.map((u) => (
            <div key={u.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}{u.state ? ` · ${u.state}` : ""}</p>
              </div>
              <Badge variant="secondary">{u.role.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 overflow-x-auto">
        <h3 className="font-semibold">Permission Matrix</h3>
        <table className="w-full mt-3 text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="text-left py-2">Role</th>
              {PERMISSIONS.map((p) => <th key={p} className="text-center px-2">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 font-medium">{r.name}</td>
                {r.perms.map((on, i) => (
                  <td key={i} className="text-center px-2">
                    {on ? <CheckCircle2 className="size-4 text-emerald-600 inline" /> : <X className="size-4 text-muted-foreground inline" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeletedModule() {
  const s = useCrm();
  const c = s.contacts.filter((x) => x.deletedAt);
  const co = s.companies.filter((x) => x.deletedAt);
  const r = s.referrals.filter((x) => x.deletedAt);

  const Section = ({ title, items, restore, hardDelete }: { title: string; items: { id: ID; label: string; deletedAt?: string }[]; restore: (id: ID) => void; hardDelete?: (id: ID) => void }) => (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here.</p> : (
        <div className="divide-y text-sm">
          {items.map((i) => (
            <div key={i.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{i.label}</p>
                <p className="text-xs text-muted-foreground">Deleted {fmtDate(i.deletedAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7" onClick={() => restore(i.id)}><RotateCcw className="size-3 mr-1" /> Restore</Button>
                {hardDelete && <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => hardDelete(i.id)}>Delete forever</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Deleted Contacts" items={c.map((x) => ({ id: x.id, label: fullName(x), deletedAt: x.deletedAt }))}
        restore={crm.restoreContact} hardDelete={crm.hardDeleteContact} />
      <Section title="Deleted Companies" items={co.map((x) => ({ id: x.id, label: x.name, deletedAt: x.deletedAt }))}
        restore={crm.restoreCompany} hardDelete={crm.hardDeleteCompany} />
      <Section title="Deleted Referrals" items={r.map((x) => ({ id: x.id, label: x.name, deletedAt: x.deletedAt }))}
        restore={crm.restoreReferral} />
    </div>
  );
}

// ===========================================================
// Detail drawer (contact + company)
// ===========================================================
function ContactDrawer({ id, onClose, onOpenCompany }: { id: ID | null; onClose: () => void; onOpenCompany: (id: ID) => void }) {
  const s = useCrm();
  const c = s.contacts.find((x) => x.id === id);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [logging, setLogging] = useState(false);
  if (!c) return null;
  const events = s.activity.filter((a) => a.contactId === c.id);
  const cTasks = s.tasks.filter((t) => t.contactId === c.id);
  const cRefs = s.referrals.filter((r) => r.contactId === c.id);
  const cFiles = s.attachments.filter((a) => a.objectType === "contact" && a.objectId === c.id);

  return (
    <>
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{fullName(c)}</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">{c.jobTitle || "—"}{c.companyId ? <> · <button className="hover:text-primary" onClick={() => onOpenCompany(c.companyId!)}>{companyName(s, c.companyId)}</button></> : null}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(true)}><Pencil className="size-3 mr-1.5" /> Edit</Button>
            <Button size="sm" className="h-8" onClick={() => setLogging(true)}><Plus className="size-3 mr-1.5" /> Log activity</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">Email</p><p>{c.email || "—"}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{c.phone || "—"}</p></div>
            <div><p className="text-muted-foreground">State</p><p>{c.state || "—"}</p></div>
            <div><p className="text-muted-foreground">Owner</p><p>{userName(s, c.ownerId)}</p></div>
            <div><p className="text-muted-foreground">Referrals</p><p>{c.referralCount}</p></div>
            <div><p className="text-muted-foreground">Last referral</p><p>{fmtDate(c.lastReferralDate)}</p></div>
            <div><p className="text-muted-foreground">Lunch & Learn</p><p>{c.lunchLearnStatus}</p></div>
            <div><p className="text-muted-foreground">Relationship</p><p>{c.relationshipStrength}</p></div>
          </div>
          <div className="flex flex-wrap gap-1">{c.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Add Note</h4>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a quick note…" />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={() => { if (!note.trim()) return; crm.addNote(note, { contactId: c.id, companyId: c.companyId }); setNote(""); toast({ title: "Note added" }); }}>Add</Button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Referrals ({cRefs.length})</h4>
            <div className="divide-y border rounded-xl">
              {cRefs.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                cRefs.map((r) => <div key={r.id} className="px-3 py-2 flex justify-between text-xs"><span>{r.name}</span><span className="text-muted-foreground">{fmtDate(r.referralDate)}</span></div>)}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tasks ({cTasks.length})</h4>
            <div className="divide-y border rounded-xl">
              {cTasks.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                cTasks.map((t) => <div key={t.id} className="px-3 py-2 flex justify-between text-xs"><span>{t.title}</span><span className="text-muted-foreground">{fmtDate(t.dueDate)}</span></div>)}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Files ({cFiles.length})</h4>
            <div className="divide-y border rounded-xl">
              {cFiles.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                cFiles.map((a) => (
                  <div key={a.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{a.fileName}</span>
                    <span className="text-muted-foreground">{fmtDate(a.uploadedAt)}</span>
                    <button onClick={() => crm.removeAttachment(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Activity Timeline</h4>
            <ActivityTimeline events={events} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
    <EditContactDialog id={c.id} open={editing} onOpenChange={setEditing} />
    <LogActivityDialog open={logging} onOpenChange={setLogging} contactId={c.id} companyId={c.companyId} />
    </>
  );
}

function CompanyDrawer({ id, onClose, onOpenContact }: { id: ID | null; onClose: () => void; onOpenContact: (id: ID) => void }) {
  const s = useCrm();
  const c = s.companies.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [logging, setLogging] = useState(false);
  if (!c) return null;
  const associated = s.contacts.filter((x) => x.companyId === c.id && !x.deletedAt);
  const cRefs = s.referrals.filter((r) => r.companyId === c.id);
  const cTasks = s.tasks.filter((t) => t.companyId === c.id);
  const events = s.activity.filter((a) => a.companyId === c.id);
  const cFiles = s.attachments.filter((a) => a.objectType === "company" && a.objectId === c.id);

  return (
    <>
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{c.name}</SheetTitle></SheetHeader>
        <div className="mt-2 space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">{c.companyType || "—"} · {c.city || ""}{c.city && c.state ? ", " : ""}{c.state || ""}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(true)}><Pencil className="size-3 mr-1.5" /> Edit</Button>
            <Button size="sm" className="h-8" onClick={() => setLogging(true)}><Plus className="size-3 mr-1.5" /> Log activity</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">Website</p><p>{c.website || "—"}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{c.mainPhone || "—"}</p></div>
            <div><p className="text-muted-foreground">Owner</p><p>{userName(s, c.ownerId)}</p></div>
            <div><p className="text-muted-foreground">Tier</p><p>{c.relationshipTier || "—"}</p></div>
            <div><p className="text-muted-foreground">YTD Referrals</p><p>{c.referralsYTD}</p></div>
            <div><p className="text-muted-foreground">Last referral</p><p>{fmtDate(c.lastReferralDate)}</p></div>
          </div>
          <div className="flex flex-wrap gap-1">{c.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Associated Contacts ({associated.length})</h4>
            <div className="divide-y border rounded-xl">
              {associated.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                associated.map((x) => <button key={x.id} className="w-full px-3 py-2 flex justify-between text-xs hover:bg-muted/40" onClick={() => onOpenContact(x.id)}>
                  <span>{fullName(x)}</span><span className="text-muted-foreground">{x.jobTitle}</span>
                </button>)}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Referrals ({cRefs.length})</h4>
            <div className="divide-y border rounded-xl">
              {cRefs.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                cRefs.map((r) => <div key={r.id} className="px-3 py-2 flex justify-between text-xs"><span>{r.name}</span><span className="text-muted-foreground">{fmtDate(r.referralDate)}</span></div>)}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tasks ({cTasks.length})</h4>
            <div className="divide-y border rounded-xl">
              {cTasks.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                cTasks.map((t) => <div key={t.id} className="px-3 py-2 flex justify-between text-xs"><span>{t.title}</span><span className="text-muted-foreground">{fmtDate(t.dueDate)}</span></div>)}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Files ({cFiles.length})</h4>
            <div className="divide-y border rounded-xl">
              {cFiles.length === 0 ? <p className="text-xs text-muted-foreground px-3 py-2">None.</p> :
                cFiles.map((a) => (
                  <div key={a.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{a.fileName}</span>
                    <span className="text-muted-foreground">{fmtDate(a.uploadedAt)}</span>
                    <button onClick={() => crm.removeAttachment(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Activity Timeline</h4>
            <ActivityTimeline events={events} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
    <EditCompanyDialog id={c.id} open={editing} onOpenChange={setEditing} />
    <LogActivityDialog open={logging} onOpenChange={setLogging} companyId={c.id} />
    </>
  );
}

function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <p className="text-xs text-muted-foreground">No activity.</p>;
  return (
    <div className="space-y-2">
      {events.map((a) => {
        const Icon = ACTIVITY_ICON[a.type] ?? Activity;
        return (
          <div key={a.id} className="flex items-start gap-2 text-xs">
            <Icon className="size-3.5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p>{a.message}</p>
              <p className="text-muted-foreground">
                <span className="capitalize">{a.type.replace("_", " ")}</span> · {fmtDate(a.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================
// Global Search
// ===========================================================
function GlobalSearchModule({
  onOpenContact, onOpenCompany, onJumpModule,
}: {
  onOpenContact: (id: ID) => void;
  onOpenCompany: (id: ID) => void;
  onJumpModule: (m: ModuleId) => void;
}) {
  const s = useCrm();
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();

  const tokens = ql.split(/\s+/).filter(Boolean);
  const match = (hay: string) => {
    if (!ql) return false;
    const h = hay.toLowerCase();
    return tokens.every((t) => h.includes(t));
  };

  const results = useMemo(() => {
    if (!ql) return null;
    const companies = activeCompanies(s).filter((c) => match([
      c.name, c.companyType, c.state, c.city, c.mainPhone, c.generalEmail, c.website,
      c.referralPartnerStatus, c.tags.join(" "), c.notes,
    ].filter(Boolean).join(" ")));
    const contacts = activeContacts(s).filter((c) => match([
      fullName(c), c.email, c.phone, c.mobilePhone, c.jobTitle, c.specialty,
      c.state, c.referralSourceType, c.referralPartnerStatus,
      companyName(s, c.companyId), c.tags.join(" "), c.notes,
    ].filter(Boolean).join(" ")));
    const referrals = activeReferrals(s).filter((r) => match([
      r.name, r.patientFirstName, r.patientLastInitial, r.state, r.serviceType,
      r.referralStatus, r.intakeStatus, r.insuranceType, r.notes,
      companyName(s, r.companyId),
    ].filter(Boolean).join(" ")));
    const tasks = s.tasks.filter((t) => match([
      t.title, t.type, t.status, t.priority, t.notes,
      userName(s, t.assignedUserId), companyName(s, t.companyId),
    ].filter(Boolean).join(" ")));
    const activities = s.activity.filter((a) => match([
      a.message, a.type,
      a.contactId ? fullName(s.contacts.find((c) => c.id === a.contactId)!) : "",
      companyName(s, a.companyId),
    ].filter(Boolean).join(" ")));
    return { companies, contacts, referrals, tasks, activities };
  }, [s, ql]);

  const total = results
    ? results.companies.length + results.contacts.length + results.referrals.length + results.tasks.length + results.activities.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5">
        <SectionHeader title="Global Search"
          subtitle="Search across contacts, companies, referrals, tasks, activity, emails, phones, and tags." />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder='Try "Bright Path", "Sarah Miller", "NC pediatrician", or a phone number'
            className="pl-9 h-10" />
        </div>
        {q && (
          <p className="mt-2 text-xs text-muted-foreground">
            {total} result{total === 1 ? "" : "s"} for “{q}”
          </p>
        )}
      </div>

      {!results && (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Start typing to search the entire CRM.
        </div>
      )}

      {results && total === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No matches. Try a company name, contact name, state, phone, or tag.
        </div>
      )}

      {results && results.companies.length > 0 && (
        <ResultGroup label="Companies" count={results.companies.length} icon={Building2}>
          {results.companies.slice(0, 25).map((c) => (
            <ResultRow key={c.id} onClick={() => onOpenCompany(c.id)}
              title={c.name}
              meta={`${c.companyType ?? "—"} · ${c.state ?? "—"} · ${c.referralCount} referrals`}
              detail={[c.mainPhone, c.generalEmail, c.website, c.tags.join(", ")].filter(Boolean).join(" · ")} />
          ))}
        </ResultGroup>
      )}

      {results && results.contacts.length > 0 && (
        <ResultGroup label="Contacts" count={results.contacts.length} icon={Users}>
          {results.contacts.slice(0, 25).map((c) => (
            <ResultRow key={c.id} onClick={() => onOpenContact(c.id)}
              title={fullName(c)}
              meta={`${c.jobTitle ?? "—"} · ${companyName(s, c.companyId)} · ${c.state ?? "—"}`}
              detail={[c.email, c.phone, c.referralSourceType, c.tags.join(", ")].filter(Boolean).join(" · ")} />
          ))}
        </ResultGroup>
      )}

      {results && results.referrals.length > 0 && (
        <ResultGroup label="Referrals" count={results.referrals.length} icon={HeartHandshake}
          onJump={() => onJumpModule("referrals")}>
          {results.referrals.slice(0, 25).map((r) => (
            <ResultRow key={r.id}
              onClick={() => r.companyId && onOpenCompany(r.companyId)}
              title={r.name}
              meta={`${companyName(s, r.companyId)} · ${r.state ?? "—"} · ${r.referralStatus}`}
              detail={`${fmtDate(r.referralDate)}${r.serviceType ? ` · ${r.serviceType}` : ""}${r.insuranceType ? ` · ${r.insuranceType}` : ""}`} />
          ))}
        </ResultGroup>
      )}

      {results && results.tasks.length > 0 && (
        <ResultGroup label="Tasks" count={results.tasks.length} icon={ListChecks}
          onJump={() => onJumpModule("tasks")}>
          {results.tasks.slice(0, 25).map((t) => (
            <ResultRow key={t.id}
              onClick={() => t.companyId ? onOpenCompany(t.companyId) : t.contactId && onOpenContact(t.contactId)}
              title={t.title}
              meta={`${t.type} · ${t.status} · ${userName(s, t.assignedUserId)}`}
              detail={`${t.dueDate ? `due ${fmtDate(t.dueDate)}` : "no due date"}${t.companyId ? ` · ${companyName(s, t.companyId)}` : ""}`} />
          ))}
        </ResultGroup>
      )}

      {results && results.activities.length > 0 && (
        <ResultGroup label="Activity & Notes" count={results.activities.length} icon={Activity}
          onJump={() => onJumpModule("activities")}>
          {results.activities.slice(0, 25).map((a) => {
            const ct = a.contactId ? s.contacts.find((c) => c.id === a.contactId) : undefined;
            return (
              <ResultRow key={a.id}
                onClick={() => a.companyId ? onOpenCompany(a.companyId) : a.contactId && onOpenContact(a.contactId)}
                title={a.message}
                meta={`${a.type.replace("_", " ")} · ${fmtDate(a.createdAt)}`}
                detail={[ct ? fullName(ct) : "", companyName(s, a.companyId)].filter((x) => x && x !== "—").join(" · ")} />
            );
          })}
        </ResultGroup>
      )}
    </div>
  );
}

function ResultGroup({
  label, count, icon: Icon, onJump, children,
}: {
  label: string; count: number; icon: typeof Users; onJump?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{label}</h3>
          <Badge variant="secondary" className="tabular-nums">{count}</Badge>
        </div>
        {onJump && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onJump}>
            Open module <ChevronRight className="size-3 ml-1" />
          </Button>
        )}
      </div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function ResultRow({ title, meta, detail, onClick }: {
  title: string; meta?: string; detail?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left py-2.5 px-1 hover:bg-muted/40 rounded-md transition-colors flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title}</p>
        {meta && <p className="text-xs text-muted-foreground truncate">{meta}</p>}
        {detail && <p className="text-[11px] text-muted-foreground/80 truncate">{detail}</p>}
      </div>
      <ChevronRight className="size-4 text-muted-foreground mt-1 shrink-0" />
    </button>
  );
}

// ===========================================================
// Page shell with internal nav
// ===========================================================
export default function ReferralCRM() {
  const [module, setModule] = useState<ModuleId>("dashboard");
  const [contactId, setContactId] = useState<ID | null>(null);
  const [companyId, setCompanyId] = useState<ID | null>(null);

  const body = (() => {
    switch (module) {
      case "dashboard": return <DashboardModule />;
      case "contacts": return <ContactsModule onOpenContact={setContactId} onOpenCompany={setCompanyId} />;
      case "companies": return <CompaniesModule onOpen={setCompanyId} />;
      case "referrals": return <ReferralsModule />;
      case "tasks": return <TasksModule />;
      case "lists": return <ListsModule />;
      case "workflows": return <WorkflowsModule />;
      case "reports": return <ReportsModule />;
      case "imports": return <ImportsModule />;
      case "exports": return <ExportsModule />;
      case "duplicates": return <DuplicatesModule />;
      case "settings": return <SettingsModule />;
      case "users": return <UsersModule />;
      case "deleted": return <DeletedModule />;
      case "files": return <FilesModule />;
      case "audit": return <AuditModule />;
      case "activities": return <ActivitiesModule />;
      case "search": return <GlobalSearchModule onOpenContact={setContactId} onOpenCompany={setCompanyId} onJumpModule={setModule} />;
    }
  })();

  return (
    <MktgPage
      title="Blossom Referral CRM"
      subtitle="Track contacts, companies, referrals, and outreach for every state."
    >
      {/* mobile / tablet: horizontal scroll tab bar */}
      <div className="lg:hidden -mx-1 mb-4 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const active = module === m.id;
            return (
              <button key={m.id} onClick={() => setModule(m.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                  active ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-transparent hover:bg-muted",
                )}
              >
                <Icon className="size-3.5" /> {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="rounded-2xl border bg-card p-2 sticky top-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const active = module === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setModule(m.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                    active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </aside>
        <main className="flex-1 min-w-0">{body}</main>
      </div>

      <ContactDrawer id={contactId} onClose={() => setContactId(null)} onOpenCompany={(id) => { setContactId(null); setCompanyId(id); }} />
      <CompanyDrawer id={companyId} onClose={() => setCompanyId(null)} onOpenContact={(id) => { setCompanyId(null); setContactId(id); }} />
    </MktgPage>
  );
}