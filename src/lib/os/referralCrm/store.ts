import { useSyncExternalStore } from "react";

// =====================================================================
// Blossom Referral CRM — in-memory store (first-pass, frontend-only)
// Designed so the surface matches a future API/DB layer.
// =====================================================================

export type ID = string;

export interface CrmUser {
  id: ID;
  name: string;
  email: string;
  role: "admin" | "marketing_director" | "outreach_rep" | "intake" | "state_director" | "read_only";
  state?: string;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  states?: string[];
  teamIds?: ID[];
  active?: boolean;
}

export type CrmRole = CrmUser["role"];

export type CrmPermission =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "import"
  | "export"
  | "manage_workflows"
  | "manage_lists"
  | "manage_users";

export const CRM_PERMISSIONS: { id: CrmPermission; label: string }[] = [
  { id: "view", label: "View" },
  { id: "create", label: "Create" },
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete" },
  { id: "import", label: "Import" },
  { id: "export", label: "Export" },
  { id: "manage_workflows", label: "Workflows" },
  { id: "manage_lists", label: "Lists" },
  { id: "manage_users", label: "Users & Permissions" },
];

export const CRM_ROLES: { id: CrmRole; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "marketing_director", label: "Marketing Director" },
  { id: "outreach_rep", label: "Outreach Rep" },
  { id: "intake", label: "Intake Team" },
  { id: "state_director", label: "State Director" },
  { id: "read_only", label: "Read Only" },
];

export const TEAM_TYPES = ["Marketing", "Outreach", "Intake", "State Leadership", "Admin"] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

export interface CrmTeam {
  id: ID;
  name: string;
  type: TeamType;
  states: string[];
  memberIds: ID[];
  leadId?: ID;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PermissionMatrix = Record<CrmRole, Record<CrmPermission, boolean>>;

export const DEFAULT_PERMISSIONS: PermissionMatrix = {
  admin: {
    view: true, create: true, edit: true, delete: true, import: true, export: true,
    manage_workflows: true, manage_lists: true, manage_users: true,
  },
  marketing_director: {
    view: true, create: true, edit: true, delete: true, import: true, export: true,
    manage_workflows: true, manage_lists: true, manage_users: false,
  },
  outreach_rep: {
    view: true, create: true, edit: true, delete: false, import: false, export: true,
    manage_workflows: false, manage_lists: false, manage_users: false,
  },
  intake: {
    view: true, create: true, edit: true, delete: false, import: false, export: false,
    manage_workflows: false, manage_lists: false, manage_users: false,
  },
  state_director: {
    view: true, create: false, edit: false, delete: false, import: false, export: true,
    manage_workflows: false, manage_lists: false, manage_users: false,
  },
  read_only: {
    view: true, create: false, edit: false, delete: false, import: false, export: false,
    manage_workflows: false, manage_lists: false, manage_users: false,
  },
};

export interface Contact {
  id: ID;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  jobTitle?: string;
  specialty?: string;
  department?: string;
  companyId?: ID;
  associatedCompanyIds?: ID[];
  state?: string;
  territory?: string;
  ownerId?: ID;
  lifecycleStage?: string;
  leadStatus?: string;
  referralSourceType?: string;
  referralPartnerStatus?: string;
  preferredContactMethod?: "Email" | "Phone" | "Text" | "In-Person";
  lastContactedDate?: string;
  nextFollowUpDate?: string;
  lastReferralDate?: string;
  referralCount: number;
  relationshipStrength?: "Cold" | "Warm" | "Strong" | "Champion";
  lunchLearnStatus?: "Not Scheduled" | "Scheduled" | "Completed" | "Declined";
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // ---- Original imported / Supabase-only fields, preserved through hydrate + write-back ----
  directPhone?: string;
  contactOwner?: string;
  numberOfSalesActivities?: number;
  numberOfTimesContacted?: number;
  originalRecordId?: string;
  importBatchId?: string;
  recentEmailOpenedAt?: string;
  lastMeetingBookedAt?: string;
  source?: string;
  fullAddress?: string;
  websiteUrl?: string;
}

export interface Company {
  id: ID;
  name: string;
  website?: string;
  mainPhone?: string;
  generalEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  companyType?: string;
  specialty?: string;
  referralPartnerStatus?: string;
  activeReferralPartner?: boolean;
  ownerId?: ID;
  territory?: string;
  referralCount: number;
  referralsYTD: number;
  lastReferralDate?: string;
  lastContactedDate?: string;
  nextFollowUpDate?: string;
  relationshipTier?: "Tier A" | "Tier B" | "Tier C";
  lunchLearnStatus?: "Not Scheduled" | "Scheduled" | "Completed" | "Declined";
  strategicPartner?: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // ---- Original imported / Supabase-only fields, preserved through hydrate + write-back ----
  domain?: string;
  serviceArea?: string;
  relationshipOwner?: string[];
  importBatchId?: string;
  source?: string;
  normalizedName?: string;
  fullAddress?: string;
  websiteUrl?: string;
  mainEmail?: string;
}

/** Hydrated row from referral_import_batches — surfaced as Import History in the CRM UI. */
export interface ImportBatch {
  id: ID;
  fileName: string;
  uploadedAt: string;
  uploadedBy?: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateContacts: number;
  duplicateCompanies: number;
  status: string;
}

export interface Referral {
  id: ID;
  name: string;
  patientFirstName: string;
  patientLastInitial: string;
  referralDate: string;
  contactId?: ID;
  companyId?: ID;
  state?: string;
  serviceType?: string;
  referralStatus: "New" | "In Review" | "Intake Form Sent" | "Scheduled" | "Active" | "Closed" | "Lost";
  intakeStatus?: string;
  insuranceType?: string;
  assignedIntakeOwnerId?: ID;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Task {
  id: ID;
  title: string;
  type: "Call" | "Email" | "Meeting" | "Lunch & Learn" | "Follow-Up" | "Other";
  assignedUserId?: ID;
  contactId?: ID;
  companyId?: ID;
  referralId?: ID;
  dueDate?: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Completed";
  notes?: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: ID;
  type:
    | "note" | "call" | "email" | "meeting" | "task" | "referral_received"
    | "file_uploaded" | "property_change" | "owner_change" | "workflow_enrollment" | "list_membership";
  message: string;
  contactId?: ID;
  companyId?: ID;
  referralId?: ID;
  userId?: ID;
  createdAt: string;
}

export interface WorkflowDef {
  id: ID;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  lastRun?: string;
  runs: number;
  triggerType?: WorkflowTrigger;
  triggerConfig?: { days?: number; count?: number; listId?: ID; property?: string };
  lastRunResult?: string;
}

export interface ListDef {
  id: ID;
  name: string;
  kind: "static" | "active";
  object: "contacts" | "companies";
  criteria?: string;
  staticIds?: ID[];
  matcher?: (rows: (Contact | Company)[]) => (Contact | Company)[];
  criteriaRules?: ListCriteria;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListCriteria {
  state?: string;
  companyType?: string;
  referralSourceType?: string;
  referralPartnerStatus?: string;
  relationshipTier?: string;
  lastContactedOlderThanDays?: number;
  referralCountGte?: number;
  missingEmail?: boolean;
  missingPhone?: boolean;
  nextFollowUpEmpty?: boolean;
}

export type WorkflowTrigger =
  | "contact_created" | "company_created" | "referral_created"
  | "property_updated" | "task_completed" | "no_activity_days"
  | "contact_added_to_list" | "company_added_to_list"
  | "referral_status_changed" | "referral_count_reaches"
  | "lunch_learn_needed";

export const WORKFLOW_TRIGGERS: { id: WorkflowTrigger; label: string }[] = [
  { id: "contact_created", label: "Contact created" },
  { id: "company_created", label: "Company created" },
  { id: "referral_created", label: "Referral created" },
  { id: "property_updated", label: "Property updated" },
  { id: "task_completed", label: "Task completed" },
  { id: "no_activity_days", label: "No activity for X days" },
  { id: "contact_added_to_list", label: "Contact added to list" },
  { id: "company_added_to_list", label: "Company added to list" },
  { id: "referral_status_changed", label: "Referral status changed" },
  { id: "referral_count_reaches", label: "Referral count reaches number" },
  { id: "lunch_learn_needed", label: "Lunch & Learn needed (active partner, no L&L)" },
];

export const WORKFLOW_ACTIONS: { id: string; label: string }[] = [
  { id: "create_task", label: "Create task" },
  { id: "update_property", label: "Update property" },
  { id: "assign_owner", label: "Assign owner" },
  { id: "add_to_list", label: "Add to list" },
  { id: "remove_from_list", label: "Remove from list" },
  { id: "add_tag", label: "Add tag" },
  { id: "remove_tag", label: "Remove tag" },
  { id: "notify_user", label: "Notify user" },
  { id: "change_partner_status", label: "Change referral partner status" },
];

export interface Attachment {
  id: ID;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  objectType: "contact" | "company" | "referral";
  objectId: ID;
  uploadedByUserId?: ID;
  uploadedAt: string;
  category?: "Lunch & Learn" | "Insurance" | "Outreach" | "Welcome Packet" | "Other";
  notes?: string;
}

export interface AuditLogEntry {
  id: ID;
  at: string;
  userId?: ID;
  actor: string; // display name (user or "System")
  action:
    | "create" | "update" | "delete" | "restore"
    | "merge" | "import" | "export"
    | "workflow_toggle" | "workflow_run"
    | "attachment_added" | "attachment_removed"
    | "field_added" | "field_removed";
  objectType: "contact" | "company" | "referral" | "task" | "workflow" | "attachment" | "field" | "system";
  objectId?: ID;
  objectLabel?: string;
  summary: string;
}

export interface CustomFieldDef {
  id: ID;
  object: "contact" | "company" | "referral";
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  options?: string[];
  createdAt: string;
}

export const STATES = ["GA", "MD", "NC", "TN", "VA"] as const;

// ---------- seed ----------
const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

const users: CrmUser[] = [
  { id: "u-admin", name: "Admin User", firstName: "Admin", lastName: "User", email: "admin@blossomaba.com", role: "admin", active: true, states: [], teamIds: [] },
  { id: "u-mkt", name: "Marketing Director", firstName: "Marketing", lastName: "Director", email: "marketing@blossomaba.com", role: "marketing_director", active: true, states: [], teamIds: [] },
  { id: "u-nc", name: "NC Outreach Rep", firstName: "NC", lastName: "Outreach", email: "nc.outreach@blossomaba.com", role: "outreach_rep", state: "NC", states: ["NC"], active: true, teamIds: [] },
  { id: "u-va", name: "VA Outreach Rep", firstName: "VA", lastName: "Outreach", email: "va.outreach@blossomaba.com", role: "outreach_rep", state: "VA", states: ["VA"], active: true, teamIds: [] },
  { id: "u-ga", name: "GA Outreach Rep", firstName: "GA", lastName: "Outreach", email: "ga.outreach@blossomaba.com", role: "outreach_rep", state: "GA", states: ["GA"], active: true, teamIds: [] },
  { id: "u-tn", name: "TN Outreach Rep", firstName: "TN", lastName: "Outreach", email: "tn.outreach@blossomaba.com", role: "outreach_rep", state: "TN", states: ["TN"], active: true, teamIds: [] },
  { id: "u-md", name: "MD Outreach Rep", firstName: "MD", lastName: "Outreach", email: "md.outreach@blossomaba.com", role: "outreach_rep", state: "MD", states: ["MD"], active: true, teamIds: [] },
  { id: "u-intake", name: "Intake Team User", firstName: "Intake", lastName: "Team", email: "intake@blossomaba.com", role: "intake", active: true, states: [], teamIds: [] },
];

const teams: CrmTeam[] = [
  { id: "tm-mkt", name: "Marketing HQ", type: "Marketing", states: [], memberIds: ["u-mkt", "u-admin"], leadId: "u-mkt", active: true, createdAt: now(), updatedAt: now() },
  { id: "tm-outreach", name: "Field Outreach", type: "Outreach", states: ["NC","VA","GA","TN","MD"], memberIds: ["u-nc","u-va","u-ga","u-tn","u-md"], leadId: "u-mkt", active: true, createdAt: now(), updatedAt: now() },
  { id: "tm-intake", name: "Central Intake", type: "Intake", states: [], memberIds: ["u-intake"], leadId: "u-intake", active: true, createdAt: now(), updatedAt: now() },
];

const companies: Company[] = [
  {
    id: "c-bright", name: "Bright Path Pediatrics", website: "brightpathpeds.com",
    mainPhone: "(919) 555-0142", generalEmail: "office@brightpathpeds.com",
    address: "120 Oak St", city: "Raleigh", state: "NC", zip: "27601",
    companyType: "Pediatrician Office", specialty: "Pediatrics",
    referralPartnerStatus: "Warm Relationship", activeReferralPartner: true,
    ownerId: "u-nc", territory: "NC-Triangle",
    referralCount: 12, referralsYTD: 12, lastReferralDate: daysAgo(7), lastContactedDate: daysAgo(3),
    nextFollowUpDate: daysAhead(4), relationshipTier: "Tier A",
    lunchLearnStatus: "Completed", strategicPartner: true,
    tags: ["NC", "Pediatrics", "Warm"], notes: "Strong referral pipeline. Loves quarterly visits.",
    createdAt: daysAgo(180), updatedAt: daysAgo(3),
  },
  {
    id: "c-rosen", name: "Rosen Child Psychology", website: "rosenchild.com",
    mainPhone: "(804) 555-0188", generalEmail: "front@rosenchild.com",
    address: "44 Cary St", city: "Richmond", state: "VA", zip: "23220",
    companyType: "Diagnostic Center", specialty: "Psychology",
    referralPartnerStatus: "Active Referral Partner", activeReferralPartner: true,
    ownerId: "u-va", territory: "VA-Richmond",
    referralCount: 20, referralsYTD: 20, lastReferralDate: daysAgo(2), lastContactedDate: daysAgo(10),
    nextFollowUpDate: daysAhead(2), relationshipTier: "Tier A",
    lunchLearnStatus: "Scheduled", strategicPartner: true,
    tags: ["VA", "Diagnostics", "Tier A"], notes: "Dr. Rosen sends weekly. Send Q4 outcomes packet.",
    createdAt: daysAgo(220), updatedAt: daysAgo(2),
  },
  {
    id: "c-oak", name: "Oak Valley Elementary School", website: "oakvalley.k12.ga.us",
    mainPhone: "(770) 555-0199", generalEmail: "info@oakvalley.k12.ga.us",
    city: "Marietta", state: "GA", zip: "30060",
    companyType: "School", specialty: "Special Education",
    referralPartnerStatus: "New Target", activeReferralPartner: false,
    ownerId: "u-ga", territory: "GA-Metro",
    referralCount: 0, referralsYTD: 0,
    nextFollowUpDate: daysAhead(7), relationshipTier: "Tier C",
    lunchLearnStatus: "Not Scheduled", strategicPartner: false,
    tags: ["GA", "School", "Target"], notes: "Cold outreach in progress. Reach out to SPED director.",
    createdAt: daysAgo(40), updatedAt: daysAgo(40),
  },
  {
    id: "c-tn", name: "Tennessee Family Health", website: "tnfamilyhealth.com",
    mainPhone: "(615) 555-0123", city: "Nashville", state: "TN",
    companyType: "Pediatrician Office",
    referralPartnerStatus: "Connected", activeReferralPartner: true,
    ownerId: "u-tn", referralCount: 4, referralsYTD: 4,
    lastReferralDate: daysAgo(20), lastContactedDate: daysAgo(30),
    relationshipTier: "Tier B", lunchLearnStatus: "Not Scheduled",
    tags: ["TN", "Pediatrics"], createdAt: daysAgo(120), updatedAt: daysAgo(30),
  },
  {
    id: "c-md", name: "Maryland Autism Diagnostics", website: "mdautismdx.com",
    mainPhone: "(410) 555-0177", city: "Baltimore", state: "MD",
    companyType: "Diagnostic Center",
    referralPartnerStatus: "Active Referral Partner", activeReferralPartner: true,
    ownerId: "u-md", referralCount: 7, referralsYTD: 7,
    lastReferralDate: daysAgo(14), lastContactedDate: daysAgo(70),
    relationshipTier: "Tier B", lunchLearnStatus: "Not Scheduled",
    tags: ["MD", "Diagnostics"], createdAt: daysAgo(150), updatedAt: daysAgo(70),
  },
];

const contacts: Contact[] = [
  {
    id: "ct-sarah", firstName: "Sarah", lastName: "Miller",
    email: "sarah.miller@brightpathpeds.com", phone: "(919) 555-0142",
    mobilePhone: "(919) 555-0152", jobTitle: "Referral Coordinator",
    specialty: "Pediatrician", department: "Front Office",
    companyId: "c-bright", state: "NC", territory: "NC-Triangle",
    ownerId: "u-nc", lifecycleStage: "Active Partner",
    leadStatus: "Engaged", referralSourceType: "Pediatrician",
    referralPartnerStatus: "Warm Relationship",
    preferredContactMethod: "Email",
    lastContactedDate: daysAgo(3), nextFollowUpDate: daysAhead(4),
    lastReferralDate: daysAgo(7), referralCount: 9,
    relationshipStrength: "Strong", lunchLearnStatus: "Completed",
    tags: ["NC", "Champion"], notes: "Prefers email. Loves the parent welcome kit.",
    createdAt: daysAgo(180), updatedAt: daysAgo(3),
  },
  {
    id: "ct-david", firstName: "David", lastName: "Rosen",
    email: "dr.rosen@rosenchild.com", phone: "(804) 555-0188",
    jobTitle: "Psychologist", specialty: "Child Psychology",
    department: "Clinical", companyId: "c-rosen", state: "VA",
    territory: "VA-Richmond", ownerId: "u-va", lifecycleStage: "Strategic Partner",
    leadStatus: "Engaged", referralSourceType: "Psychologist",
    referralPartnerStatus: "Active Referral Partner",
    preferredContactMethod: "Phone",
    lastContactedDate: daysAgo(10), nextFollowUpDate: daysAhead(2),
    lastReferralDate: daysAgo(2), referralCount: 8,
    relationshipStrength: "Champion", lunchLearnStatus: "Scheduled",
    tags: ["VA", "Champion", "Tier A"], notes: "Schedule quarterly clinical sync.",
    createdAt: daysAgo(220), updatedAt: daysAgo(2),
  },
  {
    id: "ct-jane", firstName: "Jane", lastName: "Carter",
    email: "", phone: "(770) 555-0199",
    jobTitle: "SPED Director", companyId: "c-oak", state: "GA",
    ownerId: "u-ga", lifecycleStage: "Prospect", leadStatus: "New",
    referralSourceType: "Educator", referralPartnerStatus: "New Target",
    preferredContactMethod: "Email",
    nextFollowUpDate: daysAhead(5),
    referralCount: 0, relationshipStrength: "Cold", lunchLearnStatus: "Not Scheduled",
    tags: ["GA", "School", "Needs Email"],
    createdAt: daysAgo(30), updatedAt: daysAgo(30),
  },
  {
    id: "ct-mike", firstName: "Mike", lastName: "Thompson",
    email: "mthompson@tnfamilyhealth.com", phone: "(615) 555-0123",
    jobTitle: "Office Manager", companyId: "c-tn", state: "TN",
    ownerId: "u-tn", lifecycleStage: "Active Partner", leadStatus: "Engaged",
    referralSourceType: "Pediatrician", referralPartnerStatus: "Connected",
    preferredContactMethod: "Phone",
    lastContactedDate: daysAgo(75), lastReferralDate: daysAgo(20),
    referralCount: 4, relationshipStrength: "Warm",
    lunchLearnStatus: "Not Scheduled",
    tags: ["TN", "Lunch & Learn Needed"],
    createdAt: daysAgo(120), updatedAt: daysAgo(75),
  },
  {
    id: "ct-lisa", firstName: "Lisa", lastName: "Park",
    email: "lpark@mdautismdx.com", phone: "(410) 555-0177",
    jobTitle: "Intake Coordinator", companyId: "c-md", state: "MD",
    ownerId: "u-md", lifecycleStage: "Active Partner", leadStatus: "Engaged",
    referralSourceType: "Diagnostic Provider",
    referralPartnerStatus: "Active Referral Partner",
    preferredContactMethod: "Email",
    lastContactedDate: daysAgo(70), lastReferralDate: daysAgo(14),
    referralCount: 5, relationshipStrength: "Warm",
    lunchLearnStatus: "Not Scheduled",
    tags: ["MD", "Diagnostics"],
    createdAt: daysAgo(150), updatedAt: daysAgo(70),
  },
];

const referrals: Referral[] = [
  {
    id: "r-jacob", name: "Jacob M.", patientFirstName: "Jacob", patientLastInitial: "M",
    referralDate: daysAgo(7), contactId: "ct-sarah", companyId: "c-bright",
    state: "NC", serviceType: "In-Home ABA",
    referralStatus: "Intake Form Sent", intakeStatus: "Awaiting Response",
    insuranceType: "BCBS NC", assignedIntakeOwnerId: "u-intake",
    notes: "Mom contacted via email. Eligibility looks good.",
    createdAt: daysAgo(7), updatedAt: daysAgo(7),
  },
  {
    id: "r-ella", name: "Ella R.", patientFirstName: "Ella", patientLastInitial: "R",
    referralDate: daysAgo(2), contactId: "ct-david", companyId: "c-rosen",
    state: "VA", serviceType: "Center-Based ABA",
    referralStatus: "New", intakeStatus: "Pending",
    insuranceType: "Anthem VA", assignedIntakeOwnerId: "u-intake",
    createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
];

const tasks: Task[] = [
  {
    id: "t-1", title: "Call Bright Path Pediatrics", type: "Call",
    assignedUserId: "u-nc", companyId: "c-bright", contactId: "ct-sarah",
    dueDate: "2026-06-12", priority: "High", status: "Open",
    notes: "Confirm Q3 referral pipeline.", createdAt: daysAgo(2),
  },
  {
    id: "t-2", title: "Schedule Lunch & Learn", type: "Lunch & Learn",
    assignedUserId: "u-va", companyId: "c-rosen", contactId: "ct-david",
    dueDate: daysAhead(5).slice(0, 10), priority: "Medium", status: "Open",
    notes: "Confirm catering + clinical attendees.", createdAt: daysAgo(1),
  },
  {
    id: "t-3", title: "Send welcome packet to Oak Valley", type: "Email",
    assignedUserId: "u-ga", companyId: "c-oak", contactId: "ct-jane",
    dueDate: daysAhead(1).slice(0, 10), priority: "Medium", status: "Open",
    createdAt: daysAgo(3),
  },
  {
    id: "t-4", title: "Follow up — TN Family Health (60+ days)", type: "Follow-Up",
    assignedUserId: "u-tn", companyId: "c-tn", contactId: "ct-mike",
    dueDate: daysAgo(2).slice(0, 10), priority: "High", status: "Open",
    notes: "Overdue. No activity 60+ days.", createdAt: daysAgo(5),
  },
];

const activity: ActivityEvent[] = [
  { id: "a1", type: "referral_received", message: "Referral received: Jacob M.", companyId: "c-bright", contactId: "ct-sarah", createdAt: daysAgo(7) },
  { id: "a2", type: "email", message: "Sent Q3 update email", companyId: "c-bright", contactId: "ct-sarah", userId: "u-nc", createdAt: daysAgo(3) },
  { id: "a3", type: "referral_received", message: "Referral received: Ella R.", companyId: "c-rosen", contactId: "ct-david", createdAt: daysAgo(2) },
  { id: "a4", type: "meeting", message: "Quarterly clinical sync booked", companyId: "c-rosen", contactId: "ct-david", userId: "u-va", createdAt: daysAgo(10) },
  { id: "a5", type: "note", message: "Cold outreach started", companyId: "c-oak", contactId: "ct-jane", userId: "u-ga", createdAt: daysAgo(30) },
];

const workflows: WorkflowDef[] = [
  { id: "w1", name: "New Referral Source Added", trigger: "Contact created with referralSourceType set",
    actions: ["Assign owner by state", "Create welcome task", "Add to NC/GA/VA/TN/MD list"], enabled: true, runs: 12, lastRun: daysAgo(2) },
  { id: "w2", name: "No Activity in 60 Days", trigger: "Last contact > 60 days",
    actions: ["Create follow-up task", "Notify owner", "Tag as 'Re-engage'"], enabled: true, runs: 4, lastRun: daysAgo(1) },
  { id: "w3", name: "Referral Received", trigger: "Referral created",
    actions: ["Increment referral count", "Update last referral date", "Notify intake team"], enabled: true, runs: 32, lastRun: daysAgo(2) },
  { id: "w4", name: "Lunch & Learn Needed", trigger: "Active partner without L&L in 6 months",
    actions: ["Create L&L task", "Notify Marketing Director"], enabled: true, runs: 6, lastRun: daysAgo(7) },
  { id: "w5", name: "Inactive Referral Partner", trigger: "No referrals in 120 days",
    actions: ["Tag as inactive", "Create check-in task"], enabled: false, runs: 2, lastRun: daysAgo(40) },
];

const lists: ListDef[] = [
  { id: "l1", name: "NC Referral Sources", kind: "active", object: "contacts",
    criteria: "state = NC AND referralSourceType is set" },
  { id: "l2", name: "Missing Email", kind: "active", object: "contacts",
    criteria: "email is empty" },
  { id: "l3", name: "Active Referral Partners", kind: "active", object: "companies",
    criteria: "activeReferralPartner = true" },
  { id: "l4", name: "Lunch & Learn Needed", kind: "active", object: "contacts",
    criteria: "lunchLearnStatus = Not Scheduled AND relationshipStrength in (Warm, Strong)" },
  { id: "l5", name: "Top 5 Strategic Partners (static)", kind: "static", object: "companies",
    staticIds: ["c-bright", "c-rosen", "c-md"] },
];

// ---------- store ----------
interface State {
  users: CrmUser[];
  contacts: Contact[];
  companies: Company[];
  referrals: Referral[];
  tasks: Task[];
  activity: ActivityEvent[];
  workflows: WorkflowDef[];
  lists: ListDef[];
  attachments: Attachment[];
  auditLog: AuditLogEntry[];
  customFields: CustomFieldDef[];
  teams: CrmTeam[];
  permissions: PermissionMatrix;
  currentUserId: ID;
}

let state: State = {
  users, contacts, companies, referrals, tasks, activity, workflows, lists,
  teams,
  permissions: DEFAULT_PERMISSIONS,
  currentUserId: "u-admin",
  attachments: [
    { id: "att-1", fileName: "Bright Path - Lunch & Learn slides.pdf", mimeType: "application/pdf", sizeBytes: 482_113,
      objectType: "company", objectId: "c-bright", uploadedByUserId: "u-nc",
      uploadedAt: daysAgo(20), category: "Lunch & Learn" },
    { id: "att-2", fileName: "Rosen referral packet.pdf", mimeType: "application/pdf", sizeBytes: 312_004,
      objectType: "company", objectId: "c-rosen", uploadedByUserId: "u-va",
      uploadedAt: daysAgo(8), category: "Outreach" },
    { id: "att-3", fileName: "Jacob M. intake form.pdf", mimeType: "application/pdf", sizeBytes: 88_220,
      objectType: "referral", objectId: "r-jacob", uploadedByUserId: "u-intake",
      uploadedAt: daysAgo(6), category: "Insurance" },
  ],
  auditLog: [
    { id: "al-seed-1", at: daysAgo(7), actor: "System", action: "create", objectType: "referral",
      objectId: "r-jacob", objectLabel: "Jacob M.", summary: "Referral received from Bright Path Pediatrics" },
    { id: "al-seed-2", at: daysAgo(3), actor: "NC Outreach Rep", userId: "u-nc", action: "update",
      objectType: "contact", objectId: "ct-sarah", objectLabel: "Sarah Miller",
      summary: "Logged Q3 update email" },
  ],
  customFields: [
    { id: "cf-seed-1", object: "contact", label: "EHR System", type: "text", createdAt: daysAgo(60) },
    { id: "cf-seed-2", object: "company", label: "Annual Referral Goal", type: "number", createdAt: daysAgo(45) },
  ],
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function set(next: Partial<State>) {
  state = { ...state, ...next };
  emit();
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = () => state;

export function useCrm() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ---------- Supabase sync side-effects ----------
// The bridge layer registers async write handlers here so creates/updates
// in the CRM are mirrored to the Supabase referral tables. Handlers are
// fire-and-forget; the bridge re-hydrates the store after each batch.
export interface CrmSideEffects {
  onContactCreate?: (c: Contact) => void;
  onContactUpdate?: (id: ID, patch: Partial<Contact>, full: Contact | undefined) => void;
  onContactDelete?: (id: ID, hard: boolean) => void;
  onCompanyCreate?: (c: Company) => void;
  onCompanyUpdate?: (id: ID, patch: Partial<Company>, full: Company | undefined) => void;
  onCompanyDelete?: (id: ID, hard: boolean) => void;
  onActivityCreate?: (a: ActivityEvent) => void;
}
let sideEffects: CrmSideEffects = {};
export function setCrmSideEffects(se: CrmSideEffects) { sideEffects = se ?? {}; }
function fire<K extends keyof CrmSideEffects>(k: K, ...args: Parameters<NonNullable<CrmSideEffects[K]>>) {
  const fn = sideEffects[k] as ((...a: unknown[]) => void) | undefined;
  if (!fn) return;
  try { fn(...(args as unknown[])); } catch (e) { console.warn("[crm sideEffect]", k, e); }
}

/** Bulk replace data from Supabase. Keeps users/teams/permissions/workflows/lists. */
export function replaceCrmData(input: {
  contacts?: Contact[];
  companies?: Company[];
  activity?: ActivityEvent[];
}) {
  set({
    ...(input.contacts ? { contacts: input.contacts } : {}),
    ...(input.companies ? { companies: input.companies } : {}),
    ...(input.activity ? { activity: input.activity } : {}),
  });
}

const newId = () => Math.random().toString(36).slice(2, 10);
const logActivity = (e: Omit<ActivityEvent, "id" | "createdAt"> & { createdAt?: string }) => {
  const row: ActivityEvent = { id: newId(), createdAt: now(), ...e };
  set({ activity: [row, ...state.activity] });
  // Only mirror user-authored activities (notes, calls, emails, meetings, referrals)
  // to Supabase. Skip noisy property_change / list_membership / workflow events.
  const mirror: ActivityEvent["type"][] = ["note", "call", "email", "meeting", "referral_received", "task"];
  if (mirror.includes(row.type)) fire("onActivityCreate", row);
};

function logAudit(entry: Omit<AuditLogEntry, "id" | "at" | "actor"> & { actor?: string }) {
  const actor = entry.actor ?? (entry.userId ? state.users.find((u) => u.id === entry.userId)?.name ?? "System" : "Current User");
  const row: AuditLogEntry = { id: newId(), at: now(), actor, ...entry };
  set({ auditLog: [row, ...state.auditLog].slice(0, 500) });
}

// ---------- mutators ----------
export const crm = {
  // contacts
  addContact(input: Partial<Contact> & { firstName: string; lastName: string }) {
    const c: Contact = {
      id: newId(), referralCount: 0, tags: [], createdAt: now(), updatedAt: now(),
      ...input,
    } as Contact;
    set({ contacts: [c, ...state.contacts] });
    logActivity({ type: "property_change", message: `Contact created: ${c.firstName} ${c.lastName}`, contactId: c.id });
    logAudit({ action: "create", objectType: "contact", objectId: c.id, objectLabel: `${c.firstName} ${c.lastName}`, summary: "Contact created" });
    fire("onContactCreate", c);
    return c;
  },
  updateContact(id: ID, patch: Partial<Contact>) {
    set({ contacts: state.contacts.map((c) => c.id === id ? { ...c, ...patch, updatedAt: now() } : c) });
    logActivity({ type: "property_change", message: `Contact updated`, contactId: id });
    const c = state.contacts.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "contact", objectId: id, objectLabel: c ? `${c.firstName} ${c.lastName}` : id,
      summary: `Updated: ${Object.keys(patch).filter((k) => k !== "updatedAt").join(", ") || "—"}` });
    fire("onContactUpdate", id, patch, c);
  },
  softDeleteContact(id: ID) {
    set({ contacts: state.contacts.map((c) => c.id === id ? { ...c, deletedAt: now() } : c) });
    const c = state.contacts.find((x) => x.id === id);
    logAudit({ action: "delete", objectType: "contact", objectId: id, objectLabel: c ? `${c.firstName} ${c.lastName}` : id, summary: "Contact moved to deleted" });
    fire("onContactDelete", id, false);
  },
  restoreContact(id: ID) {
    set({ contacts: state.contacts.map((c) => c.id === id ? { ...c, deletedAt: undefined } : c) });
    const c = state.contacts.find((x) => x.id === id);
    logAudit({ action: "restore", objectType: "contact", objectId: id, objectLabel: c ? `${c.firstName} ${c.lastName}` : id, summary: "Contact restored" });
    fire("onContactUpdate", id, { deletedAt: undefined } as Partial<Contact>, c);
  },
  hardDeleteContact(id: ID) {
    set({ contacts: state.contacts.filter((c) => c.id !== id) });
    logAudit({ action: "delete", objectType: "contact", objectId: id, summary: "Contact permanently deleted" });
    fire("onContactDelete", id, true);
  },

  mergeContacts(winnerId: ID, loserId: ID) {
    const winner = state.contacts.find((c) => c.id === winnerId);
    const loser = state.contacts.find((c) => c.id === loserId);
    if (!winner || !loser) return;
    const merged: Contact = {
      ...winner,
      email: winner.email || loser.email,
      phone: winner.phone || loser.phone,
      mobilePhone: winner.mobilePhone || loser.mobilePhone,
      jobTitle: winner.jobTitle || loser.jobTitle,
      companyId: winner.companyId || loser.companyId,
      ownerId: winner.ownerId || loser.ownerId,
      notes: [winner.notes, loser.notes].filter(Boolean).join("\n---\n") || undefined,
      tags: Array.from(new Set([...(winner.tags || []), ...(loser.tags || [])])),
      referralCount: winner.referralCount + loser.referralCount,
      lastReferralDate: [winner.lastReferralDate, loser.lastReferralDate].filter(Boolean).sort().reverse()[0],
      lastContactedDate: [winner.lastContactedDate, loser.lastContactedDate].filter(Boolean).sort().reverse()[0],
      updatedAt: now(),
    };
    // re-point related rows
    const newContacts = state.contacts
      .filter((c) => c.id !== loserId)
      .map((c) => c.id === winnerId ? merged : c);
    const newReferrals = state.referrals.map((r) => r.contactId === loserId ? { ...r, contactId: winnerId } : r);
    const newTasks = state.tasks.map((t) => t.contactId === loserId ? { ...t, contactId: winnerId } : t);
    const newActivity = state.activity.map((a) => a.contactId === loserId ? { ...a, contactId: winnerId } : a);
    const newAttachments = state.attachments.map((a) =>
      a.objectType === "contact" && a.objectId === loserId ? { ...a, objectId: winnerId } : a);
    set({ contacts: newContacts, referrals: newReferrals, tasks: newTasks, activity: newActivity, attachments: newAttachments });
    logActivity({ type: "property_change", message: `Merged ${loser.firstName} ${loser.lastName} into ${winner.firstName} ${winner.lastName}`, contactId: winnerId });
    logAudit({ action: "merge", objectType: "contact", objectId: winnerId,
      objectLabel: `${winner.firstName} ${winner.lastName}`,
      summary: `Merged duplicate "${loser.firstName} ${loser.lastName}" into winner` });
  },

  // companies
  addCompany(input: Partial<Company> & { name: string }) {
    const c: Company = {
      id: newId(), referralCount: 0, referralsYTD: 0, tags: [],
      createdAt: now(), updatedAt: now(), ...input,
    } as Company;
    set({ companies: [c, ...state.companies] });
    logActivity({ type: "property_change", message: `Company created: ${c.name}`, companyId: c.id });
    logAudit({ action: "create", objectType: "company", objectId: c.id, objectLabel: c.name, summary: "Company created" });
    fire("onCompanyCreate", c);
    return c;
  },
  updateCompany(id: ID, patch: Partial<Company>) {
    set({ companies: state.companies.map((c) => c.id === id ? { ...c, ...patch, updatedAt: now() } : c) });
    logActivity({ type: "property_change", message: `Company updated`, companyId: id });
    const co = state.companies.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "company", objectId: id, objectLabel: co?.name,
      summary: `Updated: ${Object.keys(patch).filter((k) => k !== "updatedAt").join(", ") || "—"}` });
    fire("onCompanyUpdate", id, patch, co);
  },
  softDeleteCompany(id: ID) {
    set({ companies: state.companies.map((c) => c.id === id ? { ...c, deletedAt: now() } : c) });
    const co = state.companies.find((x) => x.id === id);
    logAudit({ action: "delete", objectType: "company", objectId: id, objectLabel: co?.name, summary: "Company moved to deleted" });
    fire("onCompanyDelete", id, false);
  },
  restoreCompany(id: ID) {
    set({ companies: state.companies.map((c) => c.id === id ? { ...c, deletedAt: undefined } : c) });
    const co = state.companies.find((x) => x.id === id);
    logAudit({ action: "restore", objectType: "company", objectId: id, objectLabel: co?.name, summary: "Company restored" });
    fire("onCompanyUpdate", id, { deletedAt: undefined } as Partial<Company>, co);
  },
  hardDeleteCompany(id: ID) {
    set({ companies: state.companies.filter((c) => c.id !== id) });
    logAudit({ action: "delete", objectType: "company", objectId: id, summary: "Company permanently deleted" });
    fire("onCompanyDelete", id, true);
  },

  mergeCompanies(winnerId: ID, loserId: ID) {
    const winner = state.companies.find((c) => c.id === winnerId);
    const loser = state.companies.find((c) => c.id === loserId);
    if (!winner || !loser) return;
    const pickMaxDate = (a?: string, b?: string) =>
      [a, b].filter(Boolean).sort().reverse()[0];
    const merged: Company = {
      ...winner,
      website: winner.website || loser.website,
      mainPhone: winner.mainPhone || loser.mainPhone,
      generalEmail: winner.generalEmail || loser.generalEmail,
      address: winner.address || loser.address,
      city: winner.city || loser.city,
      state: winner.state || loser.state,
      zip: winner.zip || loser.zip,
      companyType: winner.companyType || loser.companyType,
      specialty: winner.specialty || loser.specialty,
      referralPartnerStatus: winner.referralPartnerStatus || loser.referralPartnerStatus,
      ownerId: winner.ownerId || loser.ownerId,
      territory: winner.territory || loser.territory,
      relationshipTier: winner.relationshipTier || loser.relationshipTier,
      activeReferralPartner: winner.activeReferralPartner || loser.activeReferralPartner,
      strategicPartner: winner.strategicPartner || loser.strategicPartner,
      lunchLearnStatus: winner.lunchLearnStatus || loser.lunchLearnStatus,
      notes: [winner.notes, loser.notes].filter(Boolean).join("\n---\n") || undefined,
      tags: Array.from(new Set([...(winner.tags || []), ...(loser.tags || [])])),
      referralCount: (winner.referralCount || 0) + (loser.referralCount || 0),
      referralsYTD: (winner.referralsYTD || 0) + (loser.referralsYTD || 0),
      lastReferralDate: pickMaxDate(winner.lastReferralDate, loser.lastReferralDate),
      lastContactedDate: pickMaxDate(winner.lastContactedDate, loser.lastContactedDate),
      nextFollowUpDate: pickMaxDate(winner.nextFollowUpDate, loser.nextFollowUpDate),
      updatedAt: now(),
    };
    const newCompanies = state.companies
      .filter((c) => c.id !== loserId)
      .map((c) => c.id === winnerId ? merged : c);
    const newContacts = state.contacts.map((c) =>
      c.companyId === loserId ? { ...c, companyId: winnerId } : (
        c.associatedCompanyIds?.includes(loserId)
          ? { ...c, associatedCompanyIds: Array.from(new Set(c.associatedCompanyIds.map((x) => x === loserId ? winnerId : x))) }
          : c
      ));
    const newReferrals = state.referrals.map((r) => r.companyId === loserId ? { ...r, companyId: winnerId } : r);
    const newTasks = state.tasks.map((t) => t.companyId === loserId ? { ...t, companyId: winnerId } : t);
    const newActivity = state.activity.map((a) => a.companyId === loserId ? { ...a, companyId: winnerId } : a);
    const newAttachments = state.attachments.map((a) =>
      a.objectType === "company" && a.objectId === loserId ? { ...a, objectId: winnerId } : a);
    set({
      companies: newCompanies, contacts: newContacts, referrals: newReferrals,
      tasks: newTasks, activity: newActivity, attachments: newAttachments,
    });
    logActivity({ type: "property_change", message: `Merged company "${loser.name}" into "${winner.name}"`, companyId: winnerId });
    logAudit({ action: "merge", objectType: "company", objectId: winnerId, objectLabel: winner.name,
      summary: `Merged duplicate "${loser.name}" into winner` });
  },

  // referrals — also bumps contact + company stats
  addReferral(input: Partial<Referral> & { patientFirstName: string; patientLastInitial: string }) {
    const r: Referral = {
      id: newId(),
      name: `${input.patientFirstName} ${input.patientLastInitial}.`,
      referralDate: input.referralDate ?? now(),
      referralStatus: input.referralStatus ?? "New",
      createdAt: now(), updatedAt: now(),
      ...input,
    } as Referral;
    set({ referrals: [r, ...state.referrals] });
    if (r.contactId) {
      const c = state.contacts.find((x) => x.id === r.contactId);
      if (c) crm.updateContact(c.id, { referralCount: c.referralCount + 1, lastReferralDate: r.referralDate });
    }
    if (r.companyId) {
      const co = state.companies.find((x) => x.id === r.companyId);
      if (co) crm.updateCompany(co.id, {
        referralCount: co.referralCount + 1,
        referralsYTD: co.referralsYTD + 1,
        lastReferralDate: r.referralDate,
      });
    }
    logActivity({
      type: "referral_received", message: `Referral received: ${r.name}`,
      contactId: r.contactId, companyId: r.companyId, referralId: r.id,
    });
    logAudit({ action: "create", objectType: "referral", objectId: r.id, objectLabel: r.name, summary: "Referral created" });
    return r;
  },
  updateReferral(id: ID, patch: Partial<Referral>) {
    set({ referrals: state.referrals.map((r) => r.id === id ? { ...r, ...patch, updatedAt: now() } : r) });
    const r = state.referrals.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "referral", objectId: id, objectLabel: r?.name,
      summary: `Updated: ${Object.keys(patch).filter((k) => k !== "updatedAt").join(", ") || "—"}` });
  },
  softDeleteReferral(id: ID) {
    set({ referrals: state.referrals.map((r) => r.id === id ? { ...r, deletedAt: now() } : r) });
    const r = state.referrals.find((x) => x.id === id);
    logAudit({ action: "delete", objectType: "referral", objectId: id, objectLabel: r?.name, summary: "Referral moved to deleted" });
  },
  restoreReferral(id: ID) {
    set({ referrals: state.referrals.map((r) => r.id === id ? { ...r, deletedAt: undefined } : r) });
    const r = state.referrals.find((x) => x.id === id);
    logAudit({ action: "restore", objectType: "referral", objectId: id, objectLabel: r?.name, summary: "Referral restored" });
  },

  // tasks
  addTask(input: Partial<Task> & { title: string }) {
    const t: Task = {
      id: newId(), type: "Other", priority: "Medium", status: "Open",
      createdAt: now(), ...input,
    } as Task;
    set({ tasks: [t, ...state.tasks] });
    logActivity({ type: "task", message: `Task created: ${t.title}`, contactId: t.contactId, companyId: t.companyId, referralId: t.referralId });
    logAudit({ action: "create", objectType: "task", objectId: t.id, objectLabel: t.title, summary: "Task created" });
    return t;
  },
  updateTask(id: ID, patch: Partial<Task>) {
    set({ tasks: state.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) });
    const t = state.tasks.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "task", objectId: id, objectLabel: t?.title,
      summary: `Updated: ${Object.keys(patch).join(", ") || "—"}` });
  },
  deleteTask(id: ID) {
    set({ tasks: state.tasks.filter((t) => t.id !== id) });
    logAudit({ action: "delete", objectType: "task", objectId: id, summary: "Task deleted" });
  },

  // notes
  addNote(message: string, ref: { contactId?: ID; companyId?: ID; referralId?: ID }) {
    logActivity({ type: "note", message, ...ref });
  },

  logCustomActivity(input: {
    type: ActivityEvent["type"]; message: string;
    contactId?: ID; companyId?: ID; referralId?: ID; userId?: ID;
  }) {
    logActivity(input);
  },

  // attachments
  addAttachment(input: Omit<Attachment, "id" | "uploadedAt"> & { uploadedAt?: string }) {
    const a: Attachment = { id: newId(), uploadedAt: input.uploadedAt ?? now(), ...input };
    set({ attachments: [a, ...state.attachments] });
    logActivity({
      type: "file_uploaded",
      message: `File uploaded: ${a.fileName}`,
      contactId: a.objectType === "contact" ? a.objectId : undefined,
      companyId: a.objectType === "company" ? a.objectId : undefined,
      referralId: a.objectType === "referral" ? a.objectId : undefined,
      userId: a.uploadedByUserId,
    });
    logAudit({ action: "attachment_added", objectType: "attachment", objectId: a.id,
      objectLabel: a.fileName, summary: `Attached to ${a.objectType} ${a.objectId}` });
    return a;
  },
  removeAttachment(id: ID) {
    const a = state.attachments.find((x) => x.id === id);
    set({ attachments: state.attachments.filter((x) => x.id !== id) });
    if (a) logAudit({ action: "attachment_removed", objectType: "attachment", objectId: id, objectLabel: a.fileName, summary: "Attachment removed" });
  },

  // custom fields
  addCustomField(input: Omit<CustomFieldDef, "id" | "createdAt">) {
    const f: CustomFieldDef = { id: newId(), createdAt: now(), ...input };
    set({ customFields: [f, ...state.customFields] });
    logAudit({ action: "field_added", objectType: "field", objectId: f.id, objectLabel: f.label,
      summary: `Added ${f.type} field on ${f.object}` });
    return f;
  },
  removeCustomField(id: ID) {
    const f = state.customFields.find((x) => x.id === id);
    set({ customFields: state.customFields.filter((x) => x.id !== id) });
    if (f) logAudit({ action: "field_removed", objectType: "field", objectId: id, objectLabel: f.label, summary: "Removed custom field" });
  },

  // audit + import/export markers
  recordImport(summary: string) {
    logAudit({ action: "import", objectType: "system", summary });
  },
  recordExport(summary: string) {
    logAudit({ action: "export", objectType: "system", summary });
  },

  // workflows
  toggleWorkflow(id: ID) {
    set({ workflows: state.workflows.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w) });
    const w = state.workflows.find((x) => x.id === id);
    logAudit({ action: "workflow_toggle", objectType: "workflow", objectId: id, objectLabel: w?.name,
      summary: w?.enabled ? "Workflow enabled" : "Workflow disabled" });
  },
  runWorkflow(id: ID): string {
    const w = state.workflows.find((x) => x.id === id);
    if (!w) return "Workflow not found";
    const result = executeWorkflow(w);
    set({
      workflows: state.workflows.map((x) =>
        x.id === id ? { ...x, runs: x.runs + 1, lastRun: now(), lastRunResult: result } : x,
      ),
    });
    logAudit({ action: "workflow_run", objectType: "workflow", objectId: id, objectLabel: w.name, summary: `Ran workflow — ${result}` });
    return result;
  },

  addWorkflow(input: Partial<WorkflowDef> & { name: string }) {
    const w: WorkflowDef = {
      id: newId(), name: input.name, trigger: input.trigger ?? "Manual",
      actions: input.actions ?? [], enabled: input.enabled ?? true, runs: 0,
      triggerType: input.triggerType, triggerConfig: input.triggerConfig,
    };
    set({ workflows: [w, ...state.workflows] });
    logAudit({ action: "create", objectType: "workflow", objectId: w.id, objectLabel: w.name, summary: "Workflow created" });
    return w;
  },
  updateWorkflow(id: ID, patch: Partial<WorkflowDef>) {
    set({ workflows: state.workflows.map((w) => w.id === id ? { ...w, ...patch } : w) });
    const w = state.workflows.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "workflow", objectId: id, objectLabel: w?.name,
      summary: `Updated: ${Object.keys(patch).join(", ") || "—"}` });
  },
  deleteWorkflow(id: ID) {
    const w = state.workflows.find((x) => x.id === id);
    set({ workflows: state.workflows.filter((x) => x.id !== id) });
    logAudit({ action: "delete", objectType: "workflow", objectId: id, objectLabel: w?.name, summary: "Workflow deleted" });
  },

  // lists
  addList(input: Partial<ListDef> & { name: string; kind: "static" | "active"; object: "contacts" | "companies" }) {
    const l: ListDef = {
      id: newId(), name: input.name, kind: input.kind, object: input.object,
      criteria: input.criteria, staticIds: input.staticIds ?? (input.kind === "static" ? [] : undefined),
      criteriaRules: input.criteriaRules, createdAt: now(), updatedAt: now(),
    };
    set({ lists: [l, ...state.lists] });
    logAudit({ action: "create", objectType: "system", objectId: l.id, objectLabel: l.name, summary: `List created (${l.kind} · ${l.object})` });
    return l;
  },
  updateList(id: ID, patch: Partial<ListDef>) {
    set({ lists: state.lists.map((l) => l.id === id ? { ...l, ...patch, updatedAt: now() } : l) });
    const l = state.lists.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "system", objectId: id, objectLabel: l?.name,
      summary: `List updated: ${Object.keys(patch).join(", ") || "—"}` });
  },
  deleteList(id: ID) {
    const l = state.lists.find((x) => x.id === id);
    set({ lists: state.lists.filter((x) => x.id !== id) });
    logAudit({ action: "delete", objectType: "system", objectId: id, objectLabel: l?.name, summary: "List deleted" });
  },
  addRecordToStaticList(listId: ID, recordId: ID) {
    const l = state.lists.find((x) => x.id === listId);
    if (!l || l.kind !== "static") return;
    const ids = Array.from(new Set([...(l.staticIds ?? []), recordId]));
    set({ lists: state.lists.map((x) => x.id === listId ? { ...x, staticIds: ids, updatedAt: now() } : x) });
    logActivity({ type: "list_membership", message: `Added to list "${l.name}"`,
      contactId: l.object === "contacts" ? recordId : undefined,
      companyId: l.object === "companies" ? recordId : undefined });
    logAudit({ action: "update", objectType: "system", objectId: listId, objectLabel: l.name,
      summary: `Added ${l.object.slice(0, -1)} ${recordId} to static list` });
  },
  removeRecordFromStaticList(listId: ID, recordId: ID) {
    const l = state.lists.find((x) => x.id === listId);
    if (!l || l.kind !== "static") return;
    const ids = (l.staticIds ?? []).filter((x) => x !== recordId);
    set({ lists: state.lists.map((x) => x.id === listId ? { ...x, staticIds: ids, updatedAt: now() } : x) });
    logActivity({ type: "list_membership", message: `Removed from list "${l.name}"`,
      contactId: l.object === "contacts" ? recordId : undefined,
      companyId: l.object === "companies" ? recordId : undefined });
    logAudit({ action: "update", objectType: "system", objectId: listId, objectLabel: l.name,
      summary: `Removed ${l.object.slice(0, -1)} ${recordId} from static list` });
  },

  // ---- users ----
  setCurrentUser(id: ID) {
    if (!state.users.find((u) => u.id === id)) return;
    set({ currentUserId: id });
  },
  addUser(input: Partial<CrmUser> & { firstName: string; lastName: string; email: string; role: CrmRole }) {
    const id = `u-${newId()}`;
    const u: CrmUser = {
      id,
      name: `${input.firstName} ${input.lastName}`.trim(),
      email: input.email,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      mobilePhone: input.mobilePhone,
      states: input.states ?? [],
      teamIds: input.teamIds ?? [],
      active: input.active ?? true,
      state: (input.states ?? [])[0],
    };
    set({ users: [u, ...state.users] });
    logAudit({ action: "create", objectType: "system", objectId: u.id, objectLabel: u.name, summary: `User created (${u.role})` });
    return u;
  },
  updateUser(id: ID, patch: Partial<CrmUser>) {
    const prev = state.users.find((u) => u.id === id);
    const merged = prev ? { ...prev, ...patch } : prev;
    if (merged && (patch.firstName || patch.lastName)) {
      merged.name = `${merged.firstName ?? ""} ${merged.lastName ?? ""}`.trim() || merged.name;
    }
    if (merged && patch.states) {
      merged.state = patch.states[0];
    }
    set({ users: state.users.map((u) => u.id === id ? (merged as CrmUser) : u) });
    if (prev && patch.role && patch.role !== prev.role) {
      logAudit({ action: "update", objectType: "system", objectId: id, objectLabel: prev.name, summary: `Role changed: ${prev.role} → ${patch.role}` });
    } else {
      logAudit({ action: "update", objectType: "system", objectId: id, objectLabel: prev?.name, summary: `User updated: ${Object.keys(patch).join(", ") || "—"}` });
    }
  },
  setUserActive(id: ID, active: boolean) {
    const u = state.users.find((x) => x.id === id);
    set({ users: state.users.map((x) => x.id === id ? { ...x, active } : x) });
    logAudit({ action: "update", objectType: "system", objectId: id, objectLabel: u?.name, summary: active ? "User reactivated" : "User deactivated" });
  },

  // ---- teams ----
  addTeam(input: Partial<CrmTeam> & { name: string; type: TeamType }) {
    const t: CrmTeam = {
      id: `tm-${newId()}`,
      name: input.name,
      type: input.type,
      states: input.states ?? [],
      memberIds: input.memberIds ?? [],
      leadId: input.leadId,
      active: input.active ?? true,
      createdAt: now(),
      updatedAt: now(),
    };
    set({ teams: [t, ...state.teams] });
    logAudit({ action: "create", objectType: "system", objectId: t.id, objectLabel: t.name, summary: `Team created (${t.type})` });
    return t;
  },
  updateTeam(id: ID, patch: Partial<CrmTeam>) {
    set({ teams: state.teams.map((t) => t.id === id ? { ...t, ...patch, updatedAt: now() } : t) });
    const t = state.teams.find((x) => x.id === id);
    logAudit({ action: "update", objectType: "system", objectId: id, objectLabel: t?.name, summary: `Team updated: ${Object.keys(patch).join(", ") || "—"}` });
  },
  setTeamActive(id: ID, active: boolean) {
    const t = state.teams.find((x) => x.id === id);
    set({ teams: state.teams.map((x) => x.id === id ? { ...x, active, updatedAt: now() } : x) });
    logAudit({ action: "update", objectType: "system", objectId: id, objectLabel: t?.name, summary: active ? "Team reactivated" : "Team deactivated" });
  },

  // ---- permissions ----
  setPermission(role: CrmRole, perm: CrmPermission, value: boolean) {
    const next: PermissionMatrix = {
      ...state.permissions,
      [role]: { ...state.permissions[role], [perm]: value },
    };
    set({ permissions: next });
    logAudit({ action: "update", objectType: "system", objectLabel: role, summary: `Permission changed: ${role}.${perm} → ${value ? "allowed" : "denied"}` });
  },
  resetPermissions() {
    set({ permissions: DEFAULT_PERMISSIONS });
    logAudit({ action: "update", objectType: "system", summary: "Permission matrix reset to defaults" });
  },
};

// ---------- selectors / helpers ----------
export function fullName(c: Contact) { return `${c.firstName} ${c.lastName}`.trim(); }
export function activeContacts(s: State) { return s.contacts.filter((c) => !c.deletedAt); }
export function activeCompanies(s: State) { return s.companies.filter((c) => !c.deletedAt); }
export function activeReferrals(s: State) { return s.referrals.filter((r) => !r.deletedAt); }
export function userName(s: State, id?: ID) { return s.users.find((u) => u.id === id)?.name ?? "—"; }
export function companyName(s: State, id?: ID) { return s.companies.find((c) => c.id === id)?.name ?? "—"; }

// ---- permissions + scoping ----
export function currentUser(s: State): CrmUser | undefined {
  return s.users.find((u) => u.id === s.currentUserId);
}
export function canCrm(s: State, perm: CrmPermission): boolean {
  const u = currentUser(s);
  if (!u || u.active === false) return perm === "view";
  return !!s.permissions[u.role]?.[perm];
}
/** null = no state scoping (sees all), [] also = sees all (e.g. unconfigured). */
export function scopeStates(s: State): string[] | null {
  const u = currentUser(s);
  if (!u) return null;
  if (u.role === "admin" || u.role === "marketing_director") return null;
  const list = u.states ?? (u.state ? [u.state] : []);
  return list.length ? list : null;
}
function inScope(s: State, st?: string): boolean {
  const scope = scopeStates(s);
  if (!scope) return true;
  return !!st && scope.includes(st);
}
export function scopedContacts(s: State): Contact[] {
  return activeContacts(s).filter((c) => inScope(s, c.state));
}
export function scopedCompanies(s: State): Company[] {
  return activeCompanies(s).filter((c) => inScope(s, c.state));
}
export function scopedReferrals(s: State): Referral[] {
  return activeReferrals(s).filter((r) => inScope(s, r.state));
}
export function scopedTasks(s: State): Task[] {
  const scope = scopeStates(s);
  if (!scope) return s.tasks;
  return s.tasks.filter((t) => {
    const co = t.companyId ? s.companies.find((c) => c.id === t.companyId) : undefined;
    const ct = t.contactId ? s.contacts.find((c) => c.id === t.contactId) : undefined;
    return inScope(s, co?.state ?? ct?.state);
  });
}

export function evalList(s: State, list: ListDef): (Contact | Company)[] {
  const rows = list.object === "contacts" ? activeContacts(s) : activeCompanies(s);
  if (list.kind === "static") return rows.filter((r) => list.staticIds?.includes(r.id));
  if (list.criteriaRules) return matchCriteria(rows, list.object, list.criteriaRules);
  switch (list.id) {
    case "l1": return (rows as Contact[]).filter((c) => c.state === "NC" && !!c.referralSourceType);
    case "l2": return (rows as Contact[]).filter((c) => !c.email);
    case "l3": return (rows as Company[]).filter((c) => c.activeReferralPartner);
    case "l4": return (rows as Contact[]).filter((c) =>
      c.lunchLearnStatus === "Not Scheduled" && (c.relationshipStrength === "Warm" || c.relationshipStrength === "Strong"));
    default: return rows;
  }
}

function matchCriteria(
  rows: (Contact | Company)[],
  object: "contacts" | "companies",
  c: ListCriteria,
): (Contact | Company)[] {
  const olderThanMs = (iso: string | undefined, days: number) =>
    !!iso && Date.now() - new Date(iso).getTime() >= days * 86_400_000;
  return rows.filter((r) => {
    const anyR = r as Contact & Company;
    if (c.state && anyR.state !== c.state) return false;
    if (c.companyType && object === "companies" && (r as Company).companyType !== c.companyType) return false;
    if (c.referralSourceType && object === "contacts" && (r as Contact).referralSourceType !== c.referralSourceType) return false;
    if (c.referralPartnerStatus && (anyR.referralPartnerStatus ?? "") !== c.referralPartnerStatus) return false;
    if (c.relationshipTier && object === "companies" && (r as Company).relationshipTier !== c.relationshipTier) return false;
    if (typeof c.lastContactedOlderThanDays === "number" &&
        !olderThanMs(anyR.lastContactedDate, c.lastContactedOlderThanDays)) return false;
    if (typeof c.referralCountGte === "number" && (anyR.referralCount ?? 0) < c.referralCountGte) return false;
    if (c.missingEmail) {
      const email = object === "contacts" ? (r as Contact).email : (r as Company).generalEmail;
      if (email) return false;
    }
    if (c.missingPhone) {
      const phone = object === "contacts"
        ? ((r as Contact).phone || (r as Contact).mobilePhone)
        : (r as Company).mainPhone;
      if (phone) return false;
    }
    if (c.nextFollowUpEmpty && anyR.nextFollowUpDate) return false;
    return true;
  });
}

// ---------- workflow execution ----------
function executeWorkflow(w: WorkflowDef): string {
  const t = w.triggerType;
  if (!t) return `Logged run (no executable trigger)`;

  if (t === "no_activity_days") {
    const days = w.triggerConfig?.days ?? 60;
    const cutoff = Date.now() - days * 86_400_000;
    const targets = activeCompanies(state).filter((c) =>
      !c.lastContactedDate || new Date(c.lastContactedDate).getTime() < cutoff,
    );
    let created = 0;
    for (const co of targets.slice(0, 25)) {
      crm.addTask({
        title: `Follow-up: ${co.name} (no activity ${days}+ days)`,
        type: "Follow-Up", priority: "Medium", status: "Open",
        companyId: co.id, assignedUserId: co.ownerId,
        notes: `Auto-created by workflow "${w.name}"`,
      });
      created++;
    }
    return `${created} follow-up task${created === 1 ? "" : "s"} created`;
  }

  if (t === "lunch_learn_needed") {
    const targets = activeCompanies(state).filter((c) =>
      c.activeReferralPartner && c.lunchLearnStatus === "Not Scheduled",
    );
    let created = 0;
    for (const co of targets.slice(0, 25)) {
      crm.addTask({
        title: `Schedule Lunch & Learn: ${co.name}`,
        type: "Lunch & Learn", priority: "Medium", status: "Open",
        companyId: co.id, assignedUserId: co.ownerId,
        notes: `Auto-created by workflow "${w.name}"`,
      });
      created++;
    }
    return `${created} Lunch & Learn task${created === 1 ? "" : "s"} created`;
  }

  if (t === "referral_created") {
    const cutoff = Date.now() - 30 * 86_400_000;
    const targets = activeCompanies(state).filter((c) =>
      c.lastReferralDate && new Date(c.lastReferralDate).getTime() >= cutoff &&
      c.referralPartnerStatus !== "Active Referral Partner",
    );
    let updated = 0;
    for (const co of targets.slice(0, 50)) {
      crm.updateCompany(co.id, { referralPartnerStatus: "Active Referral Partner", activeReferralPartner: true });
      logActivity({ type: "property_change", message: `Marked as Active Referral Partner via workflow "${w.name}"`, companyId: co.id });
      updated++;
    }
    return `${updated} partner status update${updated === 1 ? "" : "s"}`;
  }

  if (t === "referral_count_reaches") {
    const n = w.triggerConfig?.count ?? 10;
    const targets = activeCompanies(state).filter((c) => (c.referralCount ?? 0) >= n);
    let tagged = 0;
    for (const co of targets) {
      const tag = `${n}+ referrals`;
      if (!co.tags.includes(tag)) {
        crm.updateCompany(co.id, { tags: [...co.tags, tag] });
        tagged++;
      }
    }
    return `${tagged} compan${tagged === 1 ? "y" : "ies"} tagged`;
  }

  // Fallback: just log the actions list as activity entries.
  for (const a of w.actions.slice(0, 5)) {
    logActivity({ type: "workflow_enrollment", message: `Workflow "${w.name}": ${a}` });
  }
  return `Executed ${w.actions.length} action${w.actions.length === 1 ? "" : "s"}`;
}