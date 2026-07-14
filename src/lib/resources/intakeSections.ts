import type { Resource } from "@/lib/resources/resourceData";
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck, GraduationCap, Phone, Users, ClipboardList,
  FileType2, Sparkles, PlayCircle, BookOpen,
} from "lucide-react";

export type IntakeSectionId =
  | "required_sops"
  | "training"
  | "phone_ai"
  | "leads_marketing"
  | "insurance_vob"
  | "forms_templates"
  | "cheat_sheets"
  | "videos"
  | "optional";

export interface IntakeSection {
  id: IntakeSectionId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const INTAKE_SECTIONS: IntakeSection[] = [
  { id: "required_sops",    title: "Required SOPs",                          subtitle: "SOPs the Intake team is expected to follow.",         icon: ShieldCheck },
  { id: "training",         title: "Intake Training Resources",              subtitle: "Journey guides and enablement for Intake.",           icon: GraduationCap },
  { id: "phone_ai",         title: "Phone, Calls & After-Hours AI",          subtitle: "Retell, JiveTel, CTM, and after-hours coverage.",     icon: Phone },
  { id: "leads_marketing",  title: "Leads, Lead Journey & Marketing Handoff",subtitle: "Referrals, chatbot, CTM, ads, and lead journey.",     icon: Users },
  { id: "insurance_vob",    title: "Insurance, Benefits & VOB",              subtitle: "VOB, eligibility, payment plans, and payer guidance.",icon: ClipboardList },
  { id: "forms_templates",  title: "Forms, Templates & Worksheets",          subtitle: "Fillable forms, templates, and worksheets.",          icon: FileType2 },
  { id: "cheat_sheets",     title: "Cheat Sheets & References",              subtitle: "Quick references, software guides, and org reference.",icon: Sparkles },
  { id: "videos",           title: "Videos",                                 subtitle: "Recorded walkthroughs — playable inline.",            icon: PlayCircle },
  { id: "optional",         title: "Optional Helpful Resources",             subtitle: "Extras for Intake that don't fit the buckets above.", icon: BookOpen },
];

function bag(r: Resource): string {
  return [
    r.title, r.description,
    ...(r.tags ?? []),
    ...(r.departments ?? []),
  ].join(" ").toLowerCase();
}

function has(r: Resource, re: RegExp): boolean {
  return re.test(bag(r));
}

/** Topic matchers per spec. */
const RE_PHONE       = /(after.?hours|\bphone\b|\bcall(s|ing|ed)?\b|retell|jivetel|receptionist|voicemail|ivr|call\s?flow)/i;
const RE_LEADS       = /(\blead(s|)\b|referral|marketing|chatbot|facebook|google\s?ads?|\bctm\b|leadtrap|lead\s?journey|handoff)/i;
const RE_INSURANCE   = /(insurance|benefits?|\bvob\b|verification|eligibility|payment\s?plan|solum|solent|coverage|copay|deductible|payer)/i;
const RE_INTAKE_WORD = /(intake|new\s?lead|packet\s?follow|missing\s?info|welcome\s?call|prospect)/i;
const RE_INTAKE_DEPT = /(^|\W)intake(\W|$)/i;

/**
 * True when the resource is meaningful for the Intake team.
 * Called after the standard role-visibility check has passed.
 */
export function isIntakeRelevant(r: Resource): boolean {
  // Explicit department wins.
  if ((r.departments ?? []).some((d) => RE_INTAKE_DEPT.test(d))) {
    // But downweight generic "role SOP books / role deep dives" that got bulk-tagged Intake.
    const t = (r.title || "").toLowerCase();
    if (/(ceo|coo|doo|bcba|rbt|scheduling|recruiting|hr|payroll|finance|billing|clinical\s+director|state\s+director|executive|owner)/.test(t)
        && !RE_INTAKE_WORD.test(t) && !RE_LEADS.test(t) && !RE_INSURANCE.test(t) && !RE_PHONE.test(t)) {
      return false;
    }
    return true;
  }
  // Content-based match on any of the intake topics.
  return has(r, RE_INTAKE_WORD) || has(r, RE_LEADS) || has(r, RE_INSURANCE) || has(r, RE_PHONE);
}

/** Assign a resource to a single Intake section (first matching wins). */
export function intakeSectionOf(r: Resource): IntakeSectionId {
  const isVideo =
    r.type === "Video" || r.resourceType === "video" ||
    r.storageBucket === "resource-videos" ||
    (r.mimeType ?? "").toLowerCase().startsWith("video/");
  if (isVideo) return "videos";

  if (has(r, RE_PHONE))     return "phone_ai";
  if (has(r, RE_INSURANCE)) return "insurance_vob";
  if (has(r, RE_LEADS))     return "leads_marketing";

  const rt = (r.resourceType ?? "").toLowerCase();
  if (rt === "sop" || rt === "policy" || r.type === "SOP" || r.sopRelated) return "required_sops";
  if (rt === "training" || r.trainingRelated || r.category === "training") return "training";
  if (["form","template","worksheet","checklist"].includes(rt) ||
      ["Form","Template","Checklist"].includes(r.type)) return "forms_templates";
  if (["cheat_sheet","report_reference","software_guide","org_reference","admin_reference","reference"].includes(rt))
    return "cheat_sheets";

  return "optional";
}

/** Group intake-scoped resources by section, preserving input order. */
export function groupByIntakeSection(resources: Resource[]): Record<IntakeSectionId, Resource[]> {
  const out: Record<IntakeSectionId, Resource[]> = {
    required_sops: [], training: [], phone_ai: [], leads_marketing: [],
    insurance_vob: [], forms_templates: [], cheat_sheets: [], videos: [], optional: [],
  };
  for (const r of resources) out[intakeSectionOf(r)].push(r);
  return out;
}