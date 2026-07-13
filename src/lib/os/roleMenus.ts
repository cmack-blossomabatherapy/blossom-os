import {
  GraduationCap, BookOpen, FileText, Phone, ClipboardCheck,
  Megaphone, BarChart3, Search as SearchIcon, PhoneCall,
  HeartHandshake, Users, MessageSquare, Star, TrendingUp, Briefcase,
  Building2, ShieldCheck, Wrench, IdCard,
  Calendar, FileSignature, ClipboardList, UserCheck,
  LayoutDashboard, AlertTriangle, MapPin, Stethoscope, CheckCircle2,
  XCircle, Gauge, LineChart, Activity, Inbox, type LucideIcon,
  FileCheck2, Clock, Eye, Flame, Library, UserPlus, Bell, List, Sparkles, ChevronRight,
  Workflow, CalendarClock, LifeBuoy,
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
          { label: "Executive Dashboard",         path: "/executive",                     icon: BarChart3 },
          { label: "Company Snapshot",            path: "/command-center",                icon: LayoutDashboard },
          { label: "State Health Overview",       path: "/state-operations",              icon: MapPin },
          { label: "Growth Pipeline",             path: "/marketing",                     icon: TrendingUp },
          { label: "Lead-to-Active Funnel",       path: "/intake/lead-to-active",         icon: TrendingUp },
          { label: "CR Handoff Aging",            path: "/authorizations/handoff",        icon: ShieldCheck },
          { label: "Revenue / RCM Snapshot",      path: "/revenue",                       icon: Gauge },
          { label: "Staffing Risk",               path: "/ops/staffing",                  icon: Users },
          { label: "Recruiting Supply",           path: "/recruiting/staffing-needs",     icon: Users },
          { label: "Clinical Readiness Snapshot", path: "/ops/qa",                        icon: Stethoscope },
          { label: "QA Risk",                     path: "/qa",                            icon: AlertTriangle },
          { label: "Reports",                     path: "/reports",                       icon: Gauge },
          { label: "Escalations",                 path: "/operations/escalations",        icon: AlertTriangle },
          { label: "Org Chart",                   path: "/org-chart",                     icon: Users },
          { label: "Phone System",                path: "/phone",                         icon: Phone },
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
          { label: "Operations Dashboard",  path: "/operations/command-center",  icon: BarChart3 },
          { label: "Command Center",        path: "/command-center",             icon: LayoutDashboard },
          { label: "Department Scorecards", path: "/operations/department-health", icon: Gauge },
          { label: "State Health Overview", path: "/state-operations",            icon: MapPin },
          { label: "Escalations",           path: "/operations/escalations",      icon: AlertTriangle },
          { label: "Workflow Bottlenecks",  path: "/operations/workflow-risks",   icon: ShieldCheck },
          { label: "Work Queue",            path: "/work-queue",                  icon: ClipboardList },
          { label: "Escalation Center",     path: "/work-queue/escalations",      icon: Flame },
          { label: "System Requests",       path: "/system/request-intake",       icon: Inbox },
          { label: "Org Chart",             path: "/org-chart",                   icon: Users },
          { label: "Phone System",          path: "/phone",                       icon: Phone },
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
          { label: "State Dashboard",                path: "/state-operations",       icon: MapPin },
          { label: "State Health",                   path: "/state-operations",       icon: Activity },
          { label: "State Escalations",              path: "/ops/state-escalations",  icon: AlertTriangle },
          { label: "State Task Queue",               path: "/ops/tasks",              icon: ClipboardList },
          { label: "State Staffing Snapshot",        path: "/ops/staffing",           icon: Users },
          { label: "State Intake Snapshot",          path: "/intake/dashboard",       icon: Briefcase },
          { label: "State Authorization Snapshot",   path: "/authorizations",         icon: ShieldCheck },
          { label: "State Scheduling Snapshot",      path: "/ops/scheduling",         icon: Calendar },
          { label: "State Clinical Snapshot",        path: "/qa-team",                icon: Stethoscope },
          { label: "Phone System",                   path: "/phone",                  icon: Phone },
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
          { label: "State Support Dashboard", path: "/state-operations",       icon: LayoutDashboard },
          { label: "State Intake Support",    path: "/intake/dashboard",       icon: Briefcase },
          { label: "State Task Queue",        path: "/ops/tasks",              icon: ClipboardList },
          { label: "Escalation Support",      path: "/ops/state-escalations",  icon: AlertTriangle },
          { label: "Staffing Support",        path: "/ops/staffing",           icon: Users },
          { label: "Scheduling Support",      path: "/ops/scheduling",         icon: Calendar },
          { label: "Authorization Support",   path: "/authorizations",         icon: ShieldCheck },
          { label: "State Clinical Snapshot", path: "/qa-team",                icon: Stethoscope },
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
          { label: "Marketing Dashboard",      path: "/marketing",                  icon: BarChart3 },
          { label: "Lead Source Inbox",        path: "/marketing/lead-source-inbox",icon: Inbox },
          { label: "Lead Sources",             path: "/marketing/lead-sources",     icon: TrendingUp },
          { label: "Referral CRM",             path: "/marketing/referral-crm",     icon: HeartHandshake },
          { label: "Patient Lifetime Journey", path: "/patient-journey",            icon: HeartHandshake },
          { label: "Campaigns",                path: "/marketing/campaigns",        icon: Megaphone },
          { label: "CTM / Call Tracking",      path: "/marketing/call-tracking",    icon: PhoneCall },
          { label: "LeadTrap",                 path: "/marketing/leadtrap",         icon: TrendingUp },
          { label: "Facebook Ads",             path: "/marketing/facebook-ads",     icon: Megaphone },
          { label: "Google Ads",               path: "/marketing/google-ads",       icon: TrendingUp },
          { label: "Email Marketing",          path: "/marketing/email-marketing",  icon: MessageSquare },
          { label: "SEO & Content",            path: "/marketing/seo",              icon: SearchIcon },
          { label: "Web Analytics",            path: "/marketing/web-analytics",    icon: LineChart },
          { label: "Recruiting Marketing",     path: "/marketing/recruiting",       icon: Briefcase },
          { label: "Community Outreach",       path: "/marketing/outreach",         icon: Users },
          { label: "Reputation",               path: "/marketing/reputation",       icon: Star },
          { label: "Attribution & ROI",        path: "/marketing/attribution",      icon: Gauge },
          { label: "State Growth",             path: "/marketing/state-growth",     icon: MapPin },
          { label: "Phone System",             path: "/phone",                      icon: Phone },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------- Marketing Growth Lead --------------------------- */
  marketing_growth_lead: {
    sections: [
      {
        id: "growth_command", label: "Growth Command", items: [
          { label: "Growth Command Center",    path: "/marketing",                  icon: BarChart3 },
          { label: "Lead Source Inbox",        path: "/marketing/lead-source-inbox",icon: Inbox },
          { label: "Lead Sources",             path: "/marketing/lead-sources",     icon: TrendingUp },
          { label: "Patient Lifetime Journey", path: "/patient-journey",            icon: HeartHandshake },
          { label: "Referral CRM",             path: "/marketing/referral-crm",     icon: HeartHandshake },
          { label: "Business Development",     path: "/business-development",       icon: Briefcase },
          { label: "Campaigns",                path: "/marketing/campaigns",        icon: Megaphone },
          { label: "CTM / Call Tracking",      path: "/marketing/call-tracking",    icon: PhoneCall },
          { label: "LeadTrap",                 path: "/marketing/leadtrap",         icon: TrendingUp },
          { label: "Facebook Ads",             path: "/marketing/facebook-ads",     icon: Megaphone },
          { label: "Google Ads",               path: "/marketing/google-ads",       icon: TrendingUp },
          { label: "Email Marketing",          path: "/marketing/email-marketing",  icon: MessageSquare },
          { label: "Attribution & ROI",        path: "/marketing/attribution",      icon: Gauge },
          { label: "State Growth",             path: "/marketing/state-growth",     icon: MapPin },
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
          { label: "Business Development Dashboard", path: "/business-development",                    icon: HeartHandshake },
          { label: "Partner Pipeline",               path: "/business-development?tab=partners",       icon: HeartHandshake },
          { label: "Outreach Pipeline",              path: "/business-development?tab=outreach",       icon: MessageSquare },
          { label: "Follow-Up Tasks",                path: "/business-development?tab=tasks",          icon: ClipboardList },
          { label: "Provider Relationships",         path: "/business-development?tab=providers",      icon: Briefcase },
          { label: "Community Relationships",        path: "/business-development?tab=community",      icon: Users },
          { label: "Lead Source Handoffs",           path: "/business-development?tab=sources",        icon: Inbox },
          { label: "Referral CRM",                   path: "/marketing/referral-crm",                  icon: HeartHandshake },
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
          { label: "Lead to Ready-to-Start Pipeline", path: "/intake/lead-to-active",    icon: TrendingUp },
          { label: "Open Leads",                 path: "/leads",                         icon: List },
          { label: "Packet Follow Up / Missing Info", path: "/intake/missing-information", icon: ShieldCheck },
          { label: "Intake Communications",      path: "/intake/parent-communication",   icon: MessageSquare },
          { label: "Intake Tasks",               path: "/intake/tasks",                  icon: ClipboardList },
          { label: "Lead Benefits Cheat Sheets", path: "/intake/benefits-cheat-sheets",  icon: ShieldCheck },
          { label: "After-Hours AI Calls",       path: "/phone/ai-calls",                icon: PhoneCall },
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
          { label: "Recruiting Dashboard",       path: "/recruiting-team",            icon: LayoutDashboard },
          { label: "Recruiting Workspace",       path: "/recruiting/workspace",       icon: Briefcase },
          { label: "Candidate Pipeline",         path: "/recruiting/pipeline",        icon: UserPlus },
          { label: "Interviews",                 path: "/recruiting/interviews",      icon: Calendar },
          { label: "Offers",                     path: "/recruiting/offers",          icon: FileSignature },
          { label: "Onboarding Handoff",         path: "/recruiting/onboarding",      icon: HeartHandshake },
          { label: "Background Checks",          path: "/recruiting/background",      icon: ShieldCheck },
          { label: "Orientation Queue",          path: "/recruiting/orientation",     icon: ClipboardCheck },
          { label: "Staffing Needs",             path: "/recruiting/staffing-needs",  icon: Users },
          { label: "RBT Recruiting",             path: "/recruiting/rbt",             icon: UserCheck },
          { label: "BCBA Recruiting",            path: "/recruiting/bcba",            icon: Stethoscope },
          { label: "Recruiting Map",             path: "/recruiting/map",             icon: MapPin },
          { label: "Recruiting Performance",     path: "/recruiting/performance",     icon: TrendingUp },
          { label: "Follow-Ups",                 path: "/recruiting/follow-ups",      icon: Bell },
          { label: "Messages",                   path: "/recruiting/messages",        icon: MessageSquare },
          { label: "Escalations",                path: "/recruiting/escalations",     icon: Flame },
          { label: "Training Academy",           path: "/recruiting/academy",         icon: GraduationCap },
          { label: "Recruiting Resources",       path: "/recruiting/resources",       icon: Library },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  recruiting_lead: {
    sections: [
      {
        id: "recruiting", label: "Recruiting", items: [
          { label: "Recruiting Dashboard",       path: "/recruiting-team",            icon: LayoutDashboard },
          { label: "Recruiting Workspace",       path: "/recruiting/workspace",       icon: Briefcase },
          { label: "Candidate Pipeline",         path: "/recruiting/pipeline",        icon: UserPlus },
          { label: "Interviews",                 path: "/recruiting/interviews",      icon: Calendar },
          { label: "Offers",                     path: "/recruiting/offers",          icon: FileSignature },
          { label: "Onboarding Handoff",         path: "/recruiting/onboarding",      icon: HeartHandshake },
          { label: "Background Checks",          path: "/recruiting/background",      icon: ShieldCheck },
          { label: "Orientation Queue",          path: "/recruiting/orientation",     icon: ClipboardCheck },
          { label: "Staffing Needs",             path: "/recruiting/staffing-needs",  icon: Users },
          { label: "RBT Recruiting",             path: "/recruiting/rbt",             icon: UserCheck },
          { label: "BCBA Recruiting",            path: "/recruiting/bcba",            icon: Stethoscope },
          { label: "Recruiting Map",             path: "/recruiting/map",             icon: MapPin },
          { label: "Recruiting Performance",     path: "/recruiting/performance",     icon: TrendingUp },
          { label: "Follow-Ups",                 path: "/recruiting/follow-ups",      icon: Bell },
          { label: "Messages",                   path: "/recruiting/messages",        icon: MessageSquare },
          { label: "Escalations",                path: "/recruiting/escalations",     icon: Flame },
          { label: "Training Academy",           path: "/recruiting/academy",         icon: GraduationCap },
          { label: "Recruiting Resources",       path: "/recruiting/resources",       icon: Library },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  recruiting_coordinator: {
    sections: [
      {
        id: "recruiting", label: "Recruiting", items: [
          { label: "Recruiting Dashboard",       path: "/recruiting-team",            icon: LayoutDashboard },
          { label: "Recruiting Workspace",       path: "/recruiting/workspace",       icon: Briefcase },
          { label: "Candidate Pipeline",         path: "/recruiting/pipeline",        icon: UserPlus },
          { label: "Interviews",                 path: "/recruiting/interviews",      icon: Calendar },
          { label: "Offers",                     path: "/recruiting/offers",          icon: FileSignature },
          { label: "Onboarding Handoff",         path: "/recruiting/onboarding",      icon: HeartHandshake },
          { label: "Background Checks",          path: "/recruiting/background",      icon: ShieldCheck },
          { label: "Orientation Queue",          path: "/recruiting/orientation",     icon: ClipboardCheck },
          { label: "Staffing Needs",             path: "/recruiting/staffing-needs",  icon: Users },
          { label: "RBT Recruiting",             path: "/recruiting/rbt",             icon: UserCheck },
          { label: "BCBA Recruiting",            path: "/recruiting/bcba",            icon: Stethoscope },
          { label: "Recruiting Map",             path: "/recruiting/map",             icon: MapPin },
          { label: "Recruiting Performance",     path: "/recruiting/performance",     icon: TrendingUp },
          { label: "Follow-Ups",                 path: "/recruiting/follow-ups",      icon: Bell },
          { label: "Messages",                   path: "/recruiting/messages",        icon: MessageSquare },
          { label: "Escalations",                path: "/recruiting/escalations",     icon: Flame },
          { label: "Training Academy",           path: "/recruiting/academy",         icon: GraduationCap },
          { label: "Recruiting Resources",       path: "/recruiting/resources",       icon: Library },
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
          { label: "Initial → Treatment Handoff", path: "/authorizations/handoff",        icon: ChevronRight },
          { label: "Approved Authorizations",   path: "/authorizations?stage=approved",   icon: CheckCircle2 },
          { label: "Expiring Authorizations",   path: "/ops/expiring-authorizations",     icon: Calendar },
          { label: "Denials",                   path: "/authorizations?stage=denied",     icon: XCircle },
          { label: "Missing Docs",              path: "/ops/missing-docs",                icon: AlertTriangle },
          { label: "Payer Requirements",        path: "/ops/payer-requirements",          icon: FileSignature },
          { label: "Reports",                   path: "/reports",                         icon: BarChart3 },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* -------------------- Authorizations — Manager ----------------------------- */
  authorization_manager: {
    sections: [
      {
        id: "authorizations", label: "Authorizations", items: [
          { label: "Authorizations Dashboard",    path: "/authorizations",                  icon: LayoutDashboard },
          { label: "Auth Queue",                  path: "/auth-workspace",                  icon: ShieldCheck },
          { label: "Team Workload",               path: "/auth-workspace?view=team",        icon: Users },
          { label: "Initial → Treatment Handoff", path: "/authorizations/handoff",          icon: ChevronRight },
          { label: "Approved Authorizations",     path: "/authorizations?stage=approved",   icon: CheckCircle2 },
          { label: "Expiring Authorizations",     path: "/ops/expiring-authorizations",     icon: Calendar },
          { label: "Denials",                     path: "/authorizations?stage=denied",     icon: XCircle },
          { label: "Missing Docs",                path: "/ops/missing-docs",                icon: AlertTriangle },
          { label: "Payer Requirements",          path: "/ops/payer-requirements",          icon: FileSignature },
          { label: "Reports",                     path: "/reports",                         icon: BarChart3 },
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
          { label: "Schedule Gaps",        path: "/scheduling-workspace?view=coverage_risk", icon: AlertTriangle },
          { label: "Session Coverage",     path: "/scheduling-workspace",                    icon: Calendar },
          { label: "RBT Roster",           path: "/scheduling/rbts",                         icon: UserCheck },
          { label: "BCBA Roster",          path: "/scheduling/bcbas",                        icon: UserCheck },
          { label: "Orientation Scheduling", path: "/hr/orientation-queue",                    icon: CalendarClock },
          { label: "Cancellation Report",  path: "/reports/cancellation-command-center",      icon: ClipboardList },
          { label: "Make-Up Sessions",     path: "/ops/make-up-sessions",                    icon: Activity },
          { label: "Scheduling Resources", path: "/scheduling/resources",                    icon: BookOpen },
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
          { label: "Staffing Dashboard",          path: "/ops/staffing",                       icon: LayoutDashboard },
          { label: "Open Cases",                  path: "/ops/staffing?tab=open-cases",        icon: Briefcase },
          { label: "RBT Match Queue",             path: "/ops/staffing?tab=match-queue",       icon: UserCheck },
          { label: "Coverage Needs",              path: "/ops/staffing?tab=coverage",          icon: Calendar },
          { label: "Family Staffing Preferences", path: "/ops/staffing?tab=preferences",       icon: HeartHandshake },
          { label: "Live Staffing Map",           path: "/ops/staffing?tab=map",               icon: MapPin },
          { label: "Apploi Handoff",              path: "/ops/staffing?tab=apploi",            icon: UserCheck },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ---------------------------------- HR Team -------------------------------- */
  hr_team: {
    sections: [
      {
        id: "hr_command", label: "HR Command", items: [
          { label: "HR Dashboard",                path: "/hr-team",                     icon: LayoutDashboard },
          { label: "HR Workspace",                path: "/hr/workspace",                icon: Workflow },
          { label: "New Hires",                   path: "/hr/new-hires",                icon: UserPlus },
          { label: "Orientation Queue",           path: "/hr/orientation-queue",        icon: CalendarClock },
          { label: "Training & Certifications",   path: "/hr/training-certifications",  icon: GraduationCap },
          { label: "Compliance Items",            path: "/hr/compliance",               icon: ShieldCheck },
          { label: "Employee Support",            path: "/hr/employee-support",         icon: LifeBuoy },
          { label: "HR Requests",                 path: "/hr/requests",                 icon: ClipboardList },
          { label: "Evaluations",                 path: "/hr/evaluations",              icon: ClipboardCheck },
          { label: "Messages & Announcements",    path: "/hr/messages",                 icon: MessageSquare },
          { label: "HR Resources",                path: "/hr/team-resources",           icon: BookOpen },
        ],
      },
      {
        id: "hr_people", label: "People & Access", items: [
          { label: "User Management",             path: "/user-management",             icon: Users },
          { label: "Org Chart",                   path: "/org-chart",                   icon: Users },
          { label: "Device Requests",             path: "/device-requests",             icon: Wrench },
          { label: "Device Inventory",            path: "/device-inventory",            icon: Wrench },
        ],
      },
      {
        id: "hr_comms", label: "Communications", items: [
          { label: "Phone System",                path: "/phone",                       icon: Phone },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------------------- HR Lead --------------------------------- */
  hr_lead: {
    sections: [
      {
        id: "hr_command", label: "HR Command", items: [
          { label: "HR Dashboard",                path: "/hr-team",                     icon: LayoutDashboard },
          { label: "HR Workspace",                path: "/hr/workspace",                icon: Workflow },
          { label: "New Hires",                   path: "/hr/new-hires",                icon: UserPlus },
          { label: "Orientation Queue",           path: "/hr/orientation-queue",        icon: CalendarClock },
          { label: "Training & Certifications",   path: "/hr/training-certifications",  icon: GraduationCap },
          { label: "Compliance Items",            path: "/hr/compliance",               icon: ShieldCheck },
          { label: "Employee Support",            path: "/hr/employee-support",         icon: LifeBuoy },
          { label: "HR Requests",                 path: "/hr/requests",                 icon: ClipboardList },
          { label: "Evaluations",                 path: "/hr/evaluations",              icon: ClipboardCheck },
          { label: "Messages & Announcements",    path: "/hr/messages",                 icon: MessageSquare },
          { label: "HR Resources",                path: "/hr/team-resources",           icon: BookOpen },
        ],
      },
      {
        id: "hr_people", label: "People & Access", items: [
          { label: "User Management",             path: "/user-management",             icon: Users },
          { label: "Device Requests",             path: "/device-requests",             icon: Wrench },
          { label: "Device Inventory",            path: "/device-inventory",            icon: Wrench },
        ],
      },
      {
        id: "hr_comms", label: "Communications", items: [
          { label: "Phone System",                path: "/phone",                       icon: Phone },
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
          { label: "Credentialing Dashboard",   path: "/credentialing",                       icon: LayoutDashboard },
          { label: "Provider Credentialing",    path: "/credentialing/providers",             icon: Stethoscope },
          { label: "Insurance Credentialing",   path: "/credentialing/insurance",             icon: Building2 },
          { label: "BCBA Credentials",          path: "/credentialing/bcba",                  icon: IdCard },
          { label: "Uncredentialed BCBAs",      path: "/credentialing/uncredentialed-bcbas",  icon: AlertTriangle },
          { label: "Expiring Credentials",      path: "/credentialing/expiring",              icon: Calendar },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  credentialing_lead: {
    sections: [
      {
        id: "credentialing", label: "Credentialing", items: [
          { label: "Credentialing Dashboard",   path: "/credentialing",                       icon: LayoutDashboard },
          { label: "Provider Credentialing",    path: "/credentialing/providers",             icon: Stethoscope },
          { label: "Insurance Credentialing",   path: "/credentialing/insurance",             icon: Building2 },
          { label: "BCBA Credentials",          path: "/credentialing/bcba",                  icon: IdCard },
          { label: "Uncredentialed BCBAs",      path: "/credentialing/uncredentialed-bcbas",  icon: AlertTriangle },
          { label: "Expiring Credentials",      path: "/credentialing/expiring",              icon: Calendar },
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
          { label: "QA Dashboard",             path: "/qa-team",                icon: LayoutDashboard },
          { label: "QA Workspace",             path: "/qa-workspace",           icon: FileSignature },
          { label: "QA Queue",                 path: "/qa-queue",               icon: FileText },
          { label: "QA Review Board",          path: "/qa/board",               icon: ClipboardCheck },
          { label: "QA Clients",               path: "/qa-clients",             icon: Users },
          { label: "Authorization Reviews",    path: "/authorization-reviews",  icon: ClipboardCheck },
          { label: "Progress Reports",         path: "/reports",       icon: BarChart3 },
          { label: "Treatment Plan Reviews",   path: "/treatment-plan-reviews", icon: FileCheck2 },
          { label: "Missing Information",      path: "/missing-information",    icon: AlertTriangle },
          { label: "Expiring Items",           path: "/expiring-items",         icon: Clock },
          { label: "Assigned BCBAs",           path: "/assigned-bcbas",         icon: UserCheck },
          { label: "Supervision Visibility",   path: "/supervision-visibility", icon: Eye },
          { label: "QA Messages",              path: "/qa-messages",            icon: MessageSquare },
          { label: "Escalations & Follow-Ups", path: "/escalations-followups",  icon: Flame },
          { label: "QA Resources",             path: "/qa/resources",           icon: Library },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  qa_director: {
    sections: [
      {
        id: "qa", label: "QA", items: [
          { label: "QA Dashboard",             path: "/qa-team",                icon: LayoutDashboard },
          { label: "QA Workspace",             path: "/qa-workspace",           icon: FileSignature },
          { label: "QA Queue",                 path: "/qa-queue",               icon: FileText },
          { label: "QA Review Board",          path: "/qa/board",               icon: ClipboardCheck },
          { label: "QA Clients",               path: "/qa-clients",             icon: Users },
          { label: "Authorization Reviews",    path: "/authorization-reviews",  icon: ClipboardCheck },
          { label: "Progress Reports",         path: "/reports",       icon: BarChart3 },
          { label: "Treatment Plan Reviews",   path: "/treatment-plan-reviews", icon: FileCheck2 },
          { label: "Missing Information",      path: "/missing-information",    icon: AlertTriangle },
          { label: "Expiring Items",           path: "/expiring-items",         icon: Clock },
          { label: "Assigned BCBAs",           path: "/assigned-bcbas",         icon: UserCheck },
          { label: "Supervision Visibility",   path: "/supervision-visibility", icon: Eye },
          { label: "QA Messages",              path: "/qa-messages",            icon: MessageSquare },
          { label: "Escalations & Follow-Ups", path: "/escalations-followups",  icon: Flame },
          { label: "QA Resources",             path: "/qa/resources",           icon: Library },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  qa_specialist: {
    sections: [
      {
        id: "qa", label: "QA", items: [
          { label: "QA Dashboard",             path: "/qa-team",                icon: LayoutDashboard },
          { label: "QA Workspace",             path: "/qa-workspace",           icon: FileSignature },
          { label: "QA Queue",                 path: "/qa-queue",               icon: FileText },
          { label: "QA Review Board",          path: "/qa/board",               icon: ClipboardCheck },
          { label: "QA Clients",               path: "/qa-clients",             icon: Users },
          { label: "Authorization Reviews",    path: "/authorization-reviews",  icon: ClipboardCheck },
          { label: "Progress Reports",         path: "/reports",       icon: BarChart3 },
          { label: "Treatment Plan Reviews",   path: "/treatment-plan-reviews", icon: FileCheck2 },
          { label: "Missing Information",      path: "/missing-information",    icon: AlertTriangle },
          { label: "Expiring Items",           path: "/expiring-items",         icon: Clock },
          { label: "Assigned BCBAs",           path: "/assigned-bcbas",         icon: UserCheck },
          { label: "Supervision Visibility",   path: "/supervision-visibility", icon: Eye },
          { label: "QA Messages",              path: "/qa-messages",            icon: MessageSquare },
          { label: "Escalations & Follow-Ups", path: "/escalations-followups",  icon: Flame },
          { label: "QA Resources",             path: "/qa/resources",           icon: Library },
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
          { label: "Clinical Director Dashboard", path: "/clinical-director",      icon: LayoutDashboard },
          { label: "BCBA Oversight",              path: "/assigned-bcbas",         icon: UserCheck },
          { label: "Supervision Health",          path: "/supervision-visibility", icon: Eye },
          { label: "Treatment Plan Reviews",      path: "/treatment-plan-reviews", icon: FileCheck2 },
          { label: "Progress Reports",            path: "/reports?category=progress", icon: BarChart3 },
          { label: "Evaluations",                 path: "/evaluations",            icon: ClipboardCheck },
          { label: "Clinical Escalations",        path: "/escalations-followups",  icon: AlertTriangle },
          { label: "QA Dashboard",                path: "/qa-team",                icon: ShieldCheck },
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
          { label: "BCBA Dashboard",            path: "/bcba",                  icon: LayoutDashboard },
          { label: "My Caseload",               path: "/bcba/clients",          icon: UserCheck },
          { label: "Treatment Plans",           path: "/bcba/workspace",        icon: FileSignature },
          { label: "Supervision",               path: "/bcba/supervision",      icon: ClipboardCheck },
          { label: "Parent Training",           path: "/bcba/parent-training",  icon: HeartHandshake },
          { label: "Scheduling Visibility",     path: "/bcba/scheduling",       icon: Calendar },
          { label: "Authorizations Visibility", path: "/bcba/authorizations",   icon: ShieldCheck },
          { label: "Evaluations",               path: "/evaluations",           icon: ClipboardCheck },
          { label: "BCBA Resources",            path: "/bcba/resources",        icon: Library },
          { label: "BCBA Training Academy",     path: "/bcba/training-academy", icon: GraduationCap },
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
          { label: "Case Manager Dashboard",     path: "/case-manager",                 icon: LayoutDashboard },
          { label: "Assigned Families",          path: "/case-manager/families",        icon: Users },
          { label: "Parent Communication",       path: "/case-manager/communication",   icon: MessageSquare },
          { label: "Family Support / Case Notes",path: "/case-manager/family-support",  icon: FileSignature },
          { label: "Follow-Ups",                 path: "/case-manager/follow-ups",      icon: Bell },
          { label: "Scheduling Coordination",    path: "/case-manager/scheduling",      icon: Calendar },
          { label: "Authorizations Visibility",  path: "/case-manager/authorizations",  icon: ShieldCheck },
          { label: "Staffing Coordination",      path: "/case-manager/staffing",        icon: Users },
          { label: "Service Issues",             path: "/case-manager/service-issues",  icon: AlertTriangle },
          { label: "Escalations",                path: "/case-manager/escalations",     icon: Flame },
          { label: "Community Referrals",        path: "/case-manager/community",       icon: HeartHandshake },
          { label: "Evaluations",                path: "/evaluations",                  icon: ClipboardCheck },
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
          { label: "My Day",                       path: "/rbt/my-day",          icon: LayoutDashboard },
          { label: "My Clients",                   path: "/rbt/clients",         icon: UserCheck },
          { label: "My Schedule",                  path: "/rbt/schedule",        icon: Calendar },
          { label: "Session Support",              path: "/rbt/session-support", icon: MessageSquare },
          { label: "Supervision Notes",            path: "/rbt/supervision",     icon: ClipboardCheck },
          { label: "RBT Training Academy",         path: "/rbt/training-academy",icon: GraduationCap },
          { label: "Nonbillable Points / Readiness", path: "/rbt/readiness",     icon: Activity },
          { label: "RBT Messages",                 path: "/rbt/messages",        icon: MessageSquare },
          { label: "RBT Resources",                path: "/rbt/resources",       icon: Library },
          { label: "Help",                         path: "/rbt/help",            icon: HeartHandshake },
        ],
      },
      {
        id: "rbt-reports",
        label: "Reports",
        items: [
          { label: "Reports", path: "/reports", icon: FileText },
        ],
      },
    ],
  },

  /* ----------------------------- Behavioral Support -------------------------- */
  behavioral_support: {
    sections: [
      {
        id: "behavioral_support", label: "Behavioral Support", items: [
          { label: "Behavioral Support Dashboard", path: "/behavioral-support",            icon: LayoutDashboard },
          { label: "Crisis Support",               path: "/behavioral-support/crisis-support",           icon: AlertTriangle },
          { label: "Behavior Escalations",         path: "/behavioral-support/escalations",              icon: Flame },
          { label: "Support Plans",                path: "/behavioral-support/support-plans",            icon: FileSignature },
          { label: "Follow-Up Tracker",            path: "/behavioral-support/follow-ups",               icon: Activity },
          { label: "Supervision Visibility",       path: "/behavioral-support/supervision-visibility",   icon: Eye },
          { label: "Evaluations",                  path: "/behavioral-support/evaluations",              icon: ClipboardCheck },
          { label: "Phone System",                 path: "/phone",                                       icon: Phone },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },
};

/** Fallback for any role without an explicit menu definition. */
export const DEFAULT_ROLE_MENU: RoleMenu = {
  sections: [
    { id: "core", label: "Core", items: [
      DASHBOARD_ITEM,
      { label: "Org Chart", path: "/org-chart", icon: Users },
    ] },
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