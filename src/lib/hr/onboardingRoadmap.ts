import {
  Heart, Compass, Users, GraduationCap, ClipboardCheck,
  Stethoscope, ClipboardList, Headphones, BookOpen, Activity,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/roles";

export type RoadmapVariant = "bcba" | "rbt" | "coordinator" | "default";

export interface RoadmapPhase {
  phase: string;
  label: string;
  icon: LucideIcon;
  items: string[];
}

export interface RoadmapContext {
  clinic?: string | null;
  state?: string | null;
  manager?: string | null;
}

const COORDINATOR_ROLES: AppRole[] = [
  "intake", "auth_team", "qa", "scheduling", "staffing", "clinic",
  "finance", "hr", "phone_support", "hr_admin", "hr_manager",
  "recruiting_assistant", "payroll_admin", "training_admin",
  "clinic_director", "dept_manager", "ops_manager",
];

/** Pick a roadmap variant from the user's roles, prioritising direct-care titles. */
export function pickVariant(roles: AppRole[]): RoadmapVariant {
  if (roles.includes("bcba")) return "bcba";
  if (roles.includes("rbt")) return "rbt";
  if (roles.some((r) => COORDINATOR_ROLES.includes(r))) return "coordinator";
  return "default";
}

function clinicLabel(ctx: RoadmapContext) {
  if (ctx.clinic) return `${ctx.clinic} clinic`;
  if (ctx.state) return `your ${ctx.state} clinic`;
  return "your clinic";
}

function teamLabel(ctx: RoadmapContext) {
  if (ctx.state) return `your ${ctx.state} team`;
  if (ctx.clinic) return `the ${ctx.clinic} team`;
  return "your team";
}

function managerLabel(ctx: RoadmapContext) {
  return ctx.manager ? `Meet ${ctx.manager} (your manager)` : "Meet your manager";
}

const VARIANT_LABEL: Record<RoadmapVariant, string> = {
  bcba: "BCBA path",
  rbt: "RBT path",
  coordinator: "Coordinator path",
  default: "Standard path",
};

export function variantLabel(v: RoadmapVariant) {
  return VARIANT_LABEL[v];
}

/** Produce a tailored 5-phase roadmap based on the user's role + clinic/state context. */
export function buildRoadmap(variant: RoadmapVariant, ctx: RoadmapContext): RoadmapPhase[] {
  const clinic = clinicLabel(ctx);
  const team = teamLabel(ctx);
  const meetManager = managerLabel(ctx);

  const day1Common = ["Sign offer paperwork", "Watch CEO welcome", "Set up your profile"];
  const week4Common = ["30-day review", "Set 90-day goals", "Join a working group"];

  switch (variant) {
    case "bcba":
      return [
        { phase: "Day 1", label: "Land softly", icon: Heart, items: [...day1Common, "Confirm BCBA credentials on file"] },
        { phase: "Week 1", label: "Get oriented", icon: Compass, items: ["Clinical Academy intro", meetManager, `Tour ${clinic}`, "Review supervision expectations"] },
        { phase: "Week 2", label: "Learn the craft", icon: Stethoscope, items: ["NoteGuard & treatment plan walkthrough", "Shadow a BCBA assessment", "Meet your QA reviewer", "First check-in"] },
        { phase: "Week 3", label: "Step in", icon: ClipboardCheck, items: ["Run your first intake assessment", "Submit a treatment plan for QA", "Lead an RBT supervision session"] },
        { phase: "Week 4", label: "Belong", icon: Users, items: [...week4Common, `Connect with ${team}`] },
      ];
    case "rbt":
      return [
        { phase: "Day 1", label: "Land softly", icon: Heart, items: [...day1Common, "Confirm RBT certification on file"] },
        { phase: "Week 1", label: "Get oriented", icon: Compass, items: ["RBT onboarding intro", meetManager, `Tour ${clinic}`, "Review session expectations"] },
        { phase: "Week 2", label: "Learn the craft", icon: Activity, items: ["HIPAA & safety trainings", "Shadow two live sessions", "Practice session note workflow", "First check-in"] },
        { phase: "Week 3", label: "Step in", icon: ClipboardCheck, items: ["Run your first solo session", "Submit your first compliant note", "Co-plan with your BCBA"] },
        { phase: "Week 4", label: "Belong", icon: Users, items: [...week4Common, `Connect with ${team}`] },
      ];
    case "coordinator":
      return [
        { phase: "Day 1", label: "Land softly", icon: Heart, items: day1Common },
        { phase: "Week 1", label: "Get oriented", icon: Compass, items: ["Operations Academy intro", meetManager, `Tour ${clinic}`, "Walk through your queue + handoffs"] },
        { phase: "Week 2", label: "Learn the craft", icon: ClipboardList, items: ["Pipeline & SOP deep-dive", "Shadow your team's daily standup", "Pair with a senior coordinator", "First check-in"] },
        { phase: "Week 3", label: "Step in", icon: Headphones, items: ["Own your first case end-to-end", "Resolve a queued blocker", "Document one SOP improvement"] },
        { phase: "Week 4", label: "Belong", icon: Users, items: [...week4Common, `Sync with ${team}`] },
      ];
    default:
      return [
        { phase: "Day 1", label: "Land softly", icon: Heart, items: day1Common },
        { phase: "Week 1", label: "Get oriented", icon: Compass, items: ["Operations Academy intro", meetManager, `Tour ${clinic}`] },
        { phase: "Week 2", label: "Learn the craft", icon: GraduationCap, items: ["Core compliance trainings", "Shadow a session", "First check-in"] },
        { phase: "Week 3", label: "Step in", icon: ClipboardCheck, items: ["Complete role certifications", "Run first task independently"] },
        { phase: "Week 4", label: "Belong", icon: Users, items: week4Common },
      ];
  }
}