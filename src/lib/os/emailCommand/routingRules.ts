/**
 * Email Command Center — workflow routing rules.
 *
 * Pure, deterministic classifier used by both the client (for instant preview)
 * and the mail-analyze edge function. Keyword-based; no PHI required.
 */

export type WorkflowTag =
  | "Intake"
  | "Authorization"
  | "Benefits / VOB"
  | "Recruiting"
  | "Scheduling"
  | "Clinical"
  | "Billing"
  | "HR"
  | "Payroll"
  | "Operations"
  | "Marketing"
  | "Parent Communication"
  | "Vendor / External Partner"
  | "Calendar / Meeting"
  | "Risk / Escalation";

export type RecommendedChannel =
  | "outlook_email"
  | "teams"
  | "outlook_calendar"
  | "internal_reminder";

export interface RoutingResult {
  workflowTag: WorkflowTag;
  suggestedOwner: string;
  recommendedChannel: RecommendedChannel;
  recommendedAction: string;
  confidence: number; // 0..1
  reason: string;
  urgency: "low" | "normal" | "high" | "critical";
  riskLevel: "low" | "medium" | "high";
  needsCorey: boolean;
}

interface MailInput {
  subject?: string | null;
  sender_email?: string | null;
  sender_name?: string | null;
  preview?: string | null;
}

const RULES: Array<{
  match: RegExp;
  tag: WorkflowTag;
  owner: string;
  channel: RecommendedChannel;
  action: string;
  weight: number;
  reason: string;
}> = [
  { match: /\b(escalat|complaint|urgent|asap|attorney|legal|lawsuit|fraud|abuse)\b/i, tag: "Risk / Escalation", owner: "Corey / Operations Leadership", channel: "outlook_email", action: "Escalate to Corey immediately", weight: 0.95, reason: "Risk language detected" },
  { match: /\b(auth(orization)?|prior auth|pa request|cpt|appeal|denial)\b/i, tag: "Authorization", owner: "Devorah / Auth Team", channel: "outlook_email", action: "Forward to Devorah / Auth Team", weight: 0.85, reason: "Authorization keywords" },
  { match: /\b(vob|benefits?|eligibility|insurance|copay|deductible|coverage)\b/i, tag: "Benefits / VOB", owner: "Gabi / Finance Benefits", channel: "outlook_email", action: "Forward to Gabi for benefits review", weight: 0.82, reason: "Benefits / VOB language" },
  { match: /\b(applicant|candidate|interview|resume|cv|recruit|onboard(ing)?|new hire)\b/i, tag: "Recruiting", owner: "Nikki / Recruiting", channel: "outlook_email", action: "Forward to Nikki / Recruiting", weight: 0.8, reason: "Recruiting keywords" },
  { match: /\b(intake|new lead|inquiry|interested in services|sign up|parent inquiry|lead form)\b/i, tag: "Intake", owner: "Intake Team", channel: "outlook_email", action: "Route to Intake Team", weight: 0.78, reason: "Intake language" },
  { match: /\b(schedul(ing|e)|cancel(led|lation)?|reschedule|coverage|call[- ]out|cover session)\b/i, tag: "Scheduling", owner: "Scheduling Team", channel: "outlook_email", action: "Forward to Scheduling Team", weight: 0.78, reason: "Scheduling language" },
  { match: /\b(bcba|treatment plan|supervis(ion|or)|session note|clinical|behavior plan)\b/i, tag: "Clinical", owner: "Clinical Leadership", channel: "outlook_email", action: "Route to Clinical Leadership / assigned BCBA", weight: 0.75, reason: "Clinical keywords" },
  { match: /\b(payroll|viventium|paystub|paycheck|w-?2|direct deposit)\b/i, tag: "Payroll", owner: "Payroll / HR", channel: "outlook_email", action: "Forward to Payroll / HR", weight: 0.85, reason: "Payroll keywords" },
  { match: /\b(invoice|billing|claim|reimbursement|payment plan)\b/i, tag: "Billing", owner: "Finance / Billing Team", channel: "outlook_email", action: "Forward to Billing", weight: 0.7, reason: "Billing keywords" },
  { match: /\b(ctm|leadtrap|facebook ads?|google ads?|campaign|seo|referral source|marketing)\b/i, tag: "Marketing", owner: "Marketing Team", channel: "outlook_email", action: "Route to Marketing Team", weight: 0.75, reason: "Marketing keywords" },
  { match: /\b(pto|time off|hr|benefits enrollment|handbook|policy)\b/i, tag: "HR", owner: "HR Team", channel: "outlook_email", action: "Forward to HR", weight: 0.7, reason: "HR keywords" },
  { match: /\b(can we meet|schedule a (call|meeting)|what time works|move the meeting|follow up next week|calendar invite|availability)\b/i, tag: "Calendar / Meeting", owner: "Corey", channel: "outlook_calendar", action: "Create approved Outlook calendar event", weight: 0.82, reason: "Scheduling request" },
  { match: /\b(parent|family|caregiver|my child|my son|my daughter)\b/i, tag: "Parent Communication", owner: "Intake Team", channel: "outlook_email", action: "Route to Intake / Parent Communication", weight: 0.65, reason: "Parent language" },
  { match: /\b(vendor|partner|contract|proposal|invoice from)\b/i, tag: "Vendor / External Partner", owner: "Operations", channel: "outlook_email", action: "Route to Operations", weight: 0.6, reason: "Vendor/partner language" },
];

/** Classify an email into a workflow tag with suggested owner + action. */
export function classifyEmail(input: MailInput): RoutingResult {
  const haystack = `${input.subject ?? ""} \n ${input.preview ?? ""} \n ${input.sender_email ?? ""}`;
  let best: typeof RULES[number] | null = null;
  let bestWeight = 0;
  for (const rule of RULES) {
    if (rule.match.test(haystack) && rule.weight > bestWeight) {
      best = rule;
      bestWeight = rule.weight;
    }
  }

  if (!best) {
    return {
      workflowTag: "Operations",
      suggestedOwner: "Corey / Operations Leadership",
      recommendedChannel: "outlook_email",
      recommendedAction: "Review and route manually",
      confidence: 0.35,
      reason: "No high-confidence keywords matched",
      urgency: "normal",
      riskLevel: "low",
      needsCorey: true,
    };
  }

  const isRisk = best.tag === "Risk / Escalation";
  return {
    workflowTag: best.tag,
    suggestedOwner: best.owner,
    recommendedChannel: best.channel,
    recommendedAction: best.action,
    confidence: best.weight,
    reason: best.reason,
    urgency: isRisk ? "critical" : best.weight >= 0.8 ? "high" : "normal",
    riskLevel: isRisk ? "high" : best.weight >= 0.8 ? "medium" : "low",
    // Low-confidence OR Corey-owned items default to Needs Corey approval.
    needsCorey:
      best.weight < 0.7 ||
      best.owner.toLowerCase().includes("corey") ||
      isRisk,
  };
}

/**
 * Rank items for the "Start Here" section. Higher score = more important.
 * Combines risk, urgency, waiting age, and whether Corey must approve.
 */
export function startHereScore(args: {
  routing: Pick<RoutingResult, "riskLevel" | "urgency" | "needsCorey">;
  receivedAt?: string | null;
}): number {
  const r = args.routing;
  let score = 0;
  if (r.riskLevel === "high") score += 50;
  else if (r.riskLevel === "medium") score += 25;
  if (r.urgency === "critical") score += 40;
  else if (r.urgency === "high") score += 20;
  if (r.needsCorey) score += 15;
  if (args.receivedAt) {
    const hours = (Date.now() - new Date(args.receivedAt).getTime()) / 36e5;
    score += Math.min(20, Math.max(0, hours));
  }
  return score;
}
