/**
 * Canonical Super Admin navigation.
 *
 * Single source of truth for both AppSidebar and OSShell. Neither consumer
 * should maintain a divergent hard-coded Super Admin menu. If a Super Admin
 * menu change is needed, edit this file — both shells will pick it up.
 *
 * Rules baked into this menu:
 *   - Exactly one visible Reports item (/reports).
 *   - No standalone login-vault or NFC-badge menu items (they live inside
 *     the User Management page).
 *   - No AI menu section.
 *   - No Monday Migration Map. No Make.com as a future dependency.
 *   - /resource-library is the canonical resource route.
 *   - Query-filter shortcuts (e.g. ?stage=approved) are allowed only when
 *     the label makes them clearly different from the base route.
 */
import {
  LayoutDashboard, Users, UserCog, CalendarDays, ClipboardList,
  BarChart3, GraduationCap, Building2, Settings,
  ShieldCheck, Users2, Briefcase, ClipboardCheck, Wallet, TrendingUp,
  Workflow, BookOpen, Megaphone, Inbox, AlertTriangle,
  HeartHandshake, MapPin, UserCheck, Smartphone,
  Stethoscope, PhoneCall, BookUser, Activity, Bug,
  Plug, XCircle, CheckCircle2, ListTodo,
  Phone, FileText, UploadCloud, Sparkles, Mail, IdCard, History,
  type LucideIcon,
} from "lucide-react";

export type SuperAdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** react-router NavLink `end` prop. */
  end?: boolean;
  description?: string;
};

export type SuperAdminNavSection = {
  id: string;
  label: string;
  items: SuperAdminNavItem[];
  defaultCollapsed?: boolean;
};

export const SUPER_ADMIN_MENU: SuperAdminNavSection[] = [
  {
    id: "command_center",
    label: "Command Center",
    items: [
      { label: "Dashboard",       to: "/",                icon: LayoutDashboard, end: true },
      { label: "Command Center",  to: "/command-center",  icon: Workflow },
      { label: "Work Queue",      to: "/work-queue",      icon: ListTodo },
      { label: "Reports",         to: "/reports",         icon: BarChart3 },
    ],
  },
  {
    id: "people_access",
    label: "People & Access",
    defaultCollapsed: true,
    items: [
      { label: "User Management",     to: "/user-management",     icon: Users2 },
      { label: "Role Management",     to: "/role-management",     icon: ShieldCheck },
      { label: "Permissions",         to: "/permissions",         icon: ShieldCheck },
      { label: "Device Inventory",    to: "/device-inventory",    icon: Smartphone },
      { label: "Device Requests",     to: "/device-requests",     icon: Smartphone },
    ],
  },
  {
    id: "training_resources",
    label: "Training & Resources",
    items: [
      { label: "Training Academy",     to: "/academy",             icon: GraduationCap },
      { label: "Training Management",  to: "/hr/training-center",  icon: GraduationCap },
      { label: "Resource Library",     to: "/resource-library",    icon: BookOpen },
    ],
  },
  {
    id: "growth_admissions",
    label: "Growth & Admissions",
    defaultCollapsed: true,
    items: [
      { label: "Marketing Dashboard",              to: "/marketing",                       icon: Megaphone },
      { label: "Business Development",             to: "/business-development",            icon: HeartHandshake },
      { label: "Referral CRM",                     to: "/marketing/referral-crm",          icon: HeartHandshake },
      { label: "Lead Sources",                     to: "/marketing/lead-sources",          icon: TrendingUp },
      { label: "Lead Source Inbox",                to: "/marketing/lead-source-inbox",     icon: Inbox },
      { label: "Campaigns",                        to: "/marketing/campaigns",             icon: Megaphone },
      { label: "CTM / Call Tracking",              to: "/marketing/call-tracking",         icon: Phone },
      { label: "Jotform Submissions",              to: "/marketing/lead-source-inbox?source=jotform", icon: TrendingUp },
      { label: "Facebook Ads",                     to: "/marketing/facebook-ads",          icon: Megaphone },
      { label: "Google Ads",                       to: "/marketing/google-ads",            icon: TrendingUp },
      { label: "Patient Lifetime Journey",         to: "/patient-journey",                 icon: Workflow },
      { label: "Intake Dashboard",                 to: "/intake/dashboard",                icon: Briefcase },
      { label: "Leads",                            to: "/leads",                           icon: TrendingUp },
      { label: "Intake Tasks",                     to: "/intake/tasks",                    icon: ListTodo },
      { label: "Benefits Knowledge (Admin)",       to: "/admin/benefits-knowledge",        icon: ShieldCheck },
      { label: "Intake Templates (Admin)",         to: "/admin/intake-templates",          icon: Mail },
    ],
  },
  {
    id: "clinical_quality",
    label: "Clinical & Quality",
    defaultCollapsed: true,
    items: [
      { label: "Evaluations",              to: "/evaluations",                            icon: ClipboardCheck },
      { label: "QA Dashboard",             to: "/qa",                                     icon: ClipboardCheck },
      { label: "State QA Dashboard",       to: "/ops/qa",                                 icon: ClipboardCheck },
      { label: "BCBA Credentials",         to: "/credentialing/bcba",                     icon: IdCard },
      { label: "Uncredentialed BCBAs",     to: "/credentialing/uncredentialed-bcbas",     icon: AlertTriangle },
      { label: "Credentialing Dashboard",  to: "/credentialing",                          icon: Stethoscope },
      { label: "Provider Credentialing",   to: "/credentialing/providers",                icon: Stethoscope },
      { label: "Insurance Credentialing",  to: "/credentialing/insurance",                icon: Building2 },
      { label: "Expiring Credentials",     to: "/credentialing/expiring",                 icon: CalendarDays },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    defaultCollapsed: true,
    items: [
      { label: "State Operations",             to: "/state-operations",                   icon: MapPin },
      { label: "Clients",                      to: "/clients",                            icon: Users },
      { label: "Authorizations",               to: "/authorizations",                        icon: ShieldCheck },
      { label: "Awaiting Submission",          to: "/authorizations?stage=awaiting",         icon: ShieldCheck },
      { label: "Submitted Authorizations",     to: "/authorizations?stage=submitted",        icon: UploadCloud },
      { label: "In QA Review",                 to: "/authorizations?stage=qa",               icon: ShieldCheck },
      { label: "Missing Documentation",        to: "/authorizations?stage=missing",          icon: ShieldCheck },
      { label: "Expiring Soon",                to: "/authorizations?stage=expiring",         icon: ShieldCheck },
      { label: "Initial Authorizations",       to: "/authorizations?stage=initial",          icon: ShieldCheck },
      { label: "Treatment Authorizations",     to: "/authorizations?stage=treatment",        icon: ShieldCheck },
      { label: "Reassessments / Renewals",     to: "/authorizations?stage=reassessment",     icon: ShieldCheck },
      { label: "Approved Authorizations",      to: "/authorizations?stage=approved",         icon: CheckCircle2 },
      { label: "Denials",                      to: "/authorizations?stage=denied",           icon: XCircle },
      { label: "Flaked Clients",               to: "/authorizations?stage=flaked",           icon: XCircle },
      { label: "Scheduling",                   to: "/scheduling",                         icon: CalendarDays },
      { label: "State Scheduling",             to: "/ops/scheduling",                     icon: CalendarDays },
      { label: "Scheduling Board",             to: "/scheduling/board",                   icon: CalendarDays },
      { label: "Staffing",                     to: "/ops/staffing",                       icon: Users },
      { label: "Family Staffing Preferences",  to: "/ops/staffing?tab=preferences",       icon: HeartHandshake },
      { label: "Case Management",              to: "/ops/case-management",                icon: HeartHandshake },
      { label: "No OON Benefits",              to: "/ops/no-oon-benefits",                icon: ShieldCheck },
      { label: "State Escalations",            to: "/ops/state-escalations",              icon: AlertTriangle },
      { label: "Operational Tasks",            to: "/ops/tasks",                          icon: ListTodo },
      { label: "Escalation Center",            to: "/work-queue/escalations",             icon: Sparkles },
    ],
  },
  {
    id: "recruiting",
    label: "Recruiting",
    defaultCollapsed: true,
    items: [
      { label: "Recruiting Workspace", to: "/recruiting/workspace",      icon: Briefcase },
      { label: "Pipeline",             to: "/recruiting/pipeline",       icon: TrendingUp },
      { label: "Interviews",           to: "/recruiting/interviews",     icon: CalendarDays },
      { label: "Offers",               to: "/recruiting/offers",         icon: ClipboardCheck },
      { label: "Background Checks",    to: "/recruiting/background",     icon: ShieldCheck },
      { label: "Orientation",          to: "/recruiting/orientation",    icon: Users2 },
      { label: "Onboarding",           to: "/recruiting/onboarding",     icon: UserCheck },
      { label: "Staffing Needs",       to: "/recruiting/staffing-needs", icon: AlertTriangle },
      { label: "Follow-ups",           to: "/recruiting/follow-ups",     icon: Inbox },
      { label: "Escalations",          to: "/recruiting/escalations",    icon: AlertTriangle },
    ],
  },
  {
    id: "rcm_benefits",
    label: "RCM & Benefits",
    defaultCollapsed: true,
    items: [
      { label: "Billing & Finance",         to: "/billing-finance",                icon: IdCard },
      { label: "Revenue",                   to: "/revenue",                        icon: TrendingUp },
      { label: "Payroll Benefits",          to: "/payroll/benefits",               icon: Wallet },
    ],
  },
  {
    id: "hr_finance",
    label: "HR & Finance",
    defaultCollapsed: true,
    items: [
      { label: "HR Dashboard",       to: "/hr/dashboard",         icon: HeartHandshake },
      { label: "Employee Records",   to: "/hr/employee-records",  icon: Users },
      { label: "HR Requests",        to: "/hr/requests",          icon: ClipboardList },
      { label: "Compliance Items",   to: "/hr/compliance-items",  icon: ShieldCheck },
      { label: "Payroll",            to: "/payroll/workspace",    icon: Wallet },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    defaultCollapsed: true,
    items: [
      { label: "Phone System",         to: "/phone",                            icon: Phone, end: true },
      { label: "Call Logs",            to: "/communications/call-logs",         icon: PhoneCall },
      { label: "Shared Lines",         to: "/phone/shared",                     icon: Phone },
      { label: "Phone Requests",       to: "/communications/phone-requests",    icon: ClipboardList },
      { label: "Directory",            to: "/communications/directory",         icon: BookUser },
      { label: "After-Hours Calls",    to: "/phone/ai-calls",                   icon: PhoneCall, end: true },
      { label: "Call Email Audit",     to: "/phone/ai-calls/audit",             icon: FileText },
      { label: "User Activity Log",    to: "/communications/user-activity",     icon: Activity },
      { label: "Patient Activity Log", to: "/communications/patient-activity",  icon: HeartHandshake },
      { label: "Activity Center",      to: "/communications/activity-center",   icon: Activity },
    ],
  },
  {
    id: "system_tools",
    label: "System Tools",
    defaultCollapsed: true,
    items: [
      { label: "Integrations",              to: "/admin/integrations",                 icon: Plug },
      { label: "Integrations · Readiness",  to: "/admin/integrations/readiness",       icon: Plug },
      { label: "CTM Operations",            to: "/admin/ctm",                          icon: Phone },
      { label: "Email Command Center",      to: "/system/email-command-center",        icon: Mail },
      { label: "Automated Emails",          to: "/admin/automated-emails",             icon: Mail },
      { label: "CentralReach Uploads",      to: "/system/centralreach-uploads",        icon: UploadCloud },
      { label: "Workflow Inventory",        to: "/system/workflow-inventory",          icon: Workflow },
      { label: "Request Intake",            to: "/system/request-intake",              icon: Inbox },
      { label: "Issue Tracker",             to: "/system/issue-tracker",               icon: Bug },
      { label: "Audit Log Viewer",          to: "/system/audit-log",                   icon: History },
      { label: "System Settings",           to: "/settings",                           icon: Settings },
    ],
  },
];

/** Total visible menu item count (integrity check for tests). */
export const SUPER_ADMIN_MENU_ITEM_COUNT = SUPER_ADMIN_MENU.reduce(
  (n, s) => n + s.items.length,
  0,
);

/** Flat list of visible paths (deduped, order preserved). */
export function superAdminMenuPaths(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of SUPER_ADMIN_MENU) {
    for (const it of s.items) {
      if (seen.has(it.to)) continue;
      seen.add(it.to);
      out.push(it.to);
    }
  }
  return out;
}

// Suppress unused-import lint for icons re-exported for AppSidebar's convenience.
void UserCog;