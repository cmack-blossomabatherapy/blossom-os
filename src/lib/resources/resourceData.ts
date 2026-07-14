import {
  FileText, Workflow, ClipboardList, FileSpreadsheet, ShieldCheck, Users,
  GraduationCap, Cpu, UserPlus, CalendarClock, FileCheck2, BadgeCheck,
  Banknote, Crown, MessageSquare, Link as LinkIcon, Play, Image as ImageIcon,
  FileType2, BookOpen, type LucideIcon,
} from "lucide-react";
import type { OSRole } from "@/lib/os/permissions";
import { SD_SOPS_BY_WEEK } from "@/lib/training/academyData";

export type ResourceType =
  | "SOP" | "Workflow" | "Form" | "Template" | "Checklist"
  | "PDF" | "DOCX" | "XLSX" | "CSV" | "Video" | "Link" | "Tango" | "Image";

export type ResourceStatus = "Published" | "Draft" | "Archived";

export type ResourceCategoryId =
  | "sops" | "workflows" | "templates" | "insurance" | "communication"
  | "systems" | "training" | "hr" | "operational" | "leadership";

export interface ResourceCategory {
  id: ResourceCategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: "purple" | "blue" | "teal" | "amber" | "rose" | "emerald" | "slate" | "indigo";
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategoryId;
  status: ResourceStatus;
  /** Role assignment — empty array means visible to all roles. */
  roles: OSRole[];
  /** Department label (free-form). */
  departments: string[];
  /** State scoping — empty array means all states. */
  states: string[];
  tags: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  fileUrl?: string;
  /** Supabase Storage path (private bucket). Resolved to a signed URL on open. */
  storagePath?: string;
  /** Supabase Storage bucket the file actually lives in (resource-library, knowledge-documents, resource-videos, bcba-imports, data-uploads). */
  storageBucket?: string;
  /** File name shown in the detail view and download button. */
  fileName?: string;
  /** File size in bytes, if known. */
  fileSize?: number;
  /** MIME type, if known. */
  mimeType?: string;
  /** Stable manifest identifier (RFO-#####). */
  resourceId?: string;
  /** Manifest-driven visibility level: admin_only, leadership_only, operations_only, clinical_only, department_only, role_only, all_staff. */
  visibilityLevel?: string;
  /** Manifest owner name, if provided. */
  owner?: string;
  /** Date the resource was last reviewed (ISO date). */
  lastReviewedDate?: string;
  /** True when the manifest marks the resource as sensitive. */
  isSensitive?: boolean;
  /** True when the resource must be acknowledged before use. */
  requiresAcknowledgement?: boolean;
  /** True when the resource is part of a training journey. */
  trainingRelated?: boolean;
  /** True when the resource is a SOP / policy / procedure. */
  sopRelated?: boolean;
  featured?: boolean;
  pinned?: boolean;
  /**
   * Higher-level resource taxonomy used by the Resource Library and Training
   * Academy. Optional — falls back to `type` when not provided.
   */
  resourceType?:
    | "sop"
    | "handbook"
    | "template"
    | "workflow"
    | "guide"
    | "policy"
    | "checklist"
    | "training"
    | "reference";
  /**
   * Sensitivity classification. `excluded` and `admin_only` are kept out of
   * the standard Resource Library by `visibleResources`.
   */
  sensitivity?: "public_internal" | "role_restricted" | "admin_only" | "excluded";
  /** Attachment lifecycle status. `pending_upload` renders as a calm placeholder. */
  attachmentStatus?: "available" | "pending_upload" | "excluded";
  /** Friendly note about where the source lives (no sensitive file paths). */
  sourceNote?: string;
  /**
   * Pass 2 — upload workflow lifecycle for bulk-imported resources.
   * Resources without an `uploadStatus` are treated as `published` (legacy seed).
   * Only `published` items appear in the standard Resource Library.
   */
  uploadStatus?: ResourceUploadStatus;
  /**
   * Phase 6 — AI ingestion lifecycle:
   *  - pending  → not yet chunked
   *  - queued   → scheduled for the next ingest run
   *  - ready    → chunks live in `knowledge_chunks` for Blossom AI
   *  - error    → last ingest attempt failed
   *  - skipped  → intentionally excluded from ingestion
   */
  ingestStatus?: "pending" | "queued" | "ready" | "error" | "skipped";
  /** Count of vector chunks generated for AI retrieval. */
  chunkCount?: number;
  /** True when a transcript has been captured for a video resource. */
  transcriptAvailable?: boolean;
}

/**
 * Pass 2 — Bulk-upload workflow states.
 *
 *  - ready_to_upload  → metadata complete, awaiting storage wiring
 *  - pending_review   → generic admin review needed
 *  - needs_conversion → wrong file type (e.g. heic → jpg)
 *  - privacy_review   → may contain PII/PHI or a named-person message
 *  - business_review  → leadership / business approval needed
 *  - vault_only       → credential/login/portal material — admin-vault only
 *  - excluded         → never publish (e.g. `_Sensitive_Not_For_Shared_Context`)
 *  - published        → live in the standard Resource Library
 */
export type ResourceUploadStatus =
  | "ready_to_upload"
  | "pending_review"
  | "needs_conversion"
  | "privacy_review"
  | "business_review"
  | "vault_only"
  | "excluded"
  | "missing_file"
  | "published";

export const UPLOAD_STATUS_LABEL: Record<ResourceUploadStatus, string> = {
  ready_to_upload:  "Ready to upload",
  pending_review:   "Pending review",
  needs_conversion: "Needs conversion",
  privacy_review:   "Privacy review",
  business_review:  "Business review",
  vault_only:       "Vault only",
  excluded:         "Excluded",
  missing_file:     "Missing file",
  published:        "Published",
};

/** Statuses that should never appear in the standard, user-facing Resource Library. */
export const NON_PUBLIC_UPLOAD_STATUSES: ResourceUploadStatus[] = [
  "pending_review",
  "needs_conversion",
  "privacy_review",
  "business_review",
  "vault_only",
  "excluded",
  "ready_to_upload",
  "missing_file",
];

/** Keywords that indicate a credential / vault / portal-access document. */
export const CREDENTIAL_KEYWORDS = [
  "login",
  "password",
  "credential",
  "credentials",
  "vault",
  "account",
  "portal",
  "passcode",
  "ssn",
] as const;

/** Keywords that indicate a file needs privacy review before publishing. */
export const PRIVACY_REVIEW_KEYWORDS = [
  "filled in",
  "filled-in",
  "completed",
  "signed",
  "consent",
  "phi",
  "client name",
  "named-person",
  "personal message",
  "generic document",
] as const;

/** True if the given text mentions any credential/vault keyword. */
export function containsCredentialKeywords(text: string): boolean {
  const t = (text || "").toLowerCase();
  return CREDENTIAL_KEYWORDS.some((kw) => t.includes(kw));
}

/** True if the given text mentions a privacy-review keyword. */
export function containsPrivacyReviewKeywords(text: string): boolean {
  const t = (text || "").toLowerCase();
  return PRIVACY_REVIEW_KEYWORDS.some((kw) => t.includes(kw));
}

export const resourceCategories: ResourceCategory[] = [
  { id: "sops",          name: "SOPs",                  description: "Standard operating procedures.",         icon: FileText,      tone: "purple"  },
  { id: "workflows",     name: "Workflows",             description: "End-to-end operational processes.",      icon: Workflow,      tone: "blue"    },
  { id: "templates",     name: "Templates",             description: "Documents, emails, and message templates.", icon: FileType2,  tone: "amber"   },
  { id: "insurance",     name: "Insurance Resources",   description: "Payer guides, VOB tools, coverage sheets.", icon: ShieldCheck, tone: "emerald" },
  { id: "communication", name: "Communication Templates", description: "Family and team communication scripts.", icon: MessageSquare, tone: "teal"  },
  { id: "systems",       name: "Systems & Software",    description: "Tools, logins, and platform references.", icon: Cpu,         tone: "slate"   },
  { id: "training",      name: "Training Materials",    description: "Quick guides and academy resources.",    icon: GraduationCap, tone: "indigo" },
  { id: "hr",            name: "HR Resources",          description: "Policies, benefits, onboarding documents.", icon: Users,     tone: "rose"    },
  { id: "operational",   name: "Operational Guides",    description: "Operational playbooks and references.",  icon: BookOpen,      tone: "blue"    },
  { id: "leadership",    name: "Leadership Resources",  description: "Strategy, leadership memos, planning docs.", icon: Crown,    tone: "purple"  },
];

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

const INTAKE_ROLES: OSRole[] = ["intake_coordinator", "operations_leadership", "state_director", "super_admin"];

export const resources: Resource[] = [
  // ============ INTAKE ROLE — fully built ============
  {
    id: "r-intake-workflow-sop",
    title: "Intake Workflow SOP",
    description: "Full intake workflow from new lead capture to client conversion.",
    type: "SOP", category: "sops", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["intake","workflow","sop","onboarding"], uploadedBy: "Jordan Pierce",
    createdAt: daysAgo(90), updatedAt: daysAgo(3), pinned: true, featured: true,
  },
  {
    id: "r-insurance-cheat",
    title: "Insurance Cheat Sheet",
    description: "Quick reference for payer rules, copays, and authorization windows.",
    type: "PDF", category: "insurance", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake","Authorizations"], states: [],
    tags: ["insurance","payer","vob","cheatsheet"], uploadedBy: "Maria Lopez",
    createdAt: daysAgo(45), updatedAt: daysAgo(2), pinned: true, featured: true,
  },
  {
    id: "r-vob-guide",
    title: "Benefits Verification Decision Guide",
    description: "Step-by-step guide for benefits verification and decisioning new referrals.",
    type: "SOP", category: "insurance", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["vob","benefits","verification"], uploadedBy: "Alex Chen",
    createdAt: daysAgo(60), updatedAt: daysAgo(7), pinned: true, featured: true,
  },
  {
    id: "r-missing-info-checklist",
    title: "Packet Follow Up / Missing Info Checklist",
    description: "Checklist for following up on incomplete intake packets and missing info.",
    type: "Checklist", category: "workflows", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["checklist","followup","intake"], uploadedBy: "Jordan Pierce",
    createdAt: daysAgo(40), updatedAt: daysAgo(5), pinned: true,
  },
  {
    id: "r-family-comms-templates",
    title: "Family Communication Templates",
    description: "Email and SMS templates for family-facing intake communication.",
    type: "Template", category: "communication", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["communication","family","email","sms"], uploadedBy: "Intake Team",
    createdAt: daysAgo(55), updatedAt: daysAgo(9), pinned: true, featured: true,
  },
  {
    id: "r-assessment-coord-flow",
    title: "Assessment Coordination Workflow",
    description: "How to coordinate initial assessments with BCBAs and families.",
    type: "Workflow", category: "workflows", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake","Clinical"], states: [],
    tags: ["assessment","coordination","scheduling"], uploadedBy: "Intake Team",
    createdAt: daysAgo(35), updatedAt: daysAgo(6),
  },
  {
    id: "r-intake-daily-checklist",
    title: "Intake Daily Checklist",
    description: "Daily operational tasks for Intake Coordinators.",
    type: "Checklist", category: "operational", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["checklist","daily","operations"], uploadedBy: "Intake Lead",
    createdAt: daysAgo(20), updatedAt: daysAgo(1),
  },
  {
    id: "r-blossom-os-intake-guide",
    title: "Blossom OS Intake Guide",
    description: "How to use Blossom OS as an Intake Coordinator.",
    type: "PDF", category: "training", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["blossom","intake","guide","training"], uploadedBy: "Training Team",
    createdAt: daysAgo(15), updatedAt: daysAgo(1),
  },
  {
    id: "r-ask-blossom-ai-guide",
    title: "Operational Insights Quick Guide",
    description: "How to use Operational Insights in your daily workflow.",
    type: "Link", category: "training", status: "Published",
    roles: [], departments: [], states: [],
    tags: ["ai","blossom","quickstart"], uploadedBy: "AI Team",
    createdAt: daysAgo(10), updatedAt: daysAgo(2), url: "/ai/assistant",
  },

  // ============ Scheduling ============
  { id:"r-scheduling-flow", title:"Scheduling Workflow", description:"How to build a balanced weekly schedule across BCBAs and RBTs.",
    type:"Workflow", category:"workflows", status:"Published",
    roles:["scheduling_team","operations_leadership","state_director","super_admin"], departments:["Scheduling"], states:[],
    tags:["scheduling","availability"], uploadedBy:"Priya Patel", createdAt:daysAgo(40), updatedAt:daysAgo(2) },
  { id:"r-pairup-guide", title:"RBT Pair-Up Guide", description:"How to pair RBTs with clients for optimal coverage.",
    type:"SOP", category:"sops", status:"Published",
    roles:["scheduling_team","state_director","super_admin"], departments:["Scheduling"], states:[],
    tags:["pairing","scheduling","rbt"], uploadedBy:"Scheduling Team", createdAt:daysAgo(38), updatedAt:daysAgo(4) },

  // ============ BCBA / RBT ============
  { id:"r-bcba-pr", title:"BCBA PR Guide", description:"Best practices for parent-facing communication and progress reviews.",
    type:"DOCX", category:"sops", status:"Published",
    roles:["bcba","qa_team","state_director","super_admin"], departments:["Clinical"], states:[],
    tags:["bcba","pr","communication"], uploadedBy:"Dr. Rivera", createdAt:daysAgo(120), updatedAt:daysAgo(20) },
  { id:"r-parent-comm", title:"Parent Communication Guide", description:"Best practices for communicating progress and updates with families.",
    type:"PDF", category:"communication", status:"Published",
    roles:["rbt","bcba"], departments:["Clinical"], states:[],
    tags:["parent","communication"], uploadedBy:"Clinical", createdAt:daysAgo(70), updatedAt:daysAgo(12) },
  { id:"r-session-workflow", title:"Session Workflow", description:"Step-by-step RBT session workflow from arrival to documentation.",
    type:"Workflow", category:"workflows", status:"Published",
    roles:["rbt","bcba"], departments:["Clinical"], states:[],
    tags:["session","rbt","workflow"], uploadedBy:"Clinical", createdAt:daysAgo(80), updatedAt:daysAgo(8) },
  { id:"r-safety", title:"Safety Resources", description:"Safety protocols, incident response, and escalation paths.",
    type:"PDF", category:"operational", status:"Published",
    roles:["rbt","bcba","qa_team"], departments:["Clinical","QA"], states:[],
    tags:["safety","incident"], uploadedBy:"QA / Compliance", createdAt:daysAgo(160), updatedAt:daysAgo(30) },

  // ============ Recruiting ============
  { id:"r-recruiting-sop", title:"Recruiting SOP", description:"End-to-end hiring workflow for RBTs and BCBAs.",
    type:"SOP", category:"sops", status:"Published",
    roles:["recruiting_team","hr_team","super_admin"], departments:["Recruiting"], states:[],
    tags:["recruiting","hiring"], uploadedBy:"Taylor Brooks", createdAt:daysAgo(80), updatedAt:daysAgo(5) },
  { id:"r-recruit-script", title:"Recruiter Phone Screen Script", description:"Phone screen script with qualifying questions.",
    type:"DOCX", category:"templates", status:"Published",
    roles:["recruiting_team"], departments:["Recruiting"], states:[],
    tags:["recruiting","script"], uploadedBy:"Recruiting", createdAt:daysAgo(75), updatedAt:daysAgo(13) },

  // ============ Auths ============
  { id:"r-auth-renewal", title:"Authorization Renewal Checklist", description:"Steps to renew client authorizations on time.",
    type:"Checklist", category:"workflows", status:"Published",
    roles:["authorization_coordinator","state_director","super_admin"], departments:["Authorizations"], states:[],
    tags:["auth","renewal"], uploadedBy:"Auth Team", createdAt:daysAgo(70), updatedAt:daysAgo(6) },

  // ============ Systems ============
  { id:"r-tango-cr", title:"Central Reach Walkthrough", description:"Tango walkthrough for adding a session in Central Reach.",
    type:"Tango", category:"systems", status:"Published",
    roles:[], departments:[], states:[],
    tags:["central reach","tango"], uploadedBy:"Tech Team", createdAt:daysAgo(50), updatedAt:daysAgo(8), url:"https://app.tango.us" },
  { id:"r-system-logins", title:"Systems & Logins Directory", description:"All Blossom platforms with login URLs and access notes.",
    type:"Link", category:"systems", status:"Published",
    roles:[], departments:[], states:[],
    tags:["systems","logins"], uploadedBy:"IT", createdAt:daysAgo(140), updatedAt:daysAgo(11),
    sensitivity:"admin_only", attachmentStatus:"excluded",
    sourceNote:"Stored in admin-only vault. Not surfaced in the standard Resource Library." },

  // ============ HR (visible only to HR roles) ============
  { id:"r-pto-policy", title:"PTO Policy", description:"Paid time off rules, accruals, and request workflow.",
    type:"PDF", category:"hr", status:"Published",
    roles:[], departments:[], states:[],
    tags:["pto","policy"], uploadedBy:"HR Team", createdAt:daysAgo(200), updatedAt:daysAgo(45) },
  { id:"r-benefits-guide", title:"Benefits Overview", description:"Health, dental, vision, and 401(k) summary.",
    type:"PDF", category:"hr", status:"Published",
    roles:[], departments:[], states:[],
    tags:["benefits","health"], uploadedBy:"HR Team", createdAt:daysAgo(180), updatedAt:daysAgo(60) },
  { id:"r-staff-onboarding", title:"New Employee Onboarding Checklist", description:"Day 1 to Day 30 checklist for every new hire.",
    type:"Checklist", category:"hr", status:"Published",
    roles:[], departments:[], states:[],
    tags:["onboarding","new hire"], uploadedBy:"HR Team", createdAt:daysAgo(100), updatedAt:daysAgo(12) },

  // ============ Leadership ============
  { id:"r-leader-okrs", title:"Quarterly OKR Template", description:"Leadership OKR template for state directors and department leads.",
    type:"Template", category:"leadership", status:"Published",
    roles:["state_director","operations_leadership","executive_leadership","super_admin"], departments:["Leadership"], states:[],
    tags:["okr","planning"], uploadedBy:"Executive", createdAt:daysAgo(35), updatedAt:daysAgo(5) },
  { id:"r-state-playbook", title:"State Operational Playbook", description:"Operational playbook for state-level escalations and staffing.",
    type:"PDF", category:"leadership", status:"Published",
    roles:["state_director","operations_leadership","super_admin"], departments:["Leadership"], states:[],
    tags:["state","playbook","escalation"], uploadedBy:"Operations", createdAt:daysAgo(60), updatedAt:daysAgo(10) },
];

// ============================================================================
// Pass 1 expansion — sanitized shared-folder catalog.
//
// These entries represent the documentation that lives in the shared drive
// (handbooks, SOPs, workflows, templates, payer references, etc.) and the
// canonical State Director SOPs referenced by the Training Academy. Each
// entry is created with `attachmentStatus: "pending_upload"` until the
// actual file or URL is wired up. They render calmly as "Attachment pending"
// in the Resource Library.
//
// Sensitive credential / login / portal-access materials are NOT seeded.
// ============================================================================

const HR_ROLES: OSRole[] = ["hr_team", "operations_leadership", "executive_leadership", "super_admin"];
const LEADERSHIP_ROLES: OSRole[] = ["state_director", "operations_leadership", "executive_leadership", "super_admin"];
const RECRUITING_ROLES: OSRole[] = ["recruiting_team", "hr_team", "operations_leadership", "super_admin"];
const SCHEDULING_ROLES: OSRole[] = ["scheduling_team", "state_director", "operations_leadership", "super_admin"];
const AUTH_ROLES: OSRole[] = ["authorization_coordinator", "state_director", "operations_leadership", "super_admin"];

function pending(
  partial: Omit<Resource, "createdAt" | "updatedAt" | "status" | "attachmentStatus"> &
    Partial<Pick<Resource, "createdAt" | "updatedAt" | "status" | "attachmentStatus">>,
): Resource {
  return {
    status: "Published",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
    attachmentStatus: "pending_upload",
    sensitivity: partial.sensitivity ?? "public_internal",
    sourceNote:
      partial.sourceNote ??
      "Attachment pending — file will be linked once it's added to the Resource Library.",
    ...partial,
  } as Resource;
}

// ---- HR Handbooks & policies ----
const HR_HANDBOOKS: Resource[] = [
  pending({ id: "r-hr-employee-handbook", title: "Employee Handbook", description: "Company-wide handbook covering conduct, expectations, and policies for all employees.",
    type: "PDF", category: "hr", roles: [], departments: ["HR"], states: [],
    tags: ["handbook","hr","policies"], uploadedBy: "HR Team", resourceType: "handbook" }),
  pending({ id: "r-hr-rbt-handbook", title: "RBT Handbook", description: "Handbook for Registered Behavior Technicians — role expectations, session conduct, and growth path.",
    type: "PDF", category: "hr", roles: [], departments: ["HR","Clinical"], states: [],
    tags: ["handbook","rbt"], uploadedBy: "HR Team", resourceType: "handbook" }),
  pending({ id: "r-hr-bcba-handbook", title: "BCBA Handbook", description: "Handbook for BCBAs — supervision, documentation, and clinical leadership expectations.",
    type: "PDF", category: "hr", roles: [], departments: ["HR","Clinical"], states: [],
    tags: ["handbook","bcba"], uploadedBy: "HR Team", resourceType: "handbook" }),
  pending({ id: "r-hr-state-director-handbook", title: "State Director Handbook", description: "Handbook for State Directors — leadership, accountability, and state ownership expectations.",
    type: "PDF", category: "hr", roles: LEADERSHIP_ROLES, departments: ["HR","Leadership"], states: [],
    tags: ["handbook","state director","leadership"], uploadedBy: "HR Team", resourceType: "handbook" }),
  pending({ id: "r-hr-policies-procedures", title: "HR Policies & Procedures", description: "All current HR policies and operational procedures.",
    type: "PDF", category: "hr", roles: [], departments: ["HR"], states: [],
    tags: ["policy","procedures"], uploadedBy: "HR Team", resourceType: "policy" }),
  pending({ id: "r-hr-forms-templates", title: "HR Forms & Templates", description: "Standard HR forms — change requests, acknowledgements, and templates.",
    type: "Template", category: "templates", roles: HR_ROLES, departments: ["HR"], states: [],
    tags: ["forms","templates","hr"], uploadedBy: "HR Team", resourceType: "template" }),
  pending({ id: "r-hr-rbt-cert-pay-guide", title: "RBT Certification & Pay/Wage Guidance", description: "Certification timelines, wage tiers, and growth path for RBTs.",
    type: "PDF", category: "hr", roles: [], departments: ["HR","Clinical"], states: [],
    tags: ["rbt","certification","pay"], uploadedBy: "HR Team", resourceType: "guide" }),
];

// ---- Recruiting ----
const RECRUITING_DOCS: Resource[] = [
  pending({ id: "r-recruiting-workflow", title: "Recruiting Workflow", description: "End-to-end recruiting workflow — sourcing, screening, interview, offer, onboarding.",
    type: "Workflow", category: "workflows", roles: RECRUITING_ROLES, departments: ["Recruiting"], states: [],
    tags: ["recruiting","workflow"], uploadedBy: "Recruiting", resourceType: "workflow" }),
  pending({ id: "r-recruiting-offer-template", title: "Offer Letter Template", description: "Standard offer letter template used by Recruiting.",
    type: "Template", category: "templates", roles: RECRUITING_ROLES, departments: ["Recruiting"], states: [],
    tags: ["offer","template"], uploadedBy: "Recruiting", resourceType: "template" }),
  pending({ id: "r-recruiting-onboarding-checklist", title: "Recruiting Onboarding Checklist", description: "Checklist from accepted offer through Day 30.",
    type: "Checklist", category: "workflows", roles: RECRUITING_ROLES, departments: ["Recruiting","HR"], states: [],
    tags: ["onboarding","checklist"], uploadedBy: "Recruiting", resourceType: "checklist" }),
];

// ---- Scheduling / CentralReach ----
const SCHEDULING_DOCS: Resource[] = [
  pending({ id: "r-scheduling-cr-guide", title: "CentralReach Scheduling Guide", description: "Operational guide for scheduling sessions in CentralReach.",
    type: "PDF", category: "systems", roles: SCHEDULING_ROLES, departments: ["Scheduling"], states: [],
    tags: ["centralreach","scheduling","guide"], uploadedBy: "Scheduling", resourceType: "guide" }),
  pending({ id: "r-scheduling-coverage-sop", title: "Coverage Gap Management SOP", description: "How to detect, escalate, and resolve scheduling coverage gaps.",
    type: "SOP", category: "sops", roles: SCHEDULING_ROLES, departments: ["Scheduling"], states: [],
    tags: ["coverage","scheduling","sop"], uploadedBy: "Scheduling", resourceType: "sop" }),
];

// ---- Authorizations ----
const AUTH_DOCS: Resource[] = [
  pending({ id: "r-auth-utilization-sop", title: "Utilization Management SOP", description: "Operational utilization management — monitoring actual vs. authorized hours.",
    type: "SOP", category: "sops", roles: AUTH_ROLES, departments: ["Authorizations"], states: [],
    tags: ["utilization","authorizations","sop"], uploadedBy: "Auth Team", resourceType: "sop" }),
  pending({ id: "r-auth-payer-reference", title: "Payer Reference Guide", description: "Per-payer reference — auth windows, documentation requirements, common denials.",
    type: "PDF", category: "insurance", roles: AUTH_ROLES, departments: ["Authorizations","Billing"], states: [],
    tags: ["payer","insurance","reference"], uploadedBy: "Auth Team", resourceType: "reference" }),
];

// ---- Intake / VOB / EOB / Leads ----
const INTAKE_DOCS_EXTRA: Resource[] = [
  pending({ id: "r-intake-vob-eob-workflow", title: "Benefits Verification / EOB Workflow", description: "Workflow for benefits verification and reading EOBs for new clients.",
    type: "Workflow", category: "workflows", roles: INTAKE_ROLES, departments: ["Intake","Billing"], states: [],
    tags: ["vob","eob","insurance","workflow"], uploadedBy: "Intake", resourceType: "workflow" }),
  pending({ id: "r-intake-lead-workflow", title: "Lead Lifecycle Workflow", description: "Lead capture through intake conversion.",
    type: "Workflow", category: "workflows", roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["leads","intake","workflow"], uploadedBy: "Intake", resourceType: "workflow" }),
];

// ---- Phone system ----
const PHONE_DOCS: Resource[] = [
  pending({ id: "r-phone-system-guide", title: "Phone System Operational Guide", description: "How to use the phone system — call routing, voicemail, and call notes.",
    type: "PDF", category: "systems", roles: [], departments: ["Operations","Intake"], states: [],
    tags: ["phone","systems","guide"], uploadedBy: "Operations", resourceType: "guide" }),
];

// ---- Training Academy operational SOPs ----
const TRAINING_DOCS: Resource[] = [
  pending({ id: "r-training-academy-sop", title: "Training Academy Operations SOP", description: "How the Training Academy is structured, maintained, and assigned.",
    type: "SOP", category: "training", roles: HR_ROLES, departments: ["HR","Training"], states: [],
    tags: ["training","academy","sop"], uploadedBy: "Training", resourceType: "sop" }),
];

// ---- State Director onboarding / launch readiness ----
const SD_LAUNCH_DOCS: Resource[] = [
  pending({ id: "r-sd-launch-checklist", title: "State Director Launch Readiness Checklist", description: "Pre-launch checklist for new State Directors. Mirrors docs/state-director-training-launch-checklist.md.",
    type: "Checklist", category: "leadership", roles: LEADERSHIP_ROLES, departments: ["Leadership"], states: [],
    tags: ["state director","launch","checklist"], uploadedBy: "Operations", resourceType: "checklist" }),
  pending({ id: "r-sd-onboarding-sop", title: "State Director Onboarding SOP", description: "Full onboarding SOP for new State Directors.",
    type: "SOP", category: "sops", roles: LEADERSHIP_ROLES, departments: ["Leadership","HR"], states: [],
    tags: ["state director","onboarding","sop"], uploadedBy: "Operations", resourceType: "sop" }),
];

// ---- Finance / billing / payroll (safe operational refs only) ----
const FINANCE_DOCS: Resource[] = [
  pending({ id: "r-billing-overview-guide", title: "Billing Operations Overview", description: "High-level overview of the billing operational flow.",
    type: "PDF", category: "operational", roles: ["billing_finance","operations_leadership","super_admin"],
    departments: ["Billing"], states: [], tags: ["billing","overview"], uploadedBy: "Billing", resourceType: "guide" }),
  pending({ id: "r-payroll-overview-guide", title: "Payroll Operations Overview", description: "High-level overview of payroll operational responsibilities. No PII or rates included.",
    type: "PDF", category: "operational", roles: ["payroll_coordinator","hr_team","operations_leadership","super_admin"],
    departments: ["Payroll","HR"], states: [], tags: ["payroll","overview"], uploadedBy: "Payroll", resourceType: "guide" }),
];

// ---- Auto-generate one Resource per canonical State Director SOP ----
const SD_SOP_RESOURCES: Resource[] = (() => {
  const out: Resource[] = [];
  const seen = new Set<string>();
  for (const [weekStr, days] of Object.entries(SD_SOPS_BY_WEEK)) {
    const week = Number(weekStr);
    for (const [dayStr, list] of Object.entries(days)) {
      const day = Number(dayStr);
      for (const sopName of list) {
        if (seen.has(sopName)) continue;
        seen.add(sopName);
        const id = "r-sd-sop-" + sopName
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        out.push(pending({
          id,
          title: sopName,
          description: `Canonical State Director SOP. Referenced by the Training Academy (Week ${week}, Day ${day}). Source-of-truth document — attachment pending.`,
          type: "SOP",
          category: "sops",
          roles: LEADERSHIP_ROLES,
          departments: ["State Director Operations"],
          states: [],
          tags: ["state director","sop","training academy", `week ${week}`],
          uploadedBy: "Operations Leadership",
          resourceType: "sop",
          sourceNote: "Referenced by the State Director Training Academy. Attachment will be linked once the SOP is published.",
        }));
      }
    }
  }
  return out;
})();

resources.push(
  ...HR_HANDBOOKS,
  ...RECRUITING_DOCS,
  ...SCHEDULING_DOCS,
  ...AUTH_DOCS,
  ...INTAKE_DOCS_EXTRA,
  ...PHONE_DOCS,
  ...TRAINING_DOCS,
  ...SD_LAUNCH_DOCS,
  ...FINANCE_DOCS,
  ...SD_SOP_RESOURCES,
);

export const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  SOP: FileText, Workflow: Workflow, Form: ClipboardList, Template: FileType2, Checklist: ClipboardList,
  PDF: FileText, DOCX: FileText, XLSX: FileSpreadsheet, CSV: FileSpreadsheet,
  Video: Play, Link: LinkIcon, Tango: Play, Image: ImageIcon,
};

export const TYPE_TONE: Record<ResourceType, string> = {
  SOP: "bg-purple-50 text-purple-700",
  Workflow: "bg-blue-50 text-blue-700",
  Form: "bg-teal-50 text-teal-700",
  Template: "bg-amber-50 text-amber-700",
  Checklist: "bg-emerald-50 text-emerald-700",
  PDF: "bg-rose-50 text-rose-700",
  DOCX: "bg-sky-50 text-sky-700",
  XLSX: "bg-emerald-50 text-emerald-700",
  CSV: "bg-emerald-50 text-emerald-700",
  Video: "bg-fuchsia-50 text-fuchsia-700",
  Link: "bg-slate-100 text-slate-700",
  Tango: "bg-indigo-50 text-indigo-700",
  Image: "bg-pink-50 text-pink-700",
};

const ROLE_LABEL: Partial<Record<OSRole, string>> = {
  intake_coordinator: "Intake Coordinator",
  authorization_coordinator: "Auth Coordinator",
  scheduling_team: "Scheduling",
  recruiting_team: "Recruiting",
  hr_team: "HR",
  billing_finance: "Billing & Finance",
  qa_team: "QA",
  payroll_coordinator: "Payroll",
  bcba: "BCBA",
  rbt: "RBT",
  state_director: "State Director",
  operations_leadership: "Operations Leadership",
  executive_leadership: "Executive Leadership",
  super_admin: "Super Admin",
  marketing_team: "Marketing",
};
export const roleLabel = (r: OSRole) => ROLE_LABEL[r] ?? r;

/** Role-aware filter: empty roles[] means visible to everyone. */
export function isVisibleToRole(r: Resource, role: OSRole, state?: string): boolean {
  if (r.status !== "Published") return false;
  // Pass 2 — bulk-upload workflow: only `published` (or unset legacy) items
  // appear in the standard Resource Library. Pending/review/vault stay in
  // Resource Management until promoted.
  if (r.uploadStatus && r.uploadStatus !== "published") return false;
  // Hard-exclude vault / credential / login-style resources from the standard library.
  if (r.sensitivity === "excluded" || r.attachmentStatus === "excluded") return false;
  if (r.sensitivity === "admin_only" && role !== "super_admin") return false;
  // Hard safety net — defensive keyword check on title/tags.
  if (containsCredentialKeywords(r.title) || r.tags.some(containsCredentialKeywords)) return false;
  // Executive tier: unconditional read access to the library (mirrors RLS).
  const EXEC_TIER = new Set<string>([
    "executive",
    "executive_leadership",
    "ceo",
    "coo",
    "doo",
    "director_of_operations",
    "super_admin",
  ]);
  if (EXEC_TIER.has(role)) return true;
  // Assistant State Director mirrors State Director resource visibility
  // (state operational SOPs, staffing/scheduling/auth support docs, etc.).
  const mirrored = role === "assistant_state_director" && r.roles.includes("state_director");
  const roleOk =
    r.roles.length === 0 ||
    r.roles.includes(role) ||
    mirrored;
  const stateOk = r.states.length === 0 || (state ? r.states.includes(state) : true);
  return roleOk && stateOk;
}

/** True when a resource has no attachable URL and is awaiting upload. */
export function isAttachmentPending(r: Resource): boolean {
  if (r.attachmentStatus === "pending_upload") return true;
  if (r.attachmentStatus === "available") return false;
  return !r.url && !r.fileUrl;
}

export function visibleResources(role: OSRole, state?: string): Resource[] {
  return resources.filter((r) => isVisibleToRole(r, role, state));
}

export function searchResources(q: string, scope: Resource[] = resources): Resource[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return scope.filter((r) =>
    r.title.toLowerCase().includes(s) ||
    r.description.toLowerCase().includes(s) ||
    r.tags.some((t) => t.toLowerCase().includes(s)) ||
    r.departments.some((d) => d.toLowerCase().includes(s)) ||
    r.category.toLowerCase().includes(s) ||
    r.type.toLowerCase().includes(s)
  );
}

export const categoryById = (id: ResourceCategoryId) =>
  resourceCategories.find((c) => c.id === id)!;

export const resourcesByCategory = (id: ResourceCategoryId, scope: Resource[] = resources) =>
  scope.filter((r) => r.category === id);

export const pinnedFor = (scope: Resource[]) => scope.filter((r) => r.pinned);
export const featuredFor = (scope: Resource[]) => scope.filter((r) => r.featured);
export const recentFor = (scope: Resource[], n = 6) =>
  [...scope].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, n);

export function formatRelative(iso: string) {
  const days = Math.floor((Date.now() - +new Date(iso)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export const aiSamplePrompts = [
  "Find the intake workflow.",
  "Show VOB guides.",
  "Explain the PR process.",
  "Find scheduling templates.",
  "Where is the insurance cheat sheet?",
];

// ============================================================================
// Pass 2 — Bulk upload workflow helpers
// ============================================================================

/** A candidate resource awaiting bulk upload to the Resource Library. */
export interface UploadCandidate {
  /** Local file name (no filesystem path leaks into user-facing UI). */
  fileName: string;
  title: string;
  description: string;
  resourceType: NonNullable<Resource["resourceType"]>;
  category: ResourceCategoryId;
  type: ResourceType;
  roles: OSRole[];
  departments: string[];
  states: string[];
  tags: string[];
  sensitivity: NonNullable<Resource["sensitivity"]>;
  uploadStatus: ResourceUploadStatus;
  /** Free-form note for reviewers (why it's held, what's needed). */
  reviewNote?: string;
}

/** Default role assignments by Resource Library category. */
export const CATEGORY_ROLE_DEFAULTS: Record<ResourceCategoryId, OSRole[]> = {
  hr:            ["hr_team", "operations_leadership", "executive_leadership", "super_admin"],
  leadership:    ["state_director", "operations_leadership", "executive_leadership", "hr_team", "super_admin"],
  insurance:     ["authorization_coordinator", "bcba", "state_director", "operations_leadership", "super_admin"],
  workflows:     ["operations_leadership", "state_director", "super_admin"],
  templates:     ["operations_leadership", "state_director", "super_admin"],
  systems:       ["operations_leadership", "state_director", "super_admin"],
  training:      [],
  sops:          ["operations_leadership", "state_director", "super_admin"],
  communication: [],
  operational:   ["operations_leadership", "state_director", "super_admin"],
};

/** Tag-driven role overrides applied on top of category defaults. */
const TAG_ROLE_RULES: { match: RegExp; roles: OSRole[] }[] = [
  { match: /\brbt\b/i,               roles: ["rbt", "bcba", "state_director", "operations_leadership", "super_admin"] },
  { match: /\bbcba\b/i,              roles: ["bcba", "qa_team", "state_director", "operations_leadership", "super_admin"] },
  { match: /\b(scheduling|centralreach|central reach)\b/i,
                                     roles: ["scheduling_team", "bcba", "state_director", "operations_leadership", "super_admin"] },
  { match: /\b(recruiting|interview|offer letter)\b/i,
                                     roles: ["recruiting_team", "hr_team", "operations_leadership", "super_admin"] },
  { match: /\b(authorization|auth|payer|reauth)\b/i,
                                     roles: ["authorization_coordinator", "bcba", "state_director", "operations_leadership", "super_admin"] },
  { match: /\b(payroll|finance|bonus|billing)\b/i,
                                     roles: ["billing_finance", "payroll_coordinator", "hr_team", "operations_leadership", "executive_leadership", "super_admin"] },
  { match: /\b(state director|leadership|playbook)\b/i,
                                     roles: ["state_director", "operations_leadership", "executive_leadership", "hr_team", "super_admin"] },
  { match: /\b(phone system|retell|call routing)\b/i,
                                     roles: ["intake_coordinator", "scheduling_team", "authorization_coordinator", "recruiting_team", "hr_team", "state_director", "operations_leadership", "super_admin"] },
  { match: /\bhandbook|hr policy|hr policies|hr forms\b/i,
                                     roles: ["hr_team", "operations_leadership", "executive_leadership", "super_admin"] },
];

/** Infer a sensible role assignment from a candidate's category + tags + title. */
export function inferRolesForUpload(input: {
  category: ResourceCategoryId;
  title?: string;
  tags?: string[];
}): OSRole[] {
  const base = new Set<OSRole>(CATEGORY_ROLE_DEFAULTS[input.category] ?? []);
  const haystack = [input.title ?? "", ...(input.tags ?? [])].join(" ").toLowerCase();
  for (const rule of TAG_ROLE_RULES) {
    if (rule.match.test(haystack)) for (const r of rule.roles) base.add(r);
  }
  // Super admin always sees everything via the visibility helper, but include
  // it explicitly so the chips read correctly.
  base.add("super_admin");
  return Array.from(base);
}

/** Decide an initial `uploadStatus` for a freshly added candidate. */
export function classifyUploadCandidate(input: {
  fileName: string;
  title?: string;
  tags?: string[];
  path?: string;
}): { uploadStatus: ResourceUploadStatus; sensitivity: NonNullable<Resource["sensitivity"]>; reason: string } {
  const haystack = [input.fileName, input.title ?? "", input.path ?? "", ...(input.tags ?? [])].join(" ");

  if (/_Sensitive_Not_For_Shared_Context/i.test(haystack)) {
    return { uploadStatus: "excluded", sensitivity: "excluded", reason: "Source marked sensitive — never publish." };
  }
  if (containsCredentialKeywords(haystack)) {
    return { uploadStatus: "vault_only", sensitivity: "admin_only", reason: "Credential / login / vault material — admin vault only." };
  }
  if (containsPrivacyReviewKeywords(haystack)) {
    return { uploadStatus: "privacy_review", sensitivity: "role_restricted", reason: "May contain PHI/PII or a filled-in/personal document." };
  }
  if (/\.heic$|\.pages$|\.numbers$|\.key$/i.test(input.fileName)) {
    return { uploadStatus: "needs_conversion", sensitivity: "public_internal", reason: "File format must be converted before publishing." };
  }
  return { uploadStatus: "ready_to_upload", sensitivity: "public_internal", reason: "Metadata looks safe — ready to publish." };
}

/** Convert a published Resource to an admin-visible `Resource` with `pending_upload`. */
export function candidateToResource(c: UploadCandidate, uploadedBy = "Bulk import"): Resource {
  const now = new Date().toISOString();
  return {
    id: `r-upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: c.title,
    description: c.description || "—",
    type: c.type,
    category: c.category,
    status: c.uploadStatus === "published" ? "Published" : "Draft",
    roles: c.roles,
    departments: c.departments,
    states: c.states,
    tags: c.tags,
    uploadedBy,
    createdAt: now,
    updatedAt: now,
    resourceType: c.resourceType,
    sensitivity: c.sensitivity,
    attachmentStatus: "pending_upload",
    uploadStatus: c.uploadStatus,
    sourceNote: "Pending storage upload — metadata only.",
  };
}

/** Summary counts used by the review queue UI. */
export function summarizeUploadQueue(candidates: UploadCandidate[]) {
  const byStatus = {} as Record<ResourceUploadStatus, number>;
  for (const s of Object.keys(UPLOAD_STATUS_LABEL) as ResourceUploadStatus[]) byStatus[s] = 0;
  for (const c of candidates) byStatus[c.uploadStatus] += 1;
  return byStatus;
}

/**
 * Pass 4 — Duplicate detection.
 *
 * Returns true if the existing catalog already contains a published resource
 * with the same normalized title + category. We intentionally key on
 * (title, category) rather than file name so re-uploads under a different
 * file name are still caught. State/role overlap is checked as a tiebreaker.
 */
export function isDuplicateCandidate(
  candidate: UploadCandidate,
  existing: Resource[],
): boolean {
  if (!candidate || !Array.isArray(existing) || existing.length === 0) return false;
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const t = norm(candidate.title);
  return existing.some((r) => {
    if (!r) return false;
    if ((r.uploadStatus ?? "published") !== "published") return false;
    if (r.category !== candidate.category) return false;
    if (norm(r.title) !== t) return false;
    // Role/state overlap (empty = all)
    const roleOverlap =
      (candidate.roles ?? []).length === 0 ||
      (r.roles ?? []).length === 0 ||
      (candidate.roles ?? []).some((cr) => (r.roles ?? []).includes(cr));
    const stateOverlap =
      (candidate.states ?? []).length === 0 ||
      (r.states ?? []).length === 0 ||
      (candidate.states ?? []).some((cs) => (r.states ?? []).includes(cs));
    return roleOverlap && stateOverlap;
  });
}
