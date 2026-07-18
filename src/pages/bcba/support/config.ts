import type { LucideIcon } from "lucide-react";
import {
  FileCheck, FileText, ShieldCheck, CalendarClock, Users, UserX,
  Heart, Cable, DollarSign, ClipboardList, Stethoscope, AlertTriangle,
  BadgeCheck, GraduationCap, HelpCircle,
} from "lucide-react";

export type SupportCategoryKey =
  | "authorization" | "progress_report" | "qa" | "scheduling" | "staffing"
  | "rbt_performance" | "parent_caregiver" | "centralreach" | "billing"
  | "assessment" | "clinical_leadership" | "safety" | "credentialing"
  | "fellowship" | "other";

export interface SupportCategory {
  key: SupportCategoryKey;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultTeam: string;
  defaultSlaHours: number;
  defaultUrgency: "low" | "normal" | "high" | "urgent";
  friendlyOwner: string;
  containsClientDetailsDefault: boolean;
}

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  { key: "authorization",       label: "Authorization question",       description: "Approvals, expirations, unit questions.",    icon: FileCheck,     defaultTeam: "Authorization Team", defaultSlaHours: 24, defaultUrgency: "normal", friendlyOwner: "Authorization Team",          containsClientDetailsDefault: true },
  { key: "progress_report",     label: "Progress-report support",      description: "Timelines, templates, signatures.",           icon: FileText,      defaultTeam: "QA Team",             defaultSlaHours: 48, defaultUrgency: "normal", friendlyOwner: "QA Team",                     containsClientDetailsDefault: true },
  { key: "qa",                  label: "QA question",                  description: "Corrections, review process, expectations.",  icon: ShieldCheck,   defaultTeam: "QA Team",             defaultSlaHours: 48, defaultUrgency: "normal", friendlyOwner: "QA Team",                     containsClientDetailsDefault: false },
  { key: "scheduling",          label: "Scheduling issue",             description: "Coverage, conflicts, schedule changes.",      icon: CalendarClock, defaultTeam: "Scheduling",          defaultSlaHours: 24, defaultUrgency: "high",   friendlyOwner: "Scheduling Team",             containsClientDetailsDefault: true },
  { key: "staffing",            label: "Staffing concern",             description: "Coverage gaps, RBT availability.",            icon: Users,         defaultTeam: "Scheduling",          defaultSlaHours: 24, defaultUrgency: "high",   friendlyOwner: "Scheduling Team",             containsClientDetailsDefault: true },
  { key: "rbt_performance",     label: "RBT performance concern",      description: "Skills, feedback, coaching support.",         icon: UserX,         defaultTeam: "Clinical Leadership", defaultSlaHours: 48, defaultUrgency: "normal", friendlyOwner: "Clinical Leadership",         containsClientDetailsDefault: false },
  { key: "parent_caregiver",    label: "Parent / caregiver issue",     description: "Family communication or concern.",            icon: Heart,         defaultTeam: "Clinical Leadership", defaultSlaHours: 24, defaultUrgency: "high",   friendlyOwner: "Clinical Leadership",         containsClientDetailsDefault: true },
  { key: "centralreach",        label: "CentralReach problem",         description: "System errors, missing data, access.",        icon: Cable,         defaultTeam: "Operations",          defaultSlaHours: 24, defaultUrgency: "normal", friendlyOwner: "Operations",                  containsClientDetailsDefault: false },
  { key: "billing",             label: "Billing / service-code question", description: "Codes, session details, corrections.",     icon: DollarSign,    defaultTeam: "Billing & Finance",   defaultSlaHours: 72, defaultUrgency: "normal", friendlyOwner: "Billing & Finance",           containsClientDetailsDefault: false },
  { key: "assessment",          label: "Assessment resource",          description: "Tools, templates, guidance.",                 icon: ClipboardList, defaultTeam: "Clinical Leadership", defaultSlaHours: 72, defaultUrgency: "low",    friendlyOwner: "Clinical Leadership",         containsClientDetailsDefault: false },
  { key: "clinical_leadership", label: "Clinical leadership consultation", description: "Case guidance, decisions, oversight.",   icon: Stethoscope,   defaultTeam: "Clinical Leadership", defaultSlaHours: 24, defaultUrgency: "high",   friendlyOwner: "Clinical Leadership",         containsClientDetailsDefault: true },
  { key: "safety",              label: "Safety or incident",           description: "Safety concerns or reportable incidents.",    icon: AlertTriangle, defaultTeam: "Clinical Leadership", defaultSlaHours: 2,  defaultUrgency: "urgent", friendlyOwner: "Clinical Leadership + Ops",   containsClientDetailsDefault: true },
  { key: "credentialing",       label: "Credentialing",                description: "BACB, state, insurance credentialing.",       icon: BadgeCheck,    defaultTeam: "HR / Credentialing",  defaultSlaHours: 72, defaultUrgency: "normal", friendlyOwner: "Credentialing Team",          containsClientDetailsDefault: false },
  { key: "fellowship",          label: "Fellowship supervision",       description: "Fieldwork hours, supervision support.",       icon: GraduationCap, defaultTeam: "Clinical Leadership", defaultSlaHours: 48, defaultUrgency: "normal", friendlyOwner: "Fellowship / Clinical Leads", containsClientDetailsDefault: false },
  { key: "other",               label: "Other",                        description: "Anything else — we'll route it.",             icon: HelpCircle,    defaultTeam: "Operations",          defaultSlaHours: 48, defaultUrgency: "normal", friendlyOwner: "Operations",                  containsClientDetailsDefault: false },
];

export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  routed: "Routed",
  in_progress: "In progress",
  waiting_on_bcba: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
  escalated: "Escalated",
};

export const SUPPORT_STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  routed: "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  waiting_on_bcba: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  escalated: "bg-rose-50 text-rose-700 border-rose-200",
};

export const URGENCY_STYLES: Record<string, string> = {
  low: "bg-slate-50 text-slate-600 border-slate-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
};

export function categoryFor(key: string) {
  return SUPPORT_CATEGORIES.find((c) => c.key === key) ?? SUPPORT_CATEGORIES[SUPPORT_CATEGORIES.length - 1];
}