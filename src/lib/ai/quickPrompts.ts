import type { OSRole } from "@/lib/os/permissions";

export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  category: "operations" | "workflow" | "knowledge" | "drafting" | "summarize";
}

const SHARED: QuickPrompt[] = [
  { id: "qp-summary", label: "Generate Weekly Summary", prompt: "Generate a concise weekly summary of my key operational metrics.", category: "summarize" },
  { id: "qp-stuck", label: "Find Stuck Clients", prompt: "Which clients are stuck in the pipeline and why?", category: "operations" },
  { id: "qp-sop", label: "Explain a Workflow", prompt: "Walk me through the VOB process step by step.", category: "knowledge" },
  { id: "qp-msg", label: "Draft Team Message", prompt: "Draft a quick message to the scheduling team about today's coverage gaps.", category: "drafting" },
];

const PROMPTS: Partial<Record<OSRole, QuickPrompt[]>> = {
  state_director: [
    { id: "sd-state", label: "Summarize My State", prompt: "Summarize my state's operations this week.", category: "summarize" },
    { id: "sd-staffing", label: "Show Staffing Risks", prompt: "Identify staffing risks across my caseload.", category: "operations" },
    { id: "sd-pr", label: "Review PR Risks", prompt: "Which progress reports are at risk in my state?", category: "operations" },
    { id: "sd-escal", label: "Show Open Escalations", prompt: "Show open escalations in my state.", category: "operations" },
    ...SHARED,
  ],
  executive_leadership: [
    { id: "el-perf", label: "Company Performance", prompt: "Summarize company performance this week.", category: "summarize" },
    { id: "el-states", label: "Which states are struggling?", prompt: "Which states are struggling and why?", category: "operations" },
    { id: "el-bottle", label: "Operational Bottlenecks", prompt: "What operational bottlenecks exist right now?", category: "operations" },
    ...SHARED,
  ],
  operations_leadership: [
    { id: "ol-overdue", label: "Overdue Tasks", prompt: "Summarize my overdue tasks across operations.", category: "operations" },
    { id: "ol-gaps", label: "Identify Staffing Gaps", prompt: "Identify staffing gaps that need attention today.", category: "operations" },
    ...SHARED,
  ],
  intake_coordinator: [
    { id: "ic-stuck-leads", label: "Stuck Leads", prompt: "Which leads are stuck and need follow-up?", category: "operations" },
    { id: "ic-missing", label: "Missing Intake Forms", prompt: "Who hasn't completed their intake forms?", category: "operations" },
    { id: "ic-draft-email", label: "Draft Follow-up Email", prompt: "Draft a friendly follow-up email to a stalled lead.", category: "drafting" },
    ...SHARED,
  ],
  authorization_coordinator: [
    { id: "ac-expiring", label: "Expiring Auths (30 days)", prompt: "Which authorizations expire in the next 30 days?", category: "operations" },
    { id: "ac-overdue-pr", label: "Overdue PRs", prompt: "Which progress reports are overdue?", category: "operations" },
    { id: "ac-missing-sup", label: "Missing Supervision", prompt: "Show clients missing supervision hours this period.", category: "operations" },
    ...SHARED,
  ],
  scheduling_team: [
    { id: "st-uncov", label: "Uncovered Clients (14d+)", prompt: "List clients with no 97153 (RBT direct) session in the last 14 days, grouped by state. Recommend next coordination step for each.", category: "operations" },
    { id: "st-atrisk", label: "Coverage Forming Gaps", prompt: "Which active clients have their last RBT session 7-13 days ago? Flag any with 3+ cancellations in the last 30 days.", category: "operations" },
    { id: "st-load", label: "RBT Load Last 7 Days", prompt: "Show RBTs sorted by hours last 7 days. Flag anyone above 35h (overloaded) or under 10h (under-utilized) so we can rebalance.", category: "operations" },
    { id: "st-cancel", label: "Cancellation Trend", prompt: "Summarize client cancellations in the last 7 and 30 days from CentralReach. Identify any clinics or states trending up.", category: "operations" },
    { id: "st-bcba", label: "BCBA Caseload Spread", prompt: "Show BCBAs by distinct active clients in the last 30 days. Flag anyone over 12 clients or with no recent 97155.", category: "operations" },
    ...SHARED,
  ],
  recruiting_team: [
    { id: "rc-active", label: "Active BCBA Candidates", prompt: "How many BCBA candidates are active in pipeline?", category: "operations" },
    { id: "rc-stalled", label: "Stalled Applicants", prompt: "Which applicants are stalled and why?", category: "operations" },
    ...SHARED,
  ],
  hr_team: [
    { id: "hr-train", label: "Overdue Trainings", prompt: "Who has overdue trainings?", category: "operations" },
    { id: "hr-evals", label: "Upcoming Evaluations", prompt: "Which evaluations are due this month?", category: "operations" },
    { id: "hr-onb", label: "Onboarding Progress", prompt: "Show onboarding progress across new hires.", category: "operations" },
    ...SHARED,
  ],
  qa_team: [
    { id: "qa-risks", label: "Compliance Risks", prompt: "Which clients show compliance risk this week?", category: "operations" },
    ...SHARED,
  ],
  billing_finance: [
    { id: "bf-ar", label: "AR Risks", prompt: "Summarize accounts receivable risks.", category: "operations" },
    ...SHARED,
  ],
  bcba: [
    { id: "b-case", label: "My Caseload Snapshot", prompt: "Summarize my caseload - supervision, PRs, parent training.", category: "summarize" },
    { id: "b-97156", label: "Missing 97156", prompt: "Which of my clients are missing 97156 this month?", category: "operations" },
    ...SHARED.filter((p) => p.id !== "qp-msg"),
  ],
  rbt: [
    { id: "r-today", label: "My Sessions Today", prompt: "What sessions do I have today?", category: "summarize" },
    { id: "r-note", label: "How to submit a note?", prompt: "How do I submit a session note?", category: "knowledge" },
    { id: "r-pto", label: "PTO request", prompt: "How do I request PTO?", category: "knowledge" },
  ],
  super_admin: [
    { id: "sa-overview", label: "System Overview", prompt: "Give me a system-wide operational overview.", category: "summarize" },
    ...SHARED,
  ],
  marketing_team: [
    { id: "mk-leads", label: "Lead Source Mix", prompt: "Which lead sources are converting best this month?", category: "operations" },
    ...SHARED,
  ],
  payroll_coordinator: SHARED,
};

export function quickPromptsFor(role: OSRole): QuickPrompt[] {
  return PROMPTS[role] ?? SHARED;
}
