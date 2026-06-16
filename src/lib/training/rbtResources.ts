// RBT Training Academy — resources system.
// Starter resources are seeded in code; admin edits are persisted to localStorage,
// so a backend can be added later without changing consumer code.

import { useSyncExternalStore } from "react";
import type { RBTPathId } from "./rbtAcademy";

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
  | "Meeting Recording";

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
];

// ---------- Categories ----------

export type RBTResourceCategoryId =
  | "welcome"
  | "credentialing"
  | "policies"
  | "documentation"
  | "aba_skills"
  | "worksheets"
  | "research"
  | "retention"
  | "admin";

export interface RBTResourceCategory {
  id: RBTResourceCategoryId;
  label: string;
  description: string;
}

export const RBT_RESOURCE_CATEGORIES: RBTResourceCategory[] = [
  { id: "welcome",       label: "Welcome & Blossom Orientation", description: "Day-one orientation, intro videos, the Blossom way." },
  { id: "credentialing", label: "BACB / Credentialing / Ethics", description: "RBT Handbook, requirements, ethics code, competency." },
  { id: "policies",      label: "Blossom Policies & Field Expectations", description: "Official policies, conduct, field standards." },
  { id: "documentation", label: "CentralReach / Documentation / Data", description: "CR how-to, session notes, data collection." },
  { id: "aba_skills",    label: "ABA Skill Practice Guides", description: "Prompting, assent, reinforcement, data — applied." },
  { id: "worksheets",    label: "Worksheets & Practice Activities", description: "Monthly worksheets to deepen field skills." },
  { id: "research",      label: "Research & Clinical Articles", description: "Peer-reviewed and applied research RBTs should read." },
  { id: "retention",     label: "Retention, Engagement & Non-Billable Points", description: "Points system, recognition, non-billable activities." },
  { id: "admin",         label: "Scheduling, Payroll, PTO & Admin Basics", description: "Day-to-day admin: schedule changes, PTO, mileage, payroll." },
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
  /** External link, internal path, or YouTube URL. Optional for trainer notes. */
  url?: string;
  /** Short description shown under the title. */
  description?: string;
  /** Long-form body — used for trainer notes / inline guides. */
  body?: string;
  /** Module ids this resource is attached to. Empty array = academy-wide. */
  moduleIds: string[];
  /** Estimated minutes to consume. */
  minutes?: number;
  /** Library category. Optional for legacy resources. */
  category?: RBTResourceCategoryId;
  /** Free-form tags for search. */
  tags?: string[];
  /** Required vs optional inside its category/track. */
  required?: boolean;
  /** Tracks this resource is visible to. Empty / undefined = all tracks. */
  tracks?: RBTPathId[];
  /** True when seeded in code (cannot be hard-deleted, only hidden/overridden). */
  seeded?: boolean;
  updatedAt?: string;
}

// ---------- Starter resources ----------

// Module attachment groups — keep in one place so we can re-target later without hunting.
const MODS_BACB           = ["nc-c1", "nc-cp1", "nc-cp2", "nc-b1", "ex-r1"];
const MODS_ORIENT_POLICY  = ["welcome-1", "ne-p1", "ne-f1", "ex-s1", "ex-p1", "ex-d1"];
const MODS_CR_HOWTO       = ["nc-c2", "nc-c3", "nc-k1", "nc-k2", "ne-d1", "ne-a1", "u2-c1", "u2-g2", "ex-c1"];
const MODS_PRACTICE       = ["nc-c4", "ne-r1", "u2-g1", "ne-s1", "nc-fs1", "ne-fs1", "u2-e1"];
const MODS_RESEARCH       = ["ex-o1", "ex-o2", "ex-o3", "nc-b1", "ne-p1", "ex-p1"];

export const STARTER_RBT_RESOURCES: RBTResource[] = [
  {
    id: "seed-aba-playlist",
    title: "ABA Explained — video playlist",
    type: "YouTube Video",
    url: "https://www.youtube.com/playlist?list=PLABA_EXPLAINED",
    description: "Plain-language intro to ABA concepts for new RBTs.",
    moduleIds: ["nc-c2", "ne-a1", "u2-g2"],
    minutes: 35,
    seeded: true,
  },
  {
    id: "seed-data-quick-guide",
    title: "Data Collection quick guide",
    type: "Checklist",
    url: "/resources/rbt/data-collection-quick-guide",
    description: "Frequency, duration, ABC, and trial-by-trial — the fast version.",
    moduleIds: ["nc-k1", "ne-d1"],
    minutes: 6,
    seeded: true,
  },
  {
    id: "seed-session-notes-guide",
    title: "Session Notes Documentation guide",
    type: "SOP",
    url: "/resources/rbt/session-notes-guide",
    description: "Writing complete, billable, audit-ready session notes.",
    moduleIds: ["nc-k2", "ne-d1", "ex-d1"],
    minutes: 12,
    seeded: true,
  },
  {
    id: "seed-session-note-form",
    title: "Session note training form",
    type: "Mock Form",
    url: "/resources/rbt/mock-session-note-form",
    description: "Practice form — submit for Documentation Reviewer feedback.",
    moduleIds: ["nc-s2"],
    minutes: 20,
    seeded: true,
  },
  {
    id: "seed-competency-checklist",
    title: "Competency checklist",
    type: "Checklist",
    url: "/resources/rbt/competency-checklist",
    description: "Items the BCBA reviews during the client-based competency.",
    moduleIds: ["nc-cp1", "nc-cp2"],
    minutes: 10,
    seeded: true,
  },
  {
    id: "seed-safety-escalation",
    title: "Safety and escalation flow",
    type: "SOP",
    url: "/resources/rbt/safety-escalation-flow",
    description: "De-escalation, incident reporting, and who to call.",
    moduleIds: ["ex-s1"],
    minutes: 8,
    seeded: true,
  },
  {
    id: "seed-parent-comms",
    title: "Parent communication guide",
    type: "SOP",
    url: "/resources/rbt/parent-communication",
    description: "Tone, what to share, what to escalate.",
    moduleIds: ["ex-p1"],
    minutes: 8,
    seeded: true,
  },
  {
    id: "seed-professionalism",
    title: "Professionalism and field standards checklist",
    type: "Checklist",
    url: "/resources/rbt/professionalism-checklist",
    description: "How Blossom RBTs show up — dress, punctuality, boundaries.",
    moduleIds: ["ne-p1"],
    minutes: 5,
    seeded: true,
  },
  {
    id: "seed-os-quick-tour",
    title: "Blossom OS quick tour for RBTs",
    type: "Internal Video",
    url: "/resources/rbt/os-quick-tour",
    description: "My Day, schedule, messages, and where everything lives.",
    moduleIds: ["welcome-3"],
    minutes: 6,
    seeded: true,
  },
  // ---------- Library: Welcome & Blossom Orientation ----------
  { id: "lib-w-1", title: "Blossom Intro Video", type: "Internal Video", url: "/library/rbt/welcome/blossom-intro.mp4", description: "Welcome from leadership — who Blossom is and what we stand for.", category: "welcome", tags: ["welcome", "video", "leadership"], required: true, minutes: 8, moduleIds: ["welcome-1"], seeded: true },
  { id: "lib-w-2", title: "Orientation Handouts", type: "PDF", url: "/library/rbt/welcome/orientation-handouts.pdf", description: "Day-one orientation packet — printable.", category: "welcome", tags: ["orientation", "handout"], required: true, moduleIds: ["welcome-1", "welcome-2"], seeded: true },
  { id: "lib-w-3", title: "Meet the Team Brochure", type: "PDF", url: "/library/rbt/welcome/meet-the-team.pdf", description: "Org chart, who-does-what, and how to reach people.", category: "welcome", tags: ["org", "people"], moduleIds: ["welcome-2"], seeded: true },
  { id: "lib-w-4", title: "The Blossom Way — Field Standards", type: "Policy", url: "/library/rbt/welcome/blossom-way.pdf", description: "How we show up in homes, clinics, and on the team.", category: "welcome", tags: ["standards", "culture"], required: true, moduleIds: ["welcome-2", "ne-p1"], seeded: true },
  { id: "lib-w-5", title: "Blossom OS Quick Tour", type: "Internal Video", url: "/library/rbt/welcome/os-tour.mp4", description: "Where to find My Day, schedule, messages, and notes.", category: "welcome", tags: ["os", "tour"], minutes: 6, moduleIds: ["welcome-3"], seeded: true },

  // ---------- Library: BACB / Credentialing / Ethics ----------
  { id: "lib-c-1", title: "RBT Handbook (BACB)", type: "PDF", url: "/library/rbt/bacb/rbt-handbook.pdf", description: "Official BACB RBT Handbook — required reading.", category: "credentialing", tags: ["bacb", "handbook"], required: true, tracks: ["not_certified", "certified_no_experience"], moduleIds: ["nc-c1"], seeded: true },
  { id: "lib-c-2", title: "2026 RBT Requirements", type: "Policy", url: "/library/rbt/bacb/2026-requirements.pdf", description: "Updated 2026 RBT certification and renewal requirements.", category: "credentialing", tags: ["bacb", "requirements", "2026"], required: true, seeded: true, moduleIds: [] },
  { id: "lib-c-3", title: "RBT Ethics Code", type: "Policy", url: "/library/rbt/bacb/ethics-code.pdf", description: "BACB RBT Ethics Code — review and acknowledge.", category: "credentialing", tags: ["ethics", "bacb"], required: true, moduleIds: ["nc-c1"], seeded: true },
  { id: "lib-c-4", title: "Initial Competency Assessment", type: "Checklist", url: "/library/rbt/bacb/competency-assessment.pdf", description: "BCBA-led competency assessment — task list overview.", category: "credentialing", tags: ["competency"], tracks: ["not_certified"], moduleIds: ["nc-cp1", "nc-cp2"], seeded: true },
  { id: "lib-c-5", title: "Initial Competency Assessment Packet", type: "PDF", url: "/library/rbt/bacb/competency-packet.pdf", description: "Full packet used during the BACB competency.", category: "credentialing", tags: ["competency", "packet"], tracks: ["not_certified"], moduleIds: ["nc-cp2"], seeded: true },
  { id: "lib-c-6", title: "RBT PDU Requirements", type: "Policy", url: "/library/rbt/bacb/pdu-requirements.pdf", description: "Professional Development Units — what counts, how to track.", category: "credentialing", tags: ["pdu", "renewal"], tracks: ["certified_no_experience", "certified_under_2yrs", "certified_2yrs_plus"], moduleIds: [], seeded: true },
  { id: "lib-c-7", title: "ABA Sub-Specialties Overview", type: "PDF", url: "/library/rbt/bacb/aba-subspecialties.pdf", description: "Sub-specialty areas of ABA — orientation read.", category: "credentialing", tags: ["aba", "subspecialty"], moduleIds: [], seeded: true },
  { id: "lib-c-8", title: "BACB Employment Demand Report", type: "Research Article", url: "/library/rbt/bacb/employment-demand.pdf", description: "BACB demand report — context for your career.", category: "credentialing", tags: ["career", "bacb"], moduleIds: [], seeded: true },

  // ---------- Library: Blossom Policies & Field Expectations ----------
  { id: "lib-p-1", title: "Blossom RBT Policy Manual", type: "Policy", url: "/library/rbt/policies/rbt-policy-manual.pdf", description: "Master policy reference for all Blossom RBTs.", category: "policies", tags: ["policy", "manual"], required: true, moduleIds: ["ne-p1"], seeded: true },
  { id: "lib-p-2", title: "Scheduling Change Policy", type: "Policy", url: "/library/rbt/policies/scheduling-change.pdf", description: "Rules for requesting, swapping, and cancelling sessions.", category: "policies", tags: ["scheduling"], required: true, moduleIds: [], seeded: true },
  { id: "lib-p-3", title: "Professionalism & Field Standards Checklist", type: "Checklist", url: "/library/rbt/policies/field-standards.pdf", description: "Dress, punctuality, boundaries — the field checklist.", category: "policies", tags: ["standards", "checklist"], required: true, moduleIds: ["ne-p1"], seeded: true },
  { id: "lib-p-4", title: "Safety & Escalation Flow", type: "SOP", url: "/library/rbt/policies/safety-escalation.pdf", description: "De-escalation, incident reporting, and who to call.", category: "policies", tags: ["safety", "escalation"], required: true, moduleIds: ["ex-s1"], seeded: true },
  { id: "lib-p-5", title: "Parent Communication & Boundaries", type: "SOP", url: "/library/rbt/policies/parent-comms.pdf", description: "What to share, what to escalate, what not to say.", category: "policies", tags: ["parent", "communication"], required: true, moduleIds: ["ex-p1"], seeded: true },
  { id: "lib-p-6", title: "Non-Billable Activities — In-Home RBTs", type: "PDF", url: "/library/rbt/policies/non-billable-in-home.pdf", description: "Approved non-billable activities for in-home RBTs.", category: "policies", tags: ["non-billable", "in-home"], moduleIds: [], seeded: true },

  // ---------- Library: CentralReach / Documentation / Data ----------
  { id: "lib-d-1", title: "CentralReach for RBTs — How-To", type: "How-To", url: "/library/rbt/cr/cr-how-to.pdf", description: "Logging in, finding your schedule, running a session.", category: "documentation", tags: ["centralreach", "how-to"], required: true, moduleIds: ["welcome-3"], seeded: true },
  { id: "lib-d-2", title: "Session Notes — Documentation Guide", type: "SOP", url: "/library/rbt/cr/session-notes-guide.pdf", description: "Writing complete, billable, audit-ready session notes.", category: "documentation", tags: ["session notes", "documentation"], required: true, moduleIds: ["nc-k2", "ne-d1", "ex-d1"], seeded: true },
  { id: "lib-d-3", title: "Session Note Examples", type: "PDF", url: "/library/rbt/cr/session-note-examples.pdf", description: "Good vs needs-improvement session note examples.", category: "documentation", tags: ["examples", "session notes"], moduleIds: ["nc-k2"], seeded: true },
  { id: "lib-d-4", title: "Data Collection Quick Guide", type: "Checklist", url: "/library/rbt/cr/data-collection-quick-guide.pdf", description: "Frequency, duration, ABC, trial-by-trial — fast version.", category: "documentation", tags: ["data", "checklist"], required: true, moduleIds: ["nc-k1", "ne-d1"], seeded: true },
  { id: "lib-d-5", title: "Mock Session Note Form", type: "Mock Form", url: "/library/rbt/cr/mock-session-note.pdf", description: "Practice form — submit for Documentation Reviewer feedback.", category: "documentation", tags: ["mock", "practice"], moduleIds: ["nc-s2"], seeded: true },
  { id: "lib-d-6", title: "CR Timesheet & Clock-In How-To", type: "How-To", url: "/library/rbt/cr/timesheet-how-to.pdf", description: "Clock in/out, fix missed punches, submit timesheets.", category: "documentation", tags: ["centralreach", "timesheet"], moduleIds: [], seeded: true },

  // ---------- Library: ABA Skill Practice Guides ----------
  { id: "lib-s-1", title: "Prompting Guide", type: "PDF", url: "/library/rbt/skills/prompting-guide.pdf", description: "Prompt hierarchies, fading, and least-to-most.", category: "aba_skills", tags: ["prompting", "skills"], required: true, moduleIds: ["nc-c3", "ne-a1"], seeded: true },
  { id: "lib-s-2", title: "Assent Guide", type: "PDF", url: "/library/rbt/skills/assent-guide.pdf", description: "Recognizing assent and assent withdrawal in session.", category: "aba_skills", tags: ["assent", "ethics"], required: true, moduleIds: [], seeded: true },
  { id: "lib-s-3", title: "Data Guide", type: "PDF", url: "/library/rbt/skills/data-guide.pdf", description: "When to take data, how to record, integrity rules.", category: "aba_skills", tags: ["data"], moduleIds: ["nc-k1"], seeded: true },
  { id: "lib-s-4", title: "ABA Explained — Video Playlist", type: "YouTube Video", url: "https://www.youtube.com/playlist?list=PLABA_EXPLAINED", description: "Plain-language ABA concepts for new RBTs.", category: "aba_skills", tags: ["aba", "video"], required: true, minutes: 35, tracks: ["not_certified", "certified_no_experience", "certified_under_2yrs"], moduleIds: ["nc-c2", "ne-a1", "u2-g2"], seeded: true },
  { id: "lib-s-5", title: "RBT Study Resources", type: "PDF", url: "/library/rbt/skills/study-resources.pdf", description: "Study packet — review for the RBT exam and competency.", category: "aba_skills", tags: ["study", "exam"], tracks: ["not_certified"], moduleIds: [], seeded: true },
  { id: "lib-s-6", title: "Reinforcement — Field Cheat Sheet", type: "PDF", url: "/library/rbt/skills/reinforcement-cheat-sheet.pdf", description: "Reinforcement schedules and pairing — in-session reference.", category: "aba_skills", tags: ["reinforcement"], moduleIds: [], seeded: true },

  // ---------- Library: Worksheets & Practice Activities ----------
  { id: "lib-ws-01", title: "Worksheet: Pairing", type: "Worksheet", url: "/library/rbt/worksheets/pairing.pdf", description: "Monthly worksheet — building rapport with new clients.", category: "worksheets", tags: ["pairing"], moduleIds: [], seeded: true },
  { id: "lib-ws-02", title: "Worksheet: Prompting", type: "Worksheet", url: "/library/rbt/worksheets/prompting.pdf", description: "Prompt selection, delivery, and fading practice.", category: "worksheets", tags: ["prompting"], moduleIds: [], seeded: true },
  { id: "lib-ws-03", title: "Worksheet: Error Correction", type: "Worksheet", url: "/library/rbt/worksheets/error-correction.pdf", description: "Identify and respond to learner errors in trials.", category: "worksheets", tags: ["error correction"], moduleIds: [], seeded: true },
  { id: "lib-ws-04", title: "Worksheet: Task Analysis", type: "Worksheet", url: "/library/rbt/worksheets/task-analysis.pdf", description: "Break complex skills into teachable steps.", category: "worksheets", tags: ["task analysis"], moduleIds: [], seeded: true },
  { id: "lib-ws-05", title: "Worksheet: Generalization", type: "Worksheet", url: "/library/rbt/worksheets/generalization.pdf", description: "Plan and probe for generalization across settings.", category: "worksheets", tags: ["generalization"], moduleIds: [], seeded: true },
  { id: "lib-ws-06", title: "Worksheet: Documentation", type: "Worksheet", url: "/library/rbt/worksheets/documentation.pdf", description: "Practice writing clean, defensible session notes.", category: "worksheets", tags: ["documentation"], moduleIds: [], seeded: true },
  { id: "lib-ws-07", title: "Worksheet: Reinforcement", type: "Worksheet", url: "/library/rbt/worksheets/reinforcement.pdf", description: "Identify reinforcers and apply schedules in session.", category: "worksheets", tags: ["reinforcement"], moduleIds: [], seeded: true },
  { id: "lib-ws-08", title: "Worksheet: Safety & Reporting", type: "Worksheet", url: "/library/rbt/worksheets/safety-reporting.pdf", description: "Incident scenarios and the correct reporting path.", category: "worksheets", tags: ["safety"], moduleIds: [], seeded: true },
  { id: "lib-ws-09", title: "Worksheet: NET vs DTT", type: "Worksheet", url: "/library/rbt/worksheets/net-vs-dtt.pdf", description: "Compare and apply NET vs DTT in real programs.", category: "worksheets", tags: ["net", "dtt"], moduleIds: [], seeded: true },
  { id: "lib-ws-10", title: "Worksheet: ABC Data", type: "Worksheet", url: "/library/rbt/worksheets/abc-data.pdf", description: "Record antecedent–behavior–consequence cleanly.", category: "worksheets", tags: ["abc", "data"], moduleIds: [], seeded: true },
  { id: "lib-ws-11", title: "Worksheet: Ethics in Practice", type: "Worksheet", url: "/library/rbt/worksheets/ethics.pdf", description: "Apply the RBT ethics code to field scenarios.", category: "worksheets", tags: ["ethics"], moduleIds: [], seeded: true },
  { id: "lib-ws-12", title: "Worksheet: Caregiver Handoff", type: "Worksheet", url: "/library/rbt/worksheets/caregiver-handoff.pdf", description: "End-of-session caregiver communication practice.", category: "worksheets", tags: ["caregiver", "handoff"], moduleIds: [], seeded: true },
  { id: "lib-ws-13", title: "Worksheet: Transitions", type: "Worksheet", url: "/library/rbt/worksheets/transitions.pdf", description: "Support smooth transitions between activities.", category: "worksheets", tags: ["transitions"], moduleIds: [], seeded: true },
  { id: "lib-ws-14", title: "Worksheet: Scope of Practice", type: "Worksheet", url: "/library/rbt/worksheets/scope.pdf", description: "Stay inside the RBT scope — practice scenarios.", category: "worksheets", tags: ["scope"], moduleIds: [], seeded: true },

  // ---------- Library: Research & Clinical Articles ----------
  { id: "lib-r-01", title: "Treatment Integrity in ABA", type: "Research Article", url: "/library/rbt/research/treatment-integrity.pdf", description: "Why fidelity matters and how RBTs maintain it.", category: "research", tags: ["fidelity"], moduleIds: [], seeded: true },
  { id: "lib-r-02", title: "Prompt Fading Strategies", type: "Research Article", url: "/library/rbt/research/prompt-fading.pdf", description: "Evidence-based approaches to fading prompts.", category: "research", tags: ["prompting"], moduleIds: [], seeded: true },
  { id: "lib-r-03", title: "RBT Burnout & Turnover", type: "Research Article", url: "/library/rbt/research/burnout-turnover.pdf", description: "Drivers of RBT burnout and what helps.", category: "research", tags: ["retention", "burnout"], moduleIds: [], seeded: true },
  { id: "lib-r-04", title: "Assent in ABA", type: "Research Article", url: "/library/rbt/research/assent.pdf", description: "Research on incorporating assent into daily practice.", category: "research", tags: ["assent"], moduleIds: [], seeded: true },
  { id: "lib-r-05", title: "Compassionate Care in ABA", type: "Research Article", url: "/library/rbt/research/compassionate-care.pdf", description: "Bringing compassion into evidence-based practice.", category: "research", tags: ["compassion"], moduleIds: [], seeded: true },
  { id: "lib-r-06", title: "RBT Credentialing — Outcomes", type: "Research Article", url: "/library/rbt/research/credentialing.pdf", description: "Impact of RBT credentialing on care quality.", category: "research", tags: ["credentialing"], moduleIds: [], seeded: true },
  { id: "lib-r-07", title: "Ethics in Applied Practice", type: "Research Article", url: "/library/rbt/research/ethics.pdf", description: "Applied ethics — dilemmas RBTs encounter in the field.", category: "research", tags: ["ethics"], moduleIds: [], seeded: true },
  { id: "lib-r-08", title: "NDBI — Naturalistic Developmental Behavioral Interventions", type: "Research Article", url: "/library/rbt/research/ndbi.pdf", description: "Overview of NDBI and where it fits with ABA.", category: "research", tags: ["ndbi"], moduleIds: [], seeded: true },
  { id: "lib-r-09", title: "Motivating Operations", type: "Research Article", url: "/library/rbt/research/motivating-operations.pdf", description: "Reading and leveraging MOs in real sessions.", category: "research", tags: ["mo"], moduleIds: [], seeded: true },
  { id: "lib-r-10", title: "Reinforcement — Research Review", type: "Research Article", url: "/library/rbt/research/reinforcement.pdf", description: "Schedules and effects of reinforcement.", category: "research", tags: ["reinforcement"], moduleIds: [], seeded: true },
  { id: "lib-r-11", title: "Trauma-Informed ABA", type: "Research Article", url: "/library/rbt/research/trauma-informed.pdf", description: "Principles and practices of trauma-informed care.", category: "research", tags: ["trauma"], moduleIds: [], seeded: true },
  { id: "lib-r-12", title: "Generalization Strategies", type: "Research Article", url: "/library/rbt/research/generalization.pdf", description: "Programming for generalization across people, settings, materials.", category: "research", tags: ["generalization"], moduleIds: [], seeded: true },

  // ---------- Library: Retention, Engagement & Non-Billable Points ----------
  { id: "lib-rt-1", title: "Blossom Non-Billable Points System — Cheat Sheet", type: "PDF", url: "/library/rbt/retention/points-cheat-sheet.pdf", description: "Quick reference for earning non-billable points.", category: "retention", tags: ["points", "non-billable"], required: true, moduleIds: [], seeded: true },
  { id: "lib-rt-2", title: "Non-Billable Activities — In-Home RBTs", type: "PDF", url: "/library/rbt/retention/non-billable-in-home.pdf", description: "Approved non-billable activities for in-home RBTs.", category: "retention", tags: ["non-billable", "in-home"], moduleIds: [], seeded: true },
  { id: "lib-rt-3", title: "RBT Recognition & Growth Tracks", type: "PDF", url: "/library/rbt/retention/growth-tracks.pdf", description: "How RBTs grow into Lead RBT, mentor, and beyond.", category: "retention", tags: ["growth", "career"], tracks: ["certified_under_2yrs", "certified_2yrs_plus"], moduleIds: ["ex-o1"], seeded: true },
  { id: "lib-rt-4", title: "Engagement & Wellness Resources", type: "PDF", url: "/library/rbt/retention/wellness.pdf", description: "Burnout prevention and wellness supports for RBTs.", category: "retention", tags: ["wellness"], moduleIds: [], seeded: true },

  // ---------- Library: Scheduling, Payroll, PTO & Admin Basics ----------
  { id: "lib-a-1", title: "PTO Policy & Request Process", type: "Policy", url: "/library/rbt/admin/pto.pdf", description: "PTO accrual, request flow, and blackout windows.", category: "admin", tags: ["pto"], required: true, moduleIds: [], seeded: true },
  { id: "lib-a-2", title: "Scheduling Change Request — How-To", type: "How-To", url: "/library/rbt/admin/scheduling-change.pdf", description: "How to submit and track schedule changes.", category: "admin", tags: ["scheduling"], required: true, moduleIds: [], seeded: true },
  { id: "lib-a-3", title: "Payroll & Pay Period Calendar", type: "PDF", url: "/library/rbt/admin/payroll-calendar.pdf", description: "Pay periods, cutoffs, and direct deposit setup.", category: "admin", tags: ["payroll"], moduleIds: [], seeded: true },
  { id: "lib-a-4", title: "Mileage Reimbursement — How-To", type: "How-To", url: "/library/rbt/admin/mileage.pdf", description: "Submit mileage correctly and on time.", category: "admin", tags: ["mileage"], moduleIds: [], seeded: true },
  { id: "lib-a-5", title: "Benefits Overview", type: "PDF", url: "/library/rbt/admin/benefits.pdf", description: "Health, dental, vision, and other Blossom benefits.", category: "admin", tags: ["benefits"], moduleIds: [], seeded: true },
  { id: "lib-a-6", title: "Time Off Calendar & Holidays", type: "PDF", url: "/library/rbt/admin/holidays.pdf", description: "Observed holidays and how they affect pay.", category: "admin", tags: ["holidays"], moduleIds: [], seeded: true },
];

export function iconForType(type: RBTResourceType): string {
  // Returns a stable key consumers can map to a lucide icon.
  switch (type) {
    case "YouTube Video":
    case "Internal Video": return "video";
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
  }
}

// ---------- Store (localStorage, with React hook) ----------

const STORAGE_KEY = "blossom.rbt.resources.v1";

type StoredShape = {
  // Resources added by admins.
  custom: RBTResource[];
  // Edits applied on top of seeded resources, keyed by id.
  overrides: Record<string, Partial<RBTResource>>;
  // IDs of seeded resources the admin chose to hide.
  hiddenSeedIds: string[];
};

function emptyStore(): StoredShape {
  return { custom: [], overrides: {}, hiddenSeedIds: [] };
}

function readStore(): StoredShape {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

function writeStore(next: StoredShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) cb(); };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function buildResources(store: StoredShape): RBTResource[] {
  const seeded = STARTER_RBT_RESOURCES
    .filter((r) => !store.hiddenSeedIds.includes(r.id))
    .map((r) => ({ ...r, ...(store.overrides[r.id] ?? {}) }));
  return [...seeded, ...store.custom];
}

let cache: { store: StoredShape; resources: RBTResource[] } | null = null;
function getSnapshot(): RBTResource[] {
  const store = readStore();
  if (!cache || cache.store !== store) {
    // Compare by stringification — store reads return new objects.
    const sig = JSON.stringify(store);
    if (!cache || JSON.stringify(cache.store) !== sig) {
      cache = { store, resources: buildResources(store) };
    }
  }
  return cache.resources;
}

export function useRBTResources(): RBTResource[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => STARTER_RBT_RESOURCES);
}

export function getResourcesForModule(all: RBTResource[], moduleId: string): RBTResource[] {
  return all.filter((r) => r.moduleIds.includes(moduleId));
}

// ---------- Admin mutations ----------

function nextId() {
  return `rsrc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function addResource(input: Omit<RBTResource, "id" | "seeded" | "updatedAt">) {
  const store = readStore();
  const resource: RBTResource = {
    ...input,
    id: nextId(),
    seeded: false,
    updatedAt: new Date().toISOString(),
  };
  writeStore({ ...store, custom: [...store.custom, resource] });
  return resource;
}

export function updateResource(id: string, patch: Partial<RBTResource>) {
  const store = readStore();
  const seeded = STARTER_RBT_RESOURCES.find((r) => r.id === id);
  if (seeded) {
    writeStore({
      ...store,
      overrides: {
        ...store.overrides,
        [id]: { ...(store.overrides[id] ?? {}), ...patch, updatedAt: new Date().toISOString() },
      },
    });
    return;
  }
  writeStore({
    ...store,
    custom: store.custom.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
    ),
  });
}

export function removeResource(id: string) {
  const store = readStore();
  const seeded = STARTER_RBT_RESOURCES.find((r) => r.id === id);
  if (seeded) {
    if (store.hiddenSeedIds.includes(id)) return;
    writeStore({ ...store, hiddenSeedIds: [...store.hiddenSeedIds, id] });
    return;
  }
  writeStore({ ...store, custom: store.custom.filter((r) => r.id !== id) });
}

export function restoreSeededResource(id: string) {
  const store = readStore();
  writeStore({
    ...store,
    hiddenSeedIds: store.hiddenSeedIds.filter((x) => x !== id),
    overrides: Object.fromEntries(Object.entries(store.overrides).filter(([k]) => k !== id)),
  });
}