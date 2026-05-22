import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Handshake,
  Inbox,
  ListChecks,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Table2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shared/PageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  recruitingCandidates,
  recruitingInterviewers,
  recruitingRecruiters,
  recruitingRoles,
  recruitingSources,
  recruitingStages,
  recruitingStates,
  staffingDemandByRegion,
  toStaffingRbtProfile,
  type CandidateStage,
  type InterviewStatus,
  type OfferStatus,
  type OnboardingStatus,
  type ReadinessStatus,
  type RecruitingCandidate,
  type RecruitingRole,
  type RecruitingSource,
  type RecruitingState,
} from "@/data/recruitingDashboard";

type ViewMode = "queue" | "table" | "pipeline" | "interview" | "offer" | "handoff" | "readiness";
type PanelTab = "Overview" | "Application" | "Screening" | "Interview" | "Offer" | "Onboarding" | "Staffing Readiness" | "Documents" | "Tasks" | "Timeline";
type SortKey = keyof Pick<RecruitingCandidate, "name" | "role" | "state" | "region" | "recruiter" | "candidateStatus" | "daysInStage">;

type Filters = {
  state: "All" | RecruitingState;
  role: "All" | RecruitingRole;
  recruiter: "All" | string;
  source: "All" | RecruitingSource;
  candidateStatus: "All" | CandidateStage;
  interviewStatus: "All" | InterviewStatus;
  offerStatus: "All" | OfferStatus;
  onboardingStatus: "All" | OnboardingStatus;
  readinessStatus: "All" | ReadinessStatus;
  dateApplied: "All" | "Last 7 days" | "Older than 14 days";
};

const viewModes: { id: ViewMode; label: string; icon: typeof Inbox }[] = [
  { id: "queue", label: "Queue View", icon: Inbox },
  { id: "table", label: "Table View", icon: Table2 },
  { id: "pipeline", label: "Pipeline View", icon: MoreHorizontal },
  { id: "interview", label: "Interview View", icon: CalendarClock },
  { id: "offer", label: "Offer View", icon: Handshake },
  { id: "handoff", label: "Onboarding Handoff", icon: ListChecks },
  { id: "readiness", label: "Staffing Readiness View", icon: UserCheck },
];

const panelTabs: PanelTab[] = ["Overview", "Application", "Screening", "Interview", "Offer", "Onboarding", "Staffing Readiness", "Documents", "Tasks", "Timeline"];
const interviewStatuses: InterviewStatus[] = ["Not Scheduled", "Scheduled", "Today", "Completed", "Needs Outcome", "No-Show"];
const offerStatuses: OfferStatus[] = ["Not Sent", "Sent", "Unsigned", "Accepted", "Declined"];
const onboardingStatuses: OnboardingStatus[] = ["Not Started", "Handoff Needed", "Viventium Sent", "Background Pending", "Orientation Scheduled", "Training Assigned", "Complete"];
const readinessStatuses: ReadinessStatus[] = ["Not Ready", "Onboarding", "Ready This Week", "Ready for Staffing", "Blocked"];

const initialFilters: Filters = {
  state: "All",
  role: "All",
  recruiter: "All",
  source: "All",
  candidateStatus: "All",
  interviewStatus: "All",
  offerStatus: "All",
  onboardingStatus: "All",
  readinessStatus: "All",
  dateApplied: "All",
};

const variantFor = (status: string): "default" | "success" | "warning" | "destructive" | "info" | "muted" => {
  if (["Ready for Staffing", "Accepted", "Complete", "Clear", "Active", "Verified", "Eligible", "Pass"].includes(status)) return "success";
  if (["Blocked", "No-Show", "Not Qualified", "Declined", "Fail", "Delayed", "Not Eligible"].includes(status)) return "destructive";
  if (["Unsigned", "Needs Outcome", "Pending", "Handoff Needed", "Background Pending", "Incomplete", "Missing"].includes(status)) return "warning";
  if (["Interview Scheduled", "Scheduled", "Today", "Offer Sent", "Sent", "Ready This Week", "Onboarding"].includes(status)) return "info";
  if (["Not Started", "Not Scheduled", "Not Sent", "Needed", "Not Assigned"].includes(status)) return "muted";
  return "default";
};

const readinessPercent = (c: RecruitingCandidate) => {
  const checks = [c.viventium !== "Not Started", c.backgroundCheck === "Clear", c.orientation === "Complete", c.training === "Complete", c.i9 === "Complete", c.everify === "Complete", c.centralReach === "Active"];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const dynamicAlerts = (c: RecruitingCandidate) => {
  const alerts = new Set(c.blockers);
  if (c.candidateStatus === "New Applicant" && c.daysInStage >= 1) alerts.add("New applicant not screened within 24 hours");
  if (c.interviewStatus === "Today") alerts.add("Interview today");
  if (c.interviewStatus === "No-Show") alerts.add("Interview no-show");
  if (c.interviewStatus === "Needs Outcome") alerts.add("Interview completed but no outcome");
  if ((c.offerStatus === "Unsigned" || c.offerStatus === "Sent") && c.daysInStage >= 2) alerts.add("Offer unsigned after 48 hours");
  if (c.candidateStatus === "Onboarding Handoff" && c.viventium === "Not Started") alerts.add("Viventium transition missing");
  if (["Pending", "Delayed"].includes(c.backgroundCheck) && c.daysInStage >= 5) alerts.add("Background check pending too long");
  if (["Offer Accepted", "Onboarding Handoff", "Background Check"].includes(c.candidateStatus) && c.orientation === "Not Scheduled") alerts.add("Orientation not scheduled");
  if (["Assigned", "Incomplete"].includes(c.training)) alerts.add("Training incomplete");
  if (c.i9 !== "Complete" || c.everify !== "Complete") alerts.add("I-9 / E-Verify incomplete");
  if (c.centralReach !== "Active" && readinessPercent(c) >= 70) alerts.add("CentralReach account missing");
  if (c.readinessStatus === "Ready for Staffing" && c.nextAction.toLowerCase().includes("notify")) alerts.add("Candidate ready but not sent to staffing");
  if (staffingDemandByRegion[`${c.state}-${c.region}`]?.priorityRole === c.role) alerts.add(`${c.role} shortage in state/region`);
  if (c.daysInStage > 10) alerts.add("Candidate stuck in stage too long");
  return Array.from(alerts);
};

const addTimeline = (c: RecruitingCandidate, title: string, detail: string, actor = "Recruiting OS", type: RecruitingCandidate["timeline"][number]["type"] = "system") => ({
  ...c,
  timeline: [{ id: `${c.id}-tl-${Date.now()}`, date: "Today", title, detail, actor, type }, ...c.timeline],
});

const nextStageFromScreen = (c: RecruitingCandidate): Partial<RecruitingCandidate> => {
  if (c.certification === "Verified" || c.certification === "Pending" || c.role === "BCBA") return { candidateStatus: "Interview Scheduled", interviewStatus: "Scheduled", nextAction: "Confirm interview time", screeningOutcome: "Pass", eligibility: "Eligible" };
  if (c.kidsExperience !== "Entry") return { candidateStatus: "Screening", nextAction: "Send 40-hour training link", screeningOutcome: "Pass", eligibility: "Eligible", training: "Assigned" };
  return { candidateStatus: "Not Qualified", readinessStatus: "Blocked", nextAction: "Archive candidate", screeningOutcome: "Fail", eligibility: "Not Eligible", notQualifiedReason: "No certification or relevant child experience" };
};

const queueSections = [
  { title: "Urgent Now", desc: "Aging applicants, no outcomes, unsigned offers, handoff blockers, and high-demand regions", match: (c: RecruitingCandidate) => dynamicAlerts(c).length > 0 },
  { title: "Needs Screening", desc: "New and screening candidates that need recruiter review", match: (c: RecruitingCandidate) => ["New Applicant", "Screening"].includes(c.candidateStatus) },
  { title: "Interviews", desc: "Scheduled, today, no-show, and outcome-needed interviews", match: (c: RecruitingCandidate) => ["Scheduled", "Today", "Needs Outcome", "No-Show"].includes(c.interviewStatus) },
  { title: "Offers", desc: "Ready for offer, offer sent, unsigned, accepted, and declined", match: (c: RecruitingCandidate) => ["Offer Sent", "Interview Completed", "Offer Accepted"].includes(c.candidateStatus) || c.offerStatus !== "Not Sent" },
  { title: "Onboarding Handoff", desc: "Accepted offers moving into Viventium, background, orientation, and training", match: (c: RecruitingCandidate) => ["Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training"].includes(c.candidateStatus) },
  { title: "Ready for Staffing", desc: "Candidates ready or nearly ready for staffing action", match: (c: RecruitingCandidate) => ["Ready for Staffing", "Ready This Week"].includes(c.readinessStatus) },
];

export default function Recruiting() {
  const [candidates, setCandidates] = useState<RecruitingCandidate[]>(recruitingCandidates);
  const [viewMode, setViewMode] = useState<ViewMode>("queue");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [search, setSearch] = useState("");
  const [activeKpi, setActiveKpi] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("Overview");
  const [sortKey, setSortKey] = useState<SortKey>("daysInStage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [syncing, setSyncing] = useState(false);
  const [createdProfiles, setCreatedProfiles] = useState<ReturnType<typeof toStaffingRbtProfile>[]>([]);

  const activeCandidate = candidates.find((c) => c.id === activeCandidateId) ?? null;

  const filteredCandidates = useMemo(() => candidates.filter((c) => {
    const q = search.toLowerCase().trim();
    if (q && ![c.name, c.role, c.state, c.region, c.source, c.recruiter, c.nextAction].some((v) => String(v).toLowerCase().includes(q))) return false;
    if (filters.state !== "All" && c.state !== filters.state) return false;
    if (filters.role !== "All" && c.role !== filters.role) return false;
    if (filters.recruiter !== "All" && c.recruiter !== filters.recruiter) return false;
    if (filters.source !== "All" && c.source !== filters.source) return false;
    if (filters.candidateStatus !== "All" && c.candidateStatus !== filters.candidateStatus) return false;
    if (filters.interviewStatus !== "All" && c.interviewStatus !== filters.interviewStatus) return false;
    if (filters.offerStatus !== "All" && c.offerStatus !== filters.offerStatus) return false;
    if (filters.onboardingStatus !== "All" && c.onboardingStatus !== filters.onboardingStatus) return false;
    if (filters.readinessStatus !== "All" && c.readinessStatus !== filters.readinessStatus) return false;
    if (filters.dateApplied === "Last 7 days" && new Date(c.appliedDate) < new Date("2026-04-21")) return false;
    if (filters.dateApplied === "Older than 14 days" && new Date(c.appliedDate) >= new Date("2026-04-14")) return false;
    if (activeKpi === "new" && c.candidateStatus !== "New Applicant") return false;
    if (activeKpi === "screening" && !["New Applicant", "Screening"].includes(c.candidateStatus)) return false;
    if (activeKpi === "interviews" && !["Scheduled", "Today"].includes(c.interviewStatus)) return false;
    if (activeKpi === "offersSent" && !["Sent", "Unsigned"].includes(c.offerStatus)) return false;
    if (activeKpi === "offersAccepted" && c.offerStatus !== "Accepted") return false;
    if (activeKpi === "handoff" && !["Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training"].includes(c.candidateStatus)) return false;
    if (activeKpi === "ready" && c.readinessStatus !== "Ready for Staffing") return false;
    if (activeKpi === "bottlenecks" && dynamicAlerts(c).length === 0) return false;
    return true;
  }), [activeKpi, candidates, filters, search]);

  const sortedRows = useMemo(() => [...filteredCandidates].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? result : -result;
  }), [filteredCandidates, sortDir, sortKey]);

  const kpis = [
    { id: "new", label: "New Applicants", value: candidates.filter((c) => c.candidateStatus === "New Applicant").length, icon: Inbox },
    { id: "screening", label: "Needs Screening", value: candidates.filter((c) => ["New Applicant", "Screening"].includes(c.candidateStatus)).length, icon: Search },
    { id: "interviews", label: "Interviews Scheduled", value: candidates.filter((c) => ["Scheduled", "Today"].includes(c.interviewStatus)).length, icon: CalendarClock },
    { id: "offersSent", label: "Offers Sent", value: candidates.filter((c) => ["Sent", "Unsigned"].includes(c.offerStatus)).length, icon: Send },
    { id: "offersAccepted", label: "Offers Accepted", value: candidates.filter((c) => c.offerStatus === "Accepted").length, icon: CheckCircle2 },
    { id: "handoff", label: "Onboarding Handoff", value: candidates.filter((c) => ["Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training"].includes(c.candidateStatus)).length, icon: ListChecks },
    { id: "ready", label: "Ready for Staffing", value: candidates.filter((c) => c.readinessStatus === "Ready for Staffing").length + createdProfiles.length, icon: UserCheck },
    { id: "bottlenecks", label: "Bottlenecks", value: candidates.filter((c) => dynamicAlerts(c).length > 0).length, icon: AlertCircle },
  ];

  const updateCandidate = (id: string, patch: Partial<RecruitingCandidate>, message?: string) => {
    setCandidates((current) => current.map((candidate) => candidate.id === id ? addTimeline({ ...candidate, ...patch }, message ?? "Candidate updated", `Updated ${Object.keys(patch).join(", ")}.`) : candidate));
    if (message) toast.success(message);
  };

  const runAction = (id: string, action: string) => {
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return;
    if (action === "screen") {
      const patch = nextStageFromScreen(candidate);
      updateCandidate(id, patch, patch.candidateStatus === "Not Qualified" ? "Candidate moved to Not Qualified" : patch.training === "Assigned" ? "40-hour training link queued" : "Candidate screened");
    }
    if (action === "schedule") {
      if (candidate.role === "RBT" && candidate.certification === "Missing" && candidate.kidsExperience === "Entry") return toast.error("Schedule blocked", { description: "RBT candidate needs certification or relevant child experience before interview." });
      updateCandidate(id, { candidateStatus: "Interview Scheduled", interviewStatus: "Scheduled", interviewAt: "2026-04-29T10:30:00", nextAction: "Send interview reminder" }, "Interview scheduled");
    }
    if (action === "completeInterview") updateCandidate(id, { candidateStatus: "Interview Completed", interviewStatus: "Needs Outcome", nextAction: "Enter interview outcome" }, "Interview marked complete");
    if (action === "goodOutcome") updateCandidate(id, { interviewStatus: "Completed", candidateStatus: "Interview Completed", nextAction: "Send offer letter" }, "Positive outcome recorded");
    if (action === "badOutcome") updateCandidate(id, { candidateStatus: "Not Qualified", readinessStatus: "Blocked", interviewStatus: "Completed", nextAction: "Archive candidate", notQualifiedReason: "Interview outcome did not meet role requirements" }, "Candidate dispositioned");
    if (action === "sendOffer") updateCandidate(id, { candidateStatus: "Offer Sent", offerStatus: "Sent", offerSentAt: "Today", nextAction: "Follow up on offer in 48 hours", tasks: [{ id: `${id}-offer-follow-${Date.now()}`, title: "Follow up on unsigned offer", owner: candidate.recruiter, due: "48 hours", completed: false }, ...candidate.tasks] }, "Offer sent");
    if (action === "signed") updateCandidate(id, { candidateStatus: "Offer Accepted", offerStatus: "Accepted", onboardingStatus: "Handoff Needed", readinessStatus: "Onboarding", nextAction: "Move to onboarding handoff" }, "Offer marked signed");
    if (action === "declined") updateCandidate(id, { offerStatus: "Declined", readinessStatus: "Blocked", candidateStatus: "Not Qualified", nextAction: "Capture decline reason" }, "Offer declined");
    if (action === "onboarding") updateCandidate(id, { candidateStatus: "Onboarding Handoff", onboardingStatus: "Viventium Sent", viventium: "Sent", nextAction: "Monitor Viventium completion" }, "Moved to onboarding");
    if (action === "noShow") updateCandidate(id, { interviewStatus: "No-Show", noShow: true, readinessStatus: "Blocked", nextAction: "Reschedule or disposition", tasks: [{ id: `${id}-noshow-${Date.now()}`, title: "Reschedule no-show candidate", owner: candidate.recruiter, due: "Today", completed: false }, ...candidate.tasks] }, "No-show task created");
    if (action === "reminder") updateCandidate(id, { nextAction: "Reminder sent; monitor attendance" }, "Reminder sent");
    if (action === "notify") updateCandidate(id, { nextAction: "Staffing notified", tasks: [{ id: `${id}-staffing-${Date.now()}`, title: "Review candidate for assignment", owner: "Staffing Ops", due: "Today", completed: false }, ...candidate.tasks] }, "Staffing owner notified");
    if (action === "ready") markReady(candidate);
  };

  const markReady = (candidate: RecruitingCandidate) => {
    const ready = candidate.backgroundCheck === "Clear" && candidate.orientation === "Complete" && candidate.training === "Complete" && candidate.i9 === "Complete" && candidate.everify === "Complete" && candidate.centralReach === "Active";
    if (!ready) return toast.error("Readiness blocked", { description: "Background, orientation, training, I-9/E-Verify, and CentralReach must be complete." });
    const profile = toStaffingRbtProfile(candidate);
    setCreatedProfiles((current) => current.some((p) => p.id === profile.id) ? current : [profile, ...current]);
    updateCandidate(candidate.id, { candidateStatus: "Ready for Staffing", readinessStatus: "Ready for Staffing", onboardingStatus: "Complete", nextAction: "Staffing notified", tasks: candidate.tasks.map((t) => t.title.includes("Staffing") ? { ...t, completed: true } : t) }, "Ready for Staffing");
    toast.success("Staffing profile updated", { description: `${candidate.name} is now available in the connected Staffing demo supply.` });
  };

  const bulkUpdate = (field: "recruiter" | "candidateStatus", value: string) => {
    if (selectedIds.length === 0) return toast.error("Select candidates first");
    setCandidates((current) => current.map((c) => selectedIds.includes(c.id) ? addTimeline({ ...c, [field]: value, daysInStage: field === "candidateStatus" ? 0 : c.daysInStage }, "Bulk update", `${field} changed to ${value}.`) : c));
    toast.success("Bulk update complete", { description: `${selectedIds.length} candidate records updated.` });
    setSelectedIds([]);
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const openCandidate = (id: string, tab: PanelTab = "Overview") => { setActiveCandidateId(id); setPanelTab(tab); };

  return (
    <PageShell
      title="Recruiting"
      description="Manage applicants, interviews, offers, onboarding handoff, and staffing readiness."
      icon={Briefcase}
      actions={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button size="sm" onClick={() => toast.success("New candidate shell created", { description: "New applicants start in New Applicant status." })}><Plus className="h-4 w-4 mr-1.5" />New Candidate</Button>
          <Button size="sm" variant="outline" onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 900); toast.info("Apploi sync queued"); }}><RefreshCw className={cn("h-4 w-4 mr-1.5", syncing && "animate-spin")} />Import from Apploi</Button>
          <Button size="sm" variant="outline" onClick={() => toast.info("Select rows in Queue or Table to bulk edit.")}><Users className="h-4 w-4 mr-1.5" />Bulk Actions</Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("Export prepared") }><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" variant="outline" onClick={() => setActiveKpi("all")}><Filter className="h-4 w-4 mr-1.5" />Saved Views</Button>
          <Button size="sm" variant="outline" onClick={() => setViewMode("interview")}><CalendarClock className="h-4 w-4 mr-1.5" />Interview Calendar</Button>
          <Button size="sm" variant="outline" onClick={() => toast.info("Apploi sync is simulated for demo operations.")}><ExternalLink className="h-4 w-4 mr-1.5" />Apploi Sync</Button>
        </div>
      }
    >
      <div className="grid grid-cols-8 gap-2">
        {kpis.map((kpi) => (
          <button key={kpi.id} onClick={() => setActiveKpi(activeKpi === kpi.id ? "all" : kpi.id)} className={cn("text-left rounded-lg border bg-card p-3 transition-all hover:border-primary/40", activeKpi === kpi.id ? "border-primary shadow-sm" : "border-border/60")}>
            <div className="flex items-center justify-between gap-2">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-xl font-semibold text-foreground tabular-nums">{kpi.value}</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground leading-tight">{kpi.label}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate, region, recruiter, status, or next action..." className="pl-9 h-9" />
          </div>
          {viewModes.map((mode) => (
            <Button key={mode.id} size="sm" variant={viewMode === mode.id ? "default" : "outline"} onClick={() => setViewMode(mode.id)} className="h-9">
              <mode.icon className="h-4 w-4 mr-1.5" />{mode.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-9 gap-2">
          <Select label="State" value={filters.state} onChange={(v) => updateFilter("state", v as Filters["state"])} options={["All", ...recruitingStates]} />
          <Select label="Role" value={filters.role} onChange={(v) => updateFilter("role", v as Filters["role"])} options={["All", ...recruitingRoles]} />
          <Select label="Recruiter" value={filters.recruiter} onChange={(v) => updateFilter("recruiter", v)} options={["All", ...recruitingRecruiters]} />
          <Select label="Source" value={filters.source} onChange={(v) => updateFilter("source", v as Filters["source"])} options={["All", ...recruitingSources]} />
          <Select label="Candidate Status" value={filters.candidateStatus} onChange={(v) => updateFilter("candidateStatus", v as Filters["candidateStatus"])} options={["All", ...recruitingStages]} />
          <Select label="Interview Status" value={filters.interviewStatus} onChange={(v) => updateFilter("interviewStatus", v as Filters["interviewStatus"])} options={["All", ...interviewStatuses]} />
          <Select label="Offer Status" value={filters.offerStatus} onChange={(v) => updateFilter("offerStatus", v as Filters["offerStatus"])} options={["All", ...offerStatuses]} />
          <Select label="Onboarding Status" value={filters.onboardingStatus} onChange={(v) => updateFilter("onboardingStatus", v as Filters["onboardingStatus"])} options={["All", ...onboardingStatuses]} />
          <Select label="Staffing Readiness" value={filters.readinessStatus} onChange={(v) => updateFilter("readinessStatus", v as Filters["readinessStatus"])} options={["All", ...readinessStatuses]} />
        </div>
      </div>

      {(viewMode === "queue" || viewMode === "table") && selectedIds.length > 0 && (
        <div className="sticky top-2 z-20 flex items-center gap-2 rounded-lg border border-primary/30 bg-card p-2 shadow-sm">
          <span className="px-2 text-sm font-medium text-foreground">{selectedIds.length} selected</span>
          <Select value="" onChange={(v) => bulkUpdate("recruiter", v)} options={["", ...recruitingRecruiters]} placeholder="Assign recruiter" />
          <Select value="" onChange={(v) => bulkUpdate("candidateStatus", v)} options={["", ...recruitingStages]} placeholder="Update status" />
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      {viewMode === "queue" && <QueueView candidates={filteredCandidates} selectedIds={selectedIds} setSelectedIds={setSelectedIds} openCandidate={openCandidate} runAction={runAction} />}
      {viewMode === "table" && <TableView rows={sortedRows} selectedIds={selectedIds} setSelectedIds={setSelectedIds} openCandidate={openCandidate} runAction={runAction} updateCandidate={updateCandidate} sortKey={sortKey} sortDir={sortDir} setSortKey={setSortKey} setSortDir={setSortDir} />}
      {viewMode === "pipeline" && <PipelineView candidates={filteredCandidates} openCandidate={openCandidate} />}
      {viewMode === "interview" && <InterviewView candidates={filteredCandidates} openCandidate={openCandidate} runAction={runAction} />}
      {viewMode === "offer" && <OfferView candidates={filteredCandidates} openCandidate={openCandidate} runAction={runAction} />}
      {viewMode === "handoff" && <HandoffView candidates={filteredCandidates} openCandidate={openCandidate} updateCandidate={updateCandidate} />}
      {viewMode === "readiness" && <ReadinessView candidates={filteredCandidates} openCandidate={openCandidate} runAction={runAction} />}

      {activeCandidate && <CandidatePanel candidate={activeCandidate} tab={panelTab} setTab={setPanelTab} onClose={() => setActiveCandidateId(null)} updateCandidate={updateCandidate} runAction={runAction} />}
    </PageShell>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label?: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <label className="min-w-0">
      {label && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring">
        {options.map((option) => <option key={option} value={option}>{option || placeholder || "Select"}</option>)}
      </select>
    </label>
  );
}

function CandidateName({ c }: { c: RecruitingCandidate }) {
  return <div><p className="font-medium text-foreground">{c.name}</p><p className="text-[11px] text-muted-foreground">{c.id} · {c.city}, {c.state}</p></div>;
}

function AlertPill({ alert }: { alert: string }) {
  return <span className="inline-flex max-w-[260px] items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"><AlertCircle className="h-3 w-3 shrink-0" />{alert}</span>;
}

function QuickActions({ c, runAction }: { c: RecruitingCandidate; runAction: (id: string, action: string) => void }) {
  const actions = [
    ["screen", "Mark Screened"], ["schedule", "Schedule Interview"], ["completeInterview", "Mark Interview Complete"], ["sendOffer", "Send Offer"], ["onboarding", "Move to Onboarding"], ["ready", "Mark Ready for Staffing"], ["notify", "Notify Staffing"],
  ];
  return <div className="flex flex-wrap gap-1">{actions.slice(0, 3).map(([id, label]) => <Button key={id} size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={(e) => { e.stopPropagation(); runAction(c.id, id); }}>{label}</Button>)}</div>;
}

function QueueView({ candidates, selectedIds, setSelectedIds, openCandidate, runAction }: { candidates: RecruitingCandidate[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; openCandidate: (id: string) => void; runAction: (id: string, action: string) => void }) {
  const toggle = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  return <div className="space-y-4">{queueSections.map((section) => {
    const rows = candidates.filter(section.match);
    return <section key={section.title} className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><div><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><p className="text-[11px] text-muted-foreground">{section.desc}</p></div><StatusBadge status={`${rows.length}`} variant={rows.length ? "info" : "muted"} /></header>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/40">{["", "Candidate", "Role", "State / Region", "Source", "Recruiter", "Status", "Interview", "Days", "Next Action", "Alert", "Quick Action"].map((h) => <th key={h} className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((c) => <tr key={c.id} onClick={() => openCandidate(c.id)} className="cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/20"><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} /></td><td className="px-3 py-2"><CandidateName c={c} /></td><td className="px-3 py-2 text-muted-foreground">{c.role}</td><td className="px-3 py-2 text-muted-foreground">{c.state} · {c.region}</td><td className="px-3 py-2"><StatusBadge status={c.source} variant={c.source === "Apploi" ? "default" : "muted"} /></td><td className="px-3 py-2 text-muted-foreground">{c.recruiter}</td><td className="px-3 py-2"><StatusBadge status={c.candidateStatus} variant={variantFor(c.candidateStatus)} /></td><td className="px-3 py-2"><StatusBadge status={c.interviewStatus} variant={variantFor(c.interviewStatus)} /></td><td className="px-3 py-2 font-medium tabular-nums text-muted-foreground">{c.daysInStage}d</td><td className="px-3 py-2 text-muted-foreground">{c.nextAction}</td><td className="px-3 py-2">{dynamicAlerts(c)[0] ? <AlertPill alert={dynamicAlerts(c)[0]} /> : <span className="text-[11px] text-muted-foreground">Clear</span>}</td><td className="px-3 py-2"><QuickActions c={c} runAction={runAction} /></td></tr>)}</tbody></table></div>
      {rows.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted-foreground">No candidates in this section.</p>}
    </section>;
  })}</div>;
}

function TableView({ rows, selectedIds, setSelectedIds, openCandidate, runAction, updateCandidate, sortKey, sortDir, setSortKey, setSortDir }: { rows: RecruitingCandidate[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; openCandidate: (id: string) => void; runAction: (id: string, action: string) => void; updateCandidate: (id: string, patch: Partial<RecruitingCandidate>, message?: string) => void; sortKey: SortKey; sortDir: "asc" | "desc"; setSortKey: (k: SortKey) => void; setSortDir: (d: "asc" | "desc") => void }) {
  const toggle = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  const sortable = (label: string, key: SortKey) => <button onClick={() => { setSortKey(key); setSortDir(sortKey === key && sortDir === "desc" ? "asc" : "desc"); }} className="inline-flex items-center gap-1">{label}<ChevronRight className={cn("h-3 w-3", sortKey === key && "text-primary")} /></button>;
  return <div className="overflow-hidden rounded-xl border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["", sortable("Candidate", "name"), sortable("Role", "role"), sortable("State", "state"), sortable("Region", "region"), "Source", sortable("Recruiter", "recruiter"), sortable("Candidate Status", "candidateStatus"), "Interview Status", "Offer Status", "Onboarding Status", "Background Check", "Orientation", "Training", "I-9 / E-Verify", "CR Account", "Staffing Readiness", sortable("Days", "daysInStage"), "Next Action", "Alerts", "Notes"].map((h, i) => <th key={i} className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((c) => <tr key={c.id} onClick={() => openCandidate(c.id)} className="cursor-pointer border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} /></td><td className="px-3 py-2"><CandidateName c={c} /></td><td className="px-3 py-2 text-muted-foreground">{c.role}</td><td className="px-3 py-2 text-muted-foreground">{c.state}</td><td className="px-3 py-2 text-muted-foreground">{c.region}</td><td className="px-3 py-2"><StatusBadge status={c.source} variant="muted" /></td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Select value={c.recruiter} onChange={(v) => updateCandidate(c.id, { recruiter: v }, "Recruiter updated")} options={recruitingRecruiters} /></td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Select value={c.candidateStatus} onChange={(v) => updateCandidate(c.id, { candidateStatus: v as CandidateStage }, "Candidate status updated")} options={recruitingStages} /></td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Select value={c.interviewStatus} onChange={(v) => updateCandidate(c.id, { interviewStatus: v as InterviewStatus }, "Interview status updated")} options={interviewStatuses} /></td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Select value={c.offerStatus} onChange={(v) => updateCandidate(c.id, { offerStatus: v as OfferStatus }, "Offer status updated")} options={offerStatuses} /></td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Select value={c.onboardingStatus} onChange={(v) => updateCandidate(c.id, { onboardingStatus: v as OnboardingStatus }, "Onboarding status updated")} options={onboardingStatuses} /></td><td className="px-3 py-2"><StatusBadge status={c.backgroundCheck} variant={variantFor(c.backgroundCheck)} /></td><td className="px-3 py-2"><StatusBadge status={c.orientation} variant={variantFor(c.orientation)} /></td><td className="px-3 py-2"><StatusBadge status={c.training} variant={variantFor(c.training)} /></td><td className="px-3 py-2"><StatusBadge status={`${c.i9}/${c.everify}`} variant={c.i9 === "Complete" && c.everify === "Complete" ? "success" : "warning"} /></td><td className="px-3 py-2"><StatusBadge status={c.centralReach} variant={variantFor(c.centralReach)} /></td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Select value={c.readinessStatus} onChange={(v) => updateCandidate(c.id, { readinessStatus: v as ReadinessStatus }, "Readiness updated")} options={readinessStatuses} /></td><td className="px-3 py-2 font-medium tabular-nums text-muted-foreground">{c.daysInStage}d</td><td className="min-w-[190px] px-3 py-2 text-muted-foreground">{c.nextAction}</td><td className="px-3 py-2">{dynamicAlerts(c).length}</td><td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Button size="sm" variant="ghost" className="h-7" onClick={() => runAction(c.id, "notify")}>Notify</Button></td></tr>)}</tbody></table></div></div>;
}

function PipelineView({ candidates, openCandidate }: { candidates: RecruitingCandidate[]; openCandidate: (id: string) => void }) {
  return <div className="overflow-x-auto pb-2"><div className="flex min-w-max gap-3">{recruitingStages.map((stage) => { const cards = candidates.filter((c) => c.candidateStatus === stage); const oldest = Math.max(0, ...cards.map((c) => c.daysInStage)); const avg = cards.length ? Math.round(cards.reduce((sum, c) => sum + c.daysInStage, 0) / cards.length) : 0; return <section key={stage} className="flex max-h-[70vh] w-[278px] shrink-0 flex-col rounded-xl border border-border/50 bg-secondary/40"><header className="border-b border-border/50 p-3"><div className="flex items-center justify-between"><h3 className="truncate text-xs font-semibold text-foreground">{stage}</h3><StatusBadge status={`${cards.length}`} variant="muted" /></div><div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>Oldest {oldest}d</span><span>Avg {avg}d</span></div></header><div className="space-y-2 overflow-y-auto p-2">{cards.map((c) => <button key={c.id} onClick={() => openCandidate(c.id)} className="w-full rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/40"><div className="flex items-start justify-between gap-2"><CandidateName c={c} />{dynamicAlerts(c).length > 0 && <AlertCircle className="h-4 w-4 text-destructive" />}</div><div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground"><span>{c.role} · {c.state}</span><span>{c.source}</span><span>{c.recruiter}</span><span>{c.daysInStage}d</span></div><p className="mt-2 text-[11px] text-muted-foreground">{dynamicAlerts(c)[0] ?? c.nextAction}</p></button>)}</div></section>; })}</div></div>;
}

function InterviewView({ candidates, openCandidate, runAction }: { candidates: RecruitingCandidate[]; openCandidate: (id: string, tab?: PanelTab) => void; runAction: (id: string, action: string) => void }) {
  const sections = [
    { title: "Interviews Today", match: (c: RecruitingCandidate) => c.interviewStatus === "Today" },
    { title: "Upcoming Interviews", match: (c: RecruitingCandidate) => c.interviewStatus === "Scheduled" },
    { title: "Interviews Needing Outcome", match: (c: RecruitingCandidate) => c.interviewStatus === "Needs Outcome" },
    { title: "No-Shows", match: (c: RecruitingCandidate) => c.interviewStatus === "No-Show" },
    { title: "Calendar Sync Issues", match: (c: RecruitingCandidate) => c.interviewStatus !== "Not Scheduled" && c.source !== "Apploi" },
  ];
  return <div className="space-y-4"><div className="rounded-xl border border-info/30 bg-info/10 p-4 text-sm text-info">Future integration: Calendly / Outlook / Teams / Apploi sync to eliminate manual interview entry.</div>{sections.map((s) => <SimpleSection key={s.title} title={s.title} rows={candidates.filter(s.match)} headers={["Candidate", "Role", "Interview Date/Time", "Interviewer", "Calendar Source", "Apploi Status", "Reminder Status", "Outcome", "Next Action", "Actions"]} render={(c) => [<CandidateName c={c} />, c.role, c.interviewAt ?? "Not set", c.interviewer, c.source === "Apploi" ? "Apploi" : "Outlook", c.interviewStatus, c.interviewStatus === "Today" ? "Sent" : "Queued", c.interviewStatus === "Needs Outcome" ? "Pending" : c.interviewStatus, c.nextAction, <ActionSet c={c} actions={[["Open", () => openCandidate(c.id, "Interview")], ["No-Show", () => runAction(c.id, "noShow")], ["Outcome", () => runAction(c.id, "goodOutcome")], ["Reminder", () => runAction(c.id, "reminder")], ["Sync", () => toast.success("Synced to Apploi")]]} />]} />)}</div>;
}

function OfferView({ candidates, openCandidate, runAction }: { candidates: RecruitingCandidate[]; openCandidate: (id: string, tab?: PanelTab) => void; runAction: (id: string, action: string) => void }) {
  const sections = [
    { title: "Ready for Offer", match: (c: RecruitingCandidate) => c.candidateStatus === "Interview Completed" && c.offerStatus === "Not Sent" },
    { title: "Offer Sent", match: (c: RecruitingCandidate) => c.offerStatus === "Sent" },
    { title: "Offer Unsigned", match: (c: RecruitingCandidate) => c.offerStatus === "Unsigned" },
    { title: "Offer Accepted", match: (c: RecruitingCandidate) => c.offerStatus === "Accepted" },
    { title: "Offer Declined", match: (c: RecruitingCandidate) => c.offerStatus === "Declined" },
  ];
  return <div className="space-y-4">{sections.map((s) => <SimpleSection key={s.title} title={s.title} rows={candidates.filter(s.match)} headers={["Candidate", "Role", "State", "Pay Rate", "Offer Sent Date", "Signed Status", "Days Since Sent", "Follow-Up Needed", "Next Action", "Actions"]} render={(c) => [<CandidateName c={c} />, c.role, c.state, c.payRate ? `$${c.payRate}/hr` : "Pending", c.offerSentAt ?? "—", c.offerStatus, c.offerStatus === "Unsigned" ? `${c.daysInStage}d` : "—", c.followUps[0] ?? "No", c.nextAction, <ActionSet c={c} actions={[["Send Offer", () => runAction(c.id, "sendOffer")], ["Signed", () => runAction(c.id, "signed")], ["Declined", () => runAction(c.id, "declined")], ["Follow Up", () => toast.success("Follow-up queued")], ["Onboarding", () => runAction(c.id, "onboarding")], ["Open", () => openCandidate(c.id, "Offer")]]} />]} />)}</div>;
}

function HandoffView({ candidates, openCandidate, updateCandidate }: { candidates: RecruitingCandidate[]; openCandidate: (id: string, tab?: PanelTab) => void; updateCandidate: (id: string, patch: Partial<RecruitingCandidate>, message?: string) => void }) {
  const rows = candidates.filter((c) => ["Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training", "Ready for Staffing"].includes(c.candidateStatus));
  const checks = ["Transitioned to Viventium", "Viventium Onboarding Sent", "Viventium Onboarding Complete", "Background Check Sent", "Background Check Clear", "Orientation Scheduled", "Orientation Complete", "Training Assigned", "Training Complete", "I-9 / E-Verify Complete", "CentralReach Account Created"];
  return <section className="overflow-hidden rounded-xl border border-border/60 bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30">{["Candidate", "Role", "State", "Recruiter", "Onboarding Owner", "Current Blocker", "Readiness %", "Next Action", ...checks].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((c) => <tr key={c.id} onClick={() => openCandidate(c.id, "Onboarding")} className="cursor-pointer border-b border-border/40 hover:bg-muted/20"><td className="px-3 py-2"><CandidateName c={c} /></td><td className="px-3 py-2 text-muted-foreground">{c.role}</td><td className="px-3 py-2 text-muted-foreground">{c.state}</td><td className="px-3 py-2 text-muted-foreground">{c.recruiter}</td><td className="px-3 py-2 text-muted-foreground">People Ops</td><td className="px-3 py-2">{dynamicAlerts(c)[0] ?? "None"}</td><td className="px-3 py-2"><div className="w-28"><Progress value={readinessPercent(c)} /><span className="text-[11px] text-muted-foreground">{readinessPercent(c)}%</span></div></td><td className="px-3 py-2 text-muted-foreground">{c.nextAction}</td>{checks.map((check) => <td key={check} className="px-3 py-2"><Checkbox checked={isCheckDone(c, check)} onClick={(e) => e.stopPropagation()} onCheckedChange={() => updateCandidate(c.id, patchForCheck(check), `${check} updated`)} /></td>)}</tr>)}</tbody></table></div></section>;
}

function ReadinessView({ candidates, openCandidate, runAction }: { candidates: RecruitingCandidate[]; openCandidate: (id: string, tab?: PanelTab) => void; runAction: (id: string, action: string) => void }) {
  const groups = [
    { title: "Ready Now", match: (c: RecruitingCandidate) => c.readinessStatus === "Ready for Staffing" },
    { title: "Ready This Week", match: (c: RecruitingCandidate) => c.readinessStatus === "Ready This Week" },
    { title: "Blocked", match: (c: RecruitingCandidate) => c.readinessStatus === "Blocked" },
    { title: "Not Ready", match: (c: RecruitingCandidate) => c.readinessStatus === "Not Ready" || c.readinessStatus === "Onboarding" },
  ];
  return <div className="grid grid-cols-4 gap-4">{groups.map((g) => <section key={g.title} className="rounded-xl border border-border/60 bg-card"><header className="border-b border-border/60 p-3"><h3 className="text-sm font-semibold text-foreground">{g.title}</h3></header><div className="space-y-2 p-2">{candidates.filter(g.match).map((c) => <button key={c.id} onClick={() => openCandidate(c.id, "Staffing Readiness")} className="w-full rounded-lg border border-border/60 p-3 text-left hover:border-primary/40"><CandidateName c={c} /><div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground"><span>{c.role}</span><span>{c.state} · {c.region}</span><span>{c.availability}</span><span>{c.travelRadius} mi</span><span>{c.preferredHours}</span><span>{c.centralReach}</span></div><div className="mt-2 flex items-center justify-between"><StatusBadge status={c.readinessStatus} variant={variantFor(c.readinessStatus)} /><Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={(e) => { e.stopPropagation(); runAction(c.id, "ready"); }}>Ready</Button></div></button>)}</div></section>)}</div>;
}

function SimpleSection({ title, rows, headers, render }: { title: string; rows: RecruitingCandidate[]; headers: string[]; render: (c: RecruitingCandidate) => React.ReactNode[] }) {
  return <section className="overflow-hidden rounded-xl border border-border/60 bg-card"><header className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3"><h3 className="text-sm font-semibold text-foreground">{title}</h3><StatusBadge status={`${rows.length}`} variant="muted" /></header><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/40">{headers.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((c) => <tr key={c.id} className="border-b border-border/30"><>{render(c).map((cell, i) => <td key={i} className="whitespace-nowrap px-3 py-2 text-muted-foreground">{cell}</td>)}</></tr>)}</tbody></table></div>{rows.length === 0 && <p className="p-5 text-center text-xs text-muted-foreground">No records in this group.</p>}</section>;
}

function ActionSet({ actions }: { c: RecruitingCandidate; actions: [string, () => void][] }) {
  return <div className="flex flex-wrap gap-1">{actions.map(([label, fn]) => <Button key={label} size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={fn}>{label}</Button>)}</div>;
}

function isCheckDone(c: RecruitingCandidate, check: string) {
  return (check === "Transitioned to Viventium" && c.viventium !== "Not Started") || (check === "Viventium Onboarding Sent" && ["Sent", "Complete"].includes(c.viventium)) || (check === "Viventium Onboarding Complete" && c.viventium === "Complete") || (check === "Background Check Sent" && c.backgroundCheck !== "Not Sent") || (check === "Background Check Clear" && c.backgroundCheck === "Clear") || (check === "Orientation Scheduled" && c.orientation !== "Not Scheduled") || (check === "Orientation Complete" && c.orientation === "Complete") || (check === "Training Assigned" && c.training !== "Not Assigned") || (check === "Training Complete" && c.training === "Complete") || (check === "I-9 / E-Verify Complete" && c.i9 === "Complete" && c.everify === "Complete") || (check === "CentralReach Account Created" && c.centralReach === "Active");
}

function patchForCheck(check: string): Partial<RecruitingCandidate> {
  if (check.includes("Transitioned")) return { viventium: "Transitioned", candidateStatus: "Onboarding Handoff", onboardingStatus: "Handoff Needed" };
  if (check.includes("Onboarding Sent")) return { viventium: "Sent", onboardingStatus: "Viventium Sent" };
  if (check.includes("Onboarding Complete")) return { viventium: "Complete" };
  if (check.includes("Background Check Sent")) return { backgroundCheck: "Sent", candidateStatus: "Background Check", onboardingStatus: "Background Pending" };
  if (check.includes("Background Check Clear")) return { backgroundCheck: "Clear" };
  if (check.includes("Orientation Scheduled")) return { orientation: "Scheduled", candidateStatus: "Orientation", onboardingStatus: "Orientation Scheduled" };
  if (check.includes("Orientation Complete")) return { orientation: "Complete" };
  if (check.includes("Training Assigned")) return { training: "Assigned", candidateStatus: "Training", onboardingStatus: "Training Assigned" };
  if (check.includes("Training Complete")) return { training: "Complete" };
  if (check.includes("I-9")) return { i9: "Complete", everify: "Complete" };
  if (check.includes("CentralReach")) return { centralReach: "Active" };
  return {};
}

function CandidatePanel({ candidate, tab, setTab, onClose, updateCandidate, runAction }: { candidate: RecruitingCandidate; tab: PanelTab; setTab: (tab: PanelTab) => void; onClose: () => void; updateCandidate: (id: string, patch: Partial<RecruitingCandidate>, message?: string) => void; runAction: (id: string, action: string) => void }) {
  const alerts = dynamicAlerts(candidate);
  return <div className="fixed inset-y-0 right-0 z-50 w-[560px] border-l border-border bg-background shadow-2xl animate-slide-in-right"><div className="flex h-full flex-col"><header className="border-b border-border p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">{candidate.name}</h2><p className="text-sm text-muted-foreground">{candidate.role} · {candidate.state} / {candidate.region} · {candidate.source}</p><div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={candidate.candidateStatus} variant={variantFor(candidate.candidateStatus)} /><StatusBadge status={candidate.recruiter} variant="muted" /><StatusBadge status={`${candidate.daysInStage} days`} variant={candidate.daysInStage > 10 ? "destructive" : "muted"} /><StatusBadge status={candidate.readinessStatus} variant={variantFor(candidate.readinessStatus)} /></div></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => toast.info("Opened Apploi profile")}>Open Apploi</Button><Button size="sm" variant="outline" onClick={() => runAction(candidate.id, "schedule")}>Schedule Interview</Button><Button size="sm" variant="outline" onClick={() => runAction(candidate.id, "sendOffer")}>Send Offer</Button><Button size="sm" variant="outline" onClick={() => runAction(candidate.id, "onboarding")}>Move to Onboarding</Button><Button size="sm" onClick={() => runAction(candidate.id, "ready")}>Mark Ready for Staffing</Button><Button size="sm" variant="outline" onClick={() => toast.success("Task created")}>Create Task</Button><Button size="sm" variant="outline" onClick={() => toast.success("Note added")}>Add Note</Button></div></header><div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">{panelTabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{t}</button>)}</div><main className="flex-1 overflow-y-auto p-4"><PanelContent candidate={candidate} tab={tab} alerts={alerts} updateCandidate={updateCandidate} runAction={runAction} /></main></div></div>;
}

function PanelContent({ candidate, tab, alerts, updateCandidate, runAction }: { candidate: RecruitingCandidate; tab: PanelTab; alerts: string[]; updateCandidate: (id: string, patch: Partial<RecruitingCandidate>, message?: string) => void; runAction: (id: string, action: string) => void }) {
  if (tab === "Overview") return <div className="space-y-4"><InfoGrid items={[["Current status", candidate.candidateStatus], ["Role applied for", candidate.role], ["State / region", `${candidate.state} / ${candidate.region}`], ["Source", candidate.source], ["Recruiter", candidate.recruiter], ["Next action", candidate.nextAction], ["Days in stage", `${candidate.daysInStage}`]]} />{alerts.length > 0 && <Card title="Blockers">{alerts.map((a) => <AlertPill key={a} alert={a} />)}</Card>}</div>;
  if (tab === "Application") return <InfoGrid items={[["Resume", candidate.resume], ["Application source", candidate.source], ["Certification status", candidate.certification], ["BACB check", candidate.bacbCheck], ["Experience with kids", candidate.kidsExperience], ["Desired role", candidate.role], ["Desired hours", candidate.preferredHours], ["Notes", candidate.interviewNotes]]} />;
  if (tab === "Screening") return <div className="space-y-3"><InfoGrid items={[["RBT certified", candidate.certification === "Verified" ? "Yes" : "No"], ["Childcare / ABA experience", candidate.kidsExperience], ["Eligibility decision", candidate.eligibility], ["Not-qualified reason", candidate.notQualifiedReason ?? "—"]]} /><Button onClick={() => runAction(candidate.id, "screen")}>Mark Screened</Button><Button variant="outline" onClick={() => updateCandidate(candidate.id, { training: "Assigned", nextAction: "Complete 40-hour training" }, "40-hour training link sent")}>Send 40-hour training link</Button></div>;
  if (tab === "Interview") return <div className="space-y-3"><InfoGrid items={[["Scheduled date/time", candidate.interviewAt ?? "Not scheduled"], ["Interviewer", candidate.interviewer], ["Calendar source", candidate.source === "Apploi" ? "Apploi" : "Outlook"], ["Apploi interview status", candidate.interviewStatus], ["Reminder status", candidate.interviewStatus === "Today" ? "Sent" : "Queued"], ["Outcome", candidate.interviewStatus], ["No-show flag", candidate.noShow ? "Yes" : "No"]]} /><Textarea defaultValue={candidate.interviewNotes} onBlur={(e) => updateCandidate(candidate.id, { interviewNotes: e.target.value }, "Interview notes updated")} /><div className="flex gap-2"><Button onClick={() => runAction(candidate.id, "goodOutcome")}>Good outcome</Button><Button variant="outline" onClick={() => runAction(candidate.id, "badOutcome")}>Bad outcome</Button><Button variant="outline" onClick={() => runAction(candidate.id, "noShow")}>Mark no-show</Button></div></div>;
  if (tab === "Offer") return <InfoGrid items={[["Offer sent date", candidate.offerSentAt ?? "—"], ["Offer template", `${candidate.role} standard offer`], ["Pay rate", candidate.payRate ? `$${candidate.payRate}/hr` : "Pending"], ["Signed status", candidate.offerStatus], ["Follow-up history", candidate.followUps.join(", ") || "None"], ["Decline reason", candidate.offerStatus === "Declined" ? "Candidate declined" : "—"]]} />;
  if (tab === "Onboarding") return <InfoGrid items={[["Viventium transition status", candidate.viventium], ["Viventium onboarding status", candidate.onboardingStatus], ["Background check status", candidate.backgroundCheck], ["Orientation status", candidate.orientation], ["Training status", candidate.training], ["I-9 / E-Verify status", `${candidate.i9} / ${candidate.everify}`], ["CentralReach account status", candidate.centralReach]]} />;
  if (tab === "Staffing Readiness") return <div className="space-y-4"><InfoGrid items={[["Availability grid", candidate.availability], ["Location / region", `${candidate.city}, ${candidate.region}`], ["Travel radius", `${candidate.travelRadius} miles`], ["Preferred hours", candidate.preferredHours], ["Ready for assignment status", candidate.readinessStatus], ["Staffing owner notified", candidate.nextAction.includes("notified") ? "Yes" : "No"], ["Linked RBT profile", candidate.readinessStatus === "Ready for Staffing" ? `RBT-${candidate.id}` : "Pending"]]} /><Progress value={readinessPercent(candidate)} /><Button onClick={() => runAction(candidate.id, "notify")}>Notify Staffing</Button></div>;
  if (tab === "Documents") return <div className="grid grid-cols-2 gap-3">{["Resume", "Certification", "Offer letter", "Background check", "Onboarding docs", "Upload area"].map((d) => <div key={d} className="rounded-lg border border-border/60 p-3"><FileText className="mb-2 h-4 w-4 text-primary" /><p className="text-sm font-medium text-foreground">{d}</p><p className="text-xs text-muted-foreground">{d === "Upload area" ? "Drop files here" : "Available"}</p></div>)}</div>;
  if (tab === "Tasks") return <div className="space-y-2">{candidate.tasks.map((t) => <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3"><div><p className="text-sm font-medium text-foreground">{t.title}</p><p className="text-xs text-muted-foreground">{t.owner} · {t.due}</p></div>{t.completed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-warning" />}</div>)}</div>;
  return <div className="space-y-2">{candidate.timeline.map((event) => <div key={event.id} className="rounded-lg border border-border/60 p-3"><p className="text-sm font-medium text-foreground">{event.title}</p><p className="text-xs text-muted-foreground">{event.date} · {event.actor}</p><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p></div>)}</div>;
}

function InfoGrid({ items }: { items: [string, string][] }) {
  return <div className="grid grid-cols-2 gap-3">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-border/60 bg-card p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>)}</div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border/60 bg-card p-3"><h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3><div className="flex flex-wrap gap-2">{children}</div></div>;
}
