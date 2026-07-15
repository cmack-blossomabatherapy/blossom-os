import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  PlayCircle, ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
  Users, HeartHandshake, MessageSquare, Share2, ChevronRight,
  BookOpen, Library, Star, Calendar, ExternalLink, UserCheck, LifeBuoy,
  CalendarClock, Brain,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================================================
// Behavioral Support Resource Library — Current-State
// Aligned to "FINAL - Behavioral Support Resource Library Upload - 2026-07-14".
// Files live in the private `behavioral-support-resources` storage bucket; open
// actions resolve via signed URLs.
//
// Blossom OS is the training / resource / reporting layer for Behavioral Support.
// CentralReach remains the clinical EMR and clinical documentation system.
// Behavior plans and treatment plans remain BCBA-owned.
// =============================================================================

const BUCKET = "behavioral-support-resources";
const TODAY = "2026-07-14";

type ResourceType =
  | "SOP"
  | "Training Resource"
  | "Video"
  | "Report/Export"
  | "Role Packet"
  | "Signoff"
  | "Handoff Reference"
  | "Current Operations"
  | "Needs Review";

type ResourceFormat = "PDF" | "CSV" | "XLSX" | "DOCX" | "Video" | "Link";

type Category =
  | "Behavioral Support Start Here"
  | "Behavioral Support SOPs"
  | "Training Academy Resources"
  | "Videos and Walkthroughs"
  | "Behavior Plans, Treatment Plans, and Clinical Support"
  | "RBT Support, Session Expectations, and Field Guidance"
  | "Family, Parent Training, and Escalations"
  | "BCBA Clinical Leadership and Handoff References"
  | "Client Lifecycle, Case Review, and Documentation"
  | "Reports, Exports, and Examples"
  | "Role Packet and Signoff"
  | "Needs Review - Behavioral Support Adjacent";

type WorkflowKey =
  | "behavior-plan" | "treatment-plan" | "rbt-support" | "session-expectations"
  | "parent-training" | "parent-escalation" | "family-communication"
  | "bcba-handoff" | "clinical-escalation" | "case-review"
  | "clinical-documentation" | "progress-report" | "client-lifecycle" | "signoff";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  format?: ResourceFormat;
  storagePath?: string;
  minutes: number;
  updated: string;
  owner?: string;
  featured?: boolean;
  workflows?: WorkflowKey[];
  tags?: string[];
  needsReview?: boolean;
  planningOnly?: boolean;
  journeyWeek?: 1 | 2 | 3 | 4;
  exampleOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Resource catalog — mapped from the behavioral-support-resources bucket.
// storagePath values match objects in the bucket exactly.
// ---------------------------------------------------------------------------

const resources: Resource[] = [
  // ---- 1. Behavioral Support Start Here ----
  { id: "start-readme", title: "Behavioral Support — Role Resource Guide (Read Me)",
    description: "Start here. Overview of the Behavioral Support role, what Blossom OS provides, and where CentralReach continues to hold clinical documentation.",
    category: "Behavioral Support Start Here", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "00 - READ ME - Role Resource Guide.pdf",
    minutes: 8, updated: TODAY, owner: "Clinical Leadership",
    tags: ["Behavioral Support", "Clinical Support", "start-here", "Current Operations"] },
  { id: "start-role-overview", title: "Behavioral Support — Start Here",
    description: "Current-state overview of the Behavioral Support / Clinical Support role: what Behavioral Support owns, escalates, and hands off — including BCBA and QA boundaries.",
    category: "Behavioral Support Start Here", type: "Training Resource", format: "PDF", featured: true,
    minutes: 5, updated: TODAY, journeyWeek: 1,
    tags: ["Behavioral Support", "Clinical Support", "start-here"] },

  // ---- 2. Behavioral Support SOPs (PDF only) ----
  { id: "sop-l1-bcba", title: "L1 BCBA Clinical Supervisor Role SOP",
    description: "Defines the BCBA Clinical Supervisor role. Behavioral Support supports RBTs/families within BCBA-supervised boundaries.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L1-BCBA-Clinical-Supervisor-Role-SOP.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, workflows: ["bcba-handoff"],
    tags: ["BCBA", "Clinical Support", "Current Operations"] },
  { id: "sop-l1-rbt", title: "L1 RBT Field Team Member Role SOP",
    description: "Defines the RBT field team member role. Behavioral Support helps identify and route RBT support needs.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L1-RBT-Field-Team-Member-Role-SOP.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, workflows: ["rbt-support"],
    tags: ["RBT", "RBT Support", "Current Operations"] },
  { id: "sop-bcba-oversight", title: "L2 BCBA Case Oversight",
    description: "Current L2 SOP for BCBA case oversight. Reference for Behavioral Support to understand BCBA ownership.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-BCBA-Case-Oversight-Process-SOP.pdf",
    minutes: 10, updated: TODAY, workflows: ["bcba-handoff", "case-review"],
    tags: ["BCBA Handoff", "Case Review"] },
  { id: "sop-esc-review", title: "L2 Clinical Escalation and Case Review",
    description: "Current SOP for clinical escalation and case review. Behavioral Support tracks and routes; BCBAs own clinical decisions.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Clinical-Escalation-and-Case-Review-Process-SOP.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 3, workflows: ["clinical-escalation", "case-review"],
    tags: ["Clinical Escalation", "Case Review"] },
  { id: "sop-family-comms", title: "L2 Family Clinical Communication",
    description: "Current SOP for family clinical communication. Behavioral Support supports family concerns within clinical boundaries.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Family-Clinical-Communication-Process-SOP.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["family-communication"],
    tags: ["Family Communication", "Parent Escalation"] },
  { id: "sop-rbt-support", title: "L2 RBT Support and Retention",
    description: "Current SOP for RBT support and retention. Behavioral Support helps identify RBT support needs and route them correctly.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-RBT-Support-and-Retention-Process-SOP.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["rbt-support"],
    tags: ["RBT Support", "RBT"] },
  { id: "sop-assessment", title: "L2 Assessment",
    description: "Current-state assessment operating notes. Assessment ownership sits with BCBAs.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Assessment-Current-Operations.pdf",
    minutes: 8, updated: TODAY, tags: ["Assessment", "BCBA Handoff"] },
  { id: "sop-behavior-plans", title: "L2 Behavior Plans",
    description: "Current-state operating notes for behavior plans. BCBAs own behavior plan authorship — Behavioral Support builds awareness only.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Behavior-Plans-Current-Operations.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, workflows: ["behavior-plan"],
    tags: ["Behavior Plan", "BCBA Handoff"] },
  { id: "sop-treatment-plans", title: "L2 Treatment Plans",
    description: "Current-state operating notes for treatment plans. BCBA-owned; Behavioral Support builds awareness only.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Treatment-Plans-Current-Operations.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, workflows: ["treatment-plan"],
    tags: ["Treatment Plan", "BCBA Handoff"] },
  { id: "sop-case-mgmt", title: "L2 Case Management",
    description: "Current L2 operating notes for case management. Reference for Behavioral Support coordination.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Case-Management-Current-Operations.pdf",
    minutes: 8, updated: TODAY, workflows: ["case-review"],
    tags: ["Case Review", "Client Lifecycle"] },
  { id: "sop-lifecycle", title: "L2 Client Lifecycle",
    description: "Current L2 operating notes for client lifecycle. Reference for Behavioral Support during case review.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Client-Lifecycle-Current-Operations.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 3, workflows: ["client-lifecycle"],
    tags: ["Client Lifecycle"] },
  { id: "sop-doc", title: "L2 Clinical Documentation",
    description: "Current L2 operating notes for clinical documentation awareness. Records live in CentralReach.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Clinical-Documentation-Current-Operations.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 3, workflows: ["clinical-documentation"],
    tags: ["Clinical Documentation", "CentralReach"] },
  { id: "sop-discharge", title: "L2 Discharges",
    description: "Current L2 operating notes for discharges.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Discharges-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Client Lifecycle"] },
  { id: "sop-parent-training", title: "L2 Parent Training",
    description: "Current L2 operating notes for parent training. Behavioral Support supports parent training visibility.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Parent-Training-Current-Operations.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["parent-training"],
    tags: ["Parent Training"] },
  { id: "sop-progress", title: "L2 Progress Reports",
    description: "Current L2 operating notes for progress reports. BCBA-owned; Behavioral Support builds visibility.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Progress-Reports-Current-Operations.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 3, workflows: ["progress-report"],
    tags: ["Progress Reports"] },
  { id: "sop-pause", title: "L2 Services on Pause",
    description: "Current L2 operating notes for services on pause.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Services-on-Pause-Current-Operations.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 3, tags: ["Services on Pause"] },
  { id: "sop-session-exp", title: "L2 Session Expectations",
    description: "Current L2 operating notes for session expectations. Behavioral Support surfaces session expectation issues to the BCBA.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Session-Expectations-Current-Operations.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["session-expectations"],
    tags: ["Session Expectations", "RBT"] },
  { id: "sop-quality", title: "L2 Clinical Quality Metrics",
    description: "Current L2 operating notes on clinical quality metrics. Reference for Behavioral Support quality visibility.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Clinical-Quality-Metrics-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Case Review"] },
  { id: "sop-escalations", title: "L2 Escalations",
    description: "Current L2 operating notes on cross-department escalations.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Escalations-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["clinical-escalation"],
    tags: ["Clinical Escalation"] },
  { id: "sop-incident", title: "L2 Incident Management",
    description: "Current L2 operating notes for incident management.",
    category: "Behavioral Support SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Incident-Management-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["clinical-escalation"],
    tags: ["Clinical Escalation"] },

  // ---- 3. Training Academy Resources (academy guides) ----
  { id: "ac-esc-structure", title: "Escalation Structure — Academy Guide",
    description: "Academy guide covering the escalation structure Behavioral Support routes through.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "020 - escalation-structure-academy-guide.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["clinical-escalation"],
    tags: ["Clinical Escalation"] },
  { id: "ac-bcba-oversight", title: "BCBA Oversight — Academy Guide",
    description: "Academy guide for BCBA oversight and how Behavioral Support supports without overriding.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "067 - bcba-oversight-academy-guide.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 1, workflows: ["bcba-handoff"],
    tags: ["BCBA Handoff"] },
  { id: "ac-rbt-oversight", title: "RBT Oversight — Academy Guide",
    description: "Academy guide for RBT oversight and Behavioral Support's supporting role.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "068 - rbt-oversight-academy-guide.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["rbt-support"],
    tags: ["RBT Support", "RBT"] },
  { id: "ac-esc-tracking", title: "Escalation Tracking — Academy Guide",
    description: "Academy guide covering escalation tracking cadence Behavioral Support participates in.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "093 - escalation-tracking-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 2, workflows: ["clinical-escalation"],
    tags: ["Clinical Escalation"] },
  { id: "ac-parent-esc", title: "Parent Escalations — Academy Guide",
    description: "Academy guide for parent escalations Behavioral Support helps track and route.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "094 - parent-escalations-academy-guide.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["parent-escalation", "family-communication"],
    tags: ["Parent Escalation", "Family Communication"] },
  { id: "ac-bcba-esc", title: "BCBA Escalations — Academy Guide",
    description: "Academy guide for BCBA escalations.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "095 - bcba-escalations-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 2, workflows: ["bcba-handoff", "clinical-escalation"],
    tags: ["BCBA Handoff", "Clinical Escalation"] },
  { id: "ac-staff-esc", title: "Staffing Escalations — Academy Guide",
    description: "Academy guide for staffing escalations Behavioral Support may route.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "096 - staffing-escalations-academy-guide.pdf",
    minutes: 6, updated: TODAY, workflows: ["clinical-escalation"], tags: ["Clinical Escalation"] },
  { id: "ac-bcba-shadow", title: "BCBA Shadow Guide",
    description: "BCBA shadow guide — reference for how Behavioral Support learners shadow BCBAs.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "112 - bcba-shadow-guide.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, workflows: ["bcba-handoff"],
    tags: ["BCBA", "BCBA Handoff"] },
  { id: "ac-bcba-account", title: "BCBA Accountability Guide",
    description: "BCBA accountability guide referenced by Behavioral Support for case review discipline.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "120 - bcba-accountability-guide.pdf",
    minutes: 8, updated: TODAY, workflows: ["case-review"], tags: ["BCBA", "Case Review"] },
  { id: "ac-parent-esc-guide", title: "Parent Escalation Guide",
    description: "Parent escalation guide referenced during Behavioral Support parent communication.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "121 - parent-escalation-guide.pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["parent-escalation"],
    tags: ["Parent Escalation", "Family Communication"] },

  // ---- 4. Videos and Walkthroughs ----
  { id: "vid-cr-perms", title: "CentralReach Permissions Groups and Automation Rules",
    description: "CentralReach walkthrough on permissions groups and automation rules. Reference for Behavioral Support visibility scope.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video", featured: true,
    storagePath: "CentralReach Permissions Groups and Automation Rules.mp4",
    minutes: 15, updated: TODAY, journeyWeek: 1, tags: ["CentralReach"] },
  { id: "vid-cr-contacts", title: "CentralReach — Adding and Managing Client Contacts",
    description: "CentralReach walkthrough on client contacts. Reference for family communication awareness.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video",
    storagePath: "CR Adding and Managing Client Contacts.mp4",
    minutes: 12, updated: TODAY, journeyWeek: 1, tags: ["CentralReach", "Family Communication"] },
  { id: "vid-monday-clients", title: "Monday Part Two — Clients Board",
    description: "Walkthrough of the current Monday Clients Board used across clinical teams.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video",
    storagePath: "Monday Part Two_ Clients Board.mp4",
    minutes: 15, updated: TODAY, journeyWeek: 1, tags: ["Client Lifecycle"] },
  { id: "vid-rbt-board", title: "RBT Board Workflow and Automations Overview",
    description: "Walkthrough of the RBT board workflow. Reference for RBT support visibility.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video",
    storagePath: "RBT Board Workflow and Automations Overview.mp4",
    minutes: 15, updated: TODAY, workflows: ["rbt-support"], tags: ["RBT", "RBT Support"] },
  { id: "vid-bcba-final", title: "BCBA Final Guide (RFO-00634)",
    description: "BCBA final guide walkthrough — reference for Behavioral Support understanding of BCBA ownership.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video",
    storagePath: "RFO-00634 - BCBA_Final_Guide.mp4",
    minutes: 20, updated: TODAY, journeyWeek: 1, workflows: ["bcba-handoff"],
    tags: ["BCBA", "BCBA Handoff"] },

  // ---- 5. Behavior Plans, Treatment Plans, and Clinical Support ----
  { id: "clin-rbt-competency", title: "2026 RBT Initial Competency Assessment",
    description: "Current RBT initial competency assessment referenced by Behavioral Support when supporting RBTs.",
    category: "Behavior Plans, Treatment Plans, and Clinical Support", type: "Current Operations", format: "PDF",
    storagePath: "2026-RBT_Initial_Competency_Assessment-251106-a.pdf",
    minutes: 8, updated: TODAY, workflows: ["rbt-support"],
    tags: ["RBT Support", "Assessment"] },
  { id: "clin-eval-leadership", title: "Blossom Evaluation Leadership Training SOP",
    description: "Current-state SOP for evaluation leadership training used by clinical leadership.",
    category: "Behavior Plans, Treatment Plans, and Clinical Support", type: "Current Operations", format: "PDF",
    storagePath: "Blossom_Evaluation_Leadership_Training_SOP.pdf",
    minutes: 10, updated: TODAY, tags: ["Assessment", "Case Review"] },
  { id: "clin-family-staffing", title: "Blossom Family Staffing Preference SOP",
    description: "Current SOP for family staffing preferences. Reference for family/BCBA coordination.",
    category: "Behavior Plans, Treatment Plans, and Clinical Support", type: "Current Operations", format: "PDF",
    storagePath: "Blossom ABA Therapy_Family Staffing Preference SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["Family Communication"] },

  // ---- 6. RBT Support, Session Expectations, and Field Guidance ----
  { id: "field-nc-work", title: "How We Work Together — NC BCBA Team",
    description: "Current NC BCBA team norms document referenced by Behavioral Support for field coordination.",
    category: "RBT Support, Session Expectations, and Field Guidance", type: "Current Operations", format: "PDF",
    storagePath: "How We Work Together - NC BCBA Team (1).pdf",
    minutes: 8, updated: TODAY, journeyWeek: 2, workflows: ["session-expectations", "bcba-handoff"],
    tags: ["BCBA", "Session Expectations"] },
  { id: "field-nc-work-2", title: "How We Work Together — NC BCBA Team (Update)",
    description: "Updated NC BCBA team norms document.",
    category: "RBT Support, Session Expectations, and Field Guidance", type: "Current Operations", format: "PDF",
    storagePath: "How We Work Together - NC BCBA Team (1) (2).pdf",
    minutes: 8, updated: TODAY, workflows: ["session-expectations"],
    tags: ["BCBA", "Session Expectations"] },

  // ---- 7. Family, Parent Training, and Escalations ----
  { id: "fam-parent-training-rpt", title: "Parent Training Report — 6/15/2026",
    description: "Current parent training report snapshot. Example of the report Behavioral Support references for parent training visibility.",
    category: "Family, Parent Training, and Escalations", type: "Report/Export", format: "PDF",
    storagePath: "Parent-Training-6-15-2026.pdf",
    minutes: 5, updated: TODAY, exampleOnly: true, workflows: ["parent-training"],
    tags: ["Parent Training"] },

  // ---- 8. BCBA Clinical Leadership and Handoff References ----
  { id: "bcba-productivity", title: "BCBA Productivity Report — 6/3/2026",
    description: "BCBA productivity report example. Handoff reference — BCBA/Clinical Leadership owns action.",
    category: "BCBA Clinical Leadership and Handoff References", type: "Handoff Reference", format: "PDF",
    storagePath: "BCBA-Productivity-Report_2026-06-03.pdf",
    minutes: 5, updated: TODAY, exampleOnly: true, workflows: ["bcba-handoff"],
    tags: ["BCBA Handoff"] },
  { id: "bcba-supervision", title: "BCBA Supervision — 4/6 to 6/15/2026",
    description: "BCBA supervision snapshot. Handoff reference for BCBA/Clinical Leadership visibility.",
    category: "BCBA Clinical Leadership and Handoff References", type: "Handoff Reference", format: "PDF",
    storagePath: "BCBA-Supervision-25-4-6-15-2026 (1).pdf",
    minutes: 5, updated: TODAY, exampleOnly: true, workflows: ["bcba-handoff"],
    tags: ["BCBA Handoff"] },
  { id: "bcba-unassigned", title: "BCBA Unassigned Audit (Example Export)",
    description: "Example export of the BCBA unassigned audit. Handoff reference — not a Behavioral Support-owned action.",
    category: "BCBA Clinical Leadership and Handoff References", type: "Handoff Reference", format: "CSV",
    storagePath: "bcba-unassigned-audit-v3-1782182570093.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, workflows: ["bcba-handoff"],
    tags: ["BCBA Handoff"] },

  // ---- 9. Client Lifecycle, Case Review, and Documentation ----
  { id: "life-clients-export", title: "Clients Board Export (Example)",
    description: "Example export of the Monday Clients Board used for case review visibility.",
    category: "Client Lifecycle, Case Review, and Documentation", type: "Report/Export", format: "XLSX",
    storagePath: "Clients_1781640882.xlsx",
    minutes: 3, updated: TODAY, exampleOnly: true, workflows: ["client-lifecycle", "case-review"],
    tags: ["Client Lifecycle"] },

  // ---- 10. Reports, Exports, and Examples ----
  { id: "rep-canceled", title: "Canceled Sessions (Example Export)",
    description: "Example export of canceled sessions. Reference — Behavioral Support flags patterns for BCBA/scheduling follow-up.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "CSV",
    storagePath: "Canceled Sessions.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["Session Expectations", "RBT"] },
  { id: "rep-cancel-analysis", title: "Cancellation Analysis — 6/15/2026",
    description: "Cancellation analysis snapshot. Example — Behavioral Support surfaces recurring cancellation risk.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "PDF",
    storagePath: "Cancellation-Analysis-6-15-2026.pdf",
    minutes: 5, updated: TODAY, exampleOnly: true, tags: ["Session Expectations"] },
  { id: "rep-cancel-nc", title: "Cancellations NC — 05/23 to 05/29/2026",
    description: "State-level cancellation snapshot example.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "XLSX",
    storagePath: "Cancellations NC 05-23-2026 to 05-29-2026.xlsx",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["Session Expectations"] },

  // ---- 11. Role Packet and Signoff ----
  { id: "pkt-role-notes", title: "Behavioral Support Role Resource Notes and Signoff",
    description: "Role resource notes and signoff for Behavioral Support onboarding. Completed at end of 4-week journey.",
    category: "Role Packet and Signoff", type: "Signoff", format: "PDF", featured: true,
    minutes: 6, updated: TODAY, journeyWeek: 4, workflows: ["signoff"],
    tags: ["Behavioral Support", "Onboarding"] },

  // ---- 12. Needs Review — Behavioral Support Adjacent ----
  { id: "nr-journey-md", title: "Behavioral Support 4-Week Journey Draft",
    description: "Draft outline of the 4-week Behavioral Support journey. Planning reference — not a current SOP.",
    category: "Needs Review - Behavioral Support Adjacent", type: "Needs Review", format: "DOCX",
    storagePath: "Behavioral Support 4-Week Journey.md",
    minutes: 6, updated: TODAY, needsReview: true, planningOnly: true },
  { id: "nr-upload-prompt", title: "Behavioral Support Resource Upload Prompt",
    description: "Internal upload prompt draft. Planning reference — not a current SOP.",
    category: "Needs Review - Behavioral Support Adjacent", type: "Needs Review", format: "DOCX",
    storagePath: "Behavioral Support Resource Upload Prompt.md",
    minutes: 3, updated: TODAY, needsReview: true, planningOnly: true },
];

// ---------------------------------------------------------------------------
// Workflow / category metadata
// ---------------------------------------------------------------------------

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "behavior-plan",          label: "Behavior Plans",         icon: Brain },
  { key: "treatment-plan",         label: "Treatment Plans",        icon: FileText },
  { key: "rbt-support",            label: "RBT Support",            icon: Users },
  { key: "session-expectations",   label: "Session Expectations",   icon: ShieldCheck },
  { key: "parent-training",        label: "Parent Training",        icon: HeartHandshake },
  { key: "parent-escalation",      label: "Parent Escalation",      icon: LifeBuoy },
  { key: "family-communication",   label: "Family Communication",   icon: MessageSquare },
  { key: "bcba-handoff",           label: "BCBA Handoff",           icon: Share2 },
  { key: "clinical-escalation",    label: "Clinical Escalation",    icon: AlertTriangle },
  { key: "case-review",            label: "Case Review",            icon: ClipboardCheck },
  { key: "clinical-documentation", label: "Clinical Documentation", icon: BookOpen },
  { key: "progress-report",        label: "Progress Reports",       icon: FileText },
  { key: "client-lifecycle",       label: "Client Lifecycle",       icon: Activity },
  { key: "signoff",                label: "Role Packet & Signoff",  icon: ListChecks },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "Behavioral Support Start Here":                                    { icon: Star,           blurb: "Orientation and role deep dive." },
  "Behavioral Support SOPs":                                          { icon: FileText,       blurb: "Current-state SOPs (PDF only)." },
  "Training Academy Resources":                                       { icon: BookOpen,       blurb: "Academy guides referenced across the 4-week journey." },
  "Videos and Walkthroughs":                                          { icon: PlayCircle,     blurb: "CentralReach and current-system walkthroughs." },
  "Behavior Plans, Treatment Plans, and Clinical Support":            { icon: Brain,          blurb: "Behavior plan / treatment plan awareness — BCBA-owned." },
  "RBT Support, Session Expectations, and Field Guidance":            { icon: Users,          blurb: "RBT support cues, session expectations, and field norms." },
  "Family, Parent Training, and Escalations":                         { icon: HeartHandshake, blurb: "Family communication, parent training, and escalation routing." },
  "BCBA Clinical Leadership and Handoff References":                  { icon: Share2,         blurb: "Handoff references to BCBA and Clinical Leadership." },
  "Client Lifecycle, Case Review, and Documentation":                 { icon: Activity,       blurb: "Client lifecycle and case review references. Records in CentralReach." },
  "Reports, Exports, and Examples":                                   { icon: Activity,       blurb: "Example reports and exports (not live data sources)." },
  "Role Packet and Signoff":                                          { icon: ListChecks,     blurb: "Role packet and onboarding signoff." },
  "Needs Review - Behavioral Support Adjacent":                       { icon: AlertTriangle,  blurb: "Planning references. Not current SOPs." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText,
  "Training Resource": BookOpen,
  "Video": PlayCircle,
  "Report/Export": Activity,
  "Role Packet": ListChecks,
  "Signoff": ListChecks,
  "Handoff Reference": Share2,
  "Current Operations": ShieldCheck,
  "Needs Review": AlertTriangle,
};

// ---------------------------------------------------------------------------
// Signed URL resolver
// ---------------------------------------------------------------------------

async function openResource(r: Resource) {
  if (!r.storagePath) {
    toast.info("Resource pack — see the linked SOPs and academy guides for source PDFs.");
    return;
  }
  try {
    const { data, error } = await supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(r.storagePath, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Unable to open file. Please try again.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  } catch {
    toast.error("Unable to open file. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OSBehavioralSupportResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["sop-behavior-plans", "sop-treatment-plans", "sop-esc-review"]));

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
      const hay = [r.title, r.description, r.category, r.type, r.owner ?? "", ...(r.tags ?? [])]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeCategory, activeWorkflow]);

  const featured = useMemo(() => resources.filter((r) => r.featured), []);
  const isFiltering = query.trim().length > 0 || activeCategory !== null || activeWorkflow !== null;

  return (
    <OSShell rightRail={<ResourceRail saved={saved.size} onClearFilters={() => { setActiveCategory(null); setActiveWorkflow(null); setQuery(""); }} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" />
              Resource Library · Clinical Support · Behavioral Support · Current-State
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Behavioral Support Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Current-state resources for the Behavioral Support / Clinical Support role — behavior plan and treatment plan awareness, RBT support and session expectations, family communication and parent escalations, BCBA handoffs, and clinical documentation awareness. Blossom OS is the training, reference, and reporting layer. CentralReach remains the clinical EMR — behavior plans, treatment plans, session notes, and progress reports continue to live there and remain BCBA-owned.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved ({saved.size})
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/academy"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> Behavioral Support Training Academy</Link>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search behavior plan, RBT support, parent escalation, BCBA handoff, CentralReach, clinical documentation..."
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
            <Section title="Featured Behavioral Support resources" subtitle="Highest-priority references for daily Behavioral Support work.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Organized to mirror the current Behavioral Support operating model.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(Object.keys(categoryMeta) as Category[]).map((c) => {
                  const meta = categoryMeta[c];
                  const all = resources.filter((r) => r.category === c);
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
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Find by workflow" subtitle="Resources grouped by the Behavioral Support operational moment they support.">
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

            <JourneyRoadmap />
          </>
        )}
      </div>
    </OSShell>
  );
}

// ---------- atoms ----------

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
  return (
    <button
      onClick={() => void openResource(r)}
      className="group relative h-full rounded-2xl border border-border/70 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleSave(); } }}
          className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
            saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
          title={saved ? "Saved" : "Save"}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
        {r.format && <Badge variant="outline" className="rounded-full text-[10px]">{r.format}</Badge>}
        {r.needsReview && <Badge className="rounded-full bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 text-[10px]">Needs Review</Badge>}
        {r.planningOnly && <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-700 text-[10px]">Planning · Not Current SOP</Badge>}
        {r.exampleOnly && <Badge variant="outline" className="rounded-full border-sky-500/40 text-sky-700 text-[10px]">Example · Not Live Data</Badge>}
        {r.journeyWeek && <Badge variant="outline" className="rounded-full text-[10px]">Journey · Week {r.journeyWeek}</Badge>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Open</span>
      </div>
    </button>
  );
}

function ResourceRow({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  return (
    <button onClick={() => void openResource(r)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
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
          {r.exampleOnly && <Badge variant="outline" className="rounded-full border-sky-500/40 text-sky-700 text-[10px]">Example</Badge>}
          {r.journeyWeek && <Badge variant="outline" className="rounded-full text-[10px]">Week {r.journeyWeek}</Badge>}
          <span className="text-[11px] text-muted-foreground">{r.category}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.updated)}</span>
          {r.owner && <span>· {r.owner}</span>}
        </div>
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleSave(); } }}
        className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
          saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      </span>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function JourneyRoadmap() {
  const weeks: { n: 1 | 2 | 3 | 4; title: string; blurb: string }[] = [
    { n: 1, title: "Role, Clinical Boundaries, and Systems", blurb: "Blossom orientation, BCBA/RBT SOPs, behavior plan and treatment plan awareness, CentralReach walkthroughs." },
    { n: 2, title: "RBT Support, Sessions, and Escalations", blurb: "RBT support and retention, session expectations, family clinical communication, parent training, parent escalation routing." },
    { n: 3, title: "Case Review and Documentation Awareness", blurb: "Clinical escalation and case review, clinical documentation awareness, progress reports, client lifecycle and services on pause." },
    { n: 4, title: "Handoffs, Reports, and Signoff", blurb: "Reports and exports, BCBA/RBT collaboration, handoff references, and Behavioral Support role signoff." },
  ];
  return (
    <Section title="Behavioral Support 4-Week Journey — Attached Resources" subtitle="Journey attachments the Training Academy pulls when Behavioral Support onboarding is assigned.">
      <div className="grid gap-3 md:grid-cols-2">
        {weeks.map((w) => {
          const attached = resources.filter((r) => r.journeyWeek === w.n);
          return (
            <div key={w.n} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Week {w.n} · {w.title}</p>
                <Badge variant="outline" className="rounded-full text-[10px]">{attached.length} attached</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{w.blurb}</p>
              <div className="mt-3 space-y-1.5">
                {attached.map((r) => (
                  <button key={r.id} onClick={() => void openResource(r)} className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-left text-[12px] text-foreground hover:bg-muted/60">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
                {attached.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">No dedicated attachments — see the week's academy guides in Training Academy Resources.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ResourceRail({ saved, onClearFilters }: { saved: number; onClearFilters: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your library</p>
        <div className="mt-3 space-y-2">
          <RailStat icon={Bookmark} label="Saved resources" value={saved} />
          <RailStat icon={Clock} label="Resources total" value={resources.length} />
          <RailStat icon={FileText} label="SOP PDFs" value={resources.filter((r) => r.category === "Behavioral Support SOPs").length} />
        </div>
        <button onClick={onClearFilters} className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted">
          Reset filters
        </button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reminder</p>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          Behavior plans, treatment plans, session notes, and progress reports remain BCBA-owned and continue to live in CentralReach. Behavioral Support helps identify support needs, route escalations, and support RBTs and families within approved clinical boundaries.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/behavioral-support" label="Behavioral Support Home" icon={UserCheck} />
          <RailLink to="/behavioral-support/support-plans" label="Support Plans Visibility" icon={Brain} />
          <RailLink to="/behavioral-support/escalations" label="Escalations" icon={LifeBuoy} />
          <RailLink to="/behavioral-support/supervision-visibility" label="Supervision Visibility" icon={ShieldCheck } />
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

void TODAY;