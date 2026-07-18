import type { LucideIcon } from "lucide-react";
import {
  Sparkles, BookOpen, Cable, ClipboardList, FileEdit, FileText,
  Clock, HeartHandshake, ShieldCheck, MessageCircle, AlertOctagon,
  PenTool, ClipboardCheck, Scale, Siren, LayoutGrid, Battery,
  Crown, GraduationCap, MapPin,
} from "lucide-react";

export interface AcademySection {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  required: boolean;
  estMinutes: number;
  path?: string; // link into Blossom Academy when available
}

export const BCBA_ACADEMY_SECTIONS: AcademySection[] = [
  { key: "new_bcba_onboarding", title: "New BCBA onboarding", description: "Your first 30 days at Blossom.", icon: Sparkles, required: true, estMinutes: 90, path: "/training/academy" },
  { key: "clinical_standards",  title: "Blossom clinical standards", description: "Core clinical expectations.", icon: BookOpen, required: true, estMinutes: 45 },
  { key: "centralreach",        title: "CentralReach", description: "Navigate CR for BCBAs.", icon: Cable, required: true, estMinutes: 45 },
  { key: "assessments",         title: "Assessments", description: "Assessment workflow and tools.", icon: ClipboardList, required: true, estMinutes: 60 },
  { key: "treatment_plans",     title: "Treatment plans", description: "Writing high-quality plans.", icon: FileEdit, required: true, estMinutes: 60 },
  { key: "progress_reports",    title: "Progress reports", description: "Structure, timing, QA.", icon: FileText, required: true, estMinutes: 45 },
  { key: "auth_timelines",      title: "Authorization timelines", description: "Milestones and dependencies.", icon: Clock, required: true, estMinutes: 30 },
  { key: "parent_training",     title: "Parent training", description: "Delivering effective sessions.", icon: HeartHandshake, required: true, estMinutes: 45 },
  { key: "rbt_supervision",     title: "RBT supervision", description: "Requirements and quality.", icon: ShieldCheck, required: true, estMinutes: 45 },
  { key: "giving_feedback",     title: "Giving feedback", description: "Constructive, timely feedback.", icon: MessageCircle, required: false, estMinutes: 30 },
  { key: "underperformance",    title: "Handling underperformance", description: "Coaching and remediation.", icon: AlertOctagon, required: false, estMinutes: 45 },
  { key: "clinical_writing",    title: "Clinical writing", description: "Precise, professional writing.", icon: PenTool, required: false, estMinutes: 30 },
  { key: "qa_expectations",     title: "QA expectations", description: "How QA reviews your work.", icon: ClipboardCheck, required: true, estMinutes: 30 },
  { key: "ethics_boundaries",   title: "Ethics and boundaries", description: "BACB ethics in practice.", icon: Scale, required: true, estMinutes: 45 },
  { key: "incident_escalation", title: "Incident escalation", description: "When and how to escalate.", icon: Siren, required: true, estMinutes: 30 },
  { key: "caseload_mgmt",       title: "Caseload management", description: "Prioritization and organization.", icon: LayoutGrid, required: false, estMinutes: 30 },
  { key: "burnout_prevention",  title: "Burnout prevention", description: "Sustainable practice.", icon: Battery, required: false, estMinutes: 20 },
  { key: "leadership",          title: "Leadership", description: "Leading teams and clinics.", icon: Crown, required: false, estMinutes: 45 },
  { key: "fellowship_supervision", title: "Fellowship supervision", description: "Supervising fieldwork BCBAs.", icon: GraduationCap, required: false, estMinutes: 60 },
  { key: "state_specific",      title: "State-specific resources", description: "State regs and payors.", icon: MapPin, required: true, estMinutes: 30 },
];

export interface ToolkitResource {
  key: string;
  title: string;
  description: string;
  href?: string;
}

export const SUPERVISOR_TOOLKIT: ToolkitResource[] = [
  { key: "first_session_checklist", title: "First-session checklist", description: "Everything to prep and observe on day one.", href: "/bcba/caseload" },
  { key: "supervision_agenda",      title: "Supervision agenda", description: "A repeatable, high-signal 1:1 structure.", href: "/bcba/supervision" },
  { key: "feedback_templates",      title: "Feedback templates", description: "Reusable language for positive and corrective feedback." },
  { key: "coaching_plan",           title: "Coaching-plan templates", description: "Structured plans to grow specific skills." },
  { key: "rbt_recognition",         title: "RBT recognition tools", description: "Shout-outs, milestones, and appreciation prompts." },
  { key: "remediation",             title: "Remediation resources", description: "Skill-based remediation frameworks." },
  { key: "escalation_guidance",     title: "Escalation guidance", description: "Decision tree for when to escalate.", href: "/bcba/support?tab=new" },
  { key: "difficult_conversations", title: "Difficult-conversation guidance", description: "Scripts and prep for hard talks." },
];