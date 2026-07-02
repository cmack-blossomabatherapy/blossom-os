 import { useMemo, useState } from "react";
 import { Link } from "react-router-dom";
 import {
   Search, Sparkles, Bookmark, Clock, ArrowRight, FileText, Workflow as WorkflowIcon,
   PlayCircle, ListChecks, ShieldCheck, Activity, ClipboardCheck, AlertTriangle,
   Users, Target, MessageSquare, Wrench, Share2, ChevronRight,
   BookOpen, Library, Star, Calendar, ExternalLink, CalendarDays, UserPlus, Bot,
   GraduationCap, Layers, Heart,
 } from "lucide-react";
 import { OSShell } from "./OSShell";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";

 // =============================================================================
 // Scheduling Team Resource Library
 // Operational playbook for Scheduling: staffing, scheduling, coverage, pairings,
 // templates, checklists, systems, training. Configuration-only — uses the
 // existing Resource Library architecture.
 // =============================================================================

 type ResourceType = "SOP" | "Workflow" | "Guide" | "Template" | "Checklist" | "Journey" | "Reference";
 type Category =
   | "Staffing Operations"
   | "Scheduling Operations"
   | "Cancellations & Coverage"
   | "BCBA & RBT Coordination"
   | "Client Service Readiness"
   | "Communication Templates"
   | "Checklists & Quick Guides"
   | "Systems & Tools"
   | "Training & Development";

 type WorkflowKey =
   | "staffing" | "pairing" | "scheduling" | "coverage" | "cancellation"
   | "start-date" | "escalation" | "bcba" | "rbt";

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
   workflows?: WorkflowKey[];
   system?: string;
   owner?: string;
 }

 const resources: Resource[] = [
   // Category 1 — Staffing Operations
   { id: "s1", title: "Staffing SOP", description: "Master SOP for staffing operations and execution.", category: "Staffing Operations", type: "SOP", minutes: 12, updated: "2026-05-12", featured: true, workflows: ["staffing"], owner: "Scheduling" },
   { id: "s2", title: "Staffing Queue Workflow", description: "How Scheduling prioritizes and works the staffing queue.", category: "Staffing Operations", type: "Workflow", minutes: 8, updated: "2026-05-10", workflows: ["staffing"], href: "/ops/staffing?tab=open-cases", owner: "Scheduling" },
   { id: "s3", title: "Pairing Workflow SOP", description: "How BCBA / RBT / client pairings are coordinated.", category: "Staffing Operations", type: "SOP", minutes: 9, updated: "2026-05-08", featured: true, workflows: ["pairing"], owner: "Scheduling" },
   { id: "s4", title: "Staffing Escalation Guide", description: "What to do when staffing becomes blocked or delayed.", category: "Staffing Operations", type: "Guide", minutes: 6, updated: "2026-05-04", workflows: ["escalation", "staffing"], owner: "Scheduling" },
   { id: "s5", title: "Coverage Risk Workflow", description: "How to identify and manage staffing instability.", category: "Staffing Operations", type: "Workflow", minutes: 7, updated: "2026-05-06", workflows: ["coverage"], owner: "Scheduling" },
   { id: "s6", title: "Staffing Prioritization Standards", description: "How scheduling determines operational urgency.", category: "Staffing Operations", type: "Guide", minutes: 5, updated: "2026-04-29", workflows: ["staffing"], owner: "Scheduling" },
   { id: "s7", title: "Waitlist Management Workflow", description: "How clients waiting for staffing are monitored and managed.", category: "Staffing Operations", type: "Workflow", minutes: 6, updated: "2026-04-22", workflows: ["staffing"], owner: "Scheduling" },
   { id: "s8", title: "Staffing Readiness Checklist", description: "Checklist used before clients move toward scheduling / start date.", category: "Staffing Operations", type: "Checklist", minutes: 4, updated: "2026-05-01", workflows: ["staffing", "start-date"], owner: "Scheduling" },

   // Category 2 — Scheduling Operations
   { id: "sc1", title: "Scheduling Workflow SOP", description: "End-to-end scheduling coordination process.", category: "Scheduling Operations", type: "SOP", minutes: 10, updated: "2026-05-14", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "sc2", title: "Start Date Coordination SOP", description: "How Scheduling finalizes and launches services.", category: "Scheduling Operations", type: "SOP", minutes: 8, updated: "2026-05-11", featured: true, workflows: ["start-date"], owner: "Scheduling" },
   { id: "sc3", title: "Schedule Conflict Resolution Guide", description: "How scheduling conflicts are identified and resolved.", category: "Scheduling Operations", type: "Guide", minutes: 6, updated: "2026-05-09", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "sc4", title: "Weekly Schedule Management SOP", description: "Managing recurring schedules operationally.", category: "Scheduling Operations", type: "SOP", minutes: 7, updated: "2026-05-03", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "sc5", title: "Schedule Change Workflow", description: "How changes are documented and coordinated.", category: "Scheduling Operations", type: "Workflow", minutes: 5, updated: "2026-04-28", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "sc6", title: "Parent Availability Standards", description: "Guidelines for managing parent schedule preferences.", category: "Scheduling Operations", type: "Guide", minutes: 5, updated: "2026-04-25", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "sc7", title: "Clinic vs Home Scheduling Standards", description: "Differences in operational scheduling by service setting.", category: "Scheduling Operations", type: "Guide", minutes: 6, updated: "2026-04-19", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "sc8", title: "Multi-State Scheduling Operations", description: "Organization-wide scheduling coordination standards.", category: "Scheduling Operations", type: "Guide", minutes: 8, updated: "2026-04-15", workflows: ["scheduling"], owner: "Operations" },

   // Category 3 — Cancellations & Coverage
   { id: "c1", title: "Cancellation Workflow SOP", description: "How cancellations are managed operationally.", category: "Cancellations & Coverage", type: "SOP", minutes: 7, updated: "2026-05-15", featured: true, workflows: ["cancellation", "coverage"], owner: "Scheduling" },
   { id: "c2", title: "Emergency Coverage SOP", description: "Handling urgent uncovered sessions.", category: "Cancellations & Coverage", type: "SOP", minutes: 6, updated: "2026-05-12", workflows: ["coverage"], owner: "Scheduling" },
   { id: "c3", title: "Coverage Recovery Workflow", description: "Restoring stable service after cancellations.", category: "Cancellations & Coverage", type: "Workflow", minutes: 6, updated: "2026-05-07", workflows: ["coverage", "cancellation"], owner: "Scheduling" },
   { id: "c4", title: "Session Replacement Guidelines", description: "Rules for replacement coverage and makeups.", category: "Cancellations & Coverage", type: "Guide", minutes: 5, updated: "2026-05-02", workflows: ["coverage"], owner: "Scheduling" },
   { id: "c5", title: "High-Risk Client Coverage Guide", description: "How to manage unstable scheduling situations.", category: "Cancellations & Coverage", type: "Guide", minutes: 7, updated: "2026-04-27", workflows: ["coverage"], owner: "Scheduling" },
   { id: "c6", title: "Coverage Escalation Matrix", description: "Who to involve during coverage breakdowns.", category: "Cancellations & Coverage", type: "Reference", minutes: 4, updated: "2026-05-18", featured: true, workflows: ["coverage", "escalation"], owner: "Scheduling" },
   { id: "c7", title: "Provider No-Show Workflow", description: "Operational response for missed sessions.", category: "Cancellations & Coverage", type: "Workflow", minutes: 5, updated: "2026-05-05", workflows: ["coverage", "cancellation"], owner: "Scheduling" },

   // Category 4 — BCBA & RBT Coordination
   { id: "b1", title: "BCBA Coordination SOP", description: "How Scheduling works with supervising BCBAs.", category: "BCBA & RBT Coordination", type: "SOP", minutes: 7, updated: "2026-05-10", workflows: ["bcba"], owner: "Scheduling" },
   { id: "b2", title: "RBT Coordination Workflow", description: "Operational communication with RBTs.", category: "BCBA & RBT Coordination", type: "Workflow", minutes: 6, updated: "2026-05-08", workflows: ["rbt"], owner: "Scheduling" },
   { id: "b3", title: "Availability Collection Process", description: "How provider availability is gathered and updated.", category: "BCBA & RBT Coordination", type: "Workflow", minutes: 5, updated: "2026-05-04", workflows: ["bcba", "rbt"], owner: "Scheduling" },
   { id: "b4", title: "Provider Utilization Standards", description: "Guidelines for balancing schedules and caseloads.", category: "BCBA & RBT Coordination", type: "Guide", minutes: 6, updated: "2026-04-30", workflows: ["bcba", "rbt"], owner: "Scheduling" },
   { id: "b5", title: "Pairing Compatibility Guidelines", description: "Factors considered for successful pairings.", category: "BCBA & RBT Coordination", type: "Guide", minutes: 5, updated: "2026-04-24", workflows: ["pairing"], owner: "Scheduling" },
   { id: "b6", title: "Provider Communication Standards", description: "Internal communication expectations.", category: "BCBA & RBT Coordination", type: "Guide", minutes: 4, updated: "2026-04-20", workflows: ["bcba", "rbt"], owner: "Scheduling" },
   { id: "b7", title: "Overloaded Provider Escalation SOP", description: "What to do when providers become overloaded.", category: "BCBA & RBT Coordination", type: "SOP", minutes: 5, updated: "2026-05-06", workflows: ["bcba", "rbt", "escalation"], owner: "Scheduling" },

   // Category 5 — Client Service Readiness
   { id: "r1", title: "Service Readiness Workflow", description: "How clients move toward active services.", category: "Client Service Readiness", type: "Workflow", minutes: 6, updated: "2026-05-13", workflows: ["start-date"], owner: "Scheduling" },
   { id: "r2", title: "Intake-to-Scheduling Handoff SOP", description: "Transition process from Intake.", category: "Client Service Readiness", type: "SOP", minutes: 5, updated: "2026-05-09", workflows: ["start-date"], owner: "Operations" },
   { id: "r3", title: "Authorization-to-Scheduling Handoff SOP", description: "Transition process from Authorizations.", category: "Client Service Readiness", type: "SOP", minutes: 5, updated: "2026-05-07", workflows: ["start-date"], owner: "Operations" },
   { id: "r4", title: "Pending Start Date Workflow", description: "Managing approved but not-started clients.", category: "Client Service Readiness", type: "Workflow", minutes: 5, updated: "2026-05-02", workflows: ["start-date"], owner: "Scheduling" },
   { id: "r5", title: "Active Services Transition Checklist", description: "Checklist before client becomes Active.", category: "Client Service Readiness", type: "Checklist", minutes: 4, updated: "2026-04-28", workflows: ["start-date"], owner: "Scheduling" },
   { id: "r6", title: "On-Hold / Services Pause Workflow", description: "Handling paused services operationally.", category: "Client Service Readiness", type: "Workflow", minutes: 5, updated: "2026-04-23", workflows: ["coverage"], owner: "Scheduling" },

   // Category 6 — Communication Templates
   { id: "t1", title: "Parent Scheduling Templates", description: "Message templates for parent scheduling coordination.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-05-14", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "t2", title: "Coverage Update Templates", description: "Templates for coverage change notifications.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-05-12", workflows: ["coverage"], owner: "Scheduling" },
   { id: "t3", title: "Cancellation Communication Templates", description: "Standard messaging for cancellation events.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-05-10", workflows: ["cancellation"], owner: "Scheduling" },
   { id: "t4", title: "Pairing Confirmation Templates", description: "Confirming new pairings with families and providers.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-05-06", workflows: ["pairing"], owner: "Scheduling" },
   { id: "t5", title: "RBT Outreach Templates", description: "RBT communication for scheduling coordination.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-05-03", workflows: ["rbt"], owner: "Scheduling" },
   { id: "t6", title: "BCBA Follow-Up Templates", description: "Standard follow-ups with supervising BCBAs.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-04-30", workflows: ["bcba"], owner: "Scheduling" },
   { id: "t7", title: "Schedule Change Templates", description: "Templates for schedule adjustments.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-04-26", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "t8", title: "Escalation Communication Templates", description: "Templates for operational escalations.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-04-22", workflows: ["escalation"], owner: "Scheduling" },
   { id: "t9", title: "Staffing Delay Communication Templates", description: "Family-friendly messaging for staffing delays.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-04-18", workflows: ["staffing"], owner: "Scheduling" },
   { id: "t10", title: "Start Date Confirmation Templates", description: "Service launch confirmation messaging.", category: "Communication Templates", type: "Template", minutes: 3, updated: "2026-04-14", workflows: ["start-date"], owner: "Scheduling" },

   // Category 7 — Checklists & Quick Guides
   { id: "k1", title: "Daily Scheduling Checklist", description: "The morning scan for scheduling coordinators.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 3, updated: "2026-05-19", featured: true, workflows: ["scheduling"], owner: "Scheduling" },
   { id: "k2", title: "Daily Staffing Queue Checklist", description: "Daily routine for working the staffing queue.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 3, updated: "2026-05-17", workflows: ["staffing"], owner: "Scheduling" },
   { id: "k3", title: "New Pairing Checklist", description: "Steps to launch a new pairing cleanly.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 3, updated: "2026-05-13", workflows: ["pairing"], owner: "Scheduling" },
   { id: "k4", title: "Start Date Checklist", description: "Pre-launch checklist for new starts.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 4, updated: "2026-05-09", workflows: ["start-date"], owner: "Scheduling" },
   { id: "k5", title: "Coverage Recovery Checklist", description: "Recovery steps after coverage disruption.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 4, updated: "2026-05-05", workflows: ["coverage"], owner: "Scheduling" },
   { id: "k6", title: "Schedule Stability Checklist", description: "Weekly stability review for active clients.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 4, updated: "2026-05-01", workflows: ["scheduling", "coverage"], owner: "Scheduling" },
   { id: "k7", title: "Conflict Resolution Checklist", description: "Steps for resolving schedule conflicts.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 3, updated: "2026-04-27", workflows: ["scheduling"], owner: "Scheduling" },
   { id: "k8", title: "Staffing Escalation Quick Guide", description: "When and how to escalate staffing blockers.", category: "Checklists & Quick Guides", type: "Guide", minutes: 3, updated: "2026-04-23", workflows: ["staffing", "escalation"], owner: "Scheduling" },
   { id: "k9", title: "Cancellation Recovery Checklist", description: "Post-cancellation recovery steps.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 3, updated: "2026-04-19", workflows: ["cancellation"], owner: "Scheduling" },
   { id: "k10", title: "Operational Readiness Checklist", description: "Daily operational readiness scan.", category: "Checklists & Quick Guides", type: "Checklist", minutes: 4, updated: "2026-04-15", workflows: ["scheduling"], owner: "Scheduling" },

   // Category 8 — Systems & Tools
   { id: "y1", title: "Blossom OS Scheduling Workspace Guide", description: "Every panel, filter, and action in the Scheduling workspace.", category: "Systems & Tools", type: "Guide", minutes: 6, updated: "2026-05-18", href: "/scheduling", system: "Blossom OS", owner: "Operations" },
   { id: "y2", title: "Staffing Queue Usage Guide", description: "How to work the staffing queue end-to-end.", category: "Systems & Tools", type: "Guide", minutes: 5, updated: "2026-05-15", href: "/ops/staffing?tab=open-cases", system: "Blossom OS", owner: "Operations" },
   { id: "y3", title: "Scheduling Dashboard Guide", description: "Reading the scheduling team dashboard.", category: "Systems & Tools", type: "Guide", minutes: 4, updated: "2026-05-11", href: "/scheduling", system: "Blossom OS", owner: "Operations" },
   { id: "y4", title: "Operational Insights Usage Guide", description: "Using AI for scheduling questions and operational lookups.", category: "Systems & Tools", type: "Guide", minutes: 4, updated: "2026-05-08", href: "/ai/assistant", system: "Blossom OS", owner: "Operations" },
   { id: "y5", title: "CentralReach Scheduling Reference", description: "Source-of-truth scheduling reference in CR.", category: "Systems & Tools", type: "Reference", minutes: 6, updated: "2026-04-26", system: "CentralReach", owner: "Operations" },
   { id: "y6", title: "Monday Legacy Workflow Reference", description: "Legacy monday.com scheduling workflows.", category: "Systems & Tools", type: "Reference", minutes: 5, updated: "2026-04-12", system: "monday.com", owner: "Operations" },
   { id: "y7", title: "Communication Systems Guide", description: "Approved channels and routing for scheduling messages.", category: "Systems & Tools", type: "Guide", minutes: 4, updated: "2026-04-08", owner: "Operations" },
   { id: "y8", title: "Availability Tracking Guide", description: "How provider availability is tracked operationally.", category: "Systems & Tools", type: "Guide", minutes: 5, updated: "2026-04-05", owner: "Operations" },

   // Category 9 — Training & Development
   { id: "d1", title: "Scheduling Team Journey", description: "Onboarding journey for new scheduling team members.", category: "Training & Development", type: "Journey", minutes: 45, updated: "2026-05-16", href: "/training", owner: "Training" },
   { id: "d2", title: "Staffing Fundamentals", description: "Foundational training for staffing operations.", category: "Training & Development", type: "Journey", minutes: 30, updated: "2026-05-12", href: "/training", owner: "Training" },
   { id: "d3", title: "Pairing Best Practices", description: "Best practices for successful BCBA/RBT/client pairings.", category: "Training & Development", type: "Guide", minutes: 12, updated: "2026-05-06", owner: "Training" },
   { id: "d4", title: "Operational Calm Under Pressure", description: "How to stay calm and operationally focused.", category: "Training & Development", type: "Guide", minutes: 10, updated: "2026-04-30", owner: "Training" },
   { id: "d5", title: "Coverage Strategy Fundamentals", description: "Foundational coverage strategy training.", category: "Training & Development", type: "Guide", minutes: 15, updated: "2026-04-24", owner: "Training" },
   { id: "d6", title: "Multi-State Scheduling Fundamentals", description: "How scheduling differs across Blossom states.", category: "Training & Development", type: "Guide", minutes: 12, updated: "2026-04-18", owner: "Training" },
   { id: "d7", title: "Scheduling Leadership Development", description: "Development pathway for senior scheduling roles.", category: "Training & Development", type: "Journey", minutes: 60, updated: "2026-04-10", owner: "Training" },
 ];

 const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
   { key: "staffing", label: "Staffing", icon: UserPlus },
   { key: "pairing", label: "Pairing", icon: Users },
   { key: "scheduling", label: "Scheduling", icon: CalendarDays },
   { key: "coverage", label: "Coverage", icon: ShieldCheck },
   { key: "cancellation", label: "Cancellation", icon: AlertTriangle },
   { key: "start-date", label: "Start Date", icon: Target },
   { key: "escalation", label: "Escalation", icon: Activity },
   { key: "bcba", label: "BCBA", icon: ClipboardCheck },
   { key: "rbt", label: "RBT", icon: Heart },
 ];

 const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
   "Staffing Operations": { icon: UserPlus, blurb: "Core staffing execution resources." },
   "Scheduling Operations": { icon: CalendarDays, blurb: "Daily scheduling coordination workflows." },
   "Cancellations & Coverage": { icon: ShieldCheck, blurb: "Continuity and coverage management." },
   "BCBA & RBT Coordination": { icon: Users, blurb: "Operational provider coordination." },
   "Client Service Readiness": { icon: Target, blurb: "Helping clients reach active services." },
   "Communication Templates": { icon: MessageSquare, blurb: "Operational communication efficiency." },
   "Checklists & Quick Guides": { icon: ListChecks, blurb: "Fast operational execution support." },
   "Systems & Tools": { icon: Wrench, blurb: "Operational systems guidance." },
   "Training & Development": { icon: GraduationCap, blurb: "Ongoing operational growth." },
 };

 const typeIcon: Record<ResourceType, typeof FileText> = {
   SOP: FileText, Workflow: WorkflowIcon, Guide: BookOpen, Template: MessageSquare,
   Checklist: ListChecks, Journey: GraduationCap, Reference: Layers,
 };

 type QuickFilter = "most-used" | "recent" | "essentials" | "coverage" | "onboarding";
 const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
   { key: "most-used", label: "Most Used" },
   { key: "recent", label: "Recently Updated" },
   { key: "essentials", label: "Scheduling Essentials" },
   { key: "coverage", label: "Coverage Risks" },
   { key: "onboarding", label: "New Team Members" },
 ];

 const MOST_USED_IDS = new Set(["s1", "s3", "c1", "k1", "sc2", "c6"]);
 const ESSENTIALS_IDS = new Set(["s1", "sc1", "s3", "c1", "sc2", "k1"]);
 const ONBOARDING_IDS = new Set(["d1", "d2", "s1", "sc1", "k1", "y1"]);

 const aiPrompts = [
   { q: "Show me cancellation workflows.", a: "Start with the Cancellation Workflow SOP, then layer Coverage Recovery and Session Replacement. The Coverage Escalation Matrix names the owner for each breakdown type." },
   { q: "How do pairings work?", a: "Pairings follow the Pairing Workflow SOP. Compatibility (location, hours, supervising BCBA) is set in Pairing Compatibility Guidelines. Confirm via Pairing Confirmation Templates." },
   { q: "What's the escalation process for uncovered sessions?", a: "Use the Coverage Escalation Matrix. Tier 1: scheduling attempts replacement coverage. Tier 2: notify BCBA + parent. Tier 3: State Director engagement. Document each step in the client's notes." },
   { q: "Show scheduling best practices.", a: "Anchor your week with the Daily Scheduling Checklist, then run the Weekly Schedule Management SOP. Schedule Stability Checklist runs each Friday for active clients." },
   { q: "How do I coordinate start dates?", a: "Use the Start Date Coordination SOP. Pre-flight with the Start Date Checklist and confirm with the Start Date Confirmation Template. Handoffs are documented in the Intake-to-Scheduling and Auth-to-Scheduling SOPs." },
 ];

 export default function OSSchedulingResources() {
   const [query, setQuery] = useState("");
   const [activeCategory, setActiveCategory] = useState<Category | null>(null);
   const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey | null>(null);
   const [activeQuick, setActiveQuick] = useState<QuickFilter | null>(null);
   const [saved, setSaved] = useState<Set<string>>(new Set(["s1", "c1", "k1"]));
   const [recent] = useState<string[]>(["k1", "s1", "c1", "sc2", "s3"]);
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
       if (activeQuick === "onboarding" && !ONBOARDING_IDS.has(r.id)) return false;
       if (activeQuick === "coverage" && !(r.workflows ?? []).some((w) => w === "coverage" || w === "cancellation")) return false;
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
         {/* Header */}
         <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
           <div className="space-y-2">
             <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
               <Library className="h-3 w-3" /> Resource Library · Scheduling
             </div>
             <h1 className="text-3xl font-semibold tracking-tight text-foreground">Scheduling Resources</h1>
             <p className="max-w-2xl text-sm text-muted-foreground">
               Operational SOPs, workflows, templates, and checklists for the Scheduling Team — the playbook for staffing, coverage, and service continuity.
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
               <Link to="/ai/assistant"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Operational Insights</Link>
             </Button>
           </div>
         </header>

         {/* Search */}
         <div className="relative">
           <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Search SOPs, workflows, templates, checklists, pairing, coverage, escalation…"
             className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
           />

           {/* Quick filters */}
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
             <Section title="Featured operational resources" subtitle="The most-used scheduling playbook items.">
               <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                 {featured.map((r) => (
                   <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                 ))}
               </div>
             </Section>

             <Section title="Resource categories" subtitle="Curated for scheduling operations.">
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

             <Section title="Operational Insights" subtitle="Find workflows, SOPs, templates, or escalation guidance.">
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
                 <p className="mt-4 text-[11px] text-muted-foreground">HIPAA-aware · scoped to scheduling resources you have access to.</p>
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
           Search by workflow ("coverage", "pairing", "start date"), not by document name. The library is organized around how you work.
         </p>
       </div>
       <div className="rounded-2xl border border-border/70 bg-card p-4">
         <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jump to</p>
         <div className="mt-2 space-y-1">
           <RailLink to="/scheduling" label="Scheduling workspace" icon={CalendarDays} />
           <RailLink to="/ops/staffing?tab=coverage" label="Staffing Queue" icon={UserPlus} />
           <RailLink to="/scheduling" label="Scheduling dashboard" icon={Layers} />
           <RailLink to="/ai/assistant" label="Operational Insights" icon={Bot} />
           <RailLink to="/training" label="Training Academy" icon={GraduationCap} />
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

 function RailLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof CalendarDays }) {
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