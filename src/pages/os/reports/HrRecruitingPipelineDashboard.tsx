import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2, Users, X,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KpiTile } from "@/components/dashboards/KpiTile";
import { ChartCard } from "@/components/dashboards/ChartCard";
import { parseAnyFile, SUPPORTED_EXTENSIONS } from "@/lib/os/dashboardEngine/excelParser";
import type { KpiSpec, ChartSpec, DrilldownSpec } from "@/lib/os/dashboardEngine/types";

/* ============================================================
 * HR · Recruiting Pipeline Dashboard
 * Upload Apploi / Monday / Orientation / Staffing exports and
 * instantly see the recruiting funnel, staffing needs, recruiter
 * performance, source quality, background checks, orientation,
 * hiring velocity and pipeline bottlenecks.
 * ============================================================ */

type Stage =
  | "Applied" | "Application Review" | "Interview Scheduled" | "Interview Completed"
  | "Offer Sent" | "Offer Accepted" | "Offer Declined" | "Onboarding"
  | "Background Check Pending" | "Background Check Complete"
  | "Orientation Scheduled" | "Orientation Complete"
  | "Ready for Staffing" | "Staffed"
  | "Inactive" | "Not Qualified" | "Withdrawn" | "Declined";

const STAGES: Stage[] = [
  "Applied", "Application Review", "Interview Scheduled", "Interview Completed",
  "Offer Sent", "Offer Accepted", "Offer Declined", "Onboarding",
  "Background Check Pending", "Background Check Complete",
  "Orientation Scheduled", "Orientation Complete",
  "Ready for Staffing", "Staffed",
  "Inactive", "Not Qualified", "Withdrawn", "Declined",
];

// Ordered funnel stages used for conversion math
const FUNNEL: Stage[] = [
  "Applied", "Interview Scheduled", "Interview Completed",
  "Offer Sent", "Offer Accepted", "Onboarding",
  "Orientation Scheduled", "Ready for Staffing", "Staffed",
];

const TERMINAL_NEG: Stage[] = ["Inactive", "Not Qualified", "Withdrawn", "Declined", "Offer Declined"];

interface CandidateRow {
  id: string;
  name: string;
  role: string;
  state: string;
  recruiter: string;
  source: string;
  applicationDate: string;     // ISO yyyy-mm-dd
  stage: Stage;
  interviewStatus: string;
  offerStatus: string;
  backgroundStatus: string;
  bgSubmittedDate: string;
  orientationDate: string;
  orientationStatus: string;
  staffingStatus: string;
  priority: string;
  notes: string;
  raw: Record<string, string>;
  // computed
  daysInPipeline: number;
  daysSinceBg: number;
  bottleneck: string | null;
}

interface StaffingNeedRow {
  id: string;
  state: string;
  client: string;
  certifiedRbt: number;
  nonCertifiedRbt: number;
  bcba: number;
  openCases: number;
  urgent: boolean;
  priority: string;
  daysOpen: number;
  fillRisk: "Low" | "Medium" | "High" | "Critical";
  status: string;
  raw: Record<string, string>;
}

/* ===================== HELPERS ===================== */

function normalizeHeader(h: string) { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function findHeader(headers: string[], candidates: string[]): string | null {
  const map = new Map(headers.map(h => [normalizeHeader(h), h]));
  for (const c of candidates) { const hit = map.get(normalizeHeader(c)); if (hit) return hit; }
  return null;
}
function num(v: string | undefined | null): number {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[$,]/g, ""));
  return isFinite(n) ? n : 0;
}
function fmtPct(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
function fmtNum(n: number, d = 0) { return isFinite(n) ? n.toFixed(d) : "—"; }
function parseDate(v: string | undefined | null): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}
function daysBetween(a: Date | null, b: Date = new Date()) {
  if (!a) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}
function isoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}
function downloadCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Map a raw status string to a standardized pipeline stage. */
function mapStage(raw: string): Stage {
  const s = (raw || "").toLowerCase().trim();
  if (!s) return "Applied";
  if (s.includes("staffed") || s.includes("assigned") || s.includes("placed")) return "Staffed";
  if (s.includes("ready") && s.includes("staff")) return "Ready for Staffing";
  if (s.includes("orientation") && (s.includes("complete") || s.includes("done") || s.includes("finished"))) return "Orientation Complete";
  if (s.includes("orientation")) return "Orientation Scheduled";
  if (s.includes("background") && (s.includes("complete") || s.includes("clear") || s.includes("pass"))) return "Background Check Complete";
  if (s.includes("background")) return "Background Check Pending";
  if (s.includes("onboard")) return "Onboarding";
  if (s.includes("offer") && s.includes("decline")) return "Offer Declined";
  if (s.includes("offer") && (s.includes("accept") || s.includes("signed") || s.includes("yes"))) return "Offer Accepted";
  if (s.includes("offer")) return "Offer Sent";
  if (s.includes("interview") && (s.includes("complete") || s.includes("done") || s.includes("finished"))) return "Interview Completed";
  if (s.includes("interview")) return "Interview Scheduled";
  if (s.includes("review") || s.includes("screen")) return "Application Review";
  if (s.includes("withdraw")) return "Withdrawn";
  if (s.includes("declin")) return "Declined";
  if (s.includes("not qualified") || s.includes("unqualified") || s.includes("reject")) return "Not Qualified";
  if (s.includes("inactive") || s.includes("closed") || s.includes("archive")) return "Inactive";
  if (s.includes("apply") || s.includes("applied") || s.includes("new")) return "Applied";
  return "Applied";
}

function fillRisk(daysOpen: number, urgent: boolean): StaffingNeedRow["fillRisk"] {
  if (urgent || daysOpen >= 30) return "Critical";
  if (daysOpen >= 14) return "High";
  if (daysOpen >= 7) return "Medium";
  return "Low";
}

const RISK_TONE: Record<StaffingNeedRow["fillRisk"], "success" | "warn" | "danger" | "default"> = {
  Low: "success", Medium: "warn", High: "danger", Critical: "danger",
};

/* ===================== PAGE ===================== */

export default function HrRecruitingPipelineDashboard() {
  const [files, setFiles] = useState<{ name: string; rows: number; kind: string }[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [needs, setNeeds] = useState<StaffingNeedRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const [candDrill, setCandDrill] = useState<CandidateRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ---- Upload (supports multiple files) ---- */
  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList || !fileList.length) return;
    setLoading(true);
    try {
      const newCands: CandidateRow[] = [];
      const newNeeds: StaffingNeedRow[] = [];
      const fileSummaries: { name: string; rows: number; kind: string }[] = [];
      const warns: string[] = [];

      for (const f of Array.from(fileList)) {
        const parsed = await parseAnyFile(f);
        const first = parsed[0];
        if (!first) { warns.push(`${f.name}: no data found.`); continue; }
        const headers = first.headers;

        // Try staffing need detection
        const clientH = findHeader(headers, ["Client", "ClientName", "Client Name", "Case", "CaseName"]);
        const certRbtH = findHeader(headers, ["CertifiedRBT", "Certified RBT", "RBTCertified", "RBT Hours Cert"]);
        const nonCertRbtH = findHeader(headers, ["NonCertifiedRBT", "Non Certified RBT", "RBTNonCertified"]);
        const bcbaNeedH = findHeader(headers, ["BCBANeed", "BCBA Need", "BCBA Hours", "BCBA"]);
        const openCasesH = findHeader(headers, ["OpenCases", "Open Cases", "Open"]);

        const looksLikeStaffing = !!clientH && (!!certRbtH || !!nonCertRbtH || !!bcbaNeedH || !!openCasesH);

        if (looksLikeStaffing) {
          const stateH = findHeader(headers, ["State", "Region", "Location"]);
          const urgentH = findHeader(headers, ["Urgent", "Priority", "UrgentCase"]);
          const priorityH = findHeader(headers, ["Priority", "PriorityLevel"]);
          const daysH = findHeader(headers, ["DaysOpen", "Days Open", "Age", "DaysPending"]);
          const statusH = findHeader(headers, ["Status", "CaseStatus"]);
          let nRows = 0;
          for (const r of first.rows) {
            const client = clientH ? r[clientH] : "";
            if (!client) continue;
            const urgentRaw = (urgentH ? r[urgentH] : "").toLowerCase();
            const urgent = urgentRaw.includes("urgent") || urgentRaw === "high" || urgentRaw === "yes" || urgentRaw === "true";
            const daysOpen = daysH ? num(r[daysH]) : 0;
            const need: StaffingNeedRow = {
              id: `${f.name}:${nRows}`,
              state: stateH ? r[stateH] : "",
              client,
              certifiedRbt: certRbtH ? num(r[certRbtH]) : 0,
              nonCertifiedRbt: nonCertRbtH ? num(r[nonCertRbtH]) : 0,
              bcba: bcbaNeedH ? num(r[bcbaNeedH]) : 0,
              openCases: openCasesH ? num(r[openCasesH]) : 1,
              urgent,
              priority: priorityH ? r[priorityH] : (urgent ? "High" : "Medium"),
              daysOpen,
              fillRisk: fillRisk(daysOpen, urgent),
              status: statusH ? r[statusH] : "Open",
              raw: r,
            };
            newNeeds.push(need); nRows++;
          }
          fileSummaries.push({ name: f.name, rows: nRows, kind: "Staffing Needs" });
          continue;
        }

        // Candidate detection
        const nameH = findHeader(headers, ["CandidateName", "Candidate Name", "Name", "ApplicantName", "Full Name", "FullName"]);
        const fnH = findHeader(headers, ["FirstName", "First Name"]);
        const lnH = findHeader(headers, ["LastName", "Last Name"]);
        const idH = findHeader(headers, ["CandidateId", "Candidate ID", "ApplicantId", "Applicant ID", "Id", "ID"]);
        const roleH = findHeader(headers, ["Role", "Position", "JobTitle", "Job Title", "AppliedFor", "Applied For"]);
        const stateH = findHeader(headers, ["State", "Location", "Region"]);
        const recruiterH = findHeader(headers, ["Recruiter", "Owner", "AssignedTo", "Assigned To", "Coordinator"]);
        const sourceH = findHeader(headers, ["Source", "ApplicationSource", "JobBoard", "Job Board", "LeadSource"]);
        const appDateH = findHeader(headers, ["ApplicationDate", "Application Date", "AppliedDate", "Applied Date", "Date Applied", "CreatedDate", "Created Date"]);
        const stageH = findHeader(headers, ["Stage", "Status", "PipelineStage", "Pipeline Stage", "CurrentStage", "Current Stage"]);
        const intH = findHeader(headers, ["InterviewStatus", "Interview Status", "Interview"]);
        const offH = findHeader(headers, ["OfferStatus", "Offer Status", "Offer"]);
        const bgH = findHeader(headers, ["BackgroundStatus", "Background Status", "BackgroundCheck", "Background Check"]);
        const bgDateH = findHeader(headers, ["BackgroundDate", "BackgroundSubmitted", "Background Submitted", "BackgroundSubmittedDate"]);
        const orientDateH = findHeader(headers, ["OrientationDate", "Orientation Date"]);
        const orientStatusH = findHeader(headers, ["OrientationStatus", "Orientation Status", "Orientation"]);
        const staffH = findHeader(headers, ["StaffingStatus", "Staffing Status", "Placement", "PlacementStatus"]);
        const prioH = findHeader(headers, ["Priority", "Tier"]);
        const notesH = findHeader(headers, ["Notes", "Note", "Comment", "Comments"]);

        if (!nameH && !(fnH && lnH)) {
          warns.push(`${f.name}: no candidate name column detected — skipped.`);
          continue;
        }

        const today = new Date();
        let nRows = 0;
        for (const r of first.rows) {
          const name = nameH ? r[nameH] : `${fnH ? r[fnH] : ""} ${lnH ? r[lnH] : ""}`.trim();
          if (!name) continue;
          const id = idH ? r[idH] : `${f.name}:${nRows}`;
          const stageRaw = stageH ? r[stageH] : (staffH ? r[staffH] : (orientStatusH ? r[orientStatusH] : ""));
          const stage = mapStage(stageRaw);
          const appDate = parseDate(appDateH ? r[appDateH] : "");
          const bgDate = parseDate(bgDateH ? r[bgDateH] : "");
          const orientDate = parseDate(orientDateH ? r[orientDateH] : "");
          const cand: CandidateRow = {
            id,
            name,
            role: roleH ? r[roleH] : "",
            state: stateH ? r[stateH] : "",
            recruiter: recruiterH ? r[recruiterH] : "",
            source: sourceH ? r[sourceH] : "",
            applicationDate: isoDate(appDate),
            stage,
            interviewStatus: intH ? r[intH] : "",
            offerStatus: offH ? r[offH] : "",
            backgroundStatus: bgH ? r[bgH] : "",
            bgSubmittedDate: isoDate(bgDate),
            orientationDate: isoDate(orientDate),
            orientationStatus: orientStatusH ? r[orientStatusH] : "",
            staffingStatus: staffH ? r[staffH] : "",
            priority: prioH ? r[prioH] : "",
            notes: notesH ? r[notesH] : "",
            raw: r,
            daysInPipeline: daysBetween(appDate, today),
            daysSinceBg: daysBetween(bgDate, today),
            bottleneck: null,
          };
          newCands.push(cand); nRows++;
        }
        fileSummaries.push({ name: f.name, rows: nRows, kind: "Candidates" });
      }

      const missing: string[] = [];
      if (newCands.length === 0 && newNeeds.length === 0) missing.push("Candidate Name or Staffing Need (Client) column");

      setMissingFields(missing);
      setWarnings(warns);
      setCandidates(prev => [...prev, ...newCands]);
      setNeeds(prev => [...prev, ...newNeeds]);
      setFiles(prev => [...prev, ...fileSummaries]);
      setGenerated(false);
      toast.success(`Loaded ${newCands.length} candidate${newCands.length === 1 ? "" : "s"} and ${newNeeds.length} staffing need${newNeeds.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetUpload() {
    setFiles([]); setCandidates([]); setNeeds([]);
    setMissingFields([]); setWarnings([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Compute bottlenecks per candidate ---- */
  const enriched = useMemo<CandidateRow[]>(() => {
    return candidates.map(c => {
      let bn: string | null = null;
      if (c.daysInPipeline >= 30 && !["Staffed", "Inactive", "Withdrawn", "Declined", "Not Qualified"].includes(c.stage))
        bn = "Open >30 days";
      else if (c.daysInPipeline >= 14 && !["Staffed", "Inactive", "Withdrawn", "Declined", "Not Qualified"].includes(c.stage))
        bn = "Open >14 days";
      if (c.stage === "Interview Scheduled" && c.daysInPipeline >= 7) bn = "Interview not completed";
      if (c.stage === "Offer Sent" && c.daysInPipeline >= 5) bn = "Offer awaiting signature";
      if (c.stage === "Background Check Pending" && c.daysSinceBg >= 14) bn = "Background check >14 days";
      else if (c.stage === "Background Check Pending" && c.daysSinceBg >= 7) bn = "Background check >7 days";
      if (c.stage === "Orientation Scheduled" && c.daysInPipeline >= 14) bn = "Orientation pending >14 days";
      if (c.stage === "Ready for Staffing" && c.daysInPipeline >= 7) bn = "Awaiting staffing assignment";
      return { ...c, bottleneck: bn };
    });
  }, [candidates]);

  /* ---- Filter options ---- */
  const states = useMemo(() => Array.from(new Set(enriched.map(c => c.state).filter(Boolean))).sort(), [enriched]);
  const recruiters = useMemo(() => Array.from(new Set(enriched.map(c => c.recruiter).filter(Boolean))).sort(), [enriched]);
  const sources = useMemo(() => Array.from(new Set(enriched.map(c => c.source).filter(Boolean))).sort(), [enriched]);
  const positions = useMemo(() => Array.from(new Set(enriched.map(c => c.role).filter(Boolean))).sort(), [enriched]);
  const priorities = useMemo(() => Array.from(new Set(enriched.map(c => c.priority).filter(Boolean))).sort(), [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter(c => {
      if (search) {
        const s = search.toLowerCase();
        if (!c.name.toLowerCase().includes(s) && !c.id.toLowerCase().includes(s)
            && !c.role.toLowerCase().includes(s)) return false;
      }
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (recruiterFilter !== "all" && c.recruiter !== recruiterFilter) return false;
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (positionFilter !== "all" && c.role !== positionFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      return true;
    });
  }, [enriched, search, stageFilter, stateFilter, recruiterFilter, sourceFilter, positionFilter, priorityFilter]);

  /* ---- Aggregates over filtered set ---- */
  const agg = useMemo(() => {
    const total = filtered.length;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);
    const stageCount: Record<string, number> = {};
    for (const s of STAGES) stageCount[s] = 0;
    for (const c of filtered) stageCount[c.stage]++;
    const appliedThisWeek = filtered.filter(c => { const d = parseDate(c.applicationDate); return d && d >= weekAgo; }).length;
    const appliedThisMonth = filtered.filter(c => { const d = parseDate(c.applicationDate); return d && d >= monthAgo; }).length;
    const offersSent = stageCount["Offer Sent"] + stageCount["Offer Accepted"] + stageCount["Offer Declined"];
    const offersAccepted = stageCount["Offer Accepted"];
    const offerAcceptRate = offersSent > 0 ? offersAccepted / offersSent : 0;
    const inOnboarding = stageCount["Onboarding"] + stageCount["Background Check Pending"] + stageCount["Background Check Complete"];
    const bgPending = stageCount["Background Check Pending"];
    const orientationScheduled = stageCount["Orientation Scheduled"];
    const readyForStaffing = stageCount["Ready for Staffing"];
    const interviewsScheduled = stageCount["Interview Scheduled"] + stageCount["Interview Completed"];
    const interviewsCompleted = stageCount["Interview Completed"];
    const hired = stageCount["Staffed"];
    const totalApplied = filtered.length - filtered.filter(c => TERMINAL_NEG.includes(c.stage)).length;
    const conversion = totalApplied > 0 ? hired / totalApplied : 0;
    const avgTimeToHire = (() => {
      const placed = filtered.filter(c => c.stage === "Staffed" && c.daysInPipeline > 0);
      if (!placed.length) return 0;
      return placed.reduce((s, c) => s + c.daysInPipeline, 0) / placed.length;
    })();
    return {
      total, stageCount, appliedThisWeek, appliedThisMonth,
      interviewsScheduled, interviewsCompleted,
      offersSent, offersAccepted, offerAcceptRate,
      inOnboarding, bgPending, orientationScheduled, readyForStaffing,
      hired, conversion, avgTimeToHire,
    };
  }, [filtered]);

  /* ---- KPIs ---- */
  const CAND_COLS = ["Candidate", "Role", "State", "Recruiter", "Stage", "Source", "Days", "Priority"];
  function candRow(c: CandidateRow): (string | number)[] {
    return [c.name, c.role || "—", c.state || "—", c.recruiter || "—", c.stage, c.source || "—", c.daysInPipeline, c.priority || "—"];
  }

  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    const inStage = (s: Stage) => filtered.filter(c => c.stage === s);
    return [
      { id: "applicants", label: "New Applicants", value: String(agg.total), raw: agg.total, hint: "All candidates loaded", tone: "default",
        drilldown: { title: "All applicants", columns: CAND_COLS, rows: filtered.map(candRow) } },
      { id: "week", label: "Applicants This Week", value: String(agg.appliedThisWeek), raw: agg.appliedThisWeek, hint: "Last 7 days", tone: "default" },
      { id: "month", label: "Applicants This Month", value: String(agg.appliedThisMonth), raw: agg.appliedThisMonth, hint: "Last 30 days", tone: "default" },
      { id: "intsched", label: "Interviews Scheduled", value: String(agg.interviewsScheduled), raw: agg.interviewsScheduled, hint: "Scheduled + completed", tone: "default",
        drilldown: { title: "Interview pipeline", columns: CAND_COLS, rows: filtered.filter(c => c.stage === "Interview Scheduled" || c.stage === "Interview Completed").map(candRow) } },
      { id: "intdone", label: "Interviews Completed", value: String(agg.interviewsCompleted), raw: agg.interviewsCompleted, hint: "Completed only", tone: "default",
        drilldown: { title: "Interviews completed", columns: CAND_COLS, rows: inStage("Interview Completed").map(candRow) } },
      { id: "offsent", label: "Offers Sent", value: String(agg.offersSent), raw: agg.offersSent, hint: "Sent + decided", tone: "default" },
      { id: "offacc", label: "Offers Accepted", value: String(agg.offersAccepted), raw: agg.offersAccepted, hint: "Signed offers", tone: "success",
        drilldown: { title: "Offers accepted", columns: CAND_COLS, rows: inStage("Offer Accepted").map(candRow) } },
      { id: "accrate", label: "Offer Acceptance Rate", value: fmtPct(agg.offerAcceptRate), raw: agg.offerAcceptRate, hint: "Accepted ÷ sent", tone: agg.offerAcceptRate >= 0.75 ? "success" : agg.offerAcceptRate >= 0.5 ? "warn" : "danger" },
      { id: "onboard", label: "Candidates in Onboarding", value: String(agg.inOnboarding), raw: agg.inOnboarding, hint: "Onboarding + background", tone: "default",
        drilldown: { title: "Onboarding", columns: CAND_COLS, rows: filtered.filter(c => c.stage === "Onboarding" || c.stage === "Background Check Pending" || c.stage === "Background Check Complete").map(candRow) } },
      { id: "bgpend", label: "Background Checks Pending", value: String(agg.bgPending), raw: agg.bgPending, hint: "Awaiting result", tone: agg.bgPending ? "warn" : "success",
        drilldown: { title: "Background pending", columns: CAND_COLS, rows: inStage("Background Check Pending").map(candRow) } },
      { id: "orient", label: "Orientation Scheduled", value: String(agg.orientationScheduled), raw: agg.orientationScheduled, hint: "Upcoming orientation", tone: "default",
        drilldown: { title: "Orientation scheduled", columns: CAND_COLS, rows: inStage("Orientation Scheduled").map(candRow) } },
      { id: "ready", label: "Ready for Staffing", value: String(agg.readyForStaffing), raw: agg.readyForStaffing, hint: "Awaiting placement", tone: agg.readyForStaffing ? "success" : "default",
        drilldown: { title: "Ready for staffing", columns: CAND_COLS, rows: inStage("Ready for Staffing").map(candRow) } },
      { id: "needs", label: "Active Staffing Needs", value: String(needs.length), raw: needs.length, hint: "Open client cases", tone: needs.length ? "warn" : "success" },
      { id: "tth", label: "Avg Time to Hire", value: agg.avgTimeToHire ? `${fmtNum(agg.avgTimeToHire, 1)} days` : "—", raw: agg.avgTimeToHire, hint: "Apply → staffed", tone: agg.avgTimeToHire && agg.avgTimeToHire <= 30 ? "success" : "warn" },
      { id: "conv", label: "Pipeline Conversion", value: fmtPct(agg.conversion), raw: agg.conversion, hint: "Staffed ÷ active", tone: agg.conversion >= 0.25 ? "success" : "warn" },
      { id: "rscore", label: "Recruiter Performance", value: agg.offersAccepted > 0 ? fmtPct(Math.min(1, (agg.offersAccepted / Math.max(1, agg.offersSent)) * (agg.hired / Math.max(1, agg.total)) * 4)) : "—", raw: 0, hint: "Composite score", tone: "default" },
    ];
  }, [generated, filtered, agg, needs]);

  /* ---- Funnel ---- */
  const funnel = useMemo(() => {
    const counts = FUNNEL.map(s => ({ stage: s, count: filtered.filter(c => c.stage === s).length }));
    const top = counts[0].count || 1;
    return counts.map((row, i) => {
      const prev = i === 0 ? row.count : counts[i - 1].count;
      const conv = prev > 0 ? row.count / prev : 0;
      const drop = prev > 0 ? 1 - conv : 0;
      const avgDays = (() => {
        const inStage = filtered.filter(c => c.stage === row.stage);
        if (!inStage.length) return 0;
        return inStage.reduce((s, c) => s + c.daysInPipeline, 0) / inStage.length;
      })();
      return { ...row, conv, drop, pct: row.count / top, avgDays };
    });
  }, [filtered]);

  /* ---- Recruiter & Source perf ---- */
  const recruiterPerf = useMemo(() => {
    const map = new Map<string, { name: string; applications: number; interviews: number; offers: number; accepted: number; hired: number; pipeline: number; days: number[] }>();
    for (const c of filtered) {
      const k = c.recruiter || "Unassigned";
      const cur = map.get(k) || { name: k, applications: 0, interviews: 0, offers: 0, accepted: 0, hired: 0, pipeline: 0, days: [] };
      cur.applications++;
      if (c.stage === "Interview Scheduled" || c.stage === "Interview Completed") cur.interviews++;
      if (c.stage === "Offer Sent" || c.stage === "Offer Accepted" || c.stage === "Offer Declined") cur.offers++;
      if (c.stage === "Offer Accepted") cur.accepted++;
      if (c.stage === "Staffed") { cur.hired++; if (c.daysInPipeline) cur.days.push(c.daysInPipeline); }
      if (!TERMINAL_NEG.includes(c.stage) && c.stage !== "Staffed") cur.pipeline++;
      map.set(k, cur);
    }
    return [...map.values()].map(v => ({
      ...v,
      conv: v.applications > 0 ? v.hired / v.applications : 0,
      avgTth: v.days.length ? v.days.reduce((s, n) => s + n, 0) / v.days.length : 0,
      acceptRate: v.offers > 0 ? v.accepted / v.offers : 0,
    })).sort((a, b) => b.applications - a.applications);
  }, [filtered]);

  const sourcePerf = useMemo(() => {
    const map = new Map<string, { name: string; applicants: number; interviews: number; offers: number; hires: number }>();
    for (const c of filtered) {
      const k = c.source || "Unknown";
      const cur = map.get(k) || { name: k, applicants: 0, interviews: 0, offers: 0, hires: 0 };
      cur.applicants++;
      if (c.stage === "Interview Scheduled" || c.stage === "Interview Completed") cur.interviews++;
      if (c.stage === "Offer Sent" || c.stage === "Offer Accepted") cur.offers++;
      if (c.stage === "Staffed") cur.hires++;
      map.set(k, cur);
    }
    return [...map.values()].map(v => ({ ...v, conv: v.applicants > 0 ? v.hires / v.applicants : 0 }))
      .sort((a, b) => b.applicants - a.applicants);
  }, [filtered]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || filtered.length === 0) return [];
    // By state
    const stateMap = new Map<string, { apps: number; hires: number; ready: number }>();
    for (const c of filtered) {
      const k = c.state || "Unknown";
      const cur = stateMap.get(k) || { apps: 0, hires: 0, ready: 0 };
      cur.apps++;
      if (c.stage === "Staffed") cur.hires++;
      if (c.stage === "Ready for Staffing") cur.ready++;
      stateMap.set(k, cur);
    }
    const stateRows = [...stateMap.entries()].sort((a, b) => b[1].apps - a[1].apps);

    // Stage distribution
    const stageRows = STAGES.map(s => [s, filtered.filter(c => c.stage === s).length] as [string, number])
      .filter(([, n]) => n > 0);

    return [
      { id: "funnel", title: "Recruiting Funnel", type: "bar", span: 2,
        labels: FUNNEL,
        series: [{ name: "Candidates", data: FUNNEL.map(s => filtered.filter(c => c.stage === s).length) }] },
      { id: "state", title: "Applicants by State", type: "bar",
        labels: stateRows.map(([k]) => k),
        series: [
          { name: "Applicants", data: stateRows.map(([, v]) => v.apps) },
          { name: "Hires", data: stateRows.map(([, v]) => v.hires) },
        ] },
      { id: "stagepie", title: "Pipeline Stage Distribution", type: "pie",
        labels: stageRows.map(([s]) => s),
        series: [{ name: "Candidates", data: stageRows.map(([, n]) => n) }] },
      { id: "recruiter", title: "Recruiter Volume", type: "bar",
        labels: recruiterPerf.slice(0, 8).map(r => r.name),
        series: [
          { name: "Applications", data: recruiterPerf.slice(0, 8).map(r => r.applications) },
          { name: "Hires", data: recruiterPerf.slice(0, 8).map(r => r.hired) },
        ] },
      { id: "source", title: "Source Performance", type: "bar",
        labels: sourcePerf.slice(0, 8).map(s => s.name),
        series: [
          { name: "Applicants", data: sourcePerf.slice(0, 8).map(s => s.applicants) },
          { name: "Hires", data: sourcePerf.slice(0, 8).map(s => s.hires) },
        ] },
    ];
  }, [generated, filtered, recruiterPerf, sourcePerf]);

  /* ---- Alerts / bottlenecks ---- */
  const alerts = useMemo(() => {
    const items: { title: string; count: number; tone: "warn" | "danger"; rows: CandidateRow[] }[] = [];
    const intPending = filtered.filter(c => c.stage === "Interview Scheduled" && c.daysInPipeline >= 7);
    if (intPending.length) items.push({ title: "Interviews not completed (>7d)", count: intPending.length, tone: "warn", rows: intPending });
    const offPending = filtered.filter(c => c.stage === "Offer Sent" && c.daysInPipeline >= 5);
    if (offPending.length) items.push({ title: "Offers awaiting signature (>5d)", count: offPending.length, tone: "warn", rows: offPending });
    const bgSlow = filtered.filter(c => c.stage === "Background Check Pending" && c.daysSinceBg >= 7);
    if (bgSlow.length) items.push({ title: "Background checks delayed (>7d)", count: bgSlow.length, tone: "warn", rows: bgSlow });
    const bgCritical = filtered.filter(c => c.stage === "Background Check Pending" && c.daysSinceBg >= 14);
    if (bgCritical.length) items.push({ title: "Background checks critical (>14d)", count: bgCritical.length, tone: "danger", rows: bgCritical });
    const orientStuck = filtered.filter(c => c.stage === "Orientation Scheduled" && c.daysInPipeline >= 14);
    if (orientStuck.length) items.push({ title: "Orientation pending >14d", count: orientStuck.length, tone: "warn", rows: orientStuck });
    const readyStuck = filtered.filter(c => c.stage === "Ready for Staffing" && c.daysInPipeline >= 7);
    if (readyStuck.length) items.push({ title: "Ready candidates awaiting staffing (>7d)", count: readyStuck.length, tone: "warn", rows: readyStuck });
    const open30 = filtered.filter(c => c.daysInPipeline >= 30 && !TERMINAL_NEG.includes(c.stage) && c.stage !== "Staffed");
    if (open30.length) items.push({ title: "Open more than 30 days", count: open30.length, tone: "danger", rows: open30 });
    const urgentNeeds = needs.filter(n => n.fillRisk === "Critical" || n.fillRisk === "High");
    if (urgentNeeds.length) items.push({ title: "Urgent staffing needs", count: urgentNeeds.length, tone: "danger", rows: [] });
    return items;
  }, [filtered, needs]);

  /* ---- AI Insights ---- */
  const insights = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    out.push(`${filtered.length} candidate${filtered.length === 1 ? "" : "s"} currently in the pipeline.`);
    if (agg.appliedThisMonth) out.push(`${agg.appliedThisMonth} applicant${agg.appliedThisMonth === 1 ? "" : "s"} applied in the last 30 days.`);
    // top state by needs
    if (needs.length) {
      const m = new Map<string, number>();
      for (const n of needs) m.set(n.state || "Unknown", (m.get(n.state || "Unknown") || 0) + n.openCases);
      const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) out.push(`${top[0]} currently has the highest staffing demand (${top[1]} open cases).`);
    }
    if (agg.offersSent) out.push(`Offer acceptance rate is ${fmtPct(agg.offerAcceptRate)} across ${agg.offersSent} offer${agg.offersSent === 1 ? "" : "s"}.`);
    const stuck = filtered.filter(c => c.daysInPipeline >= 14 && !TERMINAL_NEG.includes(c.stage) && c.stage !== "Staffed").length;
    if (stuck) out.push(`${stuck} candidate${stuck === 1 ? " has" : "s have"} been waiting more than 14 days.`);
    if (sourcePerf.length) {
      const top = sourcePerf[0];
      const pct = filtered.length > 0 ? top.applicants / filtered.length : 0;
      out.push(`${top.name} generated ${fmtPct(pct)} of all applicants.`);
    }
    const urgent = needs.filter(n => n.fillRisk === "Critical").length;
    if (urgent) out.push(`${urgent} urgent staffing case${urgent === 1 ? "" : "s"} require${urgent === 1 ? "s" : ""} immediate attention.`);
    if (agg.avgTimeToHire) out.push(`Average time to hire is ${fmtNum(agg.avgTimeToHire, 1)} days for placed candidates.`);
    return out;
  }, [generated, filtered, agg, needs, sourcePerf]);

  /* ---- Exports ---- */
  function exportPipeline() {
    downloadCsv("recruiting-pipeline.csv",
      ["Stage", "Count", "Conversion %", "Drop-off %", "Avg Days"],
      funnel.map(f => [f.stage, f.count, fmtPct(f.conv), fmtPct(f.drop), fmtNum(f.avgDays, 1)]));
    toast.success("Pipeline exported");
  }
  function exportCandidates() {
    downloadCsv("recruiting-candidates.csv",
      ["Candidate", "Role", "State", "Recruiter", "Source", "Application Date", "Stage", "Interview", "Offer", "Background", "Orientation", "Staffing", "Days", "Priority"],
      filtered.map(c => [c.name, c.role, c.state, c.recruiter, c.source, c.applicationDate, c.stage,
        c.interviewStatus, c.offerStatus, c.backgroundStatus, c.orientationStatus, c.staffingStatus, c.daysInPipeline, c.priority]));
    toast.success("Candidates exported");
  }
  function exportNeeds() {
    downloadCsv("staffing-needs.csv",
      ["Client", "State", "Cert RBT", "Non-Cert RBT", "BCBA", "Open Cases", "Days Open", "Priority", "Fill Risk", "Status"],
      needs.map(n => [n.client, n.state, n.certifiedRbt, n.nonCertifiedRbt, n.bcba, n.openCases, n.daysOpen, n.priority, n.fillRisk, n.status]));
    toast.success("Staffing needs exported");
  }
  function exportRecruiters() {
    downloadCsv("recruiter-performance.csv",
      ["Recruiter", "Applications", "Interviews", "Offers", "Accepted", "Hired", "In Pipeline", "Conversion %", "Acceptance %", "Avg Time To Hire"],
      recruiterPerf.map(r => [r.name, r.applications, r.interviews, r.offers, r.accepted, r.hired, r.pipeline, fmtPct(r.conv), fmtPct(r.acceptRate), fmtNum(r.avgTth, 1)]));
    toast.success("Recruiter performance exported");
  }
  function exportVelocity() {
    const placed = filtered.filter(c => c.stage === "Staffed");
    downloadCsv("hiring-velocity.csv",
      ["Candidate", "State", "Recruiter", "Source", "Application Date", "Days To Hire"],
      placed.map(c => [c.name, c.state, c.recruiter, c.source, c.applicationDate, c.daysInPipeline]));
    toast.success("Hiring velocity exported");
  }
  function copyRecruitingSummary() {
    const lines = [
      `Recruiting Pipeline Dashboard — ${files.map(f => f.name).join(", ")}`,
      `Candidates: ${filtered.length} · Hired: ${agg.hired} · Conversion: ${fmtPct(agg.conversion)}`,
      `Offers sent: ${agg.offersSent} · Accepted: ${agg.offersAccepted} (${fmtPct(agg.offerAcceptRate)})`,
      `In onboarding: ${agg.inOnboarding} · Background pending: ${agg.bgPending}`,
      `Ready for staffing: ${agg.readyForStaffing} · Active staffing needs: ${needs.length}`,
      agg.avgTimeToHire ? `Average time to hire: ${fmtNum(agg.avgTimeToHire, 1)} days` : "",
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Recruiting summary copied");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.hr.recruiting.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        files: files.map(f => f.name),
        filters: { stageFilter, stateFilter, recruiterFilter, sourceFilter, positionFilter, priorityFilter },
        kpis: {
          total: filtered.length, hired: agg.hired, conversion: agg.conversion,
          offerAcceptRate: agg.offerAcceptRate, openNeeds: needs.length,
        },
      });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success("Snapshot saved");
    } catch { toast.error("Could not save snapshot"); }
  }

  /* ===================== RENDER ===================== */

  return (
    <OSShell>
      <div className="flex items-center gap-3">
        <Link to="/reports" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <div>
          <Badge variant="secondary" className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
            HR · Featured Dashboard
          </Badge>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Recruiting Pipeline Dashboard</h1>
          <p className="text-[12.5px] text-muted-foreground">
            Recruiting command center for applicants, interviews, offers, onboarding, staffing needs, recruiter performance and hiring bottlenecks.
          </p>
        </div>
      </div>

      {/* Upload */}
      <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-[0_20px_50px_-30px_hsl(265_60%_50%/0.25)]">
        {files.length === 0 ? (
          <UploadDropzone inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} onFiles={handleFiles} loading={loading} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {files.map(f => (
                  <span key={f.name} className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-1.5 text-[11.5px]">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                    <span className="font-medium">{f.name}</span>
                    <Badge variant="secondary" className="rounded-full bg-card text-[10px]">{f.kind} · {f.rows}</Badge>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Add file
                </Button>
                <Button variant="ghost" size="sm" onClick={resetUpload}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all
                </Button>
                <input ref={inputRef} type="file" multiple className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => handleFiles(e.target.files)} />
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <ul className="text-[12px] leading-snug space-y-0.5">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {missingFields.length > 0 ? (
              <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 p-4">
                <div className="flex items-start gap-2 text-rose-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div className="text-[12.5px] leading-snug">
                    <p className="font-semibold">Unable to generate. Missing: {missingFields.join(", ")}.</p>
                    <p className="mt-1 text-rose-600/80">Upload an Apploi, Monday Recruiting, Orientation, Background Check, or Staffing export.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("Recruiting dashboard generated"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Recruiting Dashboard
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Dashboard */}
      {generated && (filtered.length > 0 || needs.length > 0) && (
        <>
          {/* KPIs */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(k => <KpiTile key={k.id} kpi={k} onClick={(kpi) => kpi.drilldown && setDrill(kpi.drilldown)} />)}
          </section>

          {/* Insights + Export */}
          <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
                  <Brain className="h-3.5 w-3.5" />
                </span>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">AI Insights</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-[12.5px] leading-snug">
                {insights.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(265_70%_55%)]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Export</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={exportPipeline}><Download className="mr-1 h-3.5 w-3.5" />Pipeline</Button>
                <Button variant="outline" size="sm" onClick={exportCandidates}><Download className="mr-1 h-3.5 w-3.5" />Candidates</Button>
                <Button variant="outline" size="sm" onClick={exportNeeds}><Download className="mr-1 h-3.5 w-3.5" />Staffing Needs</Button>
                <Button variant="outline" size="sm" onClick={exportRecruiters}><Download className="mr-1 h-3.5 w-3.5" />Recruiters</Button>
                <Button variant="outline" size="sm" onClick={exportVelocity}><Download className="mr-1 h-3.5 w-3.5" />Hiring Velocity</Button>
                <Button variant="outline" size="sm" onClick={copyRecruitingSummary}><Users className="mr-1 h-3.5 w-3.5" />Copy Summary</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot} className="col-span-2"><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Funnel */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">Recruiting Funnel</h2>
                <p className="text-[11.5px] text-muted-foreground">Click a stage to drill into candidates.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {funnel.map((f, i) => (
                <button key={f.stage} onClick={() => setDrill({ title: `${f.stage} · ${f.count} candidates`, columns: CAND_COLS, rows: filtered.filter(c => c.stage === f.stage).map(candRow) })}
                  className="w-full rounded-xl border border-border/50 p-3 text-left transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.6)] hover:shadow-[0_12px_28px_-18px_hsl(265_60%_50%/0.35)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
                    <span className="font-medium">{f.stage}</span>
                    <div className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
                      <span className="tabular-nums text-foreground font-semibold">{f.count}</span>
                      {i > 0 && <span>Conv {fmtPct(f.conv)}</span>}
                      {i > 0 && <span>Drop {fmtPct(f.drop)}</span>}
                      {f.avgDays > 0 && <span>Avg {fmtNum(f.avgDays, 1)}d</span>}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-[hsl(265_70%_55%)]" style={{ width: `${Math.min(100, f.pct * 100)}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Charts */}
          {charts.length > 0 && (
            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              {charts.map(c => <ChartCard key={c.id} chart={c} />)}
            </section>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {alerts.map((a, i) => (
                <button key={i} onClick={() => a.rows.length && setDrill({ title: a.title, columns: CAND_COLS, rows: a.rows.map(candRow) })}
                  className={cn("rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-0.5",
                    a.tone === "danger" ? "border-rose-200/70 hover:shadow-[0_12px_28px_-18px_hsl(0_70%_50%/0.4)]" : "border-amber-200/70 hover:shadow-[0_12px_28px_-18px_hsl(40_80%_50%/0.4)]")}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn("h-3.5 w-3.5", a.tone === "danger" ? "text-rose-600" : "text-amber-600")} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Alert</p>
                  </div>
                  <p className="mt-2 text-[13px] font-medium tracking-tight">{a.title}</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums">{a.count}</p>
                </button>
              ))}
            </section>
          )}

          {/* Staffing Needs */}
          {needs.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Active Staffing Needs</h2>
              <p className="text-[11.5px] text-muted-foreground">{needs.length} open case{needs.length === 1 ? "" : "s"} · prioritized by risk</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-2 py-2">Client</th>
                      <th className="px-2 py-2">State</th>
                      <th className="px-2 py-2 text-right">Cert RBT</th>
                      <th className="px-2 py-2 text-right">Non-Cert RBT</th>
                      <th className="px-2 py-2 text-right">BCBA</th>
                      <th className="px-2 py-2 text-right">Open</th>
                      <th className="px-2 py-2 text-right">Days</th>
                      <th className="px-2 py-2">Priority</th>
                      <th className="px-2 py-2">Fill Risk</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...needs].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.daysOpen - a.daysOpen).map(n => (
                      <tr key={n.id} className="border-b border-border/40 hover:bg-secondary/40">
                        <td className="px-2 py-2 font-medium">{n.client}</td>
                        <td className="px-2 py-2 text-muted-foreground">{n.state || "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{n.certifiedRbt || "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{n.nonCertifiedRbt || "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{n.bcba || "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{n.openCases}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{n.daysOpen}</td>
                        <td className="px-2 py-2">{n.priority}</td>
                        <td className="px-2 py-2"><StatusBadge tone={RISK_TONE[n.fillRisk]}>{n.fillRisk}</StatusBadge></td>
                        <td className="px-2 py-2 text-muted-foreground">{n.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Candidates table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">Candidate Pipeline</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {enriched.length} candidates</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, role…" className="h-8 w-[220px] pl-8 text-[12px]" />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue placeholder="Stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {states.length > 0 && (
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="h-8 w-[120px] text-[12px]"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {recruiters.length > 0 && (
                  <Select value={recruiterFilter} onValueChange={setRecruiterFilter}>
                    <SelectTrigger className="h-8 w-[150px] text-[12px]"><SelectValue placeholder="Recruiter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All recruiters</SelectItem>
                      {recruiters.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {sources.length > 0 && (
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {positions.length > 0 && (
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Position" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All positions</SelectItem>
                      {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {priorities.length > 0 && (
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-[12px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Candidate</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Recruiter</th>
                    <th className="px-2 py-2">Source</th>
                    <th className="px-2 py-2">Applied</th>
                    <th className="px-2 py-2">Stage</th>
                    <th className="px-2 py-2">Background</th>
                    <th className="px-2 py-2">Orientation</th>
                    <th className="px-2 py-2 text-right">Days</th>
                    <th className="px-2 py-2">Bottleneck</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 300).map(c => (
                    <tr key={c.id + c.name} onClick={() => setCandDrill(c)}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2"><div className="font-medium">{c.name}</div><div className="text-[10.5px] text-muted-foreground">{c.id}</div></td>
                      <td className="px-2 py-2 text-muted-foreground">{c.role || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.state || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.recruiter || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.source || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.applicationDate || "—"}</td>
                      <td className="px-2 py-2">{c.stage}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.backgroundStatus || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{c.orientationStatus || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{c.daysInPipeline}</td>
                      <td className="px-2 py-2">{c.bottleneck ? <StatusBadge tone="warn">{c.bottleneck}</StatusBadge> : <span className="text-muted-foreground">—</span>}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No candidates match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
              {filtered.length > 300 && (
                <p className="mt-2 text-[11px] text-muted-foreground">Showing first 300 of {filtered.length}. Export the full list for review.</p>
              )}
            </div>
          </section>

          {/* Recruiter performance */}
          {recruiterPerf.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Recruiter Performance</h2>
              <p className="text-[11.5px] text-muted-foreground">Volume, conversion and offer acceptance by recruiter.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-2 py-2">Recruiter</th>
                      <th className="px-2 py-2 text-right">Applications</th>
                      <th className="px-2 py-2 text-right">Interviews</th>
                      <th className="px-2 py-2 text-right">Offers</th>
                      <th className="px-2 py-2 text-right">Accepted</th>
                      <th className="px-2 py-2 text-right">Hired</th>
                      <th className="px-2 py-2 text-right">In Pipeline</th>
                      <th className="px-2 py-2 text-right">Conversion</th>
                      <th className="px-2 py-2 text-right">Acceptance</th>
                      <th className="px-2 py-2 text-right">Avg TTH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterPerf.map(r => (
                      <tr key={r.name} className="border-b border-border/40 hover:bg-secondary/40">
                        <td className="px-2 py-2 font-medium">{r.name}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.applications}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.interviews}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.offers}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.accepted}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.hired}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.pipeline}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{fmtPct(r.conv)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{fmtPct(r.acceptRate)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{r.avgTth ? `${fmtNum(r.avgTth, 1)}d` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Source performance */}
          {sourcePerf.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Source Performance</h2>
              <p className="text-[11.5px] text-muted-foreground">Effectiveness of each recruiting source.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sourcePerf.map(s => (
                  <button key={s.name} onClick={() => setDrill({ title: `${s.name} · candidates`, columns: CAND_COLS, rows: filtered.filter(c => (c.source || "Unknown") === s.name).map(candRow) })}
                    className="rounded-xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.6)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold tracking-tight">{s.name}</p>
                      <span className="text-[10.5px] text-muted-foreground">{s.applicants} applicants</span>
                    </div>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">{fmtPct(s.conv)}</p>
                    <p className="text-[10.5px] text-muted-foreground">Conversion to hire</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10.5px]">
                      <div><span className="block font-semibold text-foreground">{s.interviews}</span><span className="text-muted-foreground">Interviews</span></div>
                      <div><span className="block font-semibold text-foreground">{s.offers}</span><span className="text-muted-foreground">Offers</span></div>
                      <div><span className="block font-semibold text-emerald-600">{s.hires}</span><span className="text-muted-foreground">Hires</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* State hiring */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-[16px] font-semibold tracking-tight">State Hiring Dashboard</h2>
            <p className="text-[11.5px] text-muted-foreground">Click a state to drill into its candidates.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const m = new Map<string, { total: number; interviews: number; offers: number; hires: number; ready: number; needs: number }>();
                for (const c of filtered) {
                  const k = c.state || "Unknown";
                  const cur = m.get(k) || { total: 0, interviews: 0, offers: 0, hires: 0, ready: 0, needs: 0 };
                  cur.total++;
                  if (c.stage === "Interview Scheduled" || c.stage === "Interview Completed") cur.interviews++;
                  if (c.stage === "Offer Sent" || c.stage === "Offer Accepted") cur.offers++;
                  if (c.stage === "Staffed") cur.hires++;
                  if (c.stage === "Ready for Staffing") cur.ready++;
                  m.set(k, cur);
                }
                for (const n of needs) {
                  const k = n.state || "Unknown";
                  const cur = m.get(k) || { total: 0, interviews: 0, offers: 0, hires: 0, ready: 0, needs: 0 };
                  cur.needs += n.openCases;
                  m.set(k, cur);
                }
                return [...m.entries()].sort((a, b) => b[1].total - a[1].total).map(([s, v]) => (
                  <button key={s} onClick={() => setDrill({ title: `${s} · candidates`, columns: CAND_COLS, rows: filtered.filter(c => (c.state || "Unknown") === s).map(candRow) })}
                    className="rounded-xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.6)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold tracking-tight">{s}</p>
                      <span className="text-[10.5px] text-muted-foreground">{v.total} apps</span>
                    </div>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">{v.hires}</p>
                    <p className="text-[10.5px] text-muted-foreground">Hires</p>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-[10.5px]">
                      <div><span className="block font-semibold text-foreground">{v.interviews}</span><span className="text-muted-foreground">Int.</span></div>
                      <div><span className="block font-semibold text-foreground">{v.offers}</span><span className="text-muted-foreground">Offers</span></div>
                      <div><span className="block font-semibold text-emerald-600">{v.ready}</span><span className="text-muted-foreground">Ready</span></div>
                      <div><span className="block font-semibold text-rose-600">{v.needs}</span><span className="text-muted-foreground">Needs</span></div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </section>
        </>
      )}

      {/* Drilldown drawer (generic) */}
      <Sheet open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <SheetContent side="right" className="w-full max-w-4xl overflow-y-auto sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle className="text-[16px]">{drill?.title}</SheetTitle>
          </SheetHeader>
          {drill && (
            <div className="mt-4">
              <p className="text-[11.5px] text-muted-foreground">{drill.rows.length.toLocaleString()} row{drill.rows.length === 1 ? "" : "s"}</p>
              {drill.rows.length === 0 ? (
                <p className="mt-6 text-center text-[12.5px] text-muted-foreground">{drill.emptyMessage ?? "No rows."}</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {drill.columns.map(c => <th key={c} className="px-2 py-1.5 whitespace-nowrap">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {drill.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/30">
                          {row.map((cell, j) => <td key={j} className="px-2 py-1.5 whitespace-nowrap">{String(cell)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Candidate drilldown */}
      <Sheet open={!!candDrill} onOpenChange={(o) => !o && setCandDrill(null)}>
        <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="text-[16px]">{candDrill?.name}</SheetTitle>
          </SheetHeader>
          {candDrill && (
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="ID" value={candDrill.id} />
                <Info label="Role" value={candDrill.role || "—"} />
                <Info label="State" value={candDrill.state || "—"} />
                <Info label="Recruiter" value={candDrill.recruiter || "—"} />
                <Info label="Source" value={candDrill.source || "—"} />
                <Info label="Applied" value={candDrill.applicationDate || "—"} />
                <Info label="Stage" value={candDrill.stage} />
                <Info label="Days in pipeline" value={String(candDrill.daysInPipeline)} />
                <Info label="Priority" value={candDrill.priority || "—"} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Info label="Interview" value={candDrill.interviewStatus || "—"} />
                  <Info label="Offer" value={candDrill.offerStatus || "—"} />
                  <Info label="Background" value={candDrill.backgroundStatus || "—"} />
                  <Info label="Orientation" value={candDrill.orientationStatus || "—"} />
                </div>
              </div>
              {candDrill.bottleneck && (
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-[12.5px] text-amber-800">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> {candDrill.bottleneck}
                </div>
              )}
              {candDrill.notes && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-[12.5px]">{candDrill.notes}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Raw row</p>
                <pre className="mt-2 max-h-[200px] overflow-auto rounded-xl border border-border/40 bg-secondary/40 p-3 text-[11px]">{JSON.stringify(candDrill.raw, null, 2)}</pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ===================== sub-components ===================== */

function UploadDropzone({
  inputRef, dragOver, setDragOver, onFiles, loading,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFiles: (files: FileList | File[] | null) => void;
  loading: boolean;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
        dragOver
          ? "border-[hsl(265_70%_55%)] bg-[hsl(265_100%_98%)]"
          : "border-border/60 bg-secondary/30 hover:border-[hsl(265_70%_55%/0.5)] hover:bg-[hsl(265_100%_99%)]",
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white shadow-[0_10px_30px_-10px_hsl(265_70%_55%/0.6)]">
        <Upload className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[14px] font-semibold">Upload recruiting exports</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · Apploi, Monday Recruiting, Orientation, Background Check, Staffing Board · multiple files supported</p>
      </div>
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}
        className="rounded-full bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
        {loading ? "Parsing…" : "Choose files"}
      </Button>
      <input ref={inputRef} type="file" multiple className="hidden" accept={SUPPORTED_EXTENSIONS} onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium tabular-nums">{value}</p>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "warn" | "danger" | "default"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    default: "bg-secondary text-muted-foreground border-border/60",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", map[tone])}>
      {children}
    </span>
  );
}