import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  PlayCircle, ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
  Users, HeartHandshake, MessageSquare, Wrench, Share2, ChevronRight,
  BookOpen, Library, Star, Calendar, ExternalLink, UserCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// BCBA Resource Library — Current-State
// Aligned to the "FINAL - BCBA Resource Library Upload - 2026-07-14" package.
// Blossom OS is the training / resource / reporting platform. CentralReach
// remains the clinical EMR and current clinical execution system — BCBAs
// continue to own clinical documentation, treatment plans, session notes,
// and clinical records inside CentralReach.
// =============================================================================

type ResourceType =
  | "SOP"
  | "Training Resource"
  | "Video"
  | "Report/Export"
  | "Role Packet"
  | "Signoff"
  | "Handoff Reference"
  | "Needs Review";

type ResourceFormat = "PDF" | "CSV" | "XLSX" | "DOCX" | "Video" | "Link";

type Category =
  | "BCBA Start Here"
  | "BCBA SOPs"
  | "BCBA Training Academy Resources"
  | "BCBA Videos and Walkthroughs"
  | "Clinical Documentation"
  | "Assessment and Readiness"
  | "Treatment Plans and Progress Reports"
  | "Parent Training and Family Communication"
  | "Behavior Plans and Clinical Escalation"
  | "Supervision, RBT Support, and Case Oversight"
  | "Productivity, Incentives, and Reports"
  | "Role Packet and Signoff"
  | "Authorizations, QA, Credentialing, and Scheduling Handoffs"
  | "Needs Review - BCBA Adjacent";

type WorkflowKey =
  | "clinical-supervision" | "assessment" | "treatment-plan" | "progress-report"
  | "parent-training" | "behavior-plan" | "documentation" | "rbt-support"
  | "case-oversight" | "escalation" | "productivity" | "signoff" | "handoff";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  format?: ResourceFormat;
  folder?: string;
  minutes: number;
  updated: string;
  owner?: string;
  href?: string;
  featured?: boolean;
  workflows?: WorkflowKey[];
  needsReview?: boolean;
  planningOnly?: boolean;
  journeyDay?: string;
}

const TODAY = "2026-07-14";
const FOLDER = {
  sops: "01 - BCBA SOPs - PDF Only",
  training: "02 - BCBA Training Academy Resources",
  videos: "03 - BCBA Videos and Media",
  clinicalDocs: "04 - Clinical Documentation Treatment and Parent Training",
  assessments: "05 - Assessment Treatment Plans and Progress Reports",
  supervision: "06 - Supervision RBT Support and Case Oversight",
  productivity: "07 - Productivity Incentives Reports and Examples",
  rolePacket: "08 - BCBA Role Packet and Signoff",
  handoffs: "09 - Authorizations QA Credentialing and Scheduling Handoff References",
  uploadQA: "10 - Upload QA and Inventory",
  needsReview: "11 - Needs Review - BCBA Adjacent",
} as const;

const resources: Resource[] = [
  // ------- BCBA Start Here -------
  { id: "start-1", title: "BCBA - Start Here", description: "Current-state overview of what BCBAs own at Blossom (clinical supervision, assessment support, treatment plan quality, progress reports, parent training, RBT support, case oversight, escalation) and how Blossom OS supports that work alongside CentralReach.", category: "BCBA Start Here", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 5, updated: "2026-07-14", featured: true, owner: "Clinical Leadership" },
  { id: "start-2", title: "BCBA 4-Week Current-State Onboarding Journey - Overview", description: "Overview of the four-week BCBA onboarding journey with the modules, resources, and handoffs referenced on each day.", category: "BCBA Start Here", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", featured: true, journeyDay: "Week 1 Day 1" },
  { id: "start-3", title: "BCBA Role and Scope - Current Operations", description: "Plain-English scope: BCBAs own clinical work in CentralReach. Blossom OS provides training, resources, reporting visibility, and role guidance. BCBAs do not own the full Authorizations, QA, Scheduling, or Credentialing departments.", category: "BCBA Start Here", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 4, updated: "2026-07-14" },

  // ------- BCBA SOPs (PDF only, learner-facing) -------
  { id: "sop-01", title: "L1 BCBA Clinical Supervisor Role SOP", description: "L1 SOP defining the BCBA Clinical Supervisor role, ownership boundaries, and expectations across supervision, treatment planning, and RBT support.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 8, updated: "2026-07-14", featured: true, owner: "Clinical Leadership", workflows: ["clinical-supervision"] },
  { id: "sop-02", title: "L2 BCBA Case Oversight Process SOP", description: "Current-state BCBA case oversight workflow: how BCBAs review case health, RBT execution, family engagement, and clinical progress.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 8, updated: "2026-07-14", featured: true, workflows: ["case-oversight"] },
  { id: "sop-03", title: "L2 Clinical Escalation and Case Review Process SOP", description: "When and how BCBAs escalate clinical concerns, request case review, and coordinate with clinical leadership.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", featured: true, workflows: ["escalation"] },
  { id: "sop-04", title: "L2 Evaluation Coordination Process SOP", description: "How BCBAs coordinate evaluations and assessments with Scheduling, Authorizations, and families.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["assessment"] },
  { id: "sop-05", title: "L2 Family Clinical Communication Process SOP", description: "Current-state process for family-facing clinical communication owned by the BCBA.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["parent-training"] },
  { id: "sop-06", title: "L2 RBT Support and Retention Process SOP", description: "How BCBAs support their assigned RBTs, coach in-session, and contribute to RBT retention.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", featured: true, workflows: ["rbt-support"] },
  { id: "sop-07", title: "L2 Assessment Current Operations", description: "Current-state assessment operations, including intake handoff, timing, and documentation.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["assessment"] },
  { id: "sop-08", title: "L2 Behavior Plans Current Operations", description: "Current-state behavior plan process from clinical judgement through documentation and family review.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["behavior-plan"] },
  { id: "sop-09", title: "L2 Case Management Current Operations", description: "How BCBAs manage day-to-day case work, prioritize caseload activity, and coordinate with support teams.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["case-oversight"] },
  { id: "sop-10", title: "L2 Client Lifecycle Current Operations", description: "Current-state client lifecycle from intake handoff to services on pause or discharge, and where BCBA ownership begins and ends.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14" },
  { id: "sop-11", title: "L2 Clinical Documentation Current Operations", description: "Current-state clinical documentation expectations for the BCBA (owned in CentralReach as the clinical EMR).", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["documentation"] },
  { id: "sop-12", title: "L2 Discharges Current Operations", description: "How BCBAs support and document discharges when a client leaves services.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14" },
  { id: "sop-13", title: "L2 Parent Training Current Operations", description: "Current-state parent training operations and expectations owned by the BCBA.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["parent-training"] },
  { id: "sop-14", title: "L2 Progress Reports Current Operations", description: "Current-state progress report cadence, quality expectations, and QA handoff.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", featured: true, workflows: ["progress-report"] },
  { id: "sop-15", title: "L2 Services on Pause Current Operations", description: "How BCBAs handle clients on pause: documentation, communication, and reactivation steps.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14" },
  { id: "sop-16", title: "L2 Session Expectations Current Operations", description: "Current-state expectations for BCBA sessions (supervision, direct, overlap) in CentralReach.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["clinical-supervision"] },
  { id: "sop-17", title: "L2 Treatment Plans Current Operations", description: "Current-state treatment plan authoring and quality expectations owned by the BCBA.", category: "BCBA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", featured: true, workflows: ["treatment-plan"] },

  // ------- BCBA Training Academy Resources -------
  { id: "trn-1", title: "BCBA Journey - Week 1 Resource Pack", description: "Resources referenced across Week 1 (role, scope, CentralReach orientation, clinical supervision fundamentals).", category: "BCBA Training Academy Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 1" },
  { id: "trn-2", title: "BCBA Journey - Week 2 Resource Pack", description: "Resources referenced across Week 2 (assessment, treatment planning, documentation quality).", category: "BCBA Training Academy Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 2" },
  { id: "trn-3", title: "BCBA Journey - Week 3 Resource Pack", description: "Resources referenced across Week 3 (progress reports, parent training, behavior plans, escalation).", category: "BCBA Training Academy Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 3" },
  { id: "trn-4", title: "BCBA Journey - Week 4 Resource Pack", description: "Resources referenced across Week 4 (RBT support, case oversight, productivity/incentives, role packet signoff).", category: "BCBA Training Academy Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 4" },

  // ------- BCBA Videos and Walkthroughs -------
  { id: "vid-1", title: "BCBA Final Guide", description: "Full BCBA final guide walkthrough covering scope, workflow, and CentralReach expectations.", category: "BCBA Videos and Walkthroughs", type: "Video", format: "Video", folder: FOLDER.videos, minutes: 22, updated: "2026-07-14", featured: true, journeyDay: "Week 1" },
  { id: "vid-2", title: "Overview of BCBA and Credentialing Boards", description: "Overview walkthrough of BCBA and credentialing boards used operationally today.", category: "BCBA Videos and Walkthroughs", type: "Video", format: "Video", folder: FOLDER.videos, minutes: 15, updated: "2026-07-14", workflows: ["handoff"] },
  { id: "vid-3", title: "RBT Board Workflow and Automations Overview", description: "How RBT board workflows and automations support the BCBA in RBT oversight.", category: "BCBA Videos and Walkthroughs", type: "Video", format: "Video", folder: FOLDER.videos, minutes: 14, updated: "2026-07-14", workflows: ["rbt-support"] },
  { id: "vid-4", title: "CentralReach Permissions Groups and Automation Rules", description: "CentralReach permissions groups and automation rules that affect the BCBA workflow.", category: "BCBA Videos and Walkthroughs", type: "Video", format: "Video", folder: FOLDER.videos, minutes: 12, updated: "2026-07-14", workflows: ["documentation"] },

  // ------- Clinical Documentation -------
  { id: "cdoc-1", title: "Clinical Documentation Reference Guide", description: "Reference for BCBA documentation quality expectations. Clinical records live in CentralReach - Blossom OS provides the training and reference layer.", category: "Clinical Documentation", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 6, updated: "2026-07-14", workflows: ["documentation"] },
  { id: "cdoc-2", title: "Session Expectations Reference", description: "Reference for session expectations across supervision, direct, and overlap in current operations.", category: "Clinical Documentation", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 5, updated: "2026-07-14", workflows: ["clinical-supervision"] },
  { id: "cdoc-3", title: "Documentation Common Findings", description: "Common documentation findings BCBAs see from QA and how to avoid them.", category: "Clinical Documentation", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 5, updated: "2026-07-14", workflows: ["documentation"] },

  // ------- Assessment and Readiness -------
  { id: "asm-1", title: "Assessment Reference Guide", description: "Reference for BCBA assessment support: what BCBAs prepare, how it hands off to Scheduling and Authorizations.", category: "Assessment and Readiness", type: "Training Resource", format: "PDF", folder: FOLDER.assessments, minutes: 6, updated: "2026-07-14", workflows: ["assessment"] },
  { id: "asm-2", title: "Assessment Readiness Checklist", description: "Learner-facing readiness checklist used during the BCBA journey assessment module.", category: "Assessment and Readiness", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 3, updated: "2026-07-14", journeyDay: "Week 2", workflows: ["assessment"] },

  // ------- Treatment Plans and Progress Reports -------
  { id: "tp-1", title: "Treatment Plan Reference Guide", description: "Reference for treatment plan authoring quality. BCBAs continue to build treatment plans in CentralReach.", category: "Treatment Plans and Progress Reports", type: "Training Resource", format: "PDF", folder: FOLDER.assessments, minutes: 6, updated: "2026-07-14", workflows: ["treatment-plan"] },
  { id: "tp-2", title: "Treatment Plan QA Handoff Reference", description: "What QA looks for on treatment plans and how BCBAs pre-check before submission.", category: "Treatment Plans and Progress Reports", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["treatment-plan", "handoff"] },
  { id: "pr-1", title: "Progress Report Reference Guide", description: "Reference for progress report cadence, required content, and QA expectations.", category: "Treatment Plans and Progress Reports", type: "Training Resource", format: "PDF", folder: FOLDER.assessments, minutes: 6, updated: "2026-07-14", featured: true, workflows: ["progress-report"] },
  { id: "pr-2", title: "Progress Report Journey Checklist", description: "Learner-facing checklist used during the BCBA journey progress report module.", category: "Treatment Plans and Progress Reports", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 3, updated: "2026-07-14", journeyDay: "Week 3", workflows: ["progress-report"] },

  // ------- Parent Training and Family Communication -------
  { id: "pt-1", title: "Parent Training Reference Guide", description: "Reference for parent training cadence, structure, and documentation.", category: "Parent Training and Family Communication", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 6, updated: "2026-07-14", workflows: ["parent-training"] },
  { id: "pt-2", title: "Family Clinical Communication Reference", description: "How BCBAs handle family-facing clinical communication and when to escalate.", category: "Parent Training and Family Communication", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 5, updated: "2026-07-14", workflows: ["parent-training"] },

  // ------- Behavior Plans and Clinical Escalation -------
  { id: "bp-1", title: "Behavior Plan Reference Guide", description: "Reference for behavior plan authoring, review, and family/RBT rollout.", category: "Behavior Plans and Clinical Escalation", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 6, updated: "2026-07-14", workflows: ["behavior-plan"] },
  { id: "bp-2", title: "Clinical Escalation Reference", description: "When and how BCBAs escalate clinical concerns to clinical leadership and cross-functional partners.", category: "Behavior Plans and Clinical Escalation", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalDocs, minutes: 5, updated: "2026-07-14", featured: true, workflows: ["escalation"] },

  // ------- Supervision, RBT Support, and Case Oversight -------
  { id: "sup-1", title: "Clinical Supervision Reference Guide", description: "Reference for BCBA clinical supervision expectations, cadence, and documentation.", category: "Supervision, RBT Support, and Case Oversight", type: "Training Resource", format: "PDF", folder: FOLDER.supervision, minutes: 6, updated: "2026-07-14", workflows: ["clinical-supervision"] },
  { id: "sup-2", title: "RBT Support Reference Guide", description: "How BCBAs support assigned RBTs in-session, on documentation, and on retention.", category: "Supervision, RBT Support, and Case Oversight", type: "Training Resource", format: "PDF", folder: FOLDER.supervision, minutes: 6, updated: "2026-07-14", featured: true, workflows: ["rbt-support"] },
  { id: "sup-3", title: "Case Oversight Reference Guide", description: "Reference for BCBA case oversight rhythm and signals of a case at risk.", category: "Supervision, RBT Support, and Case Oversight", type: "Training Resource", format: "PDF", folder: FOLDER.supervision, minutes: 6, updated: "2026-07-14", workflows: ["case-oversight"] },

  // ------- Productivity, Incentives, and Reports -------
  { id: "prod-1", title: "BCBA Productivity Reference Guide", description: "Reference for how BCBA productivity is measured today and how to read the BCBA Productivity Report V3.", category: "Productivity, Incentives, and Reports", type: "Training Resource", format: "PDF", folder: FOLDER.productivity, minutes: 6, updated: "2026-07-14", workflows: ["productivity"] },
  { id: "prod-2", title: "BCBA Incentives Reference", description: "Current-state BCBA incentives structure and how it ties to productivity/quality signals.", category: "Productivity, Incentives, and Reports", type: "Training Resource", format: "PDF", folder: FOLDER.productivity, minutes: 5, updated: "2026-07-14", workflows: ["productivity"] },
  { id: "prod-3", title: "BCBA Productivity Export Example (CSV)", description: "Example productivity export so learners see the columns and cadence used today.", category: "Productivity, Incentives, and Reports", type: "Report/Export", format: "CSV", folder: FOLDER.productivity, minutes: 3, updated: "2026-07-14", workflows: ["productivity"], href: "/reports" },
  { id: "prod-4", title: "BCBA Productivity Snapshot (XLSX)", description: "Example productivity snapshot workbook.", category: "Productivity, Incentives, and Reports", type: "Report/Export", format: "XLSX", folder: FOLDER.productivity, minutes: 3, updated: "2026-07-14", workflows: ["productivity"], href: "/reports" },

  // ------- Role Packet and Signoff -------
  { id: "pkt-1", title: "BCBA Role Packet", description: "Role packet for BCBA / BCBA Clinical Supervisor covering current scope, boundaries, and daily rhythm.", category: "Role Packet and Signoff", type: "Role Packet", format: "PDF", folder: FOLDER.rolePacket, minutes: 8, updated: "2026-07-14", workflows: ["signoff"] },
  { id: "pkt-2", title: "BCBA Onboarding Signoff", description: "Signoff form learners complete at the end of the 4-week BCBA onboarding journey.", category: "Role Packet and Signoff", type: "Signoff", format: "PDF", folder: FOLDER.rolePacket, minutes: 3, updated: "2026-07-14", workflows: ["signoff"], journeyDay: "Week 4" },

  // ------- Authorizations, QA, Credentialing, and Scheduling Handoffs -------
  { id: "hand-1", title: "BCBA to Authorizations Handoff Reference", description: "What BCBAs contribute for treatment authorization and reauthorization support. Authorizations owns submission and payer follow-through.", category: "Authorizations, QA, Credentialing, and Scheduling Handoffs", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff"] },
  { id: "hand-2", title: "BCBA to QA Handoff Reference", description: "What QA reviews on clinical reports and treatment plans and what BCBAs check before submission.", category: "Authorizations, QA, Credentialing, and Scheduling Handoffs", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff"] },
  { id: "hand-3", title: "BCBA to Credentialing Handoff Reference", description: "Credentialing visibility BCBAs need and what Credentialing owns end-to-end.", category: "Authorizations, QA, Credentialing, and Scheduling Handoffs", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff"] },
  { id: "hand-4", title: "BCBA to Scheduling Handoff Reference", description: "How BCBA assignment confirmation, evaluations, and reassessments flow through the Scheduling team.", category: "Authorizations, QA, Credentialing, and Scheduling Handoffs", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff"] },

  // ------- Needs Review - BCBA Adjacent (planning / reference only) -------
  { id: "nr-1", title: "BCBA-Adjacent Planning Reference", description: "Planning or adjacent reference material. Not a current BCBA SOP - do not treat as a current operating instruction.", category: "Needs Review - BCBA Adjacent", type: "Needs Review", format: "PDF", folder: FOLDER.needsReview, minutes: 6, updated: "2026-07-14", needsReview: true, planningOnly: true },
  { id: "nr-2", title: "BCBA-Adjacent Blossom OS Concept Note", description: "Future-state concept note. Blossom OS is the training/resource/reporting layer - CentralReach remains the clinical EMR. Not required onboarding.", category: "Needs Review - BCBA Adjacent", type: "Needs Review", format: "PDF", folder: FOLDER.needsReview, minutes: 6, updated: "2026-07-14", needsReview: true, planningOnly: true },
];

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "clinical-supervision", label: "Clinical Supervision", icon: ClipboardCheck },
  { key: "assessment", label: "Assessment", icon: FileText },
  { key: "treatment-plan", label: "Treatment Plans", icon: FileText },
  { key: "progress-report", label: "Progress Reports", icon: Activity },
  { key: "parent-training", label: "Parent Training", icon: HeartHandshake },
  { key: "behavior-plan", label: "Behavior Plans", icon: ShieldCheck },
  { key: "documentation", label: "Documentation", icon: BookOpen },
  { key: "rbt-support", label: "RBT Support", icon: Users },
  { key: "case-oversight", label: "Case Oversight", icon: UserCheck },
  { key: "escalation", label: "Clinical Escalation", icon: AlertTriangle },
  { key: "productivity", label: "Productivity & Reports", icon: Activity },
  { key: "signoff", label: "Role Packet & Signoff", icon: ListChecks },
  { key: "handoff", label: "Handoffs", icon: Share2 },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "BCBA Start Here": { icon: Star, blurb: "Current-state overview and journey entry point." },
  "BCBA SOPs": { icon: FileText, blurb: "Current-state BCBA SOPs (PDF only)." },
  "BCBA Training Academy Resources": { icon: BookOpen, blurb: "Resource packs per journey week." },
  "BCBA Videos and Walkthroughs": { icon: PlayCircle, blurb: "Video walkthroughs for BCBA workflows." },
  "Clinical Documentation": { icon: BookOpen, blurb: "Documentation quality references (records live in CentralReach)." },
  "Assessment and Readiness": { icon: FileText, blurb: "Assessment support and readiness checklists." },
  "Treatment Plans and Progress Reports": { icon: FileText, blurb: "Treatment plan and progress report references." },
  "Parent Training and Family Communication": { icon: HeartHandshake, blurb: "Parent training and family communication references." },
  "Behavior Plans and Clinical Escalation": { icon: ShieldCheck, blurb: "Behavior plans and clinical escalation." },
  "Supervision, RBT Support, and Case Oversight": { icon: ClipboardCheck, blurb: "Supervision, RBT support, and case oversight." },
  "Productivity, Incentives, and Reports": { icon: Activity, blurb: "Productivity, incentives, and example exports." },
  "Role Packet and Signoff": { icon: ListChecks, blurb: "Role packet and onboarding signoff." },
  "Authorizations, QA, Credentialing, and Scheduling Handoffs": { icon: Share2, blurb: "Handoff references to cross-functional teams." },
  "Needs Review - BCBA Adjacent": { icon: AlertTriangle, blurb: "Planning references. Not current SOPs." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText,
  "Training Resource": BookOpen,
  "Video": PlayCircle,
  "Report/Export": Activity,
  "Role Packet": ListChecks,
  "Signoff": ListChecks,
  "Handoff Reference": Share2,
  "Needs Review": AlertTriangle,
};

export default function OSBCBAResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["sop-01", "sop-14", "vid-1"]));
  const [recent] = useState<string[]>(["sop-17", "pr-1", "sup-2", "hand-2", "vid-1"]);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (activeCategory && r.category !== activeCategory) return false;
      if (activeWorkflow && !(r.workflows ?? []).includes(activeWorkflow)) return false;
      if (!q) return true;
      return [r.title, r.description, r.category, r.type, r.owner ?? ""]
        .join(" ").toLowerCase().includes(q);
    });
  }, [query, activeCategory, activeWorkflow]);

  const featured = useMemo(() => resources.filter((r) => r.featured), []);
  const recentResources = useMemo(
    () => recent.map((id) => resources.find((r) => r.id === id)).filter(Boolean) as Resource[],
    [recent],
  );

  const isFiltering = query.trim().length > 0 || activeCategory !== null || activeWorkflow !== null;

  return (
    <OSShell rightRail={<ResourceRail saved={saved.size} recent={recent.length} onClearFilters={() => { setActiveCategory(null); setActiveWorkflow(null); setQuery(""); }} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" />
              Resource Library · Clinical Operations · BCBA · Current-State
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">BCBA Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Current-state SOPs, references, videos, role packet, journey resources, and example exports for BCBAs and BCBA Clinical Supervisors. Blossom OS is the training and resource layer. CentralReach remains the clinical EMR — treatment plans, session notes, and clinical records continue to live there.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Clock className="mr-1.5 h-3.5 w-3.5" /> Recently viewed
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved ({saved.size})
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/academy"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> BCBA Training Academy</Link>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs, treatment plans, parent training, supervision, RBT support, CentralReach..."
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isFiltering && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activeCategory && <Chip onClear={() => setActiveCategory(null)}>{activeCategory}</Chip>}
              {activeWorkflow && (
                <Chip onClear={() => setActiveWorkflow(null)}>
                  {workflows.find((w) => w.key === activeWorkflow)?.label}
                </Chip>
              )}
              {query && <Chip onClear={() => setQuery("")}>"{query}"</Chip>}
              <span className="text-xs text-muted-foreground tabular-nums">
                {filtered.length} resource{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {isFiltering ? (
          <FilteredView resources={filtered} saved={saved} onToggleSave={toggleSave} />
        ) : (
          <>
            <Section title="Featured BCBA resources" subtitle="Highest-priority references for daily BCBA work.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Curated for the BCBA operational model.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(Object.keys(categoryMeta) as Category[]).map((c) => {
                  const meta = categoryMeta[c];
                  const all = resources.filter((r) => r.category === c);
                  const recentItem = [...all].sort((a, b) => b.updated.localeCompare(a.updated))[0];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground group-hover:text-foreground transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{all.length}</span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">{c}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>
                      {recentItem ? (
                        <p className="mt-3 text-[11px] text-muted-foreground/80">Updated {formatDate(recentItem.updated)}</p>
                      ) : (
                        <p className="mt-3 text-[11px] text-muted-foreground/80">BCBA resources will appear here.</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>

            {recentResources.length > 0 && (
              <Section title="Recently used" subtitle="Pick up where you left off.">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
                  {recentResources.map((r) => (
                    <ResourceRow key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                  ))}
                </div>
              </Section>
            )}

            <Section title="Find by workflow" subtitle="Resources grouped by the BCBA operational moment they support.">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {workflows.map((w) => {
                  const count = resources.filter((r) => (r.workflows ?? []).includes(w.key)).length;
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.key}
                      onClick={() => setActiveWorkflow(w.key)}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted/60 text-muted-foreground group-hover:text-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{w.label}</p>
                        <p className="text-[11px] text-muted-foreground">{count} resource{count === 1 ? "" : "s"}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </Section>
          </>
        )}
      </div>
    </OSShell>
  );
}

// ---------- filtered view ----------

function FilteredView({ resources: rs, saved, onToggleSave }: { resources: Resource[]; saved: Set<string>; onToggleSave: (id: string) => void }) {
  if (rs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-16 text-center">
        <p className="text-sm text-muted-foreground">No resources found.</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Try clearing filters or searching different keywords.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
      {rs.map((r) => (
        <ResourceRow key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => onToggleSave(r.id)} />
      ))}
    </div>
  );
}

// ---------- atoms ----------

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <button onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] text-foreground hover:bg-muted">
      {children}
      <span className="text-muted-foreground">×</span>
    </button>
  );
}

function FeaturedCard({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  const inner = (
    <div className="group relative h-full rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
            saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
          title={saved ? "Saved" : "Save"}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </button>
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
        {r.format && <Badge variant="outline" className="rounded-full text-[10px]">{r.format}</Badge>}
        {r.needsReview && <Badge className="rounded-full bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 text-[10px]">Needs Review</Badge>}
        {r.planningOnly && <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-700 text-[10px]">Planning Reference · Not Current SOP</Badge>}
        {r.journeyDay && <Badge variant="outline" className="rounded-full text-[10px]">Journey · {r.journeyDay}</Badge>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
        <span>·</span>
        <span>Updated {formatDate(r.updated)}</span>
        {r.owner && <span>· {r.owner}</span>}
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[11px]">
        <QuickAction icon={ArrowRight} label="Open" />
        <QuickAction icon={Share2} label="Share" />
      </div>
    </div>
  );
  return r.href ? <Link to={r.href} className="block h-full">{inner}</Link> : inner;
}

function ResourceRow({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  const inner = (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{r.title}</p>
          <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
          {r.format && <Badge variant="outline" className="rounded-full text-[10px]">{r.format}</Badge>}
          {r.needsReview && <Badge className="rounded-full bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 text-[10px]">Needs Review</Badge>}
          {r.planningOnly && <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-700 text-[10px]">Not Current SOP</Badge>}
          <span className="text-[11px] text-muted-foreground">{r.category}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.updated)}</span>
          {r.owner && <span>· {r.owner}</span>}
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
        className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
          saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      </button>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
  return r.href ? <Link to={r.href} className="block">{inner}</Link> : <div>{inner}</div>;
}

function QuickAction({ icon: Icon, label }: { icon: typeof ArrowRight; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function ResourceRail({ saved, recent, onClearFilters }: { saved: number; recent: number; onClearFilters: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your library</p>
        <div className="mt-3 space-y-2">
          <RailStat icon={Bookmark} label="Saved resources" value={saved} />
          <RailStat icon={Clock} label="Recently viewed" value={recent} />
          <RailStat icon={Star} label="Pinned" value={0} />
        </div>
        <button onClick={onClearFilters} className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted">
          Reset filters
        </button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reminder</p>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          Clinical records, treatment plans, and session notes continue to live in CentralReach. Blossom OS provides training, references, reporting visibility, and role guidance for the BCBA.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/bcba" label="BCBA Dashboard" icon={ClipboardCheck} />
          <RailLink to="/bcba-workspace" label="BCBA Workspace" icon={Wrench} />
          <RailLink to="/bcba-clients" label="BCBA Clients" icon={UserCheck} />
          <RailLink to="/bcba-supervision" label="Supervision" icon={ClipboardCheck} />
          <RailLink to="/bcba-parent-training" label="Parent Training" icon={MessageSquare} />
          <RailLink to="/reports" label="Reports" icon={Activity} />
          <RailLink to="/academy" label="Training Academy" icon={BookOpen} />
        </div>
      </div>
    </div>
  );
}

function RailStat({ icon: Icon, label, value }: { icon: typeof Bookmark; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  );
}

function RailLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof ClipboardCheck }) {
  return (
    <Link to={to} className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/60">
      <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Suppress unused-var lint
void TODAY;

