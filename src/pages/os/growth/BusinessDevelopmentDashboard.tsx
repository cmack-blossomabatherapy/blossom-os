import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HeartHandshake, MessageSquare, Briefcase, Users, BarChart3,
  Plus, CalendarPlus, ClipboardList, Download, CheckCircle2, Search,
  Inbox, Archive, Pencil, Eye, AlertTriangle, Trash2, Radio,
  type LucideIcon,
} from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useReferralCompanies, useReferralActivities, useReferralTasks } from "@/lib/os/referrals/hooks";
import { REFERRAL_PARTNER_PIPELINE_STAGES } from "@/lib/intake/intakeWorkflow";
import {
  createCompany, createActivity, createTask, setTaskStatus, updateCompany,
  updateTask, setTaskArchived,
  type ReferralCrmTask,
} from "@/lib/os/referrals/api";
import {
  COMPANY_TYPES, COMPANY_STAGES, ACTIVITY_TYPES, ACTIVITY_OUTCOMES,
  type ReferralCompany, type ReferralActivity,
} from "@/lib/os/referrals/types";

type TabKey = "overview" | "partners" | "outreach" | "tasks" | "providers" | "community" | "sources";

type MarketingSourceRow = {
  id: string;
  name: string;
  source_system: string | null;
  channel: string | null;
  state: string | null;
  is_active: boolean;
};
type MarketingSourceEventRow = {
  id: string;
  source_id: string | null;
  source_system: string;
  state: string | null;
  status: string;
  event_type: string | null;
  occurred_at: string;
  referral_company_id: string | null;
};

function useMarketingSourceSignals() {
  const [sources, setSources] = useState<MarketingSourceRow[]>([]);
  const [events, setEvents] = useState<MarketingSourceEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: s, error: sErr }, { data: e, error: eErr }] = await Promise.all([
          supabase.from("marketing_sources").select("id,name,source_system,channel,state,is_active").order("name"),
          supabase.from("marketing_source_events").select("id,source_id,source_system,state,status,event_type,occurred_at,referral_company_id").order("occurred_at", { ascending: false }).limit(500),
        ]);
        if (cancelled) return;
        if (sErr) throw sErr;
        if (eErr) throw eErr;
        setSources((s ?? []) as MarketingSourceRow[]);
        setEvents((e ?? []) as MarketingSourceEventRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { sources, events, loading, error };
}

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview",   label: "Overview",   icon: BarChart3 },
  { key: "partners",   label: "Partners",   icon: HeartHandshake },
  { key: "outreach",   label: "Outreach",   icon: MessageSquare },
  { key: "tasks",      label: "Tasks",      icon: ClipboardList },
  { key: "providers",  label: "Providers",  icon: Briefcase },
  { key: "community",  label: "Community",  icon: Users },
  { key: "sources",    label: "Source Handoffs", icon: Inbox },
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
  const { data: tasks, refresh: refreshTasks } = useReferralTasks({ includeArchived: true });

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [includeArchived, setIncludeArchived] = useState(false);

  // outreach filters
  const [outPartner, setOutPartner] = useState<string>("all");
  const [outType, setOutType] = useState<string>("all");
  const [outOutcome, setOutOutcome] = useState<string>("all");
  const [outFrom, setOutFrom] = useState<string>("");
  const [outTo, setOutTo] = useState<string>("");

  // task filters
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "overdue" | "week" | "done" | "archived">("open");
  const [taskPartner, setTaskPartner] = useState<string>("all");
  const [taskPriority, setTaskPriority] = useState<string>("all");
  const [editTask, setEditTask] = useState<ReferralCrmTask | null>(null);

  // detail drawer / edit
  const [detailPartner, setDetailPartner] = useState<ReferralCompany | null>(null);
  const [editPartner, setEditPartner] = useState<ReferralCompany | null>(null);

  const visiblePartners = useMemo(
    () => partners.filter((p) => includeArchived || (p.status ?? "Active") !== "Archived"),
    [partners, includeArchived],
  );

  const filteredPartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visiblePartners.filter((p) => {
      if (stateFilter !== "all" && p.state !== stateFilter) return false;
      if (stageFilter !== "all" && p.relationship_stage !== stageFilter) return false;
      if (typeFilter !== "all" && p.company_type !== typeFilter) return false;
      if (!q) return true;
      return `${p.company_name} ${p.city ?? ""} ${p.main_email ?? ""}`.toLowerCase().includes(q);
    });
  }, [visiblePartners, search, stateFilter, stageFilter, typeFilter]);

  const states = useMemo(
    () => Array.from(new Set(partners.map((p) => p.state).filter(Boolean) as string[])).sort(),
    [partners],
  );

  const metrics = useMemo(() => {
    const now = Date.now();
    const week = 7 * 86_400_000;
    const month = 30 * 86_400_000;
    const activeSet = visiblePartners;
    const activePartners = activeSet.filter((p) => p.relationship_stage === "Active" || p.relationship_stage === "Strong Partner").length;
    const outreachThisWeek = outreach.filter((o) => now - new Date(o.activity_date).getTime() <= week).length;
    const followUpsDue = tasks.filter((t) => !t.archived_at && t.status === "Open" && t.due_date && new Date(t.due_date).getTime() <= now).length;
    const overdueFollowUps = tasks.filter((t) => !t.archived_at && t.status === "Open" && t.due_date && new Date(t.due_date).getTime() < now - 86_400_000).length;
    const openOpportunities = activeSet.filter((p) => p.relationship_stage === "New" || p.relationship_stage === "Warm").length;
    const newPartners30 = activeSet.filter((p) => now - new Date(p.created_at).getTime() <= month).length;
    const conversion = activeSet.length ? Math.round((activePartners / activeSet.length) * 100) : 0;
    return { activePartners, outreachThisWeek, followUpsDue, overdueFollowUps, openOpportunities, newPartners30, conversion };
  }, [visiblePartners, outreach, tasks]);

  const needsAttention = useMemo(() => {
    const now = Date.now();
    const stalePartners = visiblePartners.filter((p) => {
      const d = daysSince(p.last_contacted_at);
      return d !== null && d >= 30;
    });
    const warmNoFollowUp = visiblePartners.filter(
      (p) => (p.relationship_stage === "Warm" || p.relationship_stage === "New") && !p.next_follow_up_at,
    );
    const overdueTasksList = tasks.filter(
      (t) => !t.archived_at && t.status === "Open" && t.due_date && new Date(t.due_date).getTime() < now,
    );
    const outreachByCompany = new Set(outreach.map((o) => o.company_id).filter(Boolean));
    const newPartnersNoOutreach = visiblePartners.filter((p) => !outreachByCompany.has(p.id));
    return { stalePartners, warmNoFollowUp, overdueTasksList, newPartnersNoOutreach };
  }, [visiblePartners, tasks, outreach]);

  const [partnerOpen, setPartnerOpen] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const partnerName = (id?: string | null) => partners.find((p) => p.id === id)?.company_name ?? "-";

  const handleAddPartner = async (input: Partial<ReferralCompany> & { company_name: string }) => {
    try {
      await createCompany(input);
      toast.success("Partner added");
      refreshPartners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save partner");
    }
  };

  const handleUpdatePartner = async (id: string, patch: Partial<ReferralCompany>) => {
    try {
      await updateCompany(id, patch);
      toast.success("Partner updated");
      refreshPartners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update partner");
    }
  };

  const handleArchivePartner = async (p: ReferralCompany) => {
    const archiving = (p.status ?? "Active") !== "Archived";
    try {
      await updateCompany(p.id, { status: archiving ? "Archived" : "Active" });
      toast.success(archiving ? "Partner archived" : "Partner restored");
      refreshPartners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change status");
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

  const handleArchiveTask = async (t: ReferralCrmTask) => {
    const archiving = !t.archived_at;
    try {
      await setTaskArchived(t.id, archiving);
      toast.success(archiving ? "Task archived" : "Task restored");
      refreshTasks();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive task");
    }
  };

  const handleUpdateTask = async (id: string, patch: Partial<ReferralCrmTask>) => {
    try {
      await updateTask(id, patch);
      toast.success("Follow-up updated");
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

      <div className="rounded-xl border border-border/60 bg-card/60 p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Referral Partner Workflow</div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {REFERRAL_PARTNER_PIPELINE_STAGES.map((stage, i) => (
            <span key={stage} className="flex items-center gap-1.5">
              <span className="rounded-full border border-border/70 bg-background px-2 py-0.5">{stage}</span>
              {i < REFERRAL_PARTNER_PIPELINE_STAGES.length - 1 && <span className="text-muted-foreground">-&gt;</span>}
            </span>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Marketing / Business Development owns the partner relationship. Family contact, intake, VOB, scheduling, QA/auth, and staffing are handled in the separate Family Lead Pipeline.
        </div>
      </div>

      {partnersError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          Couldn't load referral CRM data: {partnersError.message}. This workspace is available to Admin, Business Development, Marketing, Executive, and Operations roles.
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <StatCard label="Active partners" value={String(metrics.activePartners)} icon={HeartHandshake} />
            <StatCard label="Outreach (7d)" value={String(metrics.outreachThisWeek)} icon={MessageSquare} />
            <StatCard label="Follow-ups due" value={String(metrics.followUpsDue)} icon={CalendarPlus} />
            <StatCard label="Overdue" value={String(metrics.overdueFollowUps)} icon={AlertTriangle} />
            <StatCard label="Open opportunities" value={String(metrics.openOpportunities)} icon={Briefcase} />
            <StatCard label="New (30d)" value={String(metrics.newPartners30)} icon={Users} />
            <StatCard label="Conversion" value={`${metrics.conversion}%`} icon={BarChart3} />
          </div>
          <NeedsAttentionPanel
            data={needsAttention}
            onOpenPartner={(p) => setDetailPartner(p)}
          />
          {!partnersLoading && partners.length === 0 && (
            <EmptyInvite onAdd={() => setPartnerOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="partners" className="mt-0 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners..." className="pl-9 h-9" />
            </div>
            <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Type" options={[...COMPANY_TYPES]} />
            <FilterSelect value={stageFilter} onChange={setStageFilter} label="Stage" options={[...COMPANY_STAGES]} />
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State" options={states} />
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <Switch id="bd-inc-archived" checked={includeArchived} onCheckedChange={setIncludeArchived} />
              <Label htmlFor="bd-inc-archived" className="text-xs text-muted-foreground">Include archived</Label>
            </div>
          </div>
          {filteredPartners.length === 0 ? (
            <EmptyInvite onAdd={() => setPartnerOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPartners.map((p) => (
                <PartnerCard
                  key={p.id}
                  p={p}
                  onView={() => setDetailPartner(p)}
                  onEdit={() => setEditPartner(p)}
                  onLogOutreach={() => { setOutreachOpen(true); setOutPartner(p.id); }}
                  onAddTask={() => { setTaskOpen(true); setTaskPartner(p.id); }}
                  onArchive={() => handleArchivePartner(p)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outreach" className="mt-0 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <FilterSelect value={outPartner} onChange={setOutPartner} label="Partner" options={visiblePartners.map((p) => p.company_name)} valueMap={Object.fromEntries(visiblePartners.map((p) => [p.company_name, p.id]))} />
            <FilterSelect value={outType} onChange={setOutType} label="Type" options={[...ACTIVITY_TYPES]} />
            <FilterSelect value={outOutcome} onChange={setOutOutcome} label="Outcome" options={[...ACTIVITY_OUTCOMES]} />
            <Input type="date" value={outFrom} onChange={(e) => setOutFrom(e.target.value)} className="h-9 w-[160px]" placeholder="From" />
            <Input type="date" value={outTo} onChange={(e) => setOutTo(e.target.value)} className="h-9 w-[160px]" placeholder="To" />
          </div>
          {(() => {
            const list = outreach.filter((o) => {
              if (outPartner !== "all" && o.company_id !== outPartner) return false;
              if (outType !== "all" && o.activity_type !== outType) return false;
              if (outOutcome !== "all" && o.outcome !== outOutcome) return false;
              if (outFrom && new Date(o.activity_date) < new Date(outFrom)) return false;
              if (outTo && new Date(o.activity_date) > new Date(outTo + "T23:59:59")) return false;
              return true;
            });
            if (list.length === 0) return (
            <EmptyInvite onAdd={() => setOutreachOpen(true)} label="Log first outreach" />
            );
            return (
            <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
              {list.map((o) => (
                <div key={o.id} className="p-3 flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{o.subject || o.activity_type}</div>
                    <div className="text-xs text-muted-foreground">{partnerName(o.company_id)} - {o.activity_type} - {o.activity_date.slice(0, 10)}</div>
                    {o.notes && <div className="text-xs text-muted-foreground mt-1">{o.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {o.outcome && <Badge variant="outline">{o.outcome}</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => { setTaskOpen(true); if (o.company_id) setTaskPartner(o.company_id); }}>
                      <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Follow-up
                    </Button>
                    {o.company_id && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        const p = partners.find((x) => x.id === o.company_id);
                        if (p) setDetailPartner(p);
                      }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="tasks" className="mt-0 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={taskStatusFilter} onValueChange={(v) => setTaskStatusFilter(v as typeof taskStatusFilter)}>
              <SelectTrigger className="h-9 text-xs w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tasks</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="week">Due this week</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
              </SelectContent>
            </Select>
            <FilterSelect value={taskPriority} onChange={setTaskPriority} label="Priority" options={[...PRIORITIES]} />
            <FilterSelect value={taskPartner} onChange={setTaskPartner} label="Partner" options={visiblePartners.map((p) => p.company_name)} valueMap={Object.fromEntries(visiblePartners.map((p) => [p.company_name, p.id]))} />
          </div>
          {(() => {
            const now = Date.now();
            const week = 7 * 86_400_000;
            const list = tasks.filter((t) => {
              if (taskPartner !== "all" && t.company_id !== taskPartner) return false;
              if (taskPriority !== "all" && t.priority !== taskPriority) return false;
              switch (taskStatusFilter) {
                case "open": if (t.status !== "Open") return false; break;
                case "done": if (t.status !== "Done") return false; break;
                case "overdue": if (!(t.status === "Open" && t.due_date && new Date(t.due_date).getTime() < now)) return false; break;
                case "week": if (!(t.status === "Open" && t.due_date && new Date(t.due_date).getTime() <= now + week)) return false; break;
              }
              return true;
            });
            if (list.length === 0) return (
            <EmptyInvite onAdd={() => setTaskOpen(true)} label="Add first follow-up" />
            );
            return (
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-card p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-sm font-medium ${t.status === "Done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="text-xs text-muted-foreground">{partnerName(t.company_id)} - {t.due_date ?? "no due"} - {t.priority ?? "Medium"}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.company_id && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        const p = partners.find((x) => x.id === t.company_id);
                        if (p) setDetailPartner(p);
                      }}><Eye className="h-3.5 w-3.5" /></Button>
                    )}
                    <Button size="sm" variant={t.status === "Done" ? "ghost" : "outline"} onClick={() => handleToggleTask(t)}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> {t.status === "Done" ? "Reopen" : "Complete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="providers" className="mt-0">
          <RelationshipList
            emptyLabel="Add first provider partner"
            emptyCopy="Track pediatric offices, therapy practices, and health systems that refer families."
            partners={visiblePartners.filter((p) => p.company_type && PROVIDER_TYPES.has(p.company_type))}
            onAdd={() => setPartnerOpen(true)}
            onView={(p) => setDetailPartner(p)}
            onEdit={(p) => setEditPartner(p)}
            onLogOutreach={(p) => { setOutreachOpen(true); setOutPartner(p.id); }}
            onAddTask={(p) => { setTaskOpen(true); setTaskPartner(p.id); }}
          />
        </TabsContent>
        <TabsContent value="community" className="mt-0">
          <RelationshipList
            emptyLabel="Add first community partner"
            emptyCopy="Track schools, autism organizations, and community groups you partner with."
            partners={visiblePartners.filter((p) => p.company_type && COMMUNITY_TYPES.has(p.company_type))}
            onAdd={() => setPartnerOpen(true)}
            onView={(p) => setDetailPartner(p)}
            onEdit={(p) => setEditPartner(p)}
            onLogOutreach={(p) => { setOutreachOpen(true); setOutPartner(p.id); }}
            onAddTask={(p) => { setTaskOpen(true); setTaskPartner(p.id); }}
          />
        </TabsContent>

        <TabsContent value="sources" className="mt-0 space-y-3">
          <SourceHandoffsPanel partners={visiblePartners} outreach={outreach} />
        </TabsContent>
      </Tabs>

      <PartnerDialog open={partnerOpen} onOpenChange={setPartnerOpen} onSave={handleAddPartner} />
      <PartnerDialog
        open={!!editPartner}
        onOpenChange={(v) => { if (!v) setEditPartner(null); }}
        initial={editPartner ?? undefined}
        onSave={async (input) => {
          if (editPartner) await handleUpdatePartner(editPartner.id, input);
          setEditPartner(null);
        }}
      />
      <OutreachDialog open={outreachOpen} onOpenChange={setOutreachOpen} partners={visiblePartners} defaultCompanyId={outPartner !== "all" ? outPartner : undefined} onSave={handleLogOutreach} />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} partners={visiblePartners} defaultCompanyId={taskPartner !== "all" ? taskPartner : undefined} onSave={handleAddTask} />
      <PartnerDetailDialog
        partner={detailPartner}
        onClose={() => setDetailPartner(null)}
        outreach={outreach}
        tasks={tasks}
        onEdit={(p) => { setDetailPartner(null); setEditPartner(p); }}
        onLogOutreach={(p) => { setDetailPartner(null); setOutreachOpen(true); setOutPartner(p.id); }}
        onAddTask={(p) => { setDetailPartner(null); setTaskOpen(true); setTaskPartner(p.id); }}
        onArchive={(p) => { handleArchivePartner(p); setDetailPartner(null); }}
      />
    </GrowthPageShell>
  );
}

function FilterSelect({ value, onChange, label, options, valueMap }: { value: string; onChange: (v: string) => void; label: string; options: string[]; valueMap?: Record<string, string> }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs w-[160px]"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => <SelectItem key={o} value={valueMap ? valueMap[o] : o}>{o}</SelectItem>)}
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

function RelationshipList({
  partners, onAdd, emptyLabel, emptyCopy, onView, onEdit, onLogOutreach, onAddTask,
}: {
  partners: ReferralCompany[];
  onAdd: () => void;
  emptyLabel?: string;
  emptyCopy?: string;
  onView?: (p: ReferralCompany) => void;
  onEdit?: (p: ReferralCompany) => void;
  onLogOutreach?: (p: ReferralCompany) => void;
  onAddTask?: (p: ReferralCompany) => void;
}) {
  if (partners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
        <HeartHandshake className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-sm font-semibold text-foreground">{emptyLabel ?? "Add first partner"}</h3>
        {emptyCopy && <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">{emptyCopy}</p>}
        <Button size="sm" className="mt-4" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> {emptyLabel ?? "Add first partner"}</Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {partners.map((p) => (
        <PartnerCard
          key={p.id}
          p={p}
          onView={onView ? () => onView(p) : undefined}
          onEdit={onEdit ? () => onEdit(p) : undefined}
          onLogOutreach={onLogOutreach ? () => onLogOutreach(p) : undefined}
          onAddTask={onAddTask ? () => onAddTask(p) : undefined}
        />
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

function PartnerDialog({ open, onOpenChange, onSave, initial }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (p: Partial<ReferralCompany> & { company_name: string }) => Promise<void>; initial?: ReferralCompany }) {
  const [form, setForm] = useState<PartnerForm>({ company_type: "Therapy Practice", relationship_stage: "New" });
  // Sync with initial when dialog opens
  useMemo(() => {
    if (open && initial) {
      setForm({
        company_name: initial.company_name,
        company_type: initial.company_type ?? undefined,
        main_phone: initial.main_phone ?? undefined,
        main_email: initial.main_email ?? undefined,
        city: initial.city ?? undefined,
        state: initial.state ?? undefined,
        source: initial.source ?? undefined,
        relationship_stage: initial.relationship_stage ?? "New",
        next_follow_up_at: initial.next_follow_up_at?.slice(0, 10) ?? undefined,
        notes: initial.notes ?? undefined,
      });
    } else if (open && !initial) {
      setForm({ company_type: "Therapy Practice", relationship_stage: "New" });
    }
  }, [open, initial]);
  const [saving, setSaving] = useState(false);
  const reset = () => setForm({ company_type: "Therapy Practice", relationship_stage: "New" });
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit Referral Partner" : "Add Referral Partner"}</DialogTitle></DialogHeader>
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
          }}>{saving ? "Saving..." : initial ? "Save Changes" : "Save Partner"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutreachDialog({ open, onOpenChange, partners, onSave, defaultCompanyId }: { open: boolean; onOpenChange: (v: boolean) => void; partners: ReferralCompany[]; onSave: (o: { company_id: string; activity_type: string; outcome?: string | null; subject?: string; notes?: string; activity_date: string }) => Promise<void>; defaultCompanyId?: string }) {
  const initial = { activity_type: "Email", outcome: "Sent Email" as string | null, date: new Date().toISOString().slice(0, 10) };
  const [form, setForm] = useState<{ company_id?: string; activity_type: string; outcome: string | null; subject?: string; notes?: string; date: string }>({ ...initial, company_id: defaultCompanyId });
  useMemo(() => {
    if (open) setForm((f) => ({ ...f, company_id: defaultCompanyId ?? f.company_id }));
  }, [open, defaultCompanyId]);
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
          }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartnerCard({
  p, onView, onEdit, onLogOutreach, onAddTask, onArchive,
}: {
  p: ReferralCompany;
  onView?: () => void;
  onEdit?: () => void;
  onLogOutreach?: () => void;
  onAddTask?: () => void;
  onArchive?: () => void;
}) {
  const archived = (p.status ?? "Active") === "Archived";
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-4 ${archived ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">{p.company_name}</div>
          <div className="text-xs text-muted-foreground">{p.company_type ?? "-"} - {p.city ?? "-"}{p.state ? `, ${p.state}` : ""}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {archived && <Badge variant="secondary">Archived</Badge>}
          <Badge variant="outline">{p.relationship_stage}</Badge>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
        {p.main_phone && <div>{p.main_phone}</div>}
        {p.main_email && <div className="truncate">{p.main_email}</div>}
        {p.last_contacted_at && <div>Last contact: {p.last_contacted_at.slice(0, 10)} ({daysSince(p.last_contacted_at)}d ago)</div>}
        {p.next_follow_up_at && <div>Next: {p.next_follow_up_at.slice(0, 10)}</div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {onView && <Button size="sm" variant="ghost" onClick={onView}><Eye className="h-3.5 w-3.5 mr-1" />View</Button>}
        {onEdit && <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>}
        {onLogOutreach && <Button size="sm" variant="ghost" onClick={onLogOutreach}><MessageSquare className="h-3.5 w-3.5 mr-1" />Log</Button>}
        {onAddTask && <Button size="sm" variant="ghost" onClick={onAddTask}><CalendarPlus className="h-3.5 w-3.5 mr-1" />Follow-up</Button>}
        {onArchive && <Button size="sm" variant="ghost" onClick={onArchive}><Archive className="h-3.5 w-3.5 mr-1" />{archived ? "Restore" : "Archive"}</Button>}
      </div>
    </div>
  );
}

function NeedsAttentionPanel({
  data, onOpenPartner,
}: {
  data: {
    stalePartners: ReferralCompany[];
    warmNoFollowUp: ReferralCompany[];
    overdueTasksList: ReferralCrmTask[];
    newPartnersNoOutreach: ReferralCompany[];
  };
  onOpenPartner: (p: ReferralCompany) => void;
}) {
  const groups: { title: string; items: ReferralCompany[]; hint: string }[] = [
    { title: "Stale partners (30d+)", items: data.stalePartners.slice(0, 6), hint: "No outreach logged in the last 30 days." },
    { title: "Warm without follow-up", items: data.warmNoFollowUp.slice(0, 6), hint: "Warm or new partners with no scheduled next step." },
    { title: "New with no outreach", items: data.newPartnersNoOutreach.slice(0, 6), hint: "Partners added but never contacted." },
  ];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <div className="text-sm font-semibold">Needs attention</div>
        <Badge variant="outline" className="ml-auto">{data.overdueTasksList.length} overdue tasks</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {groups.map((g) => (
          <div key={g.title} className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="text-xs font-medium mb-1">{g.title}</div>
            <div className="text-[11px] text-muted-foreground mb-2">{g.hint}</div>
            {g.items.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">All clear</div>
            ) : (
              <ul className="space-y-1">
                {g.items.map((p) => (
                  <li key={p.id}>
                    <button className="text-xs text-left hover:underline truncate w-full" onClick={() => onOpenPartner(p)}>
                      {p.company_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceHandoffsPanel({ partners, outreach }: { partners: ReferralCompany[]; outreach: ReferralActivity[] }) {
  // Aggregate BD-safe view of lead source signals from referral partner data.
  const rows = useMemo(() => {
    const map = new Map<string, { source: string; type: string; states: Set<string>; count: number; last: string | null }>();
    for (const p of partners) {
      const src = (p.source && p.source.trim()) || "Direct / Manual";
      const key = `${src}||${p.company_type ?? "Unknown"}`;
      const entry = map.get(key) ?? { source: src, type: p.company_type ?? "Unknown", states: new Set<string>(), count: 0, last: null };
      entry.count += 1;
      if (p.state) entry.states.add(p.state);
      const lc = p.last_contacted_at ?? null;
      if (lc && (!entry.last || new Date(lc) > new Date(entry.last))) entry.last = lc;
      map.set(key, entry);
    }
    // enrich last activity from outreach
    const byCompany = new Map<string, string>();
    for (const o of outreach) {
      if (!o.company_id) continue;
      const prev = byCompany.get(o.company_id);
      if (!prev || new Date(o.activity_date) > new Date(prev)) byCompany.set(o.company_id, o.activity_date);
    }
    for (const p of partners) {
      const last = byCompany.get(p.id);
      if (!last) continue;
      const src = (p.source && p.source.trim()) || "Direct / Manual";
      const key = `${src}||${p.company_type ?? "Unknown"}`;
      const entry = map.get(key);
      if (entry && (!entry.last || new Date(last) > new Date(entry.last))) entry.last = last;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [partners, outreach]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        Business Development read-only view of lead source signals derived from referral partner activity. Full marketing source
        analytics live in the Marketing workspace; deeper source integrations will surface here as they come online.
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
          <Inbox className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <div className="text-sm font-semibold">No source signals yet</div>
          <div className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Once partners have a source tagged and outreach is logged, this view will show handoff readiness by source and channel.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border/60">
            <div className="col-span-4">Source</div>
            <div className="col-span-3">Channel / Type</div>
            <div className="col-span-2">States</div>
            <div className="col-span-1 text-right">Partners</div>
            <div className="col-span-2">Last activity</div>
          </div>
          {rows.map((r) => (
            <div key={`${r.source}-${r.type}`} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b border-border/40 last:border-0">
              <div className="col-span-4 truncate">{r.source}</div>
              <div className="col-span-3 text-muted-foreground truncate">{r.type}</div>
              <div className="col-span-2 text-muted-foreground truncate">{Array.from(r.states).join(", ") || "-"}</div>
              <div className="col-span-1 text-right">{r.count}</div>
              <div className="col-span-2 text-muted-foreground">{r.last ? r.last.slice(0, 10) : "-"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerDetailDialog({
  partner, onClose, outreach, tasks, onEdit, onLogOutreach, onAddTask, onArchive,
}: {
  partner: ReferralCompany | null;
  onClose: () => void;
  outreach: ReferralActivity[];
  tasks: ReferralCrmTask[];
  onEdit: (p: ReferralCompany) => void;
  onLogOutreach: (p: ReferralCompany) => void;
  onAddTask: (p: ReferralCompany) => void;
  onArchive: (p: ReferralCompany) => void;
}) {
  if (!partner) return null;
  const p = partner;
  const relatedOutreach = outreach.filter((o) => o.company_id === p.id).slice(0, 20);
  const relatedTasks = tasks.filter((t) => t.company_id === p.id).slice(0, 20);
  const archived = (p.status ?? "Active") === "Archived";
  return (
    <Dialog open={!!partner} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {p.company_name}
            {archived && <Badge variant="secondary">Archived</Badge>}
            <Badge variant="outline">{p.relationship_stage}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Type" value={p.company_type ?? "-"} />
            <Field label="Source" value={p.source ?? "-"} />
            <Field label="Location" value={`${p.city ?? "-"}${p.state ? `, ${p.state}` : ""}`} />
            <Field label="Phone" value={p.main_phone ?? "-"} />
            <Field label="Email" value={p.main_email ?? "-"} />
            <Field label="Last contacted" value={p.last_contacted_at ? p.last_contacted_at.slice(0, 10) : "-"} />
            <Field label="Next follow-up" value={p.next_follow_up_at ? p.next_follow_up_at.slice(0, 10) : "-"} />
          </div>
          {p.notes && (
            <div>
              <div className="text-xs font-medium mb-1">Notes</div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">{p.notes}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium mb-1">Recent outreach ({relatedOutreach.length})</div>
            {relatedOutreach.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No outreach logged.</div>
            ) : (
              <ul className="space-y-1 max-h-40 overflow-auto">
                {relatedOutreach.map((o) => (
                  <li key={o.id} className="text-xs">
                    <span className="text-muted-foreground">{o.activity_date.slice(0, 10)}</span> - {o.activity_type}
                    {o.subject ? ` - ${o.subject}` : ""}{o.outcome ? ` (${o.outcome})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Related tasks ({relatedTasks.length})</div>
            {relatedTasks.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">No tasks.</div>
            ) : (
              <ul className="space-y-1 max-h-40 overflow-auto">
                {relatedTasks.map((t) => (
                  <li key={t.id} className="text-xs">
                    <span className={t.status === "Done" ? "line-through text-muted-foreground" : ""}>{t.title}</span>
                    <span className="text-muted-foreground"> - {t.due_date ?? "no due"} - {t.priority ?? "Medium"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
          <Button variant="outline" size="sm" onClick={() => onLogOutreach(p)}><MessageSquare className="h-3.5 w-3.5 mr-1" />Log outreach</Button>
          <Button variant="outline" size="sm" onClick={() => onAddTask(p)}><CalendarPlus className="h-3.5 w-3.5 mr-1" />Add follow-up</Button>
          <Button variant="outline" size="sm" onClick={() => onArchive(p)}><Archive className="h-3.5 w-3.5 mr-1" />{archived ? "Restore" : "Archive"}</Button>
          <Button size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xs">{value}</div>
    </div>
  );
}

function TaskDialog({ open, onOpenChange, partners, onSave, defaultCompanyId }: { open: boolean; onOpenChange: (v: boolean) => void; partners: ReferralCompany[]; onSave: (t: Partial<ReferralCrmTask> & { title: string }) => Promise<void>; defaultCompanyId?: string }) {
  const [form, setForm] = useState<{ title?: string; company_id?: string; assigned_user_id?: string; due_date?: string; priority: string }>({ priority: "Medium", company_id: defaultCompanyId });
  useMemo(() => {
    if (open) setForm((f) => ({ ...f, company_id: defaultCompanyId ?? f.company_id }));
  }, [open, defaultCompanyId]);
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
          }}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}