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
// QA Resource Library — Current-State
// Aligned to the "FINAL - QA Resource Library Upload - 2026-07-14" package.
// Categories, resource types, PDF-only SOPs, Needs Review labeling, and a video
// content-gap panel follow the current QA operating model. This is a *current-state*
// library — do not treat future Blossom OS planning docs as current QA SOPs.
// =============================================================================

type ResourceType =
  | "SOP"
  | "Training Resource"
  | "Report/Export"
  | "Role Packet"
  | "Signoff"
  | "Handoff Reference"
  | "Needs Review";

type ResourceFormat = "PDF" | "CSV" | "DOCX" | "Link";

type Category =
  | "QA Start Here"
  | "QA SOPs"
  | "Clinical Report QA"
  | "Treatment Plan QA"
  | "Documentation Standards and Corrections"
  | "Missing Items and Fax Follow-Up"
  | "Compliance Reviews and Audits"
  | "QA Escalation and Trend Reporting"
  | "QA Role Packet and Signoff"
  | "QA Training Journey Resources"
  | "QA Reports, Exports, and Examples"
  | "Authorizations and Training Handoff References"
  | "Needs Review - QA Adjacent";

type WorkflowKey =
  | "clinical-report" | "treatment-plan" | "documentation" | "missing-info"
  | "fax-chase" | "compliance-audit" | "escalation" | "trend-reporting"
  | "signoff" | "handoff";

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
  sops: "01 - QA SOPs - PDF Only",
  training: "02 - QA Training Resources",
  videos: "03 - QA Videos and Media",
  reports: "04 - QA Reports Exports and Examples",
  clinicalRefs: "05 - Clinical Report and Treatment Plan QA References",
  corrections: "06 - Documentation Corrections and Missing Items",
  rolePacket: "07 - QA Role Packet and Signoff",
  handoffs: "08 - Authorizations Clinical and Training Handoff References",
  uploadQA: "09 - Upload QA and Inventory",
  needsReview: "10 - Needs Review - QA Adjacent",
} as const;

const resources: Resource[] = [
  // ------- 0. QA Start Here -------
  { id: "start-1", title: "QA Team - Start Here", description: "Current-state overview of what QA reviews (clinical/report quality, treatment plans, documentation, missing items, compliance, trends) and what QA does not own.", category: "QA Start Here", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 5, updated: "2026-07-14", featured: true, owner: "QA Director" },
  { id: "start-2", title: "QA Team 4-Week Current-State Onboarding Journey - Overview", description: "Overview of the four-week QA onboarding journey (weeks 1-4) with the modules and resources learners open on each day.", category: "QA Start Here", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", featured: true, journeyDay: "Week 1 Day 1" },
  { id: "start-3", title: "QA Role and Scope - Current Operations", description: "Plain-English scope: QA reviews documentation and clinical/report quality, flags missing items and corrections, escalates trends. QA does not replace Clinical supervision, Authorizations, Scheduling, Billing/RCM, HR, or State Director ownership.", category: "QA Start Here", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 4, updated: "2026-07-14" },

  // ------- 1. QA SOPs (PDF ONLY, learner-facing) -------
  { id: "sop-01", title: "L1 QA Director QA Reviewer Role SOP", description: "L1 SOP defining the QA Director and QA Reviewer roles, ownership boundaries, and daily responsibilities.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", featured: true, owner: "QA Director" },
  { id: "sop-02", title: "L2 QA Review Current Operations", description: "Current-state QA review workflow: intake of items into the QA queue, review steps, routing, and closeout.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 8, updated: "2026-07-14" },
  { id: "sop-03", title: "L2 Clinical Report QA Review Process SOP", description: "How QA reviews clinical/progress reports for accuracy, completeness, and documentation quality.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 8, updated: "2026-07-14", featured: true, workflows: ["clinical-report"] },
  { id: "sop-04", title: "L2 Treatment Plan QA Current Operations", description: "Current-state treatment plan QA workflow: what QA validates and what gets routed back to the BCBA.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 8, updated: "2026-07-14", featured: true, workflows: ["treatment-plan"] },
  { id: "sop-05", title: "L2 Documentation Standards Current Operations", description: "Documentation standards QA holds across notes, reports, and treatment plans.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["documentation"] },
  { id: "sop-06", title: "L2 Documentation Missing Item Follow-Up Process SOP", description: "How QA identifies missing items, assigns owners, follows up, and closes the loop.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["missing-info"] },
  { id: "sop-07", title: "L2 Fax and External Document Chase Process SOP", description: "Fax and external document chase: how QA tracks outbound requests and confirms receipt.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["fax-chase", "missing-info"] },
  { id: "sop-08", title: "L2 Corrections Current Operations", description: "How QA routes documentation corrections back to the correct owner and confirms the correction was made.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["documentation"] },
  { id: "sop-09", title: "L2 Audits Current Operations", description: "Current-state QA audits: scope, cadence, sampling, and findings write-up.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["compliance-audit"] },
  { id: "sop-10", title: "L2 Compliance Reviews Current Operations", description: "How QA runs compliance reviews and coordinates findings with clinical and state leadership.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 7, updated: "2026-07-14", workflows: ["compliance-audit"] },
  { id: "sop-11", title: "L2 Clinical Quality Metrics Current Operations", description: "Which clinical quality metrics QA tracks today and how they roll up to leadership.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14" },
  { id: "sop-12", title: "L2 QA Escalation Review Process SOP", description: "Escalation criteria, escalation paths, and communication expectations for QA escalations.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", featured: true, workflows: ["escalation"] },
  { id: "sop-13", title: "L2 QA Trend Reporting Process SOP", description: "How QA identifies recurring documentation, clinical, or compliance trends and reports them.", category: "QA SOPs", type: "SOP", format: "PDF", folder: FOLDER.sops, minutes: 6, updated: "2026-07-14", workflows: ["trend-reporting"] },

  // ------- 2. Clinical Report QA -------
  { id: "crqa-1", title: "Clinical Report QA Reference Guide", description: "Reference for what QA looks for on clinical/progress reports: required sections, common documentation issues, and correction paths.", category: "Clinical Report QA", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalRefs, minutes: 6, updated: "2026-07-14", workflows: ["clinical-report"] },
  { id: "crqa-2", title: "Clinical Report QA Common Findings", description: "Common QA findings on clinical reports with plain-English examples and the correction owner for each.", category: "Clinical Report QA", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalRefs, minutes: 5, updated: "2026-07-14", workflows: ["clinical-report"] },
  { id: "crqa-3", title: "Clinical Report QA Journey Checklist", description: "Learner-facing checklist used during the QA journey clinical-report module.", category: "Clinical Report QA", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 3, updated: "2026-07-14", journeyDay: "Week 2", workflows: ["clinical-report"] },

  // ------- 3. Treatment Plan QA -------
  { id: "tpqa-1", title: "Treatment Plan QA Reference Guide", description: "Reference for QA review of treatment plans: required sections, signatures, supporting documentation, and routing back to BCBA.", category: "Treatment Plan QA", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalRefs, minutes: 6, updated: "2026-07-14", workflows: ["treatment-plan"] },
  { id: "tpqa-2", title: "Treatment Plan QA Common Findings", description: "Common QA findings on treatment plans with correction owner and typical resolution path.", category: "Treatment Plan QA", type: "Training Resource", format: "PDF", folder: FOLDER.clinicalRefs, minutes: 5, updated: "2026-07-14", workflows: ["treatment-plan"] },
  { id: "tpqa-3", title: "Treatment Plan QA Journey Checklist", description: "Learner-facing checklist used during the QA journey treatment-plan module.", category: "Treatment Plan QA", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 3, updated: "2026-07-14", journeyDay: "Week 2", workflows: ["treatment-plan"] },

  // ------- 4. Documentation Standards and Corrections -------
  { id: "doc-1", title: "Documentation Standards Reference", description: "Plain-English reference for the documentation standards QA holds today across notes, reports, and plans.", category: "Documentation Standards and Corrections", type: "Training Resource", format: "PDF", folder: FOLDER.corrections, minutes: 5, updated: "2026-07-14", workflows: ["documentation"] },
  { id: "doc-2", title: "Corrections Workflow Reference", description: "How to route a documentation correction back to the owner and confirm it was made.", category: "Documentation Standards and Corrections", type: "Training Resource", format: "PDF", folder: FOLDER.corrections, minutes: 4, updated: "2026-07-14", workflows: ["documentation"] },
  { id: "doc-3", title: "Corrections Log Example (CSV)", description: "Example corrections log so learners can see the columns and cadence used today.", category: "Documentation Standards and Corrections", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14" },

  // ------- 5. Missing Items and Fax Follow-Up -------
  { id: "miss-1", title: "Missing Item Follow-Up Reference", description: "How QA identifies missing items, assigns owners, tracks follow-up, and closes the loop.", category: "Missing Items and Fax Follow-Up", type: "Training Resource", format: "PDF", folder: FOLDER.corrections, minutes: 5, updated: "2026-07-14", workflows: ["missing-info"] },
  { id: "miss-2", title: "Fax and External Document Chase Reference", description: "Reference for fax and external document chase workflows: outbound requests, confirmations, and re-requests.", category: "Missing Items and Fax Follow-Up", type: "Training Resource", format: "PDF", folder: FOLDER.corrections, minutes: 5, updated: "2026-07-14", workflows: ["fax-chase"] },
  { id: "miss-3", title: "Missing Item Tracker Example (CSV)", description: "Example missing item tracker so learners see columns, statuses, and owner assignments.", category: "Missing Items and Fax Follow-Up", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14", workflows: ["missing-info"] },

  // ------- 6. Compliance Reviews and Audits -------
  { id: "comp-1", title: "Compliance Review Reference", description: "How QA runs a compliance review today: scope, standards, and findings write-up.", category: "Compliance Reviews and Audits", type: "Training Resource", format: "PDF", folder: FOLDER.corrections, minutes: 6, updated: "2026-07-14", workflows: ["compliance-audit"] },
  { id: "comp-2", title: "Audit Sampling Reference", description: "How audit sampling works today, and what QA does with the findings.", category: "Compliance Reviews and Audits", type: "Training Resource", format: "PDF", folder: FOLDER.corrections, minutes: 5, updated: "2026-07-14", workflows: ["compliance-audit"] },
  { id: "comp-3", title: "Audit Findings Example (CSV)", description: "Example audit findings export so learners see the format used today.", category: "Compliance Reviews and Audits", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14", workflows: ["compliance-audit"] },

  // ------- 7. QA Escalation and Trend Reporting -------
  { id: "esc-1", title: "QA Escalation Reference", description: "When QA escalates, to whom (QA leadership, Clinical, Operations, Authorizations, State), and what documentation is required.", category: "QA Escalation and Trend Reporting", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 5, updated: "2026-07-14", featured: true, workflows: ["escalation"] },
  { id: "esc-2", title: "QA Trend Reporting Reference", description: "How QA identifies recurring documentation, clinical, or compliance patterns and reports them to leadership.", category: "QA Escalation and Trend Reporting", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 5, updated: "2026-07-14", workflows: ["trend-reporting"] },
  { id: "esc-3", title: "QA Trend Report Example (CSV)", description: "Example of a QA trend report export.", category: "QA Escalation and Trend Reporting", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14", workflows: ["trend-reporting"] },

  // ------- 8. QA Role Packet and Signoff -------
  { id: "pkt-1", title: "QA Role Packet", description: "Role packet for QA Reviewer / QA Director covering current scope, ownership boundaries, and daily rhythm.", category: "QA Role Packet and Signoff", type: "Role Packet", format: "PDF", folder: FOLDER.rolePacket, minutes: 8, updated: "2026-07-14", workflows: ["signoff"] },
  { id: "pkt-2", title: "QA Onboarding Signoff", description: "Signoff form learners complete at the end of the 4-week QA onboarding journey.", category: "QA Role Packet and Signoff", type: "Signoff", format: "PDF", folder: FOLDER.rolePacket, minutes: 3, updated: "2026-07-14", workflows: ["signoff"], journeyDay: "Week 4" },

  // ------- 9. QA Training Journey Resources -------
  { id: "jrn-1", title: "QA Journey - Week 1 Resource Pack", description: "Resources referenced across Week 1 modules of the QA journey.", category: "QA Training Journey Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 1" },
  { id: "jrn-2", title: "QA Journey - Week 2 Resource Pack", description: "Resources referenced across Week 2 modules (clinical report QA + treatment plan QA).", category: "QA Training Journey Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 2" },
  { id: "jrn-3", title: "QA Journey - Week 3 Resource Pack", description: "Resources referenced across Week 3 modules (documentation standards, corrections, missing items, fax follow-up).", category: "QA Training Journey Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 3" },
  { id: "jrn-4", title: "QA Journey - Week 4 Resource Pack", description: "Resources referenced across Week 4 modules (compliance, audits, escalation, trend reporting, signoff).", category: "QA Training Journey Resources", type: "Training Resource", format: "PDF", folder: FOLDER.training, minutes: 6, updated: "2026-07-14", journeyDay: "Week 4" },

  // ------- 10. QA Reports, Exports, and Examples -------
  { id: "rpt-1", title: "QA Queue Snapshot Example (CSV)", description: "Example export of the QA queue snapshot used today.", category: "QA Reports, Exports, and Examples", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14" },
  { id: "rpt-2", title: "Clinical Report QA Log Example (CSV)", description: "Example clinical report QA log used today.", category: "QA Reports, Exports, and Examples", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14", workflows: ["clinical-report"] },
  { id: "rpt-3", title: "Treatment Plan QA Log Example (CSV)", description: "Example treatment plan QA log used today.", category: "QA Reports, Exports, and Examples", type: "Report/Export", format: "CSV", folder: FOLDER.reports, minutes: 3, updated: "2026-07-14", workflows: ["treatment-plan"] },

  // ------- 11. Authorizations and Training Handoff References -------
  { id: "hand-1", title: "QA to Authorizations Handoff Reference", description: "Handoff reference: what QA hands off to Authorizations for submission and what Authorizations owns from there.", category: "Authorizations and Training Handoff References", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff"] },
  { id: "hand-2", title: "QA to Clinical Leadership Handoff Reference", description: "Handoff reference for clinical concerns raised during QA that require clinical leadership review.", category: "Authorizations and Training Handoff References", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff"] },
  { id: "hand-3", title: "QA to Training Handoff Reference", description: "When QA sees a recurring documentation or clinical trend that indicates a training gap, this is how it hands off to Training Management.", category: "Authorizations and Training Handoff References", type: "Handoff Reference", format: "PDF", folder: FOLDER.handoffs, minutes: 5, updated: "2026-07-14", workflows: ["handoff", "trend-reporting"] },

  // ------- 12. Needs Review - QA Adjacent (planning / reference only) -------
  { id: "nr-1", title: "QA-Adjacent Planning Reference", description: "Planning or reference material adjacent to QA. Not a current QA SOP - do not treat as current operating instruction.", category: "Needs Review - QA Adjacent", type: "Needs Review", format: "PDF", folder: FOLDER.needsReview, minutes: 6, updated: "2026-07-14", needsReview: true, planningOnly: true },
  { id: "nr-2", title: "QA-Adjacent Blossom OS Concept Note", description: "Future-state concept note. Blossom OS is the training/resource platform in this context - not the current QA operating system. Not required onboarding.", category: "Needs Review - QA Adjacent", type: "Needs Review", format: "PDF", folder: FOLDER.needsReview, minutes: 6, updated: "2026-07-14", needsReview: true, planningOnly: true },
];

// ---- Content gap: 03 - QA Videos and Media has no QA-specific videos yet ----
const videoGap = {
  folder: FOLDER.videos,
  note: "No QA-specific videos found in the upload package. Do not invent video resources - these placeholder slots represent planned video content only.",
  slots: [
    "QA Department overview video",
    "Clinical report review walkthrough",
    "Treatment plan QA walkthrough",
    "Documentation corrections walkthrough",
    "Missing item and fax follow-up walkthrough",
    "QA escalation and trend reporting walkthrough",
  ],
};

const workflows: { key: WorkflowKey; label: string; icon: typeof WorkflowIcon }[] = [
  { key: "clinical-report", label: "Clinical Report QA", icon: ClipboardCheck },
  { key: "treatment-plan", label: "Treatment Plan QA", icon: FileText },
  { key: "documentation", label: "Documentation & Corrections", icon: BookOpen },
  { key: "missing-info", label: "Missing Items", icon: AlertTriangle },
  { key: "fax-chase", label: "Fax Follow-Up", icon: Mail },
  { key: "compliance-audit", label: "Compliance & Audits", icon: ShieldCheck },
  { key: "escalation", label: "Escalation", icon: Flame },
  { key: "trend-reporting", label: "Trend Reporting", icon: Activity },
  { key: "signoff", label: "Role Packet & Signoff", icon: ListChecks },
  { key: "handoff", label: "Handoffs", icon: Share2 },
];

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "QA Start Here": { icon: Star, blurb: "Current-state overview and journey entry point." },
  "QA SOPs": { icon: FileText, blurb: "Current-state QA SOPs (PDF only)." },
  "Clinical Report QA": { icon: ClipboardCheck, blurb: "Clinical/progress report QA references." },
  "Treatment Plan QA": { icon: FileText, blurb: "Treatment plan QA references." },
  "Documentation Standards and Corrections": { icon: BookOpen, blurb: "Standards and correction routing." },
  "Missing Items and Fax Follow-Up": { icon: AlertTriangle, blurb: "Missing item tracking and fax chase." },
  "Compliance Reviews and Audits": { icon: ShieldCheck, blurb: "Compliance reviews, audits, findings." },
  "QA Escalation and Trend Reporting": { icon: Flame, blurb: "Escalation paths and trend reporting." },
  "QA Role Packet and Signoff": { icon: ListChecks, blurb: "Role packet and onboarding signoff." },
  "QA Training Journey Resources": { icon: BookOpen, blurb: "Resource packs per journey week." },
  "QA Reports, Exports, and Examples": { icon: Activity, blurb: "Example exports and report formats." },
  "Authorizations and Training Handoff References": { icon: Share2, blurb: "Handoffs to Auths, Clinical, Training." },
  "Needs Review - QA Adjacent": { icon: AlertTriangle, blurb: "Planning references. Not current SOPs." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText,
  "Training Resource": BookOpen,
  "Report/Export": Activity,
  "Role Packet": ListChecks,
  "Signoff": ListChecks,
  "Handoff Reference": Share2,
  "Needs Review": AlertTriangle,
};

const aiPrompts = [
  { q: "What does the QA team review today?", a: "QA reviews documentation and clinical/report quality, identifies missing items, corrections, documentation issues, and compliance risks, and reports recurring trends. QA does not replace Clinical supervision, Authorizations execution, Scheduling, Billing/RCM, HR, or State Director ownership." },
  { q: "Show the clinical report QA process.", a: "Open L2 Clinical Report QA Review Process SOP (PDF) plus the Clinical Report QA Reference Guide. Common findings and the journey checklist live in the Clinical Report QA category." },
  { q: "Show the treatment plan QA process.", a: "Open L2 Treatment Plan QA Current Operations (PDF) and the Treatment Plan QA Reference Guide. Common findings and the journey checklist live in the Treatment Plan QA category." },
  { q: "How do we handle missing items and fax follow-up?", a: "L2 Documentation Missing Item Follow-Up Process SOP and L2 Fax and External Document Chase Process SOP describe the current process. Reference guides and a CSV tracker example live under Missing Items and Fax Follow-Up." },
  { q: "When does QA escalate?", a: "L2 QA Escalation Review Process SOP defines the escalation paths. Escalate patterns or urgent issues to QA leadership, Clinical leadership, Operations, Authorizations, or State leadership as appropriate." },
  { q: "Where are the reports and exports?", a: "The QA Reports, Exports, and Examples category holds example CSV exports for the QA queue snapshot, clinical report QA log, and treatment plan QA log." },
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
              Resource Library · Quality Assurance · Current-State
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">QA Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Current-state SOPs, references, role packet, journey resources, and example exports for the QA team. QA SOPs are surfaced as PDFs only. Blossom OS is the training/resource platform - not the current QA operating system.
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

        {/* Video content gap */}
        {!isFiltering && <VideoGapCard />}

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

            {/* Operational Insights */}
            <Section title="Operational Insights" subtitle="Find SOPs, workflows, templates, or escalation instructions.">
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