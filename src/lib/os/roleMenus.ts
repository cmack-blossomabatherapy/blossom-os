import {
  GraduationCap, BookOpen, FileText, Phone, ClipboardCheck,
  Megaphone, BarChart3, Search as SearchIcon, Globe, PhoneCall,
  HeartHandshake, Users, MessageSquare, Star, TrendingUp, Briefcase,
  Building2, Wallet, ShieldCheck, Wrench, IdCard,
  Calendar, FileSignature, ClipboardList, UserCheck,
  LayoutDashboard, AlertTriangle, MapPin, Stethoscope, CheckCircle2,
  XCircle, Gauge, LineChart, Activity, type LucideIcon,
} from "lucide-react";
import type { OSRole } from "./permissions";

export interface RoleMenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface RoleMenu {
  /** Sections rendered as active nav items. */
  active: RoleMenuItem[];
  /** Sections rendered as locked "Coming Soon" items. */
  comingSoon: RoleMenuItem[];
}

/**
 * Base active items every non-Super-Admin role gets by default:
 *   Training Academy, Resource Library, Reports.
 * Specific roles extend this (Phone System, Evaluations, etc).
 */
const BASE_ACTIVE: RoleMenuItem[] = [
  { label: "My Dashboard",     path: "/dashboard", icon: LayoutDashboard },
  { label: "Training Academy", path: "/academy",   icon: GraduationCap },
  { label: "Resource Library", path: "/resources", icon: BookOpen },
  { label: "Reports",          path: "/reports",   icon: FileText },
];

/** Placeholder route used for "coming soon" entries - they render disabled. */
const SOON = "/coming-soon";

const cs = (label: string, icon: LucideIcon): RoleMenuItem => ({
  label,
  path: `${SOON}?module=${encodeURIComponent(label)}`,
  icon,
});

export const ROLE_MENUS: Partial<Record<OSRole, RoleMenu>> = {
  marketing_team: {
    active: [
      ...BASE_ACTIVE,
      { label: "Phone System", path: "/phone", icon: Phone },
    ],
    comingSoon: [
      cs("Marketing Dashboard", BarChart3),
      cs("Referral CRM", HeartHandshake),
      cs("Lead Sources", TrendingUp),
      cs("Campaigns", Megaphone),
      cs("CTM / Call Tracking", PhoneCall),
      cs("LeadTrap", TrendingUp),
      cs("Facebook Ads", Megaphone),
      cs("Google Ads", TrendingUp),
      cs("Patient Lifetime Journey", HeartHandshake),
      cs("SEO & Content", SearchIcon),
      cs("Web Analytics", LineChart),
      cs("Recruiting Marketing", Briefcase),
      cs("Community Outreach", Users),
      cs("Reputation", Star),
      cs("Attribution & ROI", Gauge),
    ],
  },
  hr_team: {
    active: [
      ...BASE_ACTIVE,
      { label: "Phone System", path: "/phone", icon: Phone },
    ],
    comingSoon: [
      cs("HR Dashboard", LayoutDashboard),
      cs("Employee Records", Users),
      cs("HR Requests", ClipboardList),
      cs("Compliance Items", ShieldCheck),
      cs("Device Requests", Wrench),
      cs("Device Inventory", Wrench),
      cs("NFC Badge Support", IdCard),
      cs("HR Reports", BarChart3),
    ],
  },
  case_manager: {
    active: [
      ...BASE_ACTIVE,
      { label: "Evaluations", path: "/evaluations", icon: ClipboardCheck },
    ],
    comingSoon: [
      cs("Case Manager Dashboard", LayoutDashboard),
      cs("Caseload", Users),
      cs("Client Follow-Up", MessageSquare),
      cs("Care Coordination", HeartHandshake),
      cs("Family Communication", MessageSquare),
      cs("Case Notes", FileSignature),
    ],
  },
  business_development: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Business Development Dashboard", LayoutDashboard),
      cs("Referral Partner CRM", HeartHandshake),
      cs("Outreach Pipeline", MessageSquare),
      cs("Follow-Up Tasks", ClipboardList),
      cs("Provider Relationships", Briefcase),
      cs("Community Relationships", Users),
      cs("Patient Lifetime Journey", HeartHandshake),
    ],
  },
  staffing_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Staffing Dashboard", LayoutDashboard),
      cs("Open Cases", Briefcase),
      cs("RBT Match Queue", UserCheck),
      cs("Coverage Needs", Calendar),
      cs("Family Staffing Preferences", HeartHandshake),
      cs("Staffing Reports", BarChart3),
    ],
  },
  credentialing_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Credentialing Dashboard", LayoutDashboard),
      cs("Provider Credentialing", Stethoscope),
      cs("Insurance Credentialing", Building2),
      cs("BCBA Credentials", IdCard),
      cs("Uncredentialed BCBAs", AlertTriangle),
      cs("Expiring Credentials", Calendar),
      cs("Credentialing Reports", BarChart3),
    ],
  },
  clinical_director: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Clinical Dashboard", LayoutDashboard),
      cs("BCBA Oversight", UserCheck),
      cs("Clinical Quality", CheckCircle2),
      cs("Supervision Health", ClipboardCheck),
      cs("Clinical Escalations", AlertTriangle),
      cs("Clinical Reports", BarChart3),
    ],
  },
  assistant_state_director: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("State Support Dashboard", LayoutDashboard),
      cs("State Intake Support", Briefcase),
      cs("State Task Queue", ClipboardList),
      cs("Escalation Support", AlertTriangle),
      cs("Follow-Up Tracker", Activity),
    ],
  },
  executive_leadership: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Executive Dashboard", LayoutDashboard),
      cs("Company KPIs", BarChart3),
      cs("State Health Overview", MapPin),
      cs("Growth Snapshot", TrendingUp),
      cs("Operations Scorecard", Gauge),
    ],
  },
  operations_leadership: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Operations Dashboard", LayoutDashboard),
      cs("Department Scorecards", Gauge),
      cs("State Health Overview", MapPin),
      cs("Escalations", AlertTriangle),
      cs("Workflow Bottlenecks", ShieldCheck),
      cs("System Requests", ClipboardList),
    ],
  },
  state_director: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("State Dashboard", LayoutDashboard),
      cs("State Health", MapPin),
      cs("Escalations", AlertTriangle),
      cs("State Staffing Snapshot", Users),
      cs("State Intake Snapshot", Briefcase),
      cs("State Authorization Snapshot", ShieldCheck),
      cs("State Clinical Snapshot", Stethoscope),
    ],
  },
  intake_coordinator: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Intake Dashboard", LayoutDashboard),
      cs("New Referral Queue", ClipboardList),
      cs("Lead To Active Pipeline", TrendingUp),
      cs("Missing Information", ShieldCheck),
      cs("Parent Communication", MessageSquare),
      cs("Intake Tasks", ClipboardList),
      cs("Lead Benefits Cheat Sheets", ShieldCheck),
      cs("Patient Lifetime Journey", HeartHandshake),
    ],
  },
  authorization_coordinator: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Authorizations Dashboard", LayoutDashboard),
      cs("Auth Queue", ShieldCheck),
      cs("Approved Authorizations", CheckCircle2),
      cs("Expiring Authorizations", Calendar),
      cs("Denials", XCircle),
      cs("Missing Docs", AlertTriangle),
      cs("Payer Requirements", FileSignature),
      cs("Authorization Reports", BarChart3),
    ],
  },
  scheduling_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Scheduling Dashboard", LayoutDashboard),
      cs("Schedule Gaps", AlertTriangle),
      cs("Session Coverage", Calendar),
      cs("Cancellations", XCircle),
      cs("Make-Up Sessions", Activity),
      cs("Scheduling Reports", BarChart3),
    ],
  },
  recruiting_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Recruiting Dashboard", LayoutDashboard),
      cs("Candidate Pipeline", Briefcase),
      cs("Hiring Sources", TrendingUp),
      cs("Interview Scheduling", Calendar),
      cs("Offer Tracker", FileSignature),
      cs("Onboarding Handoff", HeartHandshake),
      cs("Recruiting Reports", BarChart3),
    ],
  },
  qa_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("QA Dashboard", LayoutDashboard),
      cs("Documentation Review", FileSignature),
      cs("Session Note Review", FileText),
      cs("Compliance Issues", AlertTriangle),
      cs("QA Reports", BarChart3),
    ],
  },
  bcba: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("BCBA Dashboard", LayoutDashboard),
      cs("Caseload", UserCheck),
      cs("Supervision", ClipboardCheck),
      cs("Treatment Plans", FileSignature),
      cs("Parent Training", HeartHandshake),
      cs("Clinical Documentation", FileText),
      cs("Evaluations", ClipboardCheck),
    ],
  },
  rbt: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("RBT Dashboard", LayoutDashboard),
      cs("My Clients", UserCheck),
      cs("Session Support", MessageSquare),
      cs("Supervision Notes", ClipboardCheck),
      cs("Nonbillable Points", Activity),
      cs("Career Path", TrendingUp),
    ],
  },
  behavioral_support: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Behavioral Support Dashboard", LayoutDashboard),
      cs("Crisis Support", AlertTriangle),
      cs("Behavior Escalations", AlertTriangle),
      cs("Support Plans", FileSignature),
      cs("Follow-Up Tracker", Activity),
    ],
  },
};

/** Fallback for any role without an explicit menu definition. */
export const DEFAULT_ROLE_MENU: RoleMenu = {
  active: BASE_ACTIVE,
  comingSoon: [],
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