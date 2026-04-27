import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BadgeCheck, Briefcase, CalendarClock, CheckCircle2, Clock, Download, Eye,
  FileCheck2, Filter, Megaphone, RefreshCw, Search, Send, UserCheck, UserPlus, Users, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  recruitingCandidates, recruitingRecruiters, recruitingRoles, recruitingSources, recruitingStages, recruitingStates,
  staffingDemandByRegion, toStaffingRbtProfile, type CandidateStage, type RecruitingCandidate, type ReadinessStatus,
} from "@/data/recruitingDashboard";

type Health = "green" | "yellow" | "red";
type QueueKey = "urgent" | "today" | "risks";
type KpiKey = "all" | "new" | "screening" | "interviews" | "offers" | "accepted" | "onboarding" | "ready" | "bottlenecks";
const ALL = "All";

const avg = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const pct = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;
const healthFor = (count: number, oldest: number): Health => count === 0 ? "green" : oldest > 5 ? "red" : oldest > 2 ? "yellow" : "green";
const toneFor = (status: string): "success" | "warning" | "destructive" | "info" | "muted" => {
  if (["Ready for Staffing", "Complete", "Accepted", "Clear", "Pass", "Eligible", "Verified", "Active"].includes(status)) return "success";
  if (["Blocked", "Not Qualified", "No-Show", "Unsigned", "Delayed", "Missing", "Fail", "Not Eligible"].includes(status)) return "destructive";
  if (["Pending", "Onboarding", "Ready This Week", "Sent", "Scheduled", "Needs Outcome", "Incomplete", "Review"].some((x) => status.includes(x))) return "warning";
  if (["Today", "Offer Sent", "Interview Scheduled"].includes(status)) return "info";
  return "muted";
};

function HealthDot({ health }: { health: Health }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full", health === "green" && "bg-success", health === "yellow" && "bg-warning", health === "red" && "bg-destructive")} />;
}
function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "success" | "warning" | "destructive" | "info" | "muted" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", tone === "success" && "bg-success/10 text-success", tone === "warning" && "bg-warning/15 text-warning-foreground", tone === "destructive" && "bg-destructive/10 text-destructive", tone === "info" && "bg-primary/10 text-primary", tone === "muted" && "bg-muted text-muted-foreground")}>{children}</span>;
}
const alertsFor = (c: RecruitingCandidate) => [
  ...c.blockers,
  ...(c.candidateStatus === "New Applicant" && c.daysInStage >= 1 ? ["New applicant not screened within 24 hours"] : []),
  ...(c.interviewStatus === "Today" ? ["Interview today"] : []),
  ...(c.interviewStatus === "No-Show" ? ["Interview no-show"] : []),
  ...(c.interviewStatus === "Needs Outcome" ? ["Interview completed but no outcome"] : []),
  ...(c.offerStatus === "Unsigned" && c.daysInStage >= 2 ? ["Offer unsigned after 48 hours"] : []),
  ...(c.backgroundCheck === "Delayed" || (c.backgroundCheck === "Pending" && c.daysInStage > 5) ? ["Background check pending too long"] : []),
  ...(c.offerStatus === "Accepted" && c.orientation === "Not Scheduled" ? ["Orientation not scheduled"] : []),
  ...(c.training === "Incomplete" ? ["Training incomplete"] : []),
  ...(c.i9 !== "Complete" && ["Background Check", "Orientation", "Training"].includes(c.candidateStatus) ? ["I-9 / E-Verify incomplete"] : []),
  ...(c.centralReach !== "Active" && ["Training", "Ready for Staffing"].includes(c.candidateStatus) ? ["CentralReach account missing"] : []),
  ...(c.readinessStatus === "Ready for Staffing" && c.role === "RBT" ? ["Candidate ready but not sent to staffing"] : []),
].filter((v, i, a) => a.indexOf(v) === i);

function MetricCard({ label, value, subtext, health, active, onClick }: { label: string; value: string | number; subtext: string; health: Health; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={cn("rounded-lg border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", active && "border-primary ring-2 ring-primary/20")}><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><HealthDot health={health} /></div><div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{subtext}</p></button>;
}

export default function RecruitingDashboard() {
  const [candidates, setCandidates] = useState<RecruitingCandidate[]>(recruitingCandidates);
  const [dateRange, setDateRange] = useState("This Week");
  const [state, setState] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [recruiter, setRecruiter] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [interviewStatus, setInterviewStatus] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [readiness, setReadiness] = useState(ALL);
  const [query, setQuery] = useState("");
  const [activeKpi, setActiveKpi] = useState<KpiKey>("all");
  const [queue, setQueue] = useState<QueueKey>("urgent");
  const [selectedId, setSelectedId] = useState(candidates[0].id);
  const [detailOpen, setDetailOpen] = useState(false);
  const [staffingProfiles, setStaffingProfiles] = useState(() => JSON.parse(localStorage.getItem("blossom-ready-rbts") ?? "[]"));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates
      .filter((c) => state === ALL || c.state === state)
      .filter((c) => role === ALL || c.role === role)
      .filter((c) => recruiter === ALL || c.recruiter === recruiter)
      .filter((c) => status === ALL || c.candidateStatus === status)
      .filter((c) => interviewStatus === ALL || c.interviewStatus === interviewStatus)
      .filter((c) => source === ALL || c.source === source)
      .filter((c) => readiness === ALL || c.readinessStatus === readiness)
      .filter((c) => !q || [c.name, c.role, c.state, c.region, c.source, c.recruiter, c.candidateStatus, c.nextAction].some((field) => field.toLowerCase().includes(q)))
      .filter((c) => activeKpi === "all" ||
        (activeKpi === "new" && c.candidateStatus === "New Applicant") ||
        (activeKpi === "screening" && ["New Applicant", "Screening"].includes(c.candidateStatus)) ||
        (activeKpi === "interviews" && ["Scheduled", "Today", "Needs Outcome"].includes(c.interviewStatus)) ||
        (activeKpi === "offers" && ["Sent", "Unsigned"].includes(c.offerStatus)) ||
        (activeKpi === "accepted" && c.offerStatus === "Accepted") ||
        (activeKpi === "onboarding" && ["Onboarding", "Ready This Week"].includes(c.readinessStatus)) ||
        (activeKpi === "ready" && c.readinessStatus === "Ready for Staffing") ||
        (activeKpi === "bottlenecks" && alertsFor(c).length > 0));
  }, [activeKpi, candidates, interviewStatus, query, readiness, recruiter, role, source, state, status]);

  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];
  const urgentRows = filtered.filter((c) => alertsFor(c).some((a) => ["New applicant not screened within 24 hours", "Interview today", "Offer unsigned after 48 hours", "Candidate stuck in onboarding handoff", "RBT shortage in state/region"].includes(a))).slice(0, 8);
  const todayRows = filtered.filter((c) => c.tasks.some((t) => !t.completed && t.due === "Today") || c.interviewStatus === "No-Show" || c.resume === "Missing" || c.backgroundCheck === "Pending").slice(0, 8);
  const riskRows = filtered.filter((c) => c.role === "RBT" && (c.readinessStatus === "Ready for Staffing" || c.daysInStage > 4 || c.blockers.some((b) => b.includes("shortage")))).slice(0, 8);
  const queueRows = { urgent: urgentRows, today: todayRows, risks: riskRows };

  const kpis = [
    { key: "new" as KpiKey, label: "New Applicants", value: filtered.filter((c) => c.candidateStatus === "New Applicant").length, subtext: "Unscreened applications", health: filtered.some((c) => c.candidateStatus === "New Applicant" && c.daysInStage > 1) ? "red" : "green" as Health },
    { key: "screening" as KpiKey, label: "Needs Screening", value: filtered.filter((c) => ["New Applicant", "Screening"].includes(c.candidateStatus)).length, subtext: "Phone screen or file review", health: "yellow" as Health },
    { key: "interviews" as KpiKey, label: "Interviews Scheduled", value: filtered.filter((c) => ["Scheduled", "Today"].includes(c.interviewStatus)).length, subtext: "Today and upcoming", health: filtered.some((c) => c.interviewStatus === "Today") ? "yellow" : "green" as Health },
    { key: "offers" as KpiKey, label: "Offers Sent", value: filtered.filter((c) => ["Sent", "Unsigned"].includes(c.offerStatus)).length, subtext: "Awaiting signature", health: filtered.some((c) => c.offerStatus === "Unsigned") ? "red" : "green" as Health },
    { key: "accepted" as KpiKey, label: "Offers Accepted", value: filtered.filter((c) => c.offerStatus === "Accepted").length, subtext: "Moving into onboarding", health: "green" as Health },
    { key: "onboarding" as KpiKey, label: "Onboarding Ready", value: filtered.filter((c) => ["Onboarding", "Ready This Week"].includes(c.readinessStatus)).length, subtext: "Handoff, checks, training", health: filtered.some((c) => c.readinessStatus === "Onboarding" && c.daysInStage > 5) ? "red" : "yellow" as Health },
    { key: "ready" as KpiKey, label: "Ready for Staffing", value: filtered.filter((c) => c.readinessStatus === "Ready for Staffing").length, subtext: `${staffingProfiles.length} RBT profiles staged`, health: "green" as Health },
    { key: "bottlenecks" as KpiKey, label: "Recruiting Bottlenecks", value: filtered.filter((c) => alertsFor(c).length > 0).length, subtext: "Aging, missing data, stuck handoffs", health: filtered.filter((c) => alertsFor(c).length > 0).length > 8 ? "red" : "yellow" as Health },
  ];

  const stageRows = recruitingStages.map((stage) => {
    const rows = candidates.filter((c) => c.candidateStatus === stage);
    const oldest = rows.length ? Math.max(...rows.map((c) => c.daysInStage)) : 0;
    return { stage, rows, oldest, avgDays: avg(rows.map((c) => c.daysInStage)), health: healthFor(rows.length, oldest) };
  });
  const sourceRows = recruitingSources.map((s) => {
    const rows = candidates.filter((c) => c.source === s);
    return { source: s, applicants: rows.length, screened: pct(rows.filter((c) => c.screeningOutcome !== "Pending").length, rows.length), interviews: pct(rows.filter((c) => c.interviewStatus !== "Not Scheduled").length, rows.length), offerRate: pct(rows.filter((c) => c.offerStatus !== "Not Sent").length, rows.length), acceptRate: pct(rows.filter((c) => c.offerStatus === "Accepted").length, rows.length), readyRate: pct(rows.filter((c) => c.readinessStatus === "Ready for Staffing").length, rows.length) };
  });
  const forecastRows = Object.entries(staffingDemandByRegion).map(([key, demand]) => {
    const [stateCode, regionName] = key.split("-");
    const rows = candidates.filter((c) => c.state === stateCode && c.region === regionName && c.role === demand.priorityRole);
    const ready = rows.filter((c) => c.readinessStatus === "Ready for Staffing").length;
    const week = rows.filter((c) => c.readinessStatus === "Ready This Week").length;
    const next = rows.filter((c) => ["Onboarding", "Not Ready"].includes(c.readinessStatus) && c.offerStatus === "Accepted").length;
    return { state: stateCode, region: regionName, role: demand.priorityRole, pipeline: rows.length, ready, week, next, gap: Math.max(0, demand.demand - ready - week), demand: demand.demand };
  });
  const recruiterRows = recruitingRecruiters.map((name) => {
    const rows = candidates.filter((c) => c.recruiter === name);
    return { name, reviewed: rows.filter((c) => c.screeningOutcome !== "Pending").length, interviews: rows.filter((c) => c.interviewStatus !== "Not Scheduled").length, offers: rows.filter((c) => c.offerStatus !== "Not Sent").length, accepted: rows.filter((c) => c.offerStatus === "Accepted").length, onboarding: rows.filter((c) => ["Onboarding", "Ready This Week", "Ready for Staffing"].includes(c.readinessStatus)).length, ready: rows.filter((c) => c.readinessStatus === "Ready for Staffing").length, avgScreen: avg(rows.map((c) => c.candidateStatus === "New Applicant" ? c.daysInStage : 1)), followups: rows.reduce((s, c) => s + c.tasks.filter((t) => !t.completed).length, 0) };
  });

  const updateCandidate = (id: string, patch: Partial<RecruitingCandidate>, message: string) => {
    setCandidates((current) => current.map((c) => c.id === id ? { ...c, ...patch, timeline: [{ id: `${id}-${Date.now()}`, date: "2026-04-27", title: message, detail: "Updated from Recruiting Dashboard.", actor: "Dashboard user", type: "milestone" }, ...c.timeline] } : c));
    toast.success(message);
  };
  const markReady = (candidate: RecruitingCandidate) => {
    const profile = toStaffingRbtProfile(candidate);
    setStaffingProfiles((current: unknown[]) => { const next = [...current.filter((item: any) => item.id !== profile.id), profile]; localStorage.setItem("blossom-ready-rbts", JSON.stringify(next)); return next; });
    updateCandidate(candidate.id, { readinessStatus: "Ready for Staffing", candidateStatus: "Ready for Staffing", onboardingStatus: "Complete", nextAction: "Available in Staffing Dashboard demo supply", blockers: [] }, `${candidate.name} marked ready for staffing`);
    toast.info("Staffing owner notified", { description: `${candidate.name} is now available for assignment demo data.` });
  };
  const exportCsv = () => {
    const csv = [["Candidate", "Role", "State", "Region", "Source", "Recruiter", "Status", "Interview", "Offer", "Onboarding", "Readiness", "Days", "Next Action"], ...filtered.map((c) => [c.name, c.role, c.state, c.region, c.source, c.recruiter, c.candidateStatus, c.interviewStatus, c.offerStatus, c.onboardingStatus, c.readinessStatus, c.daysInStage, c.nextAction])].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "recruiting-dashboard.csv"; link.click(); URL.revokeObjectURL(url);
    toast.success("Recruiting dashboard exported");
  };

  return <div className="min-h-screen bg-background text-foreground">
    <div className="sticky top-0 z-20 -mx-6 -mt-6 border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Recruiting Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Candidate pipeline, interviews, offers, onboarding handoff, and staffing readiness.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => toast.success("Recruiting data refreshed")}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {[{ v: dateRange, s: setDateRange, o: ["Today", "This Week", "Next 14 Days", "This Month"] }, { v: state, s: setState, o: [ALL, ...recruitingStates] }, { v: role, s: setRole, o: [ALL, ...recruitingRoles] }, { v: recruiter, s: setRecruiter, o: [ALL, ...recruitingRecruiters] }, { v: status, s: setStatus, o: [ALL, ...recruitingStages] }, { v: interviewStatus, s: setInterviewStatus, o: [ALL, "Not Scheduled", "Scheduled", "Today", "Completed", "Needs Outcome", "No-Show"] }, { v: source, s: setSource, o: [ALL, ...recruitingSources] }, { v: readiness, s: setReadiness, o: [ALL, "Not Ready", "Onboarding", "Ready This Week", "Ready for Staffing", "Blocked"] }].map((f, index) => <Select key={index} value={f.v} onValueChange={f.s}><SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger><SelectContent>{f.o.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>)}
      </div>
    </div>

    <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">{kpis.map((k) => <MetricCard key={k.key} label={k.label} value={k.value} subtext={k.subtext} health={k.health} active={activeKpi === k.key} onClick={() => setActiveKpi(activeKpi === k.key ? "all" : k.key)} />)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
      <section className="rounded-lg border bg-card shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Recruiting Action Queue</h2><p className="text-xs text-muted-foreground">Urgent candidates, follow-ups, and staffing supply risks.</p></div><div className="flex rounded-md border bg-muted/40 p-1">{[["urgent", "Urgent Now"], ["today", "Follow-Up Today"], ["risks", "Supply Risks"]].map(([key, label]) => <button key={key} onClick={() => setQueue(key as QueueKey)} className={cn("rounded px-3 py-1.5 text-xs font-medium", queue === key ? "bg-card shadow-sm" : "text-muted-foreground")}>{label}</button>)}</div></div>
        <div className="divide-y">{queueRows[queue].map((c) => <div key={c.id} onClick={() => { setSelectedId(c.id); setDetailOpen(true); }} className="grid cursor-pointer grid-cols-[1fr_0.45fr_0.5fr_0.6fr_0.7fr_0.75fr_1fr_auto] items-center gap-3 p-4 text-sm hover:bg-muted/40"><div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.city} · {c.source}</div></div><div>{c.role}</div><div>{c.state}</div><div className="text-xs">{c.recruiter}</div><div><Pill tone={toneFor(c.candidateStatus)}>{c.candidateStatus}</Pill></div><div className="text-xs text-muted-foreground">{c.daysInStage}d in stage</div><div className="text-xs">{c.nextAction}</div><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); setDetailOpen(true); }}><Eye className="mr-1 h-3 w-3" />Open</Button><Button size="sm" onClick={(e) => { e.stopPropagation(); c.role === "RBT" ? markReady(c) : updateCandidate(c.id, { candidateStatus: "Onboarding Handoff", onboardingStatus: "Handoff Needed" }, "Moved to onboarding"); }}>{c.role === "RBT" ? "Ready" : "Onboard"}</Button></div></div>)}</div>
      </section>
      <aside className="rounded-lg border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Staffing Supply Snapshot</h2><p className="text-xs text-muted-foreground">Future RBT/BCBA supply against current demand.</p></div><UserCheck className="h-5 w-5 text-primary" /></div><div className="mt-4 grid grid-cols-2 gap-3">{[{ l: "Ready now", v: candidates.filter((c) => c.readinessStatus === "Ready for Staffing").length }, { l: "Ready this week", v: candidates.filter((c) => c.readinessStatus === "Ready This Week").length }, { l: "In onboarding", v: candidates.filter((c) => c.readinessStatus === "Onboarding").length }, { l: "RBT profiles", v: staffingProfiles.length }].map((x) => <div key={x.l} className="rounded-lg border bg-muted/30 p-3"><div className="text-2xl font-semibold">{x.v}</div><div className="text-xs text-muted-foreground">{x.l}</div></div>)}</div><div className="mt-4 space-y-3">{forecastRows.filter((r) => r.gap > 0).slice(0, 5).map((r) => <div key={`${r.state}-${r.region}`} className="rounded-lg border p-3"><div className="flex items-center justify-between"><span className="font-medium">{r.state} · {r.region}</span><Pill tone={r.gap > 2 ? "destructive" : "warning"}>{r.gap} gap</Pill></div><div className="mt-2 text-xs text-muted-foreground">Need {r.demand} {r.role}s · Ready {r.ready} · This week {r.week}</div><Progress value={pct(r.ready + r.week, r.demand)} className="mt-2 h-1.5" /></div>)}</div></aside>
    </div>

    <section className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-6">{stageRows.map((s) => <button key={s.stage} onClick={() => setStatus(s.stage)} className="rounded-lg border bg-card p-4 text-left shadow-sm transition hover:shadow-md"><div className="flex items-center justify-between"><HealthDot health={s.health} /><ArrowRight className="h-4 w-4 text-muted-foreground" /></div><div className="mt-3 text-xl font-semibold">{s.rows.length}</div><div className="text-xs font-medium">{s.stage}</div><div className="mt-2 text-[11px] text-muted-foreground">Oldest {s.oldest}d · Avg {s.avgDays}d</div></button>)}</section>

    <section className="mt-6 grid gap-6 xl:grid-cols-2"><Panel title="Apploi / Source Performance" icon={Briefcase}><DataTable headers={["Source", "Applicants", "Screened", "Booked", "Offer", "Accept", "Ready"]} rows={sourceRows.map((r) => [r.source, r.applicants, `${r.screened}%`, `${r.interviews}%`, `${r.offerRate}%`, `${r.acceptRate}%`, `${r.readyRate}%`])} /></Panel><Panel title="Interview Operations" icon={CalendarClock}><div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">{[{ l: "Today", v: candidates.filter((c) => c.interviewStatus === "Today").length }, { l: "Upcoming", v: candidates.filter((c) => c.interviewStatus === "Scheduled").length }, { l: "No-shows", v: candidates.filter((c) => c.noShow).length }, { l: "Needs outcome", v: candidates.filter((c) => c.interviewStatus === "Needs Outcome").length }, { l: "Sync issues", v: 3 }].map((x) => <div key={x.l} className="rounded-lg border bg-muted/30 p-3"><div className="text-xl font-semibold">{x.v}</div><div className="text-xs text-muted-foreground">{x.l}</div></div>)}</div><p className="mt-4 rounded-lg border bg-primary/5 p-3 text-xs text-primary">Future integration: Calendly / Outlook / Teams / Apploi sync to eliminate manual scheduling duplication.</p></Panel></section>

    <section className="mt-6 grid gap-6 xl:grid-cols-2"><Panel title="Onboarding Handoff" icon={FileCheck2}><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{["Transitioned", "Sent", "Clear", "Scheduled", "Assigned", "Complete", "Requested", "Active", "Ready for Staffing"].map((label) => <div key={label} className="rounded-lg border p-3"><div className="text-lg font-semibold">{candidates.filter((c) => [c.viventium, c.backgroundCheck, c.orientation, c.training, c.i9, c.everify, c.centralReach, c.readinessStatus].includes(label as never)).length}</div><div className="text-[11px] text-muted-foreground">{label}</div></div>)}</div></Panel><Panel title="Staffing Supply Forecast" icon={Users}><DataTable headers={["State", "Region", "Role", "Pipeline", "This week", "Next week", "Gap"]} rows={forecastRows.map((r) => [r.state, r.region, r.role, r.pipeline, r.week, r.next, r.gap])} /></Panel></section>

    <section className="mt-6 rounded-lg border bg-card p-4 shadow-sm"><h2 className="font-semibold">Recruiter Performance</h2><DataTable headers={["Recruiter", "Reviewed", "Interviews", "Offers", "Accepted", "Onboarding", "Ready", "Avg Screen", "Follow-ups"]} rows={recruiterRows.map((r) => [r.name, r.reviewed, r.interviews, r.offers, r.accepted, r.onboarding, r.ready, `${r.avgScreen}d`, r.followups])} /></section>

    <section className="mt-6 rounded-lg border bg-card p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Recruiting Worklist</h2><p className="text-xs text-muted-foreground">Connected candidate records powering every widget on this page.</p></div><div className="relative w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search candidates, regions, recruiters..." value={query} onChange={(e) => setQuery(e.target.value)} /></div></div><div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{["Candidate", "Role", "State", "Region", "Source", "Recruiter", "Candidate Status", "Interview", "Offer", "Onboarding", "Readiness", "Days", "Next Action", "Alerts"].map((h) => <th key={h} className="whitespace-nowrap px-2 py-2">{h}</th>)}</tr></thead><tbody>{filtered.map((c) => <tr key={c.id} onClick={() => { setSelectedId(c.id); setDetailOpen(true); }} className="cursor-pointer border-t hover:bg-muted/40"><td className="px-2 py-3 font-medium">{c.name}</td><td className="px-2">{c.role}</td><td className="px-2">{c.state}</td><td className="px-2">{c.region}</td><td className="px-2">{c.source}</td><td className="px-2">{c.recruiter}</td><td className="px-2"><Pill tone={toneFor(c.candidateStatus)}>{c.candidateStatus}</Pill></td><td className="px-2"><Pill tone={toneFor(c.interviewStatus)}>{c.interviewStatus}</Pill></td><td className="px-2"><Pill tone={toneFor(c.offerStatus)}>{c.offerStatus}</Pill></td><td className="px-2"><Pill tone={toneFor(c.onboardingStatus)}>{c.onboardingStatus}</Pill></td><td className="px-2"><Pill tone={toneFor(c.readinessStatus)}>{c.readinessStatus}</Pill></td><td className="px-2">{c.daysInStage}d</td><td className="max-w-56 truncate px-2">{c.nextAction}</td><td className="px-2"><div className="flex gap-1">{alertsFor(c).slice(0, 2).map((a) => <AlertTriangle key={a} className="h-4 w-4 text-destructive" />)}</div></td></tr>)}</tbody></table></div></section>

    <CandidatePanel candidate={selected} open={detailOpen} onOpenChange={setDetailOpen} onUpdate={updateCandidate} onReady={markReady} />
  </div>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Briefcase; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-card p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{title}</h2><Icon className="h-5 w-5 text-primary" /></div>{children}</section>;
}
function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return <div className="overflow-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-2 py-2">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t">{row.map((cell, j) => <td key={j} className="whitespace-nowrap px-2 py-2">{cell}</td>)}</tr>)}</tbody></table></div>;
}
function CandidatePanel({ candidate, open, onOpenChange, onUpdate, onReady }: { candidate: RecruitingCandidate; open: boolean; onOpenChange: (open: boolean) => void; onUpdate: (id: string, patch: Partial<RecruitingCandidate>, message: string) => void; onReady: (candidate: RecruitingCandidate) => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>{candidate.name}</SheetTitle><SheetDescription>{candidate.role} · {candidate.state} / {candidate.region} · {candidate.source}</SheetDescription></SheetHeader><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => onUpdate(candidate.id, { screeningOutcome: "Pass", candidateStatus: "Interview Scheduled", interviewStatus: "Scheduled", nextAction: "Schedule interview details" }, "Candidate marked screened")}><CheckCircle2 className="mr-2 h-4 w-4" />Mark Screened</Button><Button size="sm" variant="outline" onClick={() => onUpdate(candidate.id, { interviewStatus: "Scheduled", candidateStatus: "Interview Scheduled", nextAction: "Send interview reminder" }, "Interview scheduled")}><CalendarClock className="mr-2 h-4 w-4" />Schedule Interview</Button><Button size="sm" variant="outline" onClick={() => onUpdate(candidate.id, { offerStatus: "Sent", candidateStatus: "Offer Sent", nextAction: "Follow up on offer" }, "Offer sent")}><Send className="mr-2 h-4 w-4" />Send Offer</Button><Button size="sm" variant="outline" onClick={() => onUpdate(candidate.id, { candidateStatus: "Onboarding Handoff", onboardingStatus: "Handoff Needed", readinessStatus: "Onboarding", nextAction: "Transition to Viventium" }, "Moved to onboarding")}><UserPlus className="mr-2 h-4 w-4" />Move to Onboarding</Button>{candidate.role === "RBT" && <Button size="sm" onClick={() => onReady(candidate)}><BadgeCheck className="mr-2 h-4 w-4" />Mark Ready for Staffing</Button>}<Button size="sm" variant="outline" onClick={() => toast.info("Staffing owner notified")}><Megaphone className="mr-2 h-4 w-4" />Notify Staffing</Button></div><Tabs defaultValue="overview" className="mt-5"><TabsList className="grid h-auto grid-cols-3 md:grid-cols-9">{["overview", "application", "screening", "interview", "offer", "onboarding", "readiness", "tasks", "timeline"].map((t) => <TabsTrigger key={t} value={t} className="text-xs capitalize">{t}</TabsTrigger>)}</TabsList><TabsContent value="overview"><InfoGrid rows={[["Candidate", candidate.name], ["Role", candidate.role], ["State", candidate.state], ["Source", candidate.source], ["Recruiter", candidate.recruiter], ["Current status", candidate.candidateStatus], ["Days in stage", `${candidate.daysInStage} days`], ["Blockers", candidate.blockers.join(", ") || "None"]]} /></TabsContent><TabsContent value="application"><InfoGrid rows={[["Resume", candidate.resume], ["Certification", candidate.certification], ["BACB check", candidate.bacbCheck], ["Experience with kids", candidate.kidsExperience], ["Notes", candidate.interviewNotes]]} /></TabsContent><TabsContent value="screening"><InfoGrid rows={[["Screening outcome", candidate.screeningOutcome], ["Script responses", candidate.interviewNotes], ["Eligibility", candidate.eligibility], ["Not-qualified reason", candidate.notQualifiedReason ?? "—"]]} /></TabsContent><TabsContent value="interview"><InfoGrid rows={[["Scheduled date/time", candidate.interviewAt ?? "—"], ["Interviewer", candidate.interviewer], ["Interview notes", candidate.interviewNotes], ["Outcome", candidate.interviewStatus], ["No-show flag", candidate.noShow ? "Yes" : "No"]]} /></TabsContent><TabsContent value="offer"><InfoGrid rows={[["Offer sent date", candidate.offerSentAt ?? "—"], ["Pay rate", candidate.payRate ? `$${candidate.payRate}/hr` : "—"], ["Signed status", candidate.offerStatus], ["Follow-up history", candidate.followUps.join(", ") || "—"]]} /></TabsContent><TabsContent value="onboarding"><InfoGrid rows={[["Viventium transition", candidate.viventium], ["Background check", candidate.backgroundCheck], ["Orientation", candidate.orientation], ["Training", candidate.training], ["I-9 / E-Verify", `${candidate.i9} / ${candidate.everify}`], ["CentralReach account", candidate.centralReach]]} /></TabsContent><TabsContent value="readiness"><InfoGrid rows={[["Availability", candidate.availability], ["Location", `${candidate.city}, ${candidate.state}`], ["Travel radius", `${candidate.travelRadius} miles`], ["Preferred hours", candidate.preferredHours], ["Ready for assignment", candidate.readinessStatus]]} /></TabsContent><TabsContent value="tasks"><div className="mt-4 space-y-3">{candidate.tasks.map((task) => <div key={task.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><span className="font-medium">{task.title}</span><Pill tone={task.completed ? "success" : "warning"}>{task.completed ? "Complete" : "Open"}</Pill></div><div className="mt-1 text-xs text-muted-foreground">{task.owner} · Due {task.due}</div></div>)}</div></TabsContent><TabsContent value="timeline"><div className="mt-4 space-y-3">{candidate.timeline.map((event) => <div key={event.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><span className="font-medium">{event.title}</span><span className="text-xs text-muted-foreground">{event.date}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.detail} · {event.actor}</p></div>)}</div></TabsContent></Tabs></SheetContent></Sheet>;
}
function InfoGrid({ rows }: { rows: Array<[string, string]> }) {
  return <div className="mt-4 grid gap-3 md:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-lg border bg-muted/20 p-3"><div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm">{value}</div></div>)}</div>;
}
