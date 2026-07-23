import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HeartHandshake, MessageSquare, Briefcase, Users, BarChart3,
  Plus, CalendarPlus, ClipboardList, Download, CheckCircle2, Search,
  Inbox, Archive, Pencil, Eye, AlertTriangle, Trash2, Radio,
  UserPlus, Link2, CheckSquare,
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
export type MarketingSourceEventRow = {
  id: string;
  source_id: string | null;
  source_system: string;
  state: string | null;
  status: string;
  event_type: string | null;
  occurred_at: string;
  assigned_to: string | null;
  assigned_at: string | null;
  caller_name: string | null;
  caller_email: string | null;
  caller_phone: string | null;
  lead_id: string | null;
  payload_summary: string | null;
  referral_company_id: string | null;
  referral_contact_id: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  sync_status: string | null;
};

function useMarketingSourceSignals() {
  const [sources, setSources] = useState<MarketingSourceRow[]>([]);
  const [events, setEvents] = useState<MarketingSourceEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((n) => n + 1), []);
  // Keyset cursor pagination on (occurred_at DESC, id DESC). Rendering the
  // full history at once became slow once marketing_source_events grew past a
  // few thousand rows and made real-time updates noisy: every INSERT would
  // trigger a full reload of the top 500 rows. We now:
  //   - fetch a small first page (PAGE_SIZE),
  //   - let callers pull older rows via loadMoreEvents() using a keyset
  //     cursor so results stay stable even while new events stream in, and
  //   - handle realtime INSERT/UPDATE/DELETE inline instead of refetching.
  const PAGE_SIZE = 50;
  const EVENT_COLS =
    "id,source_id,source_system,state,status,event_type,occurred_at,assigned_to,assigned_at,caller_name,caller_email,caller_phone,lead_id,payload_summary,referral_company_id,referral_contact_id,reviewed_at,reviewed_by,sync_status";
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const cursorRef = useRef<{ occurred_at: string; id: string } | null>(null);

  // Build a keyset filter: (occurred_at, id) < (cursor.occurred_at, cursor.id)
  // Uses PostgREST's `or(...)` because Supabase doesn't expose tuple compares.
  const fetchEventsPage = useCallback(
    async (cursor: { occurred_at: string; id: string } | null) => {
      let q = supabase
        .from("marketing_source_events")
        .select(EVENT_COLS)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);
      if (cursor) {
        q = q.or(
          `occurred_at.lt.${cursor.occurred_at},and(occurred_at.eq.${cursor.occurred_at},id.lt.${cursor.id})`,
        );
      }
      const { data, error: err } = await q;
      if (err) throw err;
      const rows = (data ?? []) as MarketingSourceEventRow[];
      return rows;
    },
    [],
  );

  const loadMoreEvents = useCallback(async () => {
    if (loadingMoreEvents || !hasMoreEvents) return;
    setLoadingMoreEvents(true);
    try {
      const rows = await fetchEventsPage(cursorRef.current);
      if (rows.length > 0) {
        cursorRef.current = { occurred_at: rows[rows.length - 1].occurred_at, id: rows[rows.length - 1].id };
      }
      setHasMoreEvents(rows.length === PAGE_SIZE);
      setEvents((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const merged = [...prev];
        for (const r of rows) if (!seen.has(r.id)) merged.push(r);
        return merged;
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMoreEvents(false);
    }
  }, [fetchEventsPage, hasMoreEvents, loadingMoreEvents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        cursorRef.current = null;
        const [{ data: s, error: sErr }, rows] = await Promise.all([
          supabase.from("marketing_sources").select("id,name,source_system,channel,state,is_active").order("name"),
          fetchEventsPage(null),
        ]);
        if (cancelled) return;
        if (sErr) throw sErr;
        setSources((s ?? []) as MarketingSourceRow[]);
        setEvents(rows);
        if (rows.length > 0) {
          cursorRef.current = { occurred_at: rows[rows.length - 1].occurred_at, id: rows[rows.length - 1].id };
        }
        setHasMoreEvents(rows.length === PAGE_SIZE);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadTick, fetchEventsPage]);

  // Realtime: apply granular updates instead of blanket refetching. This
  // avoids "list jumps to the top" behavior while users are paginating older
  // rows, and keeps the UI responsive under bursty webhook traffic.
  useEffect(() => {
    const channel = supabase
      .channel(`bd-marketing-source-events-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "marketing_source_events" },
        (payload) => {
          const row = payload.new as MarketingSourceEventRow;
          setEvents((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "marketing_source_events" },
        (payload) => {
          const row = payload.new as MarketingSourceEventRow;
          setEvents((prev) => prev.map((r) => (r.id === row.id ? row : r)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "marketing_source_events" },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (!oldRow?.id) return;
          setEvents((prev) => prev.filter((r) => r.id !== oldRow.id));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Pass 3: refresh source events when an external flow (e.g. Create Partner)
  // links a handoff, so the queue reflects the new referral_company_id.
  useEffect(() => {
    const handler = () => setReloadTick((n) => n + 1);
    window.addEventListener("bd:refresh-source-events", handler);
    return () => window.removeEventListener("bd:refresh-source-events", handler);
  }, []);

  return { sources, events, loading, error, refresh, hasMoreEvents, loadingMoreEvents, loadMoreEvents };
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
  const [partnerPrefill, setPartnerPrefill] = useState<PartnerForm | null>(null);
  const [outreachPrefill, setOutreachPrefill] = useState<{ subject?: string; notes?: string } | null>(null);
  const [taskPrefill, setTaskPrefill] = useState<{ title?: string; notes?: string } | null>(null);
  // Pass 3: retain the source event id that spawned a Create Partner flow so
  // we can auto-link the newly created company back to the handoff via
  // bd_link_source_event_to_referral. Reviewed remains an intentional user
  // action; we do NOT auto-mark the event reviewed here.
  const [pendingSourceEventId, setPendingSourceEventId] = useState<string | null>(null);

  const partnerName = (id?: string | null) => partners.find((p) => p.id === id)?.company_name ?? "-";

  const handleAddPartner = async (input: Partial<ReferralCompany> & { company_name: string }) => {
    try {
      const created = await createCompany(input);
      const eventId = pendingSourceEventId;
      if (eventId && created?.id) {
        try {
          const { error: linkErr } = await (supabase as unknown as {
            rpc: (name: string, params: Record<string, unknown>) => Promise<{ error: Error | null }>;
          }).rpc("bd_link_source_event_to_referral", {
            _event_id: eventId,
            _company_id: created.id,
          });
          if (linkErr) throw linkErr;
          toast.success("Partner created and source handoff linked.");
        } catch {
          toast.warning(
            "Partner created, but the source handoff could not be linked. Use Link to Existing Partner to finish the handoff.",
          );
        }
      } else {
        toast.success("Partner added");
      }
      setPendingSourceEventId(null);
      refreshPartners();
      // Refresh source events so the linked handoff reflects the new partner.
      window.dispatchEvent(new CustomEvent("bd:refresh-source-events"));
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
                <SelectItem value="archived">Archived</SelectItem>
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
              const isArchived = !!t.archived_at;
              if (taskStatusFilter === "archived") {
                if (!isArchived) return false;
              } else if (isArchived) {
                return false;
              }
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
                    <div className={`text-sm font-medium ${t.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                      {t.archived_at && <Badge variant="secondary" className="ml-2 align-middle">Archived</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{partnerName(t.company_id)} - {t.due_date ?? "no due"} - {t.priority ?? "Medium"}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.company_id && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        const p = partners.find((x) => x.id === t.company_id);
                        if (p) setDetailPartner(p);
                      }}><Eye className="h-3.5 w-3.5" /></Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditTask(t)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleArchiveTask(t)} title={t.archived_at ? "Restore" : "Archive"}>
                      {t.archived_at ? <Archive className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant={t.status === "Done" ? "ghost" : "outline"} onClick={() => handleToggleTask(t)} disabled={!!t.archived_at}>
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
          <SourceHandoffsPanel
            partners={visiblePartners}
            outreach={outreach}
            tasks={tasks}
            onCreatePartnerFromEvent={(prefill, eventId) => {
              setPendingSourceEventId(eventId ?? null);
              setPartnerPrefill(prefill);
              setPartnerOpen(true);
            }}
            onLogOutreachForPartner={(companyId, prefill) => {
              setOutPartner(companyId);
              setOutreachPrefill(prefill ?? null);
              setOutreachOpen(true);
            }}
            onCreateTaskForPartner={(companyId, prefill) => {
              setTaskPartner(companyId);
              setTaskPrefill(prefill ?? null);
              setTaskOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <PartnerDialog
        open={partnerOpen}
        onOpenChange={(v) => {
          setPartnerOpen(v);
          if (!v) {
            setPartnerPrefill(null);
            setPendingSourceEventId(null);
          }
        }}
        prefill={partnerPrefill ?? undefined}
        onSave={handleAddPartner}
      />
      <PartnerDialog
        open={!!editPartner}
        onOpenChange={(v) => { if (!v) setEditPartner(null); }}
        initial={editPartner ?? undefined}
        onSave={async (input) => {
          if (editPartner) await handleUpdatePartner(editPartner.id, input);
          setEditPartner(null);
        }}
      />
      <OutreachDialog
        open={outreachOpen}
        onOpenChange={(v) => { setOutreachOpen(v); if (!v) setOutreachPrefill(null); }}
        partners={visiblePartners}
        defaultCompanyId={outPartner !== "all" ? outPartner : undefined}
        prefill={outreachPrefill ?? undefined}
        onSave={handleLogOutreach}
      />
      <TaskDialog
        open={taskOpen}
        onOpenChange={(v) => { setTaskOpen(v); if (!v) setTaskPrefill(null); }}
        partners={visiblePartners}
        defaultCompanyId={taskPartner !== "all" ? taskPartner : undefined}
        prefill={taskPrefill ?? undefined}
        onSave={handleAddTask}
      />
      <TaskDialog
        open={!!editTask}
        onOpenChange={(v) => { if (!v) setEditTask(null); }}
        partners={partners}
        initial={editTask ?? undefined}
        onSave={async (patch) => {
          if (editTask) await handleUpdateTask(editTask.id, patch);
          setEditTask(null);
        }}
      />
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

function PartnerDialog({ open, onOpenChange, onSave, initial, prefill }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (p: Partial<ReferralCompany> & { company_name: string }) => Promise<void>; initial?: ReferralCompany; prefill?: Partial<PartnerForm> | null }) {
  const [form, setForm] = useState<PartnerForm>({ company_type: "Therapy Practice", relationship_stage: "New" });
  // Sync with initial/prefill when dialog opens. This is a side-effect on
  // props changing, so useEffect is the correct hook (useMemo returns a value
  // and should not schedule state updates).
  useEffect(() => {
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
      setForm({ company_type: "Therapy Practice", relationship_stage: "New", ...(prefill ?? {}) });
    }
  }, [open, initial, prefill]);
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

function OutreachDialog({ open, onOpenChange, partners, onSave, defaultCompanyId, prefill }: { open: boolean; onOpenChange: (v: boolean) => void; partners: ReferralCompany[]; onSave: (o: { company_id: string; activity_type: string; outcome?: string | null; subject?: string; notes?: string; activity_date: string }) => Promise<void>; defaultCompanyId?: string; prefill?: { subject?: string; notes?: string } | null }) {
  const initial = { activity_type: "Email", outcome: "Sent Email" as string | null, date: new Date().toISOString().slice(0, 10) };
  const [form, setForm] = useState<{ company_id?: string; activity_type: string; outcome: string | null; subject?: string; notes?: string; date: string }>({ ...initial, company_id: defaultCompanyId });
  // Prefill company/subject/notes when the dialog opens. This is a side-effect
  // (setForm) driven by prop changes, so useEffect is the correct hook -
  // useMemo must remain pure.
  useEffect(() => {
    if (open) setForm((f) => ({
      ...f,
      company_id: defaultCompanyId ?? f.company_id,
      subject: prefill?.subject ?? f.subject,
      notes: prefill?.notes ?? f.notes,
    }));
  }, [open, defaultCompanyId, prefill]);
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

type HandoffActions = {
  onCreatePartnerFromEvent: (prefill: Partial<PartnerForm>, eventId?: string) => void;
  onLogOutreachForPartner: (companyId: string, prefill?: { subject?: string; notes?: string }) => void;
  onCreateTaskForPartner: (companyId: string, prefill?: { title?: string; notes?: string }) => void;
};

function SourceHandoffsPanel({
  partners,
  outreach,
  tasks,
  onCreatePartnerFromEvent,
  onLogOutreachForPartner,
  onCreateTaskForPartner,
}: { partners: ReferralCompany[]; outreach: ReferralActivity[]; tasks: ReferralCrmTask[] } & HandoffActions) {
  const { sources, events, loading, error, refresh, hasMoreEvents, loadingMoreEvents, loadMoreEvents } = useMarketingSourceSignals();

  // Aggregate BD-safe view of lead source signals from referral partner data.
  const partnerRows = useMemo(() => {
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

  // Real marketing source signals from marketing_sources + marketing_source_events
  const sourceRows = useMemo(() => {
    if (sources.length === 0 && events.length === 0) return [];
    const partnerCountBySource = new Map<string, number>();
    for (const p of partners) {
      const key = (p.source && p.source.trim().toLowerCase()) || "";
      if (!key) continue;
      partnerCountBySource.set(key, (partnerCountBySource.get(key) ?? 0) + 1);
    }
    const eventsBySource = new Map<string, MarketingSourceEventRow[]>();
    for (const ev of events) {
      const key = ev.source_id ?? `sys:${ev.source_system}`;
      const arr = eventsBySource.get(key) ?? [];
      arr.push(ev);
      eventsBySource.set(key, arr);
    }
    type Row = {
      key: string; name: string; system: string; channel: string; state: string;
      leadCount: number; partnerCount: number; last: string | null; status: string; suggestion: string;
    };
    const rows: Row[] = [];
    const now = Date.now();
    for (const s of sources) {
      const evs = eventsBySource.get(s.id) ?? [];
      const last = evs[0]?.occurred_at ?? null;
      const daysOld = last ? Math.floor((now - new Date(last).getTime()) / 86_400_000) : null;
      const pCount = partnerCountBySource.get(s.name.toLowerCase()) ?? 0;
      let status = "No action needed";
      let suggestion = "Review source";
      if (evs.length > 0 && pCount === 0) { status = "Needs BD outreach"; suggestion = "Create referral partner"; }
      else if (evs.length > 0 && pCount > 0 && daysOld !== null && daysOld <= 14) { status = "Active partner"; suggestion = "Log outreach"; }
      else if (evs.length > 0 && daysOld !== null && daysOld > 30) { status = "Stale / no outreach"; suggestion = "Add follow-up"; }
      else if (evs.length === 0 && s.is_active) { status = "New signal"; suggestion = "Review source"; }
      rows.push({
        key: `src:${s.id}`,
        name: s.name,
        system: s.source_system ?? "-",
        channel: s.channel ?? "-",
        state: s.state ?? "-",
        leadCount: evs.length,
        partnerCount: pCount,
        last,
        status,
        suggestion,
      });
    }
    // Orphaned events with no source row - group by system
    for (const [key, evs] of eventsBySource) {
      if (key.startsWith("sys:")) {
        const system = key.slice(4);
        rows.push({
          key,
          name: `(${system} events)`,
          system,
          channel: "-",
          state: evs[0]?.state ?? "-",
          leadCount: evs.length,
          partnerCount: 0,
          last: evs[0]?.occurred_at ?? null,
          status: "New signal",
          suggestion: "Review source",
        });
      }
    }
    return rows.sort((a, b) => b.leadCount - a.leadCount);
  }, [sources, events, partners]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        Business Development read-only view of live lead source signals from marketing_sources and marketing_source_events, plus
        aggregate source tags on your referral partners. Full marketing analytics and campaign management remain in the Marketing workspace.
      </div>

      <HandoffQueue
        events={events}
        partners={partners}
        outreach={outreach}
        tasks={tasks}
        loading={loading}
        error={error}
        refresh={refresh}
        hasMoreEvents={hasMoreEvents}
        loadingMoreEvents={loadingMoreEvents}
        loadMoreEvents={loadMoreEvents}
        onCreatePartnerFromEvent={onCreatePartnerFromEvent}
        onLogOutreachForPartner={onLogOutreachForPartner}
        onCreateTaskForPartner={onCreateTaskForPartner}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Radio className="h-3.5 w-3.5" /> Live marketing source signals
        </div>
        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            Couldn't load marketing source signals: {error.message}
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-center text-xs text-muted-foreground">Loading source signals...</div>
        ) : sourceRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
            <Inbox className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <div className="text-sm font-semibold">Source integrations are ready</div>
            <div className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Once CTM, LeadTrap, Google Ads, Meta/Facebook Ads, RetellAI, Go Integrate Nava, or manual imports create source events,
              BD handoffs will appear here.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border/60">
              <div className="col-span-3">Source</div>
              <div className="col-span-2">System</div>
              <div className="col-span-1">State</div>
              <div className="col-span-1 text-right">Leads</div>
              <div className="col-span-1 text-right">Partners</div>
              <div className="col-span-2">Last activity</div>
              <div className="col-span-2">Status / next action</div>
            </div>
            {sourceRows.map((r) => (
              <div key={r.key} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b border-border/40 last:border-0">
                <div className="col-span-3 truncate font-medium">{r.name}</div>
                <div className="col-span-2 text-muted-foreground truncate">{r.system} {r.channel !== "-" && `/ ${r.channel}`}</div>
                <div className="col-span-1 text-muted-foreground truncate">{r.state}</div>
                <div className="col-span-1 text-right">{r.leadCount}</div>
                <div className="col-span-1 text-right">{r.partnerCount}</div>
                <div className="col-span-2 text-muted-foreground">{r.last ? r.last.slice(0, 10) : "-"}</div>
                <div className="col-span-2 text-muted-foreground truncate"><Badge variant="outline" className="mr-1">{r.status}</Badge>{r.suggestion}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pt-2">
          <HeartHandshake className="h-3.5 w-3.5" /> Referral partner source tags
        </div>
      {partnerRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
          <Inbox className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <div className="text-sm font-semibold">No partner source tags yet</div>
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
          {partnerRows.map((r) => (
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

function TaskDialog({ open, onOpenChange, partners, onSave, defaultCompanyId, initial, prefill }: { open: boolean; onOpenChange: (v: boolean) => void; partners: ReferralCompany[]; onSave: (t: Partial<ReferralCrmTask> & { title: string }) => Promise<void>; defaultCompanyId?: string; initial?: ReferralCrmTask; prefill?: { title?: string; notes?: string } | null }) {
  const [form, setForm] = useState<{ title?: string; company_id?: string; due_date?: string; priority: string; notes?: string }>({ priority: "Medium", company_id: defaultCompanyId });
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        company_id: initial.company_id ?? undefined,
        due_date: initial.due_date ?? undefined,
        priority: initial.priority ?? "Medium",
        notes: initial.notes ?? undefined,
      });
    } else {
      setForm((f) => ({
        ...f,
        company_id: defaultCompanyId ?? f.company_id,
        title: prefill?.title ?? f.title,
        notes: prefill?.notes ?? f.notes,
      }));
    }
  }, [open, defaultCompanyId, initial, prefill]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Follow-Up Task" : "Add Follow-Up Task"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title *" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.company_id ?? ""} onValueChange={(v) => setForm({ ...form, company_id: v })}>
            <SelectTrigger><SelectValue placeholder="Partner (optional)" /></SelectTrigger>
            <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Notes (optional)" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={async () => {
            if (!form.title?.trim()) { toast.error("Title is required"); return; }
            setSaving(true);
            await onSave({
              title: form.title.trim(),
              company_id: form.company_id ?? null,
              due_date: form.due_date ?? null,
              priority: form.priority,
              notes: form.notes ?? null,
              ...(isEdit ? {} : { status: "Open" }),
            });
            setSaving(false);
            onOpenChange(false);
            setForm({ priority: "Medium" });
          }}>{saving ? "Saving..." : isEdit ? "Save changes" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// ---------------------------------------------------------------------------
// HandoffQueue - actionable Business Development work queue driven by
// marketing_source_events. Actions are performed through safe SECURITY
// DEFINER RPCs (bd_assign_source_event, bd_mark_source_event_reviewed,
// bd_link_source_event_to_referral) so BD does not need broad write access
// to the marketing_source_events table.
// ---------------------------------------------------------------------------

const HANDOFF_SOURCE_SYSTEMS = [
  "CTM",
  "LeadTrap",
  "Google Ads",
  "Facebook Ads",
  "Meta Ads",
  "RetellAI",
  "Go Integrate Nava",
  "manual",
  "other",
];

type HandoffDerivedStatus =
  | "New / Needs BD review"
  | "Assigned"
  | "Linked / Outreach needed"
  | "Needs follow-up plan"
  | "Follow-up scheduled"
  | "Reviewed"
  | "Stale handoff";

function deriveHandoffStatus(
  ev: MarketingSourceEventRow,
  outreach: ReferralActivity[],
  tasks: ReferralCrmTask[] = [],
): HandoffDerivedStatus {
  const ageDays = Math.floor((Date.now() - new Date(ev.occurred_at).getTime()) / 86_400_000);
  if (ev.reviewed_at) return "Reviewed";
  if (!ev.referral_company_id && !ev.assigned_to) {
    return ageDays > 14 ? "Stale handoff" : "New / Needs BD review";
  }
  if (!ev.referral_company_id && ev.assigned_to) return "Assigned";
  const hasActivity = outreach.some((o) => o.company_id === ev.referral_company_id);
  if (ev.referral_company_id && !hasActivity) return "Linked / Outreach needed";
  const hasOpenFollowUp = tasks.some(
    (t) => t.company_id === ev.referral_company_id && !t.archived_at && t.status === "Open",
  );
  return hasOpenFollowUp ? "Follow-up scheduled" : "Needs follow-up plan";
}

function HandoffQueue({
  events,
  partners,
  outreach,
  tasks,
  loading,
  error,
  refresh,
  hasMoreEvents = false,
  loadingMoreEvents = false,
  loadMoreEvents,
  onCreatePartnerFromEvent,
  onLogOutreachForPartner,
  onCreateTaskForPartner,
}: {
  events: MarketingSourceEventRow[];
  partners: ReferralCompany[];
  outreach: ReferralActivity[];
  tasks: ReferralCrmTask[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  hasMoreEvents?: boolean;
  loadingMoreEvents?: boolean;
  loadMoreEvents?: () => void | Promise<void>;
} & HandoffActions) {
  // Persist filter/sort/search across tab switches and remounts.
  const PREFS_KEY = "bd.handoffQueue.prefs.v1";
  type HandoffPrefs = {
    statusFilter: string;
    systemFilter: string;
    stateFilter: string;
    linkFilter: string;
    assignFilter: string;
    sortMode: string;
    search: string;
    visibleCount: number;
    scrollY: number;
    activeEventId: string | null;
  };
  const defaultPrefs: HandoffPrefs = {
    statusFilter: "all",
    systemFilter: "all",
    stateFilter: "all",
    linkFilter: "all",
    assignFilter: "all",
    sortMode: "newest",
    search: "",
    visibleCount: 25,
    scrollY: 0,
    activeEventId: null,
  };
  const loadedPrefs = useMemo<HandoffPrefs>(() => {
    if (typeof window === "undefined") return defaultPrefs;
    try {
      const raw = window.sessionStorage.getItem(PREFS_KEY);
      if (!raw) return defaultPrefs;
      return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<HandoffPrefs>) };
    } catch {
      return defaultPrefs;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [statusFilter, setStatusFilter] = useState<string>(loadedPrefs.statusFilter);
  const [systemFilter, setSystemFilter] = useState<string>(loadedPrefs.systemFilter);
  const [stateFilter, setStateFilter] = useState<string>(loadedPrefs.stateFilter);
  const [linkFilter, setLinkFilter] = useState<string>(loadedPrefs.linkFilter);
  const [assignFilter, setAssignFilter] = useState<string>(loadedPrefs.assignFilter);
  const [sortMode, setSortMode] = useState<string>(loadedPrefs.sortMode);
  const [search, setSearch] = useState<string>(loadedPrefs.search);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(PREFS_KEY);
      const existing = raw ? (JSON.parse(raw) as Partial<HandoffPrefs>) : {};
      window.sessionStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ ...existing, statusFilter, systemFilter, stateFilter, linkFilter, assignFilter, sortMode, search }),
      );
    } catch {
      /* ignore quota */
    }
  }, [statusFilter, systemFilter, stateFilter, linkFilter, assignFilter, sortMode, search]);
  const [linkPickerFor, setLinkPickerFor] = useState<MarketingSourceEventRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Infinite scroll: render in pages of PAGE_SIZE, expand via IntersectionObserver.
  const PAGE_SIZE = 25;
  const [visibleCount, setVisibleCount] = useState<number>(
    Math.max(PAGE_SIZE, loadedPrefs.visibleCount || PAGE_SIZE),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(loadedPrefs.activeEventId);
  const restoredRef = useRef<boolean>(false);

  // Persist visibleCount, active event id, and last scroll position for restoration
  // when the user opens a drawer/dialog for an event and returns to the panel.
  const persistPref = (partial: Partial<HandoffPrefs>) => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(PREFS_KEY);
      const existing = raw ? (JSON.parse(raw) as Partial<HandoffPrefs>) : {};
      window.sessionStorage.setItem(PREFS_KEY, JSON.stringify({ ...existing, ...partial }));
    } catch {
      /* ignore quota */
    }
  };
  useEffect(() => { persistPref({ visibleCount }); }, [visibleCount]);
  useEffect(() => { persistPref({ activeEventId }); }, [activeEventId]);
  useEffect(() => {
    const onScroll = () => persistPref({ scrollY: window.scrollY });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setCurrentUserId(data.user?.id ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  const availableStates = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => { if (e.state) set.add(e.state); });
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    let rows = events.map((e) => ({ ev: e, derived: deriveHandoffStatus(e, outreach, tasks) }));
    if (statusFilter !== "all") {
      rows = rows.filter((r) => {
        switch (statusFilter) {
          case "new":               return r.derived === "New / Needs BD review";
          case "stale":             return r.derived === "Stale handoff";
          case "assigned":          return r.derived === "Assigned";
          case "linked":            return r.derived === "Linked / Outreach needed";
          case "needs_followup":    return r.derived === "Needs follow-up plan";
          case "followup_scheduled":return r.derived === "Follow-up scheduled";
          case "reviewed":          return r.derived === "Reviewed";
          default: return true;
        }
      });
    }
    if (systemFilter !== "all") {
      rows = rows.filter((r) => (r.ev.source_system ?? "").toLowerCase() === systemFilter.toLowerCase());
    }
    if (stateFilter !== "all") rows = rows.filter((r) => r.ev.state === stateFilter);
    if (linkFilter === "linked") rows = rows.filter((r) => !!r.ev.referral_company_id);
    if (linkFilter === "unlinked") rows = rows.filter((r) => !r.ev.referral_company_id);
    if (assignFilter === "assigned") rows = rows.filter((r) => !!r.ev.assigned_to);
    if (assignFilter === "unassigned") rows = rows.filter((r) => !r.ev.assigned_to);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => {
        const e = r.ev;
        return [e.caller_name, e.caller_email, e.caller_phone, e.payload_summary, e.source_system, e.event_type]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      });
    }
    switch (sortMode) {
      case "oldest":
        rows.sort((a, b) => new Date(a.ev.occurred_at).getTime() - new Date(b.ev.occurred_at).getTime());
        break;
      case "unreviewed":
        rows.sort((a, b) => Number(!!a.ev.reviewed_at) - Number(!!b.ev.reviewed_at)
          || new Date(b.ev.occurred_at).getTime() - new Date(a.ev.occurred_at).getTime());
        break;
      case "unlinked":
        rows.sort((a, b) => Number(!!a.ev.referral_company_id) - Number(!!b.ev.referral_company_id)
          || new Date(b.ev.occurred_at).getTime() - new Date(a.ev.occurred_at).getTime());
        break;
      default:
        rows.sort((a, b) => new Date(b.ev.occurred_at).getTime() - new Date(a.ev.occurred_at).getTime());
    }
    return rows;
  }, [events, outreach, tasks, statusFilter, systemFilter, stateFilter, linkFilter, assignFilter, sortMode, search]);

  // Reset paging when filters/sort/search change so users always start at the top of a fresh result set.
  useEffect(() => {
    if (restoredRef.current) setVisibleCount(PAGE_SIZE);
  }, [statusFilter, systemFilter, stateFilter, linkFilter, assignFilter, sortMode, search]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  // Local "more to render" (already in memory) vs server "more to fetch" (older
  // rows behind the cursor). We render local first, then trigger server fetch.
  const hasMoreLocal = visibleCount < filtered.length;
  const hasMore = hasMoreLocal || hasMoreEvents;

  // On mount, once data is available, restore the last-open event's scroll position.
  useEffect(() => {
    if (restoredRef.current) return;
    if (loading) return;
    if (filtered.length === 0) { restoredRef.current = true; return; }
    // Ensure the active event is within the visible page window.
    if (activeEventId) {
      const idx = filtered.findIndex((r) => r.ev.id === activeEventId);
      if (idx >= 0 && idx >= visibleCount) {
        setVisibleCount(Math.min(filtered.length, idx + PAGE_SIZE));
        return;
      }
    }
    // Defer to next frame so the DOM has rendered the rows.
    const raf = requestAnimationFrame(() => {
      if (activeEventId) {
        const el = document.querySelector<HTMLElement>(`[data-handoff-id="${activeEventId}"]`);
        if (el) {
          el.scrollIntoView({ block: "center" });
          restoredRef.current = true;
          return;
        }
      }
      if (loadedPrefs.scrollY) window.scrollTo({ top: loadedPrefs.scrollY });
      restoredRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, [loading, filtered, activeEventId, visibleCount, loadedPrefs.scrollY]);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (hasMoreLocal) {
            setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
          } else if (hasMoreEvents && !loadingMoreEvents) {
            void loadMoreEvents?.();
          }
        }
      }
    }, { rootMargin: "300px" });
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, hasMoreLocal, hasMoreEvents, loadingMoreEvents, loadMoreEvents, filtered.length]);

  const partnerById = useMemo(() => {
    const m = new Map<string, ReferralCompany>();
    partners.forEach((p) => m.set(p.id, p));
    return m;
  }, [partners]);

  const runRpc = async (
    id: string,
    fn: "bd_assign_source_event" | "bd_mark_source_event_reviewed" | "bd_link_source_event_to_referral",
    args: Record<string, unknown>,
    successMsg: string,
  ) => {
    setBusyId(id);
    try {
      // Typed loosely because RPCs were just added and may not be in generated types yet.
      const { error: rpcErr } = await (supabase as unknown as {
        rpc: (name: string, params: Record<string, unknown>) => Promise<{ error: Error | null }>;
      }).rpc(fn, args);
      if (rpcErr) throw rpcErr;
      toast.success(successMsg);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const buildPartnerPrefill = (ev: MarketingSourceEventRow): Partial<PartnerForm> => {
    const notes = [
      ev.payload_summary && `Payload: ${ev.payload_summary}`,
      ev.caller_name && `Caller: ${ev.caller_name}`,
      ev.caller_phone && `Phone: ${ev.caller_phone}`,
      ev.caller_email && `Email: ${ev.caller_email}`,
      ev.event_type && `Event: ${ev.event_type}`,
    ].filter(Boolean).join("\n");
    return {
      company_name: ev.caller_name ?? "",
      source: ev.source_system,
      state: ev.state ?? undefined,
      main_phone: ev.caller_phone ?? undefined,
      main_email: ev.caller_email ?? undefined,
      notes: notes || undefined,
      relationship_stage: "New",
    };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pt-2">
        <Inbox className="h-3.5 w-3.5" /> Handoff queue
        <Badge variant="outline" className="ml-2">{filtered.length}</Badge>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-3 flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-7 w-56"
            placeholder="Search name / phone / email / payload"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New / Needs BD review</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="linked">Linked / Outreach needed</SelectItem>
            <SelectItem value="needs_followup">Needs follow-up plan</SelectItem>
            <SelectItem value="followup_scheduled">Follow-up scheduled</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="stale">Stale handoff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={systemFilter} onValueChange={setSystemFilter}>
          <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Source system" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All source systems</SelectItem>
            {HANDOFF_SOURCE_SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="h-8 w-32"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {availableStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={linkFilter} onValueChange={setLinkFilter}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Linked?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Linked & unlinked</SelectItem>
            <SelectItem value="linked">Linked only</SelectItem>
            <SelectItem value="unlinked">Unlinked only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assignFilter} onValueChange={setAssignFilter}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Assignment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any assignment</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={setSortMode}>
          <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="unreviewed">Unreviewed first</SelectItem>
            <SelectItem value="unlinked">Unlinked first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" /> Couldn't load handoff queue
          </div>
          <div className="text-destructive/80">{error.message}</div>
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading handoff queue">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-card p-3 animate-pulse">
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="h-4 w-16 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded-full bg-muted" />
                <div className="h-4 w-12 rounded-full bg-muted" />
              </div>
              <div className="mt-2 h-3 w-32 rounded bg-muted" />
              <div className="mt-2 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
              <div className="mt-3 flex gap-1.5">
                <div className="h-7 w-28 rounded-md bg-muted" />
                <div className="h-7 w-36 rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        (() => {
          const hasFilters =
            !!search.trim() ||
            statusFilter !== "all" ||
            systemFilter !== "all" ||
            stateFilter !== "all" ||
            linkFilter !== "all" ||
            assignFilter !== "all";
          const noData = events.length === 0;
          return (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
              <Inbox className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-semibold">
                {noData
                  ? "No source handoffs yet"
                  : hasFilters
                    ? "No handoffs match these filters"
                    : "You're all caught up"}
              </div>
              <div className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {noData
                  ? "Handoffs appear here as new CTM, LeadTrap, Google Ads, Meta Ads, RetellAI, Go Integrate Nava, or manual source events arrive."
                  : hasFilters
                    ? "Try clearing filters to see the full queue."
                    : "Every source handoff has been reviewed."}
              </div>
              {hasFilters && !noData && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setSystemFilter("all");
                      setStateFilter("all");
                      setLinkFilter("all");
                      setAssignFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => refresh()}>
                    Refresh
                  </Button>
                </div>
              )}
              {noData && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => refresh()}>
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="space-y-2">
          {visibleRows.map(({ ev, derived }) => {
            const partner = ev.referral_company_id ? partnerById.get(ev.referral_company_id) : null;
            const busy = busyId === ev.id;
            // Pass 3: expose open follow-up count / nearest due date on the row.
            const openTasks = ev.referral_company_id
              ? tasks.filter(
                  (t) => t.company_id === ev.referral_company_id && !t.archived_at && t.status === "Open",
                )
              : [];
            const nearestDue = openTasks
              .map((t) => t.due_date)
              .filter((d): d is string => !!d)
              .sort()[0];
            const suggestion =
              derived === "New / Needs BD review"    ? "Create or link a partner"
              : derived === "Stale handoff"          ? "Review and assign immediately"
              : derived === "Assigned"               ? "Link to a partner"
              : derived === "Linked / Outreach needed" ? "Log outreach with linked partner"
              : derived === "Needs follow-up plan"   ? "Create a follow-up task"
              : derived === "Follow-up scheduled"    ? "Work next scheduled follow-up"
              : derived === "Reviewed"               ? "Reviewed"
              : "No further action";
            return (
              <div
                key={ev.id}
                data-handoff-id={ev.id}
                className={`rounded-2xl border p-3 transition-colors ${
                  activeEventId === ev.id
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                    : "border-border/70 bg-card"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{ev.source_system}</Badge>
                      {ev.event_type && <Badge variant="secondary">{ev.event_type}</Badge>}
                      {ev.state && <Badge variant="outline">{ev.state}</Badge>}
                      <Badge variant="outline">{derived}</Badge>
                      {ev.assigned_to && <Badge variant="secondary">Assigned</Badge>}
                      {ev.reviewed_at && <Badge variant="secondary">Reviewed</Badge>}
                      {partner && <Badge variant="outline">Partner: {partner.company_name}</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(ev.occurred_at).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs space-y-0.5">
                      {ev.caller_name && <div><span className="text-muted-foreground">Caller:</span> {ev.caller_name}</div>}
                      {(ev.caller_phone || ev.caller_email) && (
                        <div className="text-muted-foreground">
                          {ev.caller_phone ?? ""}{ev.caller_phone && ev.caller_email ? " . " : ""}{ev.caller_email ?? ""}
                        </div>
                      )}
                      {ev.payload_summary && (
                        <div className="text-muted-foreground line-clamp-2">{ev.payload_summary}</div>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground italic">
                      Suggested next action: {suggestion}
                    </div>
                    {openTasks.length > 0 && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Open follow-ups: {openTasks.length}
                        {nearestDue ? ` . next due ${new Date(nearestDue).toLocaleDateString()}` : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {!partner && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setActiveEventId(ev.id);
                          onCreatePartnerFromEvent(buildPartnerPrefill(ev), ev.id);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create Partner
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || partners.length === 0}
                        onClick={() => { setActiveEventId(ev.id); setLinkPickerFor(ev); }}
                      >
                        <Link2 className="h-3.5 w-3.5 mr-1" /> Link to Existing Partner
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (!partner) { toast.error("Create or link a partner first"); return; }
                      setActiveEventId(ev.id);
                      onLogOutreachForPartner(partner.id, {
                        subject: `${ev.source_system} handoff${ev.caller_name ? ` - ${ev.caller_name}` : ""}`,
                        notes: ev.payload_summary ?? undefined,
                      });
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Log Outreach
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (!partner) { toast.error("Create or link a partner first"); return; }
                      setActiveEventId(ev.id);
                      onCreateTaskForPartner(partner.id, {
                        title: `Follow up on ${ev.source_system} handoff`,
                        notes: [
                          ev.caller_name && `Caller: ${ev.caller_name}`,
                          ev.caller_phone && `Phone: ${ev.caller_phone}`,
                          ev.caller_email && `Email: ${ev.caller_email}`,
                          ev.payload_summary && `Payload: ${ev.payload_summary}`,
                        ].filter(Boolean).join("\n") || undefined,
                      });
                    }}
                  >
                    <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Create Follow-Up
                  </Button>
                  {!ev.assigned_to && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || !currentUserId}
                      onClick={() => runRpc(ev.id, "bd_assign_source_event", { _event_id: ev.id }, "Assigned to you")}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> {busy ? "Saving..." : "Assign to Me"}
                    </Button>
                  )}
                  {!ev.reviewed_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => runRpc(ev.id, "bd_mark_source_event_reviewed", { _event_id: ev.id }, "Marked reviewed")}
                    >
                      <CheckSquare className="h-3.5 w-3.5 mr-1" /> {busy ? "Saving..." : "Mark Reviewed"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-3 text-center text-[11px] text-muted-foreground"
            >
              {loadingMoreEvents
                ? `Fetching older handoffs... (${visibleRows.length} loaded)`
                : hasMoreLocal
                ? `Loading more... (${visibleRows.length} of ${filtered.length})`
                : `Older handoffs available (${visibleRows.length} loaded)`}
              <div className="mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loadingMoreEvents}
                  onClick={() => {
                    if (hasMoreLocal) {
                      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
                    } else if (hasMoreEvents) {
                      void loadMoreEvents?.();
                    }
                  }}
                >
                  {loadingMoreEvents ? "Loading..." : "Load more"}
                </Button>
              </div>
            </div>
          ) : filtered.length > PAGE_SIZE ? (
            <div className="text-center text-[11px] text-muted-foreground py-2">
              All {filtered.length} handoffs loaded
            </div>
          ) : null}
        </div>
      )}

      {linkPickerFor && (
        <LinkPartnerDialog
          event={linkPickerFor}
          partners={partners}
          onClose={() => setLinkPickerFor(null)}
          onLink={async (companyId) => {
            const evId = linkPickerFor.id;
            setLinkPickerFor(null);
            await runRpc(evId, "bd_link_source_event_to_referral", {
              _event_id: evId,
              _company_id: companyId,
            }, "Linked to partner");
          }}
        />
      )}
    </div>
  );
}

function LinkPartnerDialog({
  event, partners, onClose, onLink,
}: {
  event: MarketingSourceEventRow;
  partners: ReferralCompany[];
  onClose: () => void;
  onLink: (companyId: string) => Promise<void> | void;
}) {
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link source handoff to existing partner</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground mb-2">
          {event.source_system} . {event.caller_name ?? "no caller name"} . {new Date(event.occurred_at).toLocaleString()}
        </div>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger><SelectValue placeholder="Select partner *" /></SelectTrigger>
          <SelectContent>
            {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!companyId || saving}
            onClick={async () => {
              if (!companyId) return;
              setSaving(true);
              await onLink(companyId);
              setSaving(false);
            }}
          >
            {saving ? "Linking..." : "Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
