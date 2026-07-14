/**
 * Module Readiness Registry — Blossom OS planned modules.
 *
 * Describes the operational blueprint (KPIs, queue, detail, activity,
 * escalation, reports) for modules still being wired to live data.
 * Not used by any active product route in Sprint 03+.
 */

export interface ModuleKpi {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "critical" | "success";
}

export interface ModuleQueueRow {
  name: string;
  state?: string;
  status: string;
  owner: string;
  priority?: "Low" | "Normal" | "High" | "Urgent";
  due?: string;
  lastActivity?: string;
  nextAction?: string;
  escalation?: string;
}

export interface ModuleActivity {
  when: string;
  type: string;
  who: string;
  detail: string;
}

export interface ModuleEscalation {
  level: "Level 1" | "Level 2" | "Level 3";
  owner: string;
  reason: string;
  age: string;
  next: string;
}

export interface ModuleReportRef {
  name: string;
  description: string;
}

export interface ModuleDefinition {
  id: string;
  /** Matches the `module` query string from the role menu. */
  matchNames: string[];
  title: string;
  description: string;
  department: string;
  ownerRole: string;
  status?: "setup_needed" | "needs_data" | "planned";
  purpose: string;
  relatedModules?: string[];
  primaryActions: string[];
  secondaryActions?: string[];
  plannedDataFields: string[];
  kpis: ModuleKpi[];
  sampleRecords: ModuleQueueRow[];
  workflowStages: string[];
  escalations: ModuleEscalation[];
  activity: ModuleActivity[];
  reports: ModuleReportRef[];
}

const generic = (overrides: Partial<ModuleDefinition>): ModuleDefinition => ({
  id: overrides.id || "module",
  matchNames: overrides.matchNames || [],
  title: overrides.title || "Workspace",
  description: overrides.description || "",
  department: overrides.department || "Operations",
  ownerRole: overrides.ownerRole || "Department Owner",
  status: "planned",
  purpose: overrides.purpose || "",
  relatedModules: overrides.relatedModules || [],
  primaryActions: overrides.primaryActions || ["Create New", "Assign Owner", "Add Note", "Escalate"],
  secondaryActions: overrides.secondaryActions || ["Export", "Open Related Record"],
  plannedDataFields: overrides.plannedDataFields || [],
  kpis: overrides.kpis || [
    { label: "Open Items", value: "24", tone: "default" },
    { label: "Due Today", value: "6", tone: "warning" },
    { label: "Escalations", value: "2", tone: "critical" },
    { label: "Resolved (7d)", value: "31", tone: "success" },
  ],
  sampleRecords: overrides.sampleRecords || [],
  workflowStages: overrides.workflowStages || ["New", "In Progress", "Blocked", "Resolved"],
  escalations: overrides.escalations || [
    { level: "Level 1", owner: "Department Lead", reason: "Awaiting follow-up > 48h", age: "2d", next: "Reassign or close" },
  ],
  activity: overrides.activity || [
    { when: "Today 10:14", type: "Status changed", who: "Coordinator", detail: "Moved to In Progress" },
    { when: "Yesterday 16:02", type: "Note added", who: "Coordinator", detail: "Awaiting parent response" },
    { when: "Mon 09:30", type: "Task assigned", who: "Department Lead", detail: "Assigned to owner" },
  ],
  reports: overrides.reports || [],
});

const ALL: ModuleDefinition[] = [
  // --------- Growth & Marketing ---------
  generic({
    id: "marketing-dashboard",
    matchNames: ["Marketing Dashboard", "Referral CRM", "Lead Sources", "Campaigns", "CTM / Call Tracking", "LeadTrap", "Facebook Ads", "Google Ads", "SEO & Content", "Web Analytics", "Recruiting Marketing", "Community Outreach", "Reputation", "Attribution & ROI"],
    title: "Marketing Dashboard",
    description: "Operating center for source performance, campaigns, calls, and the patient lifetime journey.",
    department: "Marketing",
    ownerRole: "Marketing Team",
    purpose: "This workspace will track lead source activity, campaign performance, call outcomes, and patient journey signals end-to-end.",
    relatedModules: ["Referral CRM", "Lead Sources", "Patient Lifetime Journey", "Phone System"],
    primaryActions: ["Log Call", "Create Campaign", "Add Lead Source", "Open Patient Journey"],
    plannedDataFields: ["Source", "Campaign", "Spend", "Leads", "Conversion", "State"],
    kpis: [
      { label: "New Leads (7d)", value: "48" },
      { label: "Conversion Rate", value: "32%", tone: "success" },
      { label: "Calls (Today)", value: "27" },
      { label: "Missed Calls", value: "4", tone: "warning" },
    ],
    sampleRecords: [
      { name: "Google Search - GA", status: "Active", owner: "Marketing", priority: "High", due: "-", lastActivity: "1h ago", nextAction: "Review CPL" },
      { name: "Facebook - NC Awareness", status: "Active", owner: "Marketing", priority: "Normal", due: "-", lastActivity: "Today", nextAction: "A/B creative" },
      { name: "Pediatric Referral - VA", status: "Nurture", owner: "Business Dev", priority: "Normal", due: "Fri", lastActivity: "Yesterday", nextAction: "Follow-up call" },
    ],
    reports: [
      { name: "Marketing Source Performance", description: "Source quality, conversion, ROI." },
      { name: "Campaign Performance", description: "Reach, response, pipeline impact." },
      { name: "Phone Activity", description: "Inbound, missed, after-hours calls." },
    ],
  }),
  generic({
    id: "patient-lifetime-journey",
    matchNames: ["Patient Lifetime Journey"],
    title: "Patient Lifetime Journey",
    description: "Every touchpoint from first contact through active care and re-engagement.",
    department: "Growth & Admissions",
    ownerRole: "Marketing / Intake / Clinical",
    purpose: "The single timeline for each patient: calls, emails, SMS, referral source, intake, benefits, authorizations, scheduling, staffing, clinical, and re-engagement.",
    relatedModules: ["Referral CRM", "Intake", "Authorizations", "Scheduling", "Clinical"],
    primaryActions: ["Log Call", "Log Email", "Log SMS", "Add Note", "Add Follow-Up", "View Full Timeline", "Export Journey"],
    plannedDataFields: ["Patient", "Parent/Guardian", "Lead Source", "Campaign", "Referral Partner", "First Contact", "State", "Current Stage", "Intake Owner", "Clinical Owner", "Last Contact", "Next Action"],
    kpis: [
      { label: "Active Journeys", value: "312" },
      { label: "Stalled > 7d", value: "18", tone: "warning" },
      { label: "Re-engagements", value: "9" },
      { label: "Avg Time to Active", value: "42d" },
    ],
    sampleRecords: [
      { name: "Carter, J. (GA)", state: "GA", status: "Benefits", owner: "Aliza", priority: "High", lastActivity: "2h ago", nextAction: "Verify VOB" },
      { name: "Nguyen, L. (NC)", state: "NC", status: "Scheduling", owner: "Scheduling", priority: "Normal", lastActivity: "Today", nextAction: "Match RBT" },
      { name: "Patel, R. (VA)", state: "VA", status: "Active Care", owner: "BCBA", priority: "Normal", lastActivity: "Yesterday", nextAction: "Supervision visit" },
    ],
    reports: [
      { name: "Patient Journey Touchpoints", description: "Every touchpoint across the journey." },
      { name: "Lead to Ready-to-Start Conversion", description: "Conversion by source and state." },
    ],
  }),
  generic({
    id: "bd-dashboard",
    matchNames: ["Business Development Dashboard", "Referral Partner CRM", "Outreach Pipeline", "Follow-Up Tasks", "Provider Relationships", "Community Relationships"],
    title: "Business Development",
    description: "Referral partners, outreach, and source conversion across markets.",
    department: "Business Development",
    ownerRole: "Business Development",
    purpose: "Manage referral partners, provider relationships, community outreach, and conversion of referral sources into active clients.",
    relatedModules: ["Marketing Dashboard", "Patient Lifetime Journey", "Intake Dashboard"],
    primaryActions: ["Add Referral Partner", "Log Outreach", "Schedule Follow-Up", "Open Patient Journey"],
    plannedDataFields: ["Partner", "Type", "State", "Last Touch", "Next Touch", "Referrals (90d)", "Conversion %"],
    sampleRecords: [
      { name: "Atlanta Pediatrics", state: "GA", status: "Active Partner", owner: "BD Lead", priority: "High", lastActivity: "2d ago", nextAction: "Quarterly review" },
      { name: "Triangle Speech", state: "NC", status: "Nurture", owner: "BD Lead", priority: "Normal", lastActivity: "1w ago", nextAction: "Send materials" },
    ],
    reports: [
      { name: "Business Development Referral Sources", description: "Partner activity and volume." },
      { name: "Referral Source Conversion", description: "Partner -> active client conversion." },
    ],
  }),

  // --------- Intake ---------
  generic({
    id: "intake-dashboard",
    matchNames: ["Intake Dashboard", "Lead to Ready-to-Start Pipeline", "Missing Information", "Parent Communication", "Intake Tasks", "Lead Benefits Cheat Sheets"],
    title: "Intake Workspace",
    description: "Owned by the Intake team. Moves leads from referral to ready-for-authorizations.",
    department: "Intake",
    ownerRole: "Intake Team",
    purpose: "Intake owns normal intake execution: new referrals, missing information, parent communication, benefits readiness, and handoff to Authorizations.",
    relatedModules: ["Patient Lifetime Journey", "Authorizations Dashboard", "Phone System"],
    primaryActions: ["Create Referral", "Assign Intake Owner", "Log Contact Attempt", "Request Missing Info", "Mark Benefits Ready", "Send To Authorizations"],
    plannedDataFields: ["Patient", "State", "Source", "Owner", "Stage", "Missing Items", "Last Contact", "Days In Stage"],
    kpis: [
      { label: "New Referrals", value: "12" },
      { label: "Stuck > 5d", value: "7", tone: "warning" },
      { label: "Benefits Ready", value: "9", tone: "success" },
      { label: "Escalations", value: "1", tone: "critical" },
    ],
    sampleRecords: [
      { name: "Johnson, M.", state: "GA", status: "Awaiting Benefits", owner: "Aliza", priority: "High", due: "Thu", lastActivity: "Today", nextAction: "Call parent" },
      { name: "Davis, K.", state: "NC", status: "Missing Info", owner: "Intake", priority: "Normal", due: "Fri", lastActivity: "Yesterday", nextAction: "Request docs" },
    ],
    reports: [
      { name: "Intake Pipeline", description: "Live pipeline view." },
      { name: "Missing Information", description: "Blockers across intake." },
      { name: "Lead to Ready-to-Start Conversion", description: "Conversion by source and state." },
    ],
  }),

  // --------- Recruiting ---------
  generic({
    id: "recruiting-dashboard",
    matchNames: ["Recruiting Dashboard", "Candidate Pipeline", "Hiring Sources", "Interview Scheduling", "Offer Tracker", "Onboarding Handoff", "Recruiting Reports"],
    title: "Recruiting Workspace",
    description: "Candidate pipeline, interviews, offers, and onboarding handoff.",
    department: "Recruiting",
    ownerRole: "Recruiting Team",
    purpose: "Recruiting owns the full hiring pipeline with clean handoffs to HR onboarding and Authorizations/Credentialing.",
    relatedModules: ["HR Dashboard", "Credentialing Dashboard"],
    primaryActions: ["Add Candidate", "Schedule Interview", "Send Offer", "Handoff to Onboarding"],
    plannedDataFields: ["Candidate", "Role", "State", "Source", "Stage", "Owner", "Last Touch", "Next Step"],
    sampleRecords: [
      { name: "Williams, T. - RBT", state: "GA", status: "Interview Scheduled", owner: "Recruiter", priority: "High", due: "Wed", lastActivity: "Today", nextAction: "Calendly hold" },
      { name: "Lopez, S. - BCBA", state: "NC", status: "Offer Sent", owner: "Recruiter", priority: "High", due: "Fri", lastActivity: "Today", nextAction: "Follow up offer" },
    ],
    reports: [
      { name: "Recruiting Pipeline", description: "Candidate funnel by stage." },
      { name: "Hiring Sources", description: "Source quality and yield." },
    ],
  }),

  // --------- Authorizations ---------
  generic({
    id: "authorizations-dashboard",
    matchNames: ["Authorizations Dashboard", "Auth Queue", "Approved Authorizations", "Expiring Authorizations", "Denials", "Missing Docs", "Payer Requirements", "Authorization Reports"],
    title: "Authorizations Workspace",
    description: "Auth queue, approvals, denials, expirations, and payer requirements.",
    department: "Authorizations",
    ownerRole: "Authorizations Team",
    purpose: "Centralizes payer authorization work across states with owner, aging, missing docs, and next-action visibility.",
    relatedModules: ["Intake Dashboard", "Scheduling Dashboard", "Patient Lifetime Journey"],
    primaryActions: ["Submit Auth", "Mark Approved", "Log Denial", "Request Missing Doc", "Escalate Payer"],
    plannedDataFields: ["Patient", "State", "Payer", "Service Code", "Auth Dates", "Submission Status", "Approval Status", "Missing Docs", "Next Action"],
    kpis: [
      { label: "Open Auths", value: "63" },
      { label: "Expiring 30d", value: "11", tone: "warning" },
      { label: "Denials (30d)", value: "4", tone: "critical" },
      { label: "Approved (7d)", value: "18", tone: "success" },
    ],
    sampleRecords: [
      { name: "Patel, R. - Aetna", state: "VA", status: "Submitted", owner: "Auth Coord.", priority: "High", due: "Mon", lastActivity: "Today", nextAction: "Payer follow-up" },
      { name: "Carter, J. - Anthem", state: "GA", status: "Missing Docs", owner: "Auth Coord.", priority: "Urgent", due: "Today", lastActivity: "1h ago", nextAction: "Request eval", escalation: "Level 1" },
    ],
    reports: [
      { name: "Authorizations Queue", description: "Open and pending auths." },
      { name: "Denials", description: "Reason codes and trends." },
      { name: "Expiring Authorizations", description: "30/60/90 day windows." },
    ],
  }),

  // --------- Scheduling ---------
  generic({
    id: "scheduling-dashboard",
    matchNames: ["Scheduling Dashboard", "Schedule Gaps", "Session Coverage", "Cancellations", "Make-Up Sessions", "Scheduling Reports"],
    title: "Scheduling Workspace",
    description: "Authorized hours vs scheduled hours, gaps, cancellations, and make-ups.",
    department: "Scheduling",
    ownerRole: "Scheduling Team",
    purpose: "Surfaces scheduling gaps and coverage risks by client, staff, BCBA, and state.",
    relatedModules: ["Staffing Dashboard", "Authorizations Dashboard"],
    primaryActions: ["Fill Gap", "Reschedule", "Log Cancellation", "Schedule Make-Up"],
    plannedDataFields: ["Client", "BCBA", "RBT", "State", "Auth Hours", "Scheduled Hours", "Gap", "Reason"],
    kpis: [
      { label: "Coverage", value: "87%", tone: "success" },
      { label: "Open Gaps", value: "22", tone: "warning" },
      { label: "Cancellations (7d)", value: "14" },
      { label: "Make-Ups Owed", value: "9", tone: "warning" },
    ],
    sampleRecords: [
      { name: "Davis, K.", state: "NC", status: "8 hrs gap", owner: "Scheduler", priority: "High", due: "This week", lastActivity: "Today", nextAction: "Match RBT" },
    ],
    reports: [
      { name: "Scheduling Gaps", description: "Auth hours not scheduled." },
      { name: "Cancellations", description: "Patterns by client and staff." },
    ],
  }),

  // --------- Staffing ---------
  generic({
    id: "staffing-dashboard",
    matchNames: ["Staffing Dashboard", "Open Cases", "RBT Match Queue", "Coverage Needs", "Family Staffing Preferences", "Staffing Reports"],
    title: "Staffing Workspace",
    description: "Open cases, RBT matching, family preferences, and coverage needs.",
    department: "Staffing",
    ownerRole: "Staffing Team",
    purpose: "Match clients needing care with RBTs based on geography, language, availability, clinical fit, and family preferences.",
    relatedModules: ["Scheduling Dashboard", "Clinical Dashboard"],
    primaryActions: ["Match RBT", "Add Preference", "Open Patient Journey", "Escalate Coverage"],
    plannedDataFields: ["Client", "State", "Hours Needed", "Geography", "Language", "Clinical Fit", "Urgency"],
    sampleRecords: [
      { name: "Nguyen, L.", state: "NC", status: "Awaiting Match", owner: "Staffing", priority: "Urgent", due: "Today", lastActivity: "1h ago", nextAction: "Match RBT", escalation: "Level 1" },
    ],
    reports: [
      { name: "Staffing Needs", description: "Open clients by state." },
      { name: "Family Staffing Preferences", description: "Preference coverage." },
    ],
  }),

  // --------- HR ---------
  generic({
    id: "hr-dashboard",
    matchNames: ["HR Dashboard", "Employee Records", "HR Requests", "Compliance Items", "Device Requests", "Device Inventory", "NFC Badge Support", "HR Reports"],
    title: "HR Workspace",
    description: "Employee records, HR requests, compliance, device workflows, and NFC badges.",
    department: "HR",
    ownerRole: "HR Team",
    purpose: "Single operating workspace for HR requests, compliance tracking, device fulfillment, and NFC badge support.",
    relatedModules: ["Credentialing Dashboard", "Phone System"],
    primaryActions: ["Create Request", "Assign Owner", "Mark Resolved", "Issue Device", "Activate Badge"],
    plannedDataFields: ["Employee", "Type", "Owner", "Status", "Open Date", "Due", "Compliance Items"],
    sampleRecords: [
      { name: "Williams, T.", status: "Device Request - Laptop", owner: "HR", priority: "Normal", due: "Fri", lastActivity: "Today", nextAction: "Order device" },
      { name: "Lopez, S.", status: "Badge Activation", owner: "HR", priority: "High", due: "Mon", lastActivity: "Yesterday", nextAction: "Provision NFC" },
    ],
    reports: [
      { name: "HR Requests", description: "Open requests with aging." },
      { name: "Device Requests", description: "Fulfillment status." },
      { name: "NFC Badge Status", description: "Issuance and active status." },
    ],
  }),

  // --------- Credentialing ---------
  generic({
    id: "credentialing-dashboard",
    matchNames: ["Credentialing Dashboard", "Provider Credentialing", "Insurance Credentialing", "BCBA Credentials", "Uncredentialed BCBAs", "Expiring Credentials", "Credentialing Reports"],
    title: "Credentialing Workspace",
    description: "Provider and payer credentialing posture across all states.",
    department: "Credentialing",
    ownerRole: "Credentialing Team",
    purpose: "Track payer, provider, state, missing items, expirations, and blockers across the credentialing process.",
    relatedModules: ["HR Dashboard", "Authorizations Dashboard"],
    primaryActions: ["Start Credentialing", "Submit to Payer", "Mark Approved", "Flag Expiring"],
    plannedDataFields: ["Provider", "Payer", "State", "Status", "Submission Date", "Approval Date", "Expiration", "Missing Items"],
    kpis: [
      { label: "In Progress", value: "29" },
      { label: "Uncredentialed BCBAs", value: "7", tone: "warning" },
      { label: "Expiring 90d", value: "12", tone: "warning" },
      { label: "Approved (30d)", value: "14", tone: "success" },
    ],
    sampleRecords: [
      { name: "Lopez, S. - Aetna", state: "GA", status: "Submitted", owner: "Credentialing", priority: "High", due: "-", lastActivity: "2d ago", nextAction: "Payer follow-up" },
    ],
    reports: [
      { name: "Credentialing Status", description: "Process posture by clinician." },
      { name: "Uncredentialed BCBAs", description: "Gaps by payer and state." },
      { name: "Expiring Credentials", description: "30/60/90 day windows." },
    ],
  }),

  // --------- State Operations ---------
  generic({
    id: "state-dashboard",
    matchNames: ["State Dashboard", "State Health", "State Staffing Snapshot", "State Intake Snapshot", "State Authorization Snapshot", "State Clinical Snapshot", "State Support Dashboard", "State Intake Support", "State Task Queue", "Escalation Support", "Follow-Up Tracker", "State Health Overview", "Escalations", "Workflow Bottlenecks", "Department Scorecards", "Operations Dashboard", "System Requests", "Executive Dashboard", "Company KPIs", "Growth Snapshot", "Operations Scorecard"],
    title: "State Operations",
    description: "State health, escalations, and cross-department snapshots.",
    department: "State Operations",
    ownerRole: "State Director",
    purpose: "State Directors monitor state health and unblock escalations. Department teams still own normal execution.",
    relatedModules: ["Intake Dashboard", "Authorizations Dashboard", "Scheduling Dashboard", "Staffing Dashboard", "Clinical Dashboard"],
    primaryActions: ["Open Escalation", "Reassign Owner", "Request Status", "Mark Resolved"],
    plannedDataFields: ["State", "Department", "Open Items", "Aging", "Escalations", "KPI Trend"],
    sampleRecords: [
      { name: "Georgia - Intake", state: "GA", status: "Healthy", owner: "State Director", priority: "Normal", lastActivity: "Today", nextAction: "Weekly review" },
      { name: "North Carolina - Staffing", state: "NC", status: "At Risk", owner: "State Director", priority: "High", lastActivity: "Today", nextAction: "Escalate to Ops", escalation: "Level 2" },
    ],
    reports: [
      { name: "State Operations Health", description: "Operational posture and risk." },
      { name: "State Growth", description: "Leads and pipeline by state." },
    ],
  }),

  // --------- Clinical ---------
  generic({
    id: "clinical-dashboard",
    matchNames: ["Clinical Dashboard", "BCBA Oversight", "Clinical Quality", "Supervision Health", "Clinical Escalations", "Clinical Reports", "Caseload", "Supervision", "Treatment Plans", "Parent Training", "Clinical Documentation", "BCBA Dashboard", "Evaluations"],
    title: "Clinical Workspace",
    description: "BCBA oversight, supervision, quality, and clinical escalations.",
    department: "Clinical",
    ownerRole: "Clinical Director / BCBA",
    purpose: "Operating center for clinical oversight: caseload health, supervision, treatment plans, and parent training.",
    relatedModules: ["QA Dashboard", "Patient Lifetime Journey", "Evaluations"],
    primaryActions: ["Open Caseload", "Log Supervision", "Submit Treatment Plan", "Request QA Review"],
    plannedDataFields: ["BCBA", "Client", "State", "Supervision %", "Plan Status", "Last Visit", "Parent Training Hours"],
    sampleRecords: [
      { name: "Carter, J.", state: "GA", status: "Plan In Review", owner: "BCBA", priority: "Normal", due: "Fri", lastActivity: "Today", nextAction: "Finalize goals" },
    ],
    reports: [
      { name: "BCBA Productivity Report", description: "Delivered hours and supervision patterns." },
      { name: "Patient Activity", description: "Active patients and clinical engagement." },
      { name: "Evaluations", description: "Open and recent evaluations." },
    ],
  }),
  generic({
    id: "case-manager-dashboard",
    matchNames: ["Case Manager Dashboard", "Client Follow-Up", "Care Coordination", "Family Communication", "Case Notes"],
    title: "Case Manager Workspace",
    description: "Caseload coordination, follow-ups, and family communication.",
    department: "Clinical",
    ownerRole: "Case Manager",
    purpose: "Case Managers coordinate care, follow up with families, and keep cases moving across departments.",
    relatedModules: ["Evaluations", "Clinical Dashboard", "Patient Lifetime Journey"],
    primaryActions: ["Log Family Touch", "Add Follow-Up", "Open Patient Journey", "Escalate"],
    plannedDataFields: ["Client", "Family Contact", "Last Touch", "Next Touch", "Open Tasks"],
    reports: [
      { name: "Case Management Activity", description: "Caseload activity and follow-ups." },
      { name: "Family Follow-Up", description: "Open family communications." },
    ],
  }),
  generic({
    id: "rbt-dashboard",
    matchNames: ["RBT Dashboard", "My Clients", "Session Support", "Supervision Notes", "Nonbillable Points", "Career Path"],
    title: "RBT Workspace",
    description: "My clients, session support, supervision, and career path.",
    department: "Clinical",
    ownerRole: "RBT",
    purpose: "RBTs see only their assigned clients, schedule, supervision reminders, and growth path.",
    relatedModules: ["Scheduling Dashboard", "Training Academy"],
    primaryActions: ["Open Today's Schedule", "Request Support", "Log Supervision Note"],
    plannedDataFields: ["Client", "Today's Sessions", "Open Tasks", "Supervision Due"],
    reports: [
      { name: "Training Completion", description: "Progress in Training Academy." },
      { name: "Future Career Path", description: "Growth paths." },
    ],
  }),
  generic({
    id: "behavioral-support-dashboard",
    matchNames: ["Behavioral Support Dashboard", "Crisis Support", "Behavior Escalations", "Support Plans"],
    title: "Behavioral Support",
    description: "Crisis support, behavioral escalations, and support plans.",
    department: "Clinical",
    ownerRole: "Behavioral Support",
    purpose: "Track behavioral escalations and active support plans across clients.",
    relatedModules: ["Clinical Dashboard", "Patient Lifetime Journey"],
    primaryActions: ["Log Escalation", "Create Support Plan", "Open Patient Journey"],
    plannedDataFields: ["Client", "Severity", "Trigger", "Plan", "Owner", "Status"],
    reports: [
      { name: "Behavioral Escalations", description: "Escalation patterns by client." },
    ],
  }),
  generic({
    id: "qa-dashboard",
    matchNames: ["QA Dashboard", "Documentation Review", "Session Note Review", "Compliance Issues", "QA Reports"],
    title: "QA Workspace",
    description: "Documentation review, session notes, and compliance.",
    department: "QA",
    ownerRole: "QA Team",
    purpose: "QA reviews treatment plans, session notes, and compliance, then routes back to clinical owners.",
    relatedModules: ["Clinical Dashboard", "Authorizations Dashboard"],
    primaryActions: ["Start Review", "Flag Issue", "Send Back to BCBA", "Approve"],
    plannedDataFields: ["Document", "Owner", "State", "Status", "Issue Type", "Aging"],
    reports: [
      { name: "QA Review", description: "Plans and notes in active review." },
    ],
  }),

  // --------- Communications ---------
  generic({
    id: "call-logs",
    matchNames: ["Call Logs", "Shared Lines", "Phone Requests", "Directory"],
    title: "Communications",
    description: "Calls, shared lines, requests, and the internal directory.",
    department: "Communications",
    ownerRole: "Marketing / HR",
    purpose: "Operational visibility for phone activity, shared-line ownership, and internal directory.",
    relatedModules: ["Phone System", "Patient Lifetime Journey"],
    primaryActions: ["Log Call", "Assign Line Owner", "Open Directory"],
    plannedDataFields: ["Caller", "Type", "Outcome", "Urgency", "Owner", "Follow-Up"],
    reports: [
      { name: "Phone Activity", description: "Inbound, outbound, missed, after-hours." },
    ],
  }),
  generic({
    id: "user-activity",
    matchNames: ["User Activity", "User Activity Log"],
    title: "User Activity",
    description: "Sign-ins, page views, exports, and feature usage.",
    department: "Systems",
    ownerRole: "Super Admin",
    purpose: "Every meaningful action in Blossom OS creates user activity for security and operational visibility.",
    relatedModules: ["User Logins Vault", "Patient Activity"],
    primaryActions: ["Filter by User", "Export Activity"],
    plannedDataFields: ["User", "Role", "Action", "Resource", "Timestamp", "IP"],
    reports: [
      { name: "User Activity", description: "Cross-system activity log." },
    ],
  }),
  generic({
    id: "patient-activity",
    matchNames: ["Patient Activity", "Patient Activity Log"],
    title: "Patient Activity",
    description: "Calls, emails, SMS, status changes, and document uploads.",
    department: "Operations",
    ownerRole: "Cross-Department",
    purpose: "Every meaningful patient touchpoint creates patient activity and feeds the Patient Lifetime Journey.",
    relatedModules: ["Patient Lifetime Journey"],
    primaryActions: ["Filter by Patient", "Export Activity"],
    plannedDataFields: ["Patient", "Action", "Owner", "Department", "Timestamp"],
    reports: [
      { name: "Patient Activity", description: "Patient-level activity log." },
    ],
  }),
];

/** Find a module definition by the `module` query string value. */
export function findModuleByName(name: string): ModuleDefinition | undefined {
  const lower = name.trim().toLowerCase();
  return ALL.find((m) =>
    m.matchNames.some((n) => n.toLowerCase() === lower) ||
    m.title.toLowerCase() === lower
  );
}

export const MODULE_REGISTRY = ALL;