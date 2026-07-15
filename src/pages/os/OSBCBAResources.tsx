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

type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Checklist" | "Recording" | "FAQ";

interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  description: string;
  minutes?: number;
  updated: string; // relative
  tags: string[];
  pinned?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: any;
  blurb: string;
  resources: Resource[];
}

const typeChip: Record<ResourceType, string> = {
  SOP:        "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  Workflow:   "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  Guide:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  Template:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  Checklist:  "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30",
  Recording:  "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  FAQ:        "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
};

const CATEGORIES: Category[] = [
  {
    id: "foundations", label: "BCBA Foundations", icon: BookOpen,
    blurb: "Role expectations, daily workflow, and operational standards.",
    resources: [
      { id: "f1", title: "BCBA Role Expectations",          type: "Guide", description: "What Blossom expects from every BCBA — clinical, operational, communication.", minutes: 6, updated: "2w ago", tags: ["foundations","role"], pinned: true },
      { id: "f2", title: "BCBA Workflow Overview",          type: "Workflow", description: "The full BCBA operational lifecycle in one map.", minutes: 5, updated: "3w ago", tags: ["workflow"] },
      { id: "f3", title: "Daily Workflow Guide",            type: "Guide", description: "A calm, repeatable daily rhythm for managing your caseload.", minutes: 4, updated: "1w ago", tags: ["daily","caseload"] },
      { id: "f4", title: "Operational Standards",           type: "SOP", description: "Blossom's operational baseline for clinical staff.", minutes: 7, updated: "1mo ago", tags: ["standards"] },
      { id: "f5", title: "Caseload Expectations",           type: "Guide", description: "Caseload size, supervision cadence, and PR cadence expectations.", minutes: 5, updated: "3w ago", tags: ["caseload"] },
      { id: "f6", title: "BCBA Success Guide",              type: "Guide", description: "What great looks like at Blossom — habits and signals.", minutes: 8, updated: "2mo ago", tags: ["success"] },
      { id: "f7", title: "Clinical Communication Standards", type: "SOP", description: "How we communicate with families, RBTs, and internal teams.", minutes: 6, updated: "3w ago", tags: ["communication"] },
      { id: "f8", title: "New BCBA Start Guide",            type: "Guide", description: "Your first 30/60/90 days at Blossom.", minutes: 10, updated: "1mo ago", tags: ["onboarding","new"] },
    ],
  },
  {
    id: "caseload", label: "Caseload Management", icon: UserCheck,
    blurb: "Organize, prioritize, and protect a healthy caseload.",
    resources: [
      { id: "c1", title: "Caseload Organization SOP",       type: "SOP", description: "How to structure your week across clients, supervision, and PRs.", minutes: 5, updated: "2w ago", tags: ["caseload"] },
      { id: "c2", title: "Client Risk Identification Guide", type: "Guide", description: "Early signals that a client is operationally at risk.", minutes: 6, updated: "1w ago", tags: ["risk"], pinned: true },
      { id: "c3", title: "Caseload Prioritization Guide",   type: "Guide", description: "A simple framework for what to work on next.", minutes: 4, updated: "3w ago", tags: ["priority"] },
      { id: "c4", title: "Managing High-Risk Clients",      type: "Workflow", description: "Stabilization steps for clients with multiple risk factors.", minutes: 7, updated: "2w ago", tags: ["risk","clinical"] },
      { id: "c5", title: "Workflow Prioritization SOP",     type: "SOP", description: "How to triage competing operational demands.", minutes: 5, updated: "1mo ago", tags: ["priority"] },
      { id: "c6", title: "Attendance Concern Workflow",     type: "Workflow", description: "What to do when attendance dips below threshold.", minutes: 4, updated: "2w ago", tags: ["attendance"] },
      { id: "c7", title: "Operational Client Health Guide", type: "Guide", description: "How Blossom measures client operational health.", minutes: 5, updated: "3w ago", tags: ["health"] },
    ],
  },
  {
    id: "supervision", label: "Supervision Operations", icon: ClipboardCheck,
    blurb: "97155, overlaps, and supervision cadence — done well.",
    resources: [
      { id: "s1", title: "Supervision SOP",                 type: "SOP", description: "The Blossom supervision standard, end-to-end.", minutes: 8, updated: "1w ago", tags: ["supervision"], pinned: true },
      { id: "s2", title: "97155 Workflow Guide",            type: "Workflow", description: "When, how, and why to use 97155 effectively.", minutes: 6, updated: "2w ago", tags: ["97155","supervision"] },
      { id: "s3", title: "Overlap Expectations",            type: "Guide", description: "Required overlap cadence and how to document it.", minutes: 4, updated: "3w ago", tags: ["overlap"] },
      { id: "s4", title: "Supervision Scheduling Guide",    type: "Guide", description: "Coordinating supervision with the scheduling team.", minutes: 5, updated: "2w ago", tags: ["scheduling"] },
      { id: "s5", title: "Supervision Escalation Workflow", type: "Workflow", description: "When supervision falls behind — who, what, when.", minutes: 5, updated: "1w ago", tags: ["escalation"] },
      { id: "s6", title: "RBT Support Expectations",        type: "Guide", description: "Coaching, feedback, and support cadence for your RBTs.", minutes: 6, updated: "2w ago", tags: ["rbt"] },
      { id: "s7", title: "Missed Supervision Protocol",     type: "SOP", description: "Recovery steps after a missed supervision window.", minutes: 4, updated: "3w ago", tags: ["recovery"] },
      { id: "s8", title: "Supervision Risk Reduction Guide", type: "Guide", description: "Patterns that prevent supervision gaps from forming.", minutes: 5, updated: "1mo ago", tags: ["prevention"] },
    ],
  },
  {
    id: "pr-auth", label: "Progress Reports & Authorizations", icon: FileSignature,
    blurb: "PRs, reassessments, and authorization workflows — the operational core.",
    resources: [
      { id: "p1", title: "PR SOP",                          type: "SOP", description: "The full Blossom PR standard.", minutes: 9, updated: "1w ago", tags: ["pr"], pinned: true },
      { id: "p2", title: "PR Timeline Guide",               type: "Guide", description: "9-week reminders, 6-week escalations, and SD involvement.", minutes: 5, updated: "1w ago", tags: ["pr","timeline"], pinned: true },
      { id: "p3", title: "Authorization Expiration Workflow", type: "Workflow", description: "Preventing lapses before authorizations expire.", minutes: 6, updated: "2w ago", tags: ["auth"] },
      { id: "p4", title: "Reassessment Workflow",           type: "Workflow", description: "Operational steps for a clean reassessment.", minutes: 7, updated: "2w ago", tags: ["reassessment"] },
      { id: "p5", title: "Parent Signature Guide",          type: "Guide", description: "How to get signatures without delay.", minutes: 3, updated: "3w ago", tags: ["signatures","parents"] },
      { id: "p6", title: "QA Coordination Guide",           type: "Guide", description: "Working effectively with QA on PR review.", minutes: 5, updated: "2w ago", tags: ["qa"] },
      { id: "p7", title: "PR Escalation Workflow",          type: "Workflow", description: "What happens at 9 weeks, 6 weeks, and SD involvement.", minutes: 4, updated: "1w ago", tags: ["pr","escalation"] },
      { id: "p8", title: "Authorization Risk Reduction Guide", type: "Guide", description: "Habits that prevent auth risks before they start.", minutes: 5, updated: "1mo ago", tags: ["auth","prevention"] },
      { id: "p9", title: "PR Submission Checklist",         type: "Checklist", description: "Final-pass checklist before submitting any PR.", minutes: 2, updated: "1w ago", tags: ["pr","checklist"] },
      { id: "p10", title: "PR Best Practices",              type: "Guide", description: "Calm, repeatable PR writing patterns.", minutes: 6, updated: "3w ago", tags: ["pr","writing"] },
    ],
  },
  {
    id: "parent-training", label: "Parent Training", icon: HeartHandshake,
    blurb: "97156 cadence, caregiver engagement, and family coordination.",
    resources: [
      { id: "pt1", title: "Parent Training SOP",            type: "SOP", description: "The Blossom parent training standard.", minutes: 7, updated: "2w ago", tags: ["pt"] },
      { id: "pt2", title: "97156 Workflow Guide",           type: "Workflow", description: "When, how, and why to run 97156 sessions well.", minutes: 6, updated: "2w ago", tags: ["97156"], pinned: true },
      { id: "pt3", title: "Parent Engagement Best Practices", type: "Guide", description: "Patterns that keep caregivers engaged over time.", minutes: 5, updated: "3w ago", tags: ["engagement"] },
      { id: "pt4", title: "Scheduling Parent Trainings",    type: "Guide", description: "Coordinating PT sessions without friction.", minutes: 4, updated: "2w ago", tags: ["scheduling"] },
      { id: "pt5", title: "Difficult Caregiver Situations", type: "Guide", description: "Navigating hard conversations with calm.", minutes: 7, updated: "1mo ago", tags: ["difficult"] },
      { id: "pt6", title: "Caregiver Communication Guide",  type: "Guide", description: "Communication patterns that build trust.", minutes: 5, updated: "3w ago", tags: ["communication"] },
      { id: "pt7", title: "Parent Training Documentation Standards", type: "SOP", description: "What to document and how.", minutes: 4, updated: "2w ago", tags: ["documentation"] },
      { id: "pt8", title: "Improving Participation Guide",  type: "Guide", description: "Practical levers to lift PT participation.", minutes: 5, updated: "3w ago", tags: ["participation"] },
    ],
  },
  {
    id: "scheduling", label: "Scheduling Coordination", icon: Calendar,
    blurb: "Coordination and escalation — BCBAs are not schedulers.",
    resources: [
      { id: "sc1", title: "Working With Scheduling SOP",    type: "SOP", description: "How the scheduling team works — and how to partner with them.", minutes: 5, updated: "2w ago", tags: ["scheduling"], pinned: true },
      { id: "sc2", title: "Cancellation Escalation Workflow", type: "Workflow", description: "When cancellations cross threshold — what to do.", minutes: 4, updated: "1w ago", tags: ["cancellations"] },
      { id: "sc3", title: "Staffing Instability Workflow",  type: "Workflow", description: "Surface and resolve unstable RBT coverage.", minutes: 5, updated: "2w ago", tags: ["staffing"] },
      { id: "sc4", title: "Session Disruption Guide",       type: "Guide", description: "Reducing the clinical impact of disruptions.", minutes: 4, updated: "3w ago", tags: ["sessions"] },
      { id: "sc5", title: "Reassignment Communication Guide", type: "Guide", description: "Talking to families and RBTs through a change.", minutes: 5, updated: "2w ago", tags: ["communication"] },
      { id: "sc6", title: "Attendance Concern Escalation",  type: "Workflow", description: "When attendance trends go the wrong way.", minutes: 4, updated: "2w ago", tags: ["attendance"] },
      { id: "sc7", title: "Parent Training Scheduling Guide", type: "Guide", description: "Booking PT without disrupting clinical care.", minutes: 4, updated: "3w ago", tags: ["pt","scheduling"] },
    ],
  },
  {
    id: "communication", label: "Clinical Communication", icon: MessageSquare,
    blurb: "Standards and copy/paste templates for every conversation.",
    resources: [
      { id: "cm1", title: "Parent Communication Standards", type: "SOP", description: "Tone, timing, and clarity for caregiver messages.", minutes: 5, updated: "2w ago", tags: ["parents"] },
      { id: "cm2", title: "Internal Communication SOP",     type: "SOP", description: "How clinical teams communicate inside Blossom.", minutes: 4, updated: "3w ago", tags: ["internal"] },
      { id: "cm3", title: "Scheduling Communication Guide", type: "Guide", description: "Talking to scheduling effectively.", minutes: 4, updated: "2w ago", tags: ["scheduling"] },
      { id: "cm4", title: "QA Communication Workflow",      type: "Workflow", description: "Tight loops with the QA team.", minutes: 4, updated: "3w ago", tags: ["qa"] },
      { id: "cm5", title: "Escalation Communication Guide", type: "Guide", description: "Calm, clear escalation messages.", minutes: 5, updated: "2w ago", tags: ["escalation"] },
      { id: "cm6", title: "RBT Support Communication",      type: "Guide", description: "Feedback that lands and lifts.", minutes: 5, updated: "1mo ago", tags: ["rbt"] },
      { id: "cm7", title: "Difficult Conversation Guide",   type: "Guide", description: "A framework for the hardest moments.", minutes: 6, updated: "1mo ago", tags: ["difficult"] },
    ],
  },
  {
    id: "escalations", label: "Escalations & Operational Workflows", icon: AlertTriangle,
    blurb: "Operational problem solving — pathways and patterns.",
    resources: [
      { id: "e1", title: "Escalation Pathways",             type: "Workflow", description: "Who to involve, when, and how.", minutes: 4, updated: "1w ago", tags: ["escalation"], pinned: true },
      { id: "e2", title: "Operational Blockers Workflow",   type: "Workflow", description: "Move past stuck workflows with confidence.", minutes: 5, updated: "2w ago", tags: ["blockers"] },
      { id: "e3", title: "Missing Documentation Workflow",  type: "Workflow", description: "Recovering missing or late documentation.", minutes: 4, updated: "3w ago", tags: ["docs"] },
      { id: "e4", title: "Client Risk Escalation Guide",    type: "Guide", description: "When client risk needs leadership eyes.", minutes: 5, updated: "2w ago", tags: ["risk"] },
      { id: "e5", title: "High Cancellation Workflow",      type: "Workflow", description: "Stabilizing a high-cancellation client.", minutes: 5, updated: "2w ago", tags: ["cancellations"] },
      { id: "e6", title: "Parent Non-Response Workflow",    type: "Workflow", description: "Operationally re-engaging quiet families.", minutes: 5, updated: "3w ago", tags: ["parents"] },
      { id: "e7", title: "Scheduling Escalation Workflow",  type: "Workflow", description: "Escalating scheduling friction cleanly.", minutes: 4, updated: "2w ago", tags: ["scheduling"] },
      { id: "e8", title: "Emergency Escalation Standards",  type: "SOP", description: "Clinical emergencies — Blossom's standard.", minutes: 6, updated: "1mo ago", tags: ["emergency"] },
    ],
  },
  {
    id: "os-guides", label: "Blossom OS Guides", icon: Workflow,
    blurb: "How to use Blossom OS — page by page.",
    resources: [
      { id: "o1", title: "Dashboard Guide",                 type: "Guide", description: "Reading your BCBA dashboard at a glance.", minutes: 3, updated: "1w ago", tags: ["os"] },
      { id: "o2", title: "Workspace Guide",                 type: "Guide", description: "The BCBA Workspace, end-to-end.", minutes: 4, updated: "1w ago", tags: ["os"] },
      { id: "o3", title: "Clients Page Guide",              type: "Guide", description: "Working your caseload from the Clients page.", minutes: 4, updated: "2w ago", tags: ["os","clients"] },
      { id: "o4", title: "Supervision Page Guide",          type: "Guide", description: "Reading and acting from Supervision.", minutes: 4, updated: "2w ago", tags: ["os","supervision"] },
      { id: "o5", title: "Parent Training Page Guide",      type: "Guide", description: "Running 97156 cadence from one screen.", minutes: 4, updated: "2w ago", tags: ["os","pt"] },
      { id: "o6", title: "Scheduling Visibility Guide",     type: "Guide", description: "What BCBAs can see — and what they can't.", minutes: 3, updated: "2w ago", tags: ["os","scheduling"] },
      { id: "o7", title: "Authorization Page Guide",        type: "Guide", description: "Tracking auths and PRs operationally.", minutes: 4, updated: "2w ago", tags: ["os","auth"] },
      { id: "o8", title: "Getting Clean Operational Answers",     type: "Guide", description: "How to find the right SOP, workflow, or template fast — plus who to ask when you can't.", minutes: 3, updated: "1w ago", tags: ["os","help"] },
      { id: "o9", title: "Notification Guide",              type: "Guide", description: "Tuning notifications to stay calm and informed.", minutes: 3, updated: "3w ago", tags: ["os"] },
    ],
  },
  {
    id: "templates", label: "Templates & Quick Resources", icon: FileText,
    blurb: "Copy/paste templates and operational cheat sheets.",
    resources: [
      { id: "t1", title: "Parent Follow-Up Templates",      type: "Template", description: "Templates for every common parent follow-up.", minutes: 2, updated: "1w ago", tags: ["templates","parents"], pinned: true },
      { id: "t2", title: "Scheduling Escalation Templates", type: "Template", description: "Calm, clear messages to scheduling.", minutes: 2, updated: "2w ago", tags: ["templates","scheduling"] },
      { id: "t3", title: "Supervision Follow-Up Templates", type: "Template", description: "Coaching notes that land.", minutes: 2, updated: "2w ago", tags: ["templates","supervision"] },
      { id: "t4", title: "PR Reminder Templates",           type: "Template", description: "Nudges for parents, RBTs, and QA.", minutes: 2, updated: "1w ago", tags: ["templates","pr"] },
      { id: "t5", title: "Documentation Checklists",        type: "Checklist", description: "Quick checks before submitting.", minutes: 2, updated: "3w ago", tags: ["checklists","docs"] },
      { id: "t6", title: "Session Coordination Templates",  type: "Template", description: "Coordination messages, ready to send.", minutes: 2, updated: "2w ago", tags: ["templates","sessions"] },
      { id: "t7", title: "Quick Workflow Checklists",       type: "Checklist", description: "One-page checklists for common workflows.", minutes: 2, updated: "2w ago", tags: ["checklists"] },
      { id: "t8", title: "Operational Cheat Sheets",        type: "Guide", description: "The BCBA cheat-sheet pack.", minutes: 4, updated: "3w ago", tags: ["cheatsheet"] },
    ],
  },
  {
    id: "recordings", label: "Training Recordings", icon: PlayCircle,
    blurb: "On-demand operational learning.",
    resources: [
      { id: "r1", title: "PR Workflow Walkthrough",         type: "Recording", description: "End-to-end PR walkthrough with QA.", minutes: 18, updated: "2w ago", tags: ["pr"] },
      { id: "r2", title: "Supervision Walkthrough",         type: "Recording", description: "97155 in practice.", minutes: 14, updated: "3w ago", tags: ["supervision"] },
      { id: "r3", title: "Parent Training Best Practices",  type: "Recording", description: "What great PT looks like.", minutes: 22, updated: "1mo ago", tags: ["pt"] },
      { id: "r4", title: "Scheduling Coordination",         type: "Recording", description: "How to partner with scheduling.", minutes: 12, updated: "3w ago", tags: ["scheduling"] },
      { id: "r5", title: "Using Blossom OS",                type: "Recording", description: "Tour of the BCBA workspace.", minutes: 16, updated: "1w ago", tags: ["os"] },
      { id: "r6", title: "Operational Expectations",        type: "Recording", description: "What Blossom expects, plainly stated.", minutes: 10, updated: "1mo ago", tags: ["expectations"] },
      { id: "r7", title: "QA Coordination",                 type: "Recording", description: "Working tightly with QA.", minutes: 11, updated: "3w ago", tags: ["qa"] },
      { id: "r8", title: "Clinical Escalations",            type: "Recording", description: "Handling escalations with calm.", minutes: 13, updated: "1mo ago", tags: ["escalation"] },
    ],
  },
  {
    id: "faq", label: "FAQ & Troubleshooting", icon: HelpCircle,
    blurb: "Quick answers to common operational questions.",
    resources: [
      { id: "q1", title: "PR Timing Questions",             type: "FAQ", description: "When does a PR start, when must it submit, what triggers escalation.", minutes: 2, updated: "1w ago", tags: ["pr","faq"] },
      { id: "q2", title: "Supervision Expectations",        type: "FAQ", description: "Cadence, overlap, and documentation answers.", minutes: 2, updated: "2w ago", tags: ["supervision","faq"] },
      { id: "q3", title: "Scheduling Escalation Questions", type: "FAQ", description: "When and how to escalate to scheduling.", minutes: 2, updated: "2w ago", tags: ["scheduling","faq"] },
      { id: "q4", title: "Parent Training Concerns",        type: "FAQ", description: "Common PT questions answered.", minutes: 2, updated: "3w ago", tags: ["pt","faq"] },
      { id: "q5", title: "Documentation Expectations",      type: "FAQ", description: "What's required, where it lives.", minutes: 2, updated: "2w ago", tags: ["docs","faq"] },
      { id: "q6", title: "QA Questions",                    type: "FAQ", description: "Working with QA, demystified.", minutes: 2, updated: "3w ago", tags: ["qa","faq"] },
      { id: "q7", title: "Workflow Troubleshooting",        type: "FAQ", description: "When workflows stall — what to try first.", minutes: 2, updated: "2w ago", tags: ["faq"] },
      { id: "q8", title: "System Troubleshooting",          type: "FAQ", description: "Common Blossom OS hiccups and fixes.", minutes: 2, updated: "2w ago", tags: ["os","faq"] },
    ],
  },
];

export default function OSBCBAResources() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("foundations");
  const [open, setOpen] = useState<Resource | null>(null);

  // Caseload-aware: derive operational signals from REAL data and recommend resources.
  const c = useBcbaCaseload();

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const allResources = useMemo(() => {
    return CATEGORIES.flatMap((c) => c.resources.map((r) => ({ ...r, _cat: c.id, _catLabel: c.label })));
  }, []);

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return allResources.filter((r) => {
      const hay = `${r.title} ${r.description} ${r.type} ${r.tags.join(" ")} ${r._catLabel}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 40);
  }, [allResources, q, isSearching]);

  const pinned = useMemo(() => allResources.filter((r) => r.pinned).slice(0, 6), [allResources]);
  const recent = useMemo(() => allResources.slice(0, 5), [allResources]);

  // Recommend resources based on real caseload risks (auths, supervision, cancellations, PT gaps).
  const recommended = useMemo(() => {
    const buckets: { id: string; reason: string; resourceId: string }[] = [];
    const prSoon = c.authAlerts.filter((a) => a.sev === "crit" || a.sev === "warn").length;
    const supBehind = c.supervisionAlerts.length;
    const cancels = c.cancellationAlerts.length;
    const ptGaps = c.ptAlerts.length;
    const coverage = c.coverageAlerts.length;

    if (prSoon > 0) {
      buckets.push({ id: "rec-pr", resourceId: "p2", reason: `${prSoon} authorization${prSoon === 1 ? "" : "s"} needs attention — review the PR timeline.` });
      buckets.push({ id: "rec-pr-esc", resourceId: "p7", reason: "Use the PR escalation pathway if you can't close the loop." });
    }
    if (supBehind > 0) {
      buckets.push({ id: "rec-sup", resourceId: "s1", reason: `${supBehind} client${supBehind === 1 ? "" : "s"} past supervision cadence.` });
      buckets.push({ id: "rec-97155", resourceId: "s2", reason: "Refresh on 97155 cadence and how it counts." });
    }
    if (cancels > 0 || coverage > 0) {
      buckets.push({ id: "rec-sched", resourceId: "sc2", reason: `${cancels + coverage} client${cancels + coverage === 1 ? "" : "s"} with cancellation or coverage risk.` });
    }
    if (ptGaps > 0) {
      buckets.push({ id: "rec-pt", resourceId: "pt2", reason: `${ptGaps} caregiver${ptGaps === 1 ? "" : "s"} overdue for 97156.` });
    }

    return buckets
      .map((b) => {
        const r = allResources.find((x) => x.id === b.resourceId);
        return r ? { reason: b.reason, resource: r as Resource & { _catLabel: string } } : null;
      })
      .filter((x): x is { reason: string; resource: Resource & { _catLabel: string } } => !!x)
      .slice(0, 4);
  }, [c.authAlerts, c.supervisionAlerts, c.cancellationAlerts, c.ptAlerts, c.coverageAlerts, allResources]);

  const current = CATEGORIES.find((c) => c.id === activeCat)!;
  const totalCount = allResources.length;

  // Suggest related resources from the same category when a resource is open.
  const related = useMemo(() => {
    if (!open) return [] as (Resource & { _catLabel?: string })[];
    const cat = CATEGORIES.find((c) => c.resources.some((r) => r.id === open.id));
    if (!cat) return [];
    return cat.resources.filter((r) => r.id !== open.id).slice(0, 4).map((r) => ({ ...r, _catLabel: cat.label }));
  }, [open]);

  return (
    <OSShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span>BCBA</span>
            <ChevronRight className="size-3" />
            <span>Resource Library</span>
          </div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Resource Library</h1>
              <p className="text-[15px] text-muted-foreground max-w-2xl">
                The operational knowledge base for BCBAs — SOPs, workflows, templates, and recordings, all scoped to your role.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span><span className="text-foreground font-medium">{totalCount}</span> resources</span>
              <span className="h-4 w-px bg-border" />
              <span><span className="text-foreground font-medium">{CATEGORIES.length}</span> categories</span>
            </div>
          </div>

          {/* Search */}
          <div className="pt-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SOPs, workflows, templates, recordings…"
                className="w-full h-12 rounded-2xl bg-muted/60 border border-border pl-11 pr-12 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full size-7 grid place-items-center hover:bg-muted transition">
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-muted-foreground">
              <span>Try:</span>
              {["PR", "supervision", "97155", "parent training", "scheduling escalation", "QA"].map((t) => (
                <button key={t} onClick={() => setQuery(t)} className="rounded-full px-3 py-1 bg-muted/60 border border-border/70 hover:bg-muted hover:text-foreground transition">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isSearching ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-medium tracking-tight">
                Results <span className="text-muted-foreground font-normal">· {searchResults.length}</span>
              </h2>
              <button onClick={() => setQuery("")} className="text-sm text-muted-foreground hover:text-foreground transition">Clear</button>
            </div>
            {searchResults.length === 0 ? (
              <div className="rounded-2xl bg-muted/60 border border-border/60 p-10 text-center">
                <p className="text-foreground">No matches for "{query}".</p>
                <p className="text-sm text-muted-foreground mt-1">Try a broader term or reach out to your State Director for help.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchResults.map((r) => (
                  <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} categoryLabel={(r as any)._catLabel} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Recommended from real caseload signals */}
            {recommended.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-primary" />
                  <h2 className="text-xl font-medium tracking-tight">Recommended right now</h2>
                  <span className="text-xs text-muted-foreground">· based on your caseload</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommended.map(({ resource, reason }) => (
                    <button
                      key={resource.id + reason}
                      onClick={() => setOpen(resource)}
                      className="group text-left rounded-2xl bg-card border border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_28px_-16px_oklch(0.2_0.02_260/0.18)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeChip[resource.type])}>{resource.type}</span>
                        <span className="text-[11px] text-muted-foreground">{resource._catLabel}</span>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[15px] font-medium leading-snug tracking-tight">{resource.title}</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{reason}</p>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                        Open resource <ChevronRight className="size-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Pinned + Continue */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-primary" />
                  <h2 className="text-xl font-medium tracking-tight">Pinned for BCBAs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pinned.map((r) => (
                    <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} categoryLabel={(r as any)._catLabel} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h2 className="text-xl font-medium tracking-tight">Recently updated</h2>
                </div>
                <div className="rounded-2xl bg-card border border-border/70 divide-y divide-border/60 overflow-hidden">
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setOpen(r)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/60 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.type} · {r.updated}</div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Category browser */}
            <section className="space-y-5">
              <h2 className="text-xl font-medium tracking-tight">Browse by category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = c.id === activeCat;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(c.id)}
                      className={cn(
                        "group text-left rounded-2xl border p-4 transition-all",
                        active
                          ? "bg-card border-border shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
                          : "bg-muted/40 border-border/60 hover:bg-muted/70 hover:-translate-y-0.5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("rounded-xl size-9 grid place-items-center shrink-0 transition", active ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground group-hover:text-foreground")}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{c.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.resources.length} resources</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active category */}
              <div className="rounded-2xl bg-card border border-border/70 p-6 md:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{current.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{current.blurb}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{current.resources.length} resources</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {current.resources.map((r) => (
                    <ResourceCard key={r.id} r={r} onOpen={() => setOpen(r)} />
                  ))}
                </div>
              </div>
            </section>

          </>
        )}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeChip[open.type])}>{open.type}</span>
                  <span className="text-xs text-muted-foreground">Updated {open.updated}</span>
                </div>
                <SheetTitle className="text-xl tracking-tight pt-1">{open.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <p className="text-[15px] text-foreground leading-relaxed">{open.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {open.minutes ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {open.minutes} min</span> : null}
                  {open.tags.length > 0 && <span className="h-4 w-px bg-border" />}
                  <div className="flex flex-wrap gap-1.5">
                    {open.tags.map((t) => (
                      <span key={t} className="rounded-full px-2 py-0.5 bg-muted/70 border border-border/60 text-xs">{t}</span>
                    ))}
                  </div>
                </div>

                {related.length > 0 && (
                  <section className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Related resources</div>
                    <ul className="divide-y divide-border/60">
                      {related.map((r) => (
                        <li key={r.id}>
                          <button
                            onClick={() => setOpen(r)}
                            className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:text-foreground transition"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{r.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{r.type} · {r.updated}</div>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="rounded-2xl border border-border/70 bg-card p-4 flex items-start gap-3">
                  <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0">
                    <LifeBuoy className="size-4" />
                  </span>
                  <div className="text-sm">
                    <div className="font-medium">Need help using this resource?</div>
                    <p className="text-muted-foreground text-[13px] mt-0.5">
                      Reach out to your Clinical Director or State Director for coaching, or open a{" "}
                      <Link to="/tasks" className="underline underline-offset-2">support task</Link>.
                    </p>
                  </div>
                </section>

                <div className="flex items-center gap-2">
                  <button className="h-10 rounded-xl px-5 bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90 transition">Open resource</button>
                  <button className="h-10 rounded-xl px-4 bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2">
                    <Bookmark className="size-4" /> Save
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

function ResourceCard({ r, onOpen, categoryLabel }: { r: Resource; onOpen: () => void; categoryLabel?: string }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-2xl bg-card border border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_28px_-16px_oklch(0.2_0.02_260/0.18)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", typeChip[r.type])}>{r.type}</span>
        {r.pinned && <Star className="size-3.5 text-primary fill-primary/30" />}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="text-[15px] font-medium leading-snug tracking-tight">{r.title}</div>
        <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {r.minutes ? <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {r.minutes} min</span> : <span>—</span>}
          {categoryLabel && <><span className="h-3 w-px bg-border" /><span className="truncate max-w-[140px]">{categoryLabel}</span></>}
        </div>
        <span>{r.updated}</span>
      </div>
    </button>
  );
}