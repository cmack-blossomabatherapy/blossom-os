import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  ListChecks, ShieldCheck, ClipboardCheck, AlertTriangle, Users, MessageSquare,
  Wrench, Share2, ChevronRight, BookOpen, Library, Star, Calendar, ExternalLink,
  Bot, Layers, Compass, Wallet, BellRing, Folder, Receipt, CalendarClock, Flame,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Payroll Resource Library — configuration only
// Uses the existing Resource Library architecture. Resource content is
// skeletons — to be authored later. Strictly role-scoped to Payroll.
// =============================================================================

type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Checklist" | "Tango" | "Reference" | "Form";
type Category =
  | "Start Here"
  | "Payroll Operations SOPs"
  | "Payroll Readiness & Processing"
  | "PTO & Attendance"
  | "Payroll Communication"
  | "Benefits & Deductions"
  | "Payroll Compliance"
  | "Payroll Forms & Templates"
  | "Payroll Systems & Software"
  | "Leadership & Escalations";

type WorkflowKey =
  | "cycle" | "readiness" | "attendance" | "pto" | "deductions"
  | "adjustments" | "communication" | "escalation" | "compliance" | "systems";

type Visibility = "Payroll" | "HR" | "Finance" | "Leadership";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  updated: string;
  href?: string;
  featured?: boolean;
  required?: boolean;
  workflows?: WorkflowKey[];
  system?: string;
  owner?: string;
  visibility: Visibility[];
  placeholder?: boolean;
}

const resources: Resource[] = [
  // Start Here
  { id: "sh1", title: "Payroll Team Overview", description: "Operational structure, Payroll vs HR vs Finance ownership, escalation expectations.", category: "Start Here", type: "Guide", updated: "2026-05-22", featured: true, required: true, owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sh2", title: "Payroll Role Expectations", description: "Operational standards, communication expectations, follow-up and documentation standards.", category: "Start Here", type: "Reference", updated: "2026-05-20", required: true, owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sh3", title: "Payroll Communication Standards", description: "Written-first communication, documenting calls, escalation, centralized workflow comms.", category: "Start Here", type: "Guide", updated: "2026-05-19", featured: true, required: true, workflows: ["communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sh4", title: "Payroll Workflow Overview", description: "Payroll cycle flow, readiness flow, attendance review flow, issue resolution flow.", category: "Start Here", type: "Guide", updated: "2026-05-18", featured: true, workflows: ["cycle", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sh5", title: "Blossom OS Payroll Philosophy", description: "Calm operations, workflow-first, operational visibility, reducing payroll chaos.", category: "Start Here", type: "Reference", updated: "2026-05-16", owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Payroll Operations SOPs
  { id: "op1", title: "Weekly Payroll Workflow SOP", description: "Reflects the operational shift from biweekly → weekly reminders.", category: "Payroll Operations SOPs", type: "SOP", updated: "2026-05-22", featured: true, required: true, workflows: ["cycle", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "op2", title: "Payroll Queue SOP", description: "Queue ownership, status updates, follow-up documentation, escalation.", category: "Payroll Operations SOPs", type: "SOP", updated: "2026-05-20", required: true, workflows: ["cycle"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "op3", title: "Payroll Workspace SOP", description: "Managing operational workflows, documenting activity, managing blockers.", category: "Payroll Operations SOPs", type: "SOP", updated: "2026-05-18", workflows: ["cycle"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "op4", title: "Payroll Adjustment SOP", description: "Corrections, reimbursements, retroactive changes, approvals.", category: "Payroll Operations SOPs", type: "SOP", updated: "2026-05-16", workflows: ["adjustments"], owner: "Payroll", visibility: ["Payroll", "Finance"], placeholder: true },
  { id: "op5", title: "Payroll Escalation SOP", description: "What requires escalation, routing, blockers, leadership involvement.", category: "Payroll Operations SOPs", type: "SOP", updated: "2026-05-14", workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "op6", title: "Payroll Readiness Checklist", description: "Attendance, PTO, unresolved issues, deductions, close-readiness.", category: "Payroll Operations SOPs", type: "Checklist", updated: "2026-05-12", workflows: ["readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Payroll Readiness & Processing
  { id: "rd1", title: "Payroll Readiness SOP", description: "Operational steps to confirm payroll is ready for processing.", category: "Payroll Readiness & Processing", type: "SOP", updated: "2026-05-21", featured: true, workflows: ["readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd2", title: "Missing Time Entry Workflow", description: "Identifying, communicating, and resolving missing time entries.", category: "Payroll Readiness & Processing", type: "Workflow", updated: "2026-05-19", workflows: ["readiness", "attendance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd3", title: "Attendance Review Workflow", description: "Standardized attendance review tied to payroll cutoff.", category: "Payroll Readiness & Processing", type: "Workflow", updated: "2026-05-17", workflows: ["attendance", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd4", title: "Payroll Deadline Checklist", description: "What must be complete before each deadline.", category: "Payroll Readiness & Processing", type: "Checklist", updated: "2026-05-15", workflows: ["readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd5", title: "Payroll Risk Identification Guide", description: "Spotting payroll risks early.", category: "Payroll Readiness & Processing", type: "Guide", updated: "2026-05-13", workflows: ["readiness", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd6", title: "Payroll Closing Process", description: "Closing operational steps after submission.", category: "Payroll Readiness & Processing", type: "SOP", updated: "2026-05-11", workflows: ["cycle"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd7", title: "Payroll Follow-Up Timeline Guide", description: "Expected follow-up cadence after each cycle event.", category: "Payroll Readiness & Processing", type: "Reference", updated: "2026-05-09", workflows: ["readiness", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "rd8", title: "NJ Payroll Workflow Notes", description: "NJ payroll currently operates separately — operational notes and exceptions.", category: "Payroll Readiness & Processing", type: "Reference", updated: "2026-05-07", workflows: ["cycle"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },

  // PTO & Attendance
  { id: "pa1", title: "PTO Workflow SOP", description: "End-to-end PTO operational workflow.", category: "PTO & Attendance", type: "SOP", updated: "2026-05-20", featured: true, workflows: ["pto"], owner: "Payroll", visibility: ["Payroll", "HR"], placeholder: true },
  { id: "pa2", title: "PTO Payroll Impact Guide", description: "How PTO affects the current pay cycle.", category: "PTO & Attendance", type: "Guide", updated: "2026-05-18", workflows: ["pto", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "pa3", title: "Attendance Exception Workflow", description: "Handling attendance exceptions operationally.", category: "PTO & Attendance", type: "Workflow", updated: "2026-05-16", workflows: ["attendance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "pa4", title: "Missing Hours Workflow", description: "Resolving missing hours before payroll close.", category: "PTO & Attendance", type: "Workflow", updated: "2026-05-14", workflows: ["attendance", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "pa5", title: "PTO Escalation Process", description: "When to escalate unresolved PTO situations.", category: "PTO & Attendance", type: "SOP", updated: "2026-05-12", workflows: ["pto", "escalation"], owner: "Payroll", visibility: ["Payroll", "HR"], placeholder: true },
  { id: "pa6", title: "Attendance Follow-Up Templates", description: "Approved follow-up messaging for attendance issues.", category: "PTO & Attendance", type: "Template", updated: "2026-05-10", workflows: ["attendance", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "pa7", title: "Time & Attendance Review Checklist", description: "Operational checklist for cyclical time review.", category: "PTO & Attendance", type: "Checklist", updated: "2026-05-08", workflows: ["attendance", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "pa8", title: "Attendance Documentation Standards", description: "Documentation expectations for attendance discussions.", category: "PTO & Attendance", type: "Guide", updated: "2026-05-06", workflows: ["attendance", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Payroll Communication
  { id: "co1", title: "Payroll Reminder Templates", description: "Approved reminder messaging for employees.", category: "Payroll Communication", type: "Template", updated: "2026-05-22", featured: true, workflows: ["communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co2", title: "Weekly Payroll Reminder SOP", description: "New weekly reminder cadence (transitioning from biweekly).", category: "Payroll Communication", type: "SOP", updated: "2026-05-20", required: true, workflows: ["communication", "cycle"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co3", title: "Employee Payroll Communication SOP", description: "Operational standards for employee-facing payroll comms.", category: "Payroll Communication", type: "SOP", updated: "2026-05-18", workflows: ["communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co4", title: "Payroll Follow-Up Workflow", description: "When and how to follow up — written, recorded, owned.", category: "Payroll Communication", type: "Workflow", updated: "2026-05-16", workflows: ["communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co5", title: "Payroll Issue Communication Standards", description: "Standards for documenting payroll issue conversations.", category: "Payroll Communication", type: "Guide", updated: "2026-05-14", workflows: ["communication", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co6", title: "Escalation Communication Templates", description: "Approved escalation messaging.", category: "Payroll Communication", type: "Template", updated: "2026-05-12", workflows: ["escalation", "communication"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "co7", title: "PTO Communication Templates", description: "Approved PTO clarification messaging.", category: "Payroll Communication", type: "Template", updated: "2026-05-10", workflows: ["pto", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co8", title: "Attendance Follow-Up Templates", description: "Approved attendance follow-up messaging.", category: "Payroll Communication", type: "Template", updated: "2026-05-08", workflows: ["attendance", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "co9", title: "Missing Documentation Outreach Templates", description: "Templates for chasing missing payroll documentation.", category: "Payroll Communication", type: "Template", updated: "2026-05-06", workflows: ["communication", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Benefits & Deductions
  { id: "bd1", title: "Benefits Coordination Workflow", description: "Operational coordination between Payroll, HR, and benefits providers.", category: "Benefits & Deductions", type: "Workflow", updated: "2026-05-21", featured: true, workflows: ["deductions"], owner: "Payroll", visibility: ["Payroll", "HR"], placeholder: true },
  { id: "bd2", title: "Deduction Change SOP", description: "Processing deduction additions, changes, and stops.", category: "Benefits & Deductions", type: "SOP", updated: "2026-05-19", required: true, workflows: ["deductions"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "bd3", title: "Payroll Impact Review Guide", description: "Reviewing deduction impact on the current cycle.", category: "Benefits & Deductions", type: "Guide", updated: "2026-05-17", workflows: ["deductions", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "bd4", title: "Benefits Follow-Up SOP", description: "Following up on incomplete benefits enrollment.", category: "Benefits & Deductions", type: "SOP", updated: "2026-05-15", workflows: ["deductions", "communication"], owner: "Payroll", visibility: ["Payroll", "HR"], placeholder: true },
  { id: "bd5", title: "Deduction Documentation Standards", description: "Documentation standards for any deduction change.", category: "Benefits & Deductions", type: "Guide", updated: "2026-05-13", workflows: ["deductions", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "bd6", title: "Benefits Escalation Workflow", description: "When to escalate benefits-related payroll blockers.", category: "Benefits & Deductions", type: "Workflow", updated: "2026-05-11", workflows: ["deductions", "escalation"], owner: "Payroll", visibility: ["Payroll", "HR"], placeholder: true },
  { id: "bd7", title: "Employee Benefits Communication Templates", description: "Approved benefits-related employee messaging.", category: "Benefits & Deductions", type: "Template", updated: "2026-05-09", workflows: ["deductions", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "bd8", title: "Adjustment + Benefits Coordination Guide", description: "Coordinating adjustments that intersect with benefits.", category: "Benefits & Deductions", type: "Guide", updated: "2026-05-07", workflows: ["adjustments", "deductions"], owner: "Payroll", visibility: ["Payroll", "Finance"], placeholder: true },

  // Payroll Compliance
  { id: "cp1", title: "Payroll Documentation Standards", description: "Operational documentation standards across all payroll workflows.", category: "Payroll Compliance", type: "Guide", updated: "2026-05-21", featured: true, required: true, workflows: ["compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "cp2", title: "Payroll Audit Readiness SOP", description: "Keeping payroll audit-ready operationally.", category: "Payroll Compliance", type: "SOP", updated: "2026-05-19", workflows: ["compliance"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "cp3", title: "Payroll Communication Logging Standards", description: "Logging every payroll communication — written and recorded.", category: "Payroll Compliance", type: "Guide", updated: "2026-05-17", required: true, workflows: ["compliance", "communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "cp4", title: "Payroll Record Retention Guide", description: "How long records are retained and where they live.", category: "Payroll Compliance", type: "Reference", updated: "2026-05-15", workflows: ["compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "cp5", title: "Payroll Compliance Checklist", description: "Operational compliance checklist per cycle.", category: "Payroll Compliance", type: "Checklist", updated: "2026-05-13", workflows: ["compliance", "readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "cp6", title: "Attendance Documentation Requirements", description: "Operational documentation standards for attendance issues.", category: "Payroll Compliance", type: "Guide", updated: "2026-05-11", workflows: ["attendance", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "cp7", title: "Payroll Escalation Compliance SOP", description: "Compliance expectations on escalated payroll items.", category: "Payroll Compliance", type: "SOP", updated: "2026-05-09", workflows: ["escalation", "compliance"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "cp8", title: "Payroll Workflow Consistency Guide", description: "Operational standards to keep payroll consistent across states.", category: "Payroll Compliance", type: "Guide", updated: "2026-05-07", workflows: ["compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Payroll Forms & Templates
  { id: "fm1", title: "Payroll Adjustment Form", description: "Standard form for submitting payroll adjustments.", category: "Payroll Forms & Templates", type: "Form", updated: "2026-05-20", workflows: ["adjustments"], owner: "Payroll", visibility: ["Payroll", "Finance"], placeholder: true },
  { id: "fm2", title: "Missing Time Request Form", description: "Form used when chasing missing time entries.", category: "Payroll Forms & Templates", type: "Form", updated: "2026-05-18", workflows: ["attendance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "fm3", title: "Payroll Issue Intake Form", description: "Form to log a new payroll issue operationally.", category: "Payroll Forms & Templates", type: "Form", updated: "2026-05-16", workflows: ["cycle"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "fm4", title: "PTO Clarification Form", description: "Form to capture PTO clarifications affecting payroll.", category: "Payroll Forms & Templates", type: "Form", updated: "2026-05-14", workflows: ["pto"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "fm5", title: "Payroll Escalation Form", description: "Standard escalation form with routing.", category: "Payroll Forms & Templates", type: "Form", updated: "2026-05-12", workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "fm6", title: "Employee Payroll Follow-Up Template", description: "Lightweight template for employee follow-ups.", category: "Payroll Forms & Templates", type: "Template", updated: "2026-05-10", workflows: ["communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "fm7", title: "Payroll Review Checklist", description: "Cycle-by-cycle review checklist.", category: "Payroll Forms & Templates", type: "Checklist", updated: "2026-05-08", workflows: ["readiness"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "fm8", title: "Reimbursement Submission Template", description: "Standard reimbursement submission template.", category: "Payroll Forms & Templates", type: "Template", updated: "2026-05-06", workflows: ["adjustments"], owner: "Payroll", visibility: ["Payroll", "Finance"], placeholder: true },
  { id: "fm9", title: "Payroll Communication Templates", description: "General-purpose payroll communication templates.", category: "Payroll Forms & Templates", type: "Template", updated: "2026-05-04", workflows: ["communication"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "fm10", title: "Attendance Exception Template", description: "Template for logging attendance exceptions.", category: "Payroll Forms & Templates", type: "Template", updated: "2026-05-02", workflows: ["attendance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Payroll Systems & Software
  { id: "sy1", title: "Viventium Payroll Guide", description: "Operational reference for Viventium payroll workflows.", category: "Payroll Systems & Software", type: "Guide", updated: "2026-05-21", featured: true, workflows: ["systems"], system: "Viventium", owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy2", title: "CentralReach Attendance Guide", description: "Operational reference for CentralReach hour review workflows.", category: "Payroll Systems & Software", type: "Guide", updated: "2026-05-19", workflows: ["systems", "attendance"], system: "CentralReach", owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy3", title: "Payroll Queue System Guide", description: "Operating the Blossom OS Payroll Queue end-to-end.", category: "Payroll Systems & Software", type: "Guide", updated: "2026-05-17", workflows: ["systems", "cycle"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy4", title: "Blossom OS Payroll Workspace Guide", description: "Operating the Payroll Workspace.", category: "Payroll Systems & Software", type: "Guide", updated: "2026-05-15", workflows: ["systems"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy5", title: "Payroll Documentation Best Practices", description: "How to document operationally inside Blossom OS.", category: "Payroll Systems & Software", type: "Guide", updated: "2026-05-13", workflows: ["systems", "compliance"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy6", title: "Payroll Reporting Workflow", description: "Operational reporting cadence and ownership.", category: "Payroll Systems & Software", type: "Workflow", updated: "2026-05-11", workflows: ["systems"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "sy7", title: "Payroll Data Upload Standards", description: "Standards for Admin → Data Uploads tied to payroll.", category: "Payroll Systems & Software", type: "Guide", updated: "2026-05-09", workflows: ["systems"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy8", title: "Viventium Onboarding (Tango)", description: "Tango walkthrough for the Viventium onboarding flow.", category: "Payroll Systems & Software", type: "Tango", updated: "2026-05-07", workflows: ["systems"], system: "Viventium", owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "sy9", title: "CentralReach Time Review (Tango)", description: "Tango walkthrough for time review.", category: "Payroll Systems & Software", type: "Tango", updated: "2026-05-05", workflows: ["systems", "attendance"], system: "CentralReach", owner: "Payroll", visibility: ["Payroll"], placeholder: true },

  // Leadership & Escalations
  { id: "le1", title: "Payroll Escalation Matrix", description: "Who handles what — by severity and category.", category: "Leadership & Escalations", type: "Reference", updated: "2026-05-22", featured: true, required: true, workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "le2", title: "HR vs Payroll Ownership Guide", description: "Operational ownership boundaries between HR and Payroll.", category: "Leadership & Escalations", type: "Guide", updated: "2026-05-20", workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll", "HR", "Leadership"], placeholder: true },
  { id: "le3", title: "Payroll Leadership Contacts", description: "Operational leadership contacts for escalation.", category: "Leadership & Escalations", type: "Reference", updated: "2026-05-18", workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
  { id: "le4", title: "Payroll Risk Escalation SOP", description: "How to escalate operational payroll risk.", category: "Leadership & Escalations", type: "SOP", updated: "2026-05-16", workflows: ["escalation", "compliance"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "le5", title: "High-Risk Payroll Workflow Guide", description: "Handling high-risk payroll situations operationally.", category: "Leadership & Escalations", type: "Guide", updated: "2026-05-14", workflows: ["escalation", "compliance"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "le6", title: "Operational Incident Response Guide", description: "Responding to operational payroll incidents.", category: "Leadership & Escalations", type: "Guide", updated: "2026-05-12", workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll", "Leadership"], placeholder: true },
  { id: "le7", title: "Payroll Issue Severity Guidelines", description: "How to triage severity operationally.", category: "Leadership & Escalations", type: "Reference", updated: "2026-05-10", workflows: ["escalation"], owner: "Payroll", visibility: ["Payroll"], placeholder: true },
];

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "cycle", label: "Payroll cycle", icon: CalendarClock },
  { key: "readiness", label: "Readiness", icon: ListChecks },
  { key: "attendance", label: "Attendance", icon: Clock },
  { key: "pto", label: "PTO", icon: Calendar },
  { key: "deductions", label: "Benefits / Deductions", icon: Receipt },
  { key: "adjustments", label: "Adjustments", icon: Wallet },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "escalation", label: "Escalation", icon: Flame },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "systems", label: "Systems", icon: Wrench },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "Start Here": { icon: Compass, blurb: "Payroll operational orientation." },
  "Payroll Operations SOPs": { icon: WorkflowIcon, blurb: "Core operational payroll SOPs." },
  "Payroll Readiness & Processing": { icon: ListChecks, blurb: "Cycle readiness, missing time, deadlines." },
  "PTO & Attendance": { icon: Clock, blurb: "PTO and attendance operational workflows." },
  "Payroll Communication": { icon: MessageSquare, blurb: "Approved reminders, templates, follow-up SOPs." },
  "Benefits & Deductions": { icon: Receipt, blurb: "Operational benefits + deduction coordination." },
  "Payroll Compliance": { icon: ShieldCheck, blurb: "Documentation, retention, audit readiness." },
  "Payroll Forms & Templates": { icon: FileText, blurb: "Forms and templates for payroll workflows." },
  "Payroll Systems & Software": { icon: Wrench, blurb: "Viventium, CentralReach, Payroll Queue, Tangos." },
  "Leadership & Escalations": { icon: Flame, blurb: "Escalation matrix and ownership boundaries." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText, Workflow: WorkflowIcon, Guide: BookOpen, Template: MessageSquare,
  Checklist: ListChecks, Tango: WorkflowIcon, Reference: Layers, Form: FileText,
};

type QuickFilter = "most-used" | "recent" | "essentials" | "weekly-cadence" | "new-payroll";
const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "most-used", label: "Most used" },
  { key: "recent", label: "Recently updated" },
  { key: "essentials", label: "Payroll essentials" },
  { key: "weekly-cadence", label: "Weekly reminder cadence" },
  { key: "new-payroll", label: "New payroll staff" },
];

const MOST_USED_IDS = new Set(["op1", "op2", "rd2", "co1", "co2", "sy1", "le1"]);
const ESSENTIALS_IDS = new Set(["op1", "op2", "op6", "rd1", "co2", "cp1", "le1"]);
const NEW_PAYROLL_IDS = new Set(["sh1", "sh2", "sh3", "sh4", "sh5", "op1", "sy1"]);
const WEEKLY_CADENCE_IDS = new Set(["op1", "co1", "co2", "co3", "co4", "rd2", "rd7"]);

const aiPrompts = [
  { q: "Show the weekly payroll workflow.", a: "Open Payroll Operations SOPs → Weekly Payroll Workflow SOP. Pair with the Weekly Payroll Reminder SOP under Payroll Communication for the new weekly cadence." },
  { q: "How do I document a payroll call?", a: "Payroll Communication → Payroll Issue Communication Standards plus Payroll Compliance → Payroll Communication Logging Standards. Every call must be written down and recorded." },
  { q: "Find the payroll escalation matrix.", a: "Leadership & Escalations → Payroll Escalation Matrix. Pair with HR vs Payroll Ownership Guide to confirm routing." },
  { q: "What templates exist for attendance follow-up?", a: "PTO & Attendance → Attendance Follow-Up Templates, plus Payroll Communication → Attendance Follow-Up Templates for cycle-tied messaging." },
  { q: "Show the payroll readiness checklist.", a: "Payroll Operations SOPs → Payroll Readiness Checklist, plus Payroll Readiness & Processing → Payroll Deadline Checklist." },
  { q: "Find Viventium operational guides.", a: "Payroll Systems & Software → Viventium Payroll Guide, plus the Viventium Onboarding Tango walkthrough." },
];

export default function OSPayrollResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [activeQuick, setActiveQuick] = useState<QuickFilter | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["op1", "co2", "le1"]));
  const [recent] = useState<string[]>(["op1", "co2", "rd2", "sy1", "le1"]);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);

  const toggleSave = (id: string) => {
    setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (activeCategory && r.category !== activeCategory) return false;
      if (activeWorkflow && !(r.workflows ?? []).includes(activeWorkflow)) return false;
      if (activeQuick === "most-used" && !MOST_USED_IDS.has(r.id)) return false;
      if (activeQuick === "essentials" && !ESSENTIALS_IDS.has(r.id)) return false;
      if (activeQuick === "new-payroll" && !NEW_PAYROLL_IDS.has(r.id)) return false;
      if (activeQuick === "weekly-cadence" && !WEEKLY_CADENCE_IDS.has(r.id)) return false;
      if (activeQuick === "recent") {
        const days = (Date.parse("2026-05-26") - Date.parse(r.updated)) / 86400000;
        if (days > 30) return false;
      }
      if (!q) return true;
      return [r.title, r.description, r.category, r.type, r.system ?? "", r.owner ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [query, activeCategory, activeWorkflow, activeQuick]);

  const featured = useMemo(() => resources.filter((r) => r.featured), []);
  const recentResources = useMemo(
    () => recent.map((id) => resources.find((r) => r.id === id)).filter(Boolean) as Resource[],
    [recent],
  );

  const isFiltering = query.trim().length > 0 || activeCategory !== null || activeWorkflow !== null || activeQuick !== null;
  const clearAll = () => { setActiveCategory(null); setActiveWorkflow(null); setActiveQuick(null); setQuery(""); };

  return (
    <OSShell rightRail={<ResourceRail saved={saved.size} recent={recent.length} onClearFilters={clearAll} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" /> Resource Library · Payroll
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Resource Library</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Operational SOPs, workflows, communication templates, compliance guides, forms, and systems documentation for the Payroll Team.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Folder className="mr-1.5 h-3.5 w-3.5" /> Create folder
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Create SOP
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Manage visibility
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/ai/assistant"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask Blossom AI</Link>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs, weekly reminders, PTO, attendance, deductions, Viventium…"
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveQuick(activeQuick === f.key ? null : f.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] transition-colors",
                  activeQuick === f.key
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
            {isFiltering && (
              <>
                <span className="mx-1 h-3 w-px bg-border/70" />
                {activeCategory && <Chip onClear={() => setActiveCategory(null)}>{activeCategory}</Chip>}
                {activeWorkflow && <Chip onClear={() => setActiveWorkflow(null)}>{workflows.find((w) => w.key === activeWorkflow)?.label}</Chip>}
                {query && <Chip onClear={() => setQuery("")}>"{query}"</Chip>}
                <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Clear all</button>
                <span className="ml-1 text-[11px] text-muted-foreground tabular-nums">{filtered.length} resource{filtered.length === 1 ? "" : "s"}</span>
              </>
            )}
          </div>
        </div>

        {isFiltering ? (
          <FilteredView resources={filtered} saved={saved} onToggleSave={toggleSave} />
        ) : (
          <>
            <Section title="Featured operational resources" subtitle="The most-used Payroll playbook items.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Organized for Payroll operations.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(categoryMeta) as Category[]).map((c) => {
                  const meta = categoryMeta[c];
                  const items = resources.filter((r) => r.category === c);
                  const mostRecent = items.slice().sort((a, b) => b.updated.localeCompare(a.updated))[0];
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
                        <span className="text-[11px] tabular-nums text-muted-foreground">{items.length}</span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">{c}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>
                      {mostRecent && <p className="mt-3 text-[11px] text-muted-foreground/80">Updated {formatDate(mostRecent.updated)}</p>}
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

            <Section title="Find by workflow" subtitle="Resources grouped by the operational moment they support.">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

            <Section title="Ask Blossom AI" subtitle="Find SOPs, workflows, templates, or operational guidance.">
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex flex-wrap gap-2">
                  {aiPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePrompt(i === activePrompt ? null : i)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        activePrompt === i
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/60 bg-muted/50 text-foreground hover:bg-muted",
                      )}
                    >
                      <MessageSquare className="mr-1 inline h-3 w-3" /> {p.q}
                    </button>
                  ))}
                </div>
                {activePrompt !== null && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Operational answer · role-aware</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{aiPrompts[activePrompt].a}</p>
                  </div>
                )}
                <p className="mt-4 text-[11px] text-muted-foreground">HIPAA-aware · scoped to Payroll resources you have access to.</p>
              </div>
            </Section>
          </>
        )}
      </div>
    </OSShell>
  );
}

// ---------- subcomponents ----------

function FilteredView({ resources: rs, saved, onToggleSave }: { resources: Resource[]; saved: Set<string>; onToggleSave: (id: string) => void }) {
  if (rs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-16 text-center">
        <p className="text-sm text-muted-foreground">No Payroll resources matched your search.</p>
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
      {children} <span className="text-muted-foreground">×</span>
    </button>
  );
}

function FeaturedCard({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  const inner = (
    <div className="group relative h-full rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
            saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
        >
          <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        </button>
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
        {r.required && <Badge className="rounded-full bg-primary/15 text-primary text-[10px] hover:bg-primary/15">Required</Badge>}
        {r.placeholder && <Badge variant="outline" className="rounded-full text-[10px]">Skeleton</Badge>}
        <span>{r.category}</span>
        <span>· Updated {formatDate(r.updated)}</span>
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/50 pt-3 text-[11px]">
        <QuickAction icon={ArrowRight} label="Open" />
        <QuickAction icon={Share2} label="Share" />
        <QuickAction icon={Sparkles} label="Ask AI" />
      </div>
    </div>
  );
  return r.href ? <Link to={r.href} className="block h-full">{inner}</Link> : inner;
}

function ResourceRow({ r, saved, onToggleSave }: { r: Resource; saved: boolean; onToggleSave: () => void }) {
  const Icon = typeIcon[r.type];
  const inner = (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{r.title}</p>
          <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
          {r.required && <Badge className="rounded-full bg-primary/15 text-primary text-[10px] hover:bg-primary/15">Required</Badge>}
          {r.placeholder && <Badge variant="outline" className="rounded-full text-[10px]">Skeleton</Badge>}
          <span className="text-[11px] text-muted-foreground">{r.category}</span>
          {r.owner && <span className="text-[11px] text-muted-foreground/80">· {r.owner}</span>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.updated)}</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {r.visibility.join(" · ")}</span>
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
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Operational tip</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          Payroll has shifted from biweekly → weekly reminders. Search "weekly" or use the Weekly reminder cadence quick filter.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/payroll/workspace" label="Payroll workspace" icon={Wallet} />
          <RailLink to="/payroll/queue" label="Payroll queue" icon={ListChecks} />
          <RailLink to="/payroll/time-attendance" label="Time & attendance" icon={Clock} />
          <RailLink to="/payroll/pto" label="PTO & time off" icon={Calendar} />
          <RailLink to="/payroll/messages" label="Messages & updates" icon={BellRing} />
          <RailLink to="/ai/assistant" label="Ask Blossom AI" icon={Bot} />
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

function RailLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Users }) {
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