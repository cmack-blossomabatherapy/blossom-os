import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, BookOpen, ClipboardCheck, FileSignature, HeartHandshake,
  Calendar, MessageSquare, AlertTriangle, Workflow, FileText, PlayCircle,
  HelpCircle, UserCheck, ChevronRight, Star, Clock, Bookmark, X, LifeBuoy,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBcbaCaseload } from "@/hooks/useBcbaCaseload";

type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Checklist" | "Recording" | "FAQ";

interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  description: string;
  minutes?: number;
  updated: string; // relative
  tags: string[];
  pinned?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: any;
  blurb: string;
  resources: Resource[];
}

const typeChip: Record<ResourceType, string> = {
  SOP:        "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  Workflow:   "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  Guide:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  Template:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  Checklist:  "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30",
  Recording:  "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  FAQ:        "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
};

const CATEGORIES: Category[] = [
  {
    id: "foundations", label: "BCBA Foundations", icon: BookOpen,
    blurb: "Role expectations, daily workflow, and operational standards.",
    resources: [
      { id: "f1", title: "BCBA Role Expectations",          type: "Guide", description: "What Blossom expects from every BCBA — clinical, operational, communication.", minutes: 6, updated: "2w ago", tags: ["foundations","role"], pinned: true },
      { id: "f2", title: "BCBA Workflow Overview",          type: "Workflow", description: "The full BCBA operational lifecycle in one map.", minutes: 5, updated: "3w ago", tags: ["workflow"] },
      { id: "f3", title: "Daily Workflow Guide",            type: "Guide", description: "A calm, repeatable daily rhythm for managing your caseload.", minutes: 4, updated: "1w ago", tags: ["daily","caseload"] },
      { id: "f4", title: "Operational Standards",           type: "SOP", description: "Blossom's operational baseline for clinical staff.", minutes: 7, updated: "1mo ago", tags: ["standards"] },
      { id: "f5", title: "Caseload Expectations",           type: "Guide", description: "Caseload size, supervision cadence, and PR cadence expectations.", minutes: 5, updated: "3w ago", tags: ["caseload"] },
      { id: "f6", title: "BCBA Success Guide",              type: "Guide", description: "What great looks like at Blossom — habits and signals.", minutes: 8, updated: "2mo ago", tags: ["success"] },
      { id: "f7", title: "Clinical Communication Standards", type: "SOP", description: "How we communicate with families, RBTs, and internal teams.", minutes: 6, updated: "3w ago", tags: ["communication"] },
      { id: "f8", title: "New BCBA Start Guide",            type: "Guide", description: "Your first 30/60/90 days at Blossom.", minutes: 10, updated: "1mo ago", tags: ["onboarding","new"] },
    ],
  },
  {
    id: "caseload", label: "Caseload Management", icon: UserCheck,
    blurb: "Organize, prioritize, and protect a healthy caseload.",
    resources: [
      { id: "c1", title: "Caseload Organization SOP",       type: "SOP", description: "How to structure your week across clients, supervision, and PRs.", minutes: 5, updated: "2w ago", tags: ["caseload"] },
      { id: "c2", title: "Client Risk Identification Guide", type: "Guide", description: "Early signals that a client is operationally at risk.", minutes: 6, updated: "1w ago", tags: ["risk"], pinned: true },
      { id: "c3", title: "Caseload Prioritization Guide",   type: "Guide", description: "A simple framework for what to work on next.", minutes: 4, updated: "3w ago", tags: ["priority"] },
      { id: "c4", title: "Managing High-Risk Clients",      type: "Workflow", description: "Stabilization steps for clients with multiple risk factors.", minutes: 7, updated: "2w ago", tags: ["risk","clinical"] },
      { id: "c5", title: "Workflow Prioritization SOP",     type: "SOP", description: "How to triage competing operational demands.", minutes: 5, updated: "1mo ago", tags: ["priority"] },
      { id: "c6", title: "Attendance Concern Workflow",     type: "Workflow", description: "What to do when attendance dips below threshold.", minutes: 4, updated: "2w ago", tags: ["attendance"] },
      { id: "c7", title: "Operational Client Health Guide", type: "Guide", description: "How Blossom measures client operational health.", minutes: 5, updated: "3w ago", tags: ["health"] },
    ],
  },
  {
    id: "supervision", label: "Supervision Operations", icon: ClipboardCheck,
    blurb: "97155, overlaps, and supervision cadence — done well.",
    resources: [
      { id: "s1", title: "Supervision SOP",                 type: "SOP", description: "The Blossom supervision standard, end-to-end.", minutes: 8, updated: "1w ago", tags: ["supervision"], pinned: true },
      { id: "s2", title: "97155 Workflow Guide",            type: "Workflow", description: "When, how, and why to use 97155 effectively.", minutes: 6, updated: "2w ago", tags: ["97155","supervision"] },
      { id: "s3", title: "Overlap Expectations",            type: "Guide", description: "Required overlap cadence and how to document it.", minutes: 4, updated: "3w ago", tags: ["overlap"] },
      { id: "s4", title: "Supervision Scheduling Guide",    type: "Guide", description: "Coordinating supervision with the scheduling team.", minutes: 5, updated: "2w ago", tags: ["scheduling"] },
      { id: "s5", title: "Supervision Escalation Workflow", type: "Workflow", description: "When supervision falls behind — who, what, when.", minutes: 5, updated: "1w ago", tags: ["escalation"] },
      { id: "s6", title: "RBT Support Expectations",        type: "Guide", description: "Coaching, feedback, and support cadence for your RBTs.", minutes: 6, updated: "2w ago", tags: ["rbt"] },
      { id: "s7", title: "Missed Supervision Protocol",     type: "SOP", description: "Recovery steps after a missed supervision window.", minutes: 4, updated: "3w ago", tags: ["recovery"] },
      { id: "s8", title: "Supervision Risk Reduction Guide", type: "Guide", description: "Patterns that prevent supervision gaps from forming.", minutes: 5, updated: "1mo ago", tags: ["prevention"] },
    ],
  },
  {
    id: "pr-auth", label: "Progress Reports & Authorizations", icon: FileSignature,
    blurb: "PRs, reassessments, and authorization workflows — the operational core.",
    resources: [
      { id: "p1", title: "PR SOP",                          type: "SOP", description: "The full Blossom PR standard.", minutes: 9, updated: "1w ago", tags: ["pr"], pinned: true },
      { id: "p2", title: "PR Timeline Guide",               type: "Guide", description: "9-week reminders, 6-week escalations, and SD involvement.", minutes: 5, updated: "1w ago", tags: ["pr","timeline"], pinned: true },
      { id: "p3", title: "Authorization Expiration Workflow", type: "Workflow", description: "Preventing lapses before authorizations expire.", minutes: 6, updated: "2w ago", tags: ["auth"] },
      { id: "p4", title: "Reassessment Workflow",           type: "Workflow", description: "Operational steps for a clean reassessment.", minutes: 7, updated: "2w ago", tags: ["reassessment"] },
      { id: "p5", title: "Parent Signature Guide",          type: "Guide", description: "How to get signatures without delay.", minutes: 3, updated: "3w ago", tags: ["signatures","parents"] },
      { id: "p6", title: "QA Coordination Guide",           type: "Guide", description: "Working effectively with QA on PR review.", minutes: 5, updated: "2w ago", tags: ["qa"] },
      { id: "p7", title: "PR Escalation Workflow",          type: "Workflow", description: "What happens at 9 weeks, 6 weeks, and SD involvement.", minutes: 4, updated: "1w ago", tags: ["pr","escalation"] },
      { id: "p8", title: "Authorization Risk Reduction Guide", type: "Guide", description: "Habits that prevent auth risks before they start.", minutes: 5, updated: "1mo ago", tags: ["auth","prevention"] },
      { id: "p9", title: "PR Submission Checklist",         type: "Checklist", description: "Final-pass checklist before submitting any PR.", minutes: 2, updated: "1w ago", tags: ["pr","checklist"] },
      { id: "p10", title: "PR Best Practices",              type: "Guide", description: "Calm, repeatable PR writing patterns.", minutes: 6, updated: "3w ago", tags: ["pr","writing"] },
    ],
  },
  {
    id: "parent-training", label: "Parent Training", icon: HeartHandshake,
    blurb: "97156 cadence, caregiver engagement, and family coordination.",
    resources: [
      { id: "pt1", title: "Parent Training SOP",            type: "SOP", description: "The Blossom parent training standard.", minutes: 7, updated: "2w ago", tags: ["pt"] },
      { id: "pt2", title: "97156 Workflow Guide",           type: "Workflow", description: "When, how, and why to run 97156 sessions well.", minutes: 6, updated: "2w ago", tags: ["97156"], pinned: true },
      { id: "pt3", title: "Parent Engagement Best Practices", type: "Guide", description: "Patterns that keep caregivers engaged over time.", minutes: 5, updated: "3w ago", tags: ["engagement"] },
      { id: "pt4", title: "Scheduling Parent Trainings",    type: "Guide", description: "Coordinating PT sessions without friction.", minutes: 4, updated: "2w ago", tags: ["scheduling"] },
      { id: "pt5", title: "Difficult Caregiver Situations", type: "Guide", description: "Navigating hard conversations with calm.", minutes: 7, updated: "1mo ago", tags: ["difficult"] },
      { id: "pt6", title: "Caregiver Communication Guide",  type: "Guide", description: "Communication patterns that build trust.", minutes: 5, updated: "3w ago", tags: ["communication"] },
      { id: "pt7", title: "Parent Training Documentation Standards", type: "SOP", description: "What to document and how.", minutes: 4, updated: "2w ago", tags: ["documentation"] },
      { id: "pt8", title: "Improving Participation Guide",  type: "Guide", description: "Practical levers to lift PT participation.", minutes: 5, updated: "3w ago", tags: ["participation"] },
    ],
  },
  {
    id: "scheduling", label: "Scheduling Coordination", icon: Calendar,
    blurb: "Coordination and escalation — BCBAs are not schedulers.",
    resources: [
      { id: "sc1", title: "Working With Scheduling SOP",    type: "SOP", description: "How the scheduling team works — and how to partner with them.", minutes: 5, updated: "2w ago", tags: ["scheduling"], pinned: true },
      { id: "sc2", title: "Cancellation Escalation Workflow", type: "Workflow", description: "When cancellations cross threshold — what to do.", minutes: 4, updated: "1w ago", tags: ["cancellations"] },
      { id: "sc3", title: "Staffing Instability Workflow",  type: "Workflow", description: "Surface and resolve unstable RBT coverage.", minutes: 5, updated: "2w ago", tags: ["staffing"] },
      { id: "sc4", title: "Session Disruption Guide",       type: "Guide", description: "Reducing the clinical impact of disruptions.", minutes: 4, updated: "3w ago", tags: ["sessions"] },
      { id: "sc5", title: "Reassignment Communication Guide", type: "Guide", description: "Talking to families and RBTs through a change.", minutes: 5, updated: "2w ago", tags: ["communication"] },
      { id: "sc6", title: "Attendance Concern Escalation",  type: "Workflow", description: "When attendance trends go the wrong way.", minutes: 4, updated: "2w ago", tags: ["attendance"] },
      { id: "sc7", title: "Parent Training Scheduling Guide", type: "Guide", description: "Booking PT without disrupting clinical care.", minutes: 4, updated: "3w ago", tags: ["pt","scheduling"] },
    ],
  },
  {
    id: "communication", label: "Clinical Communication", icon: MessageSquare,
    blurb: "Standards and copy/paste templates for every conversation.",
    resources: [
      { id: "cm1", title: "Parent Communication Standards", type: "SOP", description: "Tone, timing, and clarity for caregiver messages.", minutes: 5, updated: "2w ago", tags: ["parents"] },
      { id: "cm2", title: "Internal Communication SOP",     type: "SOP", description: "How clinical teams communicate inside Blossom.", minutes: 4, updated: "3w ago", tags: ["internal"] },
      { id: "cm3", title: "Scheduling Communication Guide", type: "Guide", description: "Talking to scheduling effectively.", minutes: 4, updated: "2w ago", tags: ["scheduling"] },
      { id: "cm4", title: "QA Communication Workflow",      type: "Workflow", description: "Tight loops with the QA team.", minutes: 4, updated: "3w ago", tags: ["qa"] },
      { id: "cm5", title: "Escalation Communication Guide", type: "Guide", description: "Calm, clear escalation messages.", minutes: 5, updated: "2w ago", tags: ["escalation"] },
      { id: "cm6", title: "RBT Support Communication",      type: "Guide", description: "Feedback that lands and lifts.", minutes: 5, updated: "1mo ago", tags: ["rbt"] },
      { id: "cm7", title: "Difficult Conversation Guide",   type: "Guide", description: "A framework for the hardest moments.", minutes: 6, updated: "1mo ago", tags: ["difficult"] },
    ],
  },
  {
    id: "escalations", label: "Escalations & Operational Workflows", icon: AlertTriangle,
    blurb: "Operational problem solving — pathways and patterns.",
    resources: [
      { id: "e1", title: "Escalation Pathways",             type: "Workflow", description: "Who to involve, when, and how.", minutes: 4, updated: "1w ago", tags: ["escalation"], pinned: true },
      { id: "e2", title: "Operational Blockers Workflow",   type: "Workflow", description: "Move past stuck workflows with confidence.", minutes: 5, updated: "2w ago", tags: ["blockers"] },
      { id: "e3", title: "Missing Documentation Workflow",  type: "Workflow", description: "Recovering missing or late documentation.", minutes: 4, updated: "3w ago", tags: ["docs"] },
      { id: "e4", title: "Client Risk Escalation Guide",    type: "Guide", description: "When client risk needs leadership eyes.", minutes: 5, updated: "2w ago", tags: ["risk"] },
      { id: "e5", title: "High Cancellation Workflow",      type: "Workflow", description: "Stabilizing a high-cancellation client.", minutes: 5, updated: "2w ago", tags: ["cancellations"] },
      { id: "e6", title: "Parent Non-Response Workflow",    type: "Workflow", description: "Operationally re-engaging quiet families.", minutes: 5, updated: "3w ago", tags: ["parents"] },
      { id: "e7", title: "Scheduling Escalation Workflow",  type: "Workflow", description: "Escalating scheduling friction cleanly.", minutes: 4, updated: "2w ago", tags: ["scheduling"] },
      { id: "e8", title: "Emergency Escalation Standards",  type: "SOP", description: "Clinical emergencies — Blossom's standard.", minutes: 6, updated: "1mo ago", tags: ["emergency"] },
    ],
  },
  {
    id: "os-guides", label: "Blossom OS Guides", icon: Workflow,
    blurb: "How to use Blossom OS — page by page.",
    resources: [
      { id: "o1", title: "Dashboard Guide",                 type: "Guide", description: "Reading your BCBA dashboard at a glance.", minutes: 3, updated: "1w ago", tags: ["os"] },
      { id: "o2", title: "Workspace Guide",                 type: "Guide", description: "The BCBA Workspace, end-to-end.", minutes: 4, updated: "1w ago", tags: ["os"] },
      { id: "o3", title: "Clients Page Guide",              type: "Guide", description: "Working your caseload from the Clients page.", minutes: 4, updated: "2w ago", tags: ["os","clients"] },
      { id: "o4", title: "Supervision Page Guide",          type: "Guide", description: "Reading and acting from Supervision.", minutes: 4, updated: "2w ago", tags: ["os","supervision"] },
      { id: "o5", title: "Parent Training Page Guide",      type: "Guide", description: "Running 97156 cadence from one screen.", minutes: 4, updated: "2w ago", tags: ["os","pt"] },
      { id: "o6", title: "Scheduling Visibility Guide",     type: "Guide", description: "What BCBAs can see — and what they can't.", minutes: 3, updated: "2w ago", tags: ["os","scheduling"] },
      { id: "o7", title: "Authorization Page Guide",        type: "Guide", description: "Tracking auths and PRs operationally.", minutes: 4, updated: "2w ago", tags: ["os","auth"] },
      { id: "o8", title: "Getting Clean Operational Answers",     type: "Guide", description: "How to find the right SOP, workflow, or template fast — plus who to ask when you can't.", minutes: 3, updated: "1w ago", tags: ["os","help"] },
      { id: "o9", title: "Notification Guide",              type: "Guide", description: "Tuning notifications to stay calm and informed.", minutes: 3, updated: "3w ago", tags: ["os"] },
    ],
  },
  {
    id: "templates", label: "Templates & Quick Resources", icon: FileText,
    blurb: "Copy/paste templates and operational cheat sheets.",
    resources: [
      { id: "t1", title: "Parent Follow-Up Templates",      type: "Template", description: "Templates for every common parent follow-up.", minutes: 2, updated: "1w ago", tags: ["templates","parents"], pinned: true },
      { id: "t2", title: "Scheduling Escalation Templates", type: "Template", description: "Calm, clear messages to scheduling.", minutes: 2, updated: "2w ago", tags: ["templates","scheduling"] },
      { id: "t3", title: "Supervision Follow-Up Templates", type: "Template", description: "Coaching notes that land.", minutes: 2, updated: "2w ago", tags: ["templates","supervision"] },
      { id: "t4", title: "PR Reminder Templates",           type: "Template", description: "Nudges for parents, RBTs, and QA.", minutes: 2, updated: "1w ago", tags: ["templates","pr"] },
      { id: "t5", title: "Documentation Checklists",        type: "Checklist", description: "Quick checks before submitting.", minutes: 2, updated: "3w ago", tags: ["checklists","docs"] },
      { id: "t6", title: "Session Coordination Templates",  type: "Template", description: "Coordination messages, ready to send.", minutes: 2, updated: "2w ago", tags: ["templates","sessions"] },
      { id: "t7", title: "Quick Workflow Checklists",       type: "Checklist", description: "One-page checklists for common workflows.", minutes: 2, updated: "2w ago", tags: ["checklists"] },
      { id: "t8", title: "Operational Cheat Sheets",        type: "Guide", description: "The BCBA cheat-sheet pack.", minutes: 4, updated: "3w ago", tags: ["cheatsheet"] },
    ],
  },
  {
    id: "recordings", label: "Training Recordings", icon: PlayCircle,
    blurb: "On-demand operational learning.",
    resources: [
      { id: "r1", title: "PR Workflow Walkthrough",         type: "Recording", description: "End-to-end PR walkthrough with QA.", minutes: 18, updated: "2w ago", tags: ["pr"] },
      { id: "r2", title: "Supervision Walkthrough",         type: "Recording", description: "97155 in practice.", minutes: 14, updated: "3w ago", tags: ["supervision"] },
      { id: "r3", title: "Parent Training Best Practices",  type: "Recording", description: "What great PT looks like.", minutes: 22, updated: "1mo ago", tags: ["pt"] },
      { id: "r4", title: "Scheduling Coordination",         type: "Recording", description: "How to partner with scheduling.", minutes: 12, updated: "3w ago", tags: ["scheduling"] },
      { id: "r5", title: "Using Blossom OS",                type: "Recording", description: "Tour of the BCBA workspace.", minutes: 16, updated: "1w ago", tags: ["os"] },
      { id: "r6", title: "Operational Expectations",        type: "Recording", description: "What Blossom expects, plainly stated.", minutes: 10, updated: "1mo ago", tags: ["expectations"] },
      { id: "r7", title: "QA Coordination",                 type: "Recording", description: "Working tightly with QA.", minutes: 11, updated: "3w ago", tags: ["qa"] },
      { id: "r8", title: "Clinical Escalations",            type: "Recording", description: "Handling escalations with calm.", minutes: 13, updated: "1mo ago", tags: ["escalation"] },
    ],
  },
  {
    id: "faq", label: "FAQ & Troubleshooting", icon: HelpCircle,
    blurb: "Quick answers to common operational questions.",
    resources: [
      { id: "q1", title: "PR Timing Questions",             type: "FAQ", description: "When does a PR start, when must it submit, what triggers escalation.", minutes: 2, updated: "1w ago", tags: ["pr","faq"] },
      { id: "q2", title: "Supervision Expectations",        type: "FAQ", description: "Cadence, overlap, and documentation answers.", minutes: 2, updated: "2w ago", tags: ["supervision","faq"] },
      { id: "q3", title: "Scheduling Escalation Questions", type: "FAQ", description: "When and how to escalate to scheduling.", minutes: 2, updated: "2w ago", tags: ["scheduling","faq"] },
      { id: "q4", title: "Parent Training Concerns",        type: "FAQ", description: "Common PT questions answered.", minutes: 2, updated: "3w ago", tags: ["pt","faq"] },
      { id: "q5", title: "Documentation Expectations",      type: "FAQ", description: "What's required, where it lives.", minutes: 2, updated: "2w ago", tags: ["docs","faq"] },
      { id: "q6", title: "QA Questions",                    type: "FAQ", description: "Working with QA, demystified.", minutes: 2, updated: "3w ago", tags: ["qa","faq"] },
      { id: "q7", title: "Workflow Troubleshooting",        type: "FAQ", description: "When workflows stall — what to try first.", minutes: 2, updated: "2w ago", tags: ["faq"] },
      { id: "q8", title: "System Troubleshooting",          type: "FAQ", description: "Common Blossom OS hiccups and fixes.", minutes: 2, updated: "2w ago", tags: ["os","faq"] },
    ],
  },
];

export default function OSBCBAResources() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("foundations");
  const [open, setOpen] = useState<Resource | null>(null);

  // Caseload-aware: derive operational signals from REAL data and recommend resources.
  const c = useBcbaCaseload();

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const allResources = useMemo(() => {
    return CATEGORIES.flatMap((c) => c.resources.map((r) => ({ ...r, _cat: c.id, _catLabel: c.label })));
  }, []);

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return allResources.filter((r) => {
      const hay = `${r.title} ${r.description} ${r.type} ${r.tags.join(" ")} ${r._catLabel}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 40);
  }, [allResources, q, isSearching]);

  const pinned = useMemo(() => allResources.filter((r) => r.pinned).slice(0, 6), [allResources]);
  const recent = useMemo(() => allResources.slice(0, 5), [allResources]);

  // Recommend resources based on real caseload risks (auths, supervision, cancellations, PT gaps).
  const recommended = useMemo(() => {
    const buckets: { id: string; reason: string; resourceId: string }[] = [];
    const prSoon = c.authAlerts.filter((a) => a.sev === "crit" || a.sev === "warn").length;
    const supBehind = c.supervisionAlerts.length;
    const cancels = c.cancellationAlerts.length;
    const ptGaps = c.ptAlerts.length;
    const coverage = c.coverageAlerts.length;

    if (prSoon > 0) {
      buckets.push({ id: "rec-pr", resourceId: "p2", reason: `${prSoon} authorization${prSoon === 1 ? "" : "s"} needs attention — review the PR timeline.` });
      buckets.push({ id: "rec-pr-esc", resourceId: "p7", reason: "Use the PR escalation pathway if you can't close the loop." });
    }
    if (supBehind > 0) {
      buckets.push({ id: "rec-sup", resourceId: "s1", reason: `${supBehind} client${supBehind === 1 ? "" : "s"} past supervision cadence.` });
      buckets.push({ id: "rec-97155", resourceId: "s2", reason: "Refresh on 97155 cadence and how it counts." });
    }
    if (cancels > 0 || coverage > 0) {
      buckets.push({ id: "rec-sched", resourceId: "sc2", reason: `${cancels + coverage} client${cancels + coverage === 1 ? "" : "s"} with cancellation or coverage risk.` });
    }
    if (ptGaps > 0) {
      buckets.push({ id: "rec-pt", resourceId: "pt2", reason: `${ptGaps} caregiver${ptGaps === 1 ? "" : "s"} overdue for 97156.` });
    }

    return buckets
      .map((b) => {
        const r = allResources.find((x) => x.id === b.resourceId);
        return r ? { reason: b.reason, resource: r as Resource & { _catLabel: string } } : null;
      })
      .filter((x): x is { reason: string; resource: Resource & { _catLabel: string } } => !!x)
      .slice(0, 4);
  }, [c.authAlerts, c.supervisionAlerts, c.cancellationAlerts, c.ptAlerts, c.coverageAlerts, allResources]);

  const current = CATEGORIES.find((c) => c.id === activeCat)!;
  const totalCount = allResources.length;

  // Suggest related resources from the same category when a resource is open.
  const related = useMemo(() => {
    if (!open) return [] as (Resource & { _catLabel?: string })[];
    const cat = CATEGORIES.find((c) => c.resources.some((r) => r.id === open.id));
    if (!cat) return [];
    return cat.resources.filter((r) => r.id !== open.id).slice(0, 4).map((r) => ({ ...r, _catLabel: cat.label }));
  }, [open]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span>BCBA</span>
            <ChevronRight className="size-3" />
            <span>Resource Library</span>
          </div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Resource Library</h1>
              <p className="text-[15px] text-muted-foreground max-w-2xl">
                The operational knowledge base for BCBAs — SOPs, workflows, templates, and recordings, all scoped to your role.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span><span className="text-foreground font-medium">{totalCount}</span> resources</span>
              <span className="h-4 w-px bg-border" />
              <span><span className="text-foreground font-medium">{CATEGORIES.length}</span> categories</span>
            </div>
          </div>

          {/* Search */}
          <div className="pt-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SOPs, workflows, templates, recordings…"
                className="w-full h-12 rounded-2xl bg-muted/60 border border-border pl-11 pr-12 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full size-7 grid place-items-center hover:bg-muted transition">
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-muted-foreground">
              <span>Try:</span>
              {["PR", "supervision", "97155", "parent training", "scheduling escalation", "QA"].map((t) => (
                <button key={t} onClick={() => setQuery(t)} className="rounded-full px-3 py-1 bg-muted/60 border border-border/70 hover:bg-muted hover:text-foreground transition">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isSearching ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-medium tracking-tight">
                Results <span className="text-muted-foreground font-normal">· {searchResults.length}</span>
              </h2>
              <button onClick={() => setQuery("")} className="text-sm text-muted-foreground hover:text-foreground transition">Clear</button>
            </div>
            {searchResults.length === 0 ? (
              <div className="rounded-2xl bg-muted/60 border border-border/60 p-10 text-center">
                <p className="text-foreground">No matches for "{query}".</p>
                <p className="text-sm text-muted-foreground mt-1">Try a broader term or reach out to your State Director for help.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchResults.map((r) => (
                  <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} categoryLabel={(r as any)._catLabel} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Recommended from real caseload signals */}
            {recommended.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-primary" />
                  <h2 className="text-xl font-medium tracking-tight">Recommended right now</h2>
                  <span className="text-xs text-muted-foreground">· based on your caseload</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommended.map(({ resource, reason }) => (
                    <button
                      key={resource.id + reason}
                      onClick={() => setOpen(resource)}
                      className="group text-left rounded-2xl bg-card border border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_28px_-16px_oklch(0.2_0.02_260/0.18)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeChip[resource.type])}>{resource.type}</span>
                        <span className="text-[11px] text-muted-foreground">{resource._catLabel}</span>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[15px] font-medium leading-snug tracking-tight">{resource.title}</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{reason}</p>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                        Open resource <ChevronRight className="size-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Pinned + Continue */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-primary" />
                  <h2 className="text-xl font-medium tracking-tight">Pinned for BCBAs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pinned.map((r) => (
                    <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} categoryLabel={(r as any)._catLabel} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h2 className="text-xl font-medium tracking-tight">Recently updated</h2>
                </div>
                <div className="rounded-2xl bg-card border border-border/70 divide-y divide-border/60 overflow-hidden">
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setOpen(r)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/60 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.type} · {r.updated}</div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Category browser */}
            <section className="space-y-5">
              <h2 className="text-xl font-medium tracking-tight">Browse by category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = c.id === activeCat;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(c.id)}
                      className={cn(
                        "group text-left rounded-2xl border p-4 transition-all",
                        active
                          ? "bg-card border-border shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
                          : "bg-muted/40 border-border/60 hover:bg-muted/70 hover:-translate-y-0.5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("rounded-xl size-9 grid place-items-center shrink-0 transition", active ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground group-hover:text-foreground")}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{c.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.resources.length} resources</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active category */}
              <div className="rounded-2xl bg-card border border-border/70 p-6 md:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{current.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{current.blurb}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{current.resources.length} resources</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {current.resources.map((r) => (
                    <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} />
                  ))}
                </div>
              </div>
            </section>

          </>
        )}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeChip[open.type])}>{open.type}</span>
                  <span className="text-xs text-muted-foreground">Updated {open.updated}</span>
                </div>
                <SheetTitle className="text-xl tracking-tight pt-1">{open.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <p className="text-[15px] text-foreground leading-relaxed">{open.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {open.minutes ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {open.minutes} min</span> : null}
                  {open.tags.length > 0 && <span className="h-4 w-px bg-border" />}
                  <div className="flex flex-wrap gap-1.5">
                    {open.tags.map((t) => (
                      <span key={t} className="rounded-full px-2 py-0.5 bg-muted/70 border border-border/60 text-xs">{t}</span>
                    ))}
                  </div>
                </div>

                {related.length > 0 && (
                  <section className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Related resources</div>
                    <ul className="divide-y divide-border/60">
                      {related.map((r) => (
                        <li key={r.id}>
                          <button
                            onClick={() => setOpen(r)}
                            className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:text-foreground transition"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{r.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{r.type} · {r.updated}</div>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="rounded-2xl border border-border/70 bg-card p-4 flex items-start gap-3">
                  <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                    <LifeBuoy className="size-4" />
                  </span>
                  <div className="text-sm">
                    <div className="font-medium">Need help using this resource?</div>
                    <p className="text-muted-foreground text-[13px] mt-0.5">
                      Reach out to your Clinical Director or State Director for coaching, or open a{" "}
                      <Link to="/tasks" className="underline underline-offset-2">support task</Link>.
                    </p>
                  </div>
                </section>

                <div className="flex items-center gap-2">
                  <button className="h-10 rounded-xl px-5 bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90 transition">Open resource</button>
                  <button className="h-10 rounded-xl px-4 bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2">
                    <Bookmark className="size-4" /> Save
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

function ResourceCard({ r, onOpen, categoryLabel }: { r: Resource; onOpen: () => void; categoryLabel?: string }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl bg-card border border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_28px_-16px_oklch(0.2_0.02_260/0.18)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeChip[r.type])}>{r.type}</span>
        {r.pinned && <Star className="size-3.5 text-primary fill-primary/30" />}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="text-[15px] font-medium leading-snug tracking-tight">{r.title}</div>
        <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {r.minutes ? <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {r.minutes} min</span> : <span>—</span>}
          {categoryLabel && <><span className="h-3 w-px bg-border" /><span className="truncate max-w-[140px]">{categoryLabel}</span></>}
        </div>
        <span>{r.updated}</span>
      </div>
    </button>
  );
}