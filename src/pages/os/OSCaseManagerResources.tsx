import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  PlayCircle, ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
  Users, HeartHandshake, MessageSquare, Share2, ChevronRight,
  BookOpen, Library, Star, Calendar, ExternalLink, UserCheck, PhoneCall, LifeBuoy,
  Building2, CalendarClock,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================================================
// Case Manager Resource Library — Current-State
// Aligned to the "FINAL - Case Manager Resource Library Upload - 2026-07-14".
// Files live in the private `case-manager-resources` storage bucket; open
// actions resolve via signed URLs.
//
// Blossom OS is the training / resource / reporting layer for Case Managers.
// CentralReach remains the clinical EMR and clinical documentation system.
// =============================================================================

const BUCKET = "case-manager-resources";
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
  | "Case Manager Start Here"
  | "Case Manager SOPs"
  | "Training Academy Resources"
  | "Videos and Walkthroughs"
  | "Client Lifecycle and Active Client Management"
  | "Family Communication and Parent Escalations"
  | "Scheduling, Staffing, Coverage, and Cancellations"
  | "Clinical Coordination, Progress Reports, and Documentation"
  | "Reports, Exports, and Examples"
  | "Role Packet and Signoff"
  | "QA, Authorizations, BCBA, and State Ops Handoff References"
  | "Needs Review - Case Manager Adjacent";

type WorkflowKey =
  | "client-lifecycle" | "family-communication" | "parent-escalation"
  | "scheduling-staffing" | "coverage-cancellation" | "progress-report"
  | "clinical-documentation" | "case-review" | "handoff" | "signoff"
  | "services-on-pause" | "discharge";

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
// Resource catalog — 70 uploaded files organized into the 12 required categories.
// storagePath values match objects in the `case-manager-resources` bucket exactly.
// ---------------------------------------------------------------------------

const resources: Resource[] = [
  // ---- 1. Case Manager Start Here ----
  { id: "start-1", title: "Case Manager — Start Here",
    description: "Current-state overview of the Case Manager / Clinical Services Case Manager role at Blossom, what Case Managers own, and where CentralReach continues to hold clinical documentation.",
    category: "Case Manager Start Here", type: "Training Resource", format: "PDF",
    minutes: 5, updated: TODAY, featured: true, owner: "Clinical Leadership",
    tags: ["Case Manager", "Clinical Services", "start-here"] },
  { id: "start-binder", title: "Clinical Services and Case Management Department Binder",
    description: "Department binder covering current Case Management scope, cadence, and cross-department coordination.",
    category: "Case Manager Start Here", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "00 - 13 - Clinical Services and Case Management Department Binde.pdf",
    minutes: 20, updated: TODAY, tags: ["Case Manager", "Clinical Services", "Current Operations"] },
  { id: "start-binder-index", title: "Case Manager Binder Index",
    description: "Index of the current Case Manager binder — quick pointer to sections and referenced SOPs.",
    category: "Case Manager Start Here", type: "Training Resource", format: "PDF",
    storagePath: "20 - Binder Index.pdf",
    minutes: 3, updated: TODAY, tags: ["Case Manager", "Current Operations"] },
  { id: "start-role-deep-dive", title: "Case Manager Role Deep Dive",
    description: "Deep dive on the Case Manager role: what Case Managers own, escalate, and hand off — including boundaries with BCBA, QA, Authorizations, and State Ops.",
    category: "Case Manager Start Here", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "20 - Role Deep Dive.pdf",
    minutes: 15, updated: TODAY, tags: ["Case Manager", "Handoff", "Current Operations"] },
  { id: "start-training-journey", title: "Case Manager Training Journey and 30-60-90",
    description: "Overview of the 4-week Case Manager onboarding journey with 30/60/90 expectations.",
    category: "Case Manager Start Here", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "20 - Training Journey and 30-60-90.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, tags: ["Case Manager", "Onboarding"] },

  // ---- 2. Case Manager SOPs (PDF only) ----
  { id: "sop-01", title: "L1 Clinical Services Case Manager Role SOP",
    description: "L1 SOP defining the Clinical Services Case Manager role, ownership boundaries, and expectations.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L1-Clinical-Services-Case-Manager-Role-SOP.pdf",
    minutes: 8, updated: TODAY, owner: "Clinical Leadership",
    workflows: ["client-lifecycle"], tags: ["Case Manager", "Clinical Services"] },
  { id: "sop-02", title: "L2 BCBA Case Oversight Process SOP",
    description: "Reference SOP for how BCBA case oversight interacts with Case Manager follow-up and family coordination.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-BCBA-Case-Oversight-Process-SOP.pdf",
    minutes: 8, updated: TODAY, workflows: ["case-review", "handoff"], tags: ["BCBA", "Case Review"] },
  { id: "sop-03", title: "L2 Case Management Current Operations",
    description: "Current-state case management operations — how Case Managers manage active caseload activity day-to-day.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Case-Management-Current-Operations.pdf",
    minutes: 8, updated: TODAY, workflows: ["client-lifecycle"], tags: ["Case Manager", "Active Client"] },
  { id: "sop-04", title: "L2 Case Staffing Match Process SOP",
    description: "SOP for coordinating case-to-staff matches with the Staffing team when active client service is affected.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Case-Staffing-Match-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["scheduling-staffing"], tags: ["Staffing", "Scheduling"] },
  { id: "sop-05", title: "L2 Client Lifecycle Current Operations",
    description: "Current-state active client lifecycle from intake handoff to services on pause or discharge.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Client-Lifecycle-Current-Operations.pdf",
    minutes: 8, updated: TODAY, workflows: ["client-lifecycle"], tags: ["Client Lifecycle", "Active Client"] },
  { id: "sop-06", title: "L2 Clinical Documentation Current Operations",
    description: "Reference for clinical documentation expectations — clinical records continue to live in CentralReach.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Clinical-Documentation-Current-Operations.pdf",
    minutes: 7, updated: TODAY, workflows: ["clinical-documentation"], tags: ["Clinical Documentation", "CentralReach"] },
  { id: "sop-07", title: "L2 Clinical Escalation and Case Review Process SOP",
    description: "SOP for clinical escalations and case reviews — Case Managers coordinate; BCBAs and Clinical Leadership own clinical judgement.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Clinical-Escalation-and-Case-Review-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["case-review", "parent-escalation"], tags: ["Parent Escalation", "Case Review"] },
  { id: "sop-08", title: "L2 Discharges Current Operations",
    description: "Current-state discharge process and Case Manager coordination role.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Discharges-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["discharge"], tags: ["Discharge", "Client Lifecycle"] },
  { id: "sop-09", title: "L2 Escalations Current Operations",
    description: "Current-state escalations across parent, BCBA, staffing, and state — who owns what and how Case Managers track follow-up.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Escalations-Current-Operations.pdf",
    minutes: 7, updated: TODAY, workflows: ["parent-escalation", "case-review"], tags: ["Parent Escalation", "Handoff"] },
  { id: "sop-10", title: "L2 Family Clinical Communication Process SOP",
    description: "SOP for family-facing clinical communication supported by Case Managers.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Family-Clinical-Communication-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["family-communication"], tags: ["Family Communication"] },
  { id: "sop-11", title: "L2 Family Contact and Follow-Up Process SOP",
    description: "SOP for family contact cadence, follow-up discipline, and documentation of communication.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Family-Contact-and-Follow-Up-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["family-communication"], tags: ["Family Communication"] },
  { id: "sop-12", title: "L2 Family Scheduling Communication Process SOP",
    description: "SOP for scheduling-facing family communication — coordinating openings, cancellations, and reschedules.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Family-Scheduling-Communication-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["family-communication", "scheduling-staffing"], tags: ["Family Communication", "Scheduling"] },
  { id: "sop-13", title: "L2 Hours Serviced Staffing Review Process SOP",
    description: "SOP for reviewing hours serviced vs authorized and flagging staffing gaps for follow-up.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Hours-Serviced-Staffing-Review-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["scheduling-staffing", "coverage-cancellation"], tags: ["Coverage", "Open Hours"] },
  { id: "sop-14", title: "L2 Interdepartment Communication Current Operations",
    description: "Current-state cross-department communication expectations for Case Managers.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Interdepartment-Communication-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["Handoff"] },
  { id: "sop-15", title: "L2 Open Case Staffing Follow-Up Process SOP",
    description: "SOP for following up on open case staffing needs and escalating when service is affected.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Open-Case-Staffing-Follow-Up-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["scheduling-staffing"], tags: ["Staffing", "Coverage"] },
  { id: "sop-16", title: "L2 Open Hours and Coverage Review Process SOP",
    description: "SOP for reviewing open hours and coverage status across active cases.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Open-Hours-and-Coverage-Review-Process-SOP.pdf",
    minutes: 7, updated: TODAY, workflows: ["coverage-cancellation"], tags: ["Open Hours", "Coverage"] },
  { id: "sop-17", title: "L2 Parent Training Current Operations",
    description: "Reference for parent training — BCBAs own delivery; Case Managers coordinate scheduling and follow-up.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Parent-Training-Current-Operations.pdf",
    minutes: 7, updated: TODAY, workflows: ["family-communication"], tags: ["Parent Training"] },
  { id: "sop-18", title: "L2 Progress Reports Current Operations",
    description: "Current-state progress report cadence and expectations. BCBAs author; Case Managers coordinate awareness and family follow-up.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Progress-Reports-Current-Operations.pdf",
    minutes: 7, updated: TODAY, workflows: ["progress-report"], tags: ["Progress Reports", "BCBA"] },
  { id: "sop-19", title: "L2 RBT Support and Retention Process SOP",
    description: "Reference SOP for RBT support and retention — Case Managers coordinate awareness of RBT stability impacting active clients.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-RBT-Support-and-Retention-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["RBT"] },
  { id: "sop-20", title: "L2 Schedule Change Request Process SOP",
    description: "SOP for handling and coordinating schedule change requests initiated by families or staff.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Schedule-Change-Request-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["scheduling-staffing"], tags: ["Scheduling"] },
  { id: "sop-21", title: "L2 Services on Pause Current Operations",
    description: "Current-state services-on-pause process — documentation, family follow-up, and reactivation.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF", featured: true,
    storagePath: "L2-Services-on-Pause-Current-Operations.pdf",
    minutes: 7, updated: TODAY, workflows: ["services-on-pause"], tags: ["Services on Pause", "Client Lifecycle"] },
  { id: "sop-22", title: "L2 State Escalation Management Process SOP",
    description: "SOP for escalating state-level issues to State Ops when a case or family is affected.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-State-Escalation-Management-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["State Operations", "Parent Escalation"] },
  { id: "sop-23", title: "L2 Denial Review and Escalation Process SOP",
    description: "Reference SOP for reviewing denials and escalating when active client service is impacted.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Denial-Review-and-Escalation-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["Authorizations"] },
  { id: "sop-24", title: "L2 Documentation Missing Item Follow-Up Process SOP",
    description: "SOP for missing documentation follow-up — Case Manager coordinates; clinical owners resolve.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Documentation-Missing-Item-Follow-Up-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff", "clinical-documentation"], tags: ["Clinical Documentation", "QA"] },
  { id: "sop-25", title: "L2 Clinical Report QA Review Process SOP",
    description: "Reference SOP for clinical report QA review — QA owns review; Case Managers stay aware for family communication.",
    category: "Case Manager SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Clinical-Report-QA-Review-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["QA"] },

  // ---- 3. Training Academy Resources ----
  { id: "trn-w1", title: "Week 1 — Role, Systems, and Client Lifecycle",
    description: "Week 1 resource pack: role, current systems (CentralReach/Monday), active client lifecycle, and how Case Managers support families and clinical/state teams.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    minutes: 5, updated: TODAY, journeyWeek: 1, featured: true,
    tags: ["Case Manager", "Onboarding", "Client Lifecycle"] },
  { id: "trn-w2", title: "Week 2 — Communication, Follow-Up, and Coordination",
    description: "Week 2 resource pack: family communication SOPs, parent escalations, scheduling/staffing coordination, coverage review, and cancellation examples.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    minutes: 5, updated: TODAY, journeyWeek: 2,
    tags: ["Family Communication", "Parent Escalation", "Coverage"] },
  { id: "trn-w3", title: "Week 3 — Clinical Coordination and Support",
    description: "Week 3 resource pack: progress reports, clinical documentation reference, parent training, BCBA case oversight, RBT support, services on pause, and discharge.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    minutes: 5, updated: TODAY, journeyWeek: 3,
    tags: ["Progress Reports", "Clinical Documentation", "BCBA"] },
  { id: "trn-w4", title: "Week 4 — Handoffs, Reviews, and Signoff",
    description: "Week 4 resource pack: cross-department handoff references, QA/Auth/State Ops, reports/exports/examples, and the Case Manager onboarding signoff packet.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    minutes: 5, updated: TODAY, journeyWeek: 4,
    tags: ["Handoff", "QA", "Authorizations"] },
  { id: "trn-escalation-structure", title: "Escalation Structure — Academy Guide",
    description: "Academy guide covering the escalation structure Case Managers work within.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "020 - escalation-structure-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 2, workflows: ["parent-escalation"],
    tags: ["Parent Escalation", "Handoff"] },
  { id: "trn-progress-reports", title: "Progress Reports — Academy Guide",
    description: "Academy guide covering progress reports awareness for Case Managers.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "053 - progress-reports-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 3, workflows: ["progress-report"],
    tags: ["Progress Reports"] },
  { id: "trn-client-kpis", title: "Client KPIs — Academy Guide",
    description: "Academy guide covering client KPIs Case Managers watch for active-client health signals.",
    category: "Training Academy Resources", type: "Training Resource", format: "PDF",
    storagePath: "088 - client-kpis-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 1,
    tags: ["Active Client", "Client Lifecycle"] },

  // ---- 4. Videos and Walkthroughs ----
  { id: "vid-cr-contacts", title: "CentralReach — Adding and Managing Client Contacts",
    description: "CentralReach walkthrough for adding and managing client contacts.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video", featured: true,
    storagePath: "CR Adding and Managing Client Contacts.mp4",
    minutes: 8, updated: TODAY, journeyWeek: 1, workflows: ["clinical-documentation"],
    tags: ["CentralReach", "Family Communication"] },
  { id: "vid-cr-permissions", title: "CentralReach — Permissions Groups and Automation Rules",
    description: "CentralReach permissions groups and automation rules that affect the Case Manager workflow.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video",
    storagePath: "CentralReach Permissions Groups and Automation Rules.mp4",
    minutes: 12, updated: TODAY, tags: ["CentralReach"] },
  { id: "vid-monday-clients", title: "Monday Part Two — Clients Board Walkthrough",
    description: "Monday.com walkthrough of the Clients Board used operationally today for active client tracking.",
    category: "Videos and Walkthroughs", type: "Video", format: "Video", featured: true,
    storagePath: "Monday Part Two_ Clients Board.mp4",
    minutes: 15, updated: TODAY, journeyWeek: 1, workflows: ["client-lifecycle"],
    tags: ["Clients Board", "Current Operations"] },

  // ---- 5. Client Lifecycle and Active Client Management ----
  { id: "cl-workflow", title: "Client Workflow — Academy Guide",
    description: "Overview of the current client workflow from active service through pause or discharge.",
    category: "Client Lifecycle and Active Client Management", type: "Training Resource", format: "PDF",
    storagePath: "045 - client-workflow-academy-guide.pdf",
    minutes: 6, updated: TODAY, workflows: ["client-lifecycle"], tags: ["Client Lifecycle", "Active Client"] },
  { id: "cl-active-lifecycle", title: "Active Client Lifecycle — Academy Guide",
    description: "Detailed academy guide on the active client lifecycle and Case Manager coordination points.",
    category: "Client Lifecycle and Active Client Management", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "046 - active-client-lifecycle-academy-guide.pdf",
    minutes: 8, updated: TODAY, workflows: ["client-lifecycle"], tags: ["Active Client", "Client Lifecycle"] },
  { id: "cl-transition", title: "Transition to Client — Current Operations",
    description: "How intake-to-active-client transitions happen today and where the Case Manager picks up ownership.",
    category: "Client Lifecycle and Active Client Management", type: "Current Operations", format: "PDF",
    storagePath: "L2-Transition-to-Client-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["client-lifecycle"], tags: ["Client Lifecycle"] },
  { id: "cl-reassessment", title: "Reassessment — Current Operations",
    description: "Reassessment operations and Case Manager coordination touchpoints.",
    category: "Client Lifecycle and Active Client Management", type: "Current Operations", format: "PDF",
    storagePath: "L2-Reassessment-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Active Client"] },

  // ---- 6. Family Communication and Parent Escalations ----
  { id: "fc-parent-esc", title: "Parent Escalations — Academy Guide",
    description: "Academy guide for handling parent escalations and coordinating owner follow-up.",
    category: "Family Communication and Parent Escalations", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "094 - parent-escalations-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 2, workflows: ["parent-escalation"],
    tags: ["Parent Escalation", "Family Communication"] },
  { id: "fc-bcba-esc", title: "BCBA Escalations — Academy Guide",
    description: "Academy guide for coordinating BCBA-related escalations impacting families and cases.",
    category: "Family Communication and Parent Escalations", type: "Training Resource", format: "PDF",
    storagePath: "095 - bcba-escalations-academy-guide.pdf",
    minutes: 6, updated: TODAY, workflows: ["parent-escalation", "handoff"], tags: ["BCBA", "Parent Escalation"] },
  { id: "fc-esc-tracking", title: "Escalation Tracking — Academy Guide",
    description: "How Case Managers track and follow up on escalations to keep families and owners aligned.",
    category: "Family Communication and Parent Escalations", type: "Training Resource", format: "PDF",
    storagePath: "093 - escalation-tracking-academy-guide.pdf",
    minutes: 6, updated: TODAY, workflows: ["parent-escalation"], tags: ["Parent Escalation", "Case Review"] },

  // ---- 7. Scheduling, Staffing, Coverage, and Cancellations ----
  { id: "sc-family-pref", title: "Blossom Family Staffing Preference SOP",
    description: "Family staffing preference SOP — how to capture and honor preferences while coordinating with Staffing.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "SOP", format: "PDF",
    storagePath: "Blossom ABA Therapy_Family Staffing Preference SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["scheduling-staffing"], tags: ["Staffing", "Family Communication"] },
  { id: "sc-staffing-esc", title: "Staffing Escalations — Academy Guide",
    description: "Academy guide for coordinating and escalating staffing gaps when active client service is affected.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "Training Resource", format: "PDF", featured: true,
    storagePath: "096 - staffing-escalations-academy-guide.pdf",
    minutes: 6, updated: TODAY, journeyWeek: 2, workflows: ["scheduling-staffing", "coverage-cancellation"],
    tags: ["Staffing", "Coverage", "Cancellation"] },
  { id: "sc-coverage", title: "Coverage — Current Operations",
    description: "Current-state coverage operations Case Managers watch across active cases.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "Current Operations", format: "PDF",
    storagePath: "L2-Coverage-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["coverage-cancellation"], tags: ["Coverage", "Open Hours"] },
  { id: "sc-scheduling", title: "Client Scheduling — Current Operations",
    description: "Current-state client scheduling operations and Case Manager touchpoints.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "Current Operations", format: "PDF",
    storagePath: "L2-Client-Scheduling-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["scheduling-staffing"], tags: ["Scheduling"] },
  { id: "sc-conflicts", title: "Schedule Conflicts — Current Operations",
    description: "Current-state process for identifying and coordinating schedule conflicts.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "Current Operations", format: "PDF",
    storagePath: "L2-Schedule-Conflicts-Current-Operations.pdf",
    minutes: 5, updated: TODAY, workflows: ["scheduling-staffing"], tags: ["Scheduling"] },
  { id: "sc-session-exp", title: "Session Expectations — Current Operations",
    description: "Current-state session expectations reference — helps Case Managers frame family/staff conversations.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "Current Operations", format: "PDF",
    storagePath: "L2-Session-Expectations-Current-Operations.pdf",
    minutes: 5, updated: TODAY, tags: ["Coverage"] },
  { id: "sc-cancel-analysis", title: "Cancellation Analysis — 6/15/2026",
    description: "Example cancellation analysis learners can review to understand cadence and patterns. Example, not a live data source.",
    category: "Scheduling, Staffing, Coverage, and Cancellations", type: "Report/Export", format: "PDF",
    storagePath: "Cancellation-Analysis-6-15-2026.pdf",
    minutes: 5, updated: TODAY, exampleOnly: true, workflows: ["coverage-cancellation"],
    tags: ["Cancellation", "Current Operations"] },

  // ---- 8. Clinical Coordination, Progress Reports, and Documentation ----
  { id: "cc-parent-training", title: "Parent Training Reference — 6/15/2026",
    description: "Parent training reference for Case Manager coordination — BCBAs continue to own parent training delivery.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Training Resource", format: "PDF",
    storagePath: "Parent-Training-6-15-2026.pdf",
    minutes: 6, updated: TODAY, tags: ["Parent Training", "BCBA"] },
  { id: "cc-how-we-work", title: "How We Work Together — NC BCBA Team",
    description: "How the NC BCBA team collaborates with Case Managers today — reference for clinical coordination expectations.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Handoff Reference", format: "PDF",
    storagePath: "How We Work Together - NC BCBA Team (1).pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["BCBA", "Handoff", "State Operations"] },
  { id: "cc-doc-standards", title: "Documentation Standards — Current Operations",
    description: "Current-state documentation standards — clinical records live in CentralReach.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Current Operations", format: "PDF",
    storagePath: "L2-Documentation-Standards-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["clinical-documentation"], tags: ["Clinical Documentation", "CentralReach"] },
  { id: "cc-missing-doc", title: "Missing Documentation — Current Operations",
    description: "Current-state process for missing documentation follow-up coordination.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Current Operations", format: "PDF",
    storagePath: "L2-Missing-Documentation-Current-Operations.pdf",
    minutes: 5, updated: TODAY, workflows: ["clinical-documentation"], tags: ["Clinical Documentation"] },
  { id: "cc-treatment-plans", title: "Treatment Plans — Current Operations",
    description: "Reference for treatment plan operations. BCBAs author; Case Managers coordinate awareness and family follow-up.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Current Operations", format: "PDF",
    storagePath: "L2-Treatment-Plans-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["BCBA"] },
  { id: "cc-behavior-plans", title: "Behavior Plans — Current Operations",
    description: "Reference for behavior plan operations. Clinical ownership stays with BCBAs.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Current Operations", format: "PDF",
    storagePath: "L2-Behavior-Plans-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["BCBA"] },
  { id: "cc-qa-review", title: "QA Review — Current Operations",
    description: "Reference for how QA review flows today — Case Managers coordinate around QA outcomes.",
    category: "Clinical Coordination, Progress Reports, and Documentation", type: "Current Operations", format: "PDF",
    storagePath: "L2-QA-Review-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["QA"] },

  // ---- 9. Reports, Exports, and Examples ----
  { id: "rep-cancelled", title: "Canceled Sessions (Example Export)",
    description: "Example export of canceled sessions. Example, not a live data source.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "CSV",
    storagePath: "Canceled Sessions.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, workflows: ["coverage-cancellation"],
    tags: ["Cancellation"] },
  { id: "rep-cancel-nc", title: "Cancellations NC 05-23-2026 to 05-29-2026 (Example)",
    description: "Example cancellations export for a single NC week. Example, not a live data source.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "XLSX",
    storagePath: "Cancellations NC 05-23-2026 to 05-29-2026.xlsx",
    minutes: 3, updated: TODAY, exampleOnly: true, workflows: ["coverage-cancellation"],
    tags: ["Cancellation", "State Operations"] },
  { id: "rep-bcba-starts", title: "BCBA Service Starts (Example Export)",
    description: "Example export of BCBA service starts. Example, not a live data source.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "CSV",
    storagePath: "bcba_service_starts.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["BCBA"] },
  { id: "rep-bcba-unassigned", title: "BCBA Unassigned Audit (Example Export)",
    description: "Example audit export of unassigned BCBA situations Case Managers help track.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "CSV",
    storagePath: "bcba-unassigned-audit-v3-1782182570093.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["BCBA", "Staffing"] },
  { id: "rep-clients-1", title: "Clients Board Export (Example, Set 1)",
    description: "Example Clients board export — helps learners see column structure and cadence.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "XLSX",
    storagePath: "Clients_1781018403.xlsx",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["Clients Board"] },
  { id: "rep-clients-2", title: "Clients Board Export (Example, Set 2)",
    description: "Second example Clients board export.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "XLSX",
    storagePath: "Clients_1781640882.xlsx",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["Clients Board"] },
  { id: "rep-rbt-loss", title: "RBT Loss Risk (Example Export)",
    description: "Example export of RBT loss risk signals used cross-functionally.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "CSV",
    storagePath: "monday_rbt_loss_risk.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["RBT", "Staffing"] },
  { id: "rep-rbt-supply", title: "RBT Supply (Example Export)",
    description: "Example export of RBT supply signals used cross-functionally.",
    category: "Reports, Exports, and Examples", type: "Report/Export", format: "CSV",
    storagePath: "monday_rbt_supply.csv",
    minutes: 3, updated: TODAY, exampleOnly: true, tags: ["RBT", "Staffing"] },

  // ---- 10. Role Packet and Signoff ----
  { id: "pkt-job", title: "Case Manager Job Packet",
    description: "Current Case Manager job packet — role, scope, expectations, and daily rhythm.",
    category: "Role Packet and Signoff", type: "Role Packet", format: "PDF", featured: true,
    storagePath: "20 - Job Packet.pdf",
    minutes: 10, updated: TODAY, workflows: ["signoff"], tags: ["Case Manager", "Onboarding"] },
  { id: "pkt-signoff", title: "Clinical Services Case Manager Signoff",
    description: "Signoff learners complete at the end of the 4-week Case Manager onboarding journey.",
    category: "Role Packet and Signoff", type: "Signoff", format: "PDF", featured: true,
    storagePath: "Clinical Services Case Manager Signoff.pdf",
    minutes: 3, updated: TODAY, journeyWeek: 4, workflows: ["signoff"],
    tags: ["Case Manager", "Onboarding"] },

  // ---- 11. QA, Authorizations, BCBA, and State Ops Handoff References ----
  { id: "hand-auth", title: "Treatment Authorization — Current Operations",
    description: "Handoff reference for treatment authorization — Authorizations owns execution; Case Managers coordinate awareness.",
    category: "QA, Authorizations, BCBA, and State Ops Handoff References", type: "Handoff Reference", format: "PDF",
    storagePath: "L2-Treatment-Authorization-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["Authorizations", "Handoff"] },
  { id: "hand-qa", title: "QA Handoff Reference (see QA Review Current Operations)",
    description: "QA review reference — QA owns review; Case Managers coordinate.",
    category: "QA, Authorizations, BCBA, and State Ops Handoff References", type: "Handoff Reference", format: "PDF",
    storagePath: "L2-QA-Review-Current-Operations.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["QA", "Handoff"] },
  { id: "hand-bcba", title: "BCBA Case Oversight Handoff Reference",
    description: "Handoff reference for how BCBA case oversight interacts with Case Manager coordination.",
    category: "QA, Authorizations, BCBA, and State Ops Handoff References", type: "Handoff Reference", format: "PDF",
    storagePath: "L2-BCBA-Case-Oversight-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["BCBA", "Case Review"] },
  { id: "hand-state", title: "State Escalation Management Handoff Reference",
    description: "Handoff reference for state-level escalations impacting families/cases.",
    category: "QA, Authorizations, BCBA, and State Ops Handoff References", type: "Handoff Reference", format: "PDF",
    storagePath: "L2-State-Escalation-Management-Process-SOP.pdf",
    minutes: 6, updated: TODAY, workflows: ["handoff"], tags: ["State Operations", "Handoff"] },

  // ---- 12. Needs Review — Case Manager Adjacent ----
  { id: "nr-current-packet", title: "Case Manager Current Blossom Packet",
    description: "Adjacent packet flagged for review. Not a current SOP — do not treat as required training.",
    category: "Needs Review - Case Manager Adjacent", type: "Needs Review", format: "PDF",
    storagePath: "Case Manager Current Blossom Packet - Needs Review.pdf",
    minutes: 6, updated: TODAY, needsReview: true, planningOnly: true },
  { id: "nr-future-menu", title: "Case Manager Future Blossom OS Menu Map",
    description: "Future-state Blossom OS menu map. Planning reference — not current operations.",
    category: "Needs Review - Case Manager Adjacent", type: "Needs Review", format: "PDF",
    storagePath: "Case Manager Future Blossom OS Menu Map - Needs Review.pdf",
    minutes: 6, updated: TODAY, needsReview: true, planningOnly: true },
  { id: "nr-current-vs-future", title: "Case Manager Training Current vs Future Addendum",
    description: "Addendum comparing current and future-state training. Planning reference — not required onboarding.",
    category: "Needs Review - Case Manager Adjacent", type: "Needs Review", format: "PDF",
    storagePath: "Case Manager Training Current vs Future Addendum - Needs Review.pdf",
    minutes: 6, updated: TODAY, needsReview: true, planningOnly: true },
];

// ---------------------------------------------------------------------------
// Workflow / category metadata
// ---------------------------------------------------------------------------

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "client-lifecycle",       label: "Client Lifecycle",       icon: Activity },
  { key: "family-communication",   label: "Family Communication",   icon: MessageSquare },
  { key: "parent-escalation",      label: "Parent Escalation",      icon: LifeBuoy },
  { key: "scheduling-staffing",    label: "Scheduling & Staffing",  icon: CalendarClock },
  { key: "coverage-cancellation",  label: "Coverage & Cancellations", icon: AlertTriangle },
  { key: "progress-report",        label: "Progress Reports",       icon: FileText },
  { key: "clinical-documentation", label: "Clinical Documentation", icon: BookOpen },
  { key: "case-review",            label: "Case Review",            icon: ClipboardCheck },
  { key: "services-on-pause",      label: "Services on Pause",      icon: PhoneCall },
  { key: "discharge",              label: "Discharge",              icon: Building2 },
  { key: "handoff",                label: "Handoffs",               icon: Share2 },
  { key: "signoff",                label: "Role Packet & Signoff",  icon: ListChecks },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "Case Manager Start Here":                                            { icon: Star,           blurb: "Orientation, binder, role deep dive, and journey overview." },
  "Case Manager SOPs":                                                  { icon: FileText,       blurb: "Current-state Case Manager SOPs (PDF only)." },
  "Training Academy Resources":                                         { icon: BookOpen,       blurb: "Resource packs and academy guides per journey week." },
  "Videos and Walkthroughs":                                            { icon: PlayCircle,     blurb: "CentralReach and Monday board walkthroughs." },
  "Client Lifecycle and Active Client Management":                      { icon: Activity,       blurb: "Active client lifecycle references." },
  "Family Communication and Parent Escalations":                        { icon: MessageSquare,  blurb: "Family communication and escalation coordination." },
  "Scheduling, Staffing, Coverage, and Cancellations":                  { icon: CalendarClock,  blurb: "Coordination and follow-up on scheduling, staffing, coverage, cancellations." },
  "Clinical Coordination, Progress Reports, and Documentation":        { icon: HeartHandshake, blurb: "Clinical coordination awareness — records live in CentralReach." },
  "Reports, Exports, and Examples":                                     { icon: Activity,       blurb: "Example exports and reports (not live data sources)." },
  "Role Packet and Signoff":                                            { icon: ListChecks,     blurb: "Role packet and onboarding signoff." },
  "QA, Authorizations, BCBA, and State Ops Handoff References":         { icon: Share2,         blurb: "Handoff references to cross-functional teams." },
  "Needs Review - Case Manager Adjacent":                               { icon: AlertTriangle,  blurb: "Planning references. Not current SOPs." },
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

export default function OSCaseManagerResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["sop-01", "sop-09", "sop-18"]));

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
              Resource Library · Clinical Services · Case Manager · Current-State
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Case Manager Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Current-state resources for the Clinical Services Case Manager role — active client lifecycle, family communication and escalations, scheduling / staffing / coverage coordination, clinical coordination awareness, cross-department handoffs, and onboarding signoff. Blossom OS is the training and resource layer. CentralReach remains the clinical EMR — treatment plans, session notes, and clinical records continue to live there.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved ({saved.size})
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/academy"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> Case Manager Training Academy</Link>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parent escalation, client lifecycle, progress report, CentralReach, cancellation..."
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
            <Section title="Featured Case Manager resources" subtitle="Highest-priority references for daily Case Manager work.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Organized to mirror the current Case Manager operating model.">
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

            <Section title="Find by workflow" subtitle="Resources grouped by the Case Manager operational moment they support.">
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
    { n: 1, title: "Role, Systems, and Client Lifecycle", blurb: "Case Manager role, CentralReach + Monday systems, and active client lifecycle." },
    { n: 2, title: "Communication, Follow-Up, and Coordination", blurb: "Family communication, parent escalations, scheduling / staffing coordination, coverage." },
    { n: 3, title: "Clinical Coordination and Support", blurb: "Progress reports, clinical documentation reference, parent training, BCBA/RBT support, pause + discharge." },
    { n: 4, title: "Handoffs, Reviews, and Signoff", blurb: "Cross-department handoffs (QA / Auth / State Ops), examples, and Case Manager onboarding signoff." },
  ];
  return (
    <Section title="Case Manager 4-Week Journey — Attached Resources" subtitle="Journey attachments the Training Academy pulls when Case Manager onboarding is assigned.">
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
                  <p className="text-[11px] text-muted-foreground">No dedicated attachments — see week resource pack in the Training Academy Resources category.</p>
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
          <RailStat icon={FileText} label="SOP PDFs" value={resources.filter((r) => r.category === "Case Manager SOPs").length} />
        </div>
        <button onClick={onClearFilters} className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted">
          Reset filters
        </button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reminder</p>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          Clinical records, treatment plans, session notes, and progress reports continue to live in CentralReach. Blossom OS provides Case Managers with training, references, reporting visibility, and role guidance around that clinical system of record.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/case-manager" label="Case Manager Home" icon={UserCheck} />
          <RailLink to="/case-manager/assigned-families" label="Assigned Families" icon={Users} />
          <RailLink to="/case-manager/scheduling-coordination" label="Scheduling Coordination" icon={CalendarClock} />
          <RailLink to="/case-manager/escalations" label="Escalations" icon={LifeBuoy} />
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