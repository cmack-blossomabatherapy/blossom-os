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

type ModuleId =
  | "dashboard" | "contacts" | "companies" | "referrals" | "tasks" | "lists"
  | "workflows" | "reports" | "imports" | "exports" | "duplicates"
  | "settings" | "users" | "deleted" | "files" | "audit" | "activities";

const MODULES: { id: ModuleId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
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
              {rows.length === 0 && <tr><td colSpan={9} className="text-center text-muted-foreground py-10">No referrals yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <NewReferralDialog open={creating} onOpenChange={setCreating} />
      <EditReferralDialog id={editingId} open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)} />
      <LogActivityDialog open={!!logId} onOpenChange={(o) => !o && setLogId(null)} referralId={logId ?? undefined} />
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
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "owner" | "state" | "status")}>
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

function ImportsModule() {
  const s = useCrm();
  const [object, setObject] = useState<ImportObject>("contacts");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});

  const onFile = async (file: File) => {
    const t = await file.text(); setText(t); doParse(t);
  };
  const doParse = (raw: string) => {
    const p = parseCsv(raw);
    setParsed(p);
    setMap(autoMap(p.headers, IMPORT_FIELDS[object]));
  };

  const commit = () => {
    if (!parsed) return;
    let created = 0;
    for (const row of parsed.rows) {
      const get = (k: string) => map[k] ? (row[map[k]] ?? "").trim() : "";
      if (object === "contacts") {
        if (!get("firstName") || !get("lastName")) continue;
        const compName = get("companyName");
        let companyId: string | undefined;
        if (compName) {
          const existing = s.companies.find((c) => c.name.toLowerCase() === compName.toLowerCase());
          companyId = existing?.id ?? crm.addCompany({ name: compName, state: get("state") || undefined }).id;
        }
        crm.addContact({
          firstName: get("firstName"), lastName: get("lastName"),
          email: get("email") || undefined, phone: get("phone") || undefined,
          jobTitle: get("jobTitle") || undefined, state: get("state") || undefined,
          companyId,
        });
        created++;
      } else if (object === "companies") {
        if (!get("name")) continue;
        crm.addCompany({
          name: get("name"), companyType: get("companyType") || undefined,
          city: get("city") || undefined, state: get("state") || undefined,
          website: get("website") || undefined, mainPhone: get("mainPhone") || undefined,
        });
        created++;
      } else {
        if (!get("patientFirstName") || !get("patientLastInitial")) continue;
        const compName = get("companyName");
        const company = compName ? s.companies.find((c) => c.name.toLowerCase() === compName.toLowerCase()) : undefined;
        crm.addReferral({
          patientFirstName: get("patientFirstName"),
          patientLastInitial: get("patientLastInitial").slice(0, 1).toUpperCase(),
          companyId: company?.id,
          state: get("state") || undefined,
          serviceType: get("serviceType") || undefined,
          insuranceType: get("insuranceType") || undefined,
        });
        created++;
      }
    }
    crm.recordImport(`Imported ${created} ${object}`);
    toast({ title: `Imported ${created} ${object}` });
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

          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/40">
              Preview · first 10 of {parsed.rows.length} rows
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
            <Button size="sm" onClick={commit}>Import {parsed.rows.length} rows</Button>
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
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const pairs = useMemo(() => {
    const out: { a: Contact; b: Contact; reason: string }[] = [];
    const cs = activeContacts(s);
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j];
        const key = [a.id, b.id].sort().join("|");
        if (ignored.has(key)) continue;
        const sameEmail = a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase();
        const samePhone = a.phone && b.phone && a.phone.replace(/\D/g, "") === b.phone.replace(/\D/g, "");
        const sameName = a.lastName && a.lastName.toLowerCase() === b.lastName.toLowerCase()
          && a.firstName?.[0]?.toLowerCase() === b.firstName?.[0]?.toLowerCase();
        if (sameEmail || samePhone || sameName) {
          out.push({ a, b, reason: sameEmail ? "Same email" : samePhone ? "Same phone" : "Same last name + initial" });
        }
      }
    }
    return out;
  }, [s, ignored]);

  const merge = (winner: Contact, loser: Contact) => {
    crm.mergeContacts(winner.id, loser.id);
    toast({ title: `Merged "${loser.firstName} ${loser.lastName}" into "${winner.firstName} ${winner.lastName}"` });
  };

  return (
    <div className="space-y-4">
      {pairs.length === 0 && (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No likely duplicates detected.
        </div>
      )}
      {pairs.map((p) => {
        const key = [p.a.id, p.b.id].sort().join("|");
        return (
          <div key={key} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Possible duplicate</h3>
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
                    <Button size="sm" className="h-7 mt-2 w-full" onClick={() => merge(c, other)}>
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