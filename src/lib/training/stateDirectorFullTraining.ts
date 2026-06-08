/**
 * State Director Academy — full module content source of truth.
 *
 * Every State Director module gets a complete content payload:
 *   - learningObjective
 *   - stateDirectorLens          (how a State Director should read this)
 *   - stepByStep[]               (action / look for / owner / escalation)
 *   - sop                        (purpose, owner, inputs, process, escalations, quality, rhythm)
 *   - scenario                   (situation, prompt, expected response, escalation path)
 *   - knowledgeCheck[]           (≥2 module-specific questions)
 *
 * Curated entries override the derived defaults for Week 1 + select
 * load-bearing modules. Every other SD module receives a derived payload
 * built from its title, week/day, and matching SOP — so no module ever
 * falls back to the generic "what is your role" quiz.
 */
import type { Training } from "./academyData";
import { SD_SOPS_BY_WEEK } from "./academyData";
import { SD_W1_FULL_CONTENT } from "./sdWeek1Content";
import { SD_W23_FULL_CONTENT } from "./sdWeek23Content";
import { SD_W45_FULL_CONTENT } from "./sdWeek45Content";
import type { Resource } from "@/lib/resources/resourceData";
import { normalizeSopTitle } from "@/lib/resources/sdSopCoverage";

export interface SDWalkStep {
  action: string;
  lookFor: string;
  owner: string;
  escalation?: string;
  /** Optional screenshot asset id rendered under this walkthrough step. */
  screenshotId?: string;
}

export interface SDSop {
  purpose: string;
  owner: string;
  inputs: string[];
  process: string[];
  escalationTriggers: string[];
  qualityStandard: string;
  reviewRhythm: string;
}

export interface SDScenario {
  situation: string;
  prompt: string;
  expectedResponse: string;
  escalationPath: string;
}

export interface SDKnowledgeQ {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface SDFullContent {
  learningObjective: string;
  stateDirectorLens: string;
  stepByStep: SDWalkStep[];
  sop: SDSop;
  scenario: SDScenario;
  knowledgeCheck: SDKnowledgeQ[];
}

/* ---------------- screenshot assets ---------------- */

export interface SDScreenshotAsset {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  alt: string;
  moduleId: string;
  stepIndex?: number;
  resourceStatus: "available" | "pending_upload" | "needs_redaction";
  sensitivity: "training_safe" | "internal_only" | "needs_redaction";
  callouts?: { label: string; description: string }[];
  /** Human-readable resource title an admin would use when uploading the image. */
  resourceTitle?: string;
  /** Optional storage path for storage-backed images. */
  storagePath?: string;
}

/**
 * PII keywords that, if present in a training_safe screenshot's
 * title/description/alt, indicate the asset should not be marked safe.
 */
export const SD_SCREENSHOT_PII_KEYWORDS = [
  "dob",
  "date of birth",
  "ssn",
  "social security",
  "member id",
  "insurance id",
  "policy number",
  "auth id",
  "authorization id",
  "address",
  "phone",
  "email",
  "full name",
];

/**
 * Returns true when an asset marked training_safe contains obvious PII
 * keywords in its written metadata. Used in tests and by the renderer to
 * refuse to show unsafe images.
 */
export function isScreenshotPiiSafe(asset: SDScreenshotAsset): boolean {
  if (asset.sensitivity !== "training_safe") return true; // not asserting safety
  const haystack = `${asset.title} ${asset.description} ${asset.alt}`.toLowerCase();
  return !SD_SCREENSHOT_PII_KEYWORDS.some((k) => haystack.includes(k));
}

function mkShot(
  moduleId: string,
  slug: string,
  title: string,
  description: string,
  alt: string,
  callouts: { label: string; description: string }[],
): SDScreenshotAsset {
  return {
    id: `sd-${slug}`,
    moduleId,
    title,
    description,
    alt,
    stepIndex: 0,
    resourceStatus: "pending_upload",
    sensitivity: "training_safe",
    callouts,
    resourceTitle: `State Director Walkthrough - ${title}`,
  };
}

const SD_SCREENSHOTS_LIST: SDScreenshotAsset[] = [
  /* ---- Week 1 - Foundations & Welcome to Blossom (operational/system views only) ---- */
  mkShot("sd-w1d1-welcome-video-from-blossom", "w1d1-welcome-video-panel",
    "Welcome to Blossom video panel",
    "Welcome video player on the universal Welcome to Blossom page. Shows where the new SD lands first.",
    "Welcome to Blossom video panel with module rail and continue CTA", [
      { label: "Video area", description: "Plays Welcome video from Chad and Shira." },
      { label: "Module rail", description: "7 universal modules shown in order, current step highlighted." },
      { label: "Continue to launch path", description: "Calm CTA that hands off to Week 1 Day 1." },
    ]),
  mkShot("sd-w1d1-meet-the-team", "w1d1-team-leadership",
    "Blossom team and leadership section",
    "Team and leadership view inside Welcome to Blossom. Used to anchor a new SD to people, not just process.",
    "Team and leadership cards with CEO, DOO, and department partners", [
      { label: "Leadership cards", description: "CEO + Director of Operations with direct contact path." },
      { label: "Department partners", description: "Intake, Authorizations, Scheduling, Recruiting, QA, Billing leads." },
      { label: "Mentor connection", description: "Where to find your assigned launch mentor." },
    ]),
  mkShot("sd-w1d1-how-blossom-works", "w1d1-operating-flow",
    "Blossom operating flow overview",
    "How a lead becomes active care. The whole operating flow from intake to BCBA in one view.",
    "Operating flow diagram from lead to active care with department handoffs", [
      { label: "Lead to care flow", description: "Lead -> VOB -> Authorization -> Scheduling -> BCBA." },
      { label: "Department handoffs", description: "Where ownership transfers and what is required." },
      { label: "Risk points", description: "Stages most likely to stall without SD attention." },
    ]),
  mkShot("sd-w1d2-company-structure", "w1d2-org-chart",
    "Blossom org chart",
    "Blossom organization chart. Used to map decision rights and escalation paths.",
    "Org chart with executive, operations, and state leadership rows", [
      { label: "Executive leadership", description: "Owners and accountable decision-makers." },
      { label: "Operations leadership", description: "DOO + functional department heads." },
      { label: "State leadership", description: "State Directors and the people they support." },
    ]),
  mkShot("sd-w1d2-department-overview", "w1d2-department-nav",
    "Blossom OS department navigation",
    "Left-rail navigation inside Blossom OS, showing the operational workspaces a State Director uses.",
    "Blossom OS sidebar showing intake, authorizations, scheduling, recruiting, QA, and billing", [
      { label: "Intake", description: "Pipeline and VOB triage." },
      { label: "Authorizations", description: "Auth lifecycle and risk." },
      { label: "Scheduling", description: "Coverage, gaps, cancellations." },
      { label: "Recruiting / QA / Billing", description: "Talent pipeline, quality, revenue cycle." },
    ]),
  mkShot("sd-w1d2-state-director-role-overview", "w1d2-sd-training-home",
    "State Director training home",
    "Training Academy home screen for a State Director on day one. Shows day, next action, and launch progress.",
    "State Director training home with current day, next action, and mentor panel", [
      { label: "Current day", description: "Today's day card with calm Day 1 framing." },
      { label: "Next action", description: "Single highlighted next step for the SD to take now." },
      { label: "Launch progress", description: "Percent complete across the 5-week launch path." },
      { label: "Mentor / help panel", description: "Direct line to your assigned mentor." },
    ]),
  mkShot("sd-w1d2-leadership-expectations", "w1d2-launch-readiness",
    "State Director launch readiness panel",
    "Training Management readiness panel that shows whether a new SD launch is supported.",
    "Launch readiness panel with readiness status, content coverage, and resource gaps", [
      { label: "Readiness status", description: "Green / yellow / red signal for launch." },
      { label: "Content coverage", description: "Modules with complete written content." },
      { label: "Resource gaps", description: "SOPs and screenshots still missing or unmatched." },
    ]),
  mkShot("sd-w1d3-intake-department", "w1d3-intake-workspace",
    "Intake workspace",
    "Intake workspace inside Blossom OS. Anchors the SD to lead lifecycle and VOB stage.",
    "Intake workspace showing leads, VOB stage, owner, and aging risk", [
      { label: "Leads", description: "Active leads with stage and source." },
      { label: "VOB stage", description: "Where a lead is in verification of benefits." },
      { label: "Intake owner", description: "Who is accountable for moving the lead forward." },
      { label: "Aging risk", description: "Stuck leads aging past SLA." },
    ]),
  mkShot("sd-w1d3-authorizations-department", "w1d3-auth-workspace",
    "Authorizations workspace",
    "Authorizations workspace. The single view SDs use to spot expiring auths and utilization risk.",
    "Authorizations workspace with expiring auths, status buckets, and utilization risk", [
      { label: "Expiring auths", description: "Auths expiring inside the SD attention window." },
      { label: "Status buckets", description: "Active / pending / submitted / expired." },
      { label: "Owner", description: "Who is driving the submission or follow-up." },
      { label: "Utilization risk", description: "Clients under-utilizing or at risk of lapse." },
    ]),
  mkShot("sd-w1d3-scheduling-department", "w1d3-scheduling-workspace",
    "Scheduling workspace",
    "Scheduling workspace. Shows coverage health and conversion risk at a glance.",
    "Scheduling workspace with coverage gaps, cancellations, and unconverted sessions", [
      { label: "Coverage gaps", description: "Clients without enough scheduled hours." },
      { label: "Cancellations", description: "Today + this week, by reason." },
      { label: "Unconverted sessions", description: "Sessions scheduled but not converted." },
      { label: "Schedule health", description: "Single signal for the SD." },
    ]),
  mkShot("sd-w1d3-recruiting-department", "w1d3-recruiting-workspace",
    "Recruiting workspace",
    "Recruiting workspace. The funnel that drives staffing capacity in the SD's state.",
    "Recruiting workspace with candidate stages, interviews, and onboarding handoff", [
      { label: "Candidate stages", description: "Applied -> screened -> interviewed -> offer." },
      { label: "Interviews", description: "Scheduled interviews and outcomes." },
      { label: "Offers", description: "Open offers and decline reasons." },
      { label: "Onboarding handoff", description: "Hand-off into HR / Viventium." },
    ]),
  mkShot("sd-w1d3-qa-department", "w1d3-qa-workspace",
    "QA workspace",
    "QA workspace. Where progress report risk and escalation signals live.",
    "QA workspace with QA queue, progress report risks, and escalation signals", [
      { label: "QA queue", description: "Sessions / documents pending review." },
      { label: "PR risk", description: "Progress reports trending late or thin." },
      { label: "Escalation signals", description: "Compliance concerns the SD must know about." },
    ]),
  mkShot("sd-w1d3-billing-department", "w1d3-billing-workspace",
    "Billing finance workspace",
    "Billing and finance workspace. Where revenue cycle health and lost hours live.",
    "Billing finance workspace with revenue cycle, billing issues, and lost hours", [
      { label: "Revenue cycle", description: "Billed -> paid -> outstanding." },
      { label: "Billing issues", description: "Holds and rejected claims." },
      { label: "Lost hours", description: "Hours delivered but not billable." },
      { label: "Payer visibility", description: "Who is paying, who is slow." },
    ]),
  mkShot("sd-w1d4-communication-standards", "w1d4-phone-workspace",
    "Calls and communication workspace",
    "Calls workspace. Used to model the communication standard a State Director expects.",
    "Calls and communication workspace with call queue, scripts, escalation, and follow-up tracking", [
      { label: "Call queue", description: "Inbound + outbound queue." },
      { label: "Scripts", description: "Approved language for common situations." },
      { label: "Escalation handoff", description: "When to bring a call to the SD." },
      { label: "Follow-up tracking", description: "Promises made + when they are due." },
    ]),
  mkShot("sd-w1d4-escalation-structure", "w1d4-escalation-view",
    "Operational escalation view",
    "Operational escalation view showing the active risks the SD must work today.",
    "Escalation view with risk owner, next action, and escalation status", [
      { label: "Risk owner", description: "Who owns the open risk right now." },
      { label: "Next action", description: "The one concrete next step." },
      { label: "Escalation status", description: "Open / acknowledged / resolved." },
    ]),
  mkShot("sd-w1d4-accountability-expectations", "w1d4-reports-accountability",
    "Reports accountability view",
    "Reports view used to enforce accountability rhythm with department owners.",
    "Reports accountability view with KPI owner, due date, and follow-up rhythm", [
      { label: "KPI owner", description: "Who answers for this number." },
      { label: "Due date", description: "When the next update is expected." },
      { label: "Follow-up rhythm", description: "Weekly / bi-weekly cadence." },
    ]),
  mkShot("sd-w1d4-operational-ownership", "w1d4-sd-command",
    "State Director command view",
    "State Director command view. The single screen the SD opens at the start of a day.",
    "State Director command view with launch progress, unresolved risks, and next action", [
      { label: "Launch progress", description: "Where the SD is in their 5-week launch." },
      { label: "Unresolved risks", description: "Risks across departments needing SD attention." },
      { label: "Next action", description: "What to do next, not what to read next." },
    ]),
  mkShot("sd-w1d5-data-integrity", "w1d5-data-quality",
    "Reports data quality view",
    "Reports data quality view. Anchors the SD to data trust before relying on KPIs.",
    "Data quality view with missing fields, data source, and data quality risk", [
      { label: "Missing fields", description: "Records with incomplete data." },
      { label: "Data source", description: "Where the number came from (CR, Viventium, manual)." },
      { label: "Data quality risk", description: "Confidence signal on the underlying data." },
    ]),
  mkShot("sd-w1d5-utilization-mindset", "w1d5-utilization-dashboard",
    "Utilization dashboard",
    "Utilization dashboard. The view the SD uses to defend authorized hours every week.",
    "Utilization dashboard with utilization percent, authorized hours, and remaining hours", [
      { label: "Utilization percent", description: "How much of authorized hours are being used." },
      { label: "Authorized hours", description: "Approved hours per client." },
      { label: "Remaining hours", description: "Hours left in the auth window." },
      { label: "Risk bucket", description: "Under-utilized / at-risk / healthy." },
    ]),
  mkShot("sd-w1d5-state-ownership", "w1d5-state-health",
    "State health dashboard",
    "State health dashboard. One screen that summarizes the SD's whole state.",
    "State health dashboard with staffing, authorizations, utilization, and escalations", [
      { label: "Staffing", description: "Capacity vs need." },
      { label: "Authorizations", description: "Expiring / pending / submitted." },
      { label: "Utilization", description: "Aggregate state utilization signal." },
      { label: "Escalations", description: "Active SD-owned escalations." },
    ]),
  mkShot("sd-w1d5-operational-leadership-philosophy", "w1d5-leadership-rhythm",
    "Leadership operating rhythm",
    "Training Management or reports view that anchors the SD to a weekly leadership rhythm.",
    "Leadership operating rhythm with weekly review, mentor sign-off, and readiness evidence", [
      { label: "Weekly review", description: "Standing weekly review cadence." },
      { label: "Mentor sign-off", description: "Where mentor sign-off is captured." },
      { label: "Readiness evidence", description: "Evidence the SD is operationally ready." },
    ]),

  /* ---- Week 2 — Systems & Client Flow ---- */
  mkShot("sd-w2d1-cr-overview", "cr-overview-home", "CentralReach home dashboard",
    "Top-level CR landing page. Use this to confirm a new State Director can see their state's clients and schedules at a glance.",
    "CentralReach home dashboard with navigation rail and client summary tiles", [
      { label: "Top nav rail", description: "Primary jumps: Clients, Scheduling, Billing, Reports." },
      { label: "Quick links", description: "Confirm your state-specific shortcuts are pinned." },
      { label: "Notifications bell", description: "Check daily for auth/PR alerts." },
    ]),
  mkShot("sd-w2d1-navigation", "cr-navigation", "CentralReach navigation rail",
    "Left navigation in CR with the primary modules a State Director touches every day.",
    "CentralReach left navigation rail showing Clients, Scheduling, and Reports sections", [
      { label: "Clients", description: "Where you confirm intake/active client status." },
      { label: "Scheduling", description: "Calendar entry point — covered in Day 2." },
      { label: "Reports", description: "Operational reports — covered in Week 5." },
    ]),
  mkShot("sd-w2d1-calendar-basics", "cr-calendar-month-view", "CentralReach calendar month view",
    "Use this view to spot empty schedules, missed sessions, and inconsistent provider coverage.",
    "CentralReach calendar showing weekly client and provider schedule blocks", [
      { label: "Client schedule blocks", description: "Confirm clients have expected recurring sessions." },
      { label: "Provider coverage", description: "Look for days where BCBA or RBT coverage is missing." },
      { label: "Empty gaps", description: "Empty spaces can signal lost hours or pairing issues." },
    ]),
  mkShot("sd-w2d2-calendar-views", "cr-calendar-views", "Calendar views & filters",
    "Switching between day/week/month views to triage coverage.",
    "Calendar view selector and filter chips above a weekly grid", [
      { label: "View selector", description: "Day for triage, week for planning, month for trends." },
      { label: "Provider filter", description: "Filter by BCBA/RBT to find under-utilized staff." },
    ]),
  mkShot("sd-w2d2-session-tracking", "cr-session-tracking", "Session tracking board",
    "Where converted vs scheduled sessions show up for the day.",
    "Session tracking list with status chips per appointment", [
      { label: "Status chip", description: "Converted, scheduled, no-show, cancelled." },
      { label: "Provider column", description: "Confirm the right RBT is assigned." },
    ]),
  mkShot("sd-w2d3-converted-sessions", "cr-converted-sessions", "Converted sessions report",
    "Daily report showing sessions that successfully converted to billable hours.",
    "Report grid of converted sessions with totals row", [
      { label: "Totals row", description: "Compare to scheduled total — gap is your conversion %." },
      { label: "Outlier providers", description: "Conversion <80% needs a same-week conversation." },
    ]),
  mkShot("sd-w2d3-non-converted-sessions", "cr-non-converted-sessions", "Non-converted sessions report",
    "List of sessions that didn't convert — your daily clean-up queue.",
    "List of sessions with reason codes for non-conversion", [
      { label: "Reason code column", description: "Cancellation reasons cluster around 2-3 patterns." },
      { label: "Repeat offenders", description: "Same client/provider repeatedly = pairing issue." },
    ]),
  mkShot("sd-w2d4-lead-lifecycle", "blossom-lead-lifecycle", "Lead lifecycle pipeline",
    "Blossom OS lead pipeline from New → VOB → Intake → Active.",
    "Kanban-style lead pipeline with stage columns and lead cards", [
      { label: "Stage columns", description: "Confirm leads aren't stuck in one column > 5 days." },
      { label: "Aging indicator", description: "Red dot = aging risk; talk to intake same day." },
    ]),
  mkShot("sd-w2d4-intake-workflow", "blossom-intake-workflow", "Intake workflow board",
    "Active intakes and where each one is stuck in the workflow.",
    "Intake workflow board with checklist progress per client", [
      { label: "Checklist progress", description: "Green = ready to schedule; yellow = needs follow-up." },
      { label: "Owner avatar", description: "Every intake must have a named owner." },
    ]),
  mkShot("sd-w2d5-vob-process", "solum-vob-process", "VOB decision center",
    "Solum VOB output that intake uses to make a pricing & coverage decision.",
    "VOB decision summary with coverage status and copay fields", [
      { label: "Coverage status", description: "Verified / pending / denied." },
      { label: "Copay & deductible", description: "Drives client conversation about cost." },
      { label: "Decision recommendation", description: "Solum's recommended next step." },
    ]),
  mkShot("sd-w2d5-client-workflow", "blossom-client-workflow", "Active client workflow",
    "Active client view showing supervision, sessions, auths, and PR status.",
    "Client detail page with tabs for sessions, auths, and PRs", [
      { label: "Auth status tile", description: "Expiring auths surface here first." },
      { label: "PR status tile", description: "Missing PRs block auth submission." },
      { label: "Session adherence", description: "Below target = pairing or scheduling issue." },
    ]),

  /* ---- Week 3 — Authorizations & Utilization ---- */
  mkShot("sd-w3d1-authorization-lifecycle", "auth-lifecycle-board", "Authorization lifecycle board",
    "End-to-end auth board showing every active auth grouped by status.",
    "Kanban board with columns: Drafting, Awaiting Submission, Submitted, Approved, Expiring", [
      { label: "Awaiting Submission column", description: "Anything > 3 days here is at risk." },
      { label: "Expiring column", description: "30/14/7-day expiration buckets." },
      { label: "Owner avatars", description: "Every card must have an owner." },
    ]),
  mkShot("sd-w3d1-auth-statuses", "auth-statuses-legend", "Auth status legend",
    "Reference card mapping each auth status to its SLA and next action.",
    "Auth status legend with color-coded chips and SLA descriptions", [
      { label: "Status colors", description: "Match the lifecycle board colors." },
      { label: "SLA column", description: "Maximum days allowed in each status." },
    ]),
  mkShot("sd-w3d1-submission-process", "auth-submission-form", "Auth submission form",
    "The submission form the Authorization Coordinator completes before sending to payer.",
    "Authorization submission form with payer, units, and date range fields", [
      { label: "Date range", description: "Must align with PR period." },
      { label: "Units requested", description: "Compare to utilization to prevent under-auth." },
    ]),
  mkShot("sd-w3d2-progress-reports", "auth-progress-reports", "Progress reports tracker",
    "Tracker showing which PRs are due, drafted, and submitted per BCBA.",
    "Progress report tracker grouped by BCBA with due-date column", [
      { label: "Due-date column", description: "Anything red = blocks the next auth." },
      { label: "BCBA grouping", description: "Identify BCBAs needing PR support." },
    ]),
  mkShot("sd-w3d3-utilization", "auth-utilization-percent", "Utilization % dashboard",
    "Per-client utilization % vs authorized hours.",
    "Bar chart showing utilization percentage per client against authorized hours", [
      { label: "Below 80%", description: "Under-utilization risk — pairing/scheduling issue." },
      { label: "Above 100%", description: "Over-utilization — auth top-up needed." },
    ]),
  mkShot("sd-w3d4-expiring-auths", "auth-expiring-list", "Expiring auths list",
    "Monday-morning view of every auth expiring in the next 30 days.",
    "List of expiring auths sorted by days-to-expiration", [
      { label: "Days-to-expiration", description: "Within 14 days with no submission = escalate." },
      { label: "PR-ready column", description: "Confirms PR is in place to support submission." },
    ]),
  mkShot("sd-w3d4-missing-prs", "auth-missing-prs", "Missing PRs report",
    "List of clients whose next auth is blocked because a PR is outstanding.",
    "Missing PR report with BCBA and days-overdue columns", [
      { label: "Days overdue", description: "Anything > 7 days needs a same-day conversation." },
      { label: "Auth impact column", description: "Shows which auth submission is blocked." },
    ]),
  mkShot("sd-w3d5-utilization-management", "auth-utilization-mgmt", "Utilization management overview",
    "State-wide rollup of utilization, expiring auths, and revenue-at-risk.",
    "Dashboard with utilization gauge, expiring auths tile, and revenue-at-risk number", [
      { label: "Utilization gauge", description: "Target band 85-100%." },
      { label: "Revenue-at-risk", description: "Dollarized impact of expiring auths." },
    ]),

  /* ---- Week 4 — Staffing, Recruiting & Operations ---- */
  mkShot("sd-w4d1-staffing-structure", "staffing-structure-org", "State staffing structure",
    "Org-style chart for your state — BCBAs, RBTs, and supervisory pairings.",
    "Org chart with BCBA nodes and grouped RBTs underneath", [
      { label: "BCBA load", description: "Confirm supervisor:RBT ratio inside policy." },
      { label: "Unpaired RBTs", description: "Anyone unpaired is a coverage risk." },
    ]),
  mkShot("sd-w4d2-coverage-gaps", "staffing-coverage-gaps", "Coverage gaps board",
    "Open coverage gaps by client/day with proposed resolution.",
    "Coverage gaps board grouped by client with proposed RBT swaps", [
      { label: "Open gap row", description: "Each row needs an owner and a target close date." },
      { label: "Proposed swap", description: "Suggested RBT to backfill — confirm before promising." },
    ]),
  mkShot("sd-w4d2-cancellations", "staffing-cancellations", "Cancellations triage",
    "Daily cancellation queue with reason codes.",
    "Cancellations list with client, provider, and reason code per row", [
      { label: "Reason code", description: "Family vs provider cancellations need different responses." },
      { label: "Repeat patterns", description: "Same client cancelling = retention conversation." },
    ]),
  mkShot("sd-w4d3-recruiting-workflow", "recruiting-workflow", "Recruiting workflow board",
    "Candidate pipeline from sourcing through offer.",
    "Recruiting Kanban: Sourced, Screened, Interview, Offer, Hired", [
      { label: "Aging in stage", description: "Candidates aging > 7 days fall out of the funnel." },
      { label: "Stage owner", description: "Recruiter vs hiring manager — confirm the next move." },
    ]),
  mkShot("sd-w4d3-candidate-pipeline", "recruiting-pipeline", "Candidate pipeline list",
    "List view of active candidates with source and status.",
    "Candidate list with source channel and current status columns", [
      { label: "Source channel", description: "Track which channel converts." },
      { label: "Status chip", description: "Stalled candidates need a recruiter ping." },
    ]),
  mkShot("sd-w4d3-interview-process", "recruiting-interview", "Interview scorecard",
    "Scorecard used during candidate interviews — keep it consistent across interviewers.",
    "Interview scorecard with rubric categories and ratings", [
      { label: "Rubric categories", description: "Same rubric for every candidate." },
      { label: "Recommendation field", description: "Hire / no-hire / next round." },
    ]),
  mkShot("sd-w4d3-hiring-flow", "recruiting-hiring-flow", "Hiring & offer flow",
    "Where offer, background check, and start-date confirmation live.",
    "Hiring flow checklist with offer, background, and start-date steps", [
      { label: "Offer step", description: "Must include compensation band confirmation." },
      { label: "Background step", description: "Required clear status before start date." },
    ]),
  mkShot("sd-w4d4-viventium-workflow", "viventium-onboarding", "Viventium onboarding queue",
    "New-hire onboarding queue inside Viventium.",
    "Viventium onboarding queue with task completion checklist per hire", [
      { label: "I-9 / W-4 status", description: "Required before first session." },
      { label: "Outstanding tasks", description: "Blockers must be resolved before start date." },
    ]),

  /* ---- Week 5 — State Ownership ---- */
  mkShot("sd-w5d1-utilization-kpis", "kpi-utilization", "Utilization KPI scorecard",
    "Weekly utilization KPIs for your state.",
    "KPI scorecard with utilization trend and target band", [
      { label: "Trend arrow", description: "Up-and-to-the-right is the goal." },
      { label: "Target band", description: "85-100% utilization." },
    ]),
  mkShot("sd-w5d1-staffing-kpis", "kpi-staffing", "Staffing KPI scorecard",
    "Staffing health KPIs: coverage, cancellations, supervisor ratio.",
    "Staffing KPI scorecard with coverage and cancellation tiles", [
      { label: "Cancellation rate", description: "Below target = retention risk." },
      { label: "Supervisor ratio", description: "Inside policy bounds." },
    ]),
  mkShot("sd-w5d1-client-kpis", "kpi-clients", "Client KPI scorecard",
    "Client lifecycle KPIs: active count, retention, NPS proxy.",
    "Client KPI scorecard with active count and retention trend", [
      { label: "Active count", description: "Tracks state growth/contraction." },
      { label: "Retention trend", description: "Sustained drop = leadership review." },
    ]),
  mkShot("sd-w5d1-recruiting-kpis", "kpi-recruiting", "Recruiting KPI scorecard",
    "Recruiting KPIs: pipeline health, time-to-hire, offer acceptance.",
    "Recruiting KPI scorecard with pipeline funnel and time-to-hire", [
      { label: "Time-to-hire", description: "Aging = candidates fall out." },
      { label: "Offer acceptance", description: "Below 70% = compensation conversation." },
    ]),
  mkShot("sd-w5d2-weekly-meetings", "weekly-meeting-agenda", "Weekly meeting agenda template",
    "Standing weekly state meeting agenda template.",
    "Meeting agenda template with KPIs, escalations, and action items sections", [
      { label: "KPIs section", description: "Same KPIs every week — consistency over novelty." },
      { label: "Action items section", description: "Every item has owner + due date." },
    ]),
  mkShot("sd-w5d2-escalation-tracking", "escalation-tracker", "Escalation tracker",
    "Active escalations across departments in your state.",
    "Escalation tracker grouped by department with status and owner", [
      { label: "Status column", description: "Open > 5 days without movement = re-escalate." },
      { label: "Department grouping", description: "Identify which department is producing escalations." },
    ]),
  mkShot("sd-w5d4-state-health-monitoring", "state-health-monitor", "State health monitor",
    "Single page that summarizes the operational health of your state.",
    "State health dashboard with green/yellow/red tiles across operations areas", [
      { label: "Tile colors", description: "Green / yellow / red across each operations area." },
      { label: "Drilldown links", description: "Click a tile to land in the specific workspace." },
    ]),
];

const SD_SCREENSHOTS_BY_MODULE: Record<string, SDScreenshotAsset[]> = (() => {
  const map: Record<string, SDScreenshotAsset[]> = {};
  for (const s of SD_SCREENSHOTS_LIST) {
    if (!map[s.moduleId]) map[s.moduleId] = [];
    map[s.moduleId].push(s);
  }
  return map;
})();

const SD_SCREENSHOTS_BY_ID: Record<string, SDScreenshotAsset> = (() => {
  const map: Record<string, SDScreenshotAsset> = {};
  for (const s of SD_SCREENSHOTS_LIST) map[s.id] = s;
  return map;
})();

/** Returns every screenshot asset registered for a State Director module id. */
export function getStateDirectorScreenshots(moduleId: string): SDScreenshotAsset[] {
  return SD_SCREENSHOTS_BY_MODULE[moduleId] ?? [];
}

/** Lookup a single screenshot asset by id. */
export function getStateDirectorScreenshotById(id: string): SDScreenshotAsset | null {
  return SD_SCREENSHOTS_BY_ID[id] ?? null;
}

/** Exposed for tests. */
export const SD_PRIORITY_SCREENSHOT_MODULES: string[] = Object.keys(SD_SCREENSHOTS_BY_MODULE);

/** Every registered State Director screenshot asset (read-only). */
export const SD_ALL_SCREENSHOTS: ReadonlyArray<SDScreenshotAsset> = SD_SCREENSHOTS_LIST;

/* ---------------- no-screenshot decisions ---------------- */

/**
 * Intentional decision that a State Director module does NOT need a
 * walkthrough screenshot. Used for reflective, sign-off, certification,
 * and shadowing modules where a screenshot would either be fake, unsafe
 * (PHI), or actively misleading. The replacementEvidence describes what
 * the learner produces instead, so admins can verify completion without a
 * fabricated image.
 */
export interface SDNoScreenshotDecision {
  moduleId: string;
  reason: string;
  replacementEvidence: string;
}

export const SD_NO_SCREENSHOT_DECISIONS: SDNoScreenshotDecision[] = [
  {
    moduleId: "sd-w4d5-scheduling-shadow",
    reason: "Shadow session is live — a screenshot would not represent the learning.",
    replacementEvidence: "Mentor sign-off and a short written summary of what was observed.",
  },
  {
    moduleId: "sd-w4d5-recruiting-shadow",
    reason: "Shadow session is live — a screenshot would not represent the learning.",
    replacementEvidence: "Mentor sign-off and notes from the recruiting walkthrough.",
  },
  {
    moduleId: "sd-w4d5-bcba-shadow",
    reason: "Shadow session is live and may include PHI — screenshots are not appropriate.",
    replacementEvidence: "Mentor sign-off plus written reflection on what BCBA oversight requires.",
  },
  {
    moduleId: "sd-w4d5-state-director-shadow",
    reason: "Peer-to-peer shadow — operational judgment is the learning, not a UI view.",
    replacementEvidence: "Mentor sign-off and a written summary of the State Director's day.",
  },
  {
    moduleId: "sd-w5d5-final-knowledge-review",
    reason: "Knowledge check is the evidence — no UI screenshot is required.",
    replacementEvidence: "Passing score on the final knowledge review.",
  },
  {
    moduleId: "sd-w5d5-readiness-assessment",
    reason: "Reflective leadership assessment — written response is the evidence.",
    replacementEvidence: "Submitted readiness reflection reviewed by your mentor.",
  },
  {
    moduleId: "sd-w5d5-leadership-sign-off",
    reason: "Sign-off happens in a live conversation — no UI screenshot exists.",
    replacementEvidence: "Recorded leadership sign-off in your training record.",
  },
  {
    moduleId: "sd-w5d5-state-director-certification",
    reason: "Certification is the outcome of the journey — there is no UI to screenshot.",
    replacementEvidence: "Issued State Director certification recorded in HR.",
  },
];

const SD_NO_SCREENSHOT_BY_ID: Record<string, SDNoScreenshotDecision> = (() => {
  const map: Record<string, SDNoScreenshotDecision> = {};
  for (const d of SD_NO_SCREENSHOT_DECISIONS) map[d.moduleId] = d;
  return map;
})();

/** Lookup an explicit no-screenshot decision for a State Director module. */
export function getStateDirectorNoScreenshotDecision(
  moduleId: string,
): SDNoScreenshotDecision | null {
  return SD_NO_SCREENSHOT_BY_ID[moduleId] ?? null;
}

/**
 * Resolve a published+openable Resource Library item that represents the
 * given screenshot asset. Matching is tolerant: admins can upload using
 * the exact resourceTitle, a slugified file name, the module id, or a
 * storage path containing the asset/module id.
 */
export type SDScreenshotMatchKind =
  | "title"
  | "filename"
  | "module_id"
  | "asset_id";

export interface SDScreenshotResourceMatch {
  resource: Resource;
  url: string | null;
  needsRedaction: boolean;
  openable: boolean;
  matchedBy: SDScreenshotMatchKind;
}

function shotSlugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "") // strip extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shotBasename(p: string): string {
  return (p.split(/[\\/]/).pop() ?? p).trim();
}

export function findScreenshotResource(
  asset: SDScreenshotAsset,
  resources: Resource[],
): SDScreenshotResourceMatch | null {
  const titleKeys = new Set<string>();
  for (const t of [asset.resourceTitle, asset.title]) {
    if (!t) continue;
    titleKeys.add(normalizeSopTitle(t));
    const slug = shotSlugify(t);
    if (slug) titleKeys.add(slug);
  }
  const idSet = new Set<string>([asset.id, asset.moduleId].filter(Boolean));

  for (const r of resources) {
    if (r.status === "Archived") continue;
    if (r.uploadStatus && r.uploadStatus !== "published") continue;
    if (r.sensitivity === "excluded") continue;

    const anyR = r as Resource & {
      fileName?: string;
      file_name?: string;
      name?: string;
      metadata?: { fileName?: string; file_name?: string; name?: string };
    };

    let matchedBy: SDScreenshotMatchKind | null = null;

    // 1) Title match (normalized or slugified)
    const rTitleNorm = normalizeSopTitle(r.title);
    const rTitleSlug = shotSlugify(r.title);
    if (titleKeys.has(rTitleNorm) || (rTitleSlug && titleKeys.has(rTitleSlug))) {
      matchedBy = "title";
    }

    // 2) File name / metadata / basename match against asset id / module id / title slug
    if (!matchedBy) {
      const candidates: string[] = [];
      const pushIf = (v: unknown) => { if (typeof v === "string" && v) candidates.push(v); };
      pushIf(anyR.fileName); pushIf(anyR.file_name); pushIf(anyR.name);
      if (anyR.metadata) {
        pushIf(anyR.metadata.fileName);
        pushIf(anyR.metadata.file_name);
        pushIf(anyR.metadata.name);
      }
      for (const p of [r.url, r.fileUrl, r.storagePath]) {
        if (typeof p === "string" && p) candidates.push(shotBasename(p));
      }
      for (const c of candidates) {
        const s = shotSlugify(c);
        if (!s) continue;
        if (s === asset.id) { matchedBy = "asset_id"; break; }
        if (s === asset.moduleId) { matchedBy = "module_id"; break; }
        if (titleKeys.has(s)) { matchedBy = "filename"; break; }
      }
    }

    // 3) Any path segment equal to asset id or module id
    if (!matchedBy) {
      for (const p of [r.storagePath, r.url, r.fileUrl]) {
        if (typeof p !== "string" || !p) continue;
        for (const seg of p.split(/[\\/]/)) {
          const s = shotSlugify(seg);
          if (!s) continue;
          if (s === asset.id) { matchedBy = "asset_id"; break; }
          if (s === asset.moduleId) { matchedBy = "module_id"; break; }
        }
        if (matchedBy) break;
      }
    }

    if (!matchedBy) continue;

    const url =
      (r.url && /^https?:\/\//i.test(r.url) ? r.url : null) ||
      r.fileUrl ||
      null;
    const hasStorage = !!r.storagePath;
    const needsRedaction = r.uploadStatus === ("needs_redaction" as never);
    if (url || hasStorage) {
      return { resource: r, url, needsRedaction, openable: true, matchedBy };
    }
  }
  return null;
}

/** Module ids that have a registered Week 1 walkthrough screenshot. */
export const SD_W1_SCREENSHOT_MODULE_IDS: ReadonlyArray<string> =
  SD_SCREENSHOTS_LIST.filter((s) => s.moduleId.startsWith("sd-w1d")).map((s) => s.moduleId);

/** Returns true when the asset/module belongs to Week 1. */
export function isWeek1Screenshot(asset: SDScreenshotAsset): boolean {
  return asset.moduleId.startsWith("sd-w1d");
}

/* ---------------- helpers ---------------- */

function parseSdId(id: string): { week: number; day: number } | null {
  const m = /^sd-w(\d+)d(\d+)-/.exec(id);
  return m ? { week: Number(m[1]), day: Number(m[2]) } : null;
}

function cleanTitle(t: string): string {
  return t.replace(/^W\d+ · D\d+ — /, "").trim();
}

const WEEK_THEME: Record<number, string> = {
  1: "Foundations & Welcome to Blossom",
  2: "Systems & Client Flow",
  3: "Authorizations & Utilization",
  4: "Staffing, Recruiting & Operations",
  5: "State Ownership & Leadership",
};

const WEEK_OWNER: Record<number, string> = {
  1: "State Director Program",
  2: "Operations Leadership",
  3: "Authorizations Lead",
  4: "Recruiting & Staffing Leads",
  5: "State Director (you)",
};

/* ---------------- curated overrides ---------------- */

const CURATED: Record<string, SDFullContent> = {
  /* ---------- Week 1 · Day 1 — Welcome to Blossom ---------- */
  "sd-w1d1-welcome-video-from-blossom": {
    learningObjective:
      "Internalize Blossom's purpose and the operational tone leaders are expected to set.",
    stateDirectorLens:
      "This is the only module where you are explicitly a learner. Every module after this, you are responsible for translating the why into operational decisions in your state.",
    stepByStep: [
      { action: "Block 15 quiet minutes. Watch the welcome video without distractions.", lookFor: "Phrases leadership repeats — those become your operating language.", owner: "You" },
      { action: "Write down one sentence: who Blossom serves, and what we promise them.", lookFor: "Clarity over polish. If you can't say it simply, you can't lead from it.", owner: "You" },
      { action: "Send your sentence to your mentor before your first check-in.", lookFor: "Mentor will refine the language with you.", owner: "Mentor" },
      { action: "Save the video link in your personal SD playbook for re-watching at month 3.", lookFor: "Most directors hear different things the second time.", owner: "You" },
      { action: "Carry one takeaway into your first state stand-up.", lookFor: "Set the tone for your team using leadership's own language.", owner: "You" },
    ],
    sop: {
      purpose: "Establish a shared operational foundation across every State Director.",
      owner: "State Director Program",
      inputs: ["Welcome video link", "Note-taking template", "Mentor check-in slot"],
      process: [
        "Watch the welcome video end-to-end.",
        "Capture one takeaway and one question.",
        "Bring both to your first mentor check-in.",
        "Re-watch at the 90-day mark.",
      ],
      escalationTriggers: [
        "If the video link is broken, notify the State Director Program owner same day.",
      ],
      qualityStandard: "Watched in full, one takeaway captured, one question prepared.",
      reviewRhythm: "Re-watch at 90 days and 12 months as a tone-check.",
    },
    scenario: {
      situation:
        "It's Monday morning. You join your first state stand-up as the new State Director.",
      prompt:
        "How do you open the meeting in 60 seconds so the room hears Blossom's purpose, not your résumé?",
      expectedResponse:
        "Name who we serve (families with kids who need ABA), what we promise (calm, consistent, on-time care), and what you'll be looking at this week (one or two specific KPIs). End with a question for the team.",
      escalationPath:
        "No escalation needed — this is tone-setting. If the team pushes back hard, loop in your mentor before the next stand-up.",
    },
    knowledgeCheck: [
      {
        id: "sd-w1d1-welcome-video-from-blossom-q1",
        question: "What is the State Director's job after watching the welcome video?",
        options: [
          "Memorize the script and repeat it verbatim.",
          "Translate leadership's why into operational decisions in your state.",
          "Wait for instructions on how to apply it.",
        ],
        answerIndex: 1,
      },
      {
        id: "sd-w1d1-welcome-video-from-blossom-q2",
        question: "When should you re-watch the welcome video?",
        options: [
          "Never — once is enough.",
          "At the 90-day mark as a tone-check.",
          "Only if a family complains.",
        ],
        answerIndex: 1,
      },
    ],
  },

  "sd-w1d1-mission-vision": {
    learningObjective:
      "Restate Blossom's mission and vision in your own words and use them to make operational calls.",
    stateDirectorLens:
      "Mission and vision are the tiebreakers when the playbook runs out. Your team will watch how you use them — not whether you can recite them.",
    stepByStep: [
      { action: "Read the mission & vision page end-to-end.", lookFor: "The phrase 'we exist to…' — that's the line you'll repeat.", owner: "You" },
      { action: "Rewrite the mission in one sentence in your own words.", lookFor: "If it doesn't fit on a sticky note, it's too long.", owner: "You" },
      { action: "Map each value to one current operational metric in your state.", lookFor: "Values without metrics are decoration.", owner: "You" },
      { action: "Send your one-line restatement to your mentor.", lookFor: "Mentor will calibrate language with you.", owner: "Mentor" },
      { action: "Use your restatement to open or close a department meeting this week.", lookFor: "Team should recognize the language by week 3.", owner: "You" },
    ],
    sop: {
      purpose: "Make Blossom's mission and vision actionable at the state level.",
      owner: "State Director Program",
      inputs: ["Mission & vision page", "Current state KPI snapshot"],
      process: [
        "Read mission and vision.",
        "Restate in one sentence.",
        "Map values to metrics.",
        "Bring restatement to mentor check-in.",
        "Use language in a real meeting this week.",
      ],
      escalationTriggers: [
        "If you cannot connect a value to any metric in your state, raise it with your mentor — that's a real gap.",
      ],
      qualityStandard: "One-sentence restatement that ladders to at least one operational metric.",
      reviewRhythm: "Revisit at every quarterly leadership review.",
    },
    scenario: {
      situation:
        "A BCBA tells you a family is unhappy and wants to leave Blossom for a competitor closer to home.",
      prompt:
        "Which part of the mission do you anchor your response in, and what's the first operational move?",
      expectedResponse:
        "Anchor in 'calm, consistent care for families who need it.' First move: get the family on a call within 24 hours, understand the real reason, and see if pairing/scheduling can solve it before retention is lost.",
      escalationPath:
        "If the family still wants to leave after the call, loop in QA and Operations Leadership — log it in client timeline.",
    },
    knowledgeCheck: [
      {
        id: "sd-w1d1-mission-vision-q1",
        question: "How should a State Director use Blossom's mission day-to-day?",
        options: [
          "Recite it at every meeting.",
          "Use it as a tiebreaker when the playbook runs out.",
          "Frame it on the wall.",
        ],
        answerIndex: 1,
      },
      {
        id: "sd-w1d1-mission-vision-q2",
        question: "What makes a Blossom value real at the state level?",
        options: [
          "It's printed on the onboarding deck.",
          "It maps to at least one operational metric you actually watch.",
          "Leadership reminds the team about it.",
        ],
        answerIndex: 1,
      },
    ],
  },

  /* ---------- Week 3 · Day 1 — Authorization Lifecycle (high-leverage) ---------- */
  "sd-w3d1-authorization-lifecycle": {
    learningObjective:
      "Understand the full authorization lifecycle and know exactly where it tends to stall in your state.",
    stateDirectorLens:
      "Authorizations are revenue. You don't write them — you make sure no client ever loses hours because of a delay you could have unblocked.",
    stepByStep: [
      { action: "Open the Authorizations dashboard for your state.", lookFor: "Auths in Awaiting Submission and Expiring Soon — those are your at-risk buckets.", owner: "State Director" },
      { action: "Pick three auths from each bucket and trace where they're stuck.", lookFor: "Owner, days in status, missing inputs (PR, assessment, etc.).", owner: "Authorization Coordinator", escalation: "If owner is missing or status is stale > 3 days, escalate." },
      { action: "Sit with the Authorizations Coordinator for 30 minutes.", lookFor: "Their actual workflow vs. the SOP. Differences are training gaps or process gaps.", owner: "Authorization Coordinator" },
      { action: "Walk through one full auth: initial → submission → approval → utilization.", lookFor: "Hand-off moments — those are where things drop.", owner: "Authorization Coordinator" },
      { action: "Document one bottleneck in your state and bring it to the weekly meeting.", lookFor: "Specific, owned, and time-bound — not 'auths are slow.'", owner: "State Director", escalation: "Bring to Operations Leadership if structural." },
    ],
    sop: {
      purpose: "Protect treatment continuity and revenue by keeping every authorization current.",
      owner: "Authorization Coordinator (Authorizations Lead oversight)",
      inputs: ["Authorization status board", "PRs and reassessments", "Insurance portal access"],
      process: [
        "Track every active auth by status and expiration date.",
        "Submit at least 30 days before expiration.",
        "Confirm approval and log into CR.",
        "Flag expiring auths every Monday.",
        "Escalate any auth at risk of lapsing.",
      ],
      escalationTriggers: [
        "Auth within 14 days of expiration with no submission.",
        "Missing PR blocking submission > 7 days.",
        "Denied auth without resubmission plan within 48 hours.",
      ],
      qualityStandard: "Zero lapsed authorizations. < 5% of auths in 'expiring soon' on any Monday.",
      reviewRhythm: "Weekly auth review (Mon AM). Monthly utilization review with Operations.",
    },
    scenario: {
      situation:
        "It's Friday at 4pm. You see two clients with auths expiring Sunday and no PR submitted.",
      prompt:
        "What do you do in the next hour, and who do you call?",
      expectedResponse:
        "Call the Authorization Coordinator and the assigned BCBA immediately. Confirm where the PR is stuck. If the BCBA can finish it before EOD, push for submission tonight. If not, contact the payer Monday morning with a backdating request and notify the family proactively. Log the situation in the client timeline.",
      escalationPath:
        "Loop in Operations Leadership same evening if either auth will lapse. Document the cause and the prevention plan in Monday's weekly meeting.",
    },
    knowledgeCheck: [
      {
        id: "sd-w3d1-authorization-lifecycle-q1",
        question: "What is the State Director's role in the authorization workflow?",
        options: [
          "Personally submit every authorization.",
          "Make sure no client loses hours because of a delay you could have unblocked.",
          "Only review auths at month-end.",
        ],
        answerIndex: 1,
      },
      {
        id: "sd-w3d1-authorization-lifecycle-q2",
        question: "When should an authorization be submitted before expiration?",
        options: [
          "At least 30 days before expiration.",
          "When the family asks about it.",
          "After the auth has lapsed, with a backdating request.",
        ],
        answerIndex: 0,
      },
    ],
  },
};

/* ---------------- derivation ---------------- */

function sopNameFor(week: number, day: number, position: number, title: string): string {
  return SD_SOPS_BY_WEEK[week]?.[day]?.[position] ?? `${title} SOP`;
}

function deriveContent(training: Training): SDFullContent {
  const parsed = parseSdId(training.id);
  const week = parsed?.week ?? 1;
  const day = parsed?.day ?? 1;
  const title = cleanTitle(training.title);
  const owner = WEEK_OWNER[week] ?? "State Director (you)";
  const sopName = sopNameFor(week, day, 0, title);
  const theme = WEEK_THEME[week] ?? "State Director Academy";

  const stepByStep: SDWalkStep[] = [
    {
      action: `Open the ${title} workflow in Blossom OS and review the live data for your state.`,
      lookFor: "Anomalies — anything outside the normal range or stuck > 3 days.",
      owner: "State Director",
    },
    {
      action: `Read the named SOP (${sopName}) end-to-end.`,
      lookFor: "Who owns each step, the SLA, and where ownership hands off.",
      owner: "You",
    },
    {
      action: `Sit with the department owner for 30 minutes and watch them run ${title.toLowerCase()}.`,
      lookFor: "Where their real workflow differs from the SOP — that's either training or process.",
      owner,
      escalation: "If you find a structural gap, raise it with Operations Leadership.",
    },
    {
      action: "Pick one example from your state and walk it end-to-end out loud.",
      lookFor: "Hand-offs and missing data — those are where this workflow breaks.",
      owner: "You",
    },
    {
      action: "Document 1 strength and 1 gap, and bring both to your mentor check-in.",
      lookFor: "Specific, owned, time-bound — not vague observations.",
      owner: "You",
      escalation: "If the gap is repeating across states, escalate to Operations Leadership.",
    },
  ];

  const sop: SDSop = {
    purpose: `Establish a consistent operational standard for ${title.toLowerCase()} so every state runs it the same way.`,
    owner,
    inputs: [
      `${sopName}`,
      "Live data from the relevant Blossom OS workspace",
      "Department owner's calendar for a 30-minute walkthrough",
    ],
    process: [
      `Read ${sopName} in full.`,
      `Pull the live ${title.toLowerCase()} view for your state.`,
      "Walk one example end-to-end with the department owner.",
      "Identify 1 strength and 1 gap.",
      "Confirm understanding in your mentor check-in.",
    ],
    escalationTriggers: [
      "Workflow stalled > 3 days with no owner.",
      "Repeating gap that affects more than one client/staff member.",
      "Any pattern that puts revenue, compliance, or client care at risk.",
    ],
    qualityStandard: `State Director can explain ${title.toLowerCase()} in 2 minutes, name the owner, and point to the metric that proves it's healthy.`,
    reviewRhythm: week >= 4
      ? "Reviewed weekly in state operations meeting; trended monthly with Operations Leadership."
      : "Reviewed in mentor check-in this week; revisited during week 5 readiness review.",
  };

  const scenario: SDScenario = {
    situation: `A team member raises a ${title.toLowerCase()} issue in your state stand-up: the workflow is stuck and nobody is sure who owns the next move.`,
    prompt: "What's your first move, and how do you make sure this doesn't recur?",
    expectedResponse: `Name the SOP owner out loud. Confirm where the workflow is stuck and what input is missing. Set an owner, an action, and a check-back time before the meeting ends. After the meeting, document the gap and add it to your weekly state operations review so the pattern is visible.`,
    escalationPath: week >= 3
      ? "If the gap repeats next week or involves revenue/auth risk, escalate to Operations Leadership with data."
      : "Bring the pattern to your mentor in this week's check-in.",
  };

  const knowledgeCheck: SDKnowledgeQ[] = [
    {
      id: `${training.id}-q1`,
      question: `${title}: what is the State Director's primary responsibility in this workflow?`,
      options: [
        `Personally execute every ${title.toLowerCase()} task.`,
        `Know who owns it, what healthy looks like, and unblock it when it stalls.`,
        `Wait for leadership to flag problems.`,
      ],
      answerIndex: 1,
    },
    {
      id: `${training.id}-q2`,
      question: `Which SOP grounds ${title} for State Directors?`,
      options: [
        sopName,
        `The generic ${theme} overview deck.`,
        `Whatever the previous director used.`,
      ],
      answerIndex: 0,
    },
    {
      id: `${training.id}-q3`,
      question: "When should this workflow be escalated to Operations Leadership?",
      options: [
        "Only at quarter-end.",
        "When the gap repeats or affects revenue, compliance, or client care.",
        "Never — handle everything in-state.",
      ],
      answerIndex: 1,
    },
  ];

  return {
    learningObjective: `Be able to run, oversee, and unblock ${title.toLowerCase()} in your state without supervision.`,
    stateDirectorLens: `${title} is part of ${theme}. You're not the doer — you're the operational owner who makes sure it's healthy and gets unstuck fast.`,
    stepByStep,
    sop,
    scenario,
    knowledgeCheck,
  };
}

/* ---------------- public API ---------------- */

/** Returns true when the training is a State Director Academy module. */
export function isStateDirectorModule(training: Pick<Training, "id" | "department">): boolean {
  return training.id.startsWith("sd-") || training.department === "state_director" || training.department === "state_operations";
}

/**
 * Full content for a State Director module. Returns curated content when
 * present, otherwise a derived payload that still includes every required
 * section. Returns null for non-SD modules.
 */
export function getStateDirectorFullContent(training: Training): SDFullContent | null {
  if (!isStateDirectorModule(training)) return null;
  return (
    CURATED[training.id] ??
    SD_W1_FULL_CONTENT[training.id] ??
    SD_W23_FULL_CONTENT[training.id] ??
    SD_W45_FULL_CONTENT[training.id] ??
    deriveContent(training)
  );
}

/** Exposed for tests — list of curated module ids. */
export const SD_CURATED_MODULE_IDS = Array.from(
  new Set([
    ...Object.keys(CURATED),
    ...Object.keys(SD_W1_FULL_CONTENT),
    ...Object.keys(SD_W23_FULL_CONTENT),
    ...Object.keys(SD_W45_FULL_CONTENT),
  ]),
);

/* ---------------- completeness classifier ---------------- */

export type SDModuleCompleteness =
  | "curated"
  | "derived"
  | "needs_sop_link"
  | "needs_screenshot"
  | "needs_video"
  | "welcome_non_sop"
  | "no_screenshot_decision"
  | "missing";

export interface SDModuleReadiness {
  moduleId: string;
  title: string;
  week: number;
  day: number;
  status: SDModuleCompleteness;
  hasCuratedContent: boolean;
  hasScreenshot: boolean;
  screenshotPending: boolean;
  sopName?: string;
  isVideoModule: boolean;
}

/**
 * Admin-only readiness classifier for a State Director module. Learners must
 * never see this language — surface it only inside Training Management.
 */
export function classifyStateDirectorModule(
  training: Pick<Training, "id" | "title" | "type" | "department">,
): SDModuleReadiness | null {
  if (!isStateDirectorModule(training)) return null;
  const parsed = parseSdId(training.id);
  const week = parsed?.week ?? 1;
  const day = parsed?.day ?? 1;
  const hasCurated = !!CURATED[training.id];
  const hasWeek1Full = !!SD_W1_FULL_CONTENT[training.id];
  const hasWeek23Full = !!SD_W23_FULL_CONTENT[training.id];
  const hasWeek45Full = !!SD_W45_FULL_CONTENT[training.id];
  const screenshots = getStateDirectorScreenshots(training.id);
  const hasScreenshot = screenshots.length > 0;
  const screenshotPending =
    hasScreenshot && screenshots.every((s) => s.resourceStatus !== "available");
  const noScreenshotDecision = !!SD_NO_SCREENSHOT_BY_ID[training.id];
  const sopName = SD_SOPS_BY_WEEK[week]?.[day]?.[0];
  const isVideoModule = /^video$/i.test((training as { type?: string }).type ?? "");
  // Phase 0 Welcome modules (ids like "welcome-*") are explicitly non-SOP
  // and never count against State Director SOP upload coverage. Curated
  // SD-prefixed modules (e.g. sd-w1d1-welcome-*) keep their normal status.
  const isWelcome = !training.id.startsWith("sd-") && training.id.startsWith("welcome-");

  let status: SDModuleCompleteness;
  if (isWelcome) {
    status = "welcome_non_sop";
  } else if (hasCurated || hasWeek1Full || hasWeek23Full || hasWeek45Full) {
    status = "curated";
  } else if (noScreenshotDecision) {
    status = "no_screenshot_decision";
  } else if (isVideoModule) {
    status = "needs_video";
  } else if (!sopName) {
    status = "needs_sop_link";
  } else if (hasScreenshot && screenshotPending) {
    status = "needs_screenshot";
  } else {
    status = "derived";
  }

  return {
    moduleId: training.id,
    title: training.title,
    week,
    day,
    status,
    hasCuratedContent: hasCurated || hasWeek1Full || hasWeek23Full || hasWeek45Full,
    hasScreenshot,
    screenshotPending,
    sopName,
    isVideoModule,
  };
}
