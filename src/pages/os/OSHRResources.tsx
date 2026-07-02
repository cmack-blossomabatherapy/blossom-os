import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Sparkles, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
  ListChecks, ShieldCheck, ClipboardCheck, AlertTriangle, Users, MessageSquare,
  Wrench, Share2, ChevronRight, BookOpen, Library, Star, Calendar, ExternalLink,
  Bot, GraduationCap, Layers, Compass, Heart, BadgeCheck, BellRing, Folder,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// HR Team Resource Library — configuration only
// Operational playbook for HR: onboarding SOPs, orientation workflows, training
// management, employee support, certifications, evaluations, systems, and
// communication templates. Uses the existing Resource Library architecture.
// Resource content is skeletons — to be authored later.
// =============================================================================

type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Checklist" | "Tango" | "Reference" | "Form" | "Video";
type Category =
  | "Start Here"
  | "Onboarding & New Hire SOPs"
  | "Orientation Workflows"
  | "Training Academy Management"
  | "Employee Support"
  | "Certifications & Compliance"
  | "Evaluations & Growth"
  | "Systems & Access"
  | "Communication & Templates";

type WorkflowKey =
  | "onboarding" | "orientation" | "training" | "support" | "certifications"
  | "evaluations" | "readiness" | "systems" | "communication" | "escalation";

type Visibility = "HR Team" | "Leadership" | "Recruiting" | "QA" | "Scheduling" | "RBTs" | "BCBAs" | "Office Staff";

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

// Skeleton resources — titles only, content TBD.
const resources: Resource[] = [
  // Start Here
  { id: "sh1", title: "Welcome to HR at Blossom", description: "Operational overview for the HR Team.", category: "Start Here", type: "Guide", updated: "2026-05-20", featured: true, required: true, owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sh2", title: "HR Workflow Overview", description: "How HR operates day to day across Blossom.", category: "Start Here", type: "Guide", updated: "2026-05-18", featured: true, owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },
  { id: "sh3", title: "HR Role Responsibilities", description: "Breakdown of HR operational responsibilities.", category: "Start Here", type: "Reference", updated: "2026-05-16", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sh4", title: "HR Quick Start Guide", description: "Day-one operational quick start for new HR staff.", category: "Start Here", type: "Checklist", updated: "2026-05-14", required: true, owner: "HR", visibility: ["HR Team"], placeholder: true },

  // A — Onboarding & New Hire SOPs
  { id: "on1", title: "New Hire Workflow SOP", description: "End-to-end new hire operational workflow.", category: "Onboarding & New Hire SOPs", type: "SOP", updated: "2026-05-19", featured: true, required: true, workflows: ["onboarding"], owner: "HR", visibility: ["HR Team", "Recruiting"], placeholder: true },
  { id: "on2", title: "Offer Acceptance Process", description: "Standardized acceptance and handoff to HR.", category: "Onboarding & New Hire SOPs", type: "Workflow", updated: "2026-05-17", workflows: ["onboarding"], owner: "HR", visibility: ["HR Team", "Recruiting"], placeholder: true },
  { id: "on3", title: "Viventium Onboarding SOP", description: "Operational onboarding through Viventium.", category: "Onboarding & New Hire SOPs", type: "SOP", updated: "2026-05-15", featured: true, workflows: ["onboarding", "systems"], system: "Viventium", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "on4", title: "Background Check Workflow", description: "Running and tracking background checks.", category: "Onboarding & New Hire SOPs", type: "Workflow", updated: "2026-05-13", workflows: ["onboarding", "readiness"], owner: "HR", visibility: ["HR Team", "Recruiting"], placeholder: true },
  { id: "on5", title: "Orientation Scheduling SOP", description: "Scheduling orientation operationally.", category: "Onboarding & New Hire SOPs", type: "SOP", updated: "2026-05-11", workflows: ["orientation"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "on6", title: "Readiness Workflow SOP", description: "Moving new hires from onboarding to staffing-ready.", category: "Onboarding & New Hire SOPs", type: "SOP", updated: "2026-05-09", workflows: ["readiness"], owner: "HR", visibility: ["HR Team", "Scheduling"], placeholder: true },
  { id: "on7", title: "Staffing Readiness Checklist", description: "What readiness means operationally.", category: "Onboarding & New Hire SOPs", type: "Checklist", updated: "2026-05-07", workflows: ["readiness"], owner: "HR", visibility: ["HR Team", "Scheduling"], placeholder: true },
  { id: "on8", title: "New Hire Communication Templates", description: "Approved messaging for new hire touchpoints.", category: "Onboarding & New Hire SOPs", type: "Template", updated: "2026-05-05", workflows: ["onboarding", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "on9", title: "Employee Setup Checklist", description: "Operational setup tasks for every new hire.", category: "Onboarding & New Hire SOPs", type: "Checklist", updated: "2026-05-03", workflows: ["onboarding", "systems"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "on10", title: "HR Onboarding Timeline", description: "Standard timeline from accepted offer to active.", category: "Onboarding & New Hire SOPs", type: "Reference", updated: "2026-05-01", workflows: ["onboarding"], owner: "HR", visibility: ["HR Team"], placeholder: true },

  // B — Orientation Workflows
  { id: "or1", title: "Orientation Coordination SOP", description: "Operational coordination for orientation.", category: "Orientation Workflows", type: "SOP", updated: "2026-05-18", featured: true, workflows: ["orientation"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "or2", title: "Orientation Attendance Workflow", description: "Tracking attendance operationally.", category: "Orientation Workflows", type: "Workflow", updated: "2026-05-16", workflows: ["orientation"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "or3", title: "Orientation Follow-Up SOP", description: "Standard follow-ups after orientation.", category: "Orientation Workflows", type: "SOP", updated: "2026-05-14", workflows: ["orientation", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "or4", title: "Orientation Readiness Checklist", description: "What 'orientation-ready' means operationally.", category: "Orientation Workflows", type: "Checklist", updated: "2026-05-12", workflows: ["orientation", "readiness"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "or5", title: "Orientation Communication Standards", description: "Standards for orientation comms.", category: "Orientation Workflows", type: "Guide", updated: "2026-05-10", workflows: ["orientation", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "or6", title: "Missed Orientation Workflow", description: "Operational response when orientation is missed.", category: "Orientation Workflows", type: "Workflow", updated: "2026-05-08", workflows: ["orientation", "escalation"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "or7", title: "Orientation Trainer Guide", description: "Operational guide for orientation facilitators.", category: "Orientation Workflows", type: "Guide", updated: "2026-05-06", workflows: ["orientation"], owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },

  // C — Training Academy Management
  { id: "tr1", title: "Training Academy Overview", description: "How the Academy is organized operationally.", category: "Training Academy Management", type: "Guide", updated: "2026-05-19", featured: true, workflows: ["training"], owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },
  { id: "tr2", title: "Journey Creation SOP", description: "Creating training journeys operationally.", category: "Training Academy Management", type: "SOP", updated: "2026-05-17", workflows: ["training"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr3", title: "Module Creation SOP", description: "Building training modules.", category: "Training Academy Management", type: "SOP", updated: "2026-05-15", workflows: ["training"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr4", title: "Quiz Management SOP", description: "Building and grading quizzes operationally.", category: "Training Academy Management", type: "SOP", updated: "2026-05-13", workflows: ["training"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr5", title: "Certification Assignment Workflow", description: "Assigning certifications to journeys.", category: "Training Academy Management", type: "Workflow", updated: "2026-05-11", workflows: ["training", "certifications"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr6", title: "Training Visibility Permissions", description: "Who sees which trainings, and how.", category: "Training Academy Management", type: "Reference", updated: "2026-05-09", workflows: ["training"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr7", title: "Publishing Workflow SOP", description: "Publishing trainings operationally.", category: "Training Academy Management", type: "SOP", updated: "2026-05-07", workflows: ["training"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr8", title: "Archive Workflow SOP", description: "Archiving outdated training content.", category: "Training Academy Management", type: "SOP", updated: "2026-05-05", workflows: ["training"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "tr9", title: "Overdue Training Workflow", description: "Operational response to overdue trainings.", category: "Training Academy Management", type: "Workflow", updated: "2026-05-03", workflows: ["training", "escalation"], owner: "HR", visibility: ["HR Team"], placeholder: true },

  // D — Employee Support
  { id: "es1", title: "Employee Support Standards", description: "How HR supports employees operationally.", category: "Employee Support", type: "Guide", updated: "2026-05-18", featured: true, workflows: ["support"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "es2", title: "HR Request Workflow", description: "Receiving and resolving HR requests.", category: "Employee Support", type: "Workflow", updated: "2026-05-16", workflows: ["support"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "es3", title: "Escalation Workflow SOP", description: "Operational escalation paths.", category: "Employee Support", type: "SOP", updated: "2026-05-14", workflows: ["support", "escalation"], owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },
  { id: "es4", title: "Employee Communication Standards", description: "Tone, cadence, ownership.", category: "Employee Support", type: "Guide", updated: "2026-05-12", workflows: ["support", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "es5", title: "Follow-Up Standards", description: "Operational follow-up SLAs.", category: "Employee Support", type: "Guide", updated: "2026-05-10", workflows: ["support", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "es6", title: "Employee Readiness Support SOP", description: "Supporting employees through readiness.", category: "Employee Support", type: "SOP", updated: "2026-05-08", workflows: ["support", "readiness"], owner: "HR", visibility: ["HR Team", "Scheduling"], placeholder: true },
  { id: "es7", title: "Support Documentation Standards", description: "How HR documents support cases.", category: "Employee Support", type: "Guide", updated: "2026-05-06", workflows: ["support"], owner: "HR", visibility: ["HR Team"], placeholder: true },

  // E — Certifications & Compliance
  { id: "ce1", title: "RBT Certification Tracking SOP", description: "Operational RBT cert tracking.", category: "Certifications & Compliance", type: "SOP", updated: "2026-05-19", featured: true, workflows: ["certifications"], owner: "HR", visibility: ["HR Team", "QA"], placeholder: true },
  { id: "ce2", title: "CPR Tracking Workflow", description: "Tracking CPR / BLS operationally.", category: "Certifications & Compliance", type: "Workflow", updated: "2026-05-17", workflows: ["certifications"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ce3", title: "Certification Renewal Workflow", description: "Operational renewal cadence.", category: "Certifications & Compliance", type: "Workflow", updated: "2026-05-15", workflows: ["certifications"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ce4", title: "Compliance Checklist", description: "Operational compliance touchpoints.", category: "Certifications & Compliance", type: "Checklist", updated: "2026-05-13", workflows: ["certifications", "readiness"], owner: "HR", visibility: ["HR Team", "QA"], placeholder: true },
  { id: "ce5", title: "Document Request SOP", description: "Standard operational document requests.", category: "Certifications & Compliance", type: "SOP", updated: "2026-05-11", workflows: ["certifications", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ce6", title: "Expiration Tracking SOP", description: "Tracking certification expirations.", category: "Certifications & Compliance", type: "SOP", updated: "2026-05-09", workflows: ["certifications"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ce7", title: "Readiness Compliance Workflow", description: "Compliance side of staffing readiness.", category: "Certifications & Compliance", type: "Workflow", updated: "2026-05-07", workflows: ["readiness", "certifications"], owner: "HR", visibility: ["HR Team", "Scheduling"], placeholder: true },

  // F — Evaluations & Growth
  { id: "ev1", title: "Employee Evaluations SOP", description: "Operational evaluation cadence.", category: "Evaluations & Growth", type: "SOP", updated: "2026-05-18", featured: true, workflows: ["evaluations"], owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },
  { id: "ev2", title: "Self Evaluation Workflow", description: "Workflow for self evaluations.", category: "Evaluations & Growth", type: "Workflow", updated: "2026-05-16", workflows: ["evaluations"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ev3", title: "Leadership Evaluation Workflow", description: "Evaluation workflow for leadership.", category: "Evaluations & Growth", type: "Workflow", updated: "2026-05-14", workflows: ["evaluations"], owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },
  { id: "ev4", title: "Coaching Standards", description: "Operational coaching standards.", category: "Evaluations & Growth", type: "Guide", updated: "2026-05-12", workflows: ["evaluations"], owner: "HR", visibility: ["HR Team", "BCBAs"], placeholder: true },
  { id: "ev5", title: "Growth Planning SOP", description: "Building growth plans operationally.", category: "Evaluations & Growth", type: "SOP", updated: "2026-05-10", workflows: ["evaluations"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ev6", title: "Evaluation Timeline Guide", description: "When evaluations happen across roles.", category: "Evaluations & Growth", type: "Reference", updated: "2026-05-08", workflows: ["evaluations"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "ev7", title: "Follow-Up Standards (Evaluations)", description: "Standards for evaluation follow-ups.", category: "Evaluations & Growth", type: "Guide", updated: "2026-05-06", workflows: ["evaluations", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },

  // G — Systems & Access
  { id: "sy1", title: "Monday.com HR Workflow Guide", description: "Operational use of Monday.com for HR.", category: "Systems & Access", type: "Guide", updated: "2026-05-19", workflows: ["systems"], system: "Monday.com", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy2", title: "Viventium Guide", description: "Operational reference for Viventium.", category: "Systems & Access", type: "Guide", updated: "2026-05-17", featured: true, workflows: ["systems", "onboarding"], system: "Viventium", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy3", title: "CentralReach Employee Setup", description: "Setting up employees in CentralReach.", category: "Systems & Access", type: "SOP", updated: "2026-05-15", workflows: ["systems", "onboarding"], system: "CentralReach", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy4", title: "Access Request Workflow", description: "Requesting and provisioning access.", category: "Systems & Access", type: "Workflow", updated: "2026-05-13", workflows: ["systems"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy5", title: "Employee Account Setup SOP", description: "Account setup across operational systems.", category: "Systems & Access", type: "SOP", updated: "2026-05-11", workflows: ["systems", "onboarding"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy6", title: "Create RBT in CentralReach (Tango)", description: "Tango walkthrough for creating an RBT.", category: "Systems & Access", type: "Tango", updated: "2026-05-10", workflows: ["systems", "onboarding"], system: "CentralReach", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy7", title: "Add BCBA in CentralReach (Tango)", description: "Tango walkthrough for adding a BCBA.", category: "Systems & Access", type: "Tango", updated: "2026-05-09", workflows: ["systems", "onboarding"], system: "CentralReach", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy8", title: "Employee Client Access (Tango)", description: "Granting employees access to clients.", category: "Systems & Access", type: "Tango", updated: "2026-05-08", workflows: ["systems"], system: "CentralReach", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy9", title: "Export Contacts (Tango)", description: "Exporting contacts operationally.", category: "Systems & Access", type: "Tango", updated: "2026-05-07", workflows: ["systems"], system: "CentralReach", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy10", title: "Ramp User Setup (Tango)", description: "Setting up users in Ramp.", category: "Systems & Access", type: "Tango", updated: "2026-05-06", workflows: ["systems"], system: "Ramp", owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "sy11", title: "Internal Systems Directory", description: "Directory of all HR-relevant systems.", category: "Systems & Access", type: "Reference", updated: "2026-05-04", workflows: ["systems"], owner: "HR", visibility: ["HR Team"], placeholder: true },

  // H — Communication & Templates
  { id: "co1", title: "Onboarding Email Templates", description: "Approved onboarding templates.", category: "Communication & Templates", type: "Template", updated: "2026-05-18", workflows: ["onboarding", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "co2", title: "Orientation Reminder Templates", description: "Approved orientation reminders.", category: "Communication & Templates", type: "Template", updated: "2026-05-16", workflows: ["orientation", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "co3", title: "Training Reminder Templates", description: "Reminders for training touchpoints.", category: "Communication & Templates", type: "Template", updated: "2026-05-14", workflows: ["training", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "co4", title: "HR Follow-Up Templates", description: "Standard follow-up messaging.", category: "Communication & Templates", type: "Template", updated: "2026-05-12", workflows: ["support", "communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "co5", title: "Employee Communication Standards", description: "Operational comms standards.", category: "Communication & Templates", type: "Guide", updated: "2026-05-10", workflows: ["communication"], owner: "HR", visibility: ["HR Team"], placeholder: true },
  { id: "co6", title: "Internal Escalation Templates", description: "Templates for internal escalations.", category: "Communication & Templates", type: "Template", updated: "2026-05-08", workflows: ["escalation", "communication"], owner: "HR", visibility: ["HR Team", "Leadership"], placeholder: true },
  { id: "co7", title: "Readiness Communication Templates", description: "Messaging tied to readiness blockers.", category: "Communication & Templates", type: "Template", updated: "2026-05-06", workflows: ["readiness", "communication"], owner: "HR", visibility: ["HR Team", "Scheduling"], placeholder: true },
];

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "onboarding", label: "Onboarding", icon: ShieldCheck },
  { key: "orientation", label: "Orientation", icon: GraduationCap },
  { key: "training", label: "Training", icon: BookOpen },
  { key: "support", label: "Employee support", icon: Heart },
  { key: "certifications", label: "Certifications", icon: BadgeCheck },
  { key: "evaluations", label: "Evaluations", icon: ClipboardCheck },
  { key: "readiness", label: "Readiness", icon: Layers },
  { key: "systems", label: "Systems", icon: Wrench },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "escalation", label: "Escalation", icon: AlertTriangle },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "Start Here": { icon: Compass, blurb: "HR Team operational orientation." },
  "Onboarding & New Hire SOPs": { icon: ShieldCheck, blurb: "From accepted offer to staffing-ready." },
  "Orientation Workflows": { icon: GraduationCap, blurb: "Coordinating orientation operationally." },
  "Training Academy Management": { icon: BookOpen, blurb: "Managing the Academy operationally." },
  "Employee Support": { icon: Heart, blurb: "Supporting employees with calm consistency." },
  "Certifications & Compliance": { icon: BadgeCheck, blurb: "Certifications, renewals, compliance touchpoints." },
  "Evaluations & Growth": { icon: ClipboardCheck, blurb: "Evaluation, coaching, and growth operations." },
  "Systems & Access": { icon: Wrench, blurb: "Monday, Viventium, CentralReach, Tangos." },
  "Communication & Templates": { icon: MessageSquare, blurb: "Approved HR messaging." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText, Workflow: WorkflowIcon, Guide: BookOpen, Template: MessageSquare,
  Checklist: ListChecks, Tango: WorkflowIcon, Reference: Layers, Form: FileText, Video: BookOpen,
};

type QuickFilter = "most-used" | "recent" | "essentials" | "onboarding-flow" | "new-hr";
const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "most-used", label: "Most used" },
  { key: "recent", label: "Recently updated" },
  { key: "essentials", label: "HR essentials" },
  { key: "onboarding-flow", label: "Onboarding flow" },
  { key: "new-hr", label: "New HR staff" },
];

const MOST_USED_IDS = new Set(["on1", "on3", "or1", "es1", "ce1", "ev1", "sy2"]);
const ESSENTIALS_IDS = new Set(["on1", "on3", "on6", "or1", "es1", "ce1", "ev1"]);
const NEW_HR_IDS = new Set(["sh1", "sh2", "sh3", "sh4", "on1", "or1", "sy2"]);
const ONBOARDING_FLOW_IDS = new Set(["on1", "on2", "on3", "on4", "on5", "on6", "on7", "on8", "on9", "on10"]);

const aiPrompts = [
  { q: "Show onboarding SOPs.", a: "Open the Onboarding & New Hire SOPs category. Start with the New Hire Workflow SOP, then layer the Viventium Onboarding SOP and the HR Onboarding Timeline for the standard cadence." },
  { q: "Where is the orientation workflow?", a: "Orientation Workflows category — start with the Orientation Coordination SOP, then the Orientation Attendance Workflow and Orientation Follow-Up SOP." },
  { q: "Find certification renewal resources.", a: "Certifications & Compliance category — the Certification Renewal Workflow plus the Expiration Tracking SOP cover the operational cadence." },
  { q: "Show evaluation workflows.", a: "Evaluations & Growth category — start with the Employee Evaluations SOP. Self, Leadership, and Coaching workflows live alongside it." },
  { q: "Find Viventium onboarding guides.", a: "Onboarding & New Hire SOPs → Viventium Onboarding SOP, plus the Viventium Guide in Systems & Access for system-level reference." },
];

export default function OSHRResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
  const [activeQuick, setActiveQuick] = useState<QuickFilter | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["on1", "or1", "ev1"]));
  const [recent] = useState<string[]>(["on1", "or1", "es1", "ce1", "ev1"]);
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
      if (activeQuick === "new-hr" && !NEW_HR_IDS.has(r.id)) return false;
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
              <Library className="h-3 w-3" /> Resource Library · HR Team
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Resource Library</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Operational SOPs, onboarding workflows, training guides, employee support resources, and HR systems documentation for the HR Team.
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
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs, onboarding, orientation, training, certifications, Viventium…"
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
            <Section title="Featured operational resources" subtitle="The most-used HR playbook items.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Organized for HR operations.">
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

            <Section title="Workflow Guidance" subtitle="Find SOPs, workflows, templates, or operational guidance.">
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
                <p className="mt-4 text-[11px] text-muted-foreground">HIPAA-aware · scoped to HR resources you have access to.</p>
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
        <p className="text-sm text-muted-foreground">No HR resources matched your search.</p>
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
          Search by workflow ("onboarding", "orientation", "training", "readiness"), not document name. The library is organized around how HR actually works.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
        <div className="mt-2 space-y-1">
          <RailLink to="/hr/workspace" label="HR workspace" icon={Users} />
          <RailLink to="/hr/new-hires" label="New hires" icon={ShieldCheck} />
          <RailLink to="/hr/orientation-queue" label="Orientation queue" icon={GraduationCap} />
          <RailLink to="/hr/training-certifications" label="Training & certifications" icon={BadgeCheck} />
          <RailLink to="/hr/messages" label="Messages & updates" icon={BellRing} />
          <RailLink to="/hr/team-resources" label="Workflow guidance" icon={Bot} />
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