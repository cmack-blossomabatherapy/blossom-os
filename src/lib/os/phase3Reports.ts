import type { OSRole } from "./permissions";

export type Phase3Status = "live" | "setup_needed" | "needs_data";

export type Phase3Section =
  | "my"
  | "department"
  | "state"
  | "training"
  | "resource"
  | "growth"
  | "operations"
  | "clinical"
  | "credentialing";

export interface Phase3Report {
  id: string;
  name: string;
  description: string;
  department: string;
  lastUpdated: string;
  status: Phase3Status;
  section: Phase3Section;
  /** Roles that should see this card. "all" = every role. */
  visibleTo: OSRole[] | "all";
  /** Live route. When omitted, falls back to /reports?report=<id>. */
  route?: string;
  canExport?: boolean;
}

const ALL_ROLES: OSRole[] | "all" = "all";

/** Roles that conceptually belong to each functional area. Used for "Department Reports". */
const ROLES = {
  marketing: ["super_admin", "marketing_team", "marketing_growth_lead"] as OSRole[],
  bizdev: ["super_admin", "business_development", "marketing_growth_lead"] as OSRole[],
  intake: ["super_admin", "intake_coordinator", "intake_lead", "operations_leadership"] as OSRole[],
  auth: ["super_admin", "authorization_coordinator", "authorization_manager", "operations_leadership", "state_director"] as OSRole[],
  scheduling: ["super_admin", "scheduling_team", "scheduling_coordinator", "scheduling_lead", "operations_leadership", "state_director"] as OSRole[],
  staffing: ["super_admin", "staffing_team", "staffing_coordinator", "staffing_lead", "operations_leadership", "state_director"] as OSRole[],
  qa: ["super_admin", "qa_team", "qa_specialist", "qa_director", "operations_leadership"] as OSRole[],
  hr: ["super_admin", "hr_team", "hr_lead"] as OSRole[],
  credentialing: ["super_admin", "credentialing_team", "credentialing_lead", "hr_team"] as OSRole[],
  caseManager: ["super_admin", "case_manager", "bcba", "clinical_director", "clinical_lead"] as OSRole[],
  bcba: ["super_admin", "bcba", "clinical_director", "clinical_lead", "operations_leadership"] as OSRole[],
  rbt: ["super_admin", "rbt", "behavioral_support"] as OSRole[],
  recruiting: ["super_admin", "recruiting_team", "recruiting_coordinator", "recruiting_lead", "hr_team"] as OSRole[],
  stateDir: ["super_admin", "state_director", "assistant_state_director", "operations_leadership", "executive_leadership", "executive"] as OSRole[],
  exec: ["super_admin", "executive_leadership", "executive", "coo", "operations_leadership"] as OSRole[],
};

export const PHASE3_REPORTS: Phase3Report[] = [
  // --------- BCBA Productivity (live, universal) ---------
  {
    id: "bcba-productivity-report-v3",
    name: "BCBA Productivity Report",
    description:
      "Upload billing data and review BCBA productivity, assigned ownership, supervision patterns, delivered hours, unassigned hours, validation issues, and export-ready productivity results.",
    department: "Clinical / Operations",
    lastUpdated: "Live",
    status: "live",
    section: "clinical",
    visibleTo: ALL_ROLES,
    route: "/reports/bcba-productivity-report-v3",
    canExport: true,
  },

  // --------- Training Reports (universal) ---------
  { id: "training-completion", name: "Training Completion", description: "Required and optional training progress for your role and team.", department: "Training Academy", lastUpdated: "Live", status: "live", section: "training", visibleTo: ALL_ROLES, route: "/academy" },
  { id: "role-readiness", name: "Role Readiness", description: "Are people fully trained and ready for their role responsibilities?", department: "Training Academy", lastUpdated: "Updated daily", status: "setup_needed", section: "training", visibleTo: ALL_ROLES },
  { id: "future-career-path", name: "Future Career Path", description: "Suggested training paths and growth opportunities for your role.", department: "Training Academy", lastUpdated: "Not connected", status: "setup_needed", section: "training", visibleTo: [...ROLES.rbt, ...ROLES.bcba, "case_manager", "behavioral_support"] as OSRole[] },

  // --------- Resource Reports (universal) ---------
  { id: "resource-usage", name: "Resource Usage", description: "Which SOPs, policies, and resources are most used across the team.", department: "Resource Library", lastUpdated: "Live", status: "live", section: "resource", visibleTo: ALL_ROLES, route: "/resource-library" },

  // --------- Growth Reports ---------
  { id: "marketing-source-performance", name: "Marketing Source Performance", description: "Lead source quality, conversion, and channel ROI.", department: "Marketing", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: [...ROLES.marketing, ...ROLES.exec] as OSRole[] },
  { id: "campaign-performance", name: "Campaign Performance", description: "Campaign reach, response, and pipeline impact.", department: "Marketing", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.marketing },
  { id: "phone-activity", name: "Phone Activity", description: "Inbound, outbound, after-hours and missed calls.", department: "Marketing / HR", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: [...ROLES.marketing, ...ROLES.hr] as OSRole[] },
  { id: "patient-journey-touchpoints", name: "Patient Journey Touchpoints", description: "Every touchpoint from first contact through active care.", department: "Marketing", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.marketing },
  { id: "bd-referral-sources", name: "Business Development Referral Sources", description: "Referral partner activity, volume, and conversion by source.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=partners" },
  { id: "bd-outreach-followup", name: "Outreach Follow-Up", description: "Open referral partner follow-ups and recent outreach activity.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=outreach" },
  { id: "bd-referral-conversion", name: "Referral Source Conversion", description: "How referral partners convert into active partnerships.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development" },
  { id: "bd-partner-activity", name: "Partner Activity", description: "Every referral partner with last-contact recency and stage.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=partners" },
  { id: "bd-follow-up-risk", name: "Partner Follow-Up Risk", description: "Stale partners, overdue follow-ups, and warm partners without a next step.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=tasks" },
  { id: "bd-source-handoff", name: "Source Handoff Performance", description: "Lead source signals ready for BD outreach - by source, channel, and state.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=sources" },
  { id: "bd-provider-relationships", name: "Provider Relationship Activity", description: "Pediatric offices, therapy practices, and health systems referring families.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=providers" },
  { id: "bd-community-relationships", name: "Community Relationship Activity", description: "Schools, autism orgs, and community partners you engage with.", department: "Business Development", lastUpdated: "Live", status: "live", section: "growth", visibleTo: ROLES.bizdev, route: "/business-development?tab=community" },
  { id: "lead-to-active", name: "Lead to Ready-to-Start Conversion", description: "Conversion from initial lead through ready-to-start services, by source and state.", department: "Intake", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: [...ROLES.intake, ...ROLES.exec, ...ROLES.marketing] as OSRole[] },
  { id: "intake-pipeline", name: "Intake Pipeline", description: "Live view of leads moving through the intake pipeline.", department: "Intake", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.intake },
  { id: "missing-information", name: "Packet Follow Up / Missing Info", description: "Leads and intakes blocked in packet follow up or missing info.", department: "Intake", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.intake },
  { id: "intake-followup", name: "Intake Follow-Up", description: "Open intake follow-ups and contact attempts.", department: "Intake", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.intake },
  { id: "after-hours-calls", name: "After-Hours Calls", description: "Calls received outside business hours and their handling.", department: "Phone System", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: [...ROLES.marketing, ...ROLES.hr] as OSRole[] },
  { id: "no-oon-benefits", name: "No OON Benefits", description: "Benefits verification results that returned no out-of-network benefits.", department: "Intake", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.intake },
  { id: "benefits-verification-queue", name: "Benefits Verification Queue", description: "Leads currently in benefits verification with owner and aging.", department: "Intake", lastUpdated: "Not connected", status: "setup_needed", section: "growth", visibleTo: ROLES.intake },

  // --------- Operations Reports ---------
  { id: "authorizations-queue", name: "Authorizations Queue", description: "Open and pending authorizations with owner and aging.", department: "Authorizations", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: ROLES.auth },
  { id: "approved-authorizations", name: "Approved Authorizations", description: "Recently approved authorizations and start readiness.", department: "Authorizations", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: ROLES.auth },
  { id: "denials", name: "Denials", description: "Denied authorizations with reason codes and next steps.", department: "Authorizations", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: ROLES.auth },
  { id: "expiring-authorizations", name: "Expiring Authorizations", description: "Authorizations expiring in the next 30 / 60 / 90 days.", department: "Authorizations", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: ROLES.auth },
  { id: "missing-docs", name: "Missing Docs", description: "Documents required to submit or maintain authorizations.", department: "Authorizations", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: ROLES.auth },
  { id: "staffing-needs", name: "Staffing Needs", description: "Open clients awaiting staffing by state and service.", department: "Staffing", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: [...ROLES.staffing, ...ROLES.stateDir] as OSRole[] },
  { id: "scheduling-gaps", name: "Scheduling Gaps", description: "Authorized hours not yet scheduled, by client and BCBA.", department: "Scheduling", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: [...ROLES.scheduling, ...ROLES.stateDir] as OSRole[] },
  { id: "qa-review", name: "QA Review", description: "Treatment plans and documentation in active QA review.", department: "QA", lastUpdated: "Not connected", status: "setup_needed", section: "operations", visibleTo: ROLES.qa },

  // --------- Clinical Reports ---------
  { id: "case-management-activity", name: "Case Management Activity", description: "Caseload activity, family follow-ups, and open tasks.", department: "Clinical", lastUpdated: "Not connected", status: "setup_needed", section: "clinical", visibleTo: ROLES.caseManager },
  { id: "caseload-summary", name: "Caseload Summary", description: "Active caseload at a glance with key clinical signals.", department: "Clinical", lastUpdated: "Not connected", status: "setup_needed", section: "clinical", visibleTo: ROLES.caseManager },
  { id: "family-followup", name: "Family Follow-Up", description: "Open family communications and follow-up actions.", department: "Clinical", lastUpdated: "Not connected", status: "setup_needed", section: "clinical", visibleTo: ROLES.caseManager },
  { id: "evaluations", name: "Evaluations", description: "Open and recently completed evaluations.", department: "Clinical", lastUpdated: "Live", status: "live", section: "clinical", visibleTo: [...ROLES.caseManager, ...ROLES.bcba] as OSRole[], route: "/evaluations" },
  { id: "patient-activity", name: "Patient Activity", description: "Active patients, hours delivered, and clinical engagement.", department: "Clinical", lastUpdated: "Not connected", status: "setup_needed", section: "clinical", visibleTo: [...ROLES.bcba, ...ROLES.exec, ...ROLES.stateDir] as OSRole[] },

  // --------- Credentialing Reports ---------
  { id: "credentialing-status", name: "Credentialing Status", description: "Where every clinician sits in the credentialing process.", department: "Credentialing", lastUpdated: "Not connected", status: "setup_needed", section: "credentialing", visibleTo: ROLES.credentialing },
  { id: "bcba-credentials", name: "BCBA Credentials", description: "BCBA credential coverage by payer and state.", department: "Credentialing", lastUpdated: "Not connected", status: "setup_needed", section: "credentialing", visibleTo: ROLES.credentialing },
  { id: "uncredentialed-bcbas", name: "Uncredentialed BCBAs", description: "BCBAs not yet credentialed with one or more payers.", department: "Credentialing", lastUpdated: "Not connected", status: "setup_needed", section: "credentialing", visibleTo: ROLES.credentialing },
  { id: "expiring-credentials", name: "Expiring Credentials", description: "Credentials expiring soon - by clinician and payer.", department: "Credentialing", lastUpdated: "Not connected", status: "setup_needed", section: "credentialing", visibleTo: ROLES.credentialing },
  { id: "payer-credentialing", name: "Payer Credentialing", description: "Credentialing posture across all contracted payers.", department: "Credentialing", lastUpdated: "Not connected", status: "setup_needed", section: "credentialing", visibleTo: ROLES.credentialing },

  // --------- Department / HR Reports ---------
  { id: "hr-requests", name: "HR Requests", description: "Open HR requests with owner and aging.", department: "HR", lastUpdated: "Not connected", status: "setup_needed", section: "department", visibleTo: ROLES.hr },
  { id: "device-requests", name: "Device Requests", description: "Open device requests and fulfillment status.", department: "HR", lastUpdated: "Not connected", status: "setup_needed", section: "department", visibleTo: ROLES.hr },
  { id: "nfc-badge-status", name: "NFC Badge Status", description: "NFC badge issuance and active status by employee.", department: "HR", lastUpdated: "Not connected", status: "setup_needed", section: "department", visibleTo: ROLES.hr },
  { id: "user-activity", name: "User Activity", description: "User sign-in, page, and feature activity across Blossom OS.", department: "Systems", lastUpdated: "Not connected", status: "setup_needed", section: "department", visibleTo: ["super_admin", "systems_admin"] as OSRole[] },

  // --------- State Reports ---------
  { id: "state-operations-health", name: "State Operations Health", description: "Operational posture and risks for your state.", department: "State Operations", lastUpdated: "Not connected", status: "setup_needed", section: "state", visibleTo: ROLES.stateDir },
  { id: "state-growth", name: "State Growth", description: "New leads, active growth, and pipeline by state.", department: "State Operations", lastUpdated: "Not connected", status: "setup_needed", section: "state", visibleTo: ROLES.stateDir },
];

export function isRoleVisible(report: Phase3Report, role: OSRole): boolean {
  if (report.visibleTo === "all") return true;
  if (role === "super_admin") return true;
  return report.visibleTo.includes(role);
}

export function reportsForRole(role: OSRole): Phase3Report[] {
  return PHASE3_REPORTS.filter(r => isRoleVisible(r, role));
}

export function reportRoute(report: Phase3Report): string {
  if (report.status === "live" && report.route) return report.route;
  if (report.route) return report.route;
  return `/reports?report=${encodeURIComponent(report.id)}`;
}

export const PHASE3_SECTIONS: { id: Phase3Section; title: string; description: string }[] = [
  { id: "my", title: "My Reports", description: "Reports starred for quick access." },
  { id: "department", title: "Department Reports", description: "Operational reports for your department." },
  { id: "state", title: "State Reports", description: "Performance and operations by state." },
  { id: "training", title: "Training Reports", description: "Training Academy progress and readiness." },
  { id: "resource", title: "Resource Reports", description: "Resource Library usage and adoption." },
  { id: "growth", title: "Growth Reports", description: "Marketing, intake, referral, and pipeline growth." },
  { id: "operations", title: "Operations Reports", description: "Authorizations, scheduling, staffing, and QA." },
  { id: "clinical", title: "Clinical Reports", description: "Caseload, evaluations, and clinical activity." },
  { id: "credentialing", title: "Credentialing Reports", description: "Credentialing status and payer coverage." },
];

/** Reads/writes a tiny "My Reports" star list in localStorage. */
const MY_KEY = "blossom-os.phase3-reports.my";
export function readMyReports(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(MY_KEY) || "[]"); } catch { return []; }
}
export function toggleMyReport(id: string): string[] {
  const cur = readMyReports();
  const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
  try { localStorage.setItem(MY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}