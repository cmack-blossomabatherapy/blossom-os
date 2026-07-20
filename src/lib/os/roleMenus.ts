import {
  GraduationCap, BookOpen, FileText, Phone, ClipboardCheck,
  Megaphone, BarChart3, Search as SearchIcon, PhoneCall,
  HeartHandshake, Users, MessageSquare, Star, TrendingUp, Briefcase,
  Building2, ShieldCheck, Wrench, IdCard,
  Calendar, FileSignature, ClipboardList, UserCheck,
  LayoutDashboard, AlertTriangle, MapPin, Stethoscope, CheckCircle2,
  XCircle, Gauge, LineChart, Activity, Inbox, type LucideIcon,
  FileCheck2, Clock, Eye, Flame, Library, UserPlus, Bell, List, Sparkles, ChevronRight,
  Workflow, CalendarClock, LifeBuoy, Plug, Home, User,
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
    { label: "Parent Communication", path: "/intake/parent-communication", icon: MessageSquare },
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
    { label: "State Director Resources", path: "/state-director/resources", icon: BookOpen },
    { label: "Assistant State Director Resources", path: "/assistant-state-director/resources", icon: BookOpen },
    { label: "Parent Communication", path: "/intake/parent-communication", icon: MessageSquare },
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
          { label: "CR Handoff Aging",            path: "/authorizations/handoff",        icon: ShieldCheck },
          { label: "Revenue / RCM Snapshot",      path: "/revenue",                       icon: Gauge },
          { label: "Staffing Risk",               path: "/ops/staffing",                  icon: Users },
          { label: "Recruiting Supply",           path: "/recruiting/staffing-needs",     icon: Users },
          { label: "Clinical Readiness Snapshot", path: "/ops/qa",                        icon: Stethoscope },
          { label: "QA Risk",                     path: "/qa",                            icon: AlertTriangle },
          { label: "Escalations",                 path: "/operations/escalations",        icon: AlertTriangle },
          { label: "Org Chart",                   path: "/org-chart",                     icon: Users },
          { label: "Phone System",                path: "/phone",                         icon: Phone },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------- COO / Operating Owner --------------------- */
  coo: {
    sections: [
      {
        id: "coo_command", label: "COO Command", items: [
          { label: "COO Command Center",       path: "/operations/command-center",       icon: LayoutDashboard },
          { label: "Operating Pipeline",       path: "/command-center",                  icon: Workflow },
          { label: "Department Health",        path: "/operations/department-health",    icon: Gauge },
          { label: "State Health",             path: "/state-operations",                icon: MapPin },
          { label: "Work Queue",               path: "/work-queue",                      icon: ClipboardList },
          { label: "Escalation Center",        path: "/work-queue/escalations",          icon: Flame },
          { label: "CR Handoff Queue",         path: "/authorizations/handoff",          icon: ShieldCheck },
          { label: "Integration Health",       path: "/admin/integrations",              icon: Activity },
          { label: "Role / Menu Governance",   path: "/role-management",                 icon: ShieldCheck },
          { label: "System Request Intake",    path: "/system/request-intake",           icon: Inbox },
          { label: "Org Chart",                path: "/org-chart",                       icon: Users },
          { label: "Phone System",             path: "/phone",                           icon: Phone },
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
          { label: "Operations Dashboard",       path: "/operations/command-center",     icon: BarChart3 },
          { label: "Department Health",          path: "/operations/department-health",  icon: Gauge },
          { label: "Daily Queue Health",         path: "/command-center",                icon: Activity },
          { label: "Work Queue",                 path: "/work-queue",                    icon: ClipboardList },
          { label: "Escalations",                path: "/work-queue/escalations",        icon: Flame },
          { label: "State Health",               path: "/state-operations",              icon: MapPin },
          { label: "RCM / Benefits Visibility",  path: "/ops/no-oon-benefits",           icon: ShieldCheck },
          { label: "Authorizations Visibility",  path: "/authorizations",                icon: ShieldCheck },
          { label: "Scheduling Visibility",      path: "/ops/scheduling",                icon: Calendar },
          { label: "Staffing Visibility",        path: "/ops/staffing",                  icon: Users },
          { label: "CR Handoff Queue",           path: "/authorizations/handoff",        icon: FileCheck2 },
          { label: "System Request Intake",      path: "/system/request-intake",         icon: Inbox },
          { label: "Org Chart",                  path: "/org-chart",                     icon: Users },
          { label: "Phone System",               path: "/phone",                         icon: Phone },
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
          { label: "State Dashboard",                path: "/state-operations",             icon: MapPin },
          { label: "State Health Overview",          path: "/state-operations?tab=health",  icon: Activity },
          { label: "State Escalations",              path: "/ops/state-escalations",        icon: AlertTriangle },
          { label: "Growth in State",                path: "/marketing/state-growth",       icon: TrendingUp },
          { label: "Intake Snapshot",                path: "/intake/dashboard",             icon: Briefcase },
          { label: "Recruiting Snapshot",            path: "/recruiting/staffing-needs",    icon: UserPlus },
          { label: "Staffing Risk",                  path: "/ops/staffing",                 icon: Users },
          { label: "Scheduling Readiness",           path: "/ops/scheduling",               icon: Calendar },
          { label: "Auth Risk",                      path: "/authorizations",               icon: ShieldCheck },
          { label: "QA / Clinical Readiness",        path: "/qa-team",                      icon: Stethoscope },
          { label: "Assistant / VA Task Visibility", path: "/ops/tasks",                    icon: ClipboardList },
          { label: "CR Handoff Status",              path: "/authorizations/handoff",       icon: FileCheck2 },
          { label: "Phone System",                   path: "/phone",                        icon: Phone },
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
          { label: "Assistant State Dashboard", path: "/state-operations",              icon: LayoutDashboard },
          { label: "State Task Queue",          path: "/ops/tasks",                     icon: ClipboardList },
          { label: "Intake Support",            path: "/intake/dashboard",              icon: Briefcase },
          { label: "Recruiting Support",        path: "/recruiting/pipeline",           icon: UserPlus },
          { label: "Family Follow-Ups",         path: "/intake/parent-communication",   icon: MessageSquare },
          { label: "Document Chasing",          path: "/intake/missing-information",    icon: ShieldCheck },
          { label: "Staffing Support View",     path: "/ops/staffing",                  icon: Users },
          { label: "Scheduling Support View",   path: "/ops/scheduling",                icon: Calendar },
          { label: "Escalations",               path: "/ops/state-escalations",         icon: AlertTriangle },
          { label: "Authorization Support",     path: "/authorizations",                icon: ShieldCheck },
          { label: "State Clinical Snapshot",   path: "/qa-team",                       icon: Stethoscope },
        ],
      },
      STATE_TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------------------- State VA -------------------------------- */
  state_va: {
    sections: [
      {
        id: "state_va", label: "State VA", items: [
          { label: "VA Dashboard",                path: "/state-operations",               icon: LayoutDashboard },
          { label: "Assigned Tasks",              path: "/ops/tasks?owner=me",             icon: ClipboardList },
          { label: "My Tasks",                    path: "/tasks",                          icon: Briefcase },
          { label: "Recruiting Scheduling",       path: "/recruiting/pipeline?stage=interview", icon: CalendarClock },
          { label: "Missing Documents",           path: "/intake/missing-information",     icon: ShieldCheck },
          { label: "Data Cleanup",                path: "/ops/tasks?type=cleanup",         icon: List },
          { label: "Family / Applicant Notes",    path: "/intake/parent-communication",    icon: MessageSquare },
        ],
      },
      STATE_TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------ Regional State Director ------------------------- */
  regional_state_director: {
    sections: [
      {
        id: "regional", label: "Regional Oversight", items: [
          { label: "Regional Dashboard",           path: "/state-operations?tab=regional",          icon: LayoutDashboard },
          { label: "State Health Comparison",      path: "/state-operations?tab=comparison",        icon: Activity },
          { label: "State Director Scorecards",    path: "/reports?category=state-director-scorecard", icon: BarChart3 },
          { label: "State Director Coaching",      path: "/ops/tasks?type=coaching",                icon: Users },
          { label: "State Escalations",            path: "/ops/state-escalations",                  icon: AlertTriangle },
          { label: "Growth Readiness",             path: "/marketing/state-growth",                 icon: MapPin },
          { label: "Training / Mentor Program",    path: "/training",                               icon: GraduationCap },
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
          { label: "Marketing Dashboard",       path: "/marketing",                   icon: BarChart3 },
          { label: "Lead Source Inbox",         path: "/marketing/lead-source-inbox", icon: Inbox },
          { label: "Referral CRM",              path: "/marketing/referral-crm",      icon: HeartHandshake },
          { label: "Business Development",      path: "/business-development",        icon: Briefcase },
          { label: "Campaigns",                 path: "/marketing/campaigns",         icon: Megaphone },
          { label: "CTM / Call Tracking",       path: "/marketing/call-tracking",     icon: PhoneCall },
          { label: "LeadTrap",                  path: "/marketing/leadtrap",          icon: TrendingUp },
          { label: "Facebook Ads",              path: "/marketing/facebook-ads",      icon: Megaphone },
          { label: "Google Ads",                path: "/marketing/google-ads",        icon: TrendingUp },
          { label: "Email Marketing",           path: "/marketing/email-marketing",   icon: MessageSquare },
          { label: "SEO",                       path: "/marketing/seo",               icon: SearchIcon },
          { label: "Web Analytics",             path: "/marketing/web-analytics",     icon: LineChart },
          { label: "Reputation",                path: "/marketing/reputation",        icon: Star },
          { label: "State Growth",              path: "/marketing/state-growth",      icon: MapPin },
          { label: "Patient Lifetime Journey",  path: "/patient-journey",             icon: HeartHandshake },
          { label: "Phone System",              path: "/phone",                       icon: Phone },
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
          { label: "BD Dashboard",              path: "/business-development",                    icon: BarChart3 },
          { label: "Referral Partners",         path: "/marketing/referral-crm",                  icon: HeartHandshake },
          { label: "Outreach Visits",           path: "/business-development?tab=outreach",       icon: MessageSquare },
          { label: "State Growth Activity",     path: "/marketing/state-growth",                  icon: MapPin },
          { label: "Community Events",          path: "/business-development?tab=community",      icon: Users },
          { label: "Referral Follow-Ups",       path: "/business-development?tab=tasks",          icon: ClipboardList },
          { label: "Lead Source Contribution",  path: "/business-development?tab=sources",        icon: Inbox },
          { label: "State Campaign Support",    path: "/marketing/campaigns",                     icon: Megaphone },
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
          { label: "Leads",                      path: "/leads",                         icon: List },
          { label: "Missing Information",        path: "/intake/missing-information",    icon: ShieldCheck },
          { label: "After-Hours AI Calls",       path: "/phone/ai-calls",                icon: PhoneCall },
          { label: "Benefits Cheat Sheets",      path: "/intake/benefits-cheat-sheets",  icon: ShieldCheck },
          { label: "Tasks",                      path: "/tasks",                         icon: ClipboardList },
          { label: "CentralReach Packet Prep",   path: "/intake/cr-packet-prep",         icon: FileCheck2 },
        ],
      },
      {
        id: "training_resources",
        label: "Training & Resources",
        items: [
          { label: "Training Academy",     path: "/academy",                     icon: GraduationCap },
          { label: "Resource Library",     path: "/resource-library",            icon: BookOpen },
          { label: "Parent Communication", path: "/intake/parent-communication", icon: MessageSquare },
          { label: "Reports",              path: "/reports",                     icon: FileText },
        ],
      },
    ],
  },

  /* ------------------------------ Recruiting Team ---------------------------- */
  recruiting_team: {
    sections: [
      {
        id: "recruiting", label: "Recruiting", items: [
          { label: "Recruiting Dashboard",          path: "/recruiting-team",            icon: LayoutDashboard },
          { label: "Candidate Pipeline",            path: "/recruiting/pipeline",        icon: UserPlus },
          { label: "RBT Recruiting",                path: "/recruiting/rbt",             icon: UserCheck },
          { label: "BCBA Recruiting",               path: "/recruiting/bcba",            icon: Stethoscope },
          { label: "Interviews",                    path: "/recruiting/interviews",      icon: Calendar },
          { label: "Offers",                        path: "/recruiting/offers",          icon: FileSignature },
          { label: "Background / Onboarding Handoff", path: "/recruiting/onboarding",   icon: HeartHandshake },
          { label: "Ready-to-Staff Candidates",     path: "/recruiting/ready-to-staff",  icon: CheckCircle2 },
          { label: "State Staffing Demand Bridge",  path: "/recruiting/staffing-needs", icon: MapPin },
          { label: "Apploi Integration",            path: "/recruiting/apploi",          icon: Plug },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  recruiting_lead: {
    sections: [
      {
        id: "recruiting", label: "Recruiting", items: [
          { label: "Recruiting Dashboard",          path: "/recruiting-team",            icon: LayoutDashboard },
          { label: "Candidate Pipeline",            path: "/recruiting/pipeline",        icon: UserPlus },
          { label: "RBT Recruiting",                path: "/recruiting/rbt",             icon: UserCheck },
          { label: "BCBA Recruiting",               path: "/recruiting/bcba",            icon: Stethoscope },
          { label: "Interviews",                    path: "/recruiting/interviews",      icon: Calendar },
          { label: "Offers",                        path: "/recruiting/offers",          icon: FileSignature },
          { label: "Background / Onboarding Handoff", path: "/recruiting/onboarding",   icon: HeartHandshake },
          { label: "Ready-to-Staff Candidates",     path: "/recruiting/ready-to-staff",  icon: CheckCircle2 },
          { label: "State Staffing Demand Bridge",  path: "/recruiting/staffing-needs", icon: MapPin },
          { label: "Apploi Integration",            path: "/recruiting/apploi",          icon: Plug },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  recruiting_coordinator: {
    sections: [
      {
        id: "recruiting", label: "Recruiting", items: [
          { label: "Recruiting Dashboard",          path: "/recruiting-team",            icon: LayoutDashboard },
          { label: "Candidate Pipeline",            path: "/recruiting/pipeline",        icon: UserPlus },
          { label: "RBT Recruiting",                path: "/recruiting/rbt",             icon: UserCheck },
          { label: "BCBA Recruiting",               path: "/recruiting/bcba",            icon: Stethoscope },
          { label: "Interviews",                    path: "/recruiting/interviews",      icon: Calendar },
          { label: "Offers",                        path: "/recruiting/offers",          icon: FileSignature },
          { label: "Background / Onboarding Handoff", path: "/recruiting/onboarding",   icon: HeartHandshake },
          { label: "Ready-to-Staff Candidates",     path: "/recruiting/ready-to-staff",  icon: CheckCircle2 },
          { label: "State Staffing Demand Bridge",  path: "/recruiting/staffing-needs", icon: MapPin },
          { label: "Apploi Integration",            path: "/recruiting/apploi",          icon: Plug },
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
          { label: "Auth Queue",                  path: "/auth-workspace",                          icon: ShieldCheck },
          { label: "Initial Authorizations",      path: "/authorizations?stage=initial",            icon: FileSignature },
          { label: "Treatment Authorizations",    path: "/authorizations?stage=treatment",          icon: FileCheck2 },
          { label: "Reassessments / Renewals",    path: "/authorizations?stage=reassessment",       icon: Activity },
          { label: "Approved Authorizations",     path: "/authorizations?stage=approved",           icon: CheckCircle2 },
          { label: "Denials",                     path: "/authorizations?stage=denied",             icon: XCircle },
          { label: "Expiring Authorizations",     path: "/ops/expiring-authorizations",             icon: Calendar },
          { label: "Missing Docs",                path: "/ops/missing-docs",                        icon: AlertTriangle },
          { label: "Payer Requirements",          path: "/ops/payer-requirements",                  icon: FileSignature },
          { label: "Initial → Treatment Handoff", path: "/authorizations/handoff",                  icon: ChevronRight },
          { label: "CR Packet — Auth Section",    path: "/intake/cr-packet-prep?section=auth",      icon: FileCheck2 },
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
          { label: "Initial Authorizations",      path: "/authorizations?stage=initial",            icon: FileSignature },
          { label: "Treatment Authorizations",    path: "/authorizations?stage=treatment",          icon: FileCheck2 },
          { label: "Reassessments / Renewals",    path: "/authorizations?stage=reassessment",       icon: Activity },
          { label: "Approved Authorizations",     path: "/authorizations?stage=approved",           icon: CheckCircle2 },
          { label: "Denials",                     path: "/authorizations?stage=denied",             icon: XCircle },
          { label: "Expiring Authorizations",     path: "/ops/expiring-authorizations",             icon: Calendar },
          { label: "Missing Docs",                path: "/ops/missing-docs",                        icon: AlertTriangle },
          { label: "Payer Requirements",          path: "/ops/payer-requirements",                  icon: FileSignature },
          { label: "Initial → Treatment Handoff", path: "/authorizations/handoff",                  icon: ChevronRight },
          { label: "CR Packet — Auth Section",    path: "/intake/cr-packet-prep?section=auth",      icon: FileCheck2 },
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
          { label: "Scheduling Dashboard",       path: "/scheduling",                                    icon: LayoutDashboard },
          { label: "Assessment Scheduling",      path: "/scheduling-workspace?view=assessments",         icon: CalendarClock },
          { label: "Client Scheduling Readiness",path: "/scheduling-workspace?view=readiness",           icon: CheckCircle2 },
          { label: "Family Availability",        path: "/scheduling-workspace?view=family-availability", icon: HeartHandshake },
          { label: "Schedule Conflicts",         path: "/scheduling-workspace?view=conflicts",           icon: AlertTriangle },
          { label: "Start Date Readiness",       path: "/scheduling-workspace?view=start-dates",         icon: Calendar },
          { label: "Clinic Scheduling",          path: "/scheduling-workspace?view=clinic",              icon: Building2 },
          { label: "Field Scheduling",           path: "/scheduling-workspace?view=field",               icon: MapPin },
          { label: "CR Entry Coordination",      path: "/scheduling-workspace?view=cr-entry",            icon: FileCheck2 },
          { label: "Orientation Scheduling",     path: "/hr/orientation-queue",                          icon: CalendarClock },
          { label: "Cancellation Report",        path: "/reports/cancellation-command-center",           icon: ClipboardList },
          { label: "Make-Up Sessions",           path: "/ops/make-up-sessions",                          icon: Activity },
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
          { label: "Staffing Dashboard",          path: "/ops/staffing",                        icon: LayoutDashboard },
          { label: "Staffing Needed",             path: "/ops/staffing?tab=needed",             icon: Briefcase },
          { label: "Match Board",                 path: "/ops/staffing?tab=match-board",        icon: UserCheck },
          { label: "RBT Roster",                  path: "/scheduling/rbts",                     icon: Users },
          { label: "BCBA Roster",                 path: "/scheduling/bcbas",                    icon: Users },
          { label: "Family Staffing Preferences", path: "/ops/staffing?tab=preferences",        icon: HeartHandshake },
          { label: "Availability",                path: "/ops/staffing?tab=availability",       icon: Calendar },
          { label: "Restaffing",                  path: "/ops/staffing?tab=restaffing",         icon: Workflow },
          { label: "Capacity by State",           path: "/ops/staffing?tab=capacity",           icon: MapPin },
          { label: "Staffing Risk",               path: "/ops/staffing?tab=risk",               icon: AlertTriangle },
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
          { label: "HR Dashboard",             path: "/hr-team",                     icon: LayoutDashboard },
          { label: "Employees",                path: "/user-management",             icon: Users },
          { label: "HR Workspace",             path: "/hr/workspace",                icon: Workflow },
          { label: "Onboarding",               path: "/hr/new-hires",                icon: UserPlus },
          { label: "Employee Support",         path: "/hr/employee-support",         icon: LifeBuoy },
          { label: "Training Assignments",     path: "/hr/training-certifications",  icon: GraduationCap },
          { label: "Compliance",               path: "/hr/compliance",               icon: ShieldCheck },
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
          { label: "HR Dashboard",             path: "/hr-team",                     icon: LayoutDashboard },
          { label: "Employees",                path: "/user-management",             icon: Users },
          { label: "HR Workspace",             path: "/hr/workspace",                icon: Workflow },
          { label: "Onboarding",               path: "/hr/new-hires",                icon: UserPlus },
          { label: "Employee Support",         path: "/hr/employee-support",         icon: LifeBuoy },
          { label: "Training Assignments",     path: "/hr/training-certifications",  icon: GraduationCap },
          { label: "Compliance",               path: "/hr/compliance",               icon: ShieldCheck },
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
          { label: "BCBA Credentials",          path: "/credentialing/bcba",                  icon: IdCard },
          { label: "Uncredentialed BCBAs",      path: "/credentialing/uncredentialed-bcbas",  icon: AlertTriangle },
          { label: "Provider Credentialing",    path: "/credentialing/providers",             icon: Stethoscope },
          { label: "Insurance Credentialing",   path: "/credentialing/insurance",             icon: Building2 },
          { label: "Expiring Credentials",      path: "/credentialing/expiring",              icon: Calendar },
          { label: "VA Insurance Credentialing",path: "/credentialing/insurance?state=VA",    icon: Building2 },
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
          { label: "BCBA Credentials",          path: "/credentialing/bcba",                  icon: IdCard },
          { label: "Uncredentialed BCBAs",      path: "/credentialing/uncredentialed-bcbas",  icon: AlertTriangle },
          { label: "Provider Credentialing",    path: "/credentialing/providers",             icon: Stethoscope },
          { label: "Insurance Credentialing",   path: "/credentialing/insurance",             icon: Building2 },
          { label: "Expiring Credentials",      path: "/credentialing/expiring",              icon: Calendar },
          { label: "VA Insurance Credentialing",path: "/credentialing/insurance?state=VA",    icon: Building2 },
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
          { label: "QA Dashboard",                    path: "/qa-team",               icon: LayoutDashboard },
          { label: "Packet QA",                       path: "/qa-workspace",          icon: FileSignature },
          { label: "Treatment / Auth Readiness Review", path: "/authorization-reviews", icon: ClipboardCheck },
          { label: "Document Completeness",           path: "/missing-information",   icon: FileCheck2 },
          { label: "Corrections",                     path: "/qa-queue",              icon: AlertTriangle },
          { label: "Clinical Readiness Snapshot",     path: "/ops/qa",                icon: Stethoscope },
          { label: "CR Creation Verification",        path: "/qa/board",              icon: ClipboardCheck },
          { label: "QA Tasks",                        path: "/escalations-followups", icon: Flame },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  qa_director: {
    sections: [
      {
        id: "qa", label: "QA", items: [
          { label: "QA Dashboard",                    path: "/qa-team",               icon: LayoutDashboard },
          { label: "Packet QA",                       path: "/qa-workspace",          icon: FileSignature },
          { label: "Treatment / Auth Readiness Review", path: "/authorization-reviews", icon: ClipboardCheck },
          { label: "Document Completeness",           path: "/missing-information",   icon: FileCheck2 },
          { label: "Corrections",                     path: "/qa-queue",              icon: AlertTriangle },
          { label: "Clinical Readiness Snapshot",     path: "/ops/qa",                icon: Stethoscope },
          { label: "CR Creation Verification",        path: "/qa/board",              icon: ClipboardCheck },
          { label: "QA Tasks",                        path: "/escalations-followups", icon: Flame },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  qa_specialist: {
    sections: [
      {
        id: "qa", label: "QA", items: [
          { label: "QA Dashboard",                    path: "/qa-team",               icon: LayoutDashboard },
          { label: "Packet QA",                       path: "/qa-workspace",          icon: FileSignature },
          { label: "Treatment / Auth Readiness Review", path: "/authorization-reviews", icon: ClipboardCheck },
          { label: "Document Completeness",           path: "/missing-information",   icon: FileCheck2 },
          { label: "Corrections",                     path: "/qa-queue",              icon: AlertTriangle },
          { label: "Clinical Readiness Snapshot",     path: "/ops/qa",                icon: Stethoscope },
          { label: "CR Creation Verification",        path: "/qa/board",              icon: ClipboardCheck },
          { label: "QA Tasks",                        path: "/escalations-followups", icon: Flame },
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
          { label: "Clinical Readiness Dashboard", path: "/clinical-director",       icon: LayoutDashboard },
          { label: "Command Centers",              path: "/clinical-leadership",     icon: LayoutDashboard },
          { label: "CentralReach Handoff Queue",   path: "/qa/board",                icon: ClipboardCheck },
          { label: "Evaluation Readiness",         path: "/evaluations",             icon: FileCheck2 },
          { label: "Assigned BCBAs",               path: "/assigned-bcbas",          icon: UserCheck },
          { label: "Supervision Visibility",       path: "/supervision-visibility",  icon: Eye },
          { label: "Operational Blockers",         path: "/escalations-followups",   icon: AlertTriangle },
          { label: "QA / Correction Visibility",   path: "/qa-team",                 icon: ShieldCheck },
          { label: "Phone",                        path: "/phone",                   icon: Phone },
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
          { label: "Home",           path: "/bcba/home",     icon: Home },
          { label: "Caseload",       path: "/bcba/caseload", icon: UserCheck },
          { label: "My RBTs",        path: "/bcba/rbts",     icon: Users },
          { label: "Supervision",    path: "/bcba/supervision", icon: ShieldCheck },
          { label: "Assessments",    path: "/bcba/assessments", icon: ClipboardList },
          { label: "Progress Reports", path: "/bcba/progress-reports", icon: ClipboardList },
          { label: "Parent Training", path: "/bcba/parent-training", icon: Users },
          { label: "Productivity",   path: "/bcba/productivity", icon: TrendingUp },
          { label: "Clinical Work",  path: "/bcba/clinical", icon: ClipboardList },
          { label: "My Fellows",     path: "/bcba/fellowship",  icon: GraduationCap },
          { label: "Academy",        path: "/bcba/academy",         icon: GraduationCap },
          { label: "Support",        path: "/bcba/support-center",  icon: LifeBuoy },
          { label: "Me",             path: "/bcba/me",       icon: User },
        ],
      },
    ],
  },

  /* -------------------------------- Case Manager ----------------------------- */
  case_manager: {
    sections: [
      {
        id: "case_management", label: "Case Management", items: [
          { label: "Case Manager Dashboard",     path: "/case-manager",                 icon: LayoutDashboard },
          { label: "Active Patient Follow-Ups",  path: "/case-manager/follow-ups",      icon: Bell },
          { label: "Family Communication",       path: "/case-manager/communication",   icon: MessageSquare },
          { label: "Service Issues",             path: "/case-manager/service-issues",  icon: AlertTriangle },
          { label: "Scheduling Visibility",      path: "/case-manager/scheduling",      icon: Calendar },
          { label: "Staffing Visibility",        path: "/case-manager/staffing",        icon: Users },
          { label: "Authorization Visibility",   path: "/case-manager/authorizations",  icon: ShieldCheck },
          { label: "Escalations",                path: "/case-manager/escalations",     icon: Flame },
          { label: "Community / Resources",      path: "/case-manager/community",       icon: HeartHandshake },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* ------------------------------------ RBT ---------------------------------- */
  rbt: {
    sections: [
      {
        id: "rbt_app", label: "My Blossom", items: [
          { label: "Home",     path: "/rbt/app/home",     icon: Home },
          { label: "Schedule", path: "/rbt/app/schedule", icon: Calendar },
          { label: "Learn",    path: "/rbt/app/learn",    icon: GraduationCap },
          { label: "Support",  path: "/rbt/app/support",  icon: LifeBuoy },
          { label: "Me",       path: "/rbt/app/me",       icon: User },
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

  /* --------------------- Training Manager / Enablement -------------------- */
  training_manager: {
    sections: [
      {
        id: "training_governance", label: "Training Governance", items: [
          { label: "Training Management",       path: "/hr/training-center",                       icon: LayoutDashboard },
          { label: "Journey Builder",           path: "/hr/training-center?nav=journeys",          icon: Workflow },
          { label: "Role Training Assignments", path: "/hr/training-center?nav=role-journeys",     icon: UserCheck },
          { label: "Completion Dashboard",      path: "/admin/training-statistics",                icon: Gauge },
          { label: "RBT Training",              path: "/training/rbt-admin",                       icon: GraduationCap },
          { label: "BCBA Training",             path: "/bcba/training-academy",                    icon: GraduationCap },
          { label: "State Director Training",   path: "/training",                                 icon: GraduationCap },
          { label: "Resource Library Admin",    path: "/resource-library?admin=1",                 icon: Library },
          { label: "SOP / Policy Resources",    path: "/resource-library?section=sop",             icon: FileText },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------- Finance / Controller / Billing (Visibility) -------------------- */
  billing_finance: {
    sections: [
      {
        id: "finance", label: "Finance Visibility", items: [
          { label: "Finance Snapshot",                     path: "/billing-finance",                            icon: Gauge },
          { label: "RCM / Billing Visibility",             path: "/billing-finance?tab=rcm",                    icon: ShieldCheck },
          { label: "Collections / AR Snapshot",            path: "/billing-finance?tab=collections",            icon: AlertTriangle },
          { label: "Payment Plan Visibility",              path: "/billing-finance?tab=payment-plans",          icon: ClipboardList },
          { label: "Write-Off / Denial Review Visibility", path: "/billing-finance?tab=write-offs",             icon: Flame },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------- Office Manager / HR Assistant -------------------- */
  office_manager: {
    sections: [
      {
        id: "office_ops", label: "Office Operations", items: [
          { label: "Office Dashboard",        path: "/work-queue?scope=office",                         icon: LayoutDashboard },
          { label: "Office Tasks",            path: "/work-queue?scope=office&view=tasks",              icon: ClipboardList },
          { label: "Supplies / Inventory",    path: "/device-inventory?category=supplies",              icon: Library },
          { label: "Device Requests",         path: "/device-requests",                                 icon: ShieldCheck },
          { label: "Shipping / UPS",          path: "/work-queue?scope=office&view=shipping",           icon: Workflow },
          { label: "Ramp / Purchasing Support", path: "/work-queue?scope=office&view=purchasing",       icon: FileText },
          { label: "Lunch Orders",            path: "/work-queue?scope=office&view=lunch",              icon: ClipboardList },
          { label: "Scanning / AP Support",   path: "/work-queue?scope=office&view=scanning",           icon: FileText },
          { label: "Employee Setup Support",  path: "/user-management?scope=office",                    icon: UserCheck },
          { label: "Requests",                path: "/system/request-intake",                           icon: AlertTriangle },
        ],
      },
      TRAINING_AND_RESOURCES,
    ],
  },

  /* --------------------- Clinic Growth-to-Launch / Director of Clinics -------------------- */
  clinic_growth: {
    sections: [
      {
        id: "clinic_growth", label: "Clinic Growth to Launch", items: [
          { label: "Clinic Growth Dashboard",         path: "/executive/growth-readiness?scope=clinic",          icon: LayoutDashboard },
          { label: "Clinic Leads",                    path: "/leads?scope=clinic",                                icon: Users },
          { label: "Clinic Intake Support",           path: "/intake?scope=clinic",                               icon: ClipboardList },
          { label: "Clinic Marketing Activity",       path: "/marketing/state-growth?scope=clinic",               icon: BarChart3 },
          { label: "Clinic Authorization Readiness",  path: "/authorizations?view=readiness&scope=clinic",        icon: ShieldCheck },
          { label: "Clinic Recruiting / Hiring Readiness", path: "/recruiting?view=readiness&scope=clinic",       icon: UserCheck },
          { label: "Clinic Onboarding Readiness",     path: "/hr/new-hires?scope=clinic",                         icon: Workflow },
          { label: "Clinic Training Readiness",       path: "/admin/training-statistics?scope=clinic",            icon: GraduationCap },
          { label: "Clinic Staffing Readiness",       path: "/staffing?view=readiness&scope=clinic",              icon: Users },
          { label: "First 97153 Milestone",           path: "/executive/growth-readiness?milestone=97153",        icon: Flame },
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
  { label: "COO / Operating Owner",       role: "coo" },
  { label: "Executive Leadership",        role: "executive_leadership" },
  { label: "Operations Leadership",       role: "operations_leadership" },
  { label: "State Director",              role: "state_director" },
  { label: "State Director Assistant",    role: "assistant_state_director" },
  { label: "Regional State Director",     role: "regional_state_director" },
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
  { label: "Director of RCM / Benefits",  role: "billing_finance" },
  { label: "Training Manager / Enablement", role: "training_manager" },
  { label: "Office Manager / HR Assistant", role: "office_manager" },
  { label: "Clinic Growth-to-Launch",       role: "clinic_growth" },
];