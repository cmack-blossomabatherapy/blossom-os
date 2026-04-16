// =================== Settings mock dataset ===================

export type SettingsSectionId =
  | "general"
  | "states"
  | "clinics"
  | "payors"
  | "pipeline"
  | "task-templates"
  | "automation-rules"
  | "roles"
  | "assignment-rules"
  | "email-templates"
  | "sms-templates"
  | "document-types"
  | "integrations"
  | "audit-logs";

export type SettingsGroup = "System" | "Workflow" | "People" | "Communication" | "Documents" | "Integrations" | "Data";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  group: SettingsGroup;
  description: string;
}

export const settingsNav: SettingsNavItem[] = [
  // System
  { id: "general", label: "General", group: "System", description: "Company name, timezone, branding" },
  { id: "states", label: "States & Coverage", group: "System", description: "Active states + per-state owners" },
  { id: "clinics", label: "Clinics", group: "System", description: "Locations, capacity, managers" },
  { id: "payors", label: "Payors / Insurance", group: "System", description: "Auth rules and renewal cycles" },
  // Workflow
  { id: "pipeline", label: "Pipeline Stages", group: "Workflow", description: "Lead + Client lifecycle stages" },
  { id: "task-templates", label: "Task Templates", group: "Workflow", description: "SOP-driven task generation" },
  { id: "automation-rules", label: "Automation Rules", group: "Workflow", description: "Triggers, conditions, safety" },
  // People
  { id: "roles", label: "Roles & Permissions", group: "People", description: "Who can do what" },
  { id: "assignment-rules", label: "Assignment Rules", group: "People", description: "Auto-assign by state, payor, queue" },
  // Communication
  { id: "email-templates", label: "Email Templates", group: "Communication", description: "Welcome, form, consent, follow-up" },
  { id: "sms-templates", label: "SMS Templates", group: "Communication", description: "Reminders + confirmations" },
  // Documents
  { id: "document-types", label: "Document Types", group: "Documents", description: "Required docs per stage" },
  // Integrations
  { id: "integrations", label: "Integrations", group: "Integrations", description: "Pandadoc, Eligipro, CentralReach…" },
  // Data
  { id: "audit-logs", label: "Audit Logs", group: "Data", description: "Who changed what, when" },
];

export const settingsGroups: SettingsGroup[] = [
  "System", "Workflow", "People", "Communication", "Documents", "Integrations", "Data",
];

// =================== State coverage ===================

export interface StateCoverage {
  code: string;
  name: string;
  active: boolean;
  intakeOwner: string;
  authOwner: string;
  qaOwner: string;
  schedulingOwner: string;
  staffingOwner: string;
}

export const mockStates: StateCoverage[] = [
  { code: "GA", name: "Georgia", active: true, intakeOwner: "Sarah Mitchell", authOwner: "Priya Kapoor", qaOwner: "Lisa Wang", schedulingOwner: "David Chen", staffingOwner: "Maya Foster" },
  { code: "TX", name: "Texas", active: true, intakeOwner: "James Rodriguez", authOwner: "Marcus Taylor", qaOwner: "Lisa Wang", schedulingOwner: "David Chen", staffingOwner: "Maya Foster" },
  { code: "AZ", name: "Arizona", active: true, intakeOwner: "James Rodriguez", authOwner: "Priya Kapoor", qaOwner: "Lisa Wang", schedulingOwner: "David Chen", staffingOwner: "Maya Foster" },
  { code: "NC", name: "North Carolina", active: false, intakeOwner: "—", authOwner: "—", qaOwner: "—", schedulingOwner: "—", staffingOwner: "—" },
  { code: "TN", name: "Tennessee", active: false, intakeOwner: "—", authOwner: "—", qaOwner: "—", schedulingOwner: "—", staffingOwner: "—" },
];

// =================== Payors ===================

export interface PayorConfig {
  name: string;
  states: string[];
  authValidityDays: number;
  renewalLeadDays: number;
  vobRequired: boolean;
  qaRequired: boolean;
  notes: string;
}

export const mockPayors: PayorConfig[] = [
  { name: "Aetna", states: ["GA", "TX", "AZ"], authValidityDays: 180, renewalLeadDays: 30, vobRequired: true, qaRequired: true, notes: "Treatment plan required for renewal" },
  { name: "BCBS Georgia", states: ["GA"], authValidityDays: 180, renewalLeadDays: 45, vobRequired: true, qaRequired: true, notes: "Submit through portal only" },
  { name: "Cigna", states: ["GA", "TX"], authValidityDays: 90, renewalLeadDays: 21, vobRequired: true, qaRequired: true, notes: "Frequent denials — flag for review" },
  { name: "Medicaid GA", states: ["GA"], authValidityDays: 365, renewalLeadDays: 60, vobRequired: false, qaRequired: true, notes: "Long renewal cycle" },
  { name: "Medicaid TX", states: ["TX"], authValidityDays: 365, renewalLeadDays: 60, vobRequired: false, qaRequired: true, notes: "" },
  { name: "United Healthcare", states: ["GA", "TX", "AZ"], authValidityDays: 180, renewalLeadDays: 30, vobRequired: true, qaRequired: true, notes: "" },
];

// =================== Pipeline stages ===================

export interface PipelineStage {
  id: string;
  label: string;
  pipeline: "Lead" | "Client";
  order: number;
  color: "info" | "warning" | "success" | "destructive" | "muted" | "default";
  terminal: boolean;
}

export const mockPipelineStages: PipelineStage[] = [
  // Lead
  { id: "L1", label: "New Lead", pipeline: "Lead", order: 1, color: "info", terminal: false },
  { id: "L2", label: "In Contact", pipeline: "Lead", order: 2, color: "info", terminal: false },
  { id: "L3", label: "Sent Form", pipeline: "Lead", order: 3, color: "warning", terminal: false },
  { id: "L4", label: "Missing Info", pipeline: "Lead", order: 4, color: "destructive", terminal: false },
  { id: "L5", label: "Form Received", pipeline: "Lead", order: 5, color: "success", terminal: false },
  { id: "L6", label: "Sent to VOB", pipeline: "Lead", order: 6, color: "warning", terminal: false },
  { id: "L7", label: "VOB Completed", pipeline: "Lead", order: 7, color: "success", terminal: true },
  // Client
  { id: "C1", label: "BCBA Assignment", pipeline: "Client", order: 1, color: "info", terminal: false },
  { id: "C2", label: "Pending Initial Auth", pipeline: "Client", order: 2, color: "warning", terminal: false },
  { id: "C3", label: "Waiting on Consent", pipeline: "Client", order: 3, color: "warning", terminal: false },
  { id: "C4", label: "Schedule Assessment", pipeline: "Client", order: 4, color: "info", terminal: false },
  { id: "C5", label: "QA", pipeline: "Client", order: 5, color: "default", terminal: false },
  { id: "C6", label: "Pending Treatment Auth", pipeline: "Client", order: 6, color: "warning", terminal: false },
  { id: "C7", label: "Staffing Needed", pipeline: "Client", order: 7, color: "info", terminal: false },
  { id: "C8", label: "Pending Start Date", pipeline: "Client", order: 8, color: "info", terminal: false },
  { id: "C9", label: "Active", pipeline: "Client", order: 9, color: "success", terminal: true },
];

// =================== Task templates ===================

export interface TaskTemplate {
  id: string;
  name: string;
  department: "Intake" | "Auth" | "QA" | "Scheduling" | "Staffing" | "Operations";
  triggerStage: string;
  defaultPriority: "High" | "Medium" | "Low";
  slaHours: number;
  active: boolean;
}

export const mockTaskTemplates: TaskTemplate[] = [
  { id: "TT-01", name: "Review Intake Packet", department: "Intake", triggerStage: "Form Received", defaultPriority: "High", slaHours: 24, active: true },
  { id: "TT-02", name: "Set Insurance Type", department: "Intake", triggerStage: "Form Received", defaultPriority: "Medium", slaHours: 24, active: true },
  { id: "TT-03", name: "Collect Missing Information", department: "Intake", triggerStage: "Missing Info", defaultPriority: "High", slaHours: 48, active: true },
  { id: "TT-04", name: "Submit Authorization", department: "Auth", triggerStage: "Pending Treatment Auth", defaultPriority: "High", slaHours: 72, active: true },
  { id: "TT-05", name: "Confirm Treatment Plan", department: "Auth", triggerStage: "Pending Treatment Auth", defaultPriority: "High", slaHours: 48, active: true },
  { id: "TT-06", name: "Fix Missing Documentation", department: "Auth", triggerStage: "Cannot Submit", defaultPriority: "High", slaHours: 48, active: true },
  { id: "TT-07", name: "Complete QA Checklist", department: "QA", triggerStage: "QA", defaultPriority: "Medium", slaHours: 72, active: true },
  { id: "TT-08", name: "Confirm BCBA Assignment", department: "Scheduling", triggerStage: "BCBA Assignment", defaultPriority: "Medium", slaHours: 48, active: true },
  { id: "TT-09", name: "Enter Assessment Date", department: "Scheduling", triggerStage: "Schedule Assessment", defaultPriority: "Medium", slaHours: 48, active: true },
  { id: "TT-10", name: "Build Schedule", department: "Scheduling", triggerStage: "Pending Start Date", defaultPriority: "Medium", slaHours: 72, active: true },
  { id: "TT-11", name: "Assign RBT", department: "Staffing", triggerStage: "Staffing Needed", defaultPriority: "High", slaHours: 96, active: true },
  { id: "TT-12", name: "Send Pairing Email", department: "Operations", triggerStage: "Active", defaultPriority: "Low", slaHours: 24, active: true },
  { id: "TT-13", name: "Generate Case Coordination Document", department: "Operations", triggerStage: "Pending Start Date", defaultPriority: "Low", slaHours: 96, active: false },
];

// =================== Roles ===================

export type PermissionKey =
  | "view-leads" | "edit-leads"
  | "view-clients" | "edit-clients"
  | "view-auths" | "edit-auths"
  | "view-qa" | "edit-qa"
  | "run-automations"
  | "access-reports"
  | "manage-team"
  | "manage-settings";

export interface Role {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  permissions: Record<PermissionKey, boolean>;
}

const all = (v: boolean) =>
  ({
    "view-leads": v, "edit-leads": v,
    "view-clients": v, "edit-clients": v,
    "view-auths": v, "edit-auths": v,
    "view-qa": v, "edit-qa": v,
    "run-automations": v,
    "access-reports": v,
    "manage-team": v,
    "manage-settings": v,
  } as Record<PermissionKey, boolean>);

export const mockRoles: Role[] = [
  { id: "R1", name: "Admin", description: "Full system access", memberCount: 2, permissions: all(true) },
  {
    id: "R2", name: "Operations", description: "Cross-team management", memberCount: 1,
    permissions: { ...all(true), "manage-settings": false },
  },
  {
    id: "R3", name: "Intake", description: "Lead + form management", memberCount: 3,
    permissions: { ...all(false), "view-leads": true, "edit-leads": true, "view-clients": true, "access-reports": true },
  },
  {
    id: "R4", name: "Authorization", description: "Auth submission + tracking", memberCount: 2,
    permissions: { ...all(false), "view-clients": true, "view-auths": true, "edit-auths": true, "view-leads": true, "access-reports": true },
  },
  {
    id: "R5", name: "QA", description: "Treatment plan review", memberCount: 1,
    permissions: { ...all(false), "view-clients": true, "view-qa": true, "edit-qa": true, "view-auths": true, "access-reports": true },
  },
  {
    id: "R6", name: "Scheduler", description: "Assessment + start dates", memberCount: 1,
    permissions: { ...all(false), "view-clients": true, "edit-clients": true, "view-leads": true, "access-reports": true },
  },
  {
    id: "R7", name: "Staffing", description: "RBT assignment", memberCount: 1,
    permissions: { ...all(false), "view-clients": true, "edit-clients": true, "access-reports": true },
  },
  {
    id: "R8", name: "Clinic Staff", description: "Read-only clinical view", memberCount: 2,
    permissions: { ...all(false), "view-clients": true, "view-qa": true },
  },
];

export const permissionLabels: Record<PermissionKey, string> = {
  "view-leads": "View Leads",
  "edit-leads": "Edit Leads",
  "view-clients": "View Clients",
  "edit-clients": "Edit Clients",
  "view-auths": "View Auths",
  "edit-auths": "Edit Auths",
  "view-qa": "View QA",
  "edit-qa": "Edit QA",
  "run-automations": "Run Automations",
  "access-reports": "Access Reports",
  "manage-team": "Manage Team",
  "manage-settings": "Manage Settings",
};

// =================== Assignment rules ===================

export interface AssignmentRule {
  id: string;
  domain: "Leads" | "Authorizations" | "QA" | "Staffing" | "Scheduling";
  basis: "State" | "Payor" | "Queue" | "Region" | "Round-robin";
  description: string;
  active: boolean;
}

export const mockAssignmentRules: AssignmentRule[] = [
  { id: "AR-1", domain: "Leads", basis: "State", description: "Route by lead.state to that state's intake owner pool", active: true },
  { id: "AR-2", domain: "Authorizations", basis: "State", description: "Route by client.state to that state's auth owner", active: true },
  { id: "AR-3", domain: "Authorizations", basis: "Payor", description: "BCBS-only auths route to Marcus Taylor", active: true },
  { id: "AR-4", domain: "QA", basis: "Queue", description: "QA items pulled from shared queue, FIFO", active: true },
  { id: "AR-5", domain: "Staffing", basis: "Region", description: "RBT assignment matches client zip → nearest RBT pool", active: true },
  { id: "AR-6", domain: "Scheduling", basis: "Round-robin", description: "Rotate among David Chen + 1 backup", active: false },
];

// =================== Email + SMS templates ===================

export interface MessageTemplate {
  id: string;
  name: string;
  trigger: string;
  channel: "Email" | "SMS";
  subject?: string;
  body: string;
  active: boolean;
}

export const mockTemplates: MessageTemplate[] = [
  { id: "MT-1", name: "Welcome Email", channel: "Email", trigger: "Lead created", subject: "Welcome to Blossom ABA Therapy", body: "Hi {{parent_name}}, thanks for reaching out about {{child_name}}…", active: true },
  { id: "MT-2", name: "Form Email", channel: "Email", trigger: "Move to In Contact", subject: "Your intake form", body: "Please complete this short form so we can verify benefits: {{form_link}}", active: true },
  { id: "MT-3", name: "Consent Email", channel: "Email", trigger: "BCBA Assigned", subject: "Consent forms for {{child_name}}", body: "Your BCBA {{bcba_name}} is assigned. Sign consent here: {{consent_link}}", active: true },
  { id: "MT-4", name: "Auth Approved Notice", channel: "Email", trigger: "Auth Approved", subject: "Great news — auth approved", body: "Your authorization for {{child_name}} is approved.", active: true },
  { id: "MT-5", name: "Lead Confirmation", channel: "SMS", trigger: "Lead created", body: "Hi {{parent_name}}, this is Blossom ABA. We'll reach out within 24h.", active: true },
  { id: "MT-6", name: "Form Reminder", channel: "SMS", trigger: "Form not returned 48h", body: "Friendly reminder to complete your intake form: {{form_link}}", active: true },
  { id: "MT-7", name: "Pairing Reminder", channel: "SMS", trigger: "First session 24h away", body: "Reminder: {{child_name}}'s first session with {{rbt_name}} is tomorrow at {{time}}.", active: true },
];

// =================== Document types ===================

export interface DocumentTypeConfig {
  id: string;
  name: string;
  requiredAtStage: string;
  blocksProgress: boolean;
  category: "Form" | "Consent" | "Insurance" | "Clinical" | "Authorization";
}

export const mockDocumentTypes: DocumentTypeConfig[] = [
  { id: "DT-1", name: "Initial Intake Form", category: "Form", requiredAtStage: "Form Received", blocksProgress: true },
  { id: "DT-2", name: "Insurance Card (front)", category: "Insurance", requiredAtStage: "Sent to VOB", blocksProgress: true },
  { id: "DT-3", name: "Insurance Card (back)", category: "Insurance", requiredAtStage: "Sent to VOB", blocksProgress: true },
  { id: "DT-4", name: "Treatment Consent", category: "Consent", requiredAtStage: "Waiting on Consent", blocksProgress: true },
  { id: "DT-5", name: "Telehealth Consent", category: "Consent", requiredAtStage: "Waiting on Consent", blocksProgress: false },
  { id: "DT-6", name: "Treatment Plan", category: "Clinical", requiredAtStage: "QA", blocksProgress: true },
  { id: "DT-7", name: "Supporting Documentation", category: "Authorization", requiredAtStage: "Pending Treatment Auth", blocksProgress: true },
  { id: "DT-8", name: "Authorization Letter", category: "Authorization", requiredAtStage: "Active", blocksProgress: false },
];

// =================== Integrations ===================

export type IntegrationStatus = "Connected" | "Disconnected" | "Error";

export interface IntegrationConfig {
  id: string;
  name: string;
  category: "Forms" | "Insurance" | "Clinical" | "Communication" | "Web";
  description: string;
  status: IntegrationStatus;
  lastSync: string | null;
}

const hoursAgo = (n: number) => new Date(Date.now() - n * 3600_000).toISOString();

export const mockIntegrations: IntegrationConfig[] = [
  { id: "I-1", name: "Website Form", category: "Web", description: "Public intake form → creates Lead", status: "Connected", lastSync: hoursAgo(0.5) },
  { id: "I-2", name: "Pandadoc", category: "Forms", description: "Form sending + e-signature", status: "Connected", lastSync: hoursAgo(2) },
  { id: "I-3", name: "Eligipro", category: "Insurance", description: "Verification of benefits", status: "Connected", lastSync: hoursAgo(6) },
  { id: "I-4", name: "CentralReach", category: "Clinical", description: "Clinical data + scheduling", status: "Connected", lastSync: hoursAgo(1) },
  { id: "I-5", name: "Twilio", category: "Communication", description: "SMS + voice provider", status: "Error", lastSync: hoursAgo(3) },
  { id: "I-6", name: "Sendgrid", category: "Communication", description: "Transactional email", status: "Connected", lastSync: hoursAgo(0.25) },
];

// =================== Audit logs ===================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "User" | "Automation" | "System";
  action: string;
  target: string;
  detail: string;
}

const mins = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const mockAuditLogs: AuditLogEntry[] = [
  { id: "A-1", timestamp: mins(3), actor: "Sarah Mitchell", actorType: "User", action: "Updated Lead Stage", target: "Mason Reid", detail: "Sent Form → Form Received" },
  { id: "A-2", timestamp: mins(12), actor: "AUTO-001", actorType: "Automation", action: "Created Task", target: "Aria Singh", detail: "Send to VOB · auto-created from Form Completed" },
  { id: "A-3", timestamp: mins(34), actor: "Mordy Greenberg", actorType: "User", action: "Approved Settings Change", target: "Payors / Aetna", detail: "renewal lead = 30d" },
  { id: "A-4", timestamp: mins(58), actor: "AUTO-021", actorType: "Automation", action: "Moved Stage", target: "Noah Williams", detail: "→ Staffing Needed (Auth Approved)" },
  { id: "A-5", timestamp: mins(95), actor: "System", actorType: "System", action: "Nightly Backup", target: "Database", detail: "Snapshot stored" },
  { id: "A-6", timestamp: mins(140), actor: "Priya Kapoor", actorType: "User", action: "Updated Auth Status", target: "AUTH-2110", detail: "Pending → Submitted" },
  { id: "A-7", timestamp: mins(180), actor: "AUTO-090", actorType: "Automation", action: "Send SMS Failed", target: "Liam Carter", detail: "Twilio error 21610: recipient unsubscribed" },
  { id: "A-8", timestamp: mins(240), actor: "Lisa Wang", actorType: "User", action: "Completed QA", target: "QA-1207", detail: "Approved · ready for auth submission" },
];

// =================== Helpers ===================

export const integrationStatusVariant = (
  s: IntegrationStatus,
): "default" | "success" | "warning" | "destructive" | "info" | "muted" =>
  ({ Connected: "success", Disconnected: "muted", Error: "destructive" } as const)[s];

export const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
};
