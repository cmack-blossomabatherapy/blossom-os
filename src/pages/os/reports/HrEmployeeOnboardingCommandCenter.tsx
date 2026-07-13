import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Upload, FileSpreadsheet, Sparkles, Download, Search,
  AlertTriangle, CheckCircle2, Brain, Trash2, Rocket,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { ReportAIButton } from "@/components/ai/ReportAIButton";
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
 * HR · Employee Onboarding Command Center
 * Upload Apploi / Viventium / Monday Onboarding / Orientation /
 * Background / Training / Staffing / Employee Master exports and
 * instantly see who is onboarding, what is stuck, who is ready
 * for staffing, and what blocks activation.
 * ============================================================ */

type Stage =
  | "Applied" | "Interview Scheduled" | "Interview Completed"
  | "Offer Sent" | "Offer Accepted"
  | "Viventium Sent" | "Viventium Complete"
  | "Background Check Submitted" | "Background Check Complete"
  | "Orientation Scheduled" | "Orientation Complete"
  | "Training Assigned" | "Training Complete"
  | "Ready For Staffing" | "Staffed" | "Active Employee"
  | "Inactive" | "Withdrawn" | "Not Qualified" | "Declined";

const STAGES: Stage[] = [
  "Applied","Interview Scheduled","Interview Completed",
  "Offer Sent","Offer Accepted",
  "Viventium Sent","Viventium Complete",
  "Background Check Submitted","Background Check Complete",
  "Orientation Scheduled","Orientation Complete",
  "Training Assigned","Training Complete",
  "Ready For Staffing","Staffed","Active Employee",
  "Inactive","Withdrawn","Not Qualified","Declined",
];

const FUNNEL: Stage[] = [
  "Offer Accepted","Viventium Sent","Viventium Complete",
  "Background Check Complete","Orientation Complete",
  "Training Complete","Ready For Staffing","Staffed","Active Employee",
];

const TERMINAL_NEG: Stage[] = ["Inactive","Withdrawn","Not Qualified","Declined"];
const ACTIVE_TERMINAL: Stage[] = ["Active Employee"];

type OnboardingStatus =
  | "On Track" | "Needs Attention" | "Delayed" | "Critical Delay"
  | "Ready For Activation" | "Activated";

const STATUS_TONE: Record<OnboardingStatus, "success" | "warn" | "danger" | "default"> = {
  "On Track": "success",
  "Needs Attention": "warn",
  "Delayed": "warn",
  "Critical Delay": "danger",
  "Ready For Activation": "default",
  "Activated": "success",
};

interface EmployeeRow {
  id: string;
  name: string;
  position: string;
  state: string;
  recruiter: string;
  hireDate: string;
  offerDate: string;
  activationDate: string;
  stage: Stage;
  backgroundStatus: string;
  bgSubmittedDate: string;
  bgCompletedDate: string;
  bgFlagged: boolean;
  orientationStatus: string;
  orientationDate: string;
  trainingStatus: string;
  trainingAssignedDate: string;
  trainingDueDate: string;
  trainingCompleteDate: string;
  trainingPct: number; // 0-1
  staffingStatus: string;
  activationStatus: string;
  notes: string;
  raw: Record<string, string>;
  // derived
  daysInOnboarding: number;
  daysSinceBg: number;
  daysToActivate: number; // 0 if not activated
  bgDaysPending: number;
  status: OnboardingStatus;
  nextAction: string;
  bottleneck: string | null;
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
  const n = parseFloat(String(v).replace(/[$,%]/g, ""));
  return isFinite(n) ? n : 0;
}
function fmtPct(n: number) { return isFinite(n) ? `${(n * 100).toFixed(1)}%` : "—"; }
function fmtNum(n: number, d = 0) { return isFinite(n) ? n.toFixed(d) : "—"; }
function parseDate(v: string | undefined | null): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}
function daysBetween(a: Date | null, b: Date | null = new Date()) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}
function isoDate(d: Date | null): string { return d ? d.toISOString().slice(0, 10) : ""; }
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

function mapStage(raw: string, fallback: Partial<Pick<EmployeeRow,"backgroundStatus"|"orientationStatus"|"trainingStatus"|"staffingStatus"|"activationStatus">> = {}): Stage {
  const s = (raw || "").toLowerCase().trim();
  const concat = `${s} ${fallback.backgroundStatus || ""} ${fallback.orientationStatus || ""} ${fallback.trainingStatus || ""} ${fallback.staffingStatus || ""} ${fallback.activationStatus || ""}`.toLowerCase();
  if (concat.includes("active employee") || concat.includes("activated")) return "Active Employee";
  if (concat.includes("staffed") || concat.includes("placed") || concat.includes("assigned to case")) return "Staffed";
  if (concat.includes("ready") && concat.includes("staff")) return "Ready For Staffing";
  if (concat.includes("training") && (concat.includes("complete") || concat.includes("done"))) return "Training Complete";
  if (concat.includes("training") && (concat.includes("assigned") || concat.includes("progress"))) return "Training Assigned";
  if (concat.includes("orientation") && (concat.includes("complete") || concat.includes("attended") || concat.includes("done"))) return "Orientation Complete";
  if (concat.includes("orientation")) return "Orientation Scheduled";
  if (concat.includes("background") && (concat.includes("complete") || concat.includes("clear") || concat.includes("pass"))) return "Background Check Complete";
  if (concat.includes("background")) return "Background Check Submitted";
  if (concat.includes("viventium") && (concat.includes("complete") || concat.includes("done") || concat.includes("submitted"))) return "Viventium Complete";
  if (concat.includes("viventium") || concat.includes("paperwork")) return "Viventium Sent";
  if (concat.includes("offer") && (concat.includes("accept") || concat.includes("signed"))) return "Offer Accepted";
  if (concat.includes("offer")) return "Offer Sent";
  if (concat.includes("interview") && concat.includes("complete")) return "Interview Completed";
  if (concat.includes("interview")) return "Interview Scheduled";
  if (concat.includes("withdraw")) return "Withdrawn";
  if (concat.includes("declin")) return "Declined";
  if (concat.includes("not qualified") || concat.includes("reject")) return "Not Qualified";
  if (concat.includes("inactive") || concat.includes("terminated")) return "Inactive";
  if (concat.includes("apply") || concat.includes("applied") || concat.includes("new")) return "Applied";
  return "Applied";
}

function deriveStatus(e: EmployeeRow): { status: OnboardingStatus; nextAction: string; bottleneck: string | null } {
  if (e.stage === "Active Employee") return { status: "Activated", nextAction: "—", bottleneck: null };
  if (e.stage === "Staffed" || e.stage === "Ready For Staffing") return { status: "Ready For Activation", nextAction: "Activate employee", bottleneck: null };
  if (e.bgFlagged) return { status: "Critical Delay", nextAction: "Resolve background flag", bottleneck: "Background flagged" };
  if (e.stage === "Background Check Submitted" && e.bgDaysPending >= 14) return { status: "Critical Delay", nextAction: "Escalate background vendor", bottleneck: "Background >14 days" };
  if (e.stage === "Background Check Submitted" && e.bgDaysPending >= 7) return { status: "Delayed", nextAction: "Follow up on background", bottleneck: "Background >7 days" };
  if (e.daysInOnboarding >= 30 && !ACTIVE_TERMINAL.includes(e.stage)) return { status: "Critical Delay", nextAction: "Escalate onboarding case", bottleneck: "Open >30 days" };
  if (e.daysInOnboarding >= 14 && !ACTIVE_TERMINAL.includes(e.stage)) return { status: "Delayed", nextAction: "Resolve open onboarding tasks", bottleneck: "Open >14 days" };
  if (e.stage === "Orientation Scheduled" && e.daysInOnboarding >= 10) return { status: "Needs Attention", nextAction: "Confirm orientation attendance", bottleneck: "Orientation pending" };
  if (e.stage === "Training Assigned" && e.trainingPct < 0.5 && e.daysInOnboarding >= 7) return { status: "Needs Attention", nextAction: "Nudge training completion", bottleneck: "Training behind" };
  if (e.stage === "Viventium Sent" && e.daysInOnboarding >= 5) return { status: "Needs Attention", nextAction: "Follow up on paperwork", bottleneck: "Viventium pending" };
  return { status: "On Track", nextAction: nextActionFor(e.stage), bottleneck: null };
}

function nextActionFor(stage: Stage): string {
  switch (stage) {
    case "Offer Accepted": return "Send Viventium paperwork";
    case "Viventium Sent": return "Confirm paperwork completion";
    case "Viventium Complete": return "Submit background check";
    case "Background Check Submitted": return "Monitor background result";
    case "Background Check Complete": return "Schedule orientation";
    case "Orientation Scheduled": return "Confirm orientation attendance";
    case "Orientation Complete": return "Assign required trainings";
    case "Training Assigned": return "Track training completion";
    case "Training Complete": return "Mark ready for staffing";
    default: return "Continue onboarding";
  }
}

/* ===================== PAGE ===================== */

export default function HrEmployeeOnboardingCommandCenter() {
  const [files, setFiles] = useState<{ name: string; rows: number; kind: string }[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const [drill, setDrill] = useState<DrilldownSpec | null>(null);
  const [empDrill, setEmpDrill] = useState<EmployeeRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList || !fileList.length) return;
    setLoading(true);
    try {
      const newEmps: EmployeeRow[] = [];
      const fileSummaries: { name: string; rows: number; kind: string }[] = [];
      const warns: string[] = [];

      for (const f of Array.from(fileList)) {
        const parsed = await parseAnyFile(f);
        const first = parsed[0];
        if (!first) { warns.push(`${f.name}: no data found.`); continue; }
        const headers = first.headers;

        const nameH = findHeader(headers, ["EmployeeName","Employee Name","Name","CandidateName","Candidate Name","Full Name","FullName"]);
        const fnH = findHeader(headers, ["FirstName","First Name"]);
        const lnH = findHeader(headers, ["LastName","Last Name"]);
        const idH = findHeader(headers, ["EmployeeId","Employee ID","Id","ID","CandidateId"]);
        const posH = findHeader(headers, ["Position","Role","JobTitle","Job Title"]);
        const stateH = findHeader(headers, ["State","Location","Region"]);
        const recruiterH = findHeader(headers, ["Recruiter","Owner","HR Owner","AssignedTo","Assigned To"]);
        const hireH = findHeader(headers, ["HireDate","Hire Date","StartDate","Start Date"]);
        const offerH = findHeader(headers, ["OfferDate","Offer Date","OfferAcceptedDate","Offer Accepted Date"]);
        const actDateH = findHeader(headers, ["ActivationDate","Activation Date","ActiveDate","Active Date"]);
        const stageH = findHeader(headers, ["Stage","Status","OnboardingStage","Onboarding Stage","CurrentStage","Current Stage"]);
        const bgH = findHeader(headers, ["BackgroundStatus","Background Status","BackgroundCheck","Background Check"]);
        const bgSubH = findHeader(headers, ["BackgroundSubmittedDate","Background Submitted","BG Submitted","BackgroundDate"]);
        const bgCmpH = findHeader(headers, ["BackgroundCompletedDate","Background Completed","BG Completed"]);
        const bgFlagH = findHeader(headers, ["BackgroundFlag","BackgroundFlagged","BG Flag","Flagged"]);
        const orientStatusH = findHeader(headers, ["OrientationStatus","Orientation Status","Orientation"]);
        const orientDateH = findHeader(headers, ["OrientationDate","Orientation Date"]);
        const trainStatusH = findHeader(headers, ["TrainingStatus","Training Status","Training"]);
        const trainAssignH = findHeader(headers, ["TrainingAssignedDate","Training Assigned"]);
        const trainDueH = findHeader(headers, ["TrainingDueDate","Training Due"]);
        const trainCmpH = findHeader(headers, ["TrainingCompleteDate","Training Completed"]);
        const trainPctH = findHeader(headers, ["TrainingProgress","Training %","TrainingCompletion","Training Completion","CompletionPct"]);
        const staffH = findHeader(headers, ["StaffingStatus","Staffing Status","Placement","PlacementStatus"]);
        const actStatusH = findHeader(headers, ["ActivationStatus","Activation Status","ActiveStatus"]);
        const notesH = findHeader(headers, ["Notes","Note","Comment","Comments"]);

        if (!nameH && !(fnH && lnH)) {
          warns.push(`${f.name}: no employee/name column detected — skipped.`);
          continue;
        }

        const today = new Date();
        let nRows = 0;
        for (const r of first.rows) {
          const name = nameH ? r[nameH] : `${fnH ? r[fnH] : ""} ${lnH ? r[lnH] : ""}`.trim();
          if (!name) continue;
          const id = idH ? r[idH] : `${f.name}:${nRows}`;
          const offerDate = parseDate(offerH ? r[offerH] : (hireH ? r[hireH] : ""));
          const hireDate = parseDate(hireH ? r[hireH] : "");
          const actDate = parseDate(actDateH ? r[actDateH] : "");
          const bgSub = parseDate(bgSubH ? r[bgSubH] : "");
          const bgCmp = parseDate(bgCmpH ? r[bgCmpH] : "");
          const orientDate = parseDate(orientDateH ? r[orientDateH] : "");
          const trainAssign = parseDate(trainAssignH ? r[trainAssignH] : "");
          const trainDue = parseDate(trainDueH ? r[trainDueH] : "");
          const trainCmp = parseDate(trainCmpH ? r[trainCmpH] : "");

          const backgroundStatus = bgH ? r[bgH] : "";
          const orientationStatus = orientStatusH ? r[orientStatusH] : "";
          const trainingStatus = trainStatusH ? r[trainStatusH] : "";
          const staffingStatus = staffH ? r[staffH] : "";
          const activationStatus = actStatusH ? r[actStatusH] : "";
          const stageRaw = stageH ? r[stageH] : "";
          const stage = mapStage(stageRaw, { backgroundStatus, orientationStatus, trainingStatus, staffingStatus, activationStatus });

          let trainingPct = trainPctH ? num(r[trainPctH]) : 0;
          if (trainingPct > 1.5) trainingPct = trainingPct / 100;
          if (stage === "Training Complete") trainingPct = 1;

          const flagRaw = (bgFlagH ? r[bgFlagH] : "").toLowerCase();
          const bgFlagged = flagRaw === "true" || flagRaw === "yes" || flagRaw === "1" || flagRaw.includes("flag") || backgroundStatus.toLowerCase().includes("flag") || backgroundStatus.toLowerCase().includes("reject");

          const emp: EmployeeRow = {
            id, name,
            position: posH ? r[posH] : "",
            state: stateH ? r[stateH] : "",
            recruiter: recruiterH ? r[recruiterH] : "",
            hireDate: isoDate(hireDate),
            offerDate: isoDate(offerDate),
            activationDate: isoDate(actDate),
            stage,
            backgroundStatus,
            bgSubmittedDate: isoDate(bgSub),
            bgCompletedDate: isoDate(bgCmp),
            bgFlagged,
            orientationStatus,
            orientationDate: isoDate(orientDate),
            trainingStatus,
            trainingAssignedDate: isoDate(trainAssign),
            trainingDueDate: isoDate(trainDue),
            trainingCompleteDate: isoDate(trainCmp),
            trainingPct,
            staffingStatus,
            activationStatus,
            notes: notesH ? r[notesH] : "",
            raw: r,
            daysInOnboarding: daysBetween(offerDate || hireDate, today),
            daysSinceBg: daysBetween(bgSub, today),
            daysToActivate: actDate && offerDate ? daysBetween(offerDate, actDate) : 0,
            bgDaysPending: bgSub && !bgCmp ? daysBetween(bgSub, today) : 0,
            status: "On Track",
            nextAction: "",
            bottleneck: null,
          };
          newEmps.push(emp); nRows++;
        }
        fileSummaries.push({ name: f.name, rows: nRows, kind: "Onboarding" });
      }

      const missing: string[] = [];
      if (newEmps.length === 0) missing.push("Employee Name column");

      setMissingFields(missing);
      setWarnings(warns);
      setEmployees(prev => [...prev, ...newEmps]);
      setFiles(prev => [...prev, ...fileSummaries]);
      setGenerated(false);
      toast.success(`Loaded ${newEmps.length} employee${newEmps.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      toast.error(`Failed to parse file: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetUpload() {
    setFiles([]); setEmployees([]); setMissingFields([]); setWarnings([]); setGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  /* ---- Enrich ---- */
  const enriched = useMemo<EmployeeRow[]>(() => employees.map(e => {
    const { status, nextAction, bottleneck } = deriveStatus(e);
    return { ...e, status, nextAction, bottleneck };
  }), [employees]);

  /* ---- Filter options ---- */
  const states = useMemo(() => Array.from(new Set(enriched.map(c => c.state).filter(Boolean))).sort(), [enriched]);
  const recruiters = useMemo(() => Array.from(new Set(enriched.map(c => c.recruiter).filter(Boolean))).sort(), [enriched]);
  const positions = useMemo(() => Array.from(new Set(enriched.map(c => c.position).filter(Boolean))).sort(), [enriched]);
  const statuses: OnboardingStatus[] = ["On Track","Needs Attention","Delayed","Critical Delay","Ready For Activation","Activated"];

  const filtered = useMemo(() => enriched.filter(e => {
    if (search) {
      const s = search.toLowerCase();
      if (!e.name.toLowerCase().includes(s) && !e.id.toLowerCase().includes(s) && !e.position.toLowerCase().includes(s)) return false;
    }
    if (stageFilter !== "all" && e.stage !== stageFilter) return false;
    if (stateFilter !== "all" && e.state !== stateFilter) return false;
    if (recruiterFilter !== "all" && e.recruiter !== recruiterFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (positionFilter !== "all" && e.position !== positionFilter) return false;
    return true;
  }), [enriched, search, stageFilter, stateFilter, recruiterFilter, statusFilter, positionFilter]);

  /* ---- Aggregates ---- */
  const agg = useMemo(() => {
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 86400000);
    const stageCount: Record<string, number> = {};
    for (const s of STAGES) stageCount[s] = 0;
    for (const e of filtered) stageCount[e.stage]++;
    const newHiresThisMonth = filtered.filter(e => { const d = parseDate(e.offerDate || e.hireDate); return d && d >= monthAgo; }).length;
    const offersAccepted = filtered.filter(e => !TERMINAL_NEG.includes(e.stage) && e.stage !== "Applied" && e.stage !== "Interview Scheduled" && e.stage !== "Interview Completed" && e.stage !== "Offer Sent").length;
    const inProgress = filtered.filter(e => !TERMINAL_NEG.includes(e.stage) && !ACTIVE_TERMINAL.includes(e.stage) && e.stage !== "Staffed").length;
    const bgPending = stageCount["Background Check Submitted"];
    const orientScheduled = stageCount["Orientation Scheduled"];
    const orientComplete = stageCount["Orientation Complete"];
    const trainingInProgress = stageCount["Training Assigned"];
    const readyStaffing = stageCount["Ready For Staffing"];
    const readyActivation = filtered.filter(e => e.status === "Ready For Activation").length;
    const active = stageCount["Active Employee"];
    const delayed = filtered.filter(e => e.status === "Delayed" || e.status === "Critical Delay").length;
    const activated = filtered.filter(e => e.activationDate && e.offerDate);
    const avgToActivate = activated.length ? activated.reduce((s, e) => s + (e.daysToActivate || 0), 0) / activated.length : 0;
    const completed = filtered.filter(e => ACTIVE_TERMINAL.includes(e.stage) || e.stage === "Staffed" || e.stage === "Ready For Staffing").length;
    const completionPct = filtered.length ? completed / filtered.length : 0;
    return {
      total: filtered.length, stageCount, newHiresThisMonth, offersAccepted, inProgress, bgPending,
      orientScheduled, orientComplete, trainingInProgress, readyStaffing, readyActivation,
      active, delayed, avgToActivate, completionPct,
    };
  }, [filtered]);

  /* ---- KPIs ---- */
  const EMP_COLS = ["Employee","Position","State","Stage","Status","Days","Next Action"];
  function empRow(e: EmployeeRow): (string | number)[] {
    return [e.name, e.position || "—", e.state || "—", e.stage, e.status, e.daysInOnboarding, e.nextAction || "—"];
  }

  const kpis: KpiSpec[] = useMemo(() => {
    if (!generated) return [];
    const inStage = (s: Stage) => filtered.filter(c => c.stage === s);
    return [
      { id: "new", label: "New Hires This Month", value: String(agg.newHiresThisMonth), raw: agg.newHiresThisMonth, hint: "Last 30 days", tone: "default" },
      { id: "accept", label: "Offers Accepted", value: String(agg.offersAccepted), raw: agg.offersAccepted, hint: "Past offer-accepted", tone: "success" },
      { id: "prog", label: "Onboarding In Progress", value: String(agg.inProgress), raw: agg.inProgress, hint: "Not yet staffed", tone: "default",
        drilldown: { title: "Onboarding in progress", columns: EMP_COLS, rows: filtered.filter(e => !TERMINAL_NEG.includes(e.stage) && !ACTIVE_TERMINAL.includes(e.stage) && e.stage !== "Staffed").map(empRow) } },
      { id: "bg", label: "Background Checks Pending", value: String(agg.bgPending), raw: agg.bgPending, hint: "Awaiting result", tone: agg.bgPending ? "warn" : "success",
        drilldown: { title: "Background pending", columns: EMP_COLS, rows: inStage("Background Check Submitted").map(empRow) } },
      { id: "orsch", label: "Orientation Scheduled", value: String(agg.orientScheduled), raw: agg.orientScheduled, hint: "Upcoming sessions", tone: "default",
        drilldown: { title: "Orientation scheduled", columns: EMP_COLS, rows: inStage("Orientation Scheduled").map(empRow) } },
      { id: "orcmp", label: "Orientation Complete", value: String(agg.orientComplete), raw: agg.orientComplete, hint: "Attended & finished", tone: "success",
        drilldown: { title: "Orientation complete", columns: EMP_COLS, rows: inStage("Orientation Complete").map(empRow) } },
      { id: "train", label: "Training In Progress", value: String(agg.trainingInProgress), raw: agg.trainingInProgress, hint: "Currently training", tone: "default",
        drilldown: { title: "Training in progress", columns: EMP_COLS, rows: inStage("Training Assigned").map(empRow) } },
      { id: "ready", label: "Ready For Staffing", value: String(agg.readyStaffing), raw: agg.readyStaffing, hint: "Awaiting placement", tone: agg.readyStaffing ? "success" : "default",
        drilldown: { title: "Ready for staffing", columns: EMP_COLS, rows: inStage("Ready For Staffing").map(empRow) } },
      { id: "rdyact", label: "Ready For Activation", value: String(agg.readyActivation), raw: agg.readyActivation, hint: "Final activation step", tone: "default" },
      { id: "act", label: "Active Employees", value: String(agg.active), raw: agg.active, hint: "Fully onboarded", tone: "success",
        drilldown: { title: "Active employees", columns: EMP_COLS, rows: inStage("Active Employee").map(empRow) } },
      { id: "delay", label: "Delayed Onboarding Cases", value: String(agg.delayed), raw: agg.delayed, hint: "Delayed + critical", tone: agg.delayed ? "danger" : "success",
        drilldown: { title: "Delayed cases", columns: EMP_COLS, rows: filtered.filter(e => e.status === "Delayed" || e.status === "Critical Delay").map(empRow) } },
      { id: "avg", label: "Avg Days to Activate", value: agg.avgToActivate ? `${fmtNum(agg.avgToActivate, 1)} days` : "—", raw: agg.avgToActivate, hint: "Offer → active", tone: agg.avgToActivate && agg.avgToActivate <= 21 ? "success" : "warn" },
      { id: "comp", label: "Onboarding Completion %", value: fmtPct(agg.completionPct), raw: agg.completionPct, hint: "Reached staffing/active", tone: agg.completionPct >= 0.6 ? "success" : "warn" },
    ];
  }, [generated, filtered, agg]);

  /* ---- Funnel ---- */
  const funnel = useMemo(() => {
    const counts = FUNNEL.map(s => ({ stage: s, count: filtered.filter(c => c.stage === s).length }));
    const top = counts[0].count || 1;
    return counts.map((row, i) => {
      const prev = i === 0 ? row.count : counts[i - 1].count;
      const conv = prev > 0 ? row.count / prev : 0;
      const drop = prev > 0 ? 1 - conv : 0;
      const inStage = filtered.filter(c => c.stage === row.stage);
      const avgDays = inStage.length ? inStage.reduce((s, c) => s + c.daysInOnboarding, 0) / inStage.length : 0;
      return { ...row, conv, drop, pct: row.count / top, avgDays };
    });
  }, [filtered]);

  /* ---- Charts ---- */
  const charts: ChartSpec[] = useMemo(() => {
    if (!generated || filtered.length === 0) return [];
    const stateMap = new Map<string, { total: number; ready: number; active: number }>();
    for (const e of filtered) {
      const k = e.state || "Unknown";
      const cur = stateMap.get(k) || { total: 0, ready: 0, active: 0 };
      cur.total++;
      if (e.stage === "Ready For Staffing") cur.ready++;
      if (e.stage === "Active Employee") cur.active++;
      stateMap.set(k, cur);
    }
    const stateRows = [...stateMap.entries()].sort((a, b) => b[1].total - a[1].total);

    const roleMap = new Map<string, number>();
    for (const e of filtered) roleMap.set(e.position || "Unknown", (roleMap.get(e.position || "Unknown") || 0) + 1);
    const roleRows = [...roleMap.entries()].sort((a, b) => b[1] - a[1]);

    return [
      { id: "funnel", title: "Onboarding Funnel", type: "bar", span: 2,
        labels: FUNNEL,
        series: [{ name: "Employees", data: FUNNEL.map(s => filtered.filter(c => c.stage === s).length) }] },
      { id: "state", title: "Onboarding By State", type: "bar",
        labels: stateRows.map(([k]) => k),
        series: [
          { name: "Total", data: stateRows.map(([, v]) => v.total) },
          { name: "Active", data: stateRows.map(([, v]) => v.active) },
        ] },
      { id: "role", title: "Onboarding By Role", type: "bar",
        labels: roleRows.slice(0, 10).map(([k]) => k),
        series: [{ name: "Employees", data: roleRows.slice(0, 10).map(([, n]) => n) }] },
      { id: "bg", title: "Background Check Status", type: "pie",
        labels: ["Submitted","Complete","Flagged"],
        series: [{ name: "Checks", data: [
          filtered.filter(e => e.stage === "Background Check Submitted").length,
          filtered.filter(e => e.stage === "Background Check Complete").length,
          filtered.filter(e => e.bgFlagged).length,
        ] }] },
    ];
  }, [generated, filtered]);

  /* ---- Alerts ---- */
  const alerts = useMemo(() => {
    const items: { title: string; count: number; tone: "warn" | "danger"; rows: EmployeeRow[] }[] = [];
    const bgSlow = filtered.filter(e => e.stage === "Background Check Submitted" && e.bgDaysPending >= 7);
    if (bgSlow.length) items.push({ title: "Background checks delayed (>7d)", count: bgSlow.length, tone: "warn", rows: bgSlow });
    const bgCrit = filtered.filter(e => e.stage === "Background Check Submitted" && e.bgDaysPending >= 14);
    if (bgCrit.length) items.push({ title: "Background checks critical (>14d)", count: bgCrit.length, tone: "danger", rows: bgCrit });
    const missedOrient = filtered.filter(e => e.orientationStatus.toLowerCase().includes("miss"));
    if (missedOrient.length) items.push({ title: "Missed orientations", count: missedOrient.length, tone: "warn", rows: missedOrient });
    const trainStuck = filtered.filter(e => e.stage === "Training Assigned" && e.daysInOnboarding >= 14);
    if (trainStuck.length) items.push({ title: "Training incomplete >14d", count: trainStuck.length, tone: "warn", rows: trainStuck });
    const open14 = filtered.filter(e => e.daysInOnboarding >= 14 && !ACTIVE_TERMINAL.includes(e.stage) && !TERMINAL_NEG.includes(e.stage));
    if (open14.length) items.push({ title: "Open >14 days", count: open14.length, tone: "warn", rows: open14 });
    const open30 = filtered.filter(e => e.daysInOnboarding >= 30 && !ACTIVE_TERMINAL.includes(e.stage) && !TERMINAL_NEG.includes(e.stage));
    if (open30.length) items.push({ title: "Open >30 days", count: open30.length, tone: "danger", rows: open30 });
    const flagged = filtered.filter(e => e.bgFlagged);
    if (flagged.length) items.push({ title: "Background flagged", count: flagged.length, tone: "danger", rows: flagged });
    return items;
  }, [filtered]);

  /* ---- AI insights ---- */
  const insights = useMemo(() => {
    if (!generated) return [];
    const out: string[] = [];
    out.push(`${filtered.length} employee${filtered.length === 1 ? "" : "s"} currently in onboarding pipeline.`);
    if (agg.bgPending) out.push(`${agg.bgPending} employee${agg.bgPending === 1 ? "" : "s"} waiting on background checks.`);
    if (agg.avgToActivate) out.push(`Average onboarding time is ${fmtNum(agg.avgToActivate, 1)} days.`);
    if (agg.readyStaffing) out.push(`${agg.readyStaffing} completed onboarding and ${agg.readyStaffing === 1 ? "is" : "are"} ready for staffing.`);
    const stateMap = new Map<string, { count: number; activeDays: number; activated: number }>();
    for (const e of filtered) {
      const k = e.state || "Unknown";
      const cur = stateMap.get(k) || { count: 0, activeDays: 0, activated: 0 };
      cur.count++;
      if (e.daysToActivate) { cur.activeDays += e.daysToActivate; cur.activated++; }
      stateMap.set(k, cur);
    }
    const ranked = [...stateMap.entries()].filter(([, v]) => v.activated > 0).map(([k, v]) => ({ k, avg: v.activeDays / v.activated })).sort((a, b) => a.avg - b.avg);
    if (ranked.length) out.push(`${ranked[0].k} has the fastest activation rate (${fmtNum(ranked[0].avg, 1)} days avg).`);
    if (agg.delayed) out.push(`${agg.delayed} onboarding case${agg.delayed === 1 ? "" : "s"} flagged as delayed or critical.`);
    return out;
  }, [generated, filtered, agg]);

  /* ---- Exports ---- */
  function exportPipeline() {
    downloadCsv("onboarding-pipeline.csv",
      ["Stage","Count","Conversion %","Drop-off %","Avg Days"],
      funnel.map(f => [f.stage, f.count, fmtPct(f.conv), fmtPct(f.drop), fmtNum(f.avgDays, 1)]));
    toast.success("Pipeline exported");
  }
  function exportEmployees() {
    downloadCsv("onboarding-employees.csv",
      ["Employee","Position","State","Recruiter","Hire Date","Offer Date","Stage","Status","Background","Orientation","Training","Staffing","Activation","Days","Next Action"],
      filtered.map(e => [e.name, e.position, e.state, e.recruiter, e.hireDate, e.offerDate, e.stage, e.status, e.backgroundStatus, e.orientationStatus, e.trainingStatus, e.staffingStatus, e.activationStatus, e.daysInOnboarding, e.nextAction]));
    toast.success("Employees exported");
  }
  function exportBackground() {
    downloadCsv("background-checks.csv",
      ["Employee","State","Status","Submitted","Completed","Days Pending","Flagged"],
      filtered.filter(e => e.bgSubmittedDate || e.backgroundStatus).map(e => [e.name, e.state, e.backgroundStatus, e.bgSubmittedDate, e.bgCompletedDate, e.bgDaysPending, e.bgFlagged ? "Yes" : "No"]));
    toast.success("Background report exported");
  }
  function exportOrientation() {
    downloadCsv("orientation-report.csv",
      ["Employee","State","Orientation Date","Status","Days In Onboarding"],
      filtered.filter(e => e.orientationDate || e.orientationStatus).map(e => [e.name, e.state, e.orientationDate, e.orientationStatus, e.daysInOnboarding]));
    toast.success("Orientation report exported");
  }
  function exportTraining() {
    downloadCsv("training-report.csv",
      ["Employee","State","Training Status","Assigned","Due","Completed","Progress %"],
      filtered.filter(e => e.trainingStatus || e.trainingAssignedDate).map(e => [e.name, e.state, e.trainingStatus, e.trainingAssignedDate, e.trainingDueDate, e.trainingCompleteDate, fmtPct(e.trainingPct)]));
    toast.success("Training report exported");
  }
  function exportStaffing() {
    downloadCsv("staffing-readiness.csv",
      ["Employee","State","Position","Stage","Staffing Status","Days"],
      filtered.filter(e => e.stage === "Ready For Staffing" || e.stage === "Staffed").map(e => [e.name, e.state, e.position, e.stage, e.staffingStatus, e.daysInOnboarding]));
    toast.success("Staffing readiness exported");
  }
  function exportActivation() {
    downloadCsv("activation-report.csv",
      ["Employee","State","Offer Date","Activation Date","Days To Activate","Activation Status"],
      filtered.map(e => [e.name, e.state, e.offerDate, e.activationDate, e.daysToActivate || "", e.activationStatus]));
    toast.success("Activation report exported");
  }
  function copyOnboardingSummary() {
    const lines = [
      `Employee Onboarding Command Center — ${files.map(f => f.name).join(", ")}`,
      `Employees: ${filtered.length} · In progress: ${agg.inProgress} · Active: ${agg.active}`,
      `Background pending: ${agg.bgPending} · Orientation scheduled: ${agg.orientScheduled}`,
      `Ready for staffing: ${agg.readyStaffing} · Delayed: ${agg.delayed}`,
      agg.avgToActivate ? `Average days to activate: ${fmtNum(agg.avgToActivate, 1)}` : "",
      `Onboarding completion: ${fmtPct(agg.completionPct)}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Onboarding summary copied");
  }
  function saveSnapshot() {
    try {
      const key = "blossom.os.hr.onboarding.snapshots.v1";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({
        id: crypto.randomUUID(), savedAt: new Date().toISOString(),
        files: files.map(f => f.name),
        filters: { stageFilter, stateFilter, recruiterFilter, statusFilter, positionFilter },
        kpis: {
          total: filtered.length, active: agg.active, ready: agg.readyStaffing,
          delayed: agg.delayed, completion: agg.completionPct, avgToActivate: agg.avgToActivate,
        },
      });
      localStorage.setItem(key, JSON.stringify(list));
      toast.success("Snapshot saved");
    } catch { toast.error("Could not save snapshot"); }
  }

  /* ===================== RENDER ===================== */

  return (
    <OSShell>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/reports" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <Badge variant="secondary" className="rounded-full bg-[hsl(265_100%_97%)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(265_70%_55%)]">
              HR · Featured Dashboard
            </Badge>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Employee Onboarding Command Center</h1>
            <p className="text-[12.5px] text-muted-foreground">
              Track every new hire from application to active employee — monitor onboarding progress, bottlenecks, orientation, background checks, training, staffing readiness and activation status.
            </p>
          </div>
        </div>
        <ReportAIButton preset="hr-onboarding" />
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
                    <p className="mt-1 text-rose-600/80">Upload an Apploi, Viventium, Monday Onboarding, Orientation, Background, Training, or Staffing export.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => { setGenerated(true); toast.success("Onboarding dashboard generated"); }}
                className="h-9 rounded-full bg-[hsl(265_70%_55%)] px-5 text-[12.5px] font-semibold text-white hover:bg-[hsl(265_70%_50%)]"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate Onboarding Dashboard
              </Button>
            )}
          </div>
        )}
      </section>

      {generated && filtered.length > 0 && (
        <>
          {/* KPIs */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(k => <KpiTile key={k.id} kpi={k} onClick={(kpi) => kpi.drilldown && setDrill(kpi.drilldown)} />)}
          </section>

          {/* Insights + Exports */}
          <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
                  <Brain className="h-3.5 w-3.5" />
                </span>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Operational Insights</p>
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
                <Button variant="outline" size="sm" onClick={exportEmployees}><Download className="mr-1 h-3.5 w-3.5" />Employees</Button>
                <Button variant="outline" size="sm" onClick={exportBackground}><Download className="mr-1 h-3.5 w-3.5" />Background</Button>
                <Button variant="outline" size="sm" onClick={exportOrientation}><Download className="mr-1 h-3.5 w-3.5" />Orientation</Button>
                <Button variant="outline" size="sm" onClick={exportTraining}><Download className="mr-1 h-3.5 w-3.5" />Training</Button>
                <Button variant="outline" size="sm" onClick={exportStaffing}><Download className="mr-1 h-3.5 w-3.5" />Staffing</Button>
                <Button variant="outline" size="sm" onClick={exportActivation}><Download className="mr-1 h-3.5 w-3.5" />Activation</Button>
                <Button variant="outline" size="sm" onClick={copyOnboardingSummary}><Rocket className="mr-1 h-3.5 w-3.5" />Copy Summary</Button>
                <Button variant="outline" size="sm" onClick={saveSnapshot} className="col-span-2"><Sparkles className="mr-1 h-3.5 w-3.5" />Save Snapshot</Button>
              </div>
            </div>
          </section>

          {/* Funnel */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">Onboarding Funnel</h2>
                <p className="text-[11.5px] text-muted-foreground">Click a stage to drill into employees.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {funnel.map((f, i) => (
                <button key={f.stage} onClick={() => setDrill({ title: `${f.stage} · ${f.count} employees`, columns: EMP_COLS, rows: filtered.filter(c => c.stage === f.stage).map(empRow) })}
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
                <button key={i} onClick={() => a.rows.length && setDrill({ title: a.title, columns: EMP_COLS, rows: a.rows.map(empRow) })}
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

          {/* Employees table */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">New Hire Pipeline</h2>
                <p className="text-[11.5px] text-muted-foreground">{filtered.length} of {enriched.length} employees</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, position…" className="h-8 w-[220px] pl-8 text-[12px]" />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="h-8 w-[180px] text-[12px]"><SelectValue placeholder="Stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                {positions.length > 0 && (
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]"><SelectValue placeholder="Position" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All positions</SelectItem>
                      {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1200px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-2 py-2">Employee</th>
                    <th className="px-2 py-2">Position</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Recruiter</th>
                    <th className="px-2 py-2">Stage</th>
                    <th className="px-2 py-2">Background</th>
                    <th className="px-2 py-2">Orientation</th>
                    <th className="px-2 py-2">Training</th>
                    <th className="px-2 py-2">Staffing</th>
                    <th className="px-2 py-2 text-right">Days</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 300).map(e => (
                    <tr key={e.id + e.name} onClick={() => setEmpDrill(e)}
                        className="cursor-pointer border-b border-border/40 transition hover:bg-secondary/40">
                      <td className="px-2 py-2"><div className="font-medium">{e.name}</div><div className="text-[10.5px] text-muted-foreground">{e.id}</div></td>
                      <td className="px-2 py-2 text-muted-foreground">{e.position || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.state || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.recruiter || "—"}</td>
                      <td className="px-2 py-2">{e.stage}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.backgroundStatus || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.orientationStatus || "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.trainingStatus || (e.trainingPct ? fmtPct(e.trainingPct) : "—")}</td>
                      <td className="px-2 py-2 text-muted-foreground">{e.staffingStatus || "—"}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.daysInOnboarding}</td>
                      <td className="px-2 py-2"><StatusBadge tone={STATUS_TONE[e.status]}>{e.status}</StatusBadge></td>
                      <td className="px-2 py-2 text-muted-foreground">{e.nextAction || "—"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} className="px-2 py-8 text-center text-[12px] text-muted-foreground">No employees match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
              {filtered.length > 300 && (
                <p className="mt-2 text-[11px] text-muted-foreground">Showing first 300 of {filtered.length}. Export the full list for review.</p>
              )}
            </div>
          </section>

          {/* State breakdown */}
          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-[16px] font-semibold tracking-tight">State Onboarding Dashboard</h2>
            <p className="text-[11.5px] text-muted-foreground">Click a state to drill into employees.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const m = new Map<string, { total: number; bg: number; orient: number; ready: number; active: number; days: number[] }>();
                for (const e of filtered) {
                  const k = e.state || "Unknown";
                  const cur = m.get(k) || { total: 0, bg: 0, orient: 0, ready: 0, active: 0, days: [] };
                  cur.total++;
                  if (e.stage === "Background Check Submitted") cur.bg++;
                  if (e.stage === "Orientation Complete") cur.orient++;
                  if (e.stage === "Ready For Staffing") cur.ready++;
                  if (e.stage === "Active Employee") cur.active++;
                  if (e.daysToActivate) cur.days.push(e.daysToActivate);
                  m.set(k, cur);
                }
                return [...m.entries()].sort((a, b) => b[1].total - a[1].total).map(([s, v]) => (
                  <button key={s} onClick={() => setDrill({ title: `${s} · employees`, columns: EMP_COLS, rows: filtered.filter(c => (c.state || "Unknown") === s).map(empRow) })}
                    className="rounded-xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-[hsl(265_70%_55%/0.6)]">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold tracking-tight">{s}</p>
                      <span className="text-[10.5px] text-muted-foreground">{v.total} hires</span>
                    </div>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">{v.active}</p>
                    <p className="text-[10.5px] text-muted-foreground">Active employees</p>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-[10.5px]">
                      <div><span className="block font-semibold text-foreground">{v.bg}</span><span className="text-muted-foreground">BG</span></div>
                      <div><span className="block font-semibold text-foreground">{v.orient}</span><span className="text-muted-foreground">Orient.</span></div>
                      <div><span className="block font-semibold text-emerald-600">{v.ready}</span><span className="text-muted-foreground">Ready</span></div>
                      <div><span className="block font-semibold text-foreground">{v.days.length ? fmtNum(v.days.reduce((a, b) => a + b, 0) / v.days.length, 0) + "d" : "—"}</span><span className="text-muted-foreground">Avg</span></div>
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

      {/* Employee drilldown */}
      <Sheet open={!!empDrill} onOpenChange={(o) => !o && setEmpDrill(null)}>
        <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="text-[16px]">{empDrill?.name}</SheetTitle>
          </SheetHeader>
          {empDrill && (
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="ID" value={empDrill.id} />
                <Info label="Position" value={empDrill.position || "—"} />
                <Info label="State" value={empDrill.state || "—"} />
                <Info label="Recruiter" value={empDrill.recruiter || "—"} />
                <Info label="Hire Date" value={empDrill.hireDate || "—"} />
                <Info label="Offer Date" value={empDrill.offerDate || "—"} />
                <Info label="Stage" value={empDrill.stage} />
                <Info label="Status" value={empDrill.status} />
                <Info label="Days in onboarding" value={String(empDrill.daysInOnboarding)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Onboarding Steps</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Info label="Background" value={empDrill.backgroundStatus || "—"} />
                  <Info label="BG Submitted" value={empDrill.bgSubmittedDate || "—"} />
                  <Info label="BG Completed" value={empDrill.bgCompletedDate || "—"} />
                  <Info label="Orientation" value={empDrill.orientationStatus || "—"} />
                  <Info label="Orientation Date" value={empDrill.orientationDate || "—"} />
                  <Info label="Training" value={empDrill.trainingStatus || (empDrill.trainingPct ? fmtPct(empDrill.trainingPct) : "—")} />
                  <Info label="Training Due" value={empDrill.trainingDueDate || "—"} />
                  <Info label="Staffing" value={empDrill.staffingStatus || "—"} />
                  <Info label="Activation" value={empDrill.activationStatus || "—"} />
                </div>
              </div>
              {empDrill.bottleneck && (
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-[12.5px] text-amber-800">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> {empDrill.bottleneck} — {empDrill.nextAction}
                </div>
              )}
              {empDrill.notes && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-[12.5px]">{empDrill.notes}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Raw row</p>
                <pre className="mt-2 max-h-[200px] overflow-auto rounded-xl border border-border/40 bg-secondary/40 p-3 text-[11px]">{JSON.stringify(empDrill.raw, null, 2)}</pre>
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
        <Rocket className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[14px] font-semibold">Upload onboarding exports</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">CSV or XLSX · Apploi, Viventium, Monday Onboarding, Orientation, Background, Training, Staffing · multiple files supported</p>
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