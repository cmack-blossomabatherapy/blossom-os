/**
 * Blossom Identity System — Role variants for the NFC public profile.
 *
 * One shared shell (NfcPublicProfile) renders the same elegant card for
 * everyone. The variant below contributes the small differences that make
 * each role feel intentional: eyebrow label, accent treatment, and which
 * primary actions surface first.
 */
import {
  PhoneCall, ShieldAlert, Mail, Phone, UserPlus, Globe, Calendar,
  MessageCircle, Briefcase, GraduationCap, Users, HeartHandshake,
  ClipboardList, FileSpreadsheet, Sparkles, Building2, Megaphone,
  BadgeCheck, Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoleKey =
  | "rbt" | "bcba" | "case_manager" | "intake" | "authorizations"
  | "scheduling" | "recruiting" | "hr" | "finance" | "qa"
  | "marketing" | "state_director" | "leadership" | "executive" | "employee";

export type NfcActionKind =
  | "email" | "call" | "save_contact" | "website"
  | "report_concern" | "support_line" | "schedule" | "message";

export type RoleVariant = {
  /** Tiny uppercase label above the name (e.g. "Clinical · BCBA"). */
  eyebrow: string;
  /** Icon paired with the eyebrow. */
  icon: LucideIcon;
  /** One sentence the family/coworker reads under the name. */
  tagline: string;
  /** Action buttons in display order (max 4 — keep it calm). */
  actions: NfcActionKind[];
  /** Whether to default to the "parent safety" reduced-contact treatment. */
  parentSafety: boolean;
};

export const ROLE_VARIANTS: Record<RoleKey, RoleVariant> = {
  rbt: {
    eyebrow: "Clinical · RBT",
    icon: Stethoscope,
    tagline: "Registered Behavior Technician at Blossom ABA Therapy.",
    actions: ["support_line", "report_concern"],
    parentSafety: true,
  },
  bcba: {
    eyebrow: "Clinical · BCBA",
    icon: BadgeCheck,
    tagline: "Board Certified Behavior Analyst at Blossom ABA Therapy.",
    actions: ["email", "schedule", "save_contact"],
    parentSafety: false,
  },
  case_manager: {
    eyebrow: "Family Support",
    icon: HeartHandshake,
    tagline: "Your family's point of contact at Blossom.",
    actions: ["call", "email", "schedule", "save_contact"],
    parentSafety: false,
  },
  intake: {
    eyebrow: "Intake",
    icon: ClipboardList,
    tagline: "Helps new families start care with Blossom.",
    actions: ["call", "email", "schedule", "save_contact"],
    parentSafety: false,
  },
  authorizations: {
    eyebrow: "Authorizations",
    icon: FileSpreadsheet,
    tagline: "Keeps your treatment authorization on track.",
    actions: ["email", "call", "save_contact"],
    parentSafety: false,
  },
  scheduling: {
    eyebrow: "Scheduling",
    icon: Calendar,
    tagline: "Coordinates session schedules across the team.",
    actions: ["call", "email", "save_contact"],
    parentSafety: false,
  },
  recruiting: {
    eyebrow: "Talent · Recruiting",
    icon: Users,
    tagline: "Hiring exceptional BCBAs & RBTs for Blossom.",
    actions: ["email", "schedule", "save_contact", "website"],
    parentSafety: false,
  },
  hr: {
    eyebrow: "People · HR",
    icon: Users,
    tagline: "Supporting every Blossom team member.",
    actions: ["email", "call", "save_contact"],
    parentSafety: false,
  },
  finance: {
    eyebrow: "Billing & Finance",
    icon: Briefcase,
    tagline: "Billing, RCM, and finance at Blossom.",
    actions: ["email", "call", "save_contact"],
    parentSafety: false,
  },
  qa: {
    eyebrow: "Quality Assurance",
    icon: GraduationCap,
    tagline: "Clinical quality and documentation oversight.",
    actions: ["email", "save_contact"],
    parentSafety: false,
  },
  marketing: {
    eyebrow: "Marketing & Growth",
    icon: Megaphone,
    tagline: "Growing the Blossom story.",
    actions: ["email", "website", "save_contact"],
    parentSafety: false,
  },
  state_director: {
    eyebrow: "State Leadership",
    icon: Building2,
    tagline: "Leads Blossom operations in this state.",
    actions: ["email", "call", "save_contact", "website"],
    parentSafety: false,
  },
  leadership: {
    eyebrow: "Leadership",
    icon: Sparkles,
    tagline: "Leadership team at Blossom ABA Therapy.",
    actions: ["email", "save_contact", "website"],
    parentSafety: false,
  },
  executive: {
    eyebrow: "Executive",
    icon: Sparkles,
    tagline: "Executive leadership at Blossom ABA Therapy.",
    actions: ["email", "save_contact", "website"],
    parentSafety: false,
  },
  employee: {
    eyebrow: "Team Member",
    icon: BadgeCheck,
    tagline: "Verified Blossom ABA Therapy team member.",
    actions: ["email", "call", "schedule", "message"],
    parentSafety: false,
  },
};

export const ACTION_META: Record<NfcActionKind, { label: string; icon: LucideIcon; accent?: boolean; destructive?: boolean }> = {
  email:           { label: "Email",            icon: Mail },
  call:            { label: "Call",             icon: Phone },
  save_contact:    { label: "Save to Contacts", icon: UserPlus, accent: true },
  website:         { label: "Visit Blossom",    icon: Globe },
  schedule:        { label: "Schedule",         icon: Calendar },
  message:         { label: "Message",          icon: MessageCircle },
  support_line:    { label: "Contact Blossom",  icon: PhoneCall },
  report_concern:  { label: "Report concern",   icon: ShieldAlert, destructive: true },
};

export function variantFor(roleKey: string | null | undefined): RoleVariant {
  const key = (roleKey ?? "employee") as RoleKey;
  return ROLE_VARIANTS[key] ?? ROLE_VARIANTS.employee;
}