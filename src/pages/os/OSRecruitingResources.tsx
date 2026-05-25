import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
  Users, Target, MessageSquare, Wrench, Share2, ChevronRight,
  BookOpen, Library, Star, Calendar, ExternalLink, UserPlus, Bot,
  GraduationCap, Layers, Compass, Building2, Download,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Recruiting Team Resource Library
// Operational playbook for Recruiting: SOPs, pipeline workflows, interviews,
// onboarding, orientation, staffing coordination, communication templates,
// systems, standards, escalations, state operations, downloads.
// Configuration-only — uses the existing Resource Library architecture.
// =============================================================================

type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Checklist" | "Journey" | "Reference";
type Category =
  | "Start Here"
  | "Recruiting SOPs"
  | "Candidate Pipeline Workflows"
  | "Interviews & Hiring"
  | "Onboarding & Orientation"
  | "Staffing Coordination"
  | "Communication Templates"
  | "Systems & Platforms"
  | "Recruiting Standards & Policies"
  | "Escalations & Follow-Ups"
  | "State & Clinic Operations"
  | "Downloads & Templates";

type WorkflowKey =
  | "recruiting" | "pipeline" | "interview" | "offer" | "onboarding"
  | "orientation" | "staffing" | "communication" | "escalation" | "systems";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  minutes: number;
  updated: string;
  href?: string;
  featured?: boolean;
  required?: boolean;
  workflows?: WorkflowKey[];
  system?: string;
  owner?: string;
}

const resources: Resource[] = [
  // 1 — Start Here
  { id: "sh1", title: "Welcome to Recruiting at Blossom", description: "Orientation to recruiting operations and team culture.", category: "Start Here", type: "Guide", minutes: 6, updated: "2026-05-18", featured: true, required: true, owner: "Recruiting" },
  { id: "sh2", title: "Recruiting Workflow Overview", description: "End-to-end view of how recruiting operates day to day.", category: "Start Here", type: "Guide", minutes: 8, updated: "2026-05-16", featured: true, workflows: ["recruiting"], owner: "Recruiting" },
  { id: "sh3", title: "Recruiting Team Expectations", description: "Operational expectations for every recruiter.", category: "Start Here", type: "Guide", minutes: 5, updated: "2026-05-14", required: true, owner: "Recruiting" },
  { id: "sh4", title: "Recruiting Role Responsibilities", description: "Detailed breakdown of each recruiting role.", category: "Start Here", type: "Reference", minutes: 6, updated: "2026-05-12", owner: "Recruiting" },
  { id: "sh5", title: "Understanding Blossom OS", description: "How Blossom OS supports recruiting operations.", category: "Start Here", type: "Guide", minutes: 6, updated: "2026-05-10", owner: "Operations" },
  { id: "sh6", title: "Understanding the ABA Staffing Model", description: "How BCBA / RBT staffing works across Blossom.", category: "Start Here", type: "Guide", minutes: 9, updated: "2026-05-08", workflows: ["staffing"], owner: "Operations" },
  { id: "sh7", title: "Meet the Recruiting & Staffing Teams", description: "Org chart and operational contacts.", category: "Start Here", type: "Reference", minutes: 4, updated: "2026-05-06", owner: "Recruiting" },
  { id: "sh8", title: "Recruiting Quick Start Guide", description: "Day-one operational quick start for new recruiters.", category: "Start Here", type: "Checklist", minutes: 4, updated: "2026-05-04", required: true, owner: "Recruiting" },

  // 2 — Recruiting SOPs
  { id: "sop1", title: "Recruiting Master SOP", description: "The master operational SOP for recruiting at Blossom.", category: "Recruiting SOPs", type: "SOP", minutes: 14, updated: "2026-05-19", featured: true, required: true, workflows: ["recruiting"], owner: "Recruiting" },
  { id: "sop2", title: "Candidate Review SOP", description: "How candidates are reviewed and qualified.", category: "Recruiting SOPs", type: "SOP", minutes: 9, updated: "2026-05-17", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "sop3", title: "Interview Workflow SOP", description: "End-to-end interview operations.", category: "Recruiting SOPs", type: "SOP", minutes: 10, updated: "2026-05-15", workflows: ["interview"], owner: "Recruiting" },
  { id: "sop4", title: "Offer Letter SOP", description: "Approval, generation, and delivery of offer letters.", category: "Recruiting SOPs", type: "SOP", minutes: 7, updated: "2026-05-13", workflows: ["offer"], owner: "Recruiting" },
  { id: "sop5", title: "Viventium Onboarding SOP", description: "Onboarding through Viventium operationally.", category: "Recruiting SOPs", type: "SOP", minutes: 11, updated: "2026-05-11", workflows: ["onboarding"], system: "Viventium", owner: "Recruiting" },
  { id: "sop6", title: "Background Check SOP", description: "Running and tracking background checks.", category: "Recruiting SOPs", type: "SOP", minutes: 6, updated: "2026-05-09", workflows: ["onboarding"], owner: "Recruiting" },
  { id: "sop7", title: "Orientation SOP", description: "Operational orientation execution.", category: "Recruiting SOPs", type: "SOP", minutes: 8, updated: "2026-05-07", workflows: ["orientation"], owner: "Recruiting" },
  { id: "sop8", title: "Staffing Coordination SOP", description: "How recruiting coordinates with staffing.", category: "Recruiting SOPs", type: "SOP", minutes: 8, updated: "2026-05-05", workflows: ["staffing"], owner: "Recruiting" },
  { id: "sop9", title: "Candidate Communication SOP", description: "Operational standards for candidate messaging.", category: "Recruiting SOPs", type: "SOP", minutes: 6, updated: "2026-05-03", workflows: ["communication"], owner: "Recruiting" },
  { id: "sop10", title: "Recruiting Escalation SOP", description: "When and how to escalate recruiting risks.", category: "Recruiting SOPs", type: "SOP", minutes: 6, updated: "2026-05-01", workflows: ["escalation"], owner: "Recruiting" },
  { id: "sop11", title: "Follow-Up Standards SOP", description: "Operational follow-up cadence and ownership.", category: "Recruiting SOPs", type: "SOP", minutes: 5, updated: "2026-04-29", workflows: ["communication"], owner: "Recruiting" },

  // 3 — Candidate Pipeline Workflows
  { id: "pp1", title: "Candidate Intake Workflow", description: "How new applicants enter the recruiting pipeline.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 6, updated: "2026-05-18", featured: true, workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp2", title: "Apploi Candidate Workflow", description: "Operationally working candidates inside Apploi.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 7, updated: "2026-05-16", workflows: ["pipeline"], system: "Apploi", owner: "Recruiting" },
  { id: "pp3", title: "Resume Review Workflow", description: "How resumes are screened and scored.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 5, updated: "2026-05-14", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp4", title: "RBT Certification Verification Workflow", description: "Verifying RBT credentials operationally.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 5, updated: "2026-05-12", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp5", title: "BACB Verification Process", description: "How BCBA / BACB credentials are verified.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 5, updated: "2026-05-10", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp6", title: "40-Hour Course Workflow", description: "Tracking 40-hour course completion candidates.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 5, updated: "2026-05-08", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp7", title: "Candidate Qualification Workflow", description: "How qualification status is determined.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 6, updated: "2026-05-06", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp8", title: "Candidate Movement Stages", description: "Definitions of every pipeline stage.", category: "Candidate Pipeline Workflows", type: "Reference", minutes: 4, updated: "2026-05-04", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp9", title: "Candidate Disqualification Workflow", description: "Operational disqualification standards.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 5, updated: "2026-05-02", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "pp10", title: "Stalled Candidate Recovery Workflow", description: "Reactivating stalled candidates in the pipeline.", category: "Candidate Pipeline Workflows", type: "Workflow", minutes: 6, updated: "2026-04-30", workflows: ["pipeline", "escalation"], owner: "Recruiting" },

  // 4 — Interviews & Hiring
  { id: "ih1", title: "Interview Scheduling Workflow", description: "Booking interviews efficiently across the team.", category: "Interviews & Hiring", type: "Workflow", minutes: 6, updated: "2026-05-19", workflows: ["interview"], owner: "Recruiting" },
  { id: "ih2", title: "Interview Standards Guide", description: "Operational standards for every interview.", category: "Interviews & Hiring", type: "Guide", minutes: 7, updated: "2026-05-17", featured: true, workflows: ["interview"], owner: "Recruiting" },
  { id: "ih3", title: "Interview Questions Guide", description: "Approved question banks by role.", category: "Interviews & Hiring", type: "Guide", minutes: 8, updated: "2026-05-15", workflows: ["interview"], owner: "Recruiting" },
  { id: "ih4", title: "Interview Evaluation Workflow", description: "Scoring and recording interview outcomes.", category: "Interviews & Hiring", type: "Workflow", minutes: 6, updated: "2026-05-13", workflows: ["interview"], owner: "Recruiting" },
  { id: "ih5", title: "Offer Approval Process", description: "Who approves offers and how.", category: "Interviews & Hiring", type: "Workflow", minutes: 5, updated: "2026-05-11", workflows: ["offer"], owner: "Recruiting" },
  { id: "ih6", title: "Offer Letter Workflow", description: "Generating and sending the offer letter.", category: "Interviews & Hiring", type: "Workflow", minutes: 5, updated: "2026-05-09", workflows: ["offer"], owner: "Recruiting" },
  { id: "ih7", title: "Hiring Decision Standards", description: "Operational rules for hiring decisions.", category: "Interviews & Hiring", type: "Guide", minutes: 6, updated: "2026-05-07", workflows: ["offer"], owner: "Recruiting" },
  { id: "ih8", title: "Post-Interview Follow-Up Process", description: "Cadence and standards after interviews.", category: "Interviews & Hiring", type: "Workflow", minutes: 5, updated: "2026-05-05", workflows: ["interview", "communication"], owner: "Recruiting" },
  { id: "ih9", title: "Candidate No-Show Process", description: "Handling interview no-shows operationally.", category: "Interviews & Hiring", type: "Workflow", minutes: 4, updated: "2026-05-03", workflows: ["interview", "escalation"], owner: "Recruiting" },
  { id: "ih10", title: "Hiring Escalation Workflow", description: "Escalating hiring blockers.", category: "Interviews & Hiring", type: "Workflow", minutes: 5, updated: "2026-05-01", workflows: ["escalation"], owner: "Recruiting" },

  // 5 — Onboarding & Orientation
  { id: "oo1", title: "Viventium Onboarding Workflow", description: "Operational onboarding journey in Viventium.", category: "Onboarding & Orientation", type: "Workflow", minutes: 9, updated: "2026-05-18", featured: true, workflows: ["onboarding"], system: "Viventium", owner: "Recruiting" },
  { id: "oo2", title: "Onboarding Checklist", description: "The full operational onboarding checklist.", category: "Onboarding & Orientation", type: "Checklist", minutes: 5, updated: "2026-05-16", workflows: ["onboarding"], owner: "Recruiting" },
  { id: "oo3", title: "Missing Documents Workflow", description: "Resolving missing onboarding documents.", category: "Onboarding & Orientation", type: "Workflow", minutes: 5, updated: "2026-05-14", workflows: ["onboarding"], owner: "Recruiting" },
  { id: "oo4", title: "Background Check Workflow", description: "Operationally tracking background check progress.", category: "Onboarding & Orientation", type: "Workflow", minutes: 5, updated: "2026-05-12", workflows: ["onboarding"], owner: "Recruiting" },
  { id: "oo5", title: "Stellar Check Process", description: "How Stellar Check is used during onboarding.", category: "Onboarding & Orientation", type: "Workflow", minutes: 5, updated: "2026-05-10", workflows: ["onboarding"], system: "Stellar Check", owner: "Recruiting" },
  { id: "oo6", title: "Orientation Scheduling Workflow", description: "Scheduling orientation slots.", category: "Onboarding & Orientation", type: "Workflow", minutes: 5, updated: "2026-05-08", workflows: ["orientation"], owner: "Recruiting" },
  { id: "oo7", title: "Orientation Attendance Process", description: "Confirming orientation attendance operationally.", category: "Onboarding & Orientation", type: "Workflow", minutes: 4, updated: "2026-05-06", workflows: ["orientation"], owner: "Recruiting" },
  { id: "oo8", title: "Staffing Readiness Checklist", description: "When a candidate is ready for staffing.", category: "Onboarding & Orientation", type: "Checklist", minutes: 4, updated: "2026-05-04", workflows: ["onboarding", "staffing"], owner: "Recruiting" },
  { id: "oo9", title: "Staffing Handoff Workflow", description: "Handoff from recruiting to staffing.", category: "Onboarding & Orientation", type: "Workflow", minutes: 5, updated: "2026-05-02", workflows: ["staffing"], owner: "Recruiting" },
  { id: "oo10", title: "Orientation Escalation Process", description: "Resolving orientation breakdowns.", category: "Onboarding & Orientation", type: "Workflow", minutes: 5, updated: "2026-04-30", workflows: ["orientation", "escalation"], owner: "Recruiting" },

  // 6 — Staffing Coordination
  { id: "sc1", title: "Open Staffing Needs Workflow", description: "Working open staffing needs operationally.", category: "Staffing Coordination", type: "Workflow", minutes: 7, updated: "2026-05-18", featured: true, workflows: ["staffing"], owner: "Recruiting" },
  { id: "sc2", title: "RBT Staffing Coordination", description: "Coordinating RBT placements with scheduling.", category: "Staffing Coordination", type: "Workflow", minutes: 6, updated: "2026-05-16", workflows: ["staffing"], owner: "Recruiting" },
  { id: "sc3", title: "BCBA Staffing Coordination", description: "Coordinating BCBA placements operationally.", category: "Staffing Coordination", type: "Workflow", minutes: 6, updated: "2026-05-14", workflows: ["staffing"], owner: "Recruiting" },
  { id: "sc4", title: "Georgia Clinic Staffing Process", description: "Staffing operations specific to GA clinics.", category: "Staffing Coordination", type: "Workflow", minutes: 6, updated: "2026-05-12", workflows: ["staffing"], owner: "Recruiting" },
  { id: "sc5", title: "State Staffing Operations", description: "Operational staffing across all states.", category: "Staffing Coordination", type: "Guide", minutes: 7, updated: "2026-05-10", workflows: ["staffing"], owner: "Operations" },
  { id: "sc6", title: "Staffing Escalation Workflow", description: "Escalating staffing delays.", category: "Staffing Coordination", type: "Workflow", minutes: 5, updated: "2026-05-08", workflows: ["staffing", "escalation"], owner: "Recruiting" },
  { id: "sc7", title: "Orientation-Ready Candidate Workflow", description: "Moving orientation-ready candidates into staffing.", category: "Staffing Coordination", type: "Workflow", minutes: 5, updated: "2026-05-06", workflows: ["orientation", "staffing"], owner: "Recruiting" },
  { id: "sc8", title: "Staffing Delay Resolution Workflow", description: "How recruiting helps unblock staffing delays.", category: "Staffing Coordination", type: "Workflow", minutes: 6, updated: "2026-05-04", workflows: ["staffing", "escalation"], owner: "Recruiting" },
  { id: "sc9", title: "Staffing Communication Standards", description: "Standards for recruiting/staffing communication.", category: "Staffing Coordination", type: "Guide", minutes: 5, updated: "2026-05-02", workflows: ["communication", "staffing"], owner: "Recruiting" },
  { id: "sc10", title: "Staffing Visibility Standards", description: "Operational visibility expectations across the team.", category: "Staffing Coordination", type: "Guide", minutes: 5, updated: "2026-04-30", workflows: ["staffing"], owner: "Recruiting" },

  // 7 — Communication Templates
  { id: "ct1", title: "Initial Candidate Outreach", description: "Template for first outreach to applicants.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-18", workflows: ["communication"], owner: "Recruiting" },
  { id: "ct2", title: "Interview Scheduling Message", description: "Template for scheduling interviews.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-16", workflows: ["interview", "communication"], owner: "Recruiting" },
  { id: "ct3", title: "Interview Reminder Template", description: "Pre-interview reminder template.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-14", workflows: ["interview", "communication"], owner: "Recruiting" },
  { id: "ct4", title: "Candidate Rejection Template", description: "Polite, professional candidate rejection.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-12", workflows: ["communication"], owner: "Recruiting" },
  { id: "ct5", title: "Offer Follow-Up Template", description: "Following up after an offer is sent.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-10", workflows: ["offer", "communication"], owner: "Recruiting" },
  { id: "ct6", title: "Onboarding Reminder Template", description: "Reminding new hires to complete onboarding steps.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-08", workflows: ["onboarding", "communication"], owner: "Recruiting" },
  { id: "ct7", title: "Missing Documents Reminder", description: "Requesting missing onboarding documents.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-06", workflows: ["onboarding", "communication"], owner: "Recruiting" },
  { id: "ct8", title: "Background Check Reminder", description: "Following up on background check completion.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-04", workflows: ["onboarding", "communication"], owner: "Recruiting" },
  { id: "ct9", title: "Orientation Reminder", description: "Reminding candidates of orientation logistics.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-05-02", workflows: ["orientation", "communication"], owner: "Recruiting" },
  { id: "ct10", title: "Staffing Coordination Update", description: "Internal staffing coordination updates.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-04-30", workflows: ["staffing", "communication"], owner: "Recruiting" },
  { id: "ct11", title: "Escalation Communication Template", description: "Operational escalation messages.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-04-28", workflows: ["escalation", "communication"], owner: "Recruiting" },
  { id: "ct12", title: "Candidate Follow-Up Template", description: "General candidate follow-up message.", category: "Communication Templates", type: "Template", minutes: 2, updated: "2026-04-26", workflows: ["communication"], owner: "Recruiting" },

  // 8 — Systems & Platforms
  { id: "sy1", title: "Using Apploi", description: "Operational guide to working in Apploi.", category: "Systems & Platforms", type: "Guide", minutes: 6, updated: "2026-05-18", workflows: ["systems"], system: "Apploi", owner: "Recruiting" },
  { id: "sy2", title: "Using Monday.com for Recruiting", description: "Legacy recruiting boards reference.", category: "Systems & Platforms", type: "Reference", minutes: 5, updated: "2026-05-16", workflows: ["systems"], system: "monday.com", owner: "Recruiting" },
  { id: "sy3", title: "Using Viventium", description: "Operational onboarding inside Viventium.", category: "Systems & Platforms", type: "Guide", minutes: 7, updated: "2026-05-14", workflows: ["systems", "onboarding"], system: "Viventium", owner: "Recruiting" },
  { id: "sy4", title: "Using Stellar Check", description: "Background check operations in Stellar Check.", category: "Systems & Platforms", type: "Guide", minutes: 5, updated: "2026-05-12", workflows: ["systems", "onboarding"], system: "Stellar Check", owner: "Recruiting" },
  { id: "sy5", title: "Using Blossom OS Recruiting Tools", description: "Recruiting tools inside Blossom OS.", category: "Systems & Platforms", type: "Guide", minutes: 6, updated: "2026-05-10", href: "/recruiting/workspace", system: "Blossom OS", owner: "Operations" },
  { id: "sy6", title: "Using Orientation Boards", description: "Operating the orientation board.", category: "Systems & Platforms", type: "Guide", minutes: 5, updated: "2026-05-08", href: "/recruiting/orientation", system: "Blossom OS", owner: "Operations" },
  { id: "sy7", title: "Using Staffing Boards", description: "Operating the staffing-needs board.", category: "Systems & Platforms", type: "Guide", minutes: 5, updated: "2026-05-06", href: "/recruiting/staffing-needs", system: "Blossom OS", owner: "Operations" },
  { id: "sy8", title: "Recruiter Dashboard Guide", description: "Reading the recruiting team dashboard.", category: "Systems & Platforms", type: "Guide", minutes: 4, updated: "2026-05-04", href: "/recruiting-team", system: "Blossom OS", owner: "Operations" },
  { id: "sy9", title: "Recruiting Workspace Guide", description: "Working inside the recruiting workspace.", category: "Systems & Platforms", type: "Guide", minutes: 5, updated: "2026-05-02", href: "/recruiting/workspace", system: "Blossom OS", owner: "Operations" },
  { id: "sy10", title: "Ask Blossom AI Guide", description: "Using AI for recruiting operational questions.", category: "Systems & Platforms", type: "Guide", minutes: 4, updated: "2026-04-30", href: "/ai/assistant", system: "Blossom OS", owner: "Operations" },

  // 9 — Recruiting Standards & Policies
  { id: "st1", title: "Recruiting Communication Standards", description: "Tone, cadence, and channel standards.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 5, updated: "2026-05-17", workflows: ["communication"], owner: "Recruiting" },
  { id: "st2", title: "Candidate Experience Standards", description: "Delivering a premium candidate experience.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 5, updated: "2026-05-15", owner: "Recruiting" },
  { id: "st3", title: "Follow-Up Standards", description: "Operational follow-up SLAs and ownership.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 4, updated: "2026-05-13", workflows: ["communication"], owner: "Recruiting" },
  { id: "st4", title: "Operational Accountability Standards", description: "How accountability flows through recruiting.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 5, updated: "2026-05-11", owner: "Recruiting" },
  { id: "st5", title: "Staffing Escalation Standards", description: "Standards for escalating staffing risks.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 5, updated: "2026-05-09", workflows: ["staffing", "escalation"], owner: "Recruiting" },
  { id: "st6", title: "Orientation Readiness Standards", description: "What 'orientation-ready' actually means.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 4, updated: "2026-05-07", workflows: ["orientation"], owner: "Recruiting" },
  { id: "st7", title: "Hiring Timeline Standards", description: "Expected timelines from apply to start.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 5, updated: "2026-05-05", workflows: ["recruiting"], owner: "Recruiting" },
  { id: "st8", title: "Internal Communication Expectations", description: "Standards for internal recruiting comms.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 4, updated: "2026-05-03", workflows: ["communication"], owner: "Recruiting" },
  { id: "st9", title: "State-Specific Recruiting Standards", description: "Operational nuances by state.", category: "Recruiting Standards & Policies", type: "Reference", minutes: 6, updated: "2026-05-01", owner: "Recruiting" },
  { id: "st10", title: "Confidentiality & Data Handling Standards", description: "HIPAA-aware handling of candidate data.", category: "Recruiting Standards & Policies", type: "Guide", minutes: 5, updated: "2026-04-29", owner: "Operations" },

  // 10 — Escalations & Follow-Ups
  { id: "es1", title: "Escalation Workflow Guide", description: "End-to-end escalation guide.", category: "Escalations & Follow-Ups", type: "Guide", minutes: 6, updated: "2026-05-18", featured: true, workflows: ["escalation"], owner: "Recruiting" },
  { id: "es2", title: "High-Risk Staffing Delay Process", description: "Operational response to high-risk staffing delays.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 6, updated: "2026-05-16", workflows: ["staffing", "escalation"], owner: "Recruiting" },
  { id: "es3", title: "Candidate Stall Recovery Workflow", description: "Re-engaging stalled candidates.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 5, updated: "2026-05-14", workflows: ["pipeline", "escalation"], owner: "Recruiting" },
  { id: "es4", title: "Leadership Escalation Workflow", description: "When and how to involve leadership.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 5, updated: "2026-05-12", workflows: ["escalation"], owner: "Recruiting" },
  { id: "es5", title: "Orientation Delay Escalation", description: "Escalating orientation breakdowns.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 5, updated: "2026-05-10", workflows: ["orientation", "escalation"], owner: "Recruiting" },
  { id: "es6", title: "Recruiter Follow-Up Standards", description: "Cadence, ownership, and documentation.", category: "Escalations & Follow-Ups", type: "Guide", minutes: 5, updated: "2026-05-08", workflows: ["communication"], owner: "Recruiting" },
  { id: "es7", title: "Staffing Delay Escalation", description: "Operational escalation for staffing delays.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 5, updated: "2026-05-06", workflows: ["staffing", "escalation"], owner: "Recruiting" },
  { id: "es8", title: "Communication Breakdown Process", description: "Repairing communication breakdowns.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 5, updated: "2026-05-04", workflows: ["communication", "escalation"], owner: "Recruiting" },
  { id: "es9", title: "Operational Bottleneck Resolution Workflow", description: "Resolving operational bottlenecks.", category: "Escalations & Follow-Ups", type: "Workflow", minutes: 6, updated: "2026-05-02", workflows: ["escalation"], owner: "Recruiting" },

  // 11 — State & Clinic Operations
  { id: "sx1", title: "Georgia Clinic Operations Overview", description: "Operational overview for Georgia clinics.", category: "State & Clinic Operations", type: "Reference", minutes: 6, updated: "2026-05-17", owner: "Operations" },
  { id: "sx2", title: "North Carolina Operations Overview", description: "Operational overview for NC.", category: "State & Clinic Operations", type: "Reference", minutes: 6, updated: "2026-05-15", owner: "Operations" },
  { id: "sx3", title: "Tennessee Operations Overview", description: "Operational overview for TN.", category: "State & Clinic Operations", type: "Reference", minutes: 6, updated: "2026-05-13", owner: "Operations" },
  { id: "sx4", title: "Virginia Operations Overview", description: "Operational overview for VA.", category: "State & Clinic Operations", type: "Reference", minutes: 6, updated: "2026-05-11", owner: "Operations" },
  { id: "sx5", title: "Maryland Operations Overview", description: "Operational overview for MD.", category: "State & Clinic Operations", type: "Reference", minutes: 6, updated: "2026-05-09", owner: "Operations" },
  { id: "sx6", title: "Clinic vs In-Home Staffing Differences", description: "How clinic and home staffing differ.", category: "State & Clinic Operations", type: "Guide", minutes: 5, updated: "2026-05-07", workflows: ["staffing"], owner: "Operations" },
  { id: "sx7", title: "State Leadership Structure", description: "Who leads recruiting and ops in each state.", category: "State & Clinic Operations", type: "Reference", minutes: 4, updated: "2026-05-05", owner: "Operations" },
  { id: "sx8", title: "State Recruiting Expectations", description: "Recruiting expectations by state.", category: "State & Clinic Operations", type: "Guide", minutes: 5, updated: "2026-05-03", owner: "Recruiting" },
  { id: "sx9", title: "Regional Staffing Coordination", description: "Cross-state staffing coordination.", category: "State & Clinic Operations", type: "Guide", minutes: 5, updated: "2026-05-01", workflows: ["staffing"], owner: "Operations" },

  // 12 — Downloads & Templates
  { id: "dl1", title: "Recruiting Checklist", description: "Operational recruiter checklist.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-05-18", workflows: ["recruiting"], owner: "Recruiting" },
  { id: "dl2", title: "Candidate Review Checklist", description: "Quick checklist for reviewing candidates.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-05-16", workflows: ["pipeline"], owner: "Recruiting" },
  { id: "dl3", title: "Interview Checklist", description: "Pre/post interview operational checklist.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-05-14", workflows: ["interview"], owner: "Recruiting" },
  { id: "dl4", title: "Offer Workflow Checklist", description: "Step-by-step offer checklist.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-05-12", workflows: ["offer"], owner: "Recruiting" },
  { id: "dl5", title: "Onboarding Checklist", description: "Operational onboarding checklist.", category: "Downloads & Templates", type: "Checklist", minutes: 4, updated: "2026-05-10", workflows: ["onboarding"], owner: "Recruiting" },
  { id: "dl6", title: "Orientation Checklist", description: "Operational orientation checklist.", category: "Downloads & Templates", type: "Checklist", minutes: 4, updated: "2026-05-08", workflows: ["orientation"], owner: "Recruiting" },
  { id: "dl7", title: "Staffing Escalation Checklist", description: "Quick checklist for staffing escalation.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-05-06", workflows: ["staffing", "escalation"], owner: "Recruiting" },
  { id: "dl8", title: "Recruiter Daily Workflow Checklist", description: "Daily operational routine.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-05-04", workflows: ["recruiting"], owner: "Recruiting" },
  { id: "dl9", title: "Recruiting Audit Checklist", description: "Quality audit checklist for recruiting ops.", category: "Downloads & Templates", type: "Checklist", minutes: 4, updated: "2026-05-02", owner: "Recruiting" },
  { id: "dl10", title: "Operational Staffing Checklist", description: "Operational checklist for staffing coordination.", category: "Downloads & Templates", type: "Checklist", minutes: 3, updated: "2026-04-30", workflows: ["staffing"], owner: "Recruiting" },
];

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "recruiting", label: "Recruiting", icon: UserPlus },
  { key: "pipeline", label: "Pipeline", icon: Users },
  { key: "interview", label: "Interview", icon: ClipboardCheck },
  { key: "offer", label: "Offer", icon: Target },
  { key: "onboarding", label: "Onboarding", icon: ShieldCheck },
  { key: "orientation", label: "Orientation", icon: GraduationCap },
  { key: "staffing", label: "Staffing", icon: Layers },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "escalation", label: "Escalation", icon: AlertTriangle },
  { key: "systems", label: "Systems", icon: Wrench },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "Start Here": { icon: Compass, blurb: "Recruiter onboarding operational hub." },
  "Recruiting SOPs": { icon: FileText, blurb: "Master operational SOPs for recruiting." },
  "Candidate Pipeline Workflows": { icon: Users, blurb: "End-to-end candidate movement." },
  "Interviews & Hiring": { icon: ClipboardCheck, blurb: "Interview, evaluation, and offer workflows." },
  "Onboarding & Orientation": { icon: ShieldCheck, blurb: "From accepted offer to orientation-ready." },
  "Staffing Coordination": { icon: Layers, blurb: "Recruiting ↔ staffing operational handoff." },
  "Communication Templates": { icon: MessageSquare, blurb: "Approved candidate and internal messaging." },
  "Systems & Platforms": { icon: Wrench, blurb: "Apploi, Viventium, Stellar Check, Blossom OS." },
  "Recruiting Standards & Policies": { icon: ShieldCheck, blurb: "Operational standards every recruiter follows." },
  "Escalations & Follow-Ups": { icon: AlertTriangle, blurb: "When recruiting needs intervention." },
  "State & Clinic Operations": { icon: Building2, blurb: "How recruiting works across states." },
  "Downloads & Templates": { icon: Download, blurb: "Printable checklists and templates." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText, Workflow: WorkflowIcon, Guide: BookOpen, Template: MessageSquare,
  Checklist: ListChecks, Journey: GraduationCap, Reference: Layers,
};

type QuickFilter = "most-used" | "recent" | "essentials" | "onboarding-flow" | "new-recruiter";
const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "most-used", label: "Most Used" },
  { key: "recent", label: "Recently Updated" },
  { key: "essentials", label: "Recruiting Essentials" },
  { key: "onboarding-flow", label: "Onboarding Flow" },
  { key: "new-recruiter", label: "New Recruiters" },
];

const MOST_USED_IDS = new Set(["sop1", "sop3", "oo1", "sc1", "ih2", "es1"]);
const ESSENTIALS_IDS = new Set(["sop1", "sop2", "sop3", "sop5", "sop8", "ih2"]);
const NEW_RECRUITER_IDS = new Set(["sh1", "sh2", "sh3", "sh8", "sop1", "sy5"]);
const ONBOARDING_FLOW_IDS = new Set(["sop5", "oo1", "oo2", "oo3", "oo4", "oo5", "oo6", "oo8", "oo9"]);

const aiPrompts = [
  { q: "How does Viventium onboarding work?", a: "Start with the Viventium Onboarding SOP, then layer the Onboarding Checklist and Missing Documents Workflow. The Background Check and Stellar Check workflows run in parallel." },
  { q: "What's the escalation process for staffing delays?", a: "Use the High-Risk Staffing Delay Process. Tier 1: recruiter outreach. Tier 2: notify staffing coordinator. Tier 3: State Director engagement. Document every step in the candidate's record." },
  { q: "Show me interview standards.", a: "Anchor on the Interview Standards Guide and Interview Questions Guide. Outcomes are recorded via the Interview Evaluation Workflow. Use the Post-Interview Follow-Up Process for cadence." },
  { q: "How do orientation-ready candidates move to staffing?", a: "Use the Staffing Readiness Checklist to confirm orientation-ready status, then execute the Staffing Handoff Workflow. Communicate with the Staffing Coordination Update template." },
  { q: "Where are the recruiting SOPs?", a: "Recruiting SOPs section. Start with the Recruiting Master SOP, then the role-specific SOPs (Candidate Review, Interview, Offer, Viventium Onboarding, Orientation, Staffing Coordination)." },
];

export default function OSRecruitingResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [activeQuick, setActiveQuick] = useState<QuickFilter | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["sop1", "oo1", "sc1"]));
  const [recent] = useState<string[]>(["sop1", "oo1", "ih2", "sc1", "es1"]);
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
      if (activeQuick === "new-recruiter" && !NEW_RECRUITER_IDS.has(r.id)) return false;
      if (activeQuick === "onboarding-flow" && !ONBOARDING_FLOW_IDS.has(r.id)) return false;
      if (activeQuick === "recent") {
        const days = (Date.parse("2026-05-22") - Date.parse(r.updated)) / 86400000;
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
              <Library className="h-3 w-3" /> Resource Library · Recruiting
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recruiting Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              SOPs, pipeline workflows, interview standards, onboarding, orientation, staffing coordination, and communication templates — the operational playbook for the Recruiting Team.
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

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs, interviews, onboarding, orientation, staffing, escalations, Apploi, Viventium…"
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
            <Section title="Featured operational resources" subtitle="The most-used recruiting playbook items.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Curated for recruiting operations.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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

            <Section title="Ask Blossom AI" subtitle="Find SOPs, workflows, templates, or escalation guidance.">
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
                <p className="mt-4 text-[11px] text-muted-foreground">HIPAA-aware · scoped to recruiting resources you have access to.</p>
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
        <p className="text-sm text-muted-foreground">No recruiting resources matched your search.</p>
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
        <span>{r.category}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
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
          <span className="text-[11px] text-muted-foreground">{r.category}</span>
          {r.owner && <span className="text-[11px] text-muted-foreground/80">· {r.owner}</span>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.minutes} min</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(r.updated)}</span>
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
          Search by workflow ("onboarding", "orientation", "staffing", "escalation"), not document name. The library is organized around how recruiting actually works.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/recruiting/workspace" label="Recruiting workspace" icon={UserPlus} />
          <RailLink to="/recruiting/pipeline" label="Candidate pipeline" icon={Users} />
          <RailLink to="/recruiting/orientation" label="Orientation board" icon={GraduationCap} />
          <RailLink to="/recruiting/staffing-needs" label="Staffing needs" icon={Layers} />
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

function RailLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof UserPlus }) {
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