import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HeartHandshake, MessageSquare, Briefcase, Users, BarChart3,
  Plus, CalendarPlus, ClipboardList, Download, CheckCircle2, Search,
  type LucideIcon,
} from "lucide-react";
import { GrowthPageShell, Section, StatCard } from "@/components/os/growth/GrowthPageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type TabKey = "overview" | "partners" | "outreach" | "tasks" | "providers" | "community";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview",   label: "Overview",   icon: BarChart3 },
  { key: "partners",   label: "Partners",   icon: HeartHandshake },
  { key: "outreach",   label: "Outreach",   icon: MessageSquare },
  { key: "tasks",      label: "Tasks",      icon: ClipboardList },
  { key: "providers",  label: "Providers",  icon: Briefcase },
  { key: "community",  label: "Community",  icon: Users },
];

const PARTNER_TYPES = ["Provider", "Community", "School", "Advocacy", "Health System"] as const;
const PARTNER_STATUS = ["Prospect", "Active", "Warm", "Dormant"] as const;
const PRIORITIES = ["Low", "Medium", "High"] as const;

interface Partner {
  id: string;
  name: string;
  type: typeof PARTNER_TYPES[number];
  contactName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  source?: string;
  status: typeof PARTNER_STATUS[number];
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  createdAt: string;
}

interface Outreach {
  id: string;
  partnerId: string;
  channel: "call" | "email" | "in-person" | "event";
  subject?: string;
  owner?: string;
  status: "planned" | "sent" | "responded" | "no-response";
  date: string;
  notes?: string;
}

interface BizTask {
  id: string;
  partnerId?: string;
  title: string;
  owner?: string;
  dueDate?: string;
  priority: typeof PRIORITIES[number];
  status: "open" | "done";
  createdAt: string;
}

interface BizData {
  partners: Partner[];
  outreach: Outreach[];
  tasks: BizTask[];
}

const STORAGE_KEY = "blossom-os.business-development.v1";

function loadData(): BizData {
  if (typeof window === "undefined") return { partners: [], outreach: [], tasks: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { partners: [], outreach: [], tasks: [] };
    const parsed = JSON.parse(raw) as Partial<BizData>;
    return {
      partners: parsed.partners ?? [],
      outreach: parsed.outreach ?? [],
      tasks: parsed.tasks ?? [],
    };
  } catch { return { partners: [], outreach: [], tasks: [] }; }
}

function saveData(d: BizData) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

const uid = () => `bd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function exportCsv(partners: Partner[]) {
  const headers = ["Name","Type","Contact","Phone","Email","City","State","Source","Status","Last Contact","Next Follow-Up","Notes"];
  const rows = partners.map((p) => [
    p.name, p.type, p.contactName ?? "", p.phone ?? "", p.email ?? "", p.city ?? "",
    p.state ?? "", p.source ?? "", p.status, p.lastContactDate ?? "", p.nextFollowUpDate ?? "",
    (p.notes ?? "").replace(/\n/g, " "),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `business-development-partners-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BusinessDevelopmentDashboard() {
  const [params, setParams] = useSearchParams();
  const tab = useMemo<TabKey>(() => {
    const t = params.get("tab") as TabKey | null;
    return TABS.some((x) => x.key === t) ? (t as TabKey) : "overview";
  }, [params]);
  const onTabChange = (next: string) => {
    const sp = new URLSearchParams(params);
    if (next === "overview") sp.delete("tab");
    else sp.set("tab", next);
    setParams(sp, { replace: true });
  };

  const [data, setData] = useState<BizData>(() => loadData());
  useEffect(() => { saveData(data); }, [data]);

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredPartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.partners.filter((p) => {
      if (stateFilter !== "all" && p.state !== stateFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (!q) return true;
      return `${p.name} ${p.contactName ?? ""} ${p.city ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q);
    });
  }, [data.partners, search, stateFilter, statusFilter, typeFilter]);

  const states = useMemo(
    () => Array.from(new Set(data.partners.map((p) => p.state).filter(Boolean) as string[])).sort(),
    [data.partners],
  );

  // Metrics
  const metrics = useMemo(() => {
    const now = Date.now();
    const week = 7 * 86_400_000;
    const month = 30 * 86_400_000;
    const activePartners = data.partners.filter((p) => p.status === "Active").length;
    const outreachThisWeek = data.outreach.filter((o) => now - new Date(o.date).getTime() <= week).length;
    const followUpsDue = data.tasks.filter((t) => t.status === "open" && t.dueDate && new Date(t.dueDate).getTime() <= now).length;
    const openOpportunities = data.partners.filter((p) => p.status === "Prospect" || p.status === "Warm").length;
    const newPartners30 = data.partners.filter((p) => now - new Date(p.createdAt).getTime() <= month).length;
    const conversion = data.partners.length
      ? Math.round((activePartners / data.partners.length) * 100)
      : 0;
    return { activePartners, outreachThisWeek, followUpsDue, openOpportunities, newPartners30, conversion };
  }, [data]);

  // Mutators
  const addPartner = (p: Partner) => setData((d) => ({ ...d, partners: [p, ...d.partners] }));
  const addOutreach = (o: Outreach) => {
    setData((d) => {
      const partners = d.partners.map((p) =>
        p.id === o.partnerId ? { ...p, lastContactDate: o.date } : p,
      );
      return { ...d, partners, outreach: [o, ...d.outreach] };
    });
  };
  const addTask = (t: BizTask) => setData((d) => ({ ...d, tasks: [t, ...d.tasks] }));
  const toggleTask = (id: string) =>
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, status: t.status === "open" ? "done" : "open" } : t)),
    }));

  // Dialog state for quick actions
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Business Development"
      description="Referral partner relationships, outreach activity, community growth, provider relationships, and follow-up accountability."
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setPartnerOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Partner</Button>
        <Button size="sm" variant="outline" onClick={() => setOutreachOpen(true)}><MessageSquare className="h-4 w-4 mr-1.5" /> Log Outreach</Button>
        <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Add Follow-Up</Button>
        <Button size="sm" variant="outline" onClick={() => { exportCsv(data.partners); toast.success("Partner list exported"); }}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 h-auto flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <TabsTrigger key={key} value={key} className="text-xs gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Active partners" value={String(metrics.activePartners)} icon={HeartHandshake} />
            <StatCard label="Outreach (7d)" value={String(metrics.outreachThisWeek)} icon={MessageSquare} />
            <StatCard label="Follow-ups due" value={String(metrics.followUpsDue)} icon={CalendarPlus} />
            <StatCard label="Open opportunities" value={String(metrics.openOpportunities)} icon={Briefcase} />
            <StatCard label="New (30d)" value={String(metrics.newPartners30)} icon={Users} />
            <StatCard label="Conversion" value={`${metrics.conversion}%`} icon={BarChart3} />
          </div>
          {data.partners.length === 0 && (
            <EmptyInvite onAdd={() => setPartnerOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="partners" className="mt-0 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners…" className="pl-9 h-9" />
            </div>
            <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Type" options={[...PARTNER_TYPES]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status" options={[...PARTNER_STATUS]} />
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State" options={states} />
          </div>
          {filteredPartners.length === 0 ? (
            <EmptyInvite onAdd={() => setPartnerOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPartners.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.type} · {p.city ?? "—"}{p.state ? `, ${p.state}` : ""}</div>
                    </div>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    {p.contactName && <div>{p.contactName}</div>}
                    {p.phone && <div>{p.phone}</div>}
                    {p.email && <div className="truncate">{p.email}</div>}
                    {p.lastContactDate && <div>Last contact: {p.lastContactDate} ({daysSince(p.lastContactDate)}d ago)</div>}
                    {p.nextFollowUpDate && <div>Next: {p.nextFollowUpDate}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outreach" className="mt-0 space-y-3">
          {data.outreach.length === 0 ? (
            <EmptyInvite onAdd={() => setOutreachOpen(true)} label="Log first outreach" />
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
              {data.outreach.map((o) => {
                const partner = data.partners.find((p) => p.id === o.partnerId);
                return (
                  <div key={o.id} className="p-3 flex justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{o.subject || o.channel}</div>
                      <div className="text-xs text-muted-foreground">{partner?.name ?? "—"} · {o.channel} · {o.date}{o.owner ? ` · ${o.owner}` : ""}</div>
                      {o.notes && <div className="text-xs text-muted-foreground mt-1">{o.notes}</div>}
                    </div>
                    <Badge variant="outline" className="shrink-0">{o.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-0 space-y-3">
          {data.tasks.length === 0 ? (
            <EmptyInvite onAdd={() => setTaskOpen(true)} label="Add first follow-up" />
          ) : (
            <div className="space-y-2">
              {data.tasks.map((t) => {
                const partner = data.partners.find((p) => p.id === t.partnerId);
                return (
                  <div key={t.id} className="rounded-xl border border-border/60 bg-card p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                      <div className="text-xs text-muted-foreground">{partner?.name ?? "—"} · {t.dueDate ?? "no due"} · {t.priority}</div>
                    </div>
                    <Button size="sm" variant={t.status === "done" ? "ghost" : "outline"} onClick={() => toggleTask(t.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> {t.status === "done" ? "Reopen" : "Mark complete"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="providers" className="mt-0">
          <RelationshipList partners={data.partners.filter((p) => p.type === "Provider" || p.type === "Health System")} onAdd={() => setPartnerOpen(true)} />
        </TabsContent>
        <TabsContent value="community" className="mt-0">
          <RelationshipList partners={data.partners.filter((p) => p.type === "Community" || p.type === "School" || p.type === "Advocacy")} onAdd={() => setPartnerOpen(true)} />
        </TabsContent>
      </Tabs>

      <PartnerDialog open={partnerOpen} onOpenChange={setPartnerOpen} onSave={addPartner} />
      <OutreachDialog open={outreachOpen} onOpenChange={setOutreachOpen} partners={data.partners} onSave={addOutreach} />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} partners={data.partners} onSave={addTask} />
    </GrowthPageShell>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs w-[140px]"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function EmptyInvite({ onAdd, label = "Add first partner" }: { onAdd: () => void; label?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
      <HeartHandshake className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
      <h3 className="text-sm font-semibold text-foreground">Start your business development workspace</h3>
      <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
        Add your first referral partner, then log outreach and follow-ups. Everything saves locally so this page is operationally usable before backend integrations.
      </p>
      <Button size="sm" className="mt-4" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> {label}</Button>
    </div>
  );
}

function RelationshipList({ partners, onAdd }: { partners: Partner[]; onAdd: () => void }) {
  if (partners.length === 0) return <EmptyInvite onAdd={onAdd} />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {partners.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="font-semibold">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.type} · {p.status}</div>
          {p.contactName && <div className="text-xs text-muted-foreground mt-1">{p.contactName}</div>}
        </div>
      ))}
    </div>
  );
}

function PartnerDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (p: Partner) => void }) {
  const [form, setForm] = useState<Partial<Partner>>({ type: "Provider", status: "Prospect" });
  const reset = () => setForm({ type: "Provider", status: "Prospect" });
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Referral Partner</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Partner name *" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2" />
          <Input placeholder="Contact name" value={form.contactName ?? ""} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <Input placeholder="Phone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="City" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="State" value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input placeholder="Source" value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Partner["type"] })}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>{PARTNER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Partner["status"] })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{PARTNER_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" placeholder="Next follow-up" value={form.nextFollowUpDate ?? ""} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} className="col-span-2" />
          <Input placeholder="Notes" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="col-span-2" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!form.name?.trim()) { toast.error("Partner name is required"); return; }
            onSave({
              id: uid(),
              name: form.name.trim(),
              type: (form.type ?? "Provider") as Partner["type"],
              status: (form.status ?? "Prospect") as Partner["status"],
              contactName: form.contactName, phone: form.phone, email: form.email,
              city: form.city, state: form.state, source: form.source,
              nextFollowUpDate: form.nextFollowUpDate, notes: form.notes,
              createdAt: new Date().toISOString(),
            });
            toast.success("Partner added");
            onOpenChange(false); reset();
          }}>Save Partner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutreachDialog({ open, onOpenChange, partners, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; partners: Partner[]; onSave: (o: Outreach) => void }) {
  const [form, setForm] = useState<Partial<Outreach>>({ channel: "email", status: "sent", date: new Date().toISOString().slice(0, 10) });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Outreach</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={form.partnerId} onValueChange={(v) => setForm({ ...form, partnerId: v })}>
            <SelectTrigger><SelectValue placeholder="Select partner *" /></SelectTrigger>
            <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as Outreach["channel"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="in-person">In person</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Outreach["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="no-response">No response</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Subject" value={form.subject ?? ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input placeholder="Owner" value={form.owner ?? ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
          <Input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input placeholder="Notes" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!form.partnerId) { toast.error("Select a partner"); return; }
            onSave({
              id: uid(),
              partnerId: form.partnerId,
              channel: form.channel ?? "email",
              status: form.status ?? "sent",
              date: form.date ?? new Date().toISOString().slice(0, 10),
              subject: form.subject, owner: form.owner, notes: form.notes,
            });
            toast.success("Outreach logged");
            onOpenChange(false);
            setForm({ channel: "email", status: "sent", date: new Date().toISOString().slice(0, 10) });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({ open, onOpenChange, partners, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; partners: Partner[]; onSave: (t: BizTask) => void }) {
  const [form, setForm] = useState<Partial<BizTask>>({ priority: "Medium", status: "open" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Follow-Up Task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title *" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.partnerId ?? ""} onValueChange={(v) => setForm({ ...form, partnerId: v })}>
            <SelectTrigger><SelectValue placeholder="Partner (optional)" /></SelectTrigger>
            <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Owner" value={form.owner ?? ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            <Input type="date" value={form.dueDate ?? ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as BizTask["priority"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!form.title?.trim()) { toast.error("Title is required"); return; }
            onSave({
              id: uid(),
              title: form.title.trim(),
              partnerId: form.partnerId,
              owner: form.owner,
              dueDate: form.dueDate,
              priority: form.priority ?? "Medium",
              status: "open",
              createdAt: new Date().toISOString(),
            });
            toast.success("Follow-up added");
            onOpenChange(false);
            setForm({ priority: "Medium", status: "open" });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
