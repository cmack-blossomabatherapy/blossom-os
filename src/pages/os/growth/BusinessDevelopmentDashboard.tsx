import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HeartHandshake, MessageSquare, Briefcase, Users, BarChart3,
  Plus, CalendarPlus, ClipboardList, Download, CheckCircle2, Search,
  type LucideIcon,
} from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useReferralCompanies, useReferralActivities, useReferralTasks } from "@/lib/os/referrals/hooks";
import {
  createCompany, createActivity, createTask, setTaskStatus, updateCompany,
  type ReferralCrmTask,
} from "@/lib/os/referrals/api";
import {
  COMPANY_TYPES, COMPANY_STAGES, ACTIVITY_TYPES, ACTIVITY_OUTCOMES,
  type ReferralCompany, type ReferralActivity,
} from "@/lib/os/referrals/types";

type TabKey = "overview" | "partners" | "outreach" | "tasks" | "providers" | "community";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview",   label: "Overview",   icon: BarChart3 },
  { key: "partners",   label: "Partners",   icon: HeartHandshake },
  { key: "outreach",   label: "Outreach",   icon: MessageSquare },
  { key: "tasks",      label: "Tasks",      icon: ClipboardList },
  { key: "providers",  label: "Providers",  icon: Briefcase },
  { key: "community",  label: "Community",  icon: Users },
];

const PRIORITIES = ["Low", "Medium", "High"] as const;
const PROVIDER_TYPES = new Set(["Medical Practice", "Pediatric Office", "Therapy Practice", "Hospital / Health System", "Diagnostic Provider"]);
const COMMUNITY_TYPES = new Set(["School", "Social Services", "Case Management", "Autism Organization", "Community Organization"]);

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function exportCsv(partners: ReferralCompany[]) {
  const headers = ["Name","Type","Phone","Email","City","State","Source","Stage","Last Contact","Next Follow-Up","Notes"];
  const rows = partners.map((p) => [
    p.company_name, p.company_type ?? "", p.main_phone ?? "", p.main_email ?? "", p.city ?? "",
    p.state ?? "", p.source ?? "", p.relationship_stage, p.last_contacted_at ?? "", p.next_follow_up_at ?? "",
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

  const { data: partners, loading: partnersLoading, error: partnersError, refresh: refreshPartners } = useReferralCompanies();
  const { data: outreach, refresh: refreshOutreach } = useReferralActivities();
  const { data: tasks, refresh: refreshTasks } = useReferralTasks();

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredPartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      if (stateFilter !== "all" && p.state !== stateFilter) return false;
      if (stageFilter !== "all" && p.relationship_stage !== stageFilter) return false;
      if (typeFilter !== "all" && p.company_type !== typeFilter) return false;
      if (!q) return true;
      return `${p.company_name} ${p.city ?? ""} ${p.main_email ?? ""}`.toLowerCase().includes(q);
    });
  }, [partners, search, stateFilter, stageFilter, typeFilter]);

  const states = useMemo(
    () => Array.from(new Set(partners.map((p) => p.state).filter(Boolean) as string[])).sort(),
    [partners],
  );

  const metrics = useMemo(() => {
    const now = Date.now();
    const week = 7 * 86_400_000;
    const month = 30 * 86_400_000;
    const activePartners = partners.filter((p) => p.relationship_stage === "Active" || p.relationship_stage === "Strong Partner").length;
    const outreachThisWeek = outreach.filter((o) => now - new Date(o.activity_date).getTime() <= week).length;
    const followUpsDue = tasks.filter((t) => t.status === "Open" && t.due_date && new Date(t.due_date).getTime() <= now).length;
    const openOpportunities = partners.filter((p) => p.relationship_stage === "New" || p.relationship_stage === "Warm").length;
    const newPartners30 = partners.filter((p) => now - new Date(p.created_at).getTime() <= month).length;
    const conversion = partners.length ? Math.round((activePartners / partners.length) * 100) : 0;
    return { activePartners, outreachThisWeek, followUpsDue, openOpportunities, newPartners30, conversion };
  }, [partners, outreach, tasks]);

  const [partnerOpen, setPartnerOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const partnerName = (id?: string | null) => partners.find((p) => p.id === id)?.company_name ?? "—";

  const handleAddPartner = async (input: Partial<ReferralCompany> & { company_name: string }) => {
    try {
      await createCompany(input);
      toast.success("Partner added");
      refreshPartners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save partner");
    }
  };

  const handleLogOutreach = async (input: { company_id: string; activity_type: string; outcome?: string | null; subject?: string; notes?: string; activity_date: string }) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      await createActivity({ ...input, created_by: userRes.user?.id ?? null });
      await updateCompany(input.company_id, { last_contacted_at: input.activity_date });
      toast.success("Outreach logged");
      refreshOutreach();
      refreshPartners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log outreach");
    }
  };

  const handleAddTask = async (input: Partial<ReferralCrmTask> & { title: string }) => {
    try {
      await createTask(input);
      toast.success("Follow-up added");
      refreshTasks();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save task");
    }
  };

  const handleToggleTask = async (t: ReferralCrmTask) => {
    try {
      await setTaskStatus(t.id, t.status === "Done" ? "Open" : "Done");
      refreshTasks();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    }
  };

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
        <Button size="sm" variant="outline" onClick={() => { exportCsv(partners); toast.success("Partner list exported"); }}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {partnersError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          Couldn't load referral CRM data: {partnersError.message}. You may not have CRM access — this workspace is limited to Admin, Marketing, Executive, and Operations Manager roles.
        </div>
      )}

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
          {!partnersLoading && partners.length === 0 && (
            <EmptyInvite onAdd={() => setPartnerOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="partners" className="mt-0 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners…" className="pl-9 h-9" />
            </div>
            <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Type" options={[...COMPANY_TYPES]} />
            <FilterSelect value={stageFilter} onChange={setStageFilter} label="Stage" options={[...COMPANY_STAGES]} />
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
                      <div className="font-semibold truncate">{p.company_name}</div>
                      <div className="text-xs text-muted-foreground">{p.company_type ?? "—"} · {p.city ?? "—"}{p.state ? `, ${p.state}` : ""}</div>
                    </div>
                    <Badge variant="outline">{p.relationship_stage}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    {p.main_phone && <div>{p.main_phone}</div>}
                    {p.main_email && <div className="truncate">{p.main_email}</div>}
                    {p.last_contacted_at && <div>Last contact: {p.last_contacted_at.slice(0, 10)} ({daysSince(p.last_contacted_at)}d ago)</div>}
                    {p.next_follow_up_at && <div>Next: {p.next_follow_up_at.slice(0, 10)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outreach" className="mt-0 space-y-3">
          {outreach.length === 0 ? (
            <EmptyInvite onAdd={() => setOutreachOpen(true)} label="Log first outreach" />
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
              {outreach.map((o) => (
                <div key={o.id} className="p-3 flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{o.subject || o.activity_type}</div>
                    <div className="text-xs text-muted-foreground">{partnerName(o.company_id)} · {o.activity_type} · {o.activity_date.slice(0, 10)}</div>
                    {o.notes && <div className="text-xs text-muted-foreground mt-1">{o.notes}</div>}
                  </div>
                  {o.outcome && <Badge variant="outline" className="shrink-0">{o.outcome}</Badge>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-0 space-y-3">
          {tasks.length === 0 ? (
            <EmptyInvite onAdd={() => setTaskOpen(true)} label="Add first follow-up" />
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-card p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className={`text-sm font-medium ${t.status === "Done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="text-xs text-muted-foreground">{partnerName(t.company_id)} · {t.due_date ?? "no due"} · {t.priority ?? "Medium"}</div>
                  </div>
                  <Button size="sm" variant={t.status === "Done" ? "ghost" : "outline"} onClick={() => handleToggleTask(t)}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> {t.status === "Done" ? "Reopen" : "Mark complete"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="providers" className="mt-0">
          <RelationshipList partners={partners.filter((p) => p.company_type && PROVIDER_TYPES.has(p.company_type))} onAdd={() => setPartnerOpen(true)} />
        </TabsContent>
        <TabsContent value="community" className="mt-0">
          <RelationshipList partners={partners.filter((p) => p.company_type && COMMUNITY_TYPES.has(p.company_type))} onAdd={() => setPartnerOpen(true)} />
        </TabsContent>
      </Tabs>

      <PartnerDialog open={partnerOpen} onOpenChange={setPartnerOpen} onSave={handleAddPartner} />
      <OutreachDialog open={outreachOpen} onOpenChange={setOutreachOpen} partners={partners} onSave={handleLogOutreach} />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} partners={partners} onSave={handleAddTask} />
    </GrowthPageShell>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs w-[160px]"><SelectValue placeholder={label} /></SelectTrigger>
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
        Add your first referral partner, then log outreach and follow-ups. Everything saves to the Lovable Cloud referral CRM so it's shared across the team in real time.
      </p>
      <Button size="sm" className="mt-4" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> {label}</Button>
    </div>
  );
}

function RelationshipList({ partners, onAdd }: { partners: ReferralCompany[]; onAdd: () => void }) {
  if (partners.length === 0) return <EmptyInvite onAdd={onAdd} />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {partners.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="font-semibold">{p.company_name}</div>
          <div className="text-xs text-muted-foreground">{p.company_type ?? "—"} · {p.relationship_stage}</div>
          {p.main_email && <div className="text-xs text-muted-foreground mt-1 truncate">{p.main_email}</div>}
        </div>
      ))}
    </div>
  );
}

type PartnerForm = {
  company_name?: string;
  company_type?: string;
  main_phone?: string;
  main_email?: string;
  city?: string;
  state?: string;
  source?: string;
  relationship_stage?: string;
  next_follow_up_at?: string;
  notes?: string;
};

function PartnerDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (p: Partial<ReferralCompany> & { company_name: string }) => Promise<void> }) {
  const [form, setForm] = useState<PartnerForm>({ company_type: "Therapy Practice", relationship_stage: "New" });
  const [saving, setSaving] = useState(false);
  const reset = () => setForm({ company_type: "Therapy Practice", relationship_stage: "New" });
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Referral Partner</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Partner name *" value={form.company_name ?? ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="col-span-2" />
          <Input placeholder="Main phone" value={form.main_phone ?? ""} onChange={(e) => setForm({ ...form, main_phone: e.target.value })} />
          <Input placeholder="Main email" value={form.main_email ?? ""} onChange={(e) => setForm({ ...form, main_email: e.target.value })} />
          <Input placeholder="City" value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input placeholder="State" value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input placeholder="Source" value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Input type="date" placeholder="Next follow-up" value={form.next_follow_up_at ?? ""} onChange={(e) => setForm({ ...form, next_follow_up_at: e.target.value })} />
          <Select value={form.company_type} onValueChange={(v) => setForm({ ...form, company_type: v })}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>{COMPANY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.relationship_stage} onValueChange={(v) => setForm({ ...form, relationship_stage: v })}>
            <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>{COMPANY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Notes" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="col-span-2" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={async () => {
            if (!form.company_name?.trim()) { toast.error("Partner name is required"); return; }
            setSaving(true);
            await onSave({
              company_name: form.company_name.trim(),
              company_type: form.company_type ?? null,
              main_phone: form.main_phone ?? null,
              main_email: form.main_email ?? null,
              city: form.city ?? null,
              state: form.state ?? null,
              source: form.source ?? "Manual",
              relationship_stage: (form.relationship_stage as ReferralCompany["relationship_stage"]) ?? "New",
              next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null,
              notes: form.notes ?? null,
            });
            setSaving(false);
            onOpenChange(false); reset();
          }}>{saving ? "Saving…" : "Save Partner"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutreachDialog({ open, onOpenChange, partners, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; partners: ReferralCompany[]; onSave: (o: { company_id: string; activity_type: string; outcome?: string | null; subject?: string; notes?: string; activity_date: string }) => Promise<void> }) {
  const initial = { activity_type: "Email", outcome: "Sent Email" as string | null, date: new Date().toISOString().slice(0, 10) };
  const [form, setForm] = useState<{ company_id?: string; activity_type: string; outcome: string | null; subject?: string; notes?: string; date: string }>(initial);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Outreach</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select partner *" /></SelectTrigger>
            <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.outcome ?? "_none"} onValueChange={(v) => setForm({ ...form, outcome: v === "_none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Outcome" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No outcome</SelectItem>
                {ACTIVITY_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Subject" value={form.subject ?? ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input placeholder="Notes" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={async () => {
            if (!form.company_id) { toast.error("Select a partner"); return; }
            setSaving(true);
            await onSave({
              company_id: form.company_id,
              activity_type: form.activity_type,
              outcome: form.outcome,
              subject: form.subject,
              notes: form.notes,
              activity_date: new Date(form.date).toISOString(),
            });
            setSaving(false);
            onOpenChange(false);
            setForm(initial);
          }}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({ open, onOpenChange, partners, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; partners: ReferralCompany[]; onSave: (t: Partial<ReferralCrmTask> & { title: string }) => Promise<void> }) {
  const [form, setForm] = useState<{ title?: string; company_id?: string; assigned_user_id?: string; due_date?: string; priority: string }>({ priority: "Medium" });
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Follow-Up Task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title *" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.company_id ?? ""} onValueChange={(v) => setForm({ ...form, company_id: v })}>
            <SelectTrigger><SelectValue placeholder="Partner (optional)" /></SelectTrigger>
            <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Owner (name or id)" value={form.assigned_user_id ?? ""} onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })} />
            <Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={async () => {
            if (!form.title?.trim()) { toast.error("Title is required"); return; }
            setSaving(true);
            await onSave({
              title: form.title.trim(),
              company_id: form.company_id ?? null,
              assigned_user_id: form.assigned_user_id ?? null,
              due_date: form.due_date ?? null,
              priority: form.priority,
              status: "Open",
            });
            setSaving(false);
            onOpenChange(false);
            setForm({ priority: "Medium" });
          }}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}