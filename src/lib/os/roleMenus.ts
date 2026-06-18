import {
  GraduationCap, BookOpen, FileText, Phone, ClipboardCheck,
  Megaphone, BarChart3, Search as SearchIcon, PhoneCall,
  HeartHandshake, Users, MessageSquare, Star, TrendingUp, Briefcase,
  Building2, ShieldCheck, Wrench, IdCard,
  Calendar, FileSignature, ClipboardList, UserCheck,
  LayoutDashboard, AlertTriangle, MapPin, Stethoscope, CheckCircle2,
  XCircle, Gauge, LineChart, Activity, Inbox, type LucideIcon,
} from "lucide-react";
import type { OSRole } from "./permissions";

export interface RoleMenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface RoleMenuSection {
  id: string;
  label: string;
  items: RoleMenuItem[];
  /** Collapsed by default in the OS shell. */
  defaultCollapsed?: boolean;
}

/**
 * Role menu definition.
 *
 * `ROLE_MENUS` describes the TARGET / future operating menu for each role
 * — the Blossom OS each role will eventually use day-to-day. It is the
 * shape of the product, not the live availability map.
 *
 * Staged availability is enforced separately by `OSShell` using
 * `STAGED_ROLE_LIVE_PATHS`:
 *   - Super Admin: full navigation, nothing gated.
 *   - All other roles: only Training Academy (/academy or /training for
 *     State Director + Assistant State Director), Resource Library, and
 *     Reports are clickable. Every other menu item is shown but rendered
 *     as an inert "Soon" entry until that surface is ready for users.
 *
 * Rules for editing this file:
 *   - Do NOT delete future modules just because they are not live yet.
 *     The staged "Soon" treatment is intentional.
 *   - Do NOT route menu items at `/coming-soon` paths.
 *   - New live modules become clickable for non-super-admin roles by
 *     adding their base path to `STAGED_ROLE_LIVE_PATHS` in OSShell,
 *     not by removing them from here.
 */
export interface RoleMenu {
  sections: RoleMenuSection[];
}

/** Training + Resources + Reports — appended to every non–super-admin menu. */
const TRAINING_AND_RESOURCES: RoleMenuSection = {
  id: "training_resources",
  label: "Training & Resources",
  items: [
    { label: "Training Academy", path: "/academy",          icon: GraduationCap },
    { label: "Resource Library", path: "/resource-library", icon: BookOpen },
    { label: "Reports",          path: "/reports",          icon: FileText },
  ],
};

/**
 * State Director + Assistant State Director get the live State Director
 * journey at /training, not the generic Academy landing.
 */
const STATE_TRAINING_AND_RESOURCES: RoleMenuSection = {
  id: "training_resources",
  label: "Training & Resources",
  items: [
    { label: "Training Academy", path: "/training",         icon: GraduationCap },
    { label: "Resource Library", path: "/resource-library", icon: BookOpen },
    { label: "Reports",          path: "/reports",          icon: FileText },
  ],
};

const DASHBOARD_ITEM: RoleMenuItem = {
  label: "My Dashboard", path: "/dashboard", icon: LayoutDashboard,
};

/**
 * Every role menu is a list of grouped sections. Every item routes to a real,
 * mounted page in the OS shell — no Coming Soon entries, no /coming-soon paths.
 */
export const ROLE_MENUS: Partial<Record<OSRole, RoleMenu>> = {

  /* --------------------------- Executive Leadership --------------------------- */
  executive_leadership: {
    sections: [
      {
        id: "leadership", label: "Leadership", items: [
          DASHBOARD_ITEM,
          { label: "Executive Dashboard",   path: "/executive",                    icon: BarChart3 },
          { label: "Company KPIs",          path: "/reports",                      icon: Gauge },
          { label: "State Health Overview", path: "/state-operations",             icon: MapPin },
          { label: "Growth Snapshot",       path: "/marketing/state-growth",       icon: TrendingUp },
          { label: "Operations Scorecard",  path: "/operations/command-center",    icon: Gauge },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* -------------------------- Operations Leadership -------------------------- */
  operations_leadership: {
    sections: [
      {
        id: "ops_command", label: "Operations Command", items: [
          DASHBOARD_ITEM,
          { label: "Operations Dashboard",  path: "/operations/command-center",  icon: BarChart3 },
          { label: "Department Scorecards", path: "/operations/department-health", icon: Gauge },
          { label: "State Health Overview", path: "/state-operations",            icon: MapPin },
          { label: "Escalations",           path: "/operations/escalations",      icon: AlertTriangle },
          { label: "Workflow Bottlenecks",  path: "/operations/workflow-risks",   icon: ShieldCheck },
          { label: "System Requests",       path: "/system/request-intake",       icon: Inbox },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ----------------------------- State Director ------------------------------ */
  state_director: {
    sections: [
      {
        id: "state_ops", label: "State Operations", items: [
          DASHBOARD_ITEM,
          { label: "State Dashboard",                path: "/state-operations",       icon: MapPin },
          { label: "State Health",                   path: "/state-operations",       icon: Activity },
          { label: "Escalations",                    path: "/ops/state-escalations",  icon: AlertTriangle },
          { label: "State Staffing Snapshot",        path: "/ops/staffing",           icon: Users },
          { label: "State Intake Snapshot",          path: "/intake/dashboard",       icon: Briefcase },
          { label: "State Authorization Snapshot",   path: "/ops/authorizations",     icon: ShieldCheck },
          { label: "State Clinical Snapshot",        path: "/qa",                     icon: Stethoscope },
        ],
      },
      STATE_TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------ Assistant State Director ------------------------- */
  assistant_state_director: {
    sections: [
      {
        id: "state_support", label: "State Support", items: [
          DASHBOARD_ITEM,
          { label: "State Support Dashboard", path: "/state-operations",       icon: LayoutDashboard },
          { label: "State Intake Support",    path: "/intake/dashboard",       icon: Briefcase },
          { label: "State Task Queue",        path: "/ops/tasks",              icon: ClipboardList },
          { label: "Escalation Support",      path: "/ops/state-escalations",  icon: AlertTriangle },
          { label: "Follow-Up Tracker",       path: "/ops/tasks",              icon: Activity },
        ],
      },
      STATE_TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------------ Marketing Team ----------------------------- */
  marketing_team: {
    sections: [
      {
        id: "growth_marketing", label: "Growth & Marketing", items: [
          DASHBOARD_ITEM,
          { label: "Marketing Dashboard",      path: "/marketing",                  icon: BarChart3 },
          { label: "Referral CRM",             path: "/marketing/referral-crm",     icon: HeartHandshake },
          { label: "Lead Sources",             path: "/marketing/lead-sources",     icon: TrendingUp },
          { label: "Campaigns",                path: "/marketing/campaigns",        icon: Megaphone },
          { label: "CTM / Call Tracking",      path: "/marketing/call-tracking",    icon: PhoneCall },
          { label: "LeadTrap",                 path: "/marketing/leadtrap",         icon: TrendingUp },
          { label: "Facebook Ads",             path: "/marketing/facebook-ads",     icon: Megaphone },
          { label: "Google Ads",               path: "/marketing/google-ads",       icon: TrendingUp },
          { label: "Patient Lifetime Journey", path: "/patient-journey",            icon: HeartHandshake },
          { label: "SEO & Content",            path: "/marketing/seo",              icon: SearchIcon },
          { label: "Web Analytics",            path: "/marketing/web-analytics",    icon: LineChart },
          { label: "Recruiting Marketing",     path: "/marketing/recruiting",       icon: Briefcase },
          { label: "Community Outreach",       path: "/marketing/outreach",         icon: Users },
          { label: "Reputation",               path: "/marketing/reputation",       icon: Star },
          { label: "Attribution & ROI",        path: "/marketing/attribution",      icon: Gauge },
          { label: "Phone System",             path: "/phone",                      icon: Phone },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------------- Business Development -------------------------- */
  business_development: {
    sections: [
      {
        id: "biz_dev", label: "Business Development", items: [
          DASHBOARD_ITEM,
          { label: "Business Development Dashboard", path: "/business-development",                    icon: HeartHandshake },
          { label: "Referral Partner CRM",           path: "/business-development?tab=partners",       icon: HeartHandshake },
          { label: "Outreach Pipeline",              path: "/business-development?tab=outreach",       icon: MessageSquare },
          { label: "Follow-Up Tasks",                path: "/business-development?tab=tasks",          icon: ClipboardList },
          { label: "Provider Relationships",         path: "/business-development?tab=providers",      icon: Briefcase },
          { label: "Community Relationships",        path: "/business-development?tab=community",      icon: Users },
          { label: "Patient Lifetime Journey",       path: "/patient-journey",                         icon: HeartHandshake },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* -------------------------------- Intake Team ------------------------------ */
  intake_coordinator: {
    sections: [
      {
        id: "intake", label: "Intake", items: [
          { label: "Intake Dashboard",           path: "/intake/dashboard",              icon: LayoutDashboard },
          { label: "New Referral Queue",         path: "/intake/referral-queue",         icon: ClipboardList },
          { label: "Lead To Active Pipeline",    path: "/intake/lead-to-active",         icon: TrendingUp },
          { label: "Missing Information",        path: "/intake/missing-information",    icon: ShieldCheck },
          { label: "Parent Communication",       path: "/intake/parent-communication",   icon: MessageSquare },
          { label: "Intake Tasks",               path: "/intake/tasks",                  icon: ClipboardList },
          { label: "Lead Benefits Cheat Sheets", path: "/intake/benefits-cheat-sheets",  icon: ShieldCheck },
          { label: "Patient Lifetime Journey",   path: "/patient-journey",               icon: HeartHandshake },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------------ Recruiting Team ---------------------------- */
  recruiting_team: {
    sections: [
      {
        id: "recruiting", label: "Recruiting", items: [
          DASHBOARD_ITEM,
          { label: "Recruiting Dashboard",  path: "/recruiting/workspace",   icon: LayoutDashboard },
          { label: "Candidate Pipeline",    path: "/recruiting/pipeline",    icon: Briefcase },
          { label: "Hiring Sources",        path: "/recruiting/performance", icon: TrendingUp },
          { label: "Interview Scheduling",  path: "/recruiting/interviews",  icon: Calendar },
          { label: "Offer Tracker",         path: "/recruiting/offers",      icon: FileSignature },
          { label: "Onboarding Handoff",    path: "/recruiting/onboarding",  icon: HeartHandshake },
          { label: "Recruiting Reports",    path: "/reports",                icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ----------------------------- Authorizations ------------------------------ */
  authorization_coordinator: {
    sections: [
      {
        id: "authorizations", label: "Authorizations", items: [
          { label: "Authorizations Dashboard",  path: "/authorizations",                  icon: LayoutDashboard },
          { label: "Auth Queue",                path: "/auth-workspace",                  icon: ShieldCheck },
          { label: "Approved Authorizations",   path: "/ops/approved-authorizations",     icon: CheckCircle2 },
          { label: "Expiring Authorizations",   path: "/ops/expiring-authorizations",     icon: Calendar },
          { label: "Denials",                   path: "/ops/denials",                     icon: XCircle },
          { label: "Missing Docs",              path: "/ops/missing-docs",                icon: AlertTriangle },
          { label: "Payer Requirements",        path: "/ops/payer-requirements",          icon: FileSignature },
          { label: "Authorization Reports",     path: "/reports",                         icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------------- Scheduling -------------------------------- */
  scheduling_team: {
    sections: [
      {
        id: "scheduling", label: "Scheduling", items: [
          { label: "Scheduling Dashboard", path: "/scheduling",                              icon: LayoutDashboard },
          { label: "Schedule Gaps",        path: "/ops/scheduling",                          icon: AlertTriangle },
          { label: "Session Coverage",     path: "/scheduling-workspace",                    icon: Calendar },
          { label: "Cancellations",        path: "/reports/cancellation-command-center",     icon: XCircle },
          { label: "Make-Up Sessions",     path: "/ops/make-up-sessions",                    icon: Activity },
          { label: "Scheduling Reports",   path: "/reports",                                 icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* -------------------------------- Staffing --------------------------------- */
  staffing_team: {
    sections: [
      {
        id: "staffing", label: "Staffing", items: [
          { label: "Staffing Dashboard",          path: "/ops/staffing",                    icon: LayoutDashboard },
          { label: "Open Cases",                  path: "/staffing",                        icon: Briefcase },
          { label: "RBT Match Queue",             path: "/ops/rbt-match-queue",             icon: UserCheck },
          { label: "Coverage Needs",              path: "/ops/staffing",                    icon: Calendar },
          { label: "Family Staffing Preferences", path: "/ops/family-staffing-preferences", icon: HeartHandshake },
          { label: "Staffing Reports",            path: "/reports",                         icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ---------------------------------- HR Team -------------------------------- */
  hr_team: {
    sections: [
      {
        id: "hr", label: "HR", items: [
          DASHBOARD_ITEM,
          { label: "HR Dashboard",       path: "/hr-team",            icon: LayoutDashboard },
          { label: "Employee Records",   path: "/employee-directory", icon: Users },
          { label: "HR Requests",        path: "/hr/requests",        icon: ClipboardList },
          { label: "Compliance Items",   path: "/hr/compliance",      icon: ShieldCheck },
          { label: "Device Requests",    path: "/device-requests",    icon: Wrench },
          { label: "Device Inventory",   path: "/device-inventory",   icon: Wrench },
          { label: "NFC Badge Support",  path: "/nfc-badges",         icon: IdCard },
          { label: "HR Reports",         path: "/reports",            icon: BarChart3 },
          { label: "Phone System",       path: "/phone",              icon: Phone },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ----------------------------- Credentialing ------------------------------- */
  credentialing_team: {
    sections: [
      {
        id: "credentialing", label: "Credentialing", items: [
          DASHBOARD_ITEM,
          { label: "Credentialing Dashboard",   path: "/credentialing",                       icon: LayoutDashboard },
          { label: "Provider Credentialing",    path: "/credentialing/providers",             icon: Stethoscope },
          { label: "Insurance Credentialing",   path: "/credentialing/insurance",             icon: Building2 },
          { label: "BCBA Credentials",          path: "/credentialing/bcba",                  icon: IdCard },
          { label: "Uncredentialed BCBAs",      path: "/credentialing/uncredentialed-bcbas",  icon: AlertTriangle },
          { label: "Expiring Credentials",      path: "/credentialing/expiring",              icon: Calendar },
          { label: "Credentialing Reports",     path: "/reports",                             icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ---------------------------------- QA Team -------------------------------- */
  qa_team: {
    sections: [
      {
        id: "qa", label: "QA", items: [
          DASHBOARD_ITEM,
          { label: "QA Dashboard",         path: "/qa",            icon: LayoutDashboard },
          { label: "Documentation Review", path: "/qa-workspace",  icon: FileSignature },
          { label: "Session Note Review",  path: "/qa-queue",      icon: FileText },
          { label: "Compliance Issues",    path: "/qa-clients",    icon: AlertTriangle },
          { label: "QA Reports",           path: "/reports",       icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------------- Clinical Director ----------------------------- */
  clinical_director: {
    sections: [
      {
        id: "clinical_leadership", label: "Clinical Leadership", items: [
          DASHBOARD_ITEM,
          { label: "Clinical Dashboard",   path: "/bcba",                   icon: LayoutDashboard },
          { label: "BCBA Oversight",       path: "/assigned-bcbas",         icon: UserCheck },
          { label: "Clinical Quality",     path: "/qa",                     icon: CheckCircle2 },
          { label: "Supervision Health",   path: "/supervision-tracking",   icon: ClipboardCheck },
          { label: "Clinical Escalations", path: "/escalations-followups",  icon: AlertTriangle },
          { label: "Clinical Reports",     path: "/reports",                icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ----------------------------------- BCBA ---------------------------------- */
  bcba: {
    sections: [
      {
        id: "bcba", label: "BCBA", items: [
          DASHBOARD_ITEM,
          { label: "BCBA Dashboard",         path: "/bcba",                  icon: LayoutDashboard },
          { label: "Caseload",               path: "/bcba/clients",          icon: UserCheck },
          { label: "Supervision",            path: "/bcba/supervision",      icon: ClipboardCheck },
          { label: "Treatment Plans",        path: "/bcba/workspace",        icon: FileSignature },
          { label: "Parent Training",        path: "/bcba/parent-training",  icon: HeartHandshake },
          { label: "Clinical Documentation", path: "/bcba/workspace",        icon: FileText },
          { label: "Evaluations",            path: "/evaluations",           icon: ClipboardCheck },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* -------------------------------- Case Manager ----------------------------- */
  case_manager: {
    sections: [
      {
        id: "case_management", label: "Case Management", items: [
          DASHBOARD_ITEM,
          { label: "Case Manager Dashboard", path: "/case-manager",                  icon: LayoutDashboard },
          { label: "Caseload",               path: "/case-manager/families",         icon: Users },
          { label: "Client Follow-Up",       path: "/case-manager/follow-ups",       icon: MessageSquare },
          { label: "Care Coordination",      path: "/case-manager/scheduling",       icon: HeartHandshake },
          { label: "Family Communication",   path: "/case-manager/communication",    icon: MessageSquare },
          { label: "Case Notes",             path: "/case-manager/family-support",   icon: FileSignature },
          { label: "Evaluations",            path: "/evaluations",                   icon: ClipboardCheck },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------------------ RBT ---------------------------------- */
  rbt: {
    sections: [
      {
        id: "rbt", label: "RBT", items: [
          DASHBOARD_ITEM,
          { label: "RBT Dashboard",      path: "/rbt/my-day",          icon: LayoutDashboard },
          { label: "My Clients",         path: "/rbt/clients",         icon: UserCheck },
          { label: "Session Support",    path: "/rbt/session-support", icon: MessageSquare },
          { label: "Supervision Notes",  path: "/rbt/supervision",     icon: ClipboardCheck },
          { label: "Nonbillable Points", path: "/rbt/readiness",       icon: Activity },
          { label: "Career Path",        path: "/academy",             icon: TrendingUp },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ----------------------------- Behavioral Support -------------------------- */
  behavioral_support: {
    sections: [
      {
        id: "behavioral_support", label: "Behavioral Support", items: [
          DASHBOARD_ITEM,
          { label: "Behavioral Support Dashboard", path: "/reports",                       icon: LayoutDashboard },
          { label: "Crisis Support",               path: "/case-manager/service-issues",   icon: AlertTriangle },
          { label: "Behavior Escalations",         path: "/escalations-followups",         icon: AlertTriangle },
          { label: "Support Plans",                path: "/bcba/workspace",                icon: FileSignature },
          { label: "Follow-Up Tracker",            path: "/case-manager/follow-ups",       icon: Activity },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },
};

/** Fallback for any role without an explicit menu definition. */
export const DEFAULT_ROLE_MENU: RoleMenu = {
  sections: [
    { id: "core", label: "Core", items: [DASHBOARD_ITEM] },
    TRAINING_AND_RESOURCES,
  ],
};

/**
 * Roles surfaced in the Super Admin "View as Role" preview switcher.
 * Order matters - this is what shows up in the dropdown.
 */
export const ROLE_PREVIEW_LIST: { label: string; role: OSRole }[] = [
  { label: "Super Admin",                 role: "super_admin" },
  { label: "Executive Leadership",        role: "executive_leadership" },
  { label: "Operations Leadership",       role: "operations_leadership" },
  { label: "State Director",              role: "state_director" },
  { label: "State Director Assistant",    role: "assistant_state_director" },
  { label: "Marketing Team",              role: "marketing_team" },
  { label: "Business Development",        role: "business_development" },
  { label: "Intake Team",                 role: "intake_coordinator" },
  { label: "Recruiting Team",             role: "recruiting_team" },
  { label: "Authorizations Team",         role: "authorization_coordinator" },
  { label: "Scheduling Team",             role: "scheduling_team" },
  { label: "Staffing Team",               role: "staffing_team" },
  { label: "HR Team",                     role: "hr_team" },
  { label: "Credentialing Team",          role: "credentialing_team" },
  { label: "QA Team",                     role: "qa_team" },
  { label: "Clinical Director",           role: "clinical_director" },
  { label: "BCBA",                        role: "bcba" },
  { label: "Case Manager",                role: "case_manager" },
  { label: "RBT",                         role: "rbt" },
  { label: "Behavioral Support",          role: "behavioral_support" },
];