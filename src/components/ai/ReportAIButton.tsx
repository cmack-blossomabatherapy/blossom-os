import { BlossomAIButton } from "@/components/ai/BlossomAIAssistant";

/**
 * ReportAIButton — thin wrapper around BlossomAIButton that pre-loads
 * report-specific context, suggestions, and guardrails.
 *
 * The assistant only *explains* reports. It never recomputes, invents
 * metrics, or mutates data. Retrieval is RLS-scoped to the caller's role,
 * so users only see report/AI data allowed for them.
 */

export type ReportAIPreset =
  | "bcba-productivity"
  | "auth-utilization"
  | "supervision-pt"
  | "cancellation"
  | "hr-recruiting"
  | "hr-compliance"
  | "hr-onboarding"
  | "hr-payroll"
  | "hr-bcba-productivity"
  | "cancellation-center"
  | "resource-library-import"
  | "reports-home";

interface Config {
  title: string;
  hint: string;
  contextText: string;
  suggestions: string[];
}

const BASE_GUARDRAILS = [
  "Explain fields, metrics, and what the report is showing",
  "Do not change, recompute, or invent report values",
  "Cite the report or Resource Library source when possible",
  "Respect the caller's role — only reference data they can access",
];

const PRESETS: Record<ReportAIPreset, Config> = {
  "bcba-productivity": {
    title: "BCBA Productivity report assistant",
    hint: "Explains fields, metrics, and uploaded CentralReach data. Does not change calculations.",
    contextText:
      "User is viewing the BCBA Productivity Report. Fields include billable hours, supervision (97155), parent training (97156), caseload count, and RBT support — sourced from CentralReach billing and authorization exports.",
    suggestions: [
      "Explain what this report is measuring",
      "What does supervision % mean here?",
      "Which SOPs cover BCBA productivity?",
      "What should a BCBA review after seeing this?",
    ],
  },
  "auth-utilization": {
    title: "Authorization Utilization assistant",
    hint: "Explains authorization utilization, expiring auths, and client authorization health.",
    contextText:
      "User is viewing the Authorization Utilization Dashboard, sourced from a CentralReach authorization export. KPIs cover utilization %, expiring authorizations, and per-client authorization health.",
    suggestions: [
      "Explain how utilization % is calculated",
      "What counts as an at-risk authorization?",
      "Which SOP covers auth renewal workflows?",
      "Summarize what needs attention this week",
    ],
  },
  "supervision-pt": {
    title: "Supervision & Parent Training assistant",
    hint: "Explains supervision (97155) and parent training (97156) coverage and gaps.",
    contextText:
      "User is viewing the Supervision & Parent Training Dashboard from CentralReach billing data. Metrics cover supervision hours (97155), parent training (97156), and per-BCBA / per-client coverage.",
    suggestions: [
      "Explain supervision expectations",
      "What does the parent training metric include?",
      "Which clients are below supervision target?",
      "Show related supervision SOPs",
    ],
  },
  cancellation: {
    title: "Cancellation dashboard assistant",
    hint: "Explains cancellation drivers, at-risk clients, and provider impact.",
    contextText:
      "User is viewing the Session Cancellation Dashboard sourced from CentralReach appointment data. Metrics include cancellation rate, client attendance risks, and provider impact.",
    suggestions: [
      "Explain how cancellation rate is calculated",
      "Which clients are trending as attendance risks?",
      "Show cancellation follow-up SOPs",
      "Summarize what scheduling should act on",
    ],
  },
  "hr-recruiting": {
    title: "Recruiting Pipeline assistant",
    hint: "Explains pipeline stages, conversion, and recruiting bottlenecks.",
    contextText:
      "User is viewing the Recruiting Pipeline Dashboard. Metrics include applicant stages, time-in-stage, offer/accept ratios, and source performance.",
    suggestions: [
      "Explain each pipeline stage",
      "Where is the biggest bottleneck?",
      "Show related recruiting SOPs",
      "Summarize what recruiting should act on",
    ],
  },
  "hr-compliance": {
    title: "Employee Compliance assistant",
    hint: "Explains compliance categories, expiring credentials, and required actions.",
    contextText:
      "User is viewing the Employee Compliance Dashboard. Metrics cover credential status, expiring items, and state / role compliance.",
    suggestions: [
      "Explain what counts as out of compliance",
      "Which credentials expire soonest?",
      "Show related compliance SOPs",
      "Summarize what HR should act on",
    ],
  },
  "hr-onboarding": {
    title: "Employee Onboarding assistant",
    hint: "Explains onboarding stages, blockers, and outstanding tasks.",
    contextText:
      "User is viewing the Employee Onboarding Command Center. Metrics cover stage completion, blockers, and per-hire outstanding tasks.",
    suggestions: [
      "Explain each onboarding stage",
      "Which hires are stuck?",
      "Show related onboarding SOPs",
      "Summarize what HR should act on today",
    ],
  },
  "hr-payroll": {
    title: "Payroll Command Center assistant",
    hint: "Explains payroll issues, BCBA minimum hours, and required actions. Does not run payroll.",
    contextText:
      "User is viewing the Payroll Command Center. Metrics cover payroll issues, BCBA minimum hour tracking, earnings review, and required actions.",
    suggestions: [
      "Explain BCBA minimum hours tracking",
      "Which employees need attention this pay period?",
      "Show related payroll SOPs",
      "What actions should Finance take next?",
    ],
  },
  "hr-bcba-productivity": {
    title: "BCBA Productivity (HR view) assistant",
    hint: "Explains BCBA productivity and minimum hours from an HR perspective.",
    contextText:
      "User is viewing the BCBA Productivity & Minimum Hours Dashboard (HR view). Metrics include billable hours, supervision, parent training, and minimum hour targets.",
    suggestions: [
      "Explain BCBA minimum hour targets",
      "Which BCBAs are below target?",
      "Show related productivity SOPs",
      "Summarize what HR should follow up on",
    ],
  },
  "cancellation-center": {
    title: "Cancellation Command Center assistant",
    hint: "Explains cancellation follow-up workflows and outstanding actions.",
    contextText:
      "User is viewing the Cancellation Command Center. Focuses on cancellation follow-ups, at-risk clients, and outstanding scheduling actions.",
    suggestions: [
      "Explain the follow-up workflow",
      "Which clients need outreach?",
      "Show cancellation SOPs",
      "Summarize what scheduling should act on",
    ],
  },
  "resource-library-import": {
    title: "Resource Library import assistant",
    hint: "Explains import status, missing files, and index health.",
    contextText:
      "User is viewing the Resource Library admin QA / import status page. Metrics include available vs missing_file counts, per-bucket distribution, and AI index (knowledge_chunks) health.",
    suggestions: [
      "Explain what missing_file means",
      "Which buckets have gaps?",
      "How is the AI index built from resources?",
      "What should admins fix first?",
    ],
  },
  "reports-home": {
    title: "Reports hub assistant",
    hint: "Explains which reports exist, what they cover, and which fit the user's role.",
    contextText:
      "User is viewing the Reports & Analytics home. Reports span operational, performance, and executive categories and are role-filtered.",
    suggestions: [
      "Which reports fit my role?",
      "Explain the difference between operational and executive reports",
      "Which reports show staffing health?",
      "Show SOPs for reading these dashboards",
    ],
  },
};

export function ReportAIButton({
  preset,
  contextExtra,
  className,
  label = "Explain report",
}: {
  preset: ReportAIPreset;
  /** Optional extra context appended to the preset (e.g. filter/date state). */
  contextExtra?: string;
  className?: string;
  label?: string;
}) {
  const cfg = PRESETS[preset];
  const contextText = contextExtra ? `${cfg.contextText}\n\n${contextExtra}` : cfg.contextText;
  return (
    <BlossomAIButton
      surface="report"
      title={cfg.title}
      hint={cfg.hint}
      contextText={contextText}
      suggestions={cfg.suggestions}
      guardrails={BASE_GUARDRAILS}
      label={label}
      className={className}
    />
  );
}

export const REPORT_AI_GUARDRAILS = BASE_GUARDRAILS;