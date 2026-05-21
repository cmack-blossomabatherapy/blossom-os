import {
  FileText, Workflow, ClipboardList, FileSpreadsheet, ShieldCheck, Users,
  GraduationCap, Cpu, UserPlus, CalendarClock, FileCheck2, BadgeCheck,
  Banknote, Crown, Link as LinkIcon, Play, Image as ImageIcon, FileType2,
  type LucideIcon,
} from "lucide-react";

export type ResourceType =
  | "SOP" | "Workflow" | "Form" | "Template" | "PDF" | "DOCX" | "XLSX"
  | "CSV" | "Video" | "Link" | "Tango" | "Image";

export type ResourceCategoryId =
  | "sops" | "workflows" | "forms" | "templates" | "insurance" | "hr"
  | "training" | "systems" | "recruiting" | "scheduling" | "authorizations"
  | "qa" | "billing" | "leadership";

export interface ResourceCategory {
  id: ResourceCategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: "purple" | "blue" | "teal" | "amber" | "rose" | "emerald" | "slate";
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategoryId;
  department?: string;
  tags: string[];
  uploadedBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  url?: string;
  featured?: boolean;
  pinned?: boolean;
}

export const resourceCategories: ResourceCategory[] = [
  { id: "sops",          name: "SOPs",                description: "Standard operating procedures by department.", icon: FileText,       tone: "purple" },
  { id: "workflows",     name: "Workflows",           description: "End-to-end operational processes.",            icon: Workflow,       tone: "blue"   },
  { id: "forms",         name: "Forms",               description: "Internal and client-facing forms.",            icon: ClipboardList,  tone: "teal"   },
  { id: "templates",     name: "Templates",           description: "Document, email and message templates.",       icon: FileType2,      tone: "amber"  },
  { id: "insurance",     name: "Insurance Resources", description: "Payer guides, VOB tools, coverage sheets.",    icon: ShieldCheck,    tone: "emerald"},
  { id: "hr",            name: "HR Resources",        description: "Policies, benefits, onboarding documents.",    icon: Users,          tone: "rose"   },
  { id: "training",      name: "Training Materials",  description: "Quick guides and academy resources.",          icon: GraduationCap,  tone: "purple" },
  { id: "systems",       name: "Systems & Software",  description: "Tools, logins, and platform references.",      icon: Cpu,            tone: "slate"  },
  { id: "recruiting",    name: "Recruiting",          description: "Hiring playbooks, scripts, and templates.",    icon: UserPlus,       tone: "blue"   },
  { id: "scheduling",    name: "Scheduling",          description: "Scheduling workflows and availability docs.",  icon: CalendarClock,  tone: "teal"   },
  { id: "authorizations",name: "Authorizations",      description: "Auth tracking, renewals, and checklists.",     icon: FileCheck2,     tone: "amber"  },
  { id: "qa",            name: "QA & Compliance",     description: "Audits, compliance docs, QA standards.",       icon: BadgeCheck,     tone: "emerald"},
  { id: "billing",       name: "Billing & Finance",   description: "Billing workflows, codes, and finance docs.",  icon: Banknote,       tone: "slate"  },
  { id: "leadership",    name: "Leadership",          description: "Strategy, leadership memos, planning docs.",   icon: Crown,          tone: "rose"   },
];

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

export const resources: Resource[] = [
  { id: "r-insurance-cheat", title: "Insurance Cheat Sheet", description: "Quick reference for payer rules, copays, and authorization windows.", type: "PDF", category: "insurance", department: "Intake", tags: ["insurance","payer","vob","cheatsheet"], uploadedBy: "Maria Lopez", createdAt: daysAgo(45), updatedAt: daysAgo(3), featured: true, pinned: true },
  { id: "r-vob-guide", title: "VOB Decision Guide", description: "Step-by-step guide for verifying benefits and decisioning new referrals.", type: "SOP", category: "insurance", department: "Intake", tags: ["vob","benefits","verification"], uploadedBy: "Alex Chen", createdAt: daysAgo(60), updatedAt: daysAgo(7), featured: true },
  { id: "r-intake-sop", title: "Intake SOP", description: "Full intake workflow from lead to active client.", type: "SOP", category: "sops", department: "Intake", tags: ["intake","onboarding","lead"], uploadedBy: "Jordan Pierce", createdAt: daysAgo(90), updatedAt: daysAgo(10), featured: true, pinned: true },
  { id: "r-scheduling-flow", title: "Scheduling Workflow", description: "How to build a balanced weekly schedule across BCBAs and RBTs.", type: "Workflow", category: "scheduling", department: "Scheduling", tags: ["scheduling","availability","weekly"], uploadedBy: "Priya Patel", createdAt: daysAgo(40), updatedAt: daysAgo(2), featured: true },
  { id: "r-bcba-pr", title: "BCBA PR Guide", description: "Best practices for parent-facing communication and progress reviews.", type: "DOCX", category: "qa", department: "Clinical", tags: ["bcba","communication","parent"], uploadedBy: "Dr. Rivera", createdAt: daysAgo(120), updatedAt: daysAgo(20), featured: true },
  { id: "r-recruiting-sop", title: "Recruiting SOP", description: "End-to-end hiring workflow for RBTs and BCBAs.", type: "SOP", category: "recruiting", department: "Recruiting", tags: ["recruiting","hiring","sop"], uploadedBy: "Taylor Brooks", createdAt: daysAgo(80), updatedAt: daysAgo(5), featured: true },
  { id: "r-academy-quickstart", title: "Training Academy Quick Start", description: "New employee guide to Blossom's Training Academy.", type: "Link", category: "training", tags: ["training","onboarding","academy"], uploadedBy: "HR Team", createdAt: daysAgo(30), updatedAt: daysAgo(1), url: "/training", featured: true, pinned: true },

  { id: "r-pto-policy", title: "PTO Policy", description: "Paid time off rules, accruals, and request workflow.", type: "PDF", category: "hr", tags: ["pto","policy","benefits"], uploadedBy: "HR Team", createdAt: daysAgo(200), updatedAt: daysAgo(45) },
  { id: "r-benefits-guide", title: "Benefits Overview", description: "Health, dental, vision, and 401(k) summary.", type: "PDF", category: "hr", tags: ["benefits","health","401k"], uploadedBy: "HR Team", createdAt: daysAgo(180), updatedAt: daysAgo(60) },
  { id: "r-staff-onboarding", title: "New Employee Onboarding Checklist", description: "Day 1 to Day 30 checklist for every new hire.", type: "Template", category: "hr", tags: ["onboarding","checklist","new hire"], uploadedBy: "HR Team", createdAt: daysAgo(100), updatedAt: daysAgo(12) },

  { id: "r-auth-renewal", title: "Authorization Renewal Checklist", description: "Steps to renew client authorizations on time.", type: "Form", category: "authorizations", tags: ["auth","renewal","checklist"], uploadedBy: "Auth Team", createdAt: daysAgo(70), updatedAt: daysAgo(6) },
  { id: "r-tx-auth-template", title: "TX Authorization Request Template", description: "Standard template for submitting treatment authorization requests.", type: "Template", category: "authorizations", tags: ["auth","template","treatment"], uploadedBy: "Auth Team", createdAt: daysAgo(110), updatedAt: daysAgo(18) },

  { id: "r-qa-audit", title: "QA Session Audit Checklist", description: "Standard checklist for auditing BCBA and RBT sessions.", type: "Form", category: "qa", tags: ["qa","audit","session"], uploadedBy: "QA Team", createdAt: daysAgo(60), updatedAt: daysAgo(9) },
  { id: "r-compliance-2026", title: "2026 Compliance Updates", description: "Summary of regulatory changes and required actions.", type: "PDF", category: "qa", tags: ["compliance","regulatory","2026"], uploadedBy: "Compliance", createdAt: daysAgo(15), updatedAt: daysAgo(4) },

  { id: "r-billing-codes", title: "Billing Codes Reference", description: "Common ABA billing codes with modifiers and rates.", type: "XLSX", category: "billing", tags: ["billing","codes","cpt"], uploadedBy: "Finance", createdAt: daysAgo(150), updatedAt: daysAgo(30) },
  { id: "r-payroll-cycle", title: "Payroll Cycle SOP", description: "Bi-weekly payroll close, approvals, and submission steps.", type: "SOP", category: "billing", tags: ["payroll","sop","finance"], uploadedBy: "Finance", createdAt: daysAgo(95), updatedAt: daysAgo(14) },

  { id: "r-tango-cr", title: "Central Reach Walkthrough", description: "Tango walkthrough for adding a session in Central Reach.", type: "Tango", category: "systems", tags: ["central reach","tango","walkthrough"], uploadedBy: "Tech Team", createdAt: daysAgo(50), updatedAt: daysAgo(8), url: "https://app.tango.us" },
  { id: "r-system-logins", title: "Systems & Logins Directory", description: "All Blossom platforms with login URLs and access notes.", type: "Link", category: "systems", tags: ["systems","logins","tools"], uploadedBy: "IT", createdAt: daysAgo(140), updatedAt: daysAgo(11), url: "#" },

  { id: "r-recruit-script", title: "Recruiter Phone Screen Script", description: "Phone screen script with qualifying questions.", type: "DOCX", category: "recruiting", tags: ["recruiting","script","interview"], uploadedBy: "Recruiting", createdAt: daysAgo(75), updatedAt: daysAgo(13) },
  { id: "r-recruit-job-template", title: "Job Description Template", description: "Standard JD template for RBT and BCBA roles.", type: "Template", category: "recruiting", tags: ["jd","template","hiring"], uploadedBy: "Recruiting", createdAt: daysAgo(85), updatedAt: daysAgo(22) },

  { id: "r-leader-okrs", title: "Quarterly OKR Template", description: "Leadership OKR template for state directors and department leads.", type: "Template", category: "leadership", tags: ["okr","planning","leadership"], uploadedBy: "Executive", createdAt: daysAgo(35), updatedAt: daysAgo(5) },
  { id: "r-leader-state-review", title: "State Performance Review Doc", description: "Monthly state performance review framework.", type: "DOCX", category: "leadership", tags: ["state","review","performance"], uploadedBy: "Executive", createdAt: daysAgo(25), updatedAt: daysAgo(2) },

  { id: "r-form-incident", title: "Incident Report Form", description: "Required form for documenting client and staff incidents.", type: "Form", category: "forms", tags: ["incident","form","compliance"], uploadedBy: "QA Team", createdAt: daysAgo(160), updatedAt: daysAgo(40) },
  { id: "r-form-pto", title: "PTO Request Form", description: "Submit time-off requests through this form.", type: "Form", category: "forms", tags: ["pto","form","hr"], uploadedBy: "HR Team", createdAt: daysAgo(170), updatedAt: daysAgo(50) },

  { id: "r-email-welcome", title: "Welcome Email Template", description: "Send to new clients after intake completion.", type: "Template", category: "templates", tags: ["email","welcome","intake"], uploadedBy: "Intake", createdAt: daysAgo(55), updatedAt: daysAgo(9) },
  { id: "r-video-intake", title: "Intake Walkthrough Video", description: "Video tour of the intake module for new coordinators.", type: "Video", category: "training", tags: ["video","intake","training"], uploadedBy: "Training", createdAt: daysAgo(20), updatedAt: daysAgo(3) },
];

export const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  SOP: FileText, Workflow: Workflow, Form: ClipboardList, Template: FileType2,
  PDF: FileText, DOCX: FileText, XLSX: FileSpreadsheet, CSV: FileSpreadsheet,
  Video: Play, Link: LinkIcon, Tango: Play, Image: ImageIcon,
};

export const TYPE_TONE: Record<ResourceType, string> = {
  SOP: "bg-purple-50 text-purple-700",
  Workflow: "bg-blue-50 text-blue-700",
  Form: "bg-teal-50 text-teal-700",
  Template: "bg-amber-50 text-amber-700",
  PDF: "bg-rose-50 text-rose-700",
  DOCX: "bg-sky-50 text-sky-700",
  XLSX: "bg-emerald-50 text-emerald-700",
  CSV: "bg-emerald-50 text-emerald-700",
  Video: "bg-fuchsia-50 text-fuchsia-700",
  Link: "bg-slate-100 text-slate-700",
  Tango: "bg-indigo-50 text-indigo-700",
  Image: "bg-pink-50 text-pink-700",
};

export function searchResources(q: string): Resource[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return resources.filter((r) =>
    r.title.toLowerCase().includes(s) ||
    r.description.toLowerCase().includes(s) ||
    r.tags.some((t) => t.toLowerCase().includes(s)) ||
    (r.department?.toLowerCase().includes(s) ?? false) ||
    r.category.toLowerCase().includes(s) ||
    r.type.toLowerCase().includes(s)
  );
}

export function categoryById(id: ResourceCategoryId) {
  return resourceCategories.find((c) => c.id === id)!;
}

export function resourcesByCategory(id: ResourceCategoryId) {
  return resources.filter((r) => r.category === id);
}

export function featuredResources() {
  return resources.filter((r) => r.featured);
}

export function recentResources(n = 6) {
  return [...resources].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, n);
}

export function pinnedResources() {
  return resources.filter((r) => r.pinned);
}

export function formatRelative(iso: string) {
  const days = Math.floor((Date.now() - +new Date(iso)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export const quickLinks: { label: string; to: string; description: string }[] = [
  { label: "Training Academy",       to: "/training",        description: "Courses & SOPs" },
  { label: "Insurance Guides",       to: "/sop?cat=insurance", description: "Payers & VOB" },
  { label: "HR Forms",               to: "/sop?cat=forms",    description: "PTO, benefits, policies" },
  { label: "IT Resources",           to: "/sop?cat=systems",  description: "Logins & platforms" },
  { label: "New Employee Resources", to: "/sop?cat=hr",       description: "Onboarding kit" },
  { label: "Calendars",              to: "/calendar",         description: "Team & client calendars" },
  { label: "Department Resources",   to: "/sop",              description: "Browse by department" },
];

export const aiSamplePrompts = [
  "Find the scheduling SOP.",
  "Show insurance resources.",
  "What's the VOB process?",
  "Find PR training.",
];