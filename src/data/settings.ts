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
  | "onboarding-allowlist"
  | "email-templates"
  | "sms-templates"
  | "document-types"
  | "integrations"
  | "search-ranking"
  | "push-notifications"
  | "alert-audit"
  | "alert-sla"
  | "audit-logs";

export type SettingsGroup = "System" | "Workflow" | "People" | "Communication" | "Documents" | "Integrations" | "Intelligence" | "Data";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  group: SettingsGroup;
  description: string;
}

export const settingsNav: SettingsNavItem[] = [];

export const settingsGroups: SettingsGroup[] = [];

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

export const mockStates: StateCoverage[] = [];

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

export const mockPayors: PayorConfig[] = [];

// =================== Pipeline stages ===================

export interface PipelineStage {
  id: string;
  label: string;
  pipeline: "Lead" | "Client";
  order: number;
  color: "info" | "warning" | "success" | "destructive" | "muted" | "default";
  terminal: boolean;
}

export const mockPipelineStages: PipelineStage[] = [];

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

export const mockTaskTemplates: TaskTemplate[] = [];

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

export const mockRoles: Role[] = [];

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

export const mockAssignmentRules: AssignmentRule[] = [];

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

export const mockTemplates: MessageTemplate[] = [];

// =================== Document types ===================

export interface DocumentTypeConfig {
  id: string;
  name: string;
  requiredAtStage: string;
  blocksProgress: boolean;
  category: "Form" | "Consent" | "Insurance" | "Clinical" | "Authorization";
}

export const mockDocumentTypes: DocumentTypeConfig[] = [];

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

export const mockIntegrations: IntegrationConfig[] = [];

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

export const mockAuditLogs: AuditLogEntry[] = [];

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
