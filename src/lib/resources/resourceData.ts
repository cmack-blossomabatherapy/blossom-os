import {
  FileText, Workflow, ClipboardList, FileSpreadsheet, ShieldCheck, Users,
  GraduationCap, Cpu, UserPlus, CalendarClock, FileCheck2, BadgeCheck,
  Banknote, Crown, MessageSquare, Link as LinkIcon, Play, Image as ImageIcon,
  FileType2, BookOpen, type LucideIcon,
} from "lucide-react";
import type { OSRole } from "@/lib/os/permissions";

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
    title: "VOB Decision Guide",
    description: "Step-by-step guide for verifying benefits and decisioning new referrals.",
    type: "SOP", category: "insurance", status: "Published",
    roles: INTAKE_ROLES, departments: ["Intake"], states: [],
    tags: ["vob","benefits","verification"], uploadedBy: "Alex Chen",
    createdAt: daysAgo(60), updatedAt: daysAgo(7), pinned: true, featured: true,
  },
  {
    id: "r-missing-info-checklist",
    title: "Missing Information Checklist",
    description: "Checklist for following up on incomplete intake submissions.",
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
    title: "Ask Blossom AI Quick Guide",
    description: "How to use Ask Blossom AI in your daily workflow.",
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
  // Hard-exclude vault / credential / login-style resources from the standard library.
  if (r.sensitivity === "excluded" || r.attachmentStatus === "excluded") return false;
  if (r.sensitivity === "admin_only" && role !== "super_admin") return false;
  const roleOk = r.roles.length === 0 || r.roles.includes(role) || role === "super_admin";
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
