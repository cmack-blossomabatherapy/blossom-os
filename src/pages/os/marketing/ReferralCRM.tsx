import { useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Building2, HeartHandshake, ListChecks, ListFilter,
  Workflow, BarChart3, Upload, Download, Settings2, ShieldCheck, Trash2,
  Plus, Search, X, CheckCircle2, Pencil, RotateCcw, Activity, AlertCircle,
  ChevronRight, Tag, UserPlus,
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
} from "@/lib/os/referralCrm/store";

type ModuleId =
  | "dashboard" | "contacts" | "companies" | "referrals" | "tasks" | "lists"
  | "workflows" | "reports" | "imports" | "exports" | "duplicates"
  | "settings" | "users" | "deleted";

const MODULES: { id: ModuleId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "referrals", label: "Referrals", icon: HeartHandshake },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "lists", label: "Lists", icon: ListFilter },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "imports", label: "Imports", icon: Upload },
  { id: "exports", label: "Exports", icon: Download },
  { id: "duplicates", label: "Duplicate Mgmt", icon: ShieldCheck },
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

  const byState = STATES.map((st) => ({
    st, count: rf.filter((r) => r.state === st).length,
  }));
  const topPartners = [...co].sort((a, b) => b.referralCount - a.referralCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Contacts" value={ct.length} icon={Users} />
        <Kpi label="Companies" value={co.length} icon={Building2} />
        <Kpi label="Referrals" value={rf.length} icon={HeartHandshake} />
        <Kpi label="Open Tasks" value={openTasks.length} hint={`${overdue.length} overdue`} icon={ListChecks} />
        <Kpi label="Active Partners" value={activePartners} icon={ShieldCheck} />
        <Kpi label="No Activity 60d+" value={inactive60.length} icon={AlertCircle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
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
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={() => { toast({ title: "Export queued" }); }}>
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
  const bulkDelete = () => { selected.forEach((id) => crm.softDeleteCompany(id)); toast({ title: `${selected.size} company(ies) deleted` }); setSelected(new Set()); };

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
        <div className="rounded-xl bg-foreground text-background px-3 py-2 flex items-center gap-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
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
// Referrals
// ===========================================================
function ReferralsModule() {
  const s = useCrm();
  const [creating, setCreating] = useState(false);
  const rows = activeReferrals(s);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" /> New Referral
        </Button>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
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
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{companyName(s, r.companyId)}</td>
                  <td className="px-3 py-2">{r.contactId ? fullName(s.contacts.find((c) => c.id === r.contactId)!) : "—"}</td>
                  <td className="px-3 py-2">{r.state || "—"}</td>
                  <td className="px-3 py-2">{r.serviceType || "—"}</td>
                  <td className="px-3 py-2"><Badge variant="secondary">{r.referralStatus}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{r.insuranceType || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, r.assignedIntakeOwnerId)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.referralDate)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="text-center text-muted-foreground py-10">No referrals yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <NewReferralDialog open={creating} onOpenChange={setCreating} />
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Group by</Label>
        <Select value={groupBy} onValueChange={(v: never) => setGroupBy(v)}>
          <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setCreating(true)}><Plus className="size-3.5" /> New Task</Button>
      </div>

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
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {s.lists.map((l) => {
        const matches = evalList(s, l);
        return (
          <div key={l.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{l.name}</h3>
                  <Badge variant="secondary" className="text-[10px] uppercase">{l.kind}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {l.kind === "active" ? `Criteria: ${l.criteria}` : `Static list of ${l.staticIds?.length ?? 0} ${l.object}`}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary tabular-nums">{matches.length} matches</Badge>
            </div>
            <div className="mt-3 divide-y text-sm max-h-48 overflow-y-auto">
              {matches.slice(0, 8).map((m) => (
                <div key={m.id} className="py-1.5 flex justify-between">
                  <span>{"firstName" in m ? fullName(m as Contact) : (m as Company).name}</span>
                  <span className="text-xs text-muted-foreground">{(m as Contact).state || (m as Company).state}</span>
                </div>
              ))}
              {matches.length === 0 && <p className="text-muted-foreground py-4">No matches.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================
// Workflows
// ===========================================================
function WorkflowsModule() {
  const s = useCrm();
  return (
    <div className="space-y-3">
      {s.workflows.map((w) => (
        <div key={w.id} className="rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{w.name}</h3>
                <Badge variant={w.enabled ? "default" : "secondary"} className={w.enabled ? "bg-emerald-500/15 text-emerald-700" : ""}>
                  {w.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-foreground">Trigger:</span> {w.trigger}</p>
              <ul className="mt-2 space-y-0.5">
                {w.actions.map((a, i) => (
                  <li key={i} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    <ChevronRight className="size-3" /> {a}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">{w.runs} runs · last {fmtDate(w.lastRun)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Switch checked={w.enabled} onCheckedChange={() => crm.toggleWorkflow(w.id)} />
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { crm.runWorkflow(w.id); toast({ title: `Ran ${w.name}` }); }}>Run now</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// Reports
// ===========================================================
function ReportsModule() {
  const s = useCrm();
  const byOwner = s.users.map((u) => ({
    user: u.name,
    contacts: activeContacts(s).filter((c) => c.ownerId === u.id).length,
    referrals: activeReferrals(s).filter((r) => {
      const co = s.companies.find((x) => x.id === r.companyId);
      return co?.ownerId === u.id;
    }).length,
    tasks: s.tasks.filter((t) => t.assignedUserId === u.id && t.status !== "Completed").length,
  }));
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5">
        <SectionHeader title="Outreach Performance" subtitle="Snapshot by owner" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr><th className="text-left py-2">Owner</th><th className="text-right">Contacts</th><th className="text-right">Referrals</th><th className="text-right">Open Tasks</th></tr>
            </thead>
            <tbody>
              {byOwner.map((r) => (
                <tr key={r.user} className="border-t">
                  <td className="py-2">{r.user}</td>
                  <td className="text-right tabular-nums">{r.contacts}</td>
                  <td className="text-right tabular-nums">{r.referrals}</td>
                  <td className="text-right tabular-nums">{r.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// Imports / Exports
// ===========================================================
function ImportsModule() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed bg-card p-10 text-center">
        <Upload className="size-8 mx-auto text-muted-foreground" />
        <p className="mt-3 font-medium">Drop a CSV here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Contacts, Companies, or Referrals — up to 10MB</p>
        <Button className="mt-4" size="sm" onClick={() => toast({ title: "File picker (mock)" })}>Select File</Button>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm">Column Mapping</h3>
          <p className="text-xs text-muted-foreground mt-1">Map CSV headers to CRM fields. Saved per object.</p>
          <div className="mt-3 space-y-1.5 text-xs">
            {["First Name → firstName", "Last Name → lastName", "Email → email", "Phone → phone", "Company → companyId"].map((m) => (
              <div key={m} className="px-2 py-1 rounded bg-muted/50">{m}</div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm">Preview</h3>
          <p className="text-xs text-muted-foreground mt-1">Preview the first 10 rows before committing.</p>
          <p className="text-xs mt-3 text-muted-foreground italic">Upload a file to preview.</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm">Duplicate Detection</h3>
          <p className="text-xs text-muted-foreground mt-1">Matches existing records by name + email + phone before import.</p>
          <Badge className="mt-3 bg-emerald-500/15 text-emerald-700">No duplicates detected</Badge>
        </div>
      </div>
    </div>
  );
}

function ExportsModule() {
  const exp = (kind: string) => toast({ title: `Exported ${kind} (mock CSV)` });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { id: "contacts", label: "Contacts" },
        { id: "companies", label: "Companies" },
        { id: "referrals", label: "Referrals" },
        { id: "tasks", label: "Tasks" },
      ].map((o) => (
        <div key={o.id} className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">{o.label}</h3>
          <p className="text-xs text-muted-foreground mt-1">Export selected, filtered view, or all records.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => exp(`${o.label} (selected)`)}>Selected</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => exp(`${o.label} (filtered)`)}>Filtered</Button>
            <Button size="sm" className="h-8" onClick={() => exp(`${o.label} (all)`)}><Download className="size-3 mr-1" /> All</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// Duplicate management
// ===========================================================
function DuplicatesModule() {
  const s = useCrm();
  // naive duplicate finder
  const pairs: { a: Contact; b: Contact }[] = [];
  const cs = activeContacts(s);
  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i], b = cs[j];
      if (a.lastName && a.lastName === b.lastName && a.firstName?.[0] === b.firstName?.[0]) {
        pairs.push({ a, b });
      }
    }
  }
  return (
    <div className="space-y-4">
      {pairs.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No likely duplicates detected.
        </div>
      )}
      {pairs.map((p, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">Possible duplicate</h3>
          <div className="grid grid-cols-2 gap-4">
            {[p.a, p.b].map((c) => (
              <div key={c.id} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{fullName(c)}</p>
                <p className="text-xs text-muted-foreground">{c.email || "no email"}</p>
                <p className="text-xs text-muted-foreground">{c.phone || "no phone"}</p>
                <p className="text-xs text-muted-foreground">{c.jobTitle || "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => toast({ title: "Ignored" })}>Not a duplicate</Button>
            <Button size="sm" onClick={() => toast({ title: "Merged — activity preserved (mock)" })}>Merge</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// Settings + Users + Deleted
// ===========================================================
function SettingsModule() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
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
        <h3 className="font-semibold">Field Customization</h3>
        <p className="text-xs text-muted-foreground mt-1">Add custom fields to Contacts / Companies / Referrals.</p>
        <Button size="sm" variant="outline" className="mt-3 h-8">Manage fields</Button>
      </div>
    </div>
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
  if (!c) return null;
  const events = s.activity.filter((a) => a.contactId === c.id);
  const cTasks = s.tasks.filter((t) => t.contactId === c.id);
  const cRefs = s.referrals.filter((r) => r.contactId === c.id);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{fullName(c)}</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">{c.jobTitle || "—"}{c.companyId ? <> · <button className="hover:text-primary" onClick={() => onOpenCompany(c.companyId!)}>{companyName(s, c.companyId)}</button></> : null}</div>
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
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Activity Timeline</h4>
            <div className="space-y-2">
              {events.length === 0 ? <p className="text-xs text-muted-foreground">No activity.</p> :
                events.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <Activity className="size-3 mt-1 text-muted-foreground" />
                    <div><p>{a.message}</p><p className="text-muted-foreground">{fmtDate(a.createdAt)}</p></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CompanyDrawer({ id, onClose, onOpenContact }: { id: ID | null; onClose: () => void; onOpenContact: (id: ID) => void }) {
  const s = useCrm();
  const c = s.companies.find((x) => x.id === id);
  if (!c) return null;
  const associated = s.contacts.filter((x) => x.companyId === c.id && !x.deletedAt);
  const cRefs = s.referrals.filter((r) => r.companyId === c.id);
  const cTasks = s.tasks.filter((t) => t.companyId === c.id);
  const events = s.activity.filter((a) => a.companyId === c.id);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{c.name}</SheetTitle></SheetHeader>
        <div className="mt-2 space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">{c.companyType || "—"} · {c.city || ""}{c.city && c.state ? ", " : ""}{c.state || ""}</div>
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
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Activity Timeline</h4>
            <div className="space-y-2">
              {events.length === 0 ? <p className="text-xs text-muted-foreground">No activity.</p> :
                events.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <Activity className="size-3 mt-1 text-muted-foreground" />
                    <div><p>{a.message}</p><p className="text-muted-foreground">{fmtDate(a.createdAt)}</p></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
    }
  })();

  return (
    <MktgPage
      title="Blossom Referral CRM"
      subtitle="Track contacts, companies, referrals, and outreach for every state."
    >
      <div className="flex gap-6">
        <aside className="w-56 shrink-0">
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