import {
  GraduationCap, BookOpen, FileText, Phone, ClipboardCheck,
  Megaphone, BarChart3, Search as SearchIcon, Globe, PhoneCall,
  HeartHandshake, Users, MessageSquare, Star, TrendingUp, Briefcase,
  Building2, Wallet, ShieldCheck, Wrench, IdCard,
  Calendar, FileSignature, ClipboardList, UserCheck,
  Brain, LayoutDashboard, type LucideIcon,
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

/** Placeholder route used for "coming soon" entries — they render disabled. */
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
      cs("Business Development Dashboard", HeartHandshake),
      cs("Referral CRM", HeartHandshake),
      cs("Lead Sources", TrendingUp),
      cs("Campaigns", Megaphone),
      cs("CTM / Call Tracking", PhoneCall),
      cs("LeadTrap", TrendingUp),
      cs("Facebook Ads", Megaphone),
      cs("Google Ads", TrendingUp),
      cs("Patient Lifetime Journey", HeartHandshake),
      cs("Intake Dashboard", Briefcase),
      cs("Lead Benefits Cheat Sheets", ShieldCheck),
      cs("SEO & Content", SearchIcon),
      cs("Web Analytics", Globe),
      cs("Recruiting Marketing", Briefcase),
      cs("Community Outreach", Users),
      cs("Reputation", Star),
      cs("Attribution & ROI", BarChart3),
    ],
  },
  hr_team: {
    active: [
      ...BASE_ACTIVE,
      { label: "Phone System", path: "/phone", icon: Phone },
    ],
    comingSoon: [
      cs("Employee Directory", Users),
      cs("Employee Ops", HeartHandshake),
      cs("Training Management", GraduationCap),
      cs("Payroll", Wallet),
      cs("HR Suite", Building2),
      cs("Device Inventory", Wrench),
    ],
  },
  case_manager: {
    active: [
      ...BASE_ACTIVE,
      { label: "Evaluations", path: "/evaluations", icon: ClipboardCheck },
    ],
    comingSoon: [
      cs("Case Management", IdCard),
      cs("Family Follow-Up", MessageSquare),
      cs("Client Notes", FileSignature),
      cs("Scheduling", Calendar),
      cs("Authorizations", ShieldCheck),
    ],
  },
  business_development: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Business Development Dashboard", TrendingUp),
      cs("Referral CRM", HeartHandshake),
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
      cs("Staffing Queue", Users),
      cs("Coverage Map", Calendar),
      cs("Pairings", UserCheck),
    ],
  },
  credentialing_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Credentialing Queue", IdCard),
      cs("Expirations", ShieldCheck),
      cs("Provider Files", FileSignature),
    ],
  },
  clinical_director: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Clinical Dashboard", BarChart3),
      cs("Supervision", ClipboardCheck),
      cs("BCBA Roster", UserCheck),
      cs("Treatment Plan Reviews", FileSignature),
    ],
  },
  assistant_state_director: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("State Work Queue", ClipboardList),
      cs("Local Escalations", ShieldCheck),
      cs("State Staffing", Users),
    ],
  },
  executive_leadership: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Executive Dashboard", BarChart3),
      cs("State Comparisons", Globe),
      cs("Financial Overview", Wallet),
      cs("Staffing Health", Users),
    ],
  },
  operations_leadership: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Operations Command Center", BarChart3),
      cs("Department Health", HeartHandshake),
      cs("Workflow Risks", ShieldCheck),
      cs("Escalations", ClipboardList),
    ],
  },
  state_director: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("State Work Queue", ClipboardList),
      cs("State Staffing", Users),
      cs("State Pipeline", TrendingUp),
      cs("Local Escalations", ShieldCheck),
    ],
  },
  intake_coordinator: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Intake Dashboard", Briefcase),
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
      cs("Authorization Queue", ShieldCheck),
      cs("Auth Risk Center", BarChart3),
      cs("Auth Utilization", TrendingUp),
    ],
  },
  scheduling_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Scheduling Queue", Calendar),
      cs("Staffing Coverage", Users),
      cs("RBT Roster", UserCheck),
      cs("BCBA Roster", UserCheck),
    ],
  },
  recruiting_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Recruiting Pipeline", Briefcase),
      cs("Interviews", ClipboardList),
      cs("Offers", FileSignature),
      cs("Orientation", GraduationCap),
    ],
  },
  billing_finance: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Billing Queue", Wallet),
      cs("Claims", FileText),
      cs("Credentialing", IdCard),
      cs("Payer Problems", ShieldCheck),
    ],
  },
  qa_team: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("QA Queue", ClipboardCheck),
      cs("Treatment Plans", FileSignature),
      cs("Progress Reports", FileText),
      cs("Compliance", ShieldCheck),
    ],
  },
  payroll_coordinator: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Payroll Workspace", Wallet),
      cs("Hours / Time", Calendar),
      cs("Adjustments", FileSignature),
      cs("PTO", HeartHandshake),
    ],
  },
  bcba: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("My Clients", UserCheck),
      cs("Treatment Plans", FileSignature),
      cs("Supervision", ClipboardCheck),
      cs("Parent Training", HeartHandshake),
    ],
  },
  rbt: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("My Day", Calendar),
      cs("My Schedule", Calendar),
      cs("My Clients", UserCheck),
      cs("Session Support", MessageSquare),
    ],
  },
  behavioral_support: {
    active: BASE_ACTIVE,
    comingSoon: [
      cs("Support Cases", HeartHandshake),
      cs("Behavior Plans", FileSignature),
    ],
  },
  viewer: {
    active: BASE_ACTIVE,
    comingSoon: [],
  },
};

/** Fallback for any role without an explicit menu definition. */
export const DEFAULT_ROLE_MENU: RoleMenu = {
  active: BASE_ACTIVE,
  comingSoon: [],
};

/**
 * Roles surfaced in the Super Admin "View as Role" preview switcher.
 * Order matters — this is what shows up in the dropdown.
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