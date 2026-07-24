import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, HeartHandshake, ListChecks, ListFilter,
  Workflow, BarChart3, Upload, Download, Settings2, ShieldCheck, Trash2,
  Plus, Search, X, CheckCircle2, Pencil, RotateCcw, Activity, AlertCircle,
  ChevronRight, Tag, UserPlus, Paperclip, FileText, History, Phone, Mail,
  Calendar, StickyNote, FileUp,
  ArrowUp, ArrowDown, ChevronsUpDown, Link as LinkIcon,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCrm, crm, fullName, activeContacts, activeCompanies, activeReferrals,
  userName, companyName, evalList, STATES,
  type Contact, type Company, type Referral, type Task, type ID,
  type ActivityEvent, type Attachment, type ListDef, type ImportBatch, type AuditLogEntry,
} from "@/lib/os/referralCrm/store";
import {
  WORKFLOW_TRIGGERS, WORKFLOW_ACTIONS,
  type ListCriteria, type WorkflowTrigger,
} from "@/lib/os/referralCrm/store";
import {
  canCrm, currentUser, scopedContacts, scopedCompanies, scopedReferrals, scopedTasks,
  CRM_PERMISSIONS, CRM_ROLES, TEAM_TYPES,
  type CrmPermission, type CrmRole, type CrmTeam, type CrmUser, type TeamType,
} from "@/lib/os/referralCrm/store";
import { hydrateFromSupabase, installSupabaseSync } from "@/lib/os/referralCrm/bridge";
import { parseReferralsCsv, type ParsedCsv } from "@/lib/os/referrals/csv";
import { importReferralRows, failedRowsToCsv } from "@/lib/os/referrals/importer";
import { REFERRAL_PARTNER_PIPELINE_STAGES } from "@/lib/intake/intakeWorkflow";
import { FAMILY_LEAD_PIPELINE_STAGES, canonicalFamilyLeadStage, type FamilyLeadPipelineStage } from "@/lib/intake/intakeWorkflow";
import { useLeads } from "@/contexts/LeadsContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TableFilterBar, type FilterDef } from "@/components/marketing/TableFilterBar";
import { useOperatorDialogs } from "@/components/os/OperatorDialogs";
import { TablePagination } from "@/components/marketing/TablePagination";

type ModuleId =
  | "dashboard" | "contacts" | "companies" | "referrals" | "tasks" | "lists"
  | "workflows" | "reports" | "imports" | "exports" | "duplicates"
  | "settings" | "users" | "deleted" | "files" | "audit" | "activities" | "search"
  | "patient-pipeline";

const MODULES: { id: ModuleId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Global Search", icon: Search },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "referrals", label: "Referrals", icon: HeartHandshake },
  { id: "patient-pipeline", label: "Patient Pipeline", icon: Activity },
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
/**
 * Persist a piece of view state in the URL search params so views are
 * shareable and survive reloads. `defaultValue` is stripped from the URL
 * to keep it clean.
 */
function useUrlState(
  key: string,
  defaultValue: string,
  options?: { history?: "push" | "replace" },
): [string, (v: string) => void] {
  const historyMode = options?.history ?? "push";
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;
  const setValue = useCallback(
    (v: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!v || v === defaultValue) next.delete(key);
        else next.set(key, v);
        return next;
      }, { replace: historyMode === "replace" });
    },
    [key, defaultValue, setParams, historyMode],
  );
  return [value, setValue];
}

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
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function daysSince(d?: string) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

function contactDisplayName(c?: Contact): string {
  if (!c) return "-";
  return fullName(c) || c.email || c.phone || c.mobilePhone || "(No name)";
}

// Colored tone for a Referral.referralStatus badge.
function referralStatusTone(status?: string): string {
  switch (status) {
    case "New": return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300";
    case "In Review": return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
    case "Intake Form Sent": return "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300";
    case "Scheduled": return "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-300";
    case "Active": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300";
    case "Closed": return "bg-muted text-muted-foreground border-border";
    case "Lost": return "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function patientDisplayName(r: { patientFirstName?: string; patientLastInitial?: string; name?: string }): string {
  if (r.patientFirstName || r.patientLastInitial) {
    return `${r.patientFirstName ?? ""} ${r.patientLastInitial ? r.patientLastInitial + "." : ""}`.trim();
  }
  return r.name ?? "Unnamed patient";
}

function CopyShareLinkButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      sonnerToast.success("Share link copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the URL in a visible input so the user can copy it manually.
      sonnerToast.error("Could not copy automatically", {
        description: "Your browser blocked clipboard access. The URL is shown in the address bar.",
      });
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-1.5"
      onClick={handleCopy}
      aria-label="Copy share link"
    >
      {copied ? <CheckCircle2 className="size-3.5" /> : <LinkIcon className="size-3.5" />}
      {copied ? "Copied" : "Copy share link"}
    </Button>
  );
}

// ===========================================================
// Dashboard
// ===========================================================
function DashboardModule() {
  const s = useCrm();
  const ct = scopedContacts(s);
  const co = scopedCompanies(s);
  const rf = scopedReferrals(s);
  const openTasks = scopedTasks(s).filter((t) => t.status !== "Completed");
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
      <div className="rounded-2xl border bg-card p-4">
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
          Marketing / Business Development owns referral partner relationships. Family contact and intake execution live in the separate Family Lead Pipeline.
        </div>
      </div>

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
                  <p className="text-xs text-muted-foreground">{c.companyType} - {c.state}</p>
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
                    <p className="text-xs text-muted-foreground">{c.state} - last contact {fmtDate(c.lastContactedDate)}</p>
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
                    <p className="text-xs text-muted-foreground">{userName(s, t.assignedUserId)} - due {fmtDate(t.dueDate)}</p>
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
type SortState = { key: string; dir: "asc" | "desc" };
function SortTh({ label, k, sort, onSort, align = "left" }:
  { label: string; k: string; sort: SortState; onSort: (k: string) => void; align?: "left" | "right" }) {
  const active = sort.key === k;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th className={cn("px-3 py-2 font-medium", align === "right" ? "text-right" : "text-left")}>
      <button type="button" onClick={() => onSort(k)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", align === "right" && "ml-auto")}>
        <span>{label}</span>
        <Icon className="size-3" />
      </button>
    </th>
  );
}

const CONTACT_VIEWS = [
  { id: "all", label: "All Contacts" },
  { id: "nc", label: "NC Referral Sources" },
  { id: "missing-email", label: "Missing Email" },
  { id: "active", label: "Active Referral Partners" },
  { id: "ll-needed", label: "Lunch & Learn Needed" },
] as const;

function ContactsModule({ onOpenContact, onOpenCompany }: { onOpenContact: (id: ID) => void; onOpenCompany: (id: ID) => void }) {
  const s = useCrm();
  const { promptOperator, confirmOperator } = useOperatorDialogs();
  const contacts = scopedContacts(s);

  const [viewRaw, _setView] = useUrlState("cv", "all");
  const view = (CONTACT_VIEWS.some((v) => v.id === viewRaw)
    ? viewRaw
    : "all") as (typeof CONTACT_VIEWS)[number]["id"];
  const [q, _setQ] = useUrlState("cq", "", { history: "replace" });
  const [stateFilter, _setStateFilter] = useUrlState("cs", "all");
  const [ownerFilter, _setOwnerFilter] = useUrlState("co", "all");
  const [partnerFilter, _setPartnerFilter] = useUrlState("cp", "all");
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [creating, setCreating] = useState(false);
  const [sortKey, setSortKey] = useUrlState("csk", "name");
  const [sortDir, setSortDir] = useUrlState("csd", "asc");
  const sort: SortState = { key: sortKey, dir: sortDir === "desc" ? "desc" : "asc" };
  const toggleSort = (key: string) => {
    if (sort.key === key) setSortDir(sort.dir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const [pageStr, setPageStr] = useUrlState("cpg", "1");
  const [pageSizeStr, _setPageSizeStr] = useUrlState("cps", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);
  // Reset paging when the user changes a filter (but not on browser back/forward,
  // which restores the page number directly from the URL).
  const resetPage = () => { if ((Number(pageStr) || 1) !== 1) setPageStr("1"); };
  const setView = (v: string) => { _setView(v); resetPage(); };
  const setQ = (v: string) => { _setQ(v); resetPage(); };
  const setStateFilter = (v: string) => { _setStateFilter(v); resetPage(); };
  const setOwnerFilter = (v: string) => { _setOwnerFilter(v); resetPage(); };
  const setPartnerFilter = (v: string) => { _setPartnerFilter(v); resetPage(); };
  const setPageSizeStr = (v: string) => { _setPageSizeStr(v); resetPage(); };

  const rows = useMemo(() => {
    let r = scopedContacts(s);
    if (view === "nc") r = r.filter((c) => c.state === "NC" && !!c.referralSourceType);
    if (view === "missing-email") r = r.filter((c) => !c.email);
    if (view === "active") r = r.filter((c) => c.referralPartnerStatus === "Active Referral Partner");
    if (view === "ll-needed") r = r.filter((c) =>
      c.lunchLearnStatus === "Not Scheduled" && (c.relationshipStrength === "Warm" || c.relationshipStrength === "Strong"));
    if (stateFilter !== "all") r = r.filter((c) => c.state === stateFilter);
    if (ownerFilter !== "all") {
      if (ownerFilter === "__unassigned__") r = r.filter((c) => !c.ownerId);
      else r = r.filter((c) => c.ownerId === ownerFilter);
    }
    if (partnerFilter !== "all") r = r.filter((c) => (c.referralPartnerStatus || "") === partnerFilter);
    if (q) {
      const ql = q.toLowerCase();
      r = r.filter((c) => contactDisplayName(c).toLowerCase().includes(ql) || c.email?.toLowerCase().includes(ql) || c.jobTitle?.toLowerCase().includes(ql));
    }
    const getKey = (c: typeof r[number]): string | number => {
      switch (sort.key) {
        case "name": return contactDisplayName(c).toLowerCase();
        case "company": return (companyName(s, c.companyId) || "").toLowerCase();
        case "title": return (c.jobTitle || "").toLowerCase();
        case "state": return (c.state || "").toLowerCase();
        case "owner": return (userName(s, c.ownerId) || "").toLowerCase();
        case "status": return (c.referralPartnerStatus || "").toLowerCase();
        case "referrals": return c.referralCount ?? 0;
        case "last": return c.lastContactedDate || "";
        default: return "";
      }
    };
    const sorted = [...r].sort((a, b) => {
      const av = getKey(a); const bv = getKey(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [s, view, q, stateFilter, ownerFilter, partnerFilter, sort.key, sort.dir]);

  const pagedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  const totalContacts = scopedContacts(s).length;
  const contactFilters: FilterDef[] = [
    { key: "cs", label: "State", value: stateFilter, onChange: setStateFilter, countSource: contacts, countValue: (c) => (c as Contact).state || "", options: [{ value: "all", label: "All states" }, ...STATES.map((st) => ({ value: st, label: st }))] },
    { key: "co", label: "Owner", value: ownerFilter, onChange: setOwnerFilter, countSource: contacts, countValue: (c) => (c as Contact).ownerId || "__unassigned__", options: [{ value: "all", label: "All owners" }, { value: "__unassigned__", label: "Unassigned" }, ...s.users.map((u) => ({ value: u.id, label: u.name }))], width: 160 },
    { key: "cp", label: "Partner", value: partnerFilter, onChange: setPartnerFilter, countSource: contacts, countValue: (c) => (c as Contact).referralPartnerStatus || "", options: [{ value: "all", label: "All statuses" }, ...["Active Referral Partner", "Warm Relationship", "Connected", "New Target", "Inactive"].map((v) => ({ value: v, label: v }))], width: 170 },
  ];

  const allChecked = pagedRows.length > 0 && pagedRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) pagedRows.forEach((r) => next.delete(r.id));
    else pagedRows.forEach((r) => next.add(r.id));
    setSelected(next);
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
  const bulkTag = async () => {
    const tag = await promptOperator({ title: "Tag contacts", label: "Tag to add", submitLabel: "Apply tag", required: true });
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
  const bulkResetReferrals = async () => {
    const ok = await confirmOperator({
      title: "Reset referral counts?",
      description: `This will set the referral count to 0 for ${selected.size} contact(s). This does not affect referral history.`,
      confirmLabel: "Reset counts",
      destructive: true,
    });
    if (!ok) return;
    selected.forEach((id) => crm.updateContact(id, { referralCount: 0 }));
    toast({ title: `Reset referrals on ${selected.size} contact(s)` });
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search contacts..." }}
        filters={contactFilters}
        resultCount={rows.length}
        totalCount={totalContacts}
        onClear={() => { setQ(""); setStateFilter("all"); setOwnerFilter("all"); setPartnerFilter("all"); }}
        extra={
          <Button size="sm" className="h-9 gap-1.5" disabled={!canCrm(s, "create")} onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> New Contact
          </Button>
        }
      />

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
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkResetReferrals}>
            <RotateCcw className="size-3 mr-1" /> Reset referrals
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "delete")} onClick={bulkDelete}>
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
                <SortTh label="Name" k="name" sort={sort} onSort={toggleSort} />
                <SortTh label="Company" k="company" sort={sort} onSort={toggleSort} />
                <SortTh label="Title" k="title" sort={sort} onSort={toggleSort} />
                <SortTh label="State" k="state" sort={sort} onSort={toggleSort} />
                <SortTh label="Owner" k="owner" sort={sort} onSort={toggleSort} />
                <SortTh label="Status" k="status" sort={sort} onSort={toggleSort} />
                <SortTh label="Referrals" k="referrals" sort={sort} onSort={toggleSort} align="right" />
                <SortTh label="Last Contact" k="last" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} /></td>
                  <td className="px-3 py-2">
                    <button className="font-medium hover:text-primary text-left" onClick={() => onOpenContact(c.id)}>
                      {contactDisplayName(c)}
                    </button>
                    {(fullName(c) || c.email) && <p className="text-xs text-muted-foreground">{fullName(c) ? (c.email || "-") : "Email-only contact"}</p>}
                  </td>
                  <td className="px-3 py-2">
                    {c.companyId ? (
                      <button className="hover:text-primary" onClick={() => onOpenCompany(c.companyId!)}>{companyName(s, c.companyId)}</button>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.jobTitle || "-"}</td>
                  <td className="px-3 py-2">{c.state || "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, c.ownerId)}</td>
                  <td className="px-3 py-2">{c.referralPartnerStatus ? <Badge variant="secondary">{c.referralPartnerStatus}</Badge> : "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <ContactReferralsCell contactId={c.id} count={c.referralCount} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.lastContactedDate)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-10">No contacts match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(n) => { setPageSizeStr(String(n)); setPageStr("1"); }}
        />
      </div>

      <NewContactDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function NewContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  return <NewContactDialogInner open={open} onOpenChange={onOpenChange} />;
}

// Popover cell for a contact showing their referred patients + status.
function ContactReferralsCell({ contactId, count }: { contactId: ID; count: number }) {
  const s = useCrm();
  const patients = useMemo(
    () => activeReferrals(s).filter((r) => r.contactId === contactId)
      .sort((a, b) => (b.referralDate || "").localeCompare(a.referralDate || "")),
    [s, contactId],
  );
  if (patients.length === 0) {
    return <span className="tabular-nums text-muted-foreground">{count}</span>;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium tabular-nums hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          {patients.length}
          <ChevronRight className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Referred patients ({patients.length})
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {patients.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="font-medium truncate">{patientDisplayName(r)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.state || "-"} - {fmtDate(r.referralDate)}
                </p>
              </div>
              <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0", referralStatusTone(r.referralStatus))}>
                {r.referralStatus}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NewContactDialogInner({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const s = useCrm();
  const [f, setF] = useState({ firstName: "", lastName: "", jobTitle: "", email: "", phone: "", state: "", companyId: "" });
  const [newCo, setNewCo] = useState({ name: "", companyType: "", state: "" });
  const creatingCo = f.companyId === "__create__";
  const submit = () => {
    if (!f.firstName && !f.lastName && !f.email) { toast({ title: "Name or email required", variant: "destructive" as never }); return; }
    let companyId: string | undefined = f.companyId && f.companyId !== "__create__" ? f.companyId : undefined;
    if (creatingCo) {
      if (!newCo.name.trim()) { toast({ title: "New company name required", variant: "destructive" as never }); return; }
      const co = crm.addCompany({ name: newCo.name.trim(), companyType: newCo.companyType || undefined, state: newCo.state || undefined });
      companyId = co.id;
    }
    crm.addContact({ ...f, companyId });
    toast({ title: "Contact created" });
    onOpenChange(false);
    setF({ firstName: "", lastName: "", jobTitle: "", email: "", phone: "", state: "", companyId: "" });
    setNewCo({ name: "", companyType: "", state: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First name</Label><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
          <div><Label className="text-xs">Last name</Label><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Title</Label><Input value={f.jobTitle} onChange={(e) => setF({ ...f, jobTitle: e.target.value })} placeholder="e.g. Pediatrician, Office Manager" /></div>
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
              <SelectContent>
                <SelectItem value="__create__">+ Create new company...</SelectItem>
                {s.companies.filter((c) => !c.deletedAt).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {creatingCo ? (
            <div className="col-span-2 rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">New company</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs">Company name</Label><Input value={newCo.name} onChange={(e) => setNewCo({ ...newCo, name: e.target.value })} /></div>
                <div><Label className="text-xs">Type</Label><Input value={newCo.companyType} onChange={(e) => setNewCo({ ...newCo, companyType: e.target.value })} placeholder="Pediatrician Office..." /></div>
                <div><Label className="text-xs">State</Label>
                  <Select value={newCo.state} onValueChange={(v) => setNewCo({ ...newCo, state: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick state" /></SelectTrigger>
                    <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
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
  const { promptOperator, confirmOperator } = useOperatorDialogs();
  const companies = scopedCompanies(s);

  const [viewRaw, _setView] = useUrlState("ov", "all");
  const view = (COMPANY_VIEWS.some((v) => v.id === viewRaw)
    ? viewRaw
    : "all") as (typeof COMPANY_VIEWS)[number]["id"];
  const [q, _setQ] = useUrlState("oq", "", { history: "replace" });
  const [stateFilter, _setStateFilter] = useUrlState("os", "all");
  const [tierFilter, _setTierFilter] = useUrlState("ot", "all");
  const [ownerFilter, _setOwnerFilter] = useUrlState("oo", "all");
  const [partnerFilter, _setPartnerFilter] = useUrlState("op", "all");
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [creating, setCreating] = useState(false);
  const [bulkTaskOpen, setBulkTaskOpen] = useState(false);
  const [sortKey, setSortKey] = useUrlState("osk", "name");
  const [sortDir, setSortDir] = useUrlState("osd", "asc");
  const sort: SortState = { key: sortKey, dir: sortDir === "desc" ? "desc" : "asc" };
  const toggleSort = (key: string) => {
    if (sort.key === key) setSortDir(sort.dir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const [pageStr, setPageStr] = useUrlState("opg", "1");
  const [pageSizeStr, _setPageSizeStr] = useUrlState("ops", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);
  const resetPage = () => { if ((Number(pageStr) || 1) !== 1) setPageStr("1"); };
  const setView = (v: string) => { _setView(v); resetPage(); };
  const setQ = (v: string) => { _setQ(v); resetPage(); };
  const setStateFilter = (v: string) => { _setStateFilter(v); resetPage(); };
  const setTierFilter = (v: string) => { _setTierFilter(v); resetPage(); };
  const setOwnerFilter = (v: string) => { _setOwnerFilter(v); resetPage(); };
  const setPartnerFilter = (v: string) => { _setPartnerFilter(v); resetPage(); };
  const setPageSizeStr = (v: string) => { _setPageSizeStr(v); resetPage(); };

  const rows = useMemo(() => {
    let r = scopedCompanies(s);
    if (view === "active") r = r.filter((c) => c.activeReferralPartner);
    if (view === "tier-a") r = r.filter((c) => c.relationshipTier === "Tier A");
    if (view === "targets") r = r.filter((c) => c.referralPartnerStatus === "New Target");
    if (stateFilter !== "all") r = r.filter((c) => c.state === stateFilter);
    if (tierFilter !== "all") r = r.filter((c) => (c.relationshipTier || "") === tierFilter);
    if (ownerFilter !== "all") {
      if (ownerFilter === "__unassigned__") r = r.filter((c) => !c.ownerId);
      else r = r.filter((c) => c.ownerId === ownerFilter);
    }
    if (partnerFilter !== "all") r = r.filter((c) => (c.referralPartnerStatus || "") === partnerFilter);
    if (q) { const ql = q.toLowerCase(); r = r.filter((c) => c.name.toLowerCase().includes(ql) || c.city?.toLowerCase().includes(ql)); }
    const getKey = (c: typeof r[number]): string | number => {
      switch (sort.key) {
        case "name": return c.name.toLowerCase();
        case "type": return (c.companyType || "").toLowerCase();
        case "state": return (c.state || "").toLowerCase();
        case "tier": return (c.relationshipTier || "").toLowerCase();
        case "owner": return (userName(s, c.ownerId) || "").toLowerCase();
        case "ytd": return c.referralsYTD ?? 0;
        case "referrals": return c.referralCount ?? 0;
        case "last": return c.lastReferralDate || "";
        default: return "";
      }
    };
    const sorted = [...r].sort((a, b) => {
      const av = getKey(a); const bv = getKey(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [s, view, q, stateFilter, tierFilter, ownerFilter, partnerFilter, sort.key, sort.dir]);

  const pagedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  const totalCompanies = scopedCompanies(s).length;
  const companyFilters: FilterDef[] = [
    { key: "os", label: "State", value: stateFilter, onChange: setStateFilter, countSource: companies, countValue: (c) => (c as Company).state || "", options: [{ value: "all", label: "All states" }, ...STATES.map((st) => ({ value: st, label: st }))] },
    { key: "ot", label: "Tier", value: tierFilter, onChange: setTierFilter, countSource: companies, countValue: (c) => (c as Company).relationshipTier || "", options: [{ value: "all", label: "All tiers" }, ...["Tier A", "Tier B", "Tier C"].map((v) => ({ value: v, label: v }))] },
    { key: "oo", label: "Owner", value: ownerFilter, onChange: setOwnerFilter, countSource: companies, countValue: (c) => (c as Company).ownerId || "__unassigned__", options: [{ value: "all", label: "All owners" }, { value: "__unassigned__", label: "Unassigned" }, ...s.users.map((u) => ({ value: u.id, label: u.name }))], width: 160 },
    { key: "op", label: "Partner", value: partnerFilter, onChange: setPartnerFilter, countSource: companies, countValue: (c) => (c as Company).referralPartnerStatus || "", options: [{ value: "all", label: "All statuses" }, ...["Active Referral Partner", "Warm Relationship", "Connected", "New Target", "Inactive"].map((v) => ({ value: v, label: v }))], width: 170 },
  ];

  const allChecked = pagedRows.length > 0 && pagedRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) pagedRows.forEach((r) => next.delete(r.id));
    else pagedRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
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
  const bulkAddTag = async () => {
    const tag = await promptOperator({ title: "Tag companies", label: "Tag to add", submitLabel: "Apply tag", required: true });
    if (!tag) return;
    ids().forEach((id) => {
      const c = s.companies.find((x) => x.id === id);
      if (c && !c.tags.includes(tag)) crm.updateCompany(id, { tags: [...c.tags, tag] });
    });
    toast({ title: `Tagged ${selected.size} company(ies)` }); clear();
  };
  const bulkRemoveTag = async () => {
    const tag = await promptOperator({ title: "Remove tag", label: "Tag to remove", submitLabel: "Remove tag", required: true });
    if (!tag) return;
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
  const bulkResetReferrals = async () => {
    const ok = await confirmOperator({
      title: "Reset referral counts?",
      description: `This will set total and YTD referral counts to 0 for ${selected.size} company(ies).`,
      confirmLabel: "Reset counts",
      destructive: true,
    });
    if (!ok) return;
    ids().forEach((id) => crm.updateCompany(id, { referralCount: 0, referralsYTD: 0 }));
    toast({ title: `Reset referrals on ${selected.size} company(ies)` }); clear();
  };

  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search companies..." }}
        filters={companyFilters}
        resultCount={rows.length}
        totalCount={totalCompanies}
        onClear={() => { setQ(""); setStateFilter("all"); setTierFilter("all"); setOwnerFilter("all"); setPartnerFilter("all"); }}
        extra={
          <Button size="sm" className="h-9 gap-1.5" disabled={!canCrm(s, "create")} onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> New Company
          </Button>
        }
      />

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
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "export")} onClick={bulkExport}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" onClick={bulkResetReferrals}>
            <RotateCcw className="size-3 mr-1" /> Reset referrals
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "delete")} onClick={bulkDelete}>
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
                <SortTh label="Company" k="name" sort={sort} onSort={toggleSort} />
                <SortTh label="Type" k="type" sort={sort} onSort={toggleSort} />
                <SortTh label="State" k="state" sort={sort} onSort={toggleSort} />
                <SortTh label="Tier" k="tier" sort={sort} onSort={toggleSort} />
                <SortTh label="Owner" k="owner" sort={sort} onSort={toggleSort} />
                <SortTh label="YTD" k="ytd" sort={sort} onSort={toggleSort} align="right" />
                <SortTh label="Last Referral" k="last" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} /></td>
                  <td className="px-3 py-2">
                    <button className="font-medium hover:text-primary" onClick={() => onOpen(c.id)}>{c.name}</button>
                    <p className="text-xs text-muted-foreground">{c.city || ""}{c.city && c.state ? ", " : ""}{c.state || ""}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.companyType || "-"}</td>
                  <td className="px-3 py-2">{c.state || "-"}</td>
                  <td className="px-3 py-2">{c.relationshipTier ? <Badge variant="secondary">{c.relationshipTier}</Badge> : "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{userName(s, c.ownerId)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.referralsYTD}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.lastReferralDate)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground py-10">No companies match.</td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(n) => { setPageSizeStr(String(n)); setPageStr("1"); }}
        />
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
  const [addContact, setAddContact] = useState(false);
  const [nc, setNc] = useState({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "" });
  const submit = () => {
    if (!f.name) { toast({ title: "Company name required" }); return; }
    const co = crm.addCompany(f);
    if (addContact) {
      if (!nc.firstName.trim() || !nc.lastName.trim()) {
        toast({ title: "Contact first + last name required", variant: "destructive" as never });
        return;
      }
      crm.addContact({
        firstName: nc.firstName.trim(), lastName: nc.lastName.trim(),
        email: nc.email || undefined, phone: nc.phone || undefined,
        jobTitle: nc.jobTitle || undefined,
        companyId: co.id, state: f.state || undefined,
      });
    }
    toast({ title: "Company created" });
    onOpenChange(false);
    setF({ name: "", companyType: "", state: "", city: "" });
    setAddContact(false);
    setNc({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Company</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label className="text-xs">Type</Label><Input value={f.companyType} onChange={(e) => setF({ ...f, companyType: e.target.value })} placeholder="Pediatrician Office, Diagnostic Center..." /></div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="Pick state" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label className="text-xs">City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
          <div className="col-span-2 pt-1">
            {!addContact ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setAddContact(true)}>
                <Plus className="size-3.5 mr-1.5" /> Add primary contact
              </Button>
            ) : (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Primary contact</div>
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setAddContact(false)}>Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">First name</Label><Input value={nc.firstName} onChange={(e) => setNc({ ...nc, firstName: e.target.value })} /></div>
                  <div><Label className="text-xs">Last name</Label><Input value={nc.lastName} onChange={(e) => setNc({ ...nc, lastName: e.target.value })} /></div>
                  <div><Label className="text-xs">Email</Label><Input value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} /></div>
                  <div className="col-span-2"><Label className="text-xs">Job title</Label><Input value={nc.jobTitle} onChange={(e) => setNc({ ...nc, jobTitle: e.target.value })} /></div>
                </div>
              </div>
            )}
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
function partitionLegacy(rows: Referral[], selectedIds: ID[]): { nativeIds: ID[]; skipped: number } {
  const legacySet = new Set(rows.filter((r) => r.isLegacyLeadLink).map((r) => r.id));
  const nativeIds = selectedIds.filter((id) => !legacySet.has(id));
  return { nativeIds, skipped: selectedIds.length - nativeIds.length };
}

const REFERRAL_STATUS_STYLES: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Review": "bg-amber-50 text-amber-700 ring-amber-200",
  "Intake Form Sent": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Scheduled: "bg-violet-50 text-violet-700 ring-violet-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-slate-100 text-slate-700 ring-slate-200",
  Lost: "bg-rose-50 text-rose-700 ring-rose-200",
};

function ReferralStatusPill({ status }: { status?: string | null }) {
  const label = status || "-";
  const cls = (status && REFERRAL_STATUS_STYLES[status]) || "bg-muted text-muted-foreground ring-border";
  return (
    <span className={cn("inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium ring-1 ring-inset whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}

const PIPELINE_STAGE_STYLES: Record<FamilyLeadPipelineStage, string> = {
  "Lead Captured": "bg-slate-50 text-slate-700 ring-slate-200",
  "First Contact Attempt": "bg-blue-50 text-blue-700 ring-blue-200",
  "Engagement Track": "bg-sky-50 text-sky-700 ring-sky-200",
  "Qualification": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Intake Packet Sent": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Intake Packet Follow Up": "bg-violet-50 text-violet-700 ring-violet-200",
  "Intake Complete": "bg-purple-50 text-purple-700 ring-purple-200",
  "Benefits Verification": "bg-amber-50 text-amber-700 ring-amber-200",
  "Assessment Scheduling": "bg-orange-50 text-orange-700 ring-orange-200",
  "QA / Treatment Plan Authorization": "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  "Authorization Pending": "bg-yellow-50 text-yellow-700 ring-yellow-200",
  "Staffing Match": "bg-teal-50 text-teal-700 ring-teal-200",
  "Ready to Start Services": "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function PipelineStagePill({ stage, onClick }: { stage: FamilyLeadPipelineStage | null; onClick?: () => void }) {
  if (!stage) {
    return <span className="text-[11px] text-muted-foreground">Not linked</span>;
  }
  const cls = PIPELINE_STAGE_STYLES[stage] || "bg-muted text-muted-foreground ring-border";
  const base = cn("inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium ring-1 ring-inset whitespace-nowrap max-w-full", cls);
  if (onClick) {
    return <button type="button" onClick={onClick} className={cn(base, "hover:brightness-95 transition")} title="Open patient pipeline">{stage}</button>;
  }
  return <span className={base}>{stage}</span>;
}

function ReferralsModule({ onOpenContact }: { onOpenContact: (id: ID) => void }) {
  const s = useCrm();
  const { promptOperator } = useOperatorDialogs();
  const { leads } = useLeads();
  const navigate = useNavigate();
  const leadById = useMemo(() => {
    const m = new Map<string, (typeof leads)[number]>();
    leads.forEach((l) => m.set(l.id, l));
    return m;
  }, [leads]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [logId, setLogId] = useState<ID | null>(null);
  // Full-page migration: opening a lead navigates to the canonical record.
  const setDrawerLeadId = (v: string | null) => {
    if (v) navigate(`/leads/${encodeURIComponent(v)}`);
  };
  const setDrawerFocusStage = (_v: string | null) => { /* no-op — full page owns tabs */ };
  const [statusFilter, _setStatusFilter] = useUrlState("rs", "all");
  const [stageFilter, _setStageFilter] = useUrlState("rp", "all");
  const [rQuery, _setRQuery] = useUrlState("rq", "", { history: "replace" });
  const [rStateFilter, _setRStateFilter] = useUrlState("rst", "all");
  const [rServiceFilter, _setRServiceFilter] = useUrlState("rsv", "all");
  const [rIntakeOwnerFilter, _setRIntakeOwnerFilter] = useUrlState("rio", "all");
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [bulkTaskOpen, setBulkTaskOpen] = useState(false);
  const [sortKey, setSortKey] = useUrlState("rsk", "date");
  const [sortDir, setSortDir] = useUrlState("rsd", "desc");
  const sort: SortState = { key: sortKey, dir: sortDir === "asc" ? "asc" : "desc" };
  const toggleSort = (key: string) => {
    if (sort.key === key) setSortDir(sort.dir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const [pageStr, setPageStr] = useUrlState("rpg", "1");
  const [pageSizeStr, _setPageSizeStr] = useUrlState("rps", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);
  const resetPage = () => { if ((Number(pageStr) || 1) !== 1) setPageStr("1"); };
  const setStatusFilter = (v: string) => { _setStatusFilter(v); resetPage(); };
  const setStageFilter = (v: string) => { _setStageFilter(v); resetPage(); };
  const setRQuery = (v: string) => { _setRQuery(v); resetPage(); };
  const setRStateFilter = (v: string) => { _setRStateFilter(v); resetPage(); };
  const setRServiceFilter = (v: string) => { _setRServiceFilter(v); resetPage(); };
  const setRIntakeOwnerFilter = (v: string) => { _setRIntakeOwnerFilter(v); resetPage(); };
  const setPageSizeStr = (v: string) => { _setPageSizeStr(v); resetPage(); };
  const allRows = scopedReferrals(s);
  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => {
      if (statusFilter !== "all" && (r.referralStatus || "") !== statusFilter) return false;
      if (stageFilter !== "all") {
        const lead = r.leadId ? leadById.get(r.leadId) : undefined;
        const stage = lead ? canonicalFamilyLeadStage(lead.status) : null;
        if (stageFilter === "__none__") {
          if (stage) return false;
        } else if (stage !== stageFilter) {
          return false;
        }
      }
      if (rStateFilter !== "all" && r.state !== rStateFilter) return false;
      if (rServiceFilter !== "all" && (r.serviceType || "") !== rServiceFilter) return false;
      if (rIntakeOwnerFilter !== "all") {
        if (rIntakeOwnerFilter === "__unassigned__") {
          if (r.assignedIntakeOwnerId) return false;
        } else if (r.assignedIntakeOwnerId !== rIntakeOwnerFilter) return false;
      }
      if (rQuery) {
        const ql = rQuery.toLowerCase();
        const co = companyName(s, r.companyId).toLowerCase();
        const con = r.contactId ? contactDisplayName(s.contacts.find((c) => c.id === r.contactId)).toLowerCase() : "";
        if (!r.name.toLowerCase().includes(ql) && !co.includes(ql) && !con.includes(ql)) return false;
      }
      return true;
    });
    const getKey = (r: typeof filtered[number]): string | number => {
      switch (sort.key) {
        case "name": return (r.name || "").toLowerCase();
        case "company": return companyName(s, r.companyId).toLowerCase();
        case "contact": return r.contactId ? contactDisplayName(s.contacts.find((c) => c.id === r.contactId)).toLowerCase() : "";
        case "state": return (r.state || "").toLowerCase();
        case "service": return (r.serviceType || "").toLowerCase();
        case "status": return (r.referralStatus || "").toLowerCase();
        case "pipeline": {
          const lead = r.leadId ? leadById.get(r.leadId) : undefined;
          return lead ? (canonicalFamilyLeadStage(lead.status) || "").toLowerCase() : "";
        }
        case "insurance": return (r.insuranceType || "").toLowerCase();
        case "owner": return (userName(s, r.assignedIntakeOwnerId) || "").toLowerCase();
        case "date":
        default: return r.referralDate || "";
      }
    };
    return [...filtered].sort((a, b) => {
      const av = getKey(a); const bv = getKey(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [allRows, statusFilter, stageFilter, leadById, rStateFilter, rServiceFilter, rIntakeOwnerFilter, rQuery, s, sort.key, sort.dir]);

  const pagedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );
  const filtersActive =
    statusFilter !== "all" || stageFilter !== "all" ||
    rStateFilter !== "all" || rServiceFilter !== "all" ||
    rIntakeOwnerFilter !== "all" || !!rQuery;
  const referralServices = useMemo(() => Array.from(new Set(s.referrals.map((r) => r.serviceType).filter((x): x is string => !!x))).sort(), [s.referrals]);
  const referralFilters: FilterDef[] = [
    { key: "rs", label: "Status", value: statusFilter, onChange: setStatusFilter, countSource: allRows, countValue: (r) => (r as Referral).referralStatus || "", options: [{ value: "all", label: "All statuses" }, ...["New", "In Review", "Intake Form Sent", "Scheduled", "Active", "Closed", "Lost"].map((v) => ({ value: v, label: v }))], width: 160 },
    { key: "rp", label: "Pipeline", value: stageFilter, onChange: setStageFilter, countSource: allRows, countValue: (r) => { const ref = r as Referral; const lead = ref.leadId ? leadById.get(ref.leadId) : undefined; return lead ? canonicalFamilyLeadStage(lead.status) : "__none__"; }, options: [{ value: "all", label: "All stages" }, { value: "__none__", label: "Not linked" }, ...FAMILY_LEAD_PIPELINE_STAGES.map((v) => ({ value: v, label: v }))], width: 200 },
    { key: "rst", label: "State", value: rStateFilter, onChange: setRStateFilter, countSource: allRows, countValue: (r) => (r as Referral).state || "", options: [{ value: "all", label: "All states" }, ...STATES.map((st) => ({ value: st, label: st }))] },
    { key: "rsv", label: "Service", value: rServiceFilter, onChange: setRServiceFilter, countSource: allRows, countValue: (r) => (r as Referral).serviceType || "", options: [{ value: "all", label: "All services" }, ...referralServices.map((v) => ({ value: v, label: v }))], width: 160 },
    { key: "rio", label: "Intake owner", value: rIntakeOwnerFilter, onChange: setRIntakeOwnerFilter, countSource: allRows, countValue: (r) => (r as Referral).assignedIntakeOwnerId || "__unassigned__", options: [{ value: "all", label: "All owners" }, { value: "__unassigned__", label: "Unassigned" }, ...s.users.map((u) => ({ value: u.id, label: u.name }))], width: 180 },
  ];

  const allChecked = pagedRows.length > 0 && pagedRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) pagedRows.forEach((r) => next.delete(r.id));
    else pagedRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id: ID) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const ids = () => Array.from(selected);
  const clear = () => setSelected(new Set());
  const bulkStatus = (v: string) => {
    const { nativeIds, skipped } = partitionLegacy(rows, ids());
    nativeIds.forEach((id) => crm.updateReferral(id, { referralStatus: v as Referral["referralStatus"] }));
    toast({ title: `Updated status on ${nativeIds.length}`, description: skipped ? "Skipped read-only legacy referrals." : undefined });
    clear();
  };
  const bulkIntakeStatus = async () => {
    const v = await promptOperator({ title: "Update intake status", label: "New intake status", submitLabel: "Update", required: true });
    if (!v) return;
    const { nativeIds, skipped } = partitionLegacy(rows, ids());
    nativeIds.forEach((id) => crm.updateReferral(id, { intakeStatus: v }));
    toast({ title: `Updated intake status on ${nativeIds.length}`, description: skipped ? "Skipped read-only legacy referrals." : undefined });
    clear();
  };
  const bulkAssignIntake = (uid: ID) => {
    const { nativeIds, skipped } = partitionLegacy(rows, ids());
    nativeIds.forEach((id) => crm.updateReferral(id, { assignedIntakeOwnerId: uid }));
    toast({ title: `Assigned intake owner on ${nativeIds.length}`, description: skipped ? "Skipped read-only legacy referrals." : undefined });
    clear();
  };
  const bulkExport = () => {
    const data = s.referrals.filter((r) => selected.has(r.id)).map((r) => ({
      id: r.id, name: r.name, referralDate: r.referralDate,
      companyName: companyName(s, r.companyId),
      contactName: r.contactId ? contactDisplayName(s.contacts.find((c) => c.id === r.contactId)) : "",
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
    const { nativeIds, skipped } = partitionLegacy(rows, ids());
    nativeIds.forEach((id) => crm.softDeleteReferral(id));
    toast({ title: `${nativeIds.length} referral(s) deleted`, description: skipped ? "Skipped read-only legacy referrals." : undefined });
    clear();
  };

  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: rQuery, onChange: setRQuery, placeholder: "Search patient, company, contact..." }}
        filters={referralFilters}
        resultCount={rows.length}
        totalCount={allRows.length}
        onClear={() => {
          setStatusFilter("all"); setStageFilter("all");
          setRStateFilter("all"); setRServiceFilter("all");
          setRIntakeOwnerFilter("all"); setRQuery("");
        }}
        extra={
          <Button size="sm" className="h-9 gap-1.5" disabled={!canCrm(s, "create")} onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> New Referral
          </Button>
        }
      />

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
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "export")} onClick={bulkExport}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "delete")} onClick={bulkDelete}>
            <Trash2 className="size-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="h-10">
                <th className="w-10 px-3 text-left align-middle"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="w-[180px] align-middle"><SortTh label="Patient" k="name" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[180px] align-middle"><SortTh label="Source Company" k="company" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[160px] align-middle"><SortTh label="Source Contact" k="contact" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[70px] align-middle"><SortTh label="State" k="state" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[140px] align-middle"><SortTh label="Service" k="service" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[140px] align-middle"><SortTh label="Status" k="status" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[180px] align-middle"><SortTh label="Patient Pipeline" k="pipeline" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[140px] align-middle"><SortTh label="Insurance" k="insurance" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[140px] align-middle"><SortTh label="Intake Owner" k="owner" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[110px] align-middle"><SortTh label="Date" k="date" sort={sort} onSort={toggleSort} /></th>
                <th className="w-[70px] px-3 text-right font-medium align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => {
                const lead = r.leadId ? leadById.get(r.leadId) : undefined;
                const stage = lead ? canonicalFamilyLeadStage(lead.status) : null;
                return (
                <tr key={r.id} className="border-t hover:bg-muted/30 h-12">
                  <td className="px-3 align-middle"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} /></td>
                  <td className="px-3 align-middle font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      {lead ? (
                        <button className="truncate text-left hover:text-primary" onClick={() => { setDrawerFocusStage(null); setDrawerLeadId(lead.id); }}>{r.name}</button>
                      ) : r.isLegacyLeadLink ? (
                        <span className="truncate text-foreground">{r.name}</span>
                      ) : (
                        <button className="truncate text-left hover:text-primary" onClick={() => setEditingId(r.id)}>{r.name}</button>
                      )}
                      {r.isLegacyLeadLink && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">Read-only</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 align-middle truncate">{companyName(s, r.companyId) || <span className="text-muted-foreground">-</span>}</td>
                  <td className="px-3 align-middle truncate">
                    {r.contactId ? (
                      <button className="max-w-full truncate text-left font-medium hover:text-primary" onClick={() => onOpenContact(r.contactId!)}>
                        {contactDisplayName(s.contacts.find((c) => c.id === r.contactId))}
                      </button>
                    ) : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-3 align-middle">{r.state || <span className="text-muted-foreground">-</span>}</td>
                  <td className="px-3 align-middle truncate">{r.serviceType || <span className="text-muted-foreground">-</span>}</td>
                  <td className="px-3 align-middle"><ReferralStatusPill status={r.referralStatus} /></td>
                  <td className="px-3 align-middle">
                    <PipelineStagePill
                      stage={stage}
                      onClick={lead ? () => { setDrawerFocusStage(stage ?? null); setDrawerLeadId(lead.id); } : undefined}
                    />
                  </td>
                  <td className="px-3 align-middle text-muted-foreground truncate">{r.insuranceType || "-"}</td>
                  <td className="px-3 align-middle text-muted-foreground truncate">{userName(s, r.assignedIntakeOwnerId) || "-"}</td>
                  <td className="px-3 align-middle text-muted-foreground whitespace-nowrap">{fmtDate(r.referralDate)}</td>
                  <td className="px-3 align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <button className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title="Log activity" onClick={() => setLogId(r.id)}>
                        <Activity className="size-3.5" />
                      </button>
                      {!r.isLegacyLeadLink && (
                        <button className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title="Edit" onClick={() => setEditingId(r.id)}>
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={12} className="text-center text-muted-foreground py-10">{filtersActive ? "No referrals match the current filters." : "No referrals yet."}</td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(n) => { setPageSizeStr(String(n)); setPageStr("1"); }}
        />
      </div>

      <NewReferralDialog open={creating} onOpenChange={setCreating} />
      <EditReferralDialog id={editingId} open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)} />
      <LogActivityDialog open={!!logId} onOpenChange={(o) => !o && setLogId(null)} referralId={logId ?? undefined} />
      {/* Drawer removed — /leads/:id is the canonical full record. */}
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
    toast({ title: "Referral created - partner stats updated" });
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
              <SelectContent>{eligibleContacts.map((c) => <SelectItem key={c.id} value={c.id}>{contactDisplayName(c)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">State</Label>
            <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
              <SelectTrigger><SelectValue placeholder="Pick state" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Service type</Label><Input value={f.serviceType} onChange={(e) => setF({ ...f, serviceType: e.target.value })} placeholder="In-Home ABA, Center-Based..." /></div>
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
function TasksModule({ onOpenContact }: { onOpenContact: (id: ID) => void }) {
  const s = useCrm();
  const { promptOperator } = useOperatorDialogs();
  const tasks = scopedTasks(s);

  const [groupByRaw, setGroupByRaw] = useUrlState("tg", "owner");
  const groupBy: "owner" | "state" | "status" =
    groupByRaw === "state" || groupByRaw === "status" ? groupByRaw : "owner";
  const setGroupBy = (v: "owner" | "state" | "status") => setGroupByRaw(v);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<ID>>(new Set());
  const [tQuery, setTQuery] = useUrlState("tq", "", { history: "replace" });
  const [tStatusFilter, setTStatusFilter] = useUrlState("ts", "all");
  const [tPriorityFilter, setTPriorityFilter] = useUrlState("tpr", "all");
  const [tOwnerFilter, setTOwnerFilter] = useUrlState("to", "all");
  const [tTypeFilter, setTTypeFilter] = useUrlState("tt", "all");
  const [tDueFilter, setTDueFilter] = useUrlState("td", "all");

  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return scopedTasks(s).filter((t) => {
      if (tStatusFilter !== "all" && t.status !== tStatusFilter) return false;
      if (tPriorityFilter !== "all" && t.priority !== tPriorityFilter) return false;
      if (tOwnerFilter !== "all") {
        if (tOwnerFilter === "__unassigned__") { if (t.assignedUserId) return false; }
        else if (t.assignedUserId !== tOwnerFilter) return false;
      }
      if (tTypeFilter !== "all" && t.type !== tTypeFilter) return false;
      if (tDueFilter !== "all") {
        const due = t.dueDate ? new Date(t.dueDate).getTime() : null;
        if (tDueFilter === "overdue") { if (!due || due >= today.getTime() || t.status === "Completed") return false; }
        else if (tDueFilter === "today") { if (!due || due < today.getTime() || due >= today.getTime() + 86_400_000) return false; }
        else if (tDueFilter === "week") { if (!due || due < now || due > now + 7 * 86_400_000) return false; }
        else if (tDueFilter === "none") { if (due) return false; }
      }
      if (tQuery) {
        const ql = tQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(ql) && !(t.notes || "").toLowerCase().includes(ql)) return false;
      }
      return true;
    });
  }, [s, tQuery, tStatusFilter, tPriorityFilter, tOwnerFilter, tTypeFilter, tDueFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      let key = "Unassigned";
      if (groupBy === "owner") key = userName(s, t.assignedUserId);
      else if (groupBy === "state") {
        const co = s.companies.find((c) => c.id === t.companyId);
        key = co?.state ?? "-";
      } else key = t.status;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [s, groupBy, filteredTasks]);

  const visibleIds = filteredTasks.map((t) => t.id);
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
  const bulkDueDate = async () => {
    const v = await promptOperator({
      title: "Set due date",
      label: "Due date",
      inputType: "date",
      submitLabel: "Apply",
      required: true,
    });
    if (!v) return;
    ids().forEach((id) => crm.updateTask(id, { dueDate: v }));
    toast({ title: `Updated due date on ${selected.size}` }); clear();
  };
  const bulkDelete = () => {
    ids().forEach((id) => crm.softDeleteTask(id));
    toast({ title: `${selected.size} task(s) deleted` }); clear();
  };
  const bulkExport = () => {
    const data = s.tasks.filter((t) => selected.has(t.id)).map((t) => ({
      id: t.id, title: t.title, type: t.type, priority: t.priority, status: t.status,
      dueDate: t.dueDate, assignedUser: userName(s, t.assignedUserId),
      company: companyName(s, t.companyId),
      contact: t.contactId ? contactDisplayName(s.contacts.find((c) => c.id === t.contactId)) : "",
      referralId: t.referralId, notes: t.notes, createdAt: t.createdAt,
    }));
    downloadCsv(`tasks-selected-${Date.now()}.csv`, rowsToCsv(data));
    crm.recordExport(`Exported ${data.length} selected tasks`);
    toast({ title: `Exported ${data.length} task(s)` });
  };

  const totalTasks = scopedTasks(s).length;
  const taskDueBucket = (t: Task): string | null => {
    if (!t.dueDate) return "none";
    const now = Date.now();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate).getTime();
    if (due < today.getTime()) return t.status === "Completed" ? null : "overdue";
    if (due < today.getTime() + 86400000) return "today";
    if (due <= now + 7 * 86400000) return "week";
    return null;
  };
  const taskFilters: FilterDef[] = [
    { key: "ts", label: "Status", value: tStatusFilter, onChange: setTStatusFilter, countSource: tasks, countValue: (t) => (t as Task).status || "", options: [{ value: "all", label: "All" }, ...["Open", "In Progress", "Completed"].map((v) => ({ value: v, label: v }))] },
    { key: "tpr", label: "Priority", value: tPriorityFilter, onChange: setTPriorityFilter, countSource: tasks, countValue: (t) => (t as Task).priority || "", options: [{ value: "all", label: "All" }, ...["Low", "Medium", "High"].map((v) => ({ value: v, label: v }))] },
    { key: "tt", label: "Type", value: tTypeFilter, onChange: setTTypeFilter, countSource: tasks, countValue: (t) => (t as Task).type || "", options: [{ value: "all", label: "All" }, ...["Call", "Email", "Meeting", "Lunch & Learn", "Follow-Up", "Other"].map((v) => ({ value: v, label: v }))], width: 150 },
    { key: "to", label: "Owner", value: tOwnerFilter, onChange: setTOwnerFilter, countSource: tasks, countValue: (t) => (t as Task).assignedUserId || "__unassigned__", options: [{ value: "all", label: "All owners" }, { value: "__unassigned__", label: "Unassigned" }, ...s.users.map((u) => ({ value: u.id, label: u.name }))], width: 160 },
    { key: "td", label: "Due", value: tDueFilter, onChange: setTDueFilter, countSource: tasks, countValue: (t) => taskDueBucket(t as Task), options: [{ value: "all", label: "Any" }, { value: "overdue", label: "Overdue" }, { value: "today", label: "Today" }, { value: "week", label: "Next 7d" }, { value: "none", label: "No date" }] },
  ];

  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: tQuery, onChange: setTQuery, placeholder: "Search tasks..." }}
        filters={taskFilters}
        resultCount={filteredTasks.length}
        totalCount={totalTasks}
        onClear={() => { setTQuery(""); setTStatusFilter("all"); setTPriorityFilter("all"); setTOwnerFilter("all"); setTTypeFilter("all"); setTDueFilter("all"); }}
        extra={
          <Button size="sm" className="h-9 gap-1.5" disabled={!canCrm(s, "create")} onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> New Task
          </Button>
        }
      />
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
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "export")} onClick={bulkExport}>
            <Download className="size-3 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-background hover:bg-background/10" disabled={!canCrm(s, "delete")} onClick={bulkDelete}>
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
                const contact = t.contactId ? s.contacts.find((c) => c.id === t.contactId) : undefined;
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
                        {t.type} - {companyName(s, t.companyId)} - {userName(s, t.assignedUserId)}
                        {contact && (
                          <>
                            {" - "}
                            <button className="font-medium hover:text-primary" onClick={() => onOpenContact(contact.id)}>
                              {contactDisplayName(contact)}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn(t.priority === "High" && "bg-destructive/10 text-destructive")}>{t.priority}</Badge>
                    <span className={cn("text-xs tabular-nums", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {fmtDate(t.dueDate)}
                    </span>
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => crm.softDeleteTask(t.id)}>
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

  const [q, setQ] = useState("");
  const [kindF, setKindF] = useState<string>("all");
  const [objectF, setObjectF] = useState<string>("all");
  const filteredLists = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.lists.filter((l) =>
      (kindF === "all" || l.kind === kindF) &&
      (objectF === "all" || l.object === objectF) &&
      (!needle || l.name.toLowerCase().includes(needle))
    );
  }, [s.lists, q, kindF, objectF]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Lists"
        subtitle="Static lists hold a manual set of records. Active lists evaluate criteria live."
        right={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4 mr-1" />Create list</Button>}
      />
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search lists by name..." }}
        filters={[
          { key: "kind", label: "Kind", value: kindF, onChange: setKindF, countSource: s.lists, countValue: (l) => (l as ListDef).kind, options: [
            { value: "all", label: "All kinds" },
            { value: "active", label: "Active" },
            { value: "static", label: "Static" },
          ] },
          { key: "object", label: "Object", value: objectF, onChange: setObjectF, countSource: s.lists, countValue: (l) => (l as ListDef).object, options: [
            { value: "all", label: "All objects" },
            { value: "contacts", label: "Contacts" },
            { value: "companies", label: "Companies" },
          ] },
        ]}
        resultCount={filteredLists.length}
        totalCount={s.lists.length}
        onClear={() => { setQ(""); setKindF("all"); setObjectF("all"); }}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        {filteredLists.length === 0 && (
          <div className="col-span-full rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
            No lists match the current filters.
          </div>
        )}
        {filteredLists.map((l) => {
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
                      ? (l.criteriaRules ? describeCriteria(l.criteriaRules) : (l.criteria ?? "-"))
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
  if (typeof c.referralCountGte === "number") parts.push(`referrals >= ${c.referralCountGte}`);
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
                <Input value={criteria.companyType ?? ""} placeholder="Pediatrician Office..."
                       onChange={(e) => upd("companyType", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Referral source type</Label>
                <Input value={criteria.referralSourceType ?? ""} placeholder="Pediatrician, School..."
                       onChange={(e) => upd("referralSourceType", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Referral partner status</Label>
                <Input value={criteria.referralPartnerStatus ?? ""} placeholder="Active Referral Partner..."
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
                <Label className="text-xs">Referral count &gt;=</Label>
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
              Static lists hold a manual set of records. After creating, use "Add records" on the list card to add or remove contacts/companies.
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
        <DialogHeader><DialogTitle>Manage records - {list.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${list.object}...`} />
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
                {w.runs} runs - last {fmtDate(w.lastRun)}
                {w.lastRunResult ? <> - <span className="text-foreground">{w.lastRunResult}</span></> : null}
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
                const label = newActionDetail ? `${newAction} - ${newActionDetail}` : newAction;
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
    name: contactDisplayName(c), company: companyName(s, c.companyId), state: c.state,
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
        rows={topPartners.map((c) => [c.name, c.companyType ?? "-", c.state ?? "-",
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
                  <td>{c.state ?? "-"}</td>
                  <td>{userName(s, c.ownerId)}</td>
                  <td>{fmtDate(c.lastContactedDate)}</td>
                  <td className="text-right">
                    <Badge variant={days > 90 ? "destructive" : "secondary"} className="tabular-nums">{Number.isFinite(days) ? `${days}d` : "-"}</Badge>
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
        rows={byCompany.map((r) => [r.name, r.type ?? "-", r.state ?? "-", r.referrals])} />

      {/* Referrals by Contact */}
      <ReportTable title="Referrals by Contact"
        headers={["Contact", "Company", "State", "Referrals"]}
        rows={byContact.map((r) => [r.name, r.company, r.state ?? "-", r.referrals])} />

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
// Exports - real CSV downloads
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
      sourceContact: r.contactId ? contactDisplayName(s.contacts.find((c) => c.id === r.contactId)) : "",
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
// Imports - paste/upload CSV -> preview -> commit
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

/**
 * SupabaseQuickImport - wraps the existing HubSpot importer pipeline
 * (parseReferralsCsv + importReferralRows) so CSV/XLSX uploads land
 * directly in referral_contacts / referral_companies / referral_import_batches,
 * then re-hydrates the CRM store so the new rows appear immediately.
 */
function SupabaseQuickImport() {
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    created: number; updated: number; duplicates: number; failed: number;
    errors: { row: number; reason: string; data: Record<string, string> }[];
  } | null>(null);

  const onChoose = async (file: File) => {
    setBusy(true); setResult(null); setProgress(null);
    try {
      const p = await parseReferralsCsv(file);
      setParsed(p); setFileName(file.name);
    } catch (e) {
      toast({ title: "Could not parse file", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  const runImport = async () => {
    if (!parsed) return;
    setBusy(true);
    try {
      const res = await importReferralRows(fileName, parsed.rows, setProgress);
      setResult({
        created: res.createdContacts,
        updated: res.updatedContacts,
        duplicates: res.duplicateContacts,
        failed: res.failedRows,
        errors: res.errors,
      });
      crm.recordImport(
        `HubSpot import: ${res.createdContacts} created - ${res.updatedContacts} updated - ${res.failedRows} failed - companies +${res.createdCompanies}`,
      );
      toast({
        title: "Import complete",
        description: `${res.createdContacts} created - ${res.updatedContacts} updated - ${res.failedRows} failed`,
      });
      await hydrateFromSupabase().catch((e) => console.warn("[ImportsModule] rehydrate failed", e));
    } catch (e) {
      toast({ title: "Import failed", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); setProgress(null); }
  };

  const downloadErrorCsv = () => {
    if (!result?.errors.length) return;
    const csv = failedRowsToCsv(result.errors);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `referral-import-errors-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">HubSpot / CSV Import (writes to backend)</h3>
          <p className="text-xs text-muted-foreground">
            Drops referral contacts &amp; companies into the shared referral tables. Existing records are matched by email,
            HubSpot Record ID, or name + company; companies are matched by normalized name + domain.
          </p>
        </div>
        <input id="crm-hubspot-import" type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChoose(f); e.currentTarget.value = ""; }} />
        <Button size="sm" disabled={busy} onClick={() => document.getElementById("crm-hubspot-import")?.click()}>
          <Upload className="size-3.5 mr-1.5" /> Choose CSV / XLSX
        </Button>
      </div>

      {parsed && (
        <div className="rounded-xl border bg-background p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span>
              <strong>{fileName}</strong> - {parsed.rows.length.toLocaleString()} rows ready
            </span>
            <Button size="sm" disabled={busy} onClick={runImport}>
              {busy ? `Importing... ${progress?.current ?? 0}/${progress?.total ?? parsed.rows.length}` : "Import to backend"}
            </Button>
          </div>
          {progress && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (progress.current / Math.max(1, progress.total)) * 100)}%` }} />
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg border bg-background p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Created</p>
            <p className="text-lg font-semibold tabular-nums text-emerald-700">{result.created}</p>
          </div>
          <div className="rounded-lg border bg-background p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Updated</p>
            <p className="text-lg font-semibold tabular-nums">{result.updated}</p>
          </div>
          <div className="rounded-lg border bg-background p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Duplicates</p>
            <p className="text-lg font-semibold tabular-nums text-amber-700">{result.duplicates}</p>
          </div>
          <div className="rounded-lg border bg-background p-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold tabular-nums text-destructive">{result.failed}</p>
            </div>
            {result.failed > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={downloadErrorCsv}>
                <Download className="size-3 mr-1" /> CSV
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ImportsModule() {
  const s = useCrm();
  const batches = s.importBatches ?? [];
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const statuses = useMemo(
    () => Array.from(new Set(batches.map((b) => b.status).filter(Boolean))) as string[],
    [batches],
  );
  const filteredBatches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return batches.filter((b) =>
      (statusF === "all" || b.status === statusF) &&
      (!needle || (b.fileName ?? "").toLowerCase().includes(needle))
    );
  }, [batches, q, statusF]);
  return (
    <div className="space-y-4">
      <SupabaseQuickImport />
      {batches.length > 0 && (
        <TableFilterBar
          search={{ value: q, onChange: setQ, placeholder: "Search by file name..." }}
          filters={[
            { key: "status", label: "Status", value: statusF, onChange: setStatusF, countSource: batches, countValue: (b) => (b as ImportBatch).status, options: [
              { value: "all", label: "All statuses" },
              ...statuses.map((v) => ({ value: v, label: v })),
            ] },
          ]}
          resultCount={filteredBatches.length}
          totalCount={batches.length}
          onClear={() => { setQ(""); setStatusF("all"); }}
        />
      )}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b bg-muted/30">
          <div>
            <h3 className="font-semibold text-sm">Import History</h3>
            <p className="text-[11px] text-muted-foreground">
              All CSV / HubSpot imports persisted to the backend (referral_import_batches).
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {filteredBatches.length === batches.length ? `${batches.length} batches` : `${filteredBatches.length} of ${batches.length}`}
          </Badge>
        </div>
        {batches.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No imports yet. Use the importer above to add referrals into the CRM.
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No batches match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">File</th>
                  <th className="text-left px-3 py-2 font-medium">Uploaded</th>
                  <th className="text-right px-3 py-2 font-medium">Total</th>
                  <th className="text-right px-3 py-2 font-medium">Success</th>
                  <th className="text-right px-3 py-2 font-medium">Failed</th>
                  <th className="text-right px-3 py-2 font-medium">Dup. Contacts</th>
                  <th className="text-right px-3 py-2 font-medium">Dup. Companies</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-1.5">{b.fileName}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{new Date(b.uploadedAt).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{b.totalRows.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-emerald-700">{b.successfulRows.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-destructive">{b.failedRows.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-amber-700">{b.duplicateContacts.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-amber-700">{b.duplicateCompanies.toLocaleString()}</td>
                    <td className="px-3 py-1.5">
                      <Badge variant={b.status === "Completed" ? "secondary" : "outline"} className="text-[10px]">
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================
// Duplicate management - real merge
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
                        <p className="font-medium">{contactDisplayName(c)}</p>
                        <p className="text-xs text-muted-foreground">{c.email || "no email"}</p>
                        <p className="text-xs text-muted-foreground">{c.phone || "no phone"}</p>
                        <p className="text-xs text-muted-foreground">{c.jobTitle || "-"} - {c.referralCount} referrals</p>
                        <p className="text-xs text-muted-foreground">{companyName(s, c.companyId)}</p>
                        <Button size="sm" className="h-7 mt-2 w-full" onClick={() => mergeContact(c, other)}>
                          Keep this - merge other in
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
                        <p className="text-xs text-muted-foreground">{[c.city, c.state].filter(Boolean).join(", ") || "-"}</p>
                        <p className="text-xs text-muted-foreground">{contactCount} contacts - {c.referralCount} referrals</p>
                        <Button size="sm" className="h-7 mt-2 w-full" onClick={() => mergeCompany(c, other)}>
                          Keep this - merge other in
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
                <p className="text-xs text-muted-foreground">{f.object} - {f.type}</p>
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
  const [q, setQ] = useUrlState("fq", "", { history: "replace" });
  const [type, setType] = useUrlState("ft", "all");
  const [category, setCategory] = useUrlState("fc", "all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pageStr, setPageStr] = useUrlState("fpg", "1");
  const [pageSizeStr, setPageSizeStr] = useUrlState("fps", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);
  const objectLabel = (a: Attachment): string => {
    if (a.objectType === "contact") {
      const c = s.contacts.find((x) => x.id === a.objectId); return c ? contactDisplayName(c) : a.objectId;
    }
    if (a.objectType === "company") return s.companies.find((x) => x.id === a.objectId)?.name ?? a.objectId;
    if (a.objectType === "referral") return s.referrals.find((x) => x.id === a.objectId)?.name ?? a.objectId;
    return a.objectId;
  };
  const rows = s.attachments.filter((a) => {
    if (a.archivedAt) return false;
    if (type !== "all" && a.objectType !== type) return false;
    if (category !== "all" && (a.category || "") !== category) return false;
    if (q && !a.fileName.toLowerCase().includes(q.toLowerCase()) && !objectLabel(a).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  useEffect(() => { setPageStr("1"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, type, category]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);
  async function openFile(a: Attachment) {
    if (!a.storagePath) {
      toast({ title: "No file backing this attachment", variant: "destructive" });
      return;
    }
    setBusyId(a.id);
    const { data, error } = await supabase.storage
      .from(a.storageBucket ?? "referral-crm-files")
      .createSignedUrl(a.storagePath, 60 * 10);
    setBusyId(null);
    if (error || !data?.signedUrl) {
      toast({ title: "Couldn't open file", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search files..." }}
        filters={[
          { key: "ft", label: "Object", value: type, onChange: setType, countSource: s.attachments, countValue: (a) => (a as Attachment).archivedAt ? null : (a as Attachment).objectType, options: [
            { value: "all", label: "All objects" },
            { value: "contact", label: "Contacts" },
            { value: "company", label: "Companies" },
            { value: "referral", label: "Referrals" },
            { value: "general", label: "General" },
          ] },
          { key: "fc", label: "Category", value: category, onChange: setCategory, countSource: s.attachments, countValue: (a) => (a as Attachment).archivedAt ? null : (a as Attachment).category || null, options: [
            { value: "all", label: "All" },
            ...["Lunch & Learn", "Insurance", "Outreach", "Welcome Packet", "Other"].map((c) => ({ value: c, label: c })),
          ], width: 160 },
        ]}
        resultCount={rows.length}
        totalCount={s.attachments.filter((a) => !a.archivedAt).length}
        onClear={() => { setQ(""); setType("all"); setCategory("all"); }}
        extra={
          <Button size="sm" className="h-9" onClick={() => setUploadOpen(true)}>
            <Upload className="size-3.5 mr-1.5" /> Upload file
          </Button>
        }
      />
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
              {pagedRows.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openFile(a)}
                      disabled={busyId === a.id}
                      className="flex items-center gap-2 text-left hover:underline disabled:opacity-50"
                    >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{a.fileName}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2"><span className="text-muted-foreground capitalize">{a.objectType}: </span>{objectLabel(a)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.category || "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.uploadedByName || userName(s, a.uploadedByUserId)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(a.uploadedAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { crm.archiveAttachment(a.id); toast({ title: "File moved to Deleted" }); }} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-10">No files yet. Attach from a contact, company, or referral.</td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(sz) => { setPageSizeStr(String(sz)); setPageStr("1"); }}
        />
      </div>
      <UploadFileDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

function UploadFileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useCrm();
  const [objectType, setObjectType] = useState<Attachment["objectType"]>("general");
  const [objectId, setObjectId] = useState<string>("general");
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const options = (() => {
    if (objectType === "contact") return s.contacts.filter((c) => !c.deletedAt).map((c) => ({ id: c.id, label: contactDisplayName(c) }));
    if (objectType === "company") return s.companies.filter((c) => !c.deletedAt).map((c) => ({ id: c.id, label: c.name }));
    if (objectType === "referral") return s.referrals.filter((r) => !r.deletedAt).map((r) => ({ id: r.id, label: r.name }));
    return [];
  })();

  async function handleUpload() {
    if (!file) { toast({ title: "Choose a file first", variant: "destructive" }); return; }
    if (objectType !== "general" && !objectId) { toast({ title: "Pick a record to attach to", variant: "destructive" }); return; }
    if (file.size > 20 * 1024 * 1024) { toast({ title: "File too large (max 20MB)", variant: "destructive" }); return; }
    setBusy(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
    const targetId = objectType === "general" ? "general" : objectId;
    const path = `${objectType}/${targetId}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("referral-crm-files")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) {
      setBusy(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    crm.addAttachment({
      fileName: file.name,
      fileType: file.type || undefined,
      mimeType: file.type || undefined,
      sizeBytes: file.size,
      objectType,
      objectId: targetId,
      category: (category || undefined) as Attachment["category"],
      notes: notes || undefined,
      storageBucket: "referral-crm-files",
      storagePath: path,
      uploadedByUserId: u.user?.id,
      uploadedByName: u.user?.email ?? undefined,
    });
    setBusy(false);
    setFile(null); setNotes(""); setCategory("");
    onOpenChange(false);
    toast({ title: "File uploaded" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload file</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Attach to</Label>
              <Select value={objectType} onValueChange={(v) => { setObjectType(v as Attachment["objectType"]); setObjectId(v === "general" ? "general" : ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (no record)</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {objectType !== "general" && (
              <div>
                <Label>Record</Label>
                <Select value={objectId} onValueChange={setObjectId}>
                  <SelectTrigger><SelectValue placeholder="Pick one..." /></SelectTrigger>
                  <SelectContent className="max-h-[260px]">
                    {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {["Lunch & Learn", "Insurance", "Outreach", "Welcome Packet", "Other"].map((c) =>
                  <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label>File (max 20MB)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleUpload} disabled={busy || !file}>{busy ? "Uploading..." : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [q, setQ] = useUrlState("aq", "", { history: "replace" });
  const [action, setAction] = useUrlState("aa", "all");
  const [objectType, setObjectType] = useUrlState("ao", "all");
  const [pageStr, setPageStr] = useUrlState("apg", "1");
  const [pageSizeStr, setPageSizeStr] = useUrlState("aps", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);
  const rows = s.auditLog.filter((r) => {
    if (action !== "all" && r.action !== action) return false;
    if (objectType !== "all" && (r.objectType || "") !== objectType) return false;
    if (q) {
      const ql = q.toLowerCase();
      if (!r.summary.toLowerCase().includes(ql) && !(r.objectLabel ?? "").toLowerCase().includes(ql) && !r.actor.toLowerCase().includes(ql)) return false;
    }
    return true;
  });
  useEffect(() => { setPageStr("1"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, action, objectType]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const actions = Array.from(new Set(s.auditLog.map((r) => r.action)));
  const objectTypes = Array.from(new Set(s.auditLog.map((r) => r.objectType as string).filter((x) => !!x)));
  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search audit log..." }}
        filters={[
          { key: "aa", label: "Action", value: action, onChange: setAction, countSource: s.auditLog, countValue: (r) => (r as AuditLogEntry).action, options: [{ value: "all", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a }))], width: 170 },
          { key: "ao", label: "Object", value: objectType, onChange: setObjectType, countSource: s.auditLog, countValue: (r) => (r as AuditLogEntry).objectType as string | null, options: [{ value: "all", label: "All" }, ...objectTypes.map((o) => ({ value: o, label: o }))] },
        ]}
        resultCount={rows.length}
        totalCount={s.auditLog.length}
        onClear={() => { setQ(""); setAction("all"); setObjectType("all"); }}
      />
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
              {pagedRows.map((r) => {
                const Icon = AUDIT_ICON[r.action] ?? Activity;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{new Date(r.at).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.actor}</td>
                    <td className="px-3 py-2"><span className="inline-flex items-center gap-1.5 text-xs"><Icon className="size-3" /> {r.action}</span></td>
                    <td className="px-3 py-2"><span className="text-muted-foreground capitalize">{r.objectType}: </span>{r.objectLabel || r.objectId || "-"}</td>
                    <td className="px-3 py-2">{r.summary}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-10">No audit entries.</td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(sz) => { setPageSizeStr(String(sz)); setPageStr("1"); }}
        />
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
  const [f, setF] = useUrlState("af", "all");
  const [q, setQ] = useUrlState("aq2", "", { history: "replace" });
  const [pageStr, setPageStr] = useUrlState("a2pg", "1");
  const [pageSizeStr, setPageSizeStr] = useUrlState("a2ps", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);
  const rows = s.activity.filter((a) => {
    if (f !== "all" && a.type !== f) return false;
    if (q) {
      const ql = q.toLowerCase();
      if (!a.message.toLowerCase().includes(ql)) return false;
    }
    return true;
  });
  useEffect(() => { setPageStr("1"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [f, q]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search activity messages..." }}
        filters={[
          { key: "af", label: "Type", value: f, onChange: setF, countSource: s.activity, countValue: (a) => (a as ActivityEvent).type, options: ACTIVITY_FILTERS.map((x) => ({ value: x.id, label: x.label })), width: 150 },
        ]}
        resultCount={rows.length}
        totalCount={s.activity.length}
        onClear={() => { setQ(""); setF("all"); }}
      />
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="divide-y">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No activity in this view.</p>}
        {pagedRows.map((a) => {
          const Icon = ACTIVITY_ICON[a.type] ?? Activity;
          const targetName = a.contactId
            ? contactDisplayName(s.contacts.find((c) => c.id === a.contactId))
            : a.companyId
              ? companyName(s, a.companyId)
              : a.referralId
                ? (s.referrals.find((r) => r.id === a.referralId)?.name ?? "-")
                : "-";
          return (
            <div key={a.id} className="px-4 py-3 flex items-start gap-3 text-sm">
              <div className="size-7 rounded-lg bg-muted grid place-items-center shrink-0">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="capitalize">{a.type.replace("_", " ")}</span> - {targetName} - {fmtDate(a.createdAt)}{a.userId ? ` - ${userName(s, a.userId)}` : ""}
                </p>
              </div>
            </div>
          );
        })}
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(sz) => { setPageSizeStr(String(sz)); setPageStr("1"); }}
        />
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
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", state: "", companyId: "", ownerId: "", notes: "", referralCount: 0 });
  useEffect(() => {
    if (c) setF({
      firstName: c.firstName, lastName: c.lastName, email: c.email ?? "", phone: c.phone ?? "",
      jobTitle: c.jobTitle ?? "", state: c.state ?? "", companyId: c.companyId ?? "",
      ownerId: c.ownerId ?? "", notes: c.notes ?? "", referralCount: c.referralCount ?? 0,
    });
  }, [c?.id, open]);
  if (!c) return null;
  const save = () => {
    crm.updateContact(c.id, {
      firstName: f.firstName, lastName: f.lastName, email: f.email || undefined, phone: f.phone || undefined,
      jobTitle: f.jobTitle || undefined, state: f.state || undefined,
      companyId: f.companyId || undefined, ownerId: f.ownerId || undefined, notes: f.notes || undefined,
      referralCount: Math.max(0, Number(f.referralCount) || 0),
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
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Company</Label>
            <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{s.companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Owner</Label>
            <Select value={f.ownerId} onValueChange={(v) => setF({ ...f, ownerId: v })}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Referrals (total)</Label>
            <Input type="number" min={0} value={f.referralCount}
              onChange={(e) => setF({ ...f, referralCount: e.target.value === "" ? 0 : Number(e.target.value) })} />
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
  const [f, setF] = useState({ name: "", companyType: "", city: "", state: "", website: "", mainPhone: "", ownerId: "", relationshipTier: "", notes: "", referralCount: 0, referralsYTD: 0 });
  useEffect(() => {
    if (c) setF({
      name: c.name, companyType: c.companyType ?? "", city: c.city ?? "", state: c.state ?? "",
      website: c.website ?? "", mainPhone: c.mainPhone ?? "", ownerId: c.ownerId ?? "",
      relationshipTier: c.relationshipTier ?? "", notes: c.notes ?? "",
      referralCount: c.referralCount ?? 0, referralsYTD: c.referralsYTD ?? 0,
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
      referralCount: Math.max(0, Number(f.referralCount) || 0),
      referralsYTD: Math.max(0, Number(f.referralsYTD) || 0),
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
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Phone</Label><Input value={f.mainPhone} onChange={(e) => setF({ ...f, mainPhone: e.target.value })} /></div>
          <div><Label className="text-xs">Owner</Label>
            <Select value={f.ownerId} onValueChange={(v) => setF({ ...f, ownerId: v })}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{s.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Tier</Label>
            <Select value={f.relationshipTier} onValueChange={(v) => setF({ ...f, relationshipTier: v })}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{["Tier A", "Tier B", "Tier C"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Referrals (total)</Label>
            <Input type="number" min={0} value={f.referralCount}
              onChange={(e) => setF({ ...f, referralCount: e.target.value === "" ? 0 : Number(e.target.value) })} />
          </div>
          <div><Label className="text-xs">Referrals (YTD)</Label>
            <Input type="number" min={0} value={f.referralsYTD}
              onChange={(e) => setF({ ...f, referralsYTD: e.target.value === "" ? 0 : Number(e.target.value) })} />
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
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>{STATES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Source company</Label>
            <Select value={f.companyId} onValueChange={(v) => setF({ ...f, companyId: v })}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
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
  const [file, setFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState<string>("");
  const [fileNotes, setFileNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const reset = () => { setMessage(""); setFile(null); setFileCategory(""); setFileNotes(""); setTaskTitle(""); setTaskDue(""); setType("note"); };

  const submit = async () => {
    if (type === "task") {
      if (!taskTitle.trim()) { toast({ title: "Task title required" }); return; }
      crm.addTask({ title: taskTitle, type: "Other", contactId, companyId, referralId, dueDate: taskDue || undefined });
    } else if (type === "file_uploaded") {
      if (!file) { toast({ title: "Choose a file first", variant: "destructive" }); return; }
      if (file.size > 20 * 1024 * 1024) { toast({ title: "File too large (max 20MB)", variant: "destructive" }); return; }
      const objectType: Attachment["objectType"] = contactId ? "contact" : companyId ? "company" : referralId ? "referral" : "general";
      const objectId = (contactId ?? companyId ?? referralId ?? "general");
      setUploading(true);
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
      const path = `${objectType}/${objectId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("referral-crm-files")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) {
        setUploading(false);
        toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      crm.addAttachment({
        fileName: file.name,
        fileType: file.type || undefined,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
        objectType,
        objectId,
        category: (fileCategory || "Other") as Attachment["category"],
        notes: fileNotes || undefined,
        storageBucket: "referral-crm-files",
        storagePath: path,
        uploadedByUserId: u.user?.id,
        uploadedByName: u.user?.email ?? undefined,
      });
      setUploading(false);
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
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">File (max 20MB)</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={fileCategory} onValueChange={setFileCategory}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {["Lunch & Learn", "Insurance", "Outreach", "Welcome Packet", "Other"].map((c) =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea rows={2} value={fileNotes} onChange={(e) => setFileNotes(e.target.value)} />
            </div>
          </div>
        ) : (
          <Textarea placeholder={`Log a ${type}...`} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
          <Button onClick={submit} disabled={uploading}>{uploading ? "Uploading..." : "Log"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsersModule() {
  const s = useCrm();
  const canManage = canCrm(s, "manage_users");
  const [editingUser, setEditingUser] = useState<CrmUser | "new" | null>(null);
  const [editingTeam, setEditingTeam] = useState<CrmTeam | "new" | null>(null);

  if (!canManage) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <ShieldCheck className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="font-medium">Restricted</p>
        <p className="text-sm text-muted-foreground">Your role cannot manage users, teams, or permissions.</p>
      </div>
    );
  }

  const [uq, setUq] = useState("");
  const [roleF, setRoleF] = useState<string>("all");
  const [statusF, setStatusF] = useState<string>("all");
  const [stateF, setStateF] = useState<string>("all");
  const filteredUsers = useMemo(() => {
    const needle = uq.trim().toLowerCase();
    return s.users.filter((u) => {
      const active = u.active !== false;
      if (statusF === "active" && !active) return false;
      if (statusF === "inactive" && active) return false;
      if (roleF !== "all" && u.role !== roleF) return false;
      if (stateF !== "all" && !(u.states ?? []).includes(stateF)) return false;
      if (needle && !`${u.name} ${u.email} ${u.mobilePhone ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [s.users, uq, roleF, statusF, stateF]);

  return (
    <div className="space-y-4">
      {/* USERS */}
      <div className="rounded-2xl border bg-card p-5">
        <SectionHeader
          title="Users"
          subtitle="Create, edit, and deactivate Referral CRM users."
          right={<Button size="sm" className="h-8 gap-1.5" onClick={() => setEditingUser("new")}><Plus className="size-3.5" /> New User</Button>}
        />
        <div className="mb-3">
          <TableFilterBar
            search={{ value: uq, onChange: setUq, placeholder: "Search users by name, email, phone..." }}
            filters={[
              { key: "role", label: "Role", value: roleF, onChange: setRoleF, countSource: s.users, countValue: (u) => (u as CrmUser).role, options: [
                { value: "all", label: "All roles" },
                ...CRM_ROLES.map((r) => ({ value: r.id, label: r.label })),
              ] },
              { key: "status", label: "Status", value: statusF, onChange: setStatusF, countSource: s.users, countValue: (u) => ((u as CrmUser).active !== false ? "active" : "inactive"), options: [
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ] },
              { key: "state", label: "State", value: stateF, onChange: setStateF, countSource: s.users, countValue: (u) => (u as CrmUser).states ?? [], options: [
                { value: "all", label: "All states" },
                ...STATES.map((st) => ({ value: st, label: st })),
              ] },
            ]}
            resultCount={filteredUsers.length}
            totalCount={s.users.length}
            onClear={() => { setUq(""); setRoleF("all"); setStatusF("all"); setStateF("all"); }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email / Mobile</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">States</th>
                <th className="text-left py-2">Teams</th>
                <th className="text-left py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground text-xs">No users match the current filters.</td></tr>
              )}
              {filteredUsers.map((u) => {
                const userTeams = s.teams.filter((t) => t.memberIds.includes(u.id));
                return (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2 text-muted-foreground">
                      <p>{u.email}</p>
                      {u.mobilePhone && <p className="text-xs">{u.mobilePhone}</p>}
                    </td>
                    <td className="py-2"><Badge variant="secondary">{u.role.replace(/_/g, " ")}</Badge></td>
                    <td className="py-2 text-xs">{(u.states ?? []).join(", ") || "-"}</td>
                    <td className="py-2 text-xs">{userTeams.map((t) => t.name).join(", ") || "-"}</td>
                    <td className="py-2">
                      <Badge variant={u.active === false ? "outline" : "secondary"}>{u.active === false ? "Inactive" : "Active"}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingUser(u)}><Pencil className="size-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => crm.setUserActive(u.id, u.active === false)}>
                          {u.active === false ? "Reactivate" : "Deactivate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TEAMS */}
      <div className="rounded-2xl border bg-card p-5">
        <SectionHeader
          title="Teams"
          subtitle="Group users by Marketing, Outreach, Intake, State Leadership, or Admin."
          right={<Button size="sm" className="h-8 gap-1.5" onClick={() => setEditingTeam("new")}><Plus className="size-3.5" /> New Team</Button>}
        />
        <div className="grid md:grid-cols-2 gap-3">
          {s.teams.map((t) => {
            const lead = s.users.find((u) => u.id === t.leadId);
            return (
              <div key={t.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.type}{t.states.length ? ` - ${t.states.join(", ")}` : ""}</p>
                  </div>
                  <Badge variant={t.active ? "secondary" : "outline"}>{t.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Lead: {lead?.name ?? "-"}</p>
                <p className="text-xs text-muted-foreground">Members: {t.memberIds.length}</p>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="outline" className="h-7" onClick={() => setEditingTeam(t)}><Pencil className="size-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => crm.setTeamActive(t.id, !t.active)}>
                    {t.active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PERMISSION MATRIX */}
      <div className="rounded-2xl border bg-card p-5 overflow-x-auto">
        <SectionHeader
          title="Permission Matrix"
          subtitle="Toggle to override the default permission for each role. Changes apply immediately."
          right={<Button size="sm" variant="outline" className="h-8" onClick={() => crm.resetPermissions()}>Reset defaults</Button>}
        />
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="text-left py-2">Role</th>
              {CRM_PERMISSIONS.map((p) => <th key={p.id} className="text-center px-2">{p.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {CRM_ROLES.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 font-medium">{r.label}</td>
                {CRM_PERMISSIONS.map((p) => {
                  const on = !!s.permissions[r.id]?.[p.id];
                  return (
                    <td key={p.id} className="text-center px-2">
                      <Checkbox checked={on} onCheckedChange={(v) => crm.setPermission(r.id, p.id, !!v)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />
      <TeamDialog
        team={editingTeam}
        onClose={() => setEditingTeam(null)}
      />
    </div>
  );
}

function UserDialog({ user, onClose }: { user: CrmUser | "new" | null; onClose: () => void }) {
  const s = useCrm();
  const isNew = user === "new";
  const u = isNew ? null : user;
  const [f, setF] = useState({
    firstName: u?.firstName ?? "",
    lastName: u?.lastName ?? "",
    email: u?.email ?? "",
    mobilePhone: u?.mobilePhone ?? "",
    role: (u?.role ?? "read_only") as CrmRole,
    states: (u?.states ?? []) as string[],
    teamIds: (u?.teamIds ?? []) as ID[],
    active: u?.active ?? true,
  });
  useEffect(() => {
    if (!user) return;
    if (isNew) {
      setF({ firstName: "", lastName: "", email: "", mobilePhone: "", role: "read_only", states: [], teamIds: [], active: true });
    } else if (u) {
      setF({
        firstName: u.firstName ?? u.name.split(" ")[0] ?? "",
        lastName: u.lastName ?? u.name.split(" ").slice(1).join(" ") ?? "",
        email: u.email,
        mobilePhone: u.mobilePhone ?? "",
        role: u.role,
        states: u.states ?? (u.state ? [u.state] : []),
        teamIds: u.teamIds ?? s.teams.filter((t) => t.memberIds.includes(u.id)).map((t) => t.id),
        active: u.active ?? true,
      });
    }
  }, [user]); // eslint-disable-line

  if (!user) return null;
  const toggleState = (st: string) =>
    setF((p) => ({ ...p, states: p.states.includes(st) ? p.states.filter((x) => x !== st) : [...p.states, st] }));
  const toggleTeam = (tid: ID) =>
    setF((p) => ({ ...p, teamIds: p.teamIds.includes(tid) ? p.teamIds.filter((x) => x !== tid) : [...p.teamIds, tid] }));

  const submit = () => {
    if (!f.firstName || !f.lastName || !f.email) {
      toast({ title: "First name, last name, email required", variant: "destructive" as never });
      return;
    }
    if (isNew) {
      const created = crm.addUser(f);
      // sync team memberships
      for (const t of s.teams) {
        const has = t.memberIds.includes(created.id);
        const should = f.teamIds.includes(t.id);
        if (has !== should) {
          crm.updateTeam(t.id, {
            memberIds: should ? [...t.memberIds, created.id] : t.memberIds.filter((x) => x !== created.id),
          });
        }
      }
      toast({ title: "User created" });
    } else if (u) {
      crm.updateUser(u.id, f);
      for (const t of s.teams) {
        const has = t.memberIds.includes(u.id);
        const should = f.teamIds.includes(t.id);
        if (has !== should) {
          crm.updateTeam(t.id, {
            memberIds: should ? [...t.memberIds, u.id] : t.memberIds.filter((x) => x !== u.id),
          });
        }
      }
      toast({ title: "User updated" });
    }
    onClose();
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isNew ? "New User" : `Edit ${u?.name}`}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">First name</Label><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
          <div><Label className="text-xs">Last name</Label><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label className="text-xs">Mobile</Label><Input value={f.mobilePhone} onChange={(e) => setF({ ...f, mobilePhone: e.target.value })} /></div>
          <div className="col-span-2">
            <Label className="text-xs">Role</Label>
            <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as CrmRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CRM_ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Assigned states</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STATES.map((st) => (
                <button key={st} type="button" onClick={() => toggleState(st)}
                  className={cn("px-2.5 py-1 rounded-md border text-xs",
                    f.states.includes(st) ? "bg-primary/10 border-primary/30 text-primary" : "text-muted-foreground")}>
                  {st}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Leave empty for all-state access (Admin / Marketing Director).</p>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Teams</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {s.teams.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTeam(t.id)}
                  className={cn("px-2.5 py-1 rounded-md border text-xs",
                    f.teamIds.includes(t.id) ? "bg-primary/10 border-primary/30 text-primary" : "text-muted-foreground")}>
                  {t.name}
                </button>
              ))}
              {s.teams.length === 0 && <span className="text-xs text-muted-foreground">No teams yet.</span>}
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isNew ? "Create user" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamDialog({ team, onClose }: { team: CrmTeam | "new" | null; onClose: () => void }) {
  const s = useCrm();
  const isNew = team === "new";
  const t = isNew ? null : team;
  const [f, setF] = useState({
    name: t?.name ?? "",
    type: (t?.type ?? "Marketing") as TeamType,
    states: (t?.states ?? []) as string[],
    memberIds: (t?.memberIds ?? []) as ID[],
    leadId: t?.leadId ?? "",
    active: t?.active ?? true,
  });
  useEffect(() => {
    if (!team) return;
    if (isNew) setF({ name: "", type: "Marketing", states: [], memberIds: [], leadId: "", active: true });
    else if (t) setF({ name: t.name, type: t.type, states: t.states, memberIds: t.memberIds, leadId: t.leadId ?? "", active: t.active });
  }, [team]); // eslint-disable-line
  if (!team) return null;

  const toggleState = (st: string) =>
    setF((p) => ({ ...p, states: p.states.includes(st) ? p.states.filter((x) => x !== st) : [...p.states, st] }));
  const toggleMember = (uid: ID) =>
    setF((p) => ({ ...p, memberIds: p.memberIds.includes(uid) ? p.memberIds.filter((x) => x !== uid) : [...p.memberIds, uid] }));

  const submit = () => {
    if (!f.name) { toast({ title: "Team name required", variant: "destructive" as never }); return; }
    const payload = { ...f, leadId: f.leadId || undefined };
    if (isNew) { crm.addTeam(payload); toast({ title: "Team created" }); }
    else if (t) { crm.updateTeam(t.id, payload); toast({ title: "Team updated" }); }
    onClose();
  };

  return (
    <Dialog open={!!team} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isNew ? "New Team" : `Edit ${t?.name}`}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Team name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="col-span-2">
            <Label className="text-xs">Type</Label>
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as TeamType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TEAM_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">States covered</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STATES.map((st) => (
                <button key={st} type="button" onClick={() => toggleState(st)}
                  className={cn("px-2.5 py-1 rounded-md border text-xs",
                    f.states.includes(st) ? "bg-primary/10 border-primary/30 text-primary" : "text-muted-foreground")}>{st}</button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Members</Label>
            <div className="mt-1 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {s.users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-muted">
                  <Checkbox checked={f.memberIds.includes(u.id)} onCheckedChange={() => toggleMember(u.id)} />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Team lead</Label>
            <Select value={f.leadId} onValueChange={(v) => setF({ ...f, leadId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick a lead" /></SelectTrigger>
              <SelectContent>{f.memberIds.map((id) => {
                const u = s.users.find((x) => x.id === id);
                if (!u) return null;
                return <SelectItem key={id} value={id}>{u.name}</SelectItem>;
              })}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isNew ? "Create team" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeletedModule() {
  const s = useCrm();
  const c = s.contacts.filter((x) => x.deletedAt);
  const co = s.companies.filter((x) => x.deletedAt);
  const r = s.referrals.filter((x) => x.deletedAt);
  const t = s.tasks.filter((x) => x.deletedAt);
  const archivedFiles = s.attachments.filter((x) => x.archivedAt);
  const deletedCounts = [
    ...c.map(() => ({ type: "contacts" as const })),
    ...co.map(() => ({ type: "companies" as const })),
    ...r.map(() => ({ type: "referrals" as const })),
    ...t.map(() => ({ type: "tasks" as const })),
    ...archivedFiles.map(() => ({ type: "files" as const })),
  ];

  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState<string>("all");
  const needle = q.trim().toLowerCase();
  const matchLabel = (label: string) => !needle || label.toLowerCase().includes(needle);
  const showType = (t: string) => typeF === "all" || typeF === t;

  const fileLabel = (a: Attachment): string => {
    if (a.objectType === "contact") {
      const x = s.contacts.find((y) => y.id === a.objectId); return x ? `Contact: ${fullName(x)}` : `Contact: ${a.objectId}`;
    }
    if (a.objectType === "company") return `Company: ${s.companies.find((y) => y.id === a.objectId)?.name ?? a.objectId}`;
    if (a.objectType === "referral") return `Referral: ${s.referrals.find((y) => y.id === a.objectId)?.name ?? a.objectId}`;
    return a.objectType;
  };

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

  const filteredContacts = c.filter((x) => matchLabel(fullName(x)));
  const filteredCompanies = co.filter((x) => matchLabel(x.name));
  const filteredReferrals = r.filter((x) => matchLabel(x.name));
  const filteredTasks = t.filter((x) => matchLabel(x.title));
  const filteredFiles = archivedFiles.filter((a) => matchLabel(`${a.fileName} ${fileLabel(a)}`));
  const totalMatches =
    (showType("contacts") ? filteredContacts.length : 0) +
    (showType("companies") ? filteredCompanies.length : 0) +
    (showType("referrals") ? filteredReferrals.length : 0) +
    (showType("tasks") ? filteredTasks.length : 0) +
    (showType("files") ? filteredFiles.length : 0);
  const totalAll = c.length + co.length + r.length + t.length + archivedFiles.length;

  return (
    <div className="space-y-4">
      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search deleted items..." }}
        filters={[
          { key: "type", label: "Type", value: typeF, onChange: setTypeF, countSource: deletedCounts, countValue: (x) => (x as { type: string }).type, options: [
            { value: "all", label: "All types" },
            { value: "contacts", label: "Contacts" },
            { value: "companies", label: "Companies" },
            { value: "referrals", label: "Referrals" },
            { value: "tasks", label: "Tasks" },
            { value: "files", label: "Files" },
          ] },
        ]}
        resultCount={totalMatches}
        totalCount={totalAll}
        onClear={() => { setQ(""); setTypeF("all"); }}
      />
      {showType("contacts") && (
        <Section title="Deleted Contacts" items={filteredContacts.map((x) => ({ id: x.id, label: fullName(x), deletedAt: x.deletedAt }))}
          restore={crm.restoreContact} hardDelete={crm.hardDeleteContact} />
      )}
      {showType("companies") && (
        <Section title="Deleted Companies" items={filteredCompanies.map((x) => ({ id: x.id, label: x.name, deletedAt: x.deletedAt }))}
          restore={crm.restoreCompany} hardDelete={crm.hardDeleteCompany} />
      )}
      {showType("referrals") && (
        <Section title="Deleted Referrals" items={filteredReferrals.map((x) => ({ id: x.id, label: x.name, deletedAt: x.deletedAt }))}
          restore={crm.restoreReferral} />
      )}
      {showType("tasks") && (
        <Section title="Deleted Tasks" items={filteredTasks.map((x) => ({ id: x.id, label: x.title, deletedAt: x.deletedAt }))}
          restore={crm.restoreTask} hardDelete={crm.hardDeleteTask} />
      )}
      {showType("files") && (
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Archived Files</h3>
        {filteredFiles.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here.</p> : (
          <div className="divide-y text-sm">
            {filteredFiles.map((a) => (
              <div key={a.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.fileName}</p>
                  <p className="text-xs text-muted-foreground">{fileLabel(a)} - Archived {fmtDate(a.archivedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7" onClick={() => { crm.restoreAttachment(a.id); toast({ title: "File restored" }); }}>
                    <RotateCcw className="size-3 mr-1" /> Restore
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => { crm.removeAttachment(a.id); toast({ title: "File permanently deleted" }); }}>
                    Delete forever
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
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
          <SheetTitle>{contactDisplayName(c)}</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-4 text-sm">
          <div className="text-xs text-muted-foreground">{c.jobTitle || "-"}{c.companyId ? <> - <button className="hover:text-primary" onClick={() => onOpenCompany(c.companyId!)}>{companyName(s, c.companyId)}</button></> : null}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(true)}><Pencil className="size-3 mr-1.5" /> Edit</Button>
            <Button size="sm" className="h-8" onClick={() => setLogging(true)}><Plus className="size-3 mr-1.5" /> Log activity</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">Email</p><p>{c.email || "-"}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{c.phone || "-"}</p></div>
            <div><p className="text-muted-foreground">State</p><p>{c.state || "-"}</p></div>
            <div><p className="text-muted-foreground">Owner</p><p>{userName(s, c.ownerId)}</p></div>
            <div><p className="text-muted-foreground">Referrals</p><p>{c.referralCount}</p></div>
            <div><p className="text-muted-foreground">Last referral</p><p>{fmtDate(c.lastReferralDate)}</p></div>
            <div><p className="text-muted-foreground">Lunch & Learn</p><p>{c.lunchLearnStatus}</p></div>
            <div><p className="text-muted-foreground">Relationship</p><p>{c.relationshipStrength}</p></div>
          </div>
          <div className="flex flex-wrap gap-1">{c.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Add Note</h4>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a quick note..." />
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
                    <button onClick={() => crm.archiveAttachment(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
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
          <div className="text-xs text-muted-foreground">{c.companyType || "-"} - {c.city || ""}{c.city && c.state ? ", " : ""}{c.state || ""}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => setEditing(true)}><Pencil className="size-3 mr-1.5" /> Edit</Button>
            <Button size="sm" className="h-8" onClick={() => setLogging(true)}><Plus className="size-3 mr-1.5" /> Log activity</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-muted-foreground">Website</p><p>{c.website || "-"}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{c.mainPhone || "-"}</p></div>
            <div><p className="text-muted-foreground">Owner</p><p>{userName(s, c.ownerId)}</p></div>
            <div><p className="text-muted-foreground">Tier</p><p>{c.relationshipTier || "-"}</p></div>
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
                    <button onClick={() => crm.archiveAttachment(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3" /></button>
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
                <span className="capitalize">{a.type.replace("_", " ")}</span> - {fmtDate(a.createdAt)}
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
      contactDisplayName(c), c.email, c.phone, c.mobilePhone, c.jobTitle, c.specialty,
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
      a.contactId ? contactDisplayName(s.contacts.find((c) => c.id === a.contactId)) : "",
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
            {total} result{total === 1 ? "" : "s"} for "{q}"
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
              meta={`${c.companyType ?? "-"} - ${c.state ?? "-"} - ${c.referralCount} referrals`}
              detail={[c.mainPhone, c.generalEmail, c.website, c.tags.join(", ")].filter(Boolean).join(" - ")} />
          ))}
        </ResultGroup>
      )}

      {results && results.contacts.length > 0 && (
        <ResultGroup label="Contacts" count={results.contacts.length} icon={Users}>
          {results.contacts.slice(0, 25).map((c) => (
            <ResultRow key={c.id} onClick={() => onOpenContact(c.id)}
              title={contactDisplayName(c)}
              meta={`${c.jobTitle ?? "-"} - ${companyName(s, c.companyId)} - ${c.state ?? "-"}`}
              detail={[c.email, c.phone, c.referralSourceType, c.tags.join(", ")].filter(Boolean).join(" - ")} />
          ))}
        </ResultGroup>
      )}

      {results && results.referrals.length > 0 && (
        <ResultGroup label="Referrals" count={results.referrals.length} icon={HeartHandshake}
          onJump={() => onJumpModule("referrals")}>
          {results.referrals.slice(0, 25).map((r) => (
            <ResultRow key={r.id}
              onClick={() => r.contactId ? onOpenContact(r.contactId) : r.companyId && onOpenCompany(r.companyId)}
              title={r.name}
              meta={`${r.contactId ? contactDisplayName(s.contacts.find((c) => c.id === r.contactId)) : companyName(s, r.companyId)} - ${r.state ?? "-"} - ${r.referralStatus}`}
              detail={`${fmtDate(r.referralDate)}${r.serviceType ? ` - ${r.serviceType}` : ""}${r.insuranceType ? ` - ${r.insuranceType}` : ""}`} />
          ))}
        </ResultGroup>
      )}

      {results && results.tasks.length > 0 && (
        <ResultGroup label="Tasks" count={results.tasks.length} icon={ListChecks}
          onJump={() => onJumpModule("tasks")}>
          {results.tasks.slice(0, 25).map((t) => (
            <ResultRow key={t.id}
              onClick={() => t.contactId ? onOpenContact(t.contactId) : t.companyId && onOpenCompany(t.companyId)}
              title={t.title}
              meta={`${t.type} - ${t.status} - ${userName(s, t.assignedUserId)}`}
              detail={`${t.dueDate ? `due ${fmtDate(t.dueDate)}` : "no due date"}${t.companyId ? ` - ${companyName(s, t.companyId)}` : ""}`} />
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
              onClick={() => a.contactId ? onOpenContact(a.contactId) : a.companyId && onOpenCompany(a.companyId)}
                title={a.message}
                meta={`${a.type.replace("_", " ")} - ${fmtDate(a.createdAt)}`}
                detail={[ct ? contactDisplayName(ct) : "", companyName(s, a.companyId)].filter((x) => x && x !== "-").join(" - ")} />
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
// Patient Pipeline - dashboard of every referred patient
// ===========================================================
function PatientPipelineModule({
  onOpenContact, onOpenCompany,
}: { onOpenContact: (id: ID) => void; onOpenCompany: (id: ID) => void }) {
  const s = useCrm();
  const allReferrals = scopedReferrals(s);

  const [q, setQ] = useUrlState("ppq", "", { history: "replace" });
  const [statusFilter, setStatusFilter] = useUrlState("pps", "all");
  const [stateFilter, setStateFilter] = useUrlState("ppst", "all");
  const [intakeFilter, setIntakeFilter] = useUrlState("ppi", "all");
  const [insFilter, setInsFilter] = useUrlState("ppins", "all");
  const [pageStr, setPageStr] = useUrlState("pppg", "1");
  const [pageSizeStr, setPageSizeStr] = useUrlState("ppps", "25");
  const page = Math.max(1, Number(pageStr) || 1);
  const pageSize = Math.max(1, Number(pageSizeStr) || 25);

  const rows = useMemo(() => {
    let r = scopedReferrals(s);
    if (statusFilter !== "all") r = r.filter((x) => x.referralStatus === statusFilter);
    if (stateFilter !== "all") r = r.filter((x) => x.state === stateFilter);
    if (intakeFilter !== "all") r = r.filter((x) => (x.intakeStatus || "") === intakeFilter);
    if (insFilter !== "all") r = r.filter((x) => (x.insuranceType || "") === insFilter);
    if (q) {
      const ql = q.toLowerCase();
      r = r.filter((x) =>
        patientDisplayName(x).toLowerCase().includes(ql) ||
        (x.contactId ? (s.contacts.find((c) => c.id === x.contactId) ?? { firstName: "", lastName: "" }) : { firstName: "", lastName: "" }) &&
        `${x.name} ${companyName(s, x.companyId)}`.toLowerCase().includes(ql)
      );
    }
    return [...r].sort((a, b) => (b.referralDate || "").localeCompare(a.referralDate || ""));
  }, [s, q, statusFilter, stateFilter, intakeFilter, insFilter]);
  useEffect(() => { setPageStr("1"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, statusFilter, stateFilter, intakeFilter, insFilter]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of scopedReferrals(s)) map[r.referralStatus] = (map[r.referralStatus] ?? 0) + 1;
    return map;
  }, [s]);

  const STATUSES: Referral["referralStatus"][] = ["New", "In Review", "Intake Form Sent", "Scheduled", "Active", "Closed", "Lost"];
  const intakeStatuses = useMemo(() => Array.from(new Set(scopedReferrals(s).map((r) => r.intakeStatus as string).filter((x) => !!x))).sort(), [s]);
  const insTypes = useMemo(() => Array.from(new Set(scopedReferrals(s).map((r) => r.insuranceType as string).filter((x) => !!x))).sort(), [s]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Patient Pipeline"
        subtitle="Every referred patient across the CRM - their pipeline status, source, and (soon) revenue."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
            className={cn(
              "rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40",
              statusFilter === st && "border-primary/40 bg-primary/5",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{st}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{byStatus[st] ?? 0}</p>
          </button>
        ))}
      </div>

      <TableFilterBar
        search={{ value: q, onChange: setQ, placeholder: "Search patient, company..." }}
        filters={[
          { key: "pps", label: "Status", value: statusFilter, onChange: setStatusFilter, countSource: allReferrals, countValue: (r) => (r as Referral).referralStatus || "", options: [{ value: "all", label: "All statuses" }, ...STATUSES.map((v) => ({ value: v, label: v }))], width: 170 },
          { key: "ppst", label: "State", value: stateFilter, onChange: setStateFilter, countSource: allReferrals, countValue: (r) => (r as Referral).state || "", options: [{ value: "all", label: "All states" }, ...STATES.map((v) => ({ value: v, label: v }))] },
          { key: "ppi", label: "Intake", value: intakeFilter, onChange: setIntakeFilter, countSource: allReferrals, countValue: (r) => (r as Referral).intakeStatus || "", options: [{ value: "all", label: "All" }, ...intakeStatuses.map((v) => ({ value: v, label: v }))], width: 160 },
          { key: "ppins", label: "Insurance", value: insFilter, onChange: setInsFilter, countSource: allReferrals, countValue: (r) => (r as Referral).insuranceType || "", options: [{ value: "all", label: "All" }, ...insTypes.map((v) => ({ value: v, label: v }))], width: 160 },
        ]}
        resultCount={rows.length}
        totalCount={allReferrals.length}
        onClear={() => { setQ(""); setStatusFilter("all"); setStateFilter("all"); setIntakeFilter("all"); setInsFilter("all"); }}
      />

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Patient</th>
                <th className="px-3 py-2 text-left font-medium">Referring Contact</th>
                <th className="px-3 py-2 text-left font-medium">Company</th>
                <th className="px-3 py-2 text-left font-medium">State</th>
                <th className="px-3 py-2 text-left font-medium">Pipeline Status</th>
                <th className="px-3 py-2 text-left font-medium">Intake Status</th>
                <th className="px-3 py-2 text-left font-medium">Referred</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => {
                const contact = r.contactId ? s.contacts.find((c) => c.id === r.contactId) : undefined;
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{patientDisplayName(r)}</td>
                    <td className="px-3 py-2">
                      {contact ? (
                        <button className="hover:text-primary" onClick={() => onOpenContact(contact.id)}>{contactDisplayName(contact)}</button>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2">
                      {r.companyId ? (
                        <button className="hover:text-primary" onClick={() => onOpenCompany(r.companyId!)}>{companyName(s, r.companyId)}</button>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2">{r.state || "-"}</td>
                    <td className="px-3 py-2">
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", referralStatusTone(r.referralStatus))}>
                        {r.referralStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.intakeStatus || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.referralDate)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground tabular-nums" title="Revenue reporting not yet wired">-</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-10">No referred patients match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalRows={rows.length}
          onPageChange={(p) => setPageStr(String(p))}
          onPageSizeChange={(sz) => { setPageSizeStr(String(sz)); setPageStr("1"); }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Revenue per patient will populate automatically once CentralReach billing sync is wired in.
      </p>
    </div>
  );
}

// ===========================================================
// Page shell with internal nav
// ===========================================================
export default function ReferralCRM() {
  const s = useCrm();
  const me = currentUser(s);
  const { isAdmin, loading: authLoading } = useAuth();
  const [moduleRaw, setModuleRaw] = useUrlState("m", "dashboard");
  const module = moduleRaw as ModuleId;
  const setModule = (id: ModuleId) => setModuleRaw(id);
  const [contactIdRaw, setContactIdRaw] = useUrlState("c", "");
  const [companyIdRaw, setCompanyIdRaw] = useUrlState("co", "");
  const contactId: ID | null = contactIdRaw || null;
  const companyId: ID | null = companyIdRaw || null;
  const setContactId = (id: ID | null) => setContactIdRaw(id ?? "");
  const setCompanyId = (id: ID | null) => setCompanyIdRaw(id ?? "");
  const [backendMissing, setBackendMissing] = useState<string[]>([]);

  // Bridge: hydrate Supabase referral data into the CRM store and install
  // write-through sync so creates/edits land in referral_contacts /
  // referral_companies / referral_activities. Runs once on mount.
  useEffect(() => {
    installSupabaseSync();
    hydrateFromSupabase().then((res) => {
      setBackendMissing(res.missing ?? []);
    }).catch((e) => {
      console.warn("[ReferralCRM] hydrate failed", e);
      toast({
        title: "Could not load referral data",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    });
  }, []);

  const moduleAllowed = (id: ModuleId): boolean => {
    if (!canCrm(s, "view")) return id === "dashboard";
    if (id === "users") return canCrm(s, "manage_users");
    if (id === "imports") return canCrm(s, "import");
    if (id === "exports") return canCrm(s, "export");
    if (id === "workflows") return canCrm(s, "manage_workflows");
    if (id === "lists") return canCrm(s, "manage_lists");
    if (id === "deleted" || id === "duplicates") return canCrm(s, "delete");
    return true;
  };
  const visibleModules = MODULES.filter((m) => moduleAllowed(m.id));
  const activeModule: ModuleId = moduleAllowed(module) ? module : "dashboard";

  const body = (() => {
    switch (activeModule) {
      case "dashboard": return <DashboardModule />;
      case "contacts": return <ContactsModule onOpenContact={setContactId} onOpenCompany={setCompanyId} />;
      case "companies": return <CompaniesModule onOpen={setCompanyId} />;
      case "referrals": return <ReferralsModule onOpenContact={setContactId} />;
      case "patient-pipeline": return <PatientPipelineModule onOpenContact={setContactId} onOpenCompany={setCompanyId} />;
      case "tasks": return <TasksModule onOpenContact={setContactId} />;
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
      actions={<CopyShareLinkButton />}
    >
      {backendMissing.length > 0 && (
        <div className="mb-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          <span className="font-medium">Heads up:</span> the following backend tables are unavailable or blocked by access rules - {backendMissing.join(", ")}. Contacts, companies, and imports loaded normally, but those modules will show empty until access is restored.
        </div>
      )}
      {/* Impersonation switcher - Super Admin only. */}
      {!authLoading && isAdmin && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Acting as:</span>
          <Select value={s.currentUserId} onValueChange={(v) => crm.setCurrentUser(v)}>
            <SelectTrigger className="h-7 w-[260px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {s.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} - {u.role.replace(/_/g, " ")}{u.states?.length ? ` - ${u.states.join(",")}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {me && (
            <Badge variant="outline" className="ml-auto">
              {me.role.replace(/_/g, " ")}{me.states?.length ? ` - ${me.states.join(", ")}` : " - all states"}
            </Badge>
          )}
        </div>
      )}

      {/* mobile / tablet: horizontal scroll tab bar */}
      <div className="lg:hidden -mx-1 mb-4 overflow-x-auto">
        <div className="flex gap-1 px-1 min-w-max">
          {visibleModules.map((m) => {
            const Icon = m.icon;
            const active = activeModule === m.id;
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
            {visibleModules.map((m) => {
              const Icon = m.icon;
              const active = activeModule === m.id;
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