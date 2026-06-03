import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  PlayCircle, ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
  Users, Target, MessageSquare, Wrench, Share2, ChevronRight,
  BookOpen, Library, Star, Calendar, ExternalLink, Mail, Flame,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// QA / Compliance Resource Library
// Role-scoped operational knowledge for the QA team. Categories, SOP placeholders,
// workflow placeholders, templates, and quick references — no fake content beyond
// curated placeholder titles. Search, favorites, recents, and Ask Blossom AI use
// the established Blossom OS Resource Library pattern.
// =============================================================================

type ResourceType =
  | "SOP" | "Workflow" | "Guide" | "Template" | "Checklist"
  | "Reference" | "Platform Guide" | "Escalation Guide" | "Communication Template";

type Category =
  | "QA SOPs"
  | "Authorization Review Workflows"
  | "Progress Report Workflows"
  | "Treatment Plan Review Workflows"
  | "Escalations & Follow-Ups"
  | "Supervision Visibility & QA Coordination"
  | "Communication Templates"
  | "QA Operational Standards"
  | "Training & Reference Materials"
  | "System Guides & Platform Workflows";

type WorkflowKey =
  | "qa-review" | "pr-followup" | "tp-review" | "missing-info"
  | "escalation" | "supervision" | "expiring" | "submission";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  minutes: number;
  updated: string;
  owner?: string;
  href?: string;
  featured?: boolean;
  workflows?: WorkflowKey[];
}

const TODAY = "2026-05-22";

const resources: Resource[] = [
  // ------- Featured (drawn from across categories) -------
  { id: "f1", title: "QA Daily Workflow SOP", description: "The morning scan, queue triage, and end-of-day handoff routine for QA.", category: "QA SOPs", type: "SOP", minutes: 6, updated: "2026-05-18", featured: true, owner: "Rochel Walzman" },
  { id: "f2", title: "PR Escalation SOP", description: "9-week and 6-week escalation ladders for GA and other states.", category: "Progress Report Workflows", type: "Escalation Guide", minutes: 7, updated: "2026-05-14", featured: true, owner: "Julianne Rodriguez", workflows: ["pr-followup", "escalation"] },
  { id: "f3", title: "Treatment Plan Review SOP", description: "What QA validates, what gets routed back, what moves to submission.", category: "Treatment Plan Review Workflows", type: "SOP", minutes: 8, updated: "2026-05-12", featured: true, owner: "Amanda Avalos", workflows: ["tp-review", "qa-review"] },
  { id: "f4", title: "Missing Information Workflow", description: "How to identify, route, and resolve missing documentation by owner.", category: "Authorization Review Workflows", type: "Workflow", minutes: 6, updated: "2026-05-10", featured: true, owner: "Anje Grobler", workflows: ["missing-info"] },
  { id: "f5", title: "Escalation Standards SOP", description: "When QA escalates, to whom, and what documentation is required.", category: "Escalations & Follow-Ups", type: "SOP", minutes: 5, updated: "2026-05-09", featured: true, owner: "Raizy Folger", workflows: ["escalation"] },
  { id: "f6", title: "Expiring Authorization Workflow", description: "Operational checkpoints at 90 / 60 / 30 / 14 days.", category: "Authorization Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-16", featured: true, workflows: ["expiring"], href: "/expiring-items" },

  // ------- 1. QA SOPs -------
  { id: "s1", title: "QA Daily Workflow SOP", description: "Morning scan, queue triage, end-of-day handoff.", category: "QA SOPs", type: "SOP", minutes: 6, updated: "2026-05-18" },
  { id: "s2", title: "QA Review Process SOP", description: "How treatment auths move through QA Review and back to submission.", category: "QA SOPs", type: "SOP", minutes: 8, updated: "2026-05-15", workflows: ["qa-review"] },
  { id: "s3", title: "QA Queue Management SOP", description: "Prioritization rules and queue ownership.", category: "QA SOPs", type: "SOP", minutes: 5, updated: "2026-05-13" },
  { id: "s4", title: "QA Escalation SOP", description: "Internal escalation paths within QA.", category: "QA SOPs", type: "SOP", minutes: 5, updated: "2026-05-11", workflows: ["escalation"] },
  { id: "s5", title: "QA Follow-Up Standards SOP", description: "Cadence and tone for QA outreach.", category: "QA SOPs", type: "SOP", minutes: 4, updated: "2026-05-09" },
  { id: "s6", title: "QA Documentation Standards SOP", description: "Note quality, audit trail, and required fields.", category: "QA SOPs", type: "SOP", minutes: 6, updated: "2026-05-07" },
  { id: "s7", title: "QA Operational Expectations SOP", description: "Daily, weekly, and monthly operational expectations.", category: "QA SOPs", type: "SOP", minutes: 5, updated: "2026-05-05" },
  { id: "s8", title: "QA Priority Management SOP", description: "How to prioritize across competing operational risks.", category: "QA SOPs", type: "SOP", minutes: 5, updated: "2026-05-03" },
  { id: "s9", title: "QA Communication Standards SOP", description: "Cross-team tone, response time, and escalation language.", category: "QA SOPs", type: "SOP", minutes: 4, updated: "2026-05-01" },
  { id: "s10", title: "QA Workflow Ownership SOP", description: "Who owns what across PRs, TPs, and authorizations.", category: "QA SOPs", type: "SOP", minutes: 6, updated: "2026-04-28" },

  // ------- 2. Authorization Review Workflows -------
  { id: "a1", title: "Authorization Review SOP", description: "End-to-end QA review for authorization packets.", category: "Authorization Review Workflows", type: "SOP", minutes: 8, updated: "2026-05-19", workflows: ["qa-review"] },
  { id: "a2", title: "In QA Review Workflow", description: "What QA confirms before routing back to Awaiting Submission.", category: "Authorization Review Workflows", type: "Workflow", minutes: 6, updated: "2026-05-17", workflows: ["qa-review"] },
  { id: "a3", title: "Missing Information Workflow", description: "Map gaps to owners, resolve, and re-queue.", category: "Authorization Review Workflows", type: "Workflow", minutes: 6, updated: "2026-05-10", workflows: ["missing-info"], href: "/missing-information" },
  { id: "a4", title: "Awaiting Submission Workflow", description: "What blocks submission and how QA unblocks it.", category: "Authorization Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-08", workflows: ["submission"] },
  { id: "a5", title: "Expiring Authorization Workflow", description: "Operational checkpoints at 90 / 60 / 30 / 14 days.", category: "Authorization Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-16", workflows: ["expiring"], href: "/expiring-items" },
  { id: "a6", title: "Reassessment Workflow", description: "Timing reassessments so QA-cleared lands ≥ 14 days pre-expiration.", category: "Authorization Review Workflows", type: "Workflow", minutes: 6, updated: "2026-05-06" },
  { id: "a7", title: "Treatment Auth Review SOP", description: "QA expectations specific to treatment authorizations.", category: "Authorization Review Workflows", type: "SOP", minutes: 7, updated: "2026-05-04", workflows: ["tp-review"] },
  { id: "a8", title: "Authorization Escalation SOP", description: "When to escalate auth risk to QA Lead or SD.", category: "Authorization Review Workflows", type: "SOP", minutes: 5, updated: "2026-05-02", workflows: ["escalation"] },
  { id: "a9", title: "Authorization Readiness Checklist", description: "Pre-submission checklist for packet completeness.", category: "Authorization Review Workflows", type: "Checklist", minutes: 3, updated: "2026-04-30" },
  { id: "a10", title: "Payor Workflow Reference Guide", description: "Per-payor cadence and operational expectations.", category: "Authorization Review Workflows", type: "Reference", minutes: 6, updated: "2026-04-27" },

  // ------- 3. Progress Report Workflows -------
  { id: "p1", title: "Progress Report Collection SOP", description: "Operational SOP for PR collection across all states.", category: "Progress Report Workflows", type: "SOP", minutes: 7, updated: "2026-05-19", workflows: ["pr-followup"] },
  { id: "p2", title: "GA PR Workflow Guide", description: "Rivky Weissman outreach at 9 weeks; Shira + Rachel engage at 6 weeks.", category: "Progress Report Workflows", type: "Guide", minutes: 5, updated: "2026-05-14", workflows: ["pr-followup", "escalation"] },
  { id: "p3", title: "Multi-State PR Workflow Guide", description: "Rikki Wallach weekly outreach at 9 weeks; Julianne included.", category: "Progress Report Workflows", type: "Guide", minutes: 5, updated: "2026-05-14", workflows: ["pr-followup", "escalation"] },
  { id: "p4", title: "PR Escalation SOP", description: "Combined 9-week / 6-week escalation ladder.", category: "Progress Report Workflows", type: "Escalation Guide", minutes: 6, updated: "2026-05-12", workflows: ["pr-followup", "escalation"] },
  { id: "p5", title: "BCBA Follow-Up Workflow", description: "Cadence, tone, and documentation for BCBA outreach.", category: "Progress Report Workflows", type: "Workflow", minutes: 5, updated: "2026-05-10", workflows: ["pr-followup"] },
  { id: "p6", title: "State Director Escalation Workflow", description: "SD engagement criteria, hand-off, and exit conditions.", category: "Progress Report Workflows", type: "Workflow", minutes: 5, updated: "2026-05-08", workflows: ["escalation"] },
  { id: "p7", title: "PR Timeline Expectations", description: "What QA expects at each week of the PR window.", category: "Progress Report Workflows", type: "Reference", minutes: 3, updated: "2026-05-06" },
  { id: "p8", title: "Parent Signature Workflow", description: "SD re-entry path when parent signature is the blocker.", category: "Progress Report Workflows", type: "Workflow", minutes: 4, updated: "2026-05-04" },
  { id: "p9", title: "PR Readiness Checklist", description: "Pre-submission checklist specific to PRs.", category: "Progress Report Workflows", type: "Checklist", minutes: 3, updated: "2026-05-02" },
  { id: "p10", title: "Overdue PR Resolution Workflow", description: "Concrete next-action playbook for overdue PRs.", category: "Progress Report Workflows", type: "Workflow", minutes: 5, updated: "2026-04-30" },

  // ------- 4. Treatment Plan Review Workflows -------
  { id: "t1", title: "Treatment Plan Review SOP", description: "QA validation, scoring, and routing for treatment plans.", category: "Treatment Plan Review Workflows", type: "SOP", minutes: 8, updated: "2026-05-15", workflows: ["tp-review"] },
  { id: "t2", title: "Treatment Plan Readiness Checklist", description: "Required sections, signatures, and supporting documentation.", category: "Treatment Plan Review Workflows", type: "Checklist", minutes: 4, updated: "2026-05-13" },
  { id: "t3", title: "Missing Information Workflow", description: "TP-specific gaps and resolution paths.", category: "Treatment Plan Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-11", workflows: ["missing-info"] },
  { id: "t4", title: "Treatment Plan Escalation SOP", description: "When QA escalates a stalled treatment plan.", category: "Treatment Plan Review Workflows", type: "SOP", minutes: 5, updated: "2026-05-09", workflows: ["escalation"] },
  { id: "t5", title: "QA Validation Workflow", description: "What QA reviews line-by-line in treatment plans.", category: "Treatment Plan Review Workflows", type: "Workflow", minutes: 6, updated: "2026-05-07" },
  { id: "t6", title: "Treatment Plan Routing Workflow", description: "Hand-offs between QA, BCBA, and submission.", category: "Treatment Plan Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-05" },
  { id: "t7", title: "Submission Readiness Workflow", description: "What must be true before a treatment plan ships.", category: "Treatment Plan Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-03", workflows: ["submission"] },
  { id: "t8", title: "BCBA Coordination Workflow", description: "Coordinating BCBA edits, signatures, and clarifications.", category: "Treatment Plan Review Workflows", type: "Workflow", minutes: 5, updated: "2026-05-01" },
  { id: "t9", title: "Treatment Auth Workflow Guide", description: "How treatment plans connect to treatment authorizations.", category: "Treatment Plan Review Workflows", type: "Guide", minutes: 6, updated: "2026-04-29" },
  { id: "t10", title: "Treatment Plan QA Standards", description: "Quality standards QA enforces on every plan.", category: "Treatment Plan Review Workflows", type: "Reference", minutes: 5, updated: "2026-04-27" },

  // ------- 5. Escalations & Follow-Ups -------
  { id: "e1", title: "Escalation Standards SOP", description: "Criteria, tone, and documentation for escalations.", category: "Escalations & Follow-Ups", type: "SOP", minutes: 5, updated: "2026-05-18", workflows: ["escalation"] },
  { id: "e2", title: "Follow-Up Expectations SOP", description: "Follow-up cadence and response-time standards.", category: "Escalations & Follow-Ups", type: "SOP", minutes: 4, updated: "2026-05-16" },
  { id: "e3", title: "BCBA Escalation Workflow", description: "When and how to escalate a non-responsive BCBA.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 5, updated: "2026-05-14", workflows: ["escalation"] },
  { id: "e4", title: "State Director Escalation Guide", description: "What SD escalation looks like across states.", category: "Escalations & Follow-Ups", type: "Escalation Guide", minutes: 5, updated: "2026-05-12", workflows: ["escalation"] },
  { id: "e5", title: "Escalation Timeline Guide", description: "Standard escalation timeline by workflow type.", category: "Escalations & Follow-Ups", type: "Reference", minutes: 4, updated: "2026-05-10" },
  { id: "e6", title: "High-Risk Workflow SOP", description: "Operational SOP for ≤ 14-day high-risk workflows.", category: "Escalations & Follow-Ups", type: "SOP", minutes: 5, updated: "2026-05-08" },
  { id: "e7", title: "Expiration Risk Escalation SOP", description: "Escalation criteria tied to authorization expiration windows.", category: "Escalations & Follow-Ups", type: "SOP", minutes: 5, updated: "2026-05-06", workflows: ["expiring", "escalation"] },
  { id: "e8", title: "Overdue Workflow Resolution SOP", description: "Standardized resolution path for overdue items.", category: "Escalations & Follow-Ups", type: "SOP", minutes: 5, updated: "2026-05-04" },
  { id: "e9", title: "Escalation Documentation Standards", description: "What every escalation note must include.", category: "Escalations & Follow-Ups", type: "Reference", minutes: 3, updated: "2026-05-02" },
  { id: "e10", title: "Workflow Ownership Matrix", description: "Who owns what across PRs, TPs, and authorizations.", category: "Escalations & Follow-Ups", type: "Reference", minutes: 4, updated: "2026-04-30" },

  // ------- 6. Supervision Visibility & QA Coordination -------
  { id: "v1", title: "Supervision Visibility SOP", description: "QA's role in supervision visibility (operational only).", category: "Supervision Visibility & QA Coordination", type: "SOP", minutes: 5, updated: "2026-05-17", workflows: ["supervision"] },
  { id: "v2", title: "BCBA & RBT Coordination Guide", description: "Coordinating BCBA / RBT activity with QA workflows.", category: "Supervision Visibility & QA Coordination", type: "Guide", minutes: 6, updated: "2026-05-15" },
  { id: "v3", title: "Supervision Documentation Workflow", description: "What documentation QA looks for and where.", category: "Supervision Visibility & QA Coordination", type: "Workflow", minutes: 5, updated: "2026-05-13" },
  { id: "v4", title: "Supervision Escalation SOP", description: "Escalating supervision-related operational risk.", category: "Supervision Visibility & QA Coordination", type: "SOP", minutes: 5, updated: "2026-05-11", workflows: ["escalation"] },
  { id: "v5", title: "QA Supervision Standards", description: "Operational standards QA holds across supervision visibility.", category: "Supervision Visibility & QA Coordination", type: "Reference", minutes: 4, updated: "2026-05-09" },
  { id: "v6", title: "PR & Supervision Relationship Guide", description: "How supervision activity affects PR readiness.", category: "Supervision Visibility & QA Coordination", type: "Guide", minutes: 5, updated: "2026-05-07" },
  { id: "v7", title: "Supervision Risk Workflow", description: "Detecting and surfacing supervision risk operationally.", category: "Supervision Visibility & QA Coordination", type: "Workflow", minutes: 5, updated: "2026-05-05" },
  { id: "v8", title: "Authorization Impact Reference", description: "How supervision gaps impact authorizations.", category: "Supervision Visibility & QA Coordination", type: "Reference", minutes: 4, updated: "2026-05-03" },
  { id: "v9", title: "Missing Supervision Documentation Workflow", description: "Resolving missing supervision documentation operationally.", category: "Supervision Visibility & QA Coordination", type: "Workflow", minutes: 5, updated: "2026-05-01" },
  { id: "v10", title: "Supervision Readiness Checklist", description: "Pre-submission supervision readiness checklist.", category: "Supervision Visibility & QA Coordination", type: "Checklist", minutes: 3, updated: "2026-04-29" },

  // ------- 7. Communication Templates -------
  { id: "c1", title: "PR Follow-Up Email Templates", description: "Calm, specific outreach drafts for PRs.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-18", workflows: ["pr-followup"] },
  { id: "c2", title: "BCBA Reminder Templates", description: "Standard BCBA reminder messaging.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-16" },
  { id: "c3", title: "Escalation Communication Templates", description: "Tone-correct escalation drafts.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-14", workflows: ["escalation"] },
  { id: "c4", title: "Missing Documentation Templates", description: "Templated requests for missing documentation.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-12", workflows: ["missing-info"] },
  { id: "c5", title: "Parent Signature Reminder Templates", description: "Templated outreach for parent signature requests.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-10" },
  { id: "c6", title: "QA Internal Communication Templates", description: "Templates for QA-to-QA coordination.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-08" },
  { id: "c7", title: "State Director Escalation Templates", description: "Templated SD escalation drafts.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-06", workflows: ["escalation"] },
  { id: "c8", title: "Authorization Follow-Up Templates", description: "Templates for general authorization follow-ups.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-04" },
  { id: "c9", title: "Workflow Update Templates", description: "Standard updates pushed across active workflows.", category: "Communication Templates", type: "Communication Template", minutes: 3, updated: "2026-05-02" },
  { id: "c10", title: "Operational Communication Standards", description: "Standards for tone, length, and escalation language.", category: "Communication Templates", type: "Reference", minutes: 4, updated: "2026-04-30" },

  // ------- 8. QA Operational Standards -------
  { id: "o1", title: "QA Accuracy Standards", description: "Accuracy expectations across all QA review work.", category: "QA Operational Standards", type: "Reference", minutes: 4, updated: "2026-05-17" },
  { id: "o2", title: "Workflow Timeliness Standards", description: "Response and review timeliness expectations.", category: "QA Operational Standards", type: "Reference", minutes: 4, updated: "2026-05-15" },
  { id: "o3", title: "QA Response Expectations", description: "Expected response times by workflow.", category: "QA Operational Standards", type: "Reference", minutes: 3, updated: "2026-05-13" },
  { id: "o4", title: "QA Escalation Expectations", description: "Standards around when QA escalates vs follows up.", category: "QA Operational Standards", type: "Reference", minutes: 3, updated: "2026-05-11" },
  { id: "o5", title: "Documentation Quality Standards", description: "Quality standards for QA notes and audit trail.", category: "QA Operational Standards", type: "Reference", minutes: 4, updated: "2026-05-09" },
  { id: "o6", title: "Workflow Consistency Standards", description: "Operational consistency across the QA team.", category: "QA Operational Standards", type: "Reference", minutes: 3, updated: "2026-05-07" },
  { id: "o7", title: "QA Accountability Standards", description: "Ownership, hand-offs, and accountability framing.", category: "QA Operational Standards", type: "Reference", minutes: 3, updated: "2026-05-05" },
  { id: "o8", title: "Operational Excellence Standards", description: "What operational excellence looks like for QA.", category: "QA Operational Standards", type: "Reference", minutes: 4, updated: "2026-05-03" },
  { id: "o9", title: "QA Prioritization Guide", description: "How to triage across competing operational risk.", category: "QA Operational Standards", type: "Guide", minutes: 4, updated: "2026-05-01" },
  { id: "o10", title: "Calm Operations Principles", description: "Operating principles for calm-under-pressure QA work.", category: "QA Operational Standards", type: "Reference", minutes: 3, updated: "2026-04-29" },

  // ------- 9. Training & Reference Materials -------
  { id: "r1", title: "QA Quick Start Guide", description: "First-week orientation for QA team members.", category: "Training & Reference Materials", type: "Guide", minutes: 8, updated: "2026-05-18" },
  { id: "r2", title: "QA Workflow Cheat Sheets", description: "One-pagers for the most common QA workflows.", category: "Training & Reference Materials", type: "Reference", minutes: 3, updated: "2026-05-16" },
  { id: "r3", title: "PR Timeline Quick Reference", description: "9-week and 6-week ladder on a single page.", category: "Training & Reference Materials", type: "Reference", minutes: 2, updated: "2026-05-14" },
  { id: "r4", title: "Authorization Status Reference", description: "What each authorization status means operationally.", category: "Training & Reference Materials", type: "Reference", minutes: 3, updated: "2026-05-12" },
  { id: "r5", title: "Escalation Matrix Reference", description: "Owner mapping for every common QA escalation.", category: "Training & Reference Materials", type: "Reference", minutes: 4, updated: "2026-05-10" },
  { id: "r6", title: "Workflow Status Definitions", description: "Definitions for every workflow status QA uses.", category: "Training & Reference Materials", type: "Reference", minutes: 3, updated: "2026-05-08" },
  { id: "r7", title: "QA Terminology Guide", description: "Glossary of QA-specific operational terms.", category: "Training & Reference Materials", type: "Reference", minutes: 4, updated: "2026-05-06" },
  { id: "r8", title: "Operational FAQ", description: "Most common operational questions from new QA members.", category: "Training & Reference Materials", type: "Reference", minutes: 4, updated: "2026-05-04" },
  { id: "r9", title: "Blossom QA Organizational Structure", description: "Who's who across QA and partnered teams.", category: "Training & Reference Materials", type: "Reference", minutes: 3, updated: "2026-05-02" },
  { id: "r10", title: "QA Role Expectations Guide", description: "Role expectations across QA seniority levels.", category: "Training & Reference Materials", type: "Guide", minutes: 5, updated: "2026-04-30" },

  // ------- 10. System Guides & Platform Workflows -------
  { id: "g1", title: "Using QA Dashboard", description: "How to read and act on the QA dashboard.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 4, updated: "2026-05-17", href: "/qa-team" },
  { id: "g2", title: "Using QA Workspace", description: "Every panel, filter, and shortcut in the QA workspace.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 5, updated: "2026-05-15", href: "/qa-workspace" },
  { id: "g3", title: "Using QA Queue", description: "Triage, ownership, and prioritization inside the queue.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 4, updated: "2026-05-13", href: "/qa-queue" },
  { id: "g4", title: "Using Search & Filters", description: "Global search and operational filtering across QA.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 3, updated: "2026-05-11" },
  { id: "g5", title: "Workflow Timeline Guide", description: "How workflow timelines render and what each event means.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 4, updated: "2026-05-09" },
  { id: "g6", title: "Internal Notes Guide", description: "How to use internal notes for hand-offs and audit trail.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 3, updated: "2026-05-07" },
  { id: "g7", title: "Ask Blossom AI Guide", description: "What Ask Blossom AI can and cannot answer for QA.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 4, updated: "2026-05-05", href: "/ai/assistant" },
  { id: "g8", title: "CentralReach Workflow References", description: "How QA touches CentralReach operationally.", category: "System Guides & Platform Workflows", type: "Reference", minutes: 5, updated: "2026-05-03" },
  { id: "g9", title: "Monday.com Workflow References", description: "Operational references for legacy Monday workflows.", category: "System Guides & Platform Workflows", type: "Reference", minutes: 5, updated: "2026-05-01" },
  { id: "g10", title: "QA Operational System Navigation Guide", description: "Where everything lives across Blossom OS for QA.", category: "System Guides & Platform Workflows", type: "Platform Guide", minutes: 5, updated: "2026-04-29" },
];

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "qa-review", label: "QA Review", icon: ClipboardCheck },
  { key: "pr-followup", label: "PR Follow-Up", icon: Activity },
  { key: "tp-review", label: "Treatment Plan Review", icon: FileText },
  { key: "missing-info", label: "Missing Information", icon: AlertTriangle },
  { key: "escalation", label: "Escalation", icon: Flame },
  { key: "supervision", label: "Supervision Visibility", icon: ShieldCheck },
  { key: "expiring", label: "Expiring Items", icon: Clock },
  { key: "submission", label: "Submission Readiness", icon: Target },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "QA SOPs": { icon: FileText, blurb: "Core QA operational procedures." },
  "Authorization Review Workflows": { icon: ClipboardCheck, blurb: "Auth review, missing info, submission." },
  "Progress Report Workflows": { icon: Activity, blurb: "PR collection and escalation ladders." },
  "Treatment Plan Review Workflows": { icon: FileText, blurb: "QA validation and routing for TPs." },
  "Escalations & Follow-Ups": { icon: Flame, blurb: "Escalation standards and ownership." },
  "Supervision Visibility & QA Coordination": { icon: ShieldCheck, blurb: "Supervision visibility (operational)." },
  "Communication Templates": { icon: MessageSquare, blurb: "Outreach drafts in the Blossom tone." },
  "QA Operational Standards": { icon: Target, blurb: "Accuracy, timeliness, accountability." },
  "Training & Reference Materials": { icon: BookOpen, blurb: "Quick starts, cheat sheets, FAQs." },
  "System Guides & Platform Workflows": { icon: Wrench, blurb: "Blossom OS and platform workflows." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText,
  Workflow: WorkflowIcon,
  Guide: BookOpen,
  Template: MessageSquare,
  Checklist: ListChecks,
  Reference: BookOpen,
  "Platform Guide": Wrench,
  "Escalation Guide": Flame,
  "Communication Template": Mail,
};

const aiPrompts = [
  { q: "Show the PR escalation workflow.", a: "Georgia: Rivky Weissman begins weekly outreach at 9 weeks; Shira + Rachel engage at 6 weeks. Other states: Rikki Wallach runs weekly outreach at 9 weeks with Julianne included; SD escalation at 6 weeks if PR still missing." },
  { q: "Find treatment plan review SOPs.", a: "Open Treatment Plan Review SOP for the full review path. Treatment Plan Readiness Checklist covers required sections, signatures, and supporting docs before submission." },
  { q: "Explain the QA review process.", a: "Treatment auths sit In QA Review until the assigned reviewer confirms the plan is complete, signed where required, and payor-ready. The auth then moves to Awaiting Submission and ownership returns to the coordinator." },
  { q: "Show BCBA follow-up templates.", a: "BCBA Reminder Templates and PR Follow-Up Email Templates cover routine outreach. Escalation Communication Templates handle the 6-week escalation point." },
  { q: "Find expiring authorization workflows.", a: "Open the Expiring Authorization Workflow for the 90 / 60 / 30 / 14 day checkpoints. Expiration Risk Escalation SOP covers escalation criteria tied to expiration windows." },
  { q: "Show missing information procedures.", a: "Map each gap to its owner using the Missing Information Workflow, then apply Workflow Ownership Matrix for hand-off. Use Missing Documentation Templates for outreach." },
];

export default function OSQAResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["f1", "f2", "f5"]));
  const [recent] = useState<string[]>(["f2", "a3", "f3", "e1", "p2"]);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);

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
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" />
              Resource Library · QA / Compliance
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">QA Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Operational SOPs, workflows, templates, and references curated for QA. Search by workflow, not by file name.
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
              <Link to="/ai/assistant"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ask Blossom AI</Link>
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs, workflows, templates, or QA resources..."
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isFiltering && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activeCategory && (
                <Chip onClear={() => setActiveCategory(null)}>{activeCategory}</Chip>
              )}
              {activeWorkflow && (
                <Chip onClear={() => setActiveWorkflow(null)}>
                  {workflows.find((w) => w.key === activeWorkflow)?.label}
                </Chip>
              )}
              {query && (
                <Chip onClear={() => setQuery("")}>"{query}"</Chip>
              )}
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
            {/* Featured */}
            <Section title="Featured operational resources" subtitle="Highest-priority references for daily QA work.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            {/* Categories */}
            <Section title="Resource categories" subtitle="Curated for QA operations.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(Object.keys(categoryMeta) as Category[]).map((c) => {
                  const meta = categoryMeta[c];
                  const items = resources.filter((r) => r.category === c && !r.featured);
                  const all = resources.filter((r) => r.category === c);
                  const recentItem = all.sort((a, b) => b.updated.localeCompare(a.updated))[0];
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
                      {recentItem && items.length > 0 ? (
                        <p className="mt-3 text-[11px] text-muted-foreground/80">Updated {formatDate(recentItem.updated)}</p>
                      ) : items.length === 0 ? (
                        <p className="mt-3 text-[11px] text-muted-foreground/80">QA resources will appear here.</p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Recently used */}
            {recentResources.length > 0 && (
              <Section title="Recently used" subtitle="Pick up where you left off.">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
                  {recentResources.map((r) => (
                    <ResourceRow key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                  ))}
                </div>
              </Section>
            )}

            {/* Workflow-based */}
            <Section title="Find by workflow" subtitle="Resources grouped by the operational moment they support.">
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

            {/* Ask Blossom AI */}
            <Section title="Ask Blossom AI" subtitle="Find SOPs, workflows, templates, or escalation instructions.">
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
                <p className="mt-4 text-[11px] text-muted-foreground">HIPAA-aware · scoped to QA resources you have access to.</p>
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
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
        <span>·</span>
        <span>Updated {formatDate(r.updated)}</span>
        {r.owner && <span>· {r.owner}</span>}
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
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{r.title}</p>
          <Badge variant="secondary" className="rounded-full text-[10px]">{r.type}</Badge>
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
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Operational tip</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground">
          Search by workflow first ("PR follow-up", "missing info"), not by document name. The library is organized around how QA actually works.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/qa-team" label="QA Dashboard" icon={ShieldCheck} />
          <RailLink to="/qa-workspace" label="QA Workspace" icon={Wrench} />
          <RailLink to="/qa-queue" label="QA Queue" icon={ClipboardCheck} />
          <RailLink to="/escalations-followups" label="Escalations & Follow-Ups" icon={Flame} />
          <RailLink to="/missing-information" label="Missing Information" icon={AlertTriangle} />
          <RailLink to="/expiring-items" label="Expiring Items" icon={Clock} />
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

function RailLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof ShieldCheck }) {
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

// Suppress unused-var lint for TODAY (kept for potential "updated today" copy)
void TODAY;