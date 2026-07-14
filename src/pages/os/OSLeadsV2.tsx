import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Upload, Download, Filter, Sparkles, X, AlertCircle,
  PhoneCall, Mail, Send, StickyNote, ChevronRight, Users, RefreshCw,
  Loader2, UserPlus, MoveRight, CalendarClock, CheckSquare, UserCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { scopeLeadsForUser } from "@/lib/leads/scoping";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { IntakeModalsProvider, useIntakeModals } from "@/components/intake/IntakeModals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { INTAKE_COORDINATORS, type Lead, type LeadStatus } from "@/data/leads";
import { toast } from "sonner";
import {
  FAMILY_LEAD_PIPELINE_STAGES,
  canonicalFamilyLeadStage,
  isReadyToStartStage,
  isNonQualifiedStatus,
  isCannotReachStatus,
  isLeadOutOfPipeline,
  hasMissingFormReview,
  getLeadNextStep,
  getLeadBlocker,
  type FamilyLeadPipelineStage,
} from "@/lib/intake/intakeWorkflow";

type ViewMode = "list" | "pipeline" | "followup";

/**
 * Export 87 — Canonical Family / Lead Workflow tabs. Every tab groups leads
 * via `canonicalFamilyLeadStage` so legacy Monday-era statuses (e.g.
 * "VOB Completed", "Missing Information", "New Lead") are mapped to their
 * canonical equivalent before bucketing. No hand-built legacy matchers.
 */
const isNonQualified = (l: Lead) =>
  l.status === "Non-Qualified" ||
  l.status === "Non-qualified Lead" ||
  Boolean(l.notQualifiedReason && l.notQualifiedReason.trim());

const inCanonical = (l: Lead, stages: FamilyLeadPipelineStage[]) =>
  !isNonQualified(l) && stages.includes(canonicalFamilyLeadStage(l.status));

const STATUS_TABS: { key: string; label: string; match: (l: Lead) => boolean }[] = [
  { key: "all",           label: "All Leads",       match: () => true },
  { key: "contact",       label: "Contact Needed",  match: (l) => inCanonical(l, ["Lead Captured", "First Contact Attempt"]) },
  { key: "engagement",    label: "Engagement",      match: (l) => inCanonical(l, ["Engagement Track"]) },
  { key: "qualification", label: "Qualification",   match: (l) => inCanonical(l, ["Qualification"]) },
  { key: "packets",       label: "Packets",         match: (l) => inCanonical(l, ["Intake Packet Sent", "Intake Packet Follow Up"]) },
  { key: "intake_complete", label: "Intake Complete", match: (l) => inCanonical(l, ["Intake Complete"]) },
  { key: "benefits",      label: "Benefits",        match: (l) => inCanonical(l, ["Benefits Verification"]) },
  { key: "assessment",    label: "Assessment",      match: (l) => inCanonical(l, ["Assessment Scheduling"]) },
  { key: "qa_auth",       label: "QA / Auth",       match: (l) => inCanonical(l, ["QA / Treatment Plan Authorization", "Authorization Pending"]) },
  { key: "staffing",      label: "Staffing",        match: (l) => inCanonical(l, ["Staffing Match"]) },
  { key: "ready",         label: "Ready to Start",  match: (l) => isReadyToStartStage(l.status) },
  { key: "nq",            label: "Not Qualified",   match: (l) => isNonQualified(l) },
  { key: "stuck",         label: "Stuck / Aging",   match: (l) => {
      if (isNonQualified(l)) return false;
      if (isReadyToStartStage(l.status)) return false;
      const last = l.lastContacted ? new Date(l.lastContacted).getTime() : 0;
      const days = last ? Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000)) : 999;
      return days > 5;
    } },
];

/** Aging dot — soft healthcare-style status indicator. */
function agingFor(l: Lead): { tone: string; label: string; days: number } {
  const last = l.lastContacted ? new Date(l.lastContacted).getTime() : 0;
  const days = last ? Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000)) : 999;
  if (!last) return { tone: "bg-rose-500", label: "Never contacted", days };
  if (days <= 2) return { tone: "bg-emerald-500", label: `${days}d ago`, days };
  if (days <= 5) return { tone: "bg-amber-500", label: `${days}d ago`, days };
  return { tone: "bg-rose-500", label: `${days}d ago`, days };
}

/**
 * Export 87 — Pipeline columns are generated from the canonical 13-stage
 * Family / Lead Workflow. Leads are bucketed by `canonicalFamilyLeadStage`
 * so legacy statuses surface under the right canonical column. Notably,
 * "VOB Completed" maps to Assessment Scheduling (NOT Benefits Verification).
 */
const PIPELINE_STAGES: { key: string; label: FamilyLeadPipelineStage; match: (l: Lead) => boolean }[] =
  FAMILY_LEAD_PIPELINE_STAGES.map((stage) => ({
    key: stage,
    label: stage,
    match: (l: Lead) => canonicalFamilyLeadStage(l.status) === stage,
  }));

/**
 * Operational Intake Pulse — the 6 cards from the spec.
 * Kept lightweight and clickable; each filters the active view.
 */
const KPI_DEFS = [
  { key: "lead_captured",    label: "Lead Captured",         test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "Lead Captured" },
  { key: "contact_needed",   label: "Contact Needed",        test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "First Contact Attempt" || !l.lastContacted },
  { key: "packet_followup",  label: "Packet Follow Up",      test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "Intake Packet Follow Up" },
  { key: "benefits_pending", label: "Benefits Verification", test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "Benefits Verification" },
  { key: "assessment",       label: "Assessment Scheduling", test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "Assessment Scheduling" },
  { key: "auth_pending",     label: "Authorization Pending", test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "Authorization Pending" },
  { key: "staffing_match",   label: "Staffing Match",        test: (l: Lead) => canonicalFamilyLeadStage(l.status) === "Staffing Match" },
  { key: "ready_to_start",   label: "Ready to Start",        test: (l: Lead) => isReadyToStartStage(l.status) },
];

function StateBadge({ state }: { state: string }) {
  if (!state) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground font-medium tabular-nums">
      {state}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  // Export 88 — color by canonical Family / Lead pipeline stage first. The
  // raw label still renders so imported records remain recognizable, but
  // tone/grouping is driven by canonicalFamilyLeadStage. Non-canonical
  // outcomes (Non-Qualified, Cannot Reach) keep their own destructive tone.
  let tone = "bg-muted text-foreground";
  if (isNonQualifiedStatus(status) || isCannotReachStatus(status)) {
    tone = "bg-destructive/10 text-destructive";
  } else if (isReadyToStartStage(status)) {
    tone = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  } else {
    const canonical = canonicalFamilyLeadStage(status);
    if (canonical === "Assessment Scheduling" || canonical === "Intake Complete" || canonical === "Staffing Match") {
      tone = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    } else if (canonical === "Intake Packet Follow Up") {
      tone = "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    } else if (
      canonical === "Benefits Verification" ||
      canonical === "QA / Treatment Plan Authorization" ||
      canonical === "Authorization Pending"
    ) {
      tone = "bg-sky-500/10 text-sky-700 dark:text-sky-300";
    }
  }
  return <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", tone)}>{status}</span>;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface FilterState {
  states: Set<string>;
  owners: Set<string>;
  statuses: Set<string>;
  formStatuses: Set<string>;
  vobStatuses: Set<string>;
  insurances: Set<string>;
  missingOnly: boolean;
}
const emptyFilters = (): FilterState => ({
  states: new Set(), owners: new Set(), statuses: new Set(),
  formStatuses: new Set(), vobStatuses: new Set(), insurances: new Set(),
  missingOnly: false,
});

/**
 * Map of URL search-param keys → FilterState set fields. Kept tiny so the
 * resulting URL stays human-readable (e.g. ?tab=missing&owner=Sarah+M.).
 */
const FILTER_SET_KEYS = {
  state: "states",
  owner: "owners",
  status: "statuses",
  form: "formStatuses",
  vob: "vobStatuses",
  insurance: "insurances",
} as const;

const VIEW_MODES: ReadonlyArray<ViewMode> = ["list", "pipeline", "followup"];

function parseCsv(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function filtersFromParams(params: URLSearchParams): FilterState {
  const f = emptyFilters();
  (Object.entries(FILTER_SET_KEYS) as [keyof typeof FILTER_SET_KEYS, keyof FilterState][])
    .forEach(([param, field]) => {
      const vals = parseCsv(params.get(param));
      if (vals.length) (f[field] as Set<string>) = new Set(vals);
    });
  if (params.get("missing") === "1") f.missingOnly = true;
  return f;
}

function applyStateToParams(params: URLSearchParams, opts: {
  view: ViewMode;
  tab: string;
  kpi: string | null;
  query: string;
  filters: FilterState;
}) {
  const next = new URLSearchParams(params);
  const setOrDelete = (key: string, value: string) => {
    if (value) next.set(key, value); else next.delete(key);
  };
  setOrDelete("view", opts.view === "list" ? "" : opts.view);
  setOrDelete("tab", opts.tab && opts.tab !== "all" ? opts.tab : "");
  setOrDelete("kpi", opts.kpi ?? "");
  setOrDelete("q", opts.query.trim());
  (Object.entries(FILTER_SET_KEYS) as [keyof typeof FILTER_SET_KEYS, keyof FilterState][])
    .forEach(([param, field]) => {
      const set = opts.filters[field] as Set<string>;
      setOrDelete(param, set.size ? [...set].join(",") : "");
    });
  setOrDelete("missing", opts.filters.missingOnly ? "1" : "");
  return next;
}

export default function OSLeadsV2() {
  return (
    <IntakeModalsProvider>
      <OSLeadsV2Inner />
    </IntakeModalsProvider>
  );
}

function OSLeadsV2Inner() {
  const { leads, loading, error, refresh, bulkUpdate, moveStage, assignOwner } = useLeads();
  const { user, roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileState, setProfileState] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // All view state is derived from the URL so browser back/forward restores
  // filters, search, tab, sort, pagination, and the open drawer exactly.
  const viewParam = searchParams.get("view") as ViewMode | null;
  const view: ViewMode = viewParam && VIEW_MODES.includes(viewParam) ? viewParam : "list";
  const query = searchParams.get("q") ?? "";
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const activeKpi = searchParams.get("kpi");
  const activeTab = searchParams.get("tab") || "all";
  const openLeadId = searchParams.get("lead") || null;
  const page = Math.max(0, (Number(searchParams.get("p")) || 1) - 1);
  // Pipeline-only filters (only applied when view === "pipeline").
  const pipelineMine = searchParams.get("mine") === "1";
  const pipelineDays = (() => {
    const raw = searchParams.get("pdays");
    const n = raw ? Number(raw) : NaN;
    return [7, 14, 30, 90].includes(n) ? n : null;
  })();
  const pipelineStages = useMemo<Set<string>>(() => {
    const csv = searchParams.get("pstage");
    if (!csv) return new Set();
    return new Set(csv.split(",").map((s) => s.trim()).filter(Boolean));
  }, [searchParams]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  /** Mutate URL params. Push by default so back/forward traverses UI state. */
  const updateParams = (
    mutate: (p: URLSearchParams) => void,
    opts?: { replace?: boolean },
  ) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: opts?.replace ?? false });
    }
  };
  const resetPage = (p: URLSearchParams) => p.delete("p");
  const setView = (v: ViewMode) =>
    updateParams((p) => { if (v === "list") p.delete("view"); else p.set("view", v); });
  // Typing shouldn't spam history — mirror query with replace, then reset page.
  const setQuery = (v: string) =>
    updateParams((p) => {
      const t = v.trim();
      if (t) p.set("q", t); else p.delete("q");
      resetPage(p);
    }, { replace: true });
  const setFilters = (next: FilterState | ((f: FilterState) => FilterState)) =>
    updateParams((p) => {
      const nextFilters = typeof next === "function" ? next(filtersFromParams(p)) : next;
      const params = applyStateToParams(p, {
        view, tab: activeTab, kpi: activeKpi, query, filters: nextFilters,
      });
      // applyStateToParams returns a fresh object, copy back into p.
      Array.from(p.keys()).forEach((k) => p.delete(k));
      params.forEach((val, k) => p.set(k, val));
      resetPage(p);
    });
  const setActiveKpi = (k: string | null) =>
    updateParams((p) => { if (k) p.set("kpi", k); else p.delete("kpi"); resetPage(p); });
  const setActiveTab = (t: string) =>
    updateParams((p) => { if (t && t !== "all") p.set("tab", t); else p.delete("tab"); resetPage(p); });
  const setOpenLeadId = (id: string | null) =>
    updateParams((p) => { if (id) p.set("lead", id); else p.delete("lead"); });
  const setPage = (n: number) =>
    updateParams((p) => { if (n > 0) p.set("p", String(n + 1)); else p.delete("p"); });

  const setPipelineMine = (on: boolean) =>
    updateParams((p) => { if (on) p.set("mine", "1"); else p.delete("mine"); });
  const setPipelineDays = (n: number | null) =>
    updateParams((p) => { if (n) p.set("pdays", String(n)); else p.delete("pdays"); });
  const togglePipelineStage = (stage: string) =>
    updateParams((p) => {
      const cur = new Set((p.get("pstage") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
      if (cur.has(stage)) cur.delete(stage); else cur.add(stage);
      if (cur.size) p.set("pstage", [...cur].join(",")); else p.delete("pstage");
    });
  const clearPipelineFilters = () =>
    updateParams((p) => { p.delete("mine"); p.delete("pdays"); p.delete("pstage"); });

  // Missing-lead guard: if the ?lead=<id> deep link (from CTM or escalation
  // chips) doesn't resolve to a real lead once data is loaded, surface a
  // toast and clear the stale param so the drawer never mounts on nothing.
  const missingLeadHandledRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;
    if (!openLeadId) { missingLeadHandledRef.current = null; return; }
    if (missingLeadHandledRef.current === openLeadId) return;
    const exists = leads.some((l) => l.id === openLeadId);
    if (!exists) {
      missingLeadHandledRef.current = openLeadId;
      toast.error("Lead not found", {
        description: "That lead may have been deleted or you don't have access.",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("lead");
      setSearchParams(next, { replace: true });
    }
  }, [loading, leads, openLeadId, searchParams, setSearchParams]);

  // Manual lead creation (Add Lead button + ?new=1 deep link).
  const [newLeadOpen, setNewLeadOpen] = useState<boolean>(() => searchParams.get("new") === "1");
  useEffect(() => {
    if (searchParams.get("new") === "1") setNewLeadOpen(true);
  }, [searchParams]);
  const handleNewLeadOpenChange = (next: boolean) => {
    setNewLeadOpen(next);
    if (!next && searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams);
      params.delete("new");
      setSearchParams(params, { replace: true });
    }
  };

  // Load profile state + display_name for scoping.
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles")
      .select("state, display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileState((data?.state as string) ?? null);
        setDisplayName((data?.display_name as string) ?? null);
      });
  }, [user?.id]);

  // Apply role scoping.
  const scopedLeads = useMemo(
    () => scopeLeadsForUser(leads, { state: profileState, displayName, roles: roles as string[] }),
    [leads, profileState, displayName, roles],
  );

  // Apply search + filters + active KPI.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedLeads.filter((l) => {
      if (q) {
        const hay = [l.childName, l.parentName, l.phone, l.email, l.primaryInsurance, l.owner, l.state]
          .map((s) => String(s ?? "").toLowerCase()).join(" ");
        if (!hay.includes(q)) return false;
      }
      if (filters.states.size && !filters.states.has(l.state)) return false;
      if (filters.owners.size && !filters.owners.has(l.owner)) return false;
      if (filters.statuses.size && !filters.statuses.has(l.status)) return false;
      if (filters.formStatuses.size && !filters.formStatuses.has(l.formStatus)) return false;
      if (filters.vobStatuses.size && !filters.vobStatuses.has(l.vobStatus)) return false;
      if (filters.insurances.size && !filters.insurances.has(l.primaryInsurance || "—")) return false;
      // Export 88 — canonical "Intake Packet Follow Up" is the missing-info
      // stage. Form-review "Missing Info"/"Missing Information" also qualifies.
      if (filters.missingOnly) {
        const canonical = canonicalFamilyLeadStage(l.status);
        if (canonical !== "Intake Packet Follow Up" && !hasMissingFormReview(l)) return false;
      }
      if (activeKpi) {
        const k = KPI_DEFS.find((kk) => kk.key === activeKpi);
        if (k && !k.test(l)) return false;
      }
      if (activeTab && activeTab !== "all") {
        const t = STATUS_TABS.find((tt) => tt.key === activeTab);
        if (t && !t.match(l)) return false;
      }
      return true;
    });
  }, [scopedLeads, query, filters, activeKpi, activeTab]);

  // Drop selected ids that are no longer visible after filtering.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filtered.map((l) => l.id));
      const next = new Set<string>();
      prev.forEach((id) => { if (visible.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const clearSelection = () => setSelectedIds(new Set());
  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  const togglePage = (ids: string[], checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });

  // Counts per status tab (computed against scoped, not filtered, so badges stay stable).
  const tabCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of STATUS_TABS) c[t.key] = 0;
    for (const l of scopedLeads) for (const t of STATUS_TABS) if (t.match(l)) c[t.key]++;
    return c;
  }, [scopedLeads]);

  const kpiCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of KPI_DEFS) c[k.key] = 0;
    for (const l of scopedLeads) for (const k of KPI_DEFS) if (k.test(l)) c[k.key]++;
    return c;
  }, [scopedLeads]);

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    const toChip = (label: string, set: Set<string>, key: keyof FilterState) =>
      [...set].forEach((v) => chips.push({
        label: `${label}: ${v}`,
        clear: () => setFilters((f) => {
          const next = new Set(f[key] as Set<string>); next.delete(v);
          return { ...f, [key]: next };
        }),
      }));
    toChip("State", filters.states, "states");
    toChip("Owner", filters.owners, "owners");
    toChip("Status", filters.statuses, "statuses");
    toChip("Form", filters.formStatuses, "formStatuses");
    toChip("VOB", filters.vobStatuses, "vobStatuses");
    toChip("Insurance", filters.insurances, "insurances");
    if (filters.missingOnly) chips.push({ label: "Missing info only", clear: () => setFilters((f) => ({ ...f, missingOnly: false })) });
    if (activeKpi) {
      const k = KPI_DEFS.find((kk) => kk.key === activeKpi);
      if (k) chips.push({ label: k.label, clear: () => setActiveKpi(null) });
    }
    return chips;
  }, [filters, activeKpi]);

  const exportCsv = () => {
    const cols = ["childName", "parentName", "state", "owner", "status", "lastContacted", "formStatus", "primaryInsurance", "vobStatus", "phone", "email"];
    const header = cols.join(",");
    const rows = filtered.map((l) =>
      cols.map((c) => {
        const v = (l as any)[c];
        const s = v == null ? "" : String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} leads`);
  };

  // Pipeline-scoped subset applied on top of the shared `filtered` list.
  const meName = (displayName ?? "").trim().toLowerCase();
  const meEmail = (user?.email ?? "").toLowerCase();
  const pipelineLeads = useMemo(() => {
    if (view !== "pipeline") return filtered;
    const cutoff = pipelineDays
      ? Date.now() - pipelineDays * 24 * 60 * 60 * 1000
      : null;
    return filtered.filter((l) => {
      if (pipelineStages.size) {
        const canonical = canonicalFamilyLeadStage(l.status);
        if (!pipelineStages.has(canonical)) return false;
      }
      if (pipelineMine) {
        const owner = (l.owner ?? "").toLowerCase();
        const matches =
          (meName && owner === meName) ||
          (meEmail && (owner === meEmail || owner === meEmail.split("@")[0]));
        if (!matches) return false;
      }
      if (cutoff !== null) {
        const iso = l.lastContacted ?? l.createdAt ?? null;
        const t = iso ? new Date(iso).getTime() : NaN;
        if (!Number.isFinite(t) || t < cutoff) return false;
      }
      return true;
    });
  }, [view, filtered, pipelineStages, pipelineMine, pipelineDays, meName, meEmail]);

  const pipelineFilterCount =
    (pipelineMine ? 1 : 0) + (pipelineDays ? 1 : 0) + pipelineStages.size;

  return (
    <OSShell rightRail={<AIRail />}>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage family onboarding and service readiness progression.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiltersButton
              filters={filters}
              setFilters={setFilters}
              source={scopedLeads}
            />
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setView("followup"); toast("Showing follow-up queue"); }}>
              <PhoneCall className="mr-1.5 h-4 w-4" /> Create Follow-Up
            </Button>
            <Button size="sm" onClick={() => setNewLeadOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Lead
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, parent, phone, email, insurance…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        {/* KPI strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {KPI_DEFS.map((k) => {
            const active = activeKpi === k.key;
            return (
              <button
                key={k.key}
                onClick={() => setActiveKpi(active ? null : k.key)}
                className={cn(
                  "flex-shrink-0 min-w-[140px] rounded-2xl border px-4 py-3 text-left transition",
                  active
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 bg-card hover:bg-muted",
                )}
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{kpiCounts[k.key].toLocaleString()}</p>
              </button>
            );
          })}
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilterChips.map((c, i) => (
              <button
                key={`${c.label}-${i}`}
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/80"
              >
                {c.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={() => { setFilters(emptyFilters()); setActiveKpi(null); }}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* SOP status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 border-b border-border/60">
          {STATUS_TABS.map((t) => {
            const active = activeTab === t.key;
            const count = tabCounts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "flex-shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-t-lg text-sm font-medium transition border-b-2 -mb-px",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className={cn(
                  "tabular-nums text-[11px] rounded-full px-1.5 py-0.5",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View toggle + meta */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-xl border border-border/60 bg-card p-1 text-sm">
            {([
              ["list", "List"],
              ["pipeline", "Pipeline"],
              ["followup", "Follow-Up"],
            ] as [ViewMode, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "px-3 h-8 rounded-lg font-medium transition",
                  view === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>
              {(view === "pipeline" ? pipelineLeads : filtered).length.toLocaleString()} of{" "}
              {scopedLeads.length.toLocaleString()} leads
            </span>
            <button onClick={refresh} className="hover:text-foreground" aria-label="Refresh">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Pipeline-only filters */}
        {view === "pipeline" && (
          <PipelineFilters
            mine={pipelineMine}
            days={pipelineDays}
            stages={pipelineStages}
            filterCount={pipelineFilterCount}
            canFilterMine={Boolean(meName || meEmail)}
            onToggleMine={() => setPipelineMine(!pipelineMine)}
            onSetDays={setPipelineDays}
            onToggleStage={togglePipelineStage}
            onClear={clearPipelineFilters}
          />
        )}

        {/* Body */}
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" /> {error}
          </div>
        )}

        {loading && leads.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading leads…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={() => { setQuery(""); setFilters(emptyFilters()); setActiveKpi(null); }} />
        ) : view === "list" ? (
          <ListView
            leads={filtered}
            onOpen={setOpenLeadId}
            page={page}
            setPage={setPage}
            selectedIds={selectedIds}
            toggleOne={toggleOne}
            togglePage={togglePage}
          />
        ) : view === "pipeline" ? (
          pipelineLeads.length === 0 ? (
            <EmptyState onReset={clearPipelineFilters} />
          ) : (
            <PipelineView leads={pipelineLeads} onOpen={setOpenLeadId} />
          )
        ) : (
          <FollowUpView leads={filtered} onOpen={setOpenLeadId} />
        )}
      </div>

      {openLeadId && (
        <LeadDetailDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
      )}

      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={handleNewLeadOpenChange}
        onCreated={(lead) => {
          setOpenLeadId(lead.id);
          handleNewLeadOpenChange(false);
        }}
      />

      {selectedIds.size > 0 && (
        <BulkActionBar
          ids={[...selectedIds]}
          onClear={clearSelection}
          onAssign={(owner) => {
            assignOwner([...selectedIds], owner);
            toast.success(`Assigned ${selectedIds.size} lead${selectedIds.size === 1 ? "" : "s"} to ${owner}`);
            clearSelection();
          }}
          onMove={(status) => {
            moveStage([...selectedIds], status);
            toast.success(`Moved ${selectedIds.size} lead${selectedIds.size === 1 ? "" : "s"} → ${status}`);
            clearSelection();
          }}
          onFollowUp={({ due, action }) => {
            bulkUpdate([...selectedIds], { nextTaskDue: due, nextAction: action });
            toast.success(`Follow-up scheduled for ${selectedIds.size} lead${selectedIds.size === 1 ? "" : "s"}`);
            clearSelection();
          }}
        />
      )}
    </OSShell>
  );
}

/* ─────────────────────── List View ─────────────────────── */

const PAGE_SIZE = 50;

function ListView({
  leads, onOpen, page, setPage, selectedIds, toggleOne, togglePage,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  page: number;
  setPage: (n: number) => void;
  selectedIds: Set<string>;
  toggleOne: (id: string, checked: boolean) => void;
  togglePage: (ids: string[], checked: boolean) => void;
}) {
  const start = page * PAGE_SIZE;
  const slice = leads.slice(start, start + PAGE_SIZE);
  const pages = Math.ceil(leads.length / PAGE_SIZE);
  const pageIds = slice.map((l) => l.id);
  const pageSelectedCount = pageIds.reduce((n, id) => n + (selectedIds.has(id) ? 1 : 0), 0);
  const headerState: boolean | "indeterminate" =
    pageSelectedCount === 0 ? false : pageSelectedCount === pageIds.length ? true : "indeterminate";

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 w-8">
                <Checkbox
                  checked={headerState}
                  onCheckedChange={(v) => togglePage(pageIds, v === true)}
                  aria-label="Select all on page"
                />
              </th>
              {["Patient", "Parent", "State", "Owner", "Stage", "Last Contact", "Form", "Insurance", "VOB", "Next Step", "Blocker", ""].map((h) => (
                <th key={h} className="text-left font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {slice.map((l) => (
              <tr
                key={l.id}
                onClick={() => onOpen(l.id)}
                className={cn(
                  "hover:bg-muted/40 cursor-pointer group",
                  selectedIds.has(l.id) && "bg-primary/5",
                )}
              >
                <td className="px-3 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(l.id)}
                    onCheckedChange={(v) => toggleOne(l.id, v === true)}
                    aria-label={`Select ${l.childName}`}
                  />
                </td>
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                  {(() => {
                    const a = agingFor(l);
                    return (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full flex-shrink-0", a.tone)}
                          title={a.label}
                          aria-label={`Last contact: ${a.label}`}
                        />
                        {l.childName}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{l.parentName || "—"}</td>
                <td className="px-3 py-2.5"><StateBadge state={l.state} /></td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{l.owner}</td>
                <td className="px-3 py-2.5"><StatusChip status={l.status} /></td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(l.lastContacted)}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{l.formStatus}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap max-w-[160px] truncate" title={l.primaryInsurance}>{l.primaryInsurance || "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{l.vobStatus}</td>
                {(() => {
                  const step = getLeadNextStep(l);
                  const blocker = getLeadBlocker(l);
                  const tone = blocker
                    ? blocker.tone === "urgent"
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : blocker.tone === "risk"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-border/60"
                    : "";
                  return (
                    <>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[200px] truncate" title={step}>{step}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {blocker ? (
                          <span
                            className={cn("inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border max-w-[180px] truncate", tone)}
                            title={blocker.reasons.join(" • ")}
                          >
                            {blocker.label}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </>
                  );
                })()}
                <td className="px-3 py-2.5 text-right opacity-0 group-hover:opacity-100 transition">
                  <RowQuickActions lead={l} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Page {page + 1} of {pages}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
              className="rounded-lg px-2.5 py-1 hover:bg-muted disabled:opacity-40"
            >Prev</button>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage(Math.min(pages - 1, page + 1))}
              className="rounded-lg px-2.5 py-1 hover:bg-muted disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RowQuickActions({ lead }: { lead: Lead }) {
  const { open } = useIntakeModals();
  const stop = (e: React.MouseEvent) => { e.stopPropagation(); };
  const Btn = ({ icon: Icon, label, href, onClick }: any) => {
    const className =
      "inline-grid place-items-center size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground";
    if (href) {
      return (
        <a href={href} onClick={stop} className={className} title={label}>
          <Icon className="h-3.5 w-3.5" />
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => { stop(e); onClick?.(); }}
        className={className}
        title={label}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    );
  };
  return (
    <div className="inline-flex items-center gap-0.5">
      <Btn
        icon={PhoneCall}
        label="Call Parent"
        onClick={() => open({ kind: "comm", lead, channel: "call" })}
      />
      <Btn
        icon={Mail}
        label="Email"
        onClick={() => open({ kind: "comm", lead, channel: "email" })}
      />
      <Btn
        icon={Send}
        label="Send form"
        onClick={() => open({ kind: "sendPacket", lead })}
      />
      <Btn
        icon={StickyNote}
        label="Add note"
        onClick={() => open({ kind: "note", lead })}
      />
    </div>
  );
}

/* ─────────────────────── Pipeline View ─────────────────────── */

function PipelineView({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const cols = PIPELINE_STAGES.map((s) => ({ ...s, items: leads.filter(s.match) }));
  return renderPipelineColumns(cols, onOpen);
}

function renderPipelineColumns(
  cols: { key: string; label: string; items: Lead[] }[],
  onOpen: (id: string) => void,
) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-min">
        {cols.map((c) => (
          <div key={c.key} className="w-[260px] flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-sm font-medium">{c.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{c.items.length}</span>
            </div>
            <div className="flex-1 rounded-2xl bg-muted/40 p-2 space-y-2 min-h-[120px]">
              {c.items.slice(0, 50).map((l) => (
                <button
                  key={l.id}
                  onClick={() => onOpen(l.id)}
                  className="w-full text-left rounded-xl bg-card border border-border/60 p-3 hover:border-border hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{l.childName}</span>
                    <StateBadge state={l.state} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{l.owner}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{l.nextAction}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">Last: {fmtDate(l.lastContacted)}</p>
                </button>
              ))}
              {c.items.length > 50 && (
                <p className="text-[11px] text-muted-foreground text-center pt-1">+ {c.items.length - 50} more</p>
              )}
              {c.items.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-6">No leads</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Pipeline Filters (view=pipeline only) ─────────────────── */

const PIPELINE_DAY_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any time" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

function PipelineFilters({
  mine, days, stages, filterCount, canFilterMine,
  onToggleMine, onSetDays, onToggleStage, onClear,
}: {
  mine: boolean;
  days: number | null;
  stages: Set<string>;
  filterCount: number;
  canFilterMine: boolean;
  onToggleMine: () => void;
  onSetDays: (n: number | null) => void;
  onToggleStage: (stage: string) => void;
  onClear: () => void;
}) {
  const daysLabel =
    PIPELINE_DAY_OPTIONS.find((o) => o.value === days)?.label ?? "Any time";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground mr-1">
        Pipeline filters
      </span>

      {/* Assigned to me */}
      <Button
        type="button"
        size="sm"
        variant={mine ? "default" : "outline"}
        onClick={onToggleMine}
        disabled={!canFilterMine}
        title={canFilterMine ? "Only leads assigned to you" : "Sign in required"}
        className="h-8"
      >
        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
        Assigned to me
      </Button>

      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={days ? "default" : "outline"}
            className="h-8"
          >
            <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
            {daysLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-1.5">
            Last contact within
          </div>
          {PIPELINE_DAY_OPTIONS.map((opt) => {
            const active = opt.value === days;
            return (
              <button
                key={opt.label}
                onClick={() => onSetDays(opt.value)}
                className={cn(
                  "w-full text-left text-sm rounded-md px-2 py-1.5 transition",
                  active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {/* Stage multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={stages.size ? "default" : "outline"}
            className="h-8"
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            {stages.size ? `${stages.size} stage${stages.size === 1 ? "" : "s"}` : "Stages"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1 max-h-80 overflow-y-auto">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-1.5">
            Show columns
          </div>
          {FAMILY_LEAD_PIPELINE_STAGES.map((stage) => {
            const active = stages.has(stage);
            return (
              <button
                key={stage}
                onClick={() => onToggleStage(stage)}
                className={cn(
                  "w-full flex items-center justify-between text-left text-sm rounded-md px-2 py-1.5 transition",
                  active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                )}
              >
                <span className="truncate">{stage}</span>
                {active && <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {filterCount > 0 && (
        <button
          onClick={onClear}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Clear pipeline filters
        </button>
      )}
    </div>
  );
}

/* ─────────────────────── Follow-Up View ─────────────────────── */

function FollowUpView({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const oneDay = 24 * 60 * 60 * 1000;
  const ageDays = (iso: string | null) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / oneDay) : 999;

  // Export 88 — follow-up queues are built ENTIRELY on the canonical Family /
  // Lead Workflow. Legacy Monday-era labels (New Lead, In Contact, Sent Form,
  // Missing Information, Sent to VOB, VOB Completed) are only honored via
  // canonicalFamilyLeadStage, never via direct equality checks.
  const canonical = (l: Lead) => canonicalFamilyLeadStage(l.status);
  const dueIso = (l: Lead) => l.nextTaskDue ?? l.lastContacted ?? null;
  const dueAge = (l: Lead) => ageDays(dueIso(l));
  const isEngagement = (l: Lead) => {
    const c = canonical(l);
    return c === "First Contact Attempt" || c === "Engagement Track";
  };
  const inOpenPipeline = (l: Lead) => !isLeadOutOfPipeline(l.status);

  const queues = [
    { key: "due",   label: "Due Today",       items: leads.filter((l) => inOpenPipeline(l) && dueAge(l) === 0) },
    { key: "over",  label: "Overdue",         items: leads.filter((l) => inOpenPipeline(l) && dueAge(l) > 0 && dueAge(l) < 999) },
    { key: "a1",    label: "Attempt 1",       items: leads.filter((l) => {
      const c = canonical(l);
      return !l.lastContacted && (c === "Lead Captured" || c === "First Contact Attempt");
    }) },
    { key: "a2",    label: "Attempt 2",       items: leads.filter((l) => isEngagement(l) && ageDays(l.lastContacted) >= 1 && ageDays(l.lastContacted) <= 2) },
    { key: "a3",    label: "Attempt 3",       items: leads.filter((l) => canonical(l) === "Engagement Track" && ageDays(l.lastContacted) >= 3 && ageDays(l.lastContacted) <= 5) },
    { key: "fin",   label: "Final Attempt",   items: leads.filter((l) => canonical(l) === "Engagement Track" && ageDays(l.lastContacted) >= 6) },
    { key: "cr",    label: "Cannot Reach",    items: leads.filter((l) => isCannotReachStatus(l.status)) },
    { key: "wait",  label: "Waiting Parent",  items: leads.filter((l) => {
      const c = canonical(l);
      return c === "Intake Packet Sent" || c === "Intake Packet Follow Up";
    }) },
    { key: "bv",    label: "Benefits / Auth", items: leads.filter((l) => {
      const c = canonical(l);
      return c === "Benefits Verification" || c === "QA / Treatment Plan Authorization" || c === "Authorization Pending";
    }) },
  ];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-min">
        {queues.map((q) => (
          <div key={q.key} className="w-[260px] flex-shrink-0">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-sm font-medium">{q.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{q.items.length}</span>
            </div>
            <div className="rounded-2xl bg-muted/40 p-2 space-y-2 min-h-[120px]">
              {q.items.slice(0, 30).map((l) => (
                <button
                  key={l.id}
                  onClick={() => onOpen(l.id)}
                  className="w-full text-left rounded-xl bg-card border border-border/60 p-3 hover:border-border transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium truncate">{l.childName}</span>
                    <StateBadge state={l.state} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{l.parentName}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{l.phone || "no phone"}</p>
                </button>
              ))}
              {q.items.length > 30 && (
                <p className="text-[11px] text-muted-foreground text-center pt-1">+ {q.items.length - 30} more</p>
              )}
              {q.items.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-6">All caught up</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Filters ─────────────────────── */

function FiltersButton({
  filters, setFilters, source,
}: { filters: FilterState; setFilters: (f: FilterState) => void; source: Lead[] }) {
  const opts = useMemo(() => {
    const grab = (fn: (l: Lead) => string) =>
      Array.from(new Set(source.map(fn).filter(Boolean))).sort().slice(0, 50);
    return {
      states: grab((l) => l.state),
      owners: grab((l) => l.owner),
      statuses: grab((l) => l.status),
      formStatuses: grab((l) => l.formStatus),
      vobStatuses: grab((l) => l.vobStatus),
      insurances: grab((l) => l.primaryInsurance || ""),
    };
  }, [source]);

  const toggle = (key: keyof FilterState, v: string) => {
    const next = new Set(filters[key] as Set<string>);
    next.has(v) ? next.delete(v) : next.add(v);
    setFilters({ ...filters, [key]: next });
  };

  const Section = ({ title, items, k }: { title: string; items: string[]; k: keyof FilterState }) => {
    const set = filters[k] as Set<string>;
    return (
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">{title}</p>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {items.map((v) => (
            <button
              key={v}
              onClick={() => toggle(k, v)}
              className={cn(
                "text-xs rounded-full px-2.5 py-1 border transition",
                set.has(v)
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >{v}</button>
          ))}
          {!items.length && <span className="text-xs text-muted-foreground">No options</span>}
        </div>
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-1.5 h-4 w-4" /> Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-4 space-y-3" align="end">
        <Section title="State" items={opts.states} k="states" />
        <Section title="Intake Person" items={opts.owners} k="owners" />
        <Section title="Status" items={opts.statuses} k="statuses" />
        <Section title="Form Status" items={opts.formStatuses} k="formStatuses" />
        <Section title="Benefits Status" items={opts.vobStatuses} k="vobStatuses" />
        <Section title="Insurance" items={opts.insurances} k="insurances" />
        <label className="flex items-center gap-2 text-sm pt-1">
          <input
            type="checkbox"
            checked={filters.missingOnly}
            onChange={(e) => setFilters({ ...filters, missingOnly: e.target.checked })}
            className="rounded"
          />
          Missing information only
        </label>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────── Empty state ─────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
      <p className="text-sm text-muted-foreground">No leads match these filters.</p>
      <button onClick={onReset} className="mt-3 text-sm text-foreground hover:underline">
        Reset filters
      </button>
    </div>
  );
}

/* ─────────────────────── AI Rail ─────────────────────── */

const AI_PROMPTS = [
  "Summarize the leads needing follow-up today",
  "Find leads missing information",
  "Which leads are stuck?",
  "Draft a parent follow-up message",
  "Summarize benefits verification pipeline health",
];

function AIRail() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Insights</h3>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-1.5 shadow-sm">
        {AI_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => toast(`AI: "${p}"`, { description: "Mock response — full AI coming soon." })}
            className="w-full text-left text-[13px] leading-snug rounded-xl px-3 py-2.5 hover:bg-muted transition flex items-start gap-2 group"
          >
            <span className="flex-1">{p}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition" />
          </button>
        ))}
      </div>
      <p className="px-1 text-[11px] text-muted-foreground leading-relaxed">
        Insights uses your role and state scope to keep responses focused on leads you own.
      </p>
    </div>
  );
}

/* ─────────────────────── Bulk Action Bar ─────────────────────── */

/**
 * Export 87 — Bulk stage move options are the canonical Family / Lead
 * Workflow stages. Old Monday-era labels (New Lead, Sent Form, VOB
 * Completed, etc.) are NOT shown here. Non-qualified / cannot-reach are
 * outcome actions, not pipeline destinations.
 */
const BULK_STATUS_OPTIONS: LeadStatus[] =
  [...FAMILY_LEAD_PIPELINE_STAGES] as LeadStatus[];
const BULK_OUTCOME_OPTIONS: LeadStatus[] = ["Non-qualified Lead", "Can't Reach"];

const FOLLOWUP_PRESETS: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

function BulkActionBar({
  ids,
  onClear,
  onAssign,
  onMove,
  onFollowUp,
}: {
  ids: string[];
  onClear: () => void;
  onAssign: (owner: string) => void;
  onMove: (status: LeadStatus) => void;
  onFollowUp: (v: { due: string; action: string }) => void;
}) {
  const count = ids.length;
  const [followUpDate, setFollowUpDate] = useState<string>(
    () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
  );
  const [followUpNote, setFollowUpNote] = useState<string>("Follow up with family");

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-card/95 backdrop-blur px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2 pr-2 border-r border-border/60">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium tabular-nums">
            {count} selected
          </span>
        </div>

        {/* Assign */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Assign
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-56 p-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 pt-1.5 pb-1">
              Assign to coordinator
            </p>
            {INTAKE_COORDINATORS.map((owner) => (
              <button
                key={owner}
                onClick={() => onAssign(owner)}
                className="w-full text-left text-sm rounded-lg px-2 py-1.5 hover:bg-muted"
              >
                {owner}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Move status */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <MoveRight className="h-4 w-4" /> Move status
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-56 p-1 max-h-72 overflow-y-auto">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 pt-1.5 pb-1">
              Move to status
            </p>
            {BULK_STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onMove(s)}
                className="w-full text-left text-sm rounded-lg px-2 py-1.5 hover:bg-muted"
              >
                {s}
              </button>
            ))}
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 pt-2 pb-1 border-t border-border/60 mt-1">
              Outcome
            </p>
            {BULK_OUTCOME_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onMove(s)}
                className="w-full text-left text-sm rounded-lg px-2 py-1.5 hover:bg-muted text-muted-foreground"
              >
                {s}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Send follow-up */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <CalendarClock className="h-4 w-4" /> Send follow-up
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-72 p-3 space-y-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Schedule follow-up
            </p>
            <div className="grid grid-cols-3 gap-1">
              {FOLLOWUP_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() =>
                    setFollowUpDate(
                      new Date(Date.now() + p.days * 86_400_000).toISOString().slice(0, 10),
                    )
                  }
                  className="text-xs rounded-lg border border-border/60 px-2 py-1 hover:bg-muted"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Due date</label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Next action</label>
              <Input
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="What needs to happen?"
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!followUpDate || !followUpNote.trim()}
              onClick={() =>
                onFollowUp({ due: followUpDate, action: followUpNote.trim() })
              }
            >
              Schedule for {count} lead{count === 1 ? "" : "s"}
            </Button>
          </PopoverContent>
        </Popover>

        <div className="pl-1 border-l border-border/60">
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}