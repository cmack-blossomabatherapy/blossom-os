// RBT Training Academy — resources system.
// Aligned to "FINAL - RBT Resource Library Upload - 2026-07-14".
// Files live in the private `rbt-resources` storage bucket; open actions
// resolve via signed URLs (see getRBTResourceOpenUrl).
//
// Blossom OS is the training / resource / progress-tracking layer. CentralReach
// remains the current clinical/session documentation system for RBT session
// notes and data collection.

import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RBTPathId } from "./rbtAcademy";

export const RBT_RESOURCES_BUCKET = "rbt-resources";

export type RBTResourceType =
  | "YouTube Video"
  | "Internal Video"
  | "SOP"
  | "Checklist"
  | "Template"
  | "Quiz"
  | "Mock Form"
  | "Trainer Note"
  | "PDF"
  | "Worksheet"
  | "Policy"
  | "Research Article"
  | "How-To"
  | "Meeting Recording"
  | "Video"
  | "Signoff"
  | "Handoff Reference"
  | "Training Resource"
  | "Needs Review";

export const RBT_RESOURCE_TYPES: RBTResourceType[] = [
  "YouTube Video",
  "Internal Video",
  "SOP",
  "Checklist",
  "Template",
  "Quiz",
  "Mock Form",
  "Trainer Note",
  "PDF",
  "Worksheet",
  "Policy",
  "Research Article",
  "How-To",
  "Meeting Recording",
  "Video",
  "Signoff",
  "Handoff Reference",
  "Training Resource",
  "Needs Review",
];

// ---------- Categories (13 per 2026-07-14 upload package) ----------

export type RBTResourceCategoryId =
  | "start-here"
  | "sops"
  | "training-academy"
  | "videos"
  | "worksheets"
  | "research"
  | "certification"
  | "ethics-handbook"
  | "blossom-policies"
  | "nonbillable-points"
  | "cr-session-notes"
  | "clinical-skills"
  | "handoffs"
  | "role-packet-signoff"
  | "needs-review";

export interface RBTResourceCategory {
  id: RBTResourceCategoryId;
  label: string;
  description: string;
}

export const RBT_RESOURCE_CATEGORIES: RBTResourceCategory[] = [
  { id: "start-here",          label: "RBT Start Here",                               description: "Orientation, journey overview, and how Blossom OS supports the RBT role." },
  { id: "sops",                label: "RBT SOPs",                                     description: "Current-operations SOPs (PDF only) for the RBT role." },
  { id: "training-academy",    label: "RBT Training Academy Resources",               description: "Journey packs, click-and-collect notes, and program overviews." },
  { id: "videos",              label: "RBT Videos and Walkthroughs",                  description: "Board workflow videos and collaboration meeting recordings." },
  { id: "worksheets",          label: "RBT Worksheets",                               description: "Monthly field practice worksheets and quick exercises." },
  { id: "research",            label: "RBT Research Articles",                        description: "Peer-reviewed articles for deeper reference reading." },
  { id: "certification",       label: "BACB Certification and Competency",            description: "RBT 2026 Requirements, Initial Competency, PDU, and study resources." },
  { id: "ethics-handbook",     label: "RBT Ethics and Handbook",                      description: "BACB RBT Handbook and Ethics Code — required reading." },
  { id: "blossom-policies",    label: "Blossom RBT Policies",                         description: "PTO, scheduling changes, payroll, mileage, and orientation policies." },
  { id: "nonbillable-points",  label: "Non-Billable Activities and Points Program",   description: "Non-billable policy, activities, points system, and retention program." },
  { id: "cr-session-notes",    label: "CentralReach Session Notes and Data Collection", description: "CR session note examples, walkthroughs, and data collection guides." },
  { id: "clinical-skills",     label: "Clinical Skills and Field Session Support",    description: "Prompting, methodologies, sub-specialties, and assent references." },
  { id: "handoffs",            label: "Scheduling, Supervision, and BCBA Handoffs",   description: "BCBA case oversight and case-manager binder references for RBT handoffs." },
  { id: "role-packet-signoff", label: "RBT Role Packet and Signoff",                  description: "RBT Field Team Member signoff and role packet resources." },
  { id: "needs-review",        label: "Needs Review - RBT Adjacent",                  description: "Planning references and adjacent materials — not current SOPs." },
];

export const TRACK_LABELS: Record<RBTPathId, string> = {
  not_certified:           "Not Certified",
  certified_no_experience: "Certified · No Experience",
  certified_under_2yrs:    "Certified · Under 2 Years",
  certified_2yrs_plus:     "Certified · 2+ Years",
};

export interface RBTResource {
  id: string;
  title: string;
  type: RBTResourceType;
  /** External link, internal path, or YouTube URL. */
  url?: string;
  /** Path inside the rbt-resources storage bucket for signed-URL open. */
  storagePath?: string;
  /** Storage bucket override — defaults to rbt-resources. */
  bucket?: string;
  description?: string;
  body?: string;
  moduleIds: string[];
  minutes?: number;
  category?: RBTResourceCategoryId;
  tags?: string[];
  required?: boolean;
  tracks?: RBTPathId[];
  seeded?: boolean;
  updatedAt?: string;
  needsReview?: boolean;
  planningOnly?: boolean;
}

// ---------- Starter resources: mirrors the rbt-resources bucket ----------

export const STARTER_RBT_RESOURCES: RBTResource[] = [
  // Start Here (narrative)
  { id: "rbt-start-here-overview", title: "RBT — Start Here", type: "Training Resource", category: "start-here", description: "Current-state overview of what RBTs own at Blossom and how the Resource Library is organized. CentralReach remains the current session/documentation system.", tags: ["start-here","overview"], moduleIds: ["welcome-1"], required: true, seeded: true },
  { id: "rbt-start-here-journey", title: "RBT 4-Week Onboarding Journey — Overview", type: "Training Resource", category: "start-here", description: "How the RBT Training Academy journey is organized week by week and how resources attach to modules.", tags: ["journey","onboarding"], moduleIds: ["welcome-1"], required: true, seeded: true },
  { id: "rbt-april-abc-crossword", title: "(April) ABC Crossword", type: "Worksheet", category: "worksheets", storagePath: "(April) ABC Crossword.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-antecedent-toolbox", title: "(April) Antecedent Toolbox", type: "Worksheet", category: "worksheets", storagePath: "(April) Antecedent Toolbox.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-assent-radar", title: "(April) Assent Radar", type: "Worksheet", category: "worksheets", storagePath: "(April) Assent Radar.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-brain-dump", title: "(April) Brain Dump", type: "Worksheet", category: "worksheets", storagePath: "(April) Brain Dump.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-caregiver-handoff-ad-lib", title: "(April) Caregiver Handoff Ad Lib", type: "Worksheet", category: "worksheets", storagePath: "(April) Caregiver Handoff Ad-Lib.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-differential-reinforcement-crossword", title: "(April) Differential Reinforcement Crossword", type: "Worksheet", category: "worksheets", storagePath: "(April) Differential Reinforcement Crossword.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-documentation-decoder-crossword", title: "(April) Documentation Decoder Crossword", type: "Worksheet", category: "worksheets", storagePath: "(April) Documentation Decoder Crossword.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-end-of-session-speed-run", title: "(April) End of Session Speed Run", type: "Worksheet", category: "worksheets", storagePath: "(April) End-of-Session Speed Run.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-error-correction-comic", title: "(April) Error Correction Comic", type: "Worksheet", category: "worksheets", storagePath: "(April) Error Correction Comic.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-feral-final-review", title: "(April) Feral Final Review", type: "Worksheet", category: "worksheets", storagePath: "(April) Feral Final Review.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-generalization-game-plan", title: "(April) Generalization Game Plan", type: "Worksheet", category: "worksheets", storagePath: "(April) Generalization Game Plan.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-net-or-dtt", title: "(April) NET or DTT", type: "Worksheet", category: "worksheets", storagePath: "(April) NET or DTT.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-notes-but-make-them-objective", title: "(April) Notes But Make Them Objective", type: "Worksheet", category: "worksheets", storagePath: "(April) Notes But Make Them Objective.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-operational-definition-lab", title: "(April) Operational Definition Lab", type: "Worksheet", category: "worksheets", storagePath: "(April) Operational Definition Lab.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-pairing-power-up-bingo", title: "(April) Pairing Power Up Bingo", type: "Worksheet", category: "worksheets", storagePath: "(April) Pairing Power-Up Bingo.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-preference-assessment-picnic", title: "(April) Preference Assessment Picnic", type: "Worksheet", category: "worksheets", storagePath: "(April) Preference Assessment Picnic.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-prompt-fade-path", title: "(April) Prompt Fade Path", type: "Worksheet", category: "worksheets", storagePath: "(April) Prompt Fade Path.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-reinforcement-remix", title: "(April) Reinforcement Remix", type: "Worksheet", category: "worksheets", storagePath: "(April) Reinforcement Remix.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-reinforcer-detective", title: "(April) Reinforcer Detective", type: "Worksheet", category: "worksheets", storagePath: "(April) Reinforcer Detective.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-replacement-skill-decoder", title: "(April) Replacement Skill Decoder", type: "Worksheet", category: "worksheets", storagePath: "(April) Replacement Skill Decoder.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-safety-and-reporting-snapshot", title: "(April) Safety and Reporting Snapshot", type: "Worksheet", category: "worksheets", storagePath: "(April) Safety and Reporting Snapshot.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-school-and-community-script-builder", title: "(April) School and Community Script Builder", type: "Worksheet", category: "worksheets", storagePath: "(April) School and Community Script Builder.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-scope-check-bestie", title: "(April) Scope Check Bestie", type: "Worksheet", category: "worksheets", storagePath: "(April) Scope Check Bestie.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-session-note-ad-lib", title: "(April) Session Note Ad Lib", type: "Worksheet", category: "worksheets", storagePath: "(April) Session Note Ad-Lib.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-task-analysis-tidy-up", title: "(April) Task Analysis Tidy Up", type: "Worksheet", category: "worksheets", storagePath: "(April) Task Analysis Tidy-Up.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-tiny-chaos-big-data", title: "(April) Tiny Chaos Big Data", type: "Worksheet", category: "worksheets", storagePath: "(April) Tiny Chaos Big Data.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-token-board-glow-up", title: "(April) Token Board Glow Up", type: "Worksheet", category: "worksheets", storagePath: "(April) Token Board Glow-Up.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-use-the-ladder-not-your-vibes", title: "(April) Use The Ladder Not Your Vibes", type: "Worksheet", category: "worksheets", storagePath: "(April) Use The Ladder Not Your Vibes.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-visual-support-fix-it", title: "(April) Visual Support Fix It", type: "Worksheet", category: "worksheets", storagePath: "(April) Visual Support Fix-It.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-april-when-the-transition-hits", title: "(April) When The Transition Hits", type: "Worksheet", category: "worksheets", storagePath: "(April) When The Transition Hits.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-aba-meme-breakdown", title: "(March) ABA Meme Breakdown", type: "Worksheet", category: "worksheets", storagePath: "(March) ABA Meme Breakdown.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-bcba-vs-rbt-text-message", title: "(March) BCBA vs. RBT Text Message", type: "Worksheet", category: "worksheets", storagePath: "(March) BCBA vs. RBT Text-Message.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-data-graph-interpretation", title: "(March) Data Graph Interpretation", type: "Worksheet", category: "worksheets", storagePath: "(March) Data Graph Interpretation.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-reinforcer-scavenger-hunt", title: "(March) Reinforcer Scavenger Hunt", type: "Worksheet", category: "worksheets", storagePath: "(March) Reinforcer Scavenger Hunt.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-session-note-bingo-what-not-to-write", title: "(March) Session Note Bingo (What NOT to Write)", type: "Worksheet", category: "worksheets", storagePath: "(March) Session Note Bingo (What NOT to Write).pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-spot-the-ethical-violation", title: "(March) Spot the Ethical Violation", type: "Worksheet", category: "worksheets", storagePath: "(March) Spot the Ethical Violation.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-march-things-that-only-happen-in-home-sessions", title: "(March) Things That Only Happen in Home Sessions", type: "Worksheet", category: "worksheets", storagePath: "(March) Things That Only Happen in Home Sessions.pdf", tags: ["worksheet", "practice"], moduleIds: [], seeded: true },
  { id: "rbt-06-26-26-blossom-non-billables-program", title: "Blossom Non Billables Program", type: "Policy", category: "nonbillable-points", storagePath: "06.26.26 Blossom Non-Billables Program.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-2026-rbt-initial-competency-assessment-packet", title: "2026 RBT Initial Competency Assessment Packet", type: "PDF", category: "certification", storagePath: "2026 RBT Initial Competency Assessment Packet.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-2026-rbt-initial-competency-assessment", title: "2026 RBT Initial Competency Assessment", type: "PDF", category: "certification", storagePath: "2026 RBT Initial Competency Assessment.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-2026-rbt-initial-competency-assessment-251106-a", title: "RBT_Initial_Competency_Assessment 251106 a", type: "PDF", category: "certification", storagePath: "2026-RBT_Initial_Competency_Assessment-251106-a.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-22-binder-index", title: "Binder Index", type: "Handoff Reference", category: "handoffs", storagePath: "22 - Binder Index.pdf", tags: ["case-manager", "binder", "handoff"], moduleIds: [], seeded: true },
  { id: "rbt-22-job-packet", title: "Job Packet", type: "Handoff Reference", category: "handoffs", storagePath: "22 - Job Packet.pdf", tags: ["case-manager", "binder", "handoff"], moduleIds: [], seeded: true },
  { id: "rbt-22-role-deep-dive", title: "Role Deep Dive", type: "Handoff Reference", category: "handoffs", storagePath: "22 - Role Deep Dive.pdf", tags: ["case-manager", "binder", "handoff"], moduleIds: [], seeded: true },
  { id: "rbt-22-training-journey-and-30-60-90", title: "Training Journey and 30 60 90", type: "Handoff Reference", category: "handoffs", storagePath: "22 - Training Journey and 30-60-90.pdf", tags: ["case-manager", "binder", "handoff"], moduleIds: [], seeded: true },
  { id: "rbt-a-comparison-of-two-approaches-for-identifying-reinforcers-f", title: "A COMPARISON OF TWO APPROACHES FOR IDENTIFYING REINFORCERS FOR P", type: "Research Article", category: "research", storagePath: "A COMPARISON OF TWO APPROACHES FOR IDENTIFYING REINFORCERS FOR P.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-a-tutorial-on-the-concept-of-the-motivating-operation-and-it", title: "A Tutorial on the Concept of the Motivating Operation and its Im", type: "Research Article", category: "research", storagePath: "A Tutorial on the Concept of the Motivating Operation and its Im.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-aba-sub-specialties", title: "ABA Sub Specialties", type: "How-To", category: "clinical-skills", storagePath: "ABA Sub-Specialties.pdf", tags: ["clinical-skills", "field"], moduleIds: [], seeded: true },
  { id: "rbt-an-evaluation-of-positional-prompts-for-teaching-receptive-i", title: "An Evaluation of Positional Prompts for Teaching Receptive Ident", type: "Research Article", category: "research", storagePath: "An Evaluation of Positional Prompts for Teaching Receptive Ident.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-an-implicit-technology-of-generalization", title: "AN IMPLICIT TECHNOLOGY OF GENERALIZATION", type: "Research Article", category: "research", storagePath: "AN IMPLICIT TECHNOLOGY OF GENERALIZATION.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-applied-behavior-analysis-at-a-crossroads-reform-branding-an", title: "Applied Behavior Analysis at a Crossroads_ Reform Branding and t", type: "Research Article", category: "research", storagePath: "Applied Behavior Analysis at a Crossroads_ Reform Branding and t.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-assent-in-applied-behaviour-analysis-and-positive-behaviour-", title: "Assent in applied behaviour analysis and positive behaviour supp", type: "Research Article", category: "research", storagePath: "Assent in applied behaviour analysis and positive behaviour supp.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-blossom-aba-therapy-training-program-updated-original", title: "Blossom ABA Therapy Training Program Updated Original", type: "Training Resource", category: "training-academy", storagePath: "Blossom ABA Therapy Training Program Updated - Original.docx", tags: ["training-academy", "journey"], moduleIds: [], seeded: true },
  { id: "rbt-blossom-aba-therapy-training-program-updated-rbt-journey", title: "Blossom ABA Therapy Training Program Updated RBT Journey", type: "Training Resource", category: "training-academy", storagePath: "Blossom ABA Therapy Training Program Updated - RBT Journey.docx", tags: ["training-academy", "journey"], moduleIds: [], seeded: true },
  { id: "rbt-blossom-non-billable-and-points-system-final", title: "Blossom Non Billable and Points System_Final", type: "Policy", category: "nonbillable-points", storagePath: "Blossom Non-Billable and Points System_Final.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-blossom-non-billable-points-system-cheat-sheet-1", title: "Blossom Non Billable_Points System Cheat Sheet", type: "Policy", category: "nonbillable-points", storagePath: "Blossom Non-Billable_Points System Cheat Sheet (1).pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-blossom-rbt-retention-program", title: "Blossom RBT Retention Program", type: "Policy", category: "nonbillable-points", storagePath: "Blossom RBT Retention Program.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-click-and-collect-april-8th-2026", title: "Click and Collect April 8th 2026", type: "Training Resource", category: "training-academy", storagePath: "Click and Collect-April 8th 2026.pdf", tags: ["click-and-collect", "training"], moduleIds: [], seeded: true },
  { id: "rbt-click-and-collect-feb-15th-2026", title: "Click and Collect Feb 15th 2026", type: "Training Resource", category: "training-academy", storagePath: "Click and Collect-Feb 15th 2026.pdf", tags: ["click-and-collect", "training"], moduleIds: [], seeded: true },
  { id: "rbt-clinical-services-current-vs-future-overview-needs-review", title: "Clinical Services Current vs Future Overview Needs Review", type: "Needs Review", category: "needs-review", storagePath: "Clinical Services Current vs Future Overview - Needs Review.pdf", tags: ["needs-review", "planning"], moduleIds: [], seeded: true, needsReview: true, planningOnly: true },
  { id: "rbt-compassionate-care-in-behavior-analytic-treatment-can-outcom", title: "Compassionate Care in Behavior Analytic Treatment Can Outcomes", type: "Research Article", category: "research", storagePath: "Compassionate Care in Behavior Analytic Treatment- Can Outcomes.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-cr-appointment-changes-flow-chart", title: "CR Appointment Changes Flow Chart", type: "PDF", category: "cr-session-notes", storagePath: "CR Appointment Changes Flow Chart.png", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-cr-maladaptive-behavior-examples", title: "CR Maladaptive Behavior Examples", type: "PDF", category: "cr-session-notes", storagePath: "CR Maladaptive Behavior Examples.pdf", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-cr-session-note-examples-1", title: "CR Session Note Examples", type: "PDF", category: "cr-session-notes", storagePath: "CR Session Note Examples (1).pdf", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-cr-session-note-examples-2", title: "CR Session Note Examples", type: "PDF", category: "cr-session-notes", storagePath: "CR Session Note Examples (2).pdf", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-cr-virtual-walk-through-2", title: "CR Virtual Walk Through 2", type: "PDF", category: "cr-session-notes", storagePath: "CR Virtual Walk-Through-2.mp4", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-cr-virtual-walk-through", title: "CR Virtual Walk Through", type: "PDF", category: "cr-session-notes", storagePath: "CR Virtual Walk-Through.mp4", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-employee-requesting-time-off-how-to", title: "Employee Requesting Time Off How To", type: "Policy", category: "blossom-policies", storagePath: "Employee-Requesting Time Off-How To.pdf", tags: ["policy", "admin"], moduleIds: [], seeded: true },
  { id: "rbt-guide-to-taking-data-2", title: "Guide To Taking Data", type: "How-To", category: "cr-session-notes", storagePath: "Guide To Taking Data (2).pdf", tags: ["centralreach", "session-note", "data-collection"], moduleIds: [], seeded: true },
  { id: "rbt-high-levels-of-burnout-among-early-career-board-certified-be", title: "High levels of burnout among early career board certified behavi", type: "Research Article", category: "research", storagePath: "High levels of burnout among early-career board-certified behavi.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-impact-of-treatment-integrity-on-intervention-effectiveness", title: "IMPACT OF TREATMENT INTEGRITY ON INTERVENTION EFFECTIVENESS", type: "Research Article", category: "research", storagePath: "IMPACT OF TREATMENT INTEGRITY ON INTERVENTION EFFECTIVENESS.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-l1-rbt-field-team-member-role-sop", title: "L1 RBT Field Team Member Role SOP", type: "SOP", category: "sops", storagePath: "L1-RBT-Field-Team-Member-Role-SOP.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-bcba-case-oversight-process-sop", title: "L2 BCBA Case Oversight Process SOP", type: "Handoff Reference", category: "handoffs", storagePath: "L2-BCBA-Case-Oversight-Process-SOP.pdf", tags: ["bcba", "handoff", "supervision"], moduleIds: [], seeded: true },
  { id: "rbt-l2-behavior-plans-current-operations", title: "L2 Behavior Plans — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Behavior-Plans-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-certifications-current-operations", title: "L2 Certifications — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Certifications-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-clinical-documentation-current-operations", title: "L2 Clinical Documentation — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Clinical-Documentation-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-clinical-escalation-and-case-review-process-sop", title: "L2 Clinical Escalation and Case Review Process SOP", type: "SOP", category: "sops", storagePath: "L2-Clinical-Escalation-and-Case-Review-Process-SOP.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-family-clinical-communication-process-sop", title: "L2 Family Clinical Communication Process SOP", type: "SOP", category: "sops", storagePath: "L2-Family-Clinical-Communication-Process-SOP.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-field-scheduling-current-operations", title: "L2 Field Scheduling — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Field-Scheduling-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-new-hire-training-current-operations", title: "L2 New Hire Training — Current Operations", type: "SOP", category: "sops", storagePath: "L2-New-Hire-Training-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-parent-training-current-operations", title: "L2 Parent Training — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Parent-Training-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-rbt-availability-update-process-sop", title: "L2 RBT Availability Update Process SOP", type: "SOP", category: "sops", storagePath: "L2-RBT-Availability-Update-Process-SOP.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-rbt-support-and-retention-process-sop", title: "L2 RBT Support and Retention Process SOP", type: "SOP", category: "sops", storagePath: "L2-RBT-Support-and-Retention-Process-SOP.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-role-training-current-operations", title: "L2 Role Training — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Role-Training-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-l2-session-expectations-current-operations", title: "L2 Session Expectations — Current Operations", type: "SOP", category: "sops", storagePath: "L2-Session-Expectations-Current-Operations.pdf", tags: ["sop", "current-operations"], moduleIds: [], seeded: true },
  { id: "rbt-methodologies-defined-1", title: "Methodologies Defined", type: "How-To", category: "clinical-skills", storagePath: "Methodologies Defined (1).pdf", tags: ["clinical-skills", "field"], moduleIds: [], seeded: true },
  { id: "rbt-miles-reimbursement-form", title: "Miles Reimbursement Form", type: "Policy", category: "blossom-policies", storagePath: "Miles Reimbursement Form.pdf", tags: ["policy", "admin"], moduleIds: [], seeded: true },
  { id: "rbt-naturalistic-developmental-behavioral-interventions-empirica", title: "Naturalistic Developmental Behavioral Interventions Empirically", type: "Research Article", category: "research", storagePath: "Naturalistic Developmental Behavioral Interventions- Empirically.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-non-billable-activities-in-home-rbts-10-1", title: "Non Billable Activities (In Home RBTs)", type: "Policy", category: "nonbillable-points", storagePath: "Non-Billable Activities (In-Home RBTs) (10) (1).pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-non-billable-activities-in-home-rbts", title: "Non Billable Activities (In Home RBTs)", type: "Policy", category: "nonbillable-points", storagePath: "Non-Billable Activities (In-Home RBTs).pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-non-billable-activity-verification-signature-form-3-1", title: "Non Billable Activity Verification_Signature Form", type: "Policy", category: "nonbillable-points", storagePath: "Non-Billable Activity Verification_Signature Form (3) (1).pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-non-billable-completion-signature-form", title: "Non Billable Completion Signature Form", type: "Policy", category: "nonbillable-points", storagePath: "Non-Billable Completion Signature Form.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-payroll-dates-2026", title: "Payroll Dates 2026", type: "Policy", category: "blossom-policies", storagePath: "Payroll Dates 2026.pdf", tags: ["policy", "admin"], moduleIds: [], seeded: true },
  { id: "rbt-predictors-of-burnout-job-satisfaction-and-turnover-in-behav", title: "Predictors of Burnout Job Satisfaction and Turnover in Behavior", type: "Research Article", category: "research", storagePath: "Predictors of Burnout Job Satisfaction and Turnover in Behavior.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-prompting-guide", title: "Prompting Guide", type: "How-To", category: "clinical-skills", storagePath: "Prompting Guide.pdf", tags: ["clinical-skills", "field"], moduleIds: [], seeded: true },
  { id: "rbt-prompts-prompt-fading-strategies", title: "Prompts prompt fading strategies", type: "How-To", category: "clinical-skills", storagePath: "Prompts-prompt-fading-strategies.pdf", tags: ["clinical-skills", "field"], moduleIds: [], seeded: true },
  { id: "rbt-pto-policy", title: "PTO Policy", type: "Policy", category: "blossom-policies", storagePath: "PTO Policy.pdf", tags: ["policy", "admin"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-2026-requirements", title: "RBT 2026 Requirements", type: "PDF", category: "certification", storagePath: "RBT 2026 Requirements.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-board-workflow-and-automations-overview", title: "RBT Board Workflow and Automations Overview", type: "Video", category: "videos", storagePath: "RBT Board Workflow and Automations Overview.mp4", tags: ["video", "board-workflow"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-click-and-collect-may-6th-2026", title: "RBT Click and Collect May 6th 2026", type: "Training Resource", category: "training-academy", storagePath: "RBT Click and Collect-May 6th 2026.pdf", tags: ["click-and-collect", "training"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-collaboration-zoom-meeting-jan-5th-2", title: "RBT Collaboration Zoom Meeting Jan 5th 2", type: "Meeting Recording", category: "videos", storagePath: "RBT Collaboration Zoom Meeting-Jan 5th-2.mp4", tags: ["video", "collaboration", "meeting"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-collaboration-zoom-meeting-jan-5th", title: "RBT Collaboration Zoom Meeting Jan 5th", type: "Meeting Recording", category: "videos", storagePath: "RBT Collaboration Zoom Meeting-Jan 5th.mp4", tags: ["video", "collaboration", "meeting"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-current-blossom-packet-needs-review", title: "RBT Current Blossom Packet Needs Review", type: "Needs Review", category: "needs-review", storagePath: "RBT Current Blossom Packet - Needs Review.pdf", tags: ["needs-review", "planning"], moduleIds: [], seeded: true, needsReview: true, planningOnly: true },
  { id: "rbt-rbt-engagement-point-system-10-1", title: "RBT Engagement Point System", type: "Policy", category: "nonbillable-points", storagePath: "RBT Engagement Point System (10) (1).pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-engagement-point-system", title: "RBT Engagement Point System", type: "Policy", category: "nonbillable-points", storagePath: "RBT Engagement Point System.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-ethics-code", title: "RBT Ethics Code", type: "Policy", category: "ethics-handbook", storagePath: "RBT Ethics Code.pdf", tags: ["bacb", "ethics", "handbook", "certification"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-field-team-member-signoff", title: "RBT Field Team Member Signoff", type: "Signoff", category: "certification", storagePath: "RBT Field Team Member Signoff.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-future-blossom-os-menu-map-needs-review", title: "RBT Future Blossom OS Menu Map Needs Review", type: "Needs Review", category: "needs-review", storagePath: "RBT Future Blossom OS Menu Map - Needs Review.pdf", tags: ["needs-review", "planning"], moduleIds: [], seeded: true, needsReview: true, planningOnly: true },
  { id: "rbt-rbt-handbook", title: "RBT Handbook", type: "Policy", category: "ethics-handbook", storagePath: "RBT Handbook.pdf", tags: ["bacb", "ethics", "handbook", "certification"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-non-billable-and-points-system-policy", title: "RBT Non Billable and Points System Policy", type: "Policy", category: "nonbillable-points", storagePath: "RBT Non-Billable and Points System Policy.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-nonbillable-points-system-policy", title: "RBT NonBillable_Points System Policy", type: "Policy", category: "nonbillable-points", storagePath: "RBT NonBillable_Points System Policy.pdf", tags: ["non-billable", "points", "retention"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-orientation-handout", title: "RBT Orientation Handout", type: "Policy", category: "blossom-policies", storagePath: "RBT Orientation Handout.pdf", tags: ["policy", "admin"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-pdu-requirements", title: "RBT PDU Requirements", type: "PDF", category: "certification", storagePath: "RBT PDU Requirements.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-rbt-study-resources", title: "RBT Study Resources", type: "PDF", category: "certification", storagePath: "RBT Study Resources.pdf", tags: ["bacb", "certification", "competency"], moduleIds: [], seeded: true },
  { id: "rbt-scheduling-changes-email-policy", title: "Scheduling Changes Email Policy", type: "Policy", category: "blossom-policies", storagePath: "Scheduling Changes Email Policy.pdf", tags: ["policy", "admin"], moduleIds: [], seeded: true },
  { id: "rbt-some-current-dimensions-of-applied-behavior-analysis", title: "SOME CURRENT DIMENSIONS OF APPLIED BEHAVIOR ANALYSIS", type: "Research Article", category: "research", storagePath: "SOME CURRENT DIMENSIONS OF APPLIED BEHAVIOR ANALYSIS.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-the-integrity-of-independent-variables-in-behavior-analysis", title: "THE INTEGRITY OF INDEPENDENT VARIABLES IN BEHAVIOR ANALYSIS", type: "Research Article", category: "research", storagePath: "THE INTEGRITY OF INDEPENDENT VARIABLES IN BEHAVIOR ANALYSIS.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-the-registered-behavior-technician-credential-a-response-to-", title: "The Registered Behavior Technician Credential A Response to Lea", type: "Research Article", category: "research", storagePath: "The Registered Behavior Technician Credential- A Response to Lea.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-toward-trauma-informed-applications-of-behavior-analysis", title: "Toward trauma informed applications of behavior analysis", type: "Research Article", category: "research", storagePath: "Toward trauma-informed applications of behavior analysis.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-us-employment-demand-for-behavior-analysts", title: "US Employment Demand for Behavior Analysts", type: "Research Article", category: "research", storagePath: "US Employment Demand for Behavior Analysts.pdf", tags: ["research", "peer-reviewed"], moduleIds: [], seeded: true },
  { id: "rbt-what-is-assent-in-aba", title: "What is Assent in ABA", type: "How-To", category: "clinical-skills", storagePath: "What is Assent in ABA.pdf", tags: ["clinical-skills", "field"], moduleIds: [], seeded: true },
];

export function iconForType(type: RBTResourceType): string {
  switch (type) {
    case "YouTube Video":
    case "Internal Video":
    case "Video":
    case "Meeting Recording": return "video";
    case "SOP":            return "sop";
    case "Policy":         return "sop";
    case "How-To":         return "sop";
    case "Checklist":      return "checklist";
    case "Template":       return "template";
    case "Worksheet":      return "template";
    case "Quiz":           return "quiz";
    case "Mock Form":      return "form";
    case "Trainer Note":   return "note";
    case "PDF":            return "sop";
    case "Research Article": return "sop";
    case "Signoff":        return "checklist";
    case "Handoff Reference": return "sop";
    case "Training Resource": return "sop";
    case "Needs Review":   return "note";
    default: return "sop";
  }
}

// ---------- Signed-URL resolver ----------

/** Resolve an openable URL for a resource. Handles storage-bucket files via
 *  signed URLs and passes through http/internal urls unchanged. */
export async function getRBTResourceOpenUrl(r: RBTResource): Promise<string | null> {
  if (r.url && /^(https?:|\/)/i.test(r.url)) return r.url;
  if (!r.storagePath) return null;
  const bucket = r.bucket ?? RBT_RESOURCES_BUCKET;
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(r.storagePath, 60 * 10);
    if (error || !data) return null;
    return data.signedUrl;
  } catch { return null; }
}

// ---------- Supabase-backed store ----------

const CACHE_KEY = "blossom.rbt.resources.cache.v3";

type StoreState = { resources: RBTResource[]; hiddenSeedIds: string[]; hydrated: boolean };

function readCache(): StoreState {
  if (typeof window === "undefined") return { resources: STARTER_RBT_RESOURCES, hiddenSeedIds: [], hydrated: false };
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return { resources: STARTER_RBT_RESOURCES, hiddenSeedIds: [], hydrated: false };
    const parsed = JSON.parse(raw) as { resources: RBTResource[]; hiddenSeedIds: string[] };
    return { resources: parsed.resources ?? STARTER_RBT_RESOURCES, hiddenSeedIds: parsed.hiddenSeedIds ?? [], hydrated: false };
  } catch {
    return { resources: STARTER_RBT_RESOURCES, hiddenSeedIds: [], hydrated: false };
  }
}

let state: StoreState = readCache();
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function setState(next: Partial<StoreState>) {
  state = { ...state, ...next };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ resources: state.resources, hiddenSeedIds: state.hiddenSeedIds }),
      );
    } catch { /* quota */ }
  }
  emit();
}

function rowToResource(row: Record<string, unknown>): RBTResource {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    type: (row.type as RBTResourceType) ?? "SOP",
    url: (row.url as string | null) ?? undefined,
    storagePath: (row.storage_path as string | null) ?? undefined,
    bucket: (row.bucket as string | null) ?? undefined,
    description: (row.description as string | null) ?? undefined,
    body: (row.body as string | null) ?? undefined,
    moduleIds: (row.module_ids as string[] | null) ?? [],
    minutes: (row.minutes as number | null) ?? undefined,
    category: (row.category as RBTResourceCategoryId | null) ?? undefined,
    tags: (row.tags as string[] | null) ?? undefined,
    required: Boolean(row.required),
    tracks: ((row.tracks as string[] | null) ?? undefined) as RBTPathId[] | undefined,
    seeded: Boolean(row.seeded),
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

function resourceToRow(r: RBTResource, extras: { is_hidden?: boolean; created_by?: string | null } = {}) {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    url: r.url ?? null,
    description: r.description ?? null,
    body: r.body ?? null,
    module_ids: r.moduleIds ?? [],
    minutes: r.minutes ?? null,
    category: r.category ?? null,
    tags: r.tags ?? [],
    required: r.required ?? false,
    tracks: (r.tracks ?? []) as string[],
    seeded: r.seeded ?? false,
    is_hidden: extras.is_hidden ?? false,
    created_by: extras.created_by ?? null,
  };
}

let hydrationPromise: Promise<void> | null = null;

async function currentUserId(): Promise<string | null> {
  try { const { data } = await supabase.auth.getUser(); return data.user?.id ?? null; }
  catch { return null; }
}

// Legacy seeder retained for backwards compatibility. The starter catalog is
// now merged into the store on every hydrate, so this is a no-op unless a
// caller explicitly wants to bulk-write the seed set into Supabase.
async function seedStarterIfEmpty() {
  try {
    const { count, error } = await supabase
      .from("rbt_resources")
      .select("id", { count: "exact", head: true });
    if (error || (count ?? 0) > 0) return;
    const uid = await currentUserId();
    const rows = STARTER_RBT_RESOURCES.map((r) =>
      resourceToRow({ ...r, seeded: true }, { is_hidden: false, created_by: uid }),
    );
    await supabase.from("rbt_resources").upsert(rows, { onConflict: "id" });
  } catch { /* ignore — cache renders starter */ }
}
void seedStarterIfEmpty;

async function refreshFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("rbt_resources")
      .select("*")
      .order("category", { ascending: true })
      .order("title", { ascending: true });
    if (error || !data) return;
    const rows = data as unknown as Array<Record<string, unknown>>;
    const visible = rows.filter((r) => !r.is_hidden).map(rowToResource);
    const hidden = rows.filter((r) => Boolean(r.is_hidden)).map((r) => String(r.id));
    // Merge starter (as source of truth for seeded ids) with any Supabase overrides/custom rows.
    const bySeed = new Map(STARTER_RBT_RESOURCES.map((r) => [r.id, r]));
    for (const v of visible) bySeed.set(v.id, v);
    for (const h of hidden) bySeed.delete(h);
    setState({ resources: Array.from(bySeed.values()), hiddenSeedIds: hidden, hydrated: true });
  } catch { /* keep starter cache */ }
}

export async function hydrateRBTResourcesFromSupabase(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try { await refreshFromSupabase(); } catch { /* offline */ }
  })();
  return hydrationPromise;
}

function getSnapshot(): RBTResource[] { return state.resources; }
function getHiddenSnapshot(): string[] { return state.hiddenSeedIds; }

export function useRBTResources(): RBTResource[] {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => STARTER_RBT_RESOURCES);
  useEffect(() => { void hydrateRBTResourcesFromSupabase(); }, []);
  return value;
}

export function useHiddenSeedIds(): string[] {
  const value = useSyncExternalStore(subscribe, getHiddenSnapshot, () => []);
  useEffect(() => { void hydrateRBTResourcesFromSupabase(); }, []);
  return value;
}

export function getSeededResourceById(id: string): RBTResource | undefined {
  return STARTER_RBT_RESOURCES.find((r) => r.id === id);
}

export function getResourcesForModule(all: RBTResource[], moduleId: string): RBTResource[] {
  return all.filter((r) => r.moduleIds.includes(moduleId));
}

// ---------- Admin mutations (Supabase-backed) ----------

function nextId() {
  return `rsrc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function addResource(input: Omit<RBTResource, "id" | "seeded" | "updatedAt">): Promise<RBTResource> {
  const uid = await currentUserId();
  const resource: RBTResource = {
    ...input,
    id: nextId(),
    seeded: false,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("rbt_resources")
    .insert(resourceToRow(resource, { is_hidden: false, created_by: uid }));
  if (error) throw error;
  await refreshFromSupabase();
  return resource;
}

export async function updateResource(id: string, patch: Partial<RBTResource>): Promise<void> {
  const patchRow: Partial<{
    title: string; type: string; url: string | null; description: string | null;
    body: string | null; module_ids: string[]; minutes: number | null;
    category: string | null; tags: string[]; required: boolean; tracks: string[];
  }> = {};
  if (patch.title !== undefined) patchRow.title = patch.title;
  if (patch.type !== undefined) patchRow.type = patch.type;
  if (patch.url !== undefined) patchRow.url = patch.url ?? null;
  if (patch.description !== undefined) patchRow.description = patch.description ?? null;
  if (patch.body !== undefined) patchRow.body = patch.body ?? null;
  if (patch.moduleIds !== undefined) patchRow.module_ids = patch.moduleIds;
  if (patch.minutes !== undefined) patchRow.minutes = patch.minutes ?? null;
  if (patch.category !== undefined) patchRow.category = patch.category ?? null;
  if (patch.tags !== undefined) patchRow.tags = patch.tags ?? [];
  if (patch.required !== undefined) patchRow.required = patch.required;
  if (patch.tracks !== undefined) patchRow.tracks = (patch.tracks ?? []) as string[];
  const { error } = await supabase.from("rbt_resources").update(patchRow as never).eq("id", id);
  if (error) throw error;
  await refreshFromSupabase();
}

export async function removeResource(id: string): Promise<void> {
  const seeded = STARTER_RBT_RESOURCES.find((r) => r.id === id);
  if (seeded) {
    const { error } = await supabase.from("rbt_resources").update({ is_hidden: true }).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("rbt_resources").delete().eq("id", id);
    if (error) throw error;
  }
  await refreshFromSupabase();
}

export async function restoreSeededResource(id: string): Promise<void> {
  const { error } = await supabase.from("rbt_resources").update({ is_hidden: false }).eq("id", id);
  if (error) throw error;
  await refreshFromSupabase();
}
