/**
 * Role responsibilities catalog for the Live Org Chart.
 *
 * Job titles coming out of Viventium are messy ("Registered Behavior
 * Technician (RBT) - Marietta GA, 30064"), so we normalize each title to a
 * canonical role key and attach the operational responsibilities the role
 * owns. Pure module — no imports, fully unit-testable.
 */

export type OrgRoleKey =
  | "ceo"
  | "coo"
  | "cfo"
  | "clinical_director"
  | "state_director"
  | "assistant_state_director"
  | "operations"
  | "hr"
  | "recruiting"
  | "intake"
  | "authorizations"
  | "scheduling"
  | "billing"
  | "qa"
  | "marketing"
  | "business_development"
  | "bcba"
  | "bcba_fellow"
  | "rbt"
  | "case_manager"
  | "behavioral_support"
  | "office"
  | "systems"
  | "unknown";

export interface OrgRoleProfile {
  key: OrgRoleKey;
  label: string;
  /** What this role owns day to day. */
  responsibilities: string[];
}

const CATALOG: Record<OrgRoleKey, OrgRoleProfile> = {
  ceo: {
    key: "ceo",
    label: "Chief Executive Officer",
    responsibilities: [
      "Company vision, growth strategy and state expansion",
      "Executive scorecard and quarterly priorities",
      "Payer, partner and board relationships",
    ],
  },
  coo: {
    key: "coo",
    label: "Chief Operating Officer",
    responsibilities: [
      "Company-wide operational performance",
      "Cross-department escalations and staffing risk",
      "Operating cadence: L10s, KPIs, department reviews",
    ],
  },
  cfo: {
    key: "cfo",
    label: "Finance Leadership",
    responsibilities: [
      "Revenue cycle, claims and collections oversight",
      "Payroll accuracy and labor cost control",
      "Budget, forecasting and financial reporting",
    ],
  },
  clinical_director: {
    key: "clinical_director",
    label: "Clinical Leadership",
    responsibilities: [
      "Clinical quality, supervision ratios and outcomes",
      "BCBA caseload health and capacity planning",
      "Treatment plan and progress report standards",
    ],
  },
  state_director: {
    key: "state_director",
    label: "State Director",
    responsibilities: [
      "State P&L, staffing and client growth",
      "Authorization utilization and caseload coverage",
      "State team performance and escalations",
    ],
  },
  assistant_state_director: {
    key: "assistant_state_director",
    label: "Assistant State Director",
    responsibilities: [
      "Daily state operations and coverage gaps",
      "Onboarding and first-session readiness",
      "Supports State Director on KPIs and escalations",
    ],
  },
  operations: {
    key: "operations",
    label: "Operations",
    responsibilities: [
      "Workflow execution across intake, auth and scheduling",
      "Work queue ownership and SLA follow-through",
      "Process documentation and operational reporting",
    ],
  },
  hr: {
    key: "hr",
    label: "Human Resources",
    responsibilities: [
      "Onboarding, credentialing paperwork and compliance",
      "Employee records, reviews and PTO",
      "Employee relations and policy administration",
    ],
  },
  recruiting: {
    key: "recruiting",
    label: "Recruiting",
    responsibilities: [
      "Applicant pipeline for RBT, BCBA and office roles",
      "Interviews, offers and start-date handoffs",
      "Staffing need fulfillment with State Directors",
    ],
  },
  intake: {
    key: "intake",
    label: "Intake",
    responsibilities: [
      "Inbound leads, qualification and follow-up",
      "Insurance verification and consent packets",
      "Admission packet prep and CentralReach handoff",
    ],
  },
  authorizations: {
    key: "authorizations",
    label: "Authorizations",
    responsibilities: [
      "Initial and reauthorization submissions",
      "Auth utilization tracking and expiration risk",
      "Payer follow-up and documentation readiness",
    ],
  },
  scheduling: {
    key: "scheduling",
    label: "Scheduling & Staffing",
    responsibilities: [
      "Client/RBT pairings and coverage",
      "Cancellation recovery and schedule gaps",
      "Availability, capacity and utilization",
    ],
  },
  billing: {
    key: "billing",
    label: "Billing & Finance",
    responsibilities: [
      "Claim submission, denials and appeals",
      "Payment plans and family balances",
      "Billing accuracy against session data",
    ],
  },
  qa: {
    key: "qa",
    label: "QA & Compliance",
    responsibilities: [
      "Note, treatment plan and progress report review",
      "Compliance flags and corrective follow-up",
      "Supervision documentation quality",
    ],
  },
  marketing: {
    key: "marketing",
    label: "Marketing",
    responsibilities: [
      "Campaigns, content and lead generation",
      "Referral source visibility and attribution",
      "Brand and community presence",
    ],
  },
  business_development: {
    key: "business_development",
    label: "Business Development",
    responsibilities: [
      "Referral partner relationships by territory",
      "New market and clinic opportunity development",
      "Growth pipeline reporting",
    ],
  },
  bcba: {
    key: "bcba",
    label: "BCBA",
    responsibilities: [
      "Assessments, treatment plans and progress reports",
      "RBT supervision and parent training",
      "Caseload clinical outcomes and billable targets",
    ],
  },
  bcba_fellow: {
    key: "bcba_fellow",
    label: "BCBA Fellow",
    responsibilities: [
      "Supervised fieldwork hours and competencies",
      "Assessment and plan drafting under review",
      "Fellowship stage milestones",
    ],
  },
  rbt: {
    key: "rbt",
    label: "Registered Behavior Technician",
    responsibilities: [
      "Direct 1:1 therapy sessions per treatment plan",
      "Data collection and same-day session notes",
      "Supervision participation and schedule reliability",
    ],
  },
  case_manager: {
    key: "case_manager",
    label: "Case Management",
    responsibilities: [
      "Family communication and service issues",
      "Community resources and follow-ups",
      "Escalation and handoff coordination",
    ],
  },
  behavioral_support: {
    key: "behavioral_support",
    label: "Behavioral Support",
    responsibilities: [
      "Behavior support plans and coaching",
      "Escalation response for high-need cases",
      "Follow-up tracking with clinical teams",
    ],
  },
  office: {
    key: "office",
    label: "Clinic / Office Support",
    responsibilities: [
      "Front-desk, family check-in and clinic flow",
      "Supplies, facilities and daily clinic readiness",
      "Administrative support for clinical teams",
    ],
  },
  systems: {
    key: "systems",
    label: "Systems & Software",
    responsibilities: [
      "Blossom OS configuration and integrations",
      "Accounts, access and device provisioning",
      "Data quality across CentralReach and Viventium",
    ],
  },
  unknown: {
    key: "unknown",
    label: "Team Member",
    responsibilities: ["Responsibilities not documented yet — HR can add them."],
  },
};

interface Rule {
  key: OrgRoleKey;
  test: RegExp;
}

// Order matters — first match wins (most specific first).
const RULES: Rule[] = [
  { key: "ceo", test: /\b(ceo|chief executive|founder|owner)\b/ },
  { key: "coo", test: /\b(coo|chief operating)\b/ },
  { key: "cfo", test: /\b(cfo|chief financial|controller|vp of finance)\b/ },
  { key: "clinical_director", test: /\b(clinical director|director of clinical|chief clinical|vp of clinical|clinical (operations )?(lead|manager))\b/ },
  { key: "assistant_state_director", test: /\b(assistant|associate) state director\b/ },
  { key: "state_director", test: /\bstate director\b/ },
  { key: "bcba_fellow", test: /\b(fellow|bcba candidate|bcaba|student analyst)\b/ },
  { key: "bcba", test: /\b(bcba|board certified behavior analyst|behavior analyst)\b/ },
  { key: "rbt", test: /\b(rbt|registered behavior technician|behavior technician|bt)\b/ },
  { key: "authorizations", test: /\b(authorization|auth)\b/ },
  { key: "intake", test: /\b(intake|admissions)\b/ },
  { key: "scheduling", test: /\b(scheduling|scheduler|staffing)\b/ },
  { key: "billing", test: /\b(billing|revenue cycle|claims|payroll|finance|accounts)\b/ },
  { key: "qa", test: /\b(qa|quality assurance|compliance|audit)\b/ },
  { key: "recruiting", test: /\b(recruit|talent|sourcer)\b/ },
  { key: "hr", test: /\b(hr|human resources|people ops|credentialing)\b/ },
  { key: "marketing", test: /\b(marketing|content|social media|seo|brand)\b/ },
  { key: "business_development", test: /\b(business development|bd|outreach|partnership|community liaison)\b/ },
  { key: "case_manager", test: /\b(case manager|case management|family (support|liaison)|client (care|success))\b/ },
  { key: "behavioral_support", test: /\b(behavioral support|behavior support|crisis)\b/ },
  { key: "systems", test: /\b(systems|software|it |developer|engineer|technology|data analyst)\b/ },
  { key: "office", test: /\b(office|front desk|administrative|admin assistant|receptionist|clinic (support|assistant|coordinator))\b/ },
  { key: "operations", test: /\b(operations|ops|director of operations|project manager|executive assistant)\b/ },
];

/** Normalize a raw Viventium/HR job title to a canonical role key. */
export function normalizeRoleKey(title: string | null | undefined): OrgRoleKey {
  if (!title) return "unknown";
  const t = ` ${title.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()} `;
  for (const rule of RULES) if (rule.test.test(t)) return rule.key;
  return "unknown";
}

/** Full role profile (label + responsibilities) for a raw job title. */
export function roleProfileForTitle(title: string | null | undefined): OrgRoleProfile {
  return CATALOG[normalizeRoleKey(title)];
}

/** Responsibilities list for a raw job title. Never empty. */
export function responsibilitiesForTitle(title: string | null | undefined): string[] {
  return roleProfileForTitle(title).responsibilities;
}

/** Every role in the catalog — used by the org chart legend/role browser. */
export function allRoleProfiles(): OrgRoleProfile[] {
  return Object.values(CATALOG).filter((r) => r.key !== "unknown");
}

/** Strip Viventium location noise from a job title for display. */
export function cleanJobTitle(title: string | null | undefined): string {
  if (!title) return "";
  return title
    .replace(/\s*[-–—,]\s*[A-Za-z .]*\b(?:[A-Z]{2})\b\s*,?\s*\d{5}?\s*$/, "")
    .replace(/\s*[-–—]\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}