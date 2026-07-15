import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Bookmark, Clock, ArrowRight, FileText, PlayCircle, ListChecks,
  ShieldCheck, Activity, ClipboardCheck, AlertTriangle, Users, MessageSquare,
  Share2, ChevronRight, BookOpen, Library, Star, Calendar, MapPin, TrendingUp,
  Award, Compass, Briefcase, GraduationCap, Building2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================================================
// State Director Resource Library — Current-State
// Aligned to the "FINAL - State Director Resource Library Upload - 2026-07-14".
// Files live in the private `state-director-resources` storage bucket; open
// actions resolve via signed URLs. Blossom OS is the training/resource/reporting
// layer for State Directors. Current tools (CentralReach, Monday, Viventium,
// Outlook/Teams, phone systems) remain today's operating process.
// =============================================================================

const BUCKET = "state-director-resources";
const TODAY = "2026-07-14";

type ResourceType =
  | "SOP" | "Training Resource" | "Video" | "Report/Export"
  | "Role Packet" | "Signoff" | "Handoff Reference"
  | "Current Operations" | "Needs Review" | "Mentor Program";

type ResourceFormat = "PDF" | "CSV" | "XLSX" | "DOCX" | "Video" | "Markdown";

type Category =
  | "State Director Start Here"
  | "State Director SOPs"
  | "Training Academy Resources"
  | "Videos and Walkthroughs"
  | "State Health, Growth, Scorecards, and KPIs"
  | "State Operations, Daily/Weekly Rhythm, and Escalations"
  | "Growth, Marketing, BD, and Community Presence"
  | "Intake, Recruiting, Assistant, and VA Handoff References"
  | "Clinical, BCBA, RBT, Case, and Family Escalations"
  | "Scheduling, Staffing, Authorizations, and QA Handoff References"
  | "State-Specific References"
  | "Regional State Director Mentor Program"
  | "Role Packet and Signoff"
  | "Reports, Exports, and Examples"
  | "Needs Review - State Director Adjacent";

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
  tags?: string[];
  needsReview?: boolean;
  planningOnly?: boolean;
  journeyWeek?: 1 | 2 | 3 | 4;
  exampleOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Curated / featured overrides. Any file present in the storage bucket that is
// NOT explicitly overridden here is auto-classified below so every uploaded
// State Director file remains visible, searchable, and openable.
// ---------------------------------------------------------------------------

const CURATED: Resource[] = [
  // 1. Start Here
  { id: "start-overview", title: "State Director Success System — Overview",
    description: "Current-state overview of the State Director role at Blossom, what State Directors own, and boundaries with departments and CentralReach.",
    category: "State Director Start Here", type: "Training Resource", format: "PDF",
    storagePath: "001 - state-director-success-system-overview.pdf",
    featured: true, minutes: 8, updated: TODAY, journeyWeek: 1,
    tags: ["State Director", "Start Here", "Current Operations"] },
  { id: "start-role-sop", title: "State Director — Role SOP (L1)",
    description: "L1 role SOP: what State Directors own for state health, growth, hours serviced, escalations, and cross-department follow-through.",
    category: "State Director Start Here", type: "SOP", format: "PDF",
    storagePath: "L1-State-Director-Role-SOP.pdf",
    featured: true, minutes: 10, updated: TODAY, journeyWeek: 1,
    tags: ["State Director", "Role SOP"] },
  { id: "start-30-60-90", title: "State Director 30 / 60 / 90 / 180 Day Plan",
    description: "Ramp plan for a new State Director: first 30, 60, 90, and 180 days.",
    category: "State Director Start Here", type: "Training Resource", format: "PDF",
    storagePath: "004 - state-director-30-60-90-180-day-plan.pdf",
    featured: true, minutes: 12, updated: TODAY, journeyWeek: 1,
    tags: ["State Director", "Onboarding"] },
  { id: "start-first-30", title: "State Director — First 30 Days Guide",
    description: "Practical guide to the first 30 days in the State Director seat.",
    category: "State Director Start Here", type: "Training Resource", format: "PDF",
    storagePath: "006 - state-director-first-30-days-guide.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 1, tags: ["Onboarding"] },
  { id: "start-first-180", title: "State Director — First 180 Days Guide",
    description: "Extended ramp for the first six months in the State Director seat.",
    category: "State Director Start Here", type: "Training Resource", format: "PDF",
    storagePath: "008 - state-director-first-180-days-guide.pdf",
    minutes: 12, updated: TODAY, journeyWeek: 4, tags: ["Onboarding"] },
  { id: "start-full-packet", title: "State Director — Full Training Packet (Print)",
    description: "Printable master packet of the current State Director training modules.",
    category: "State Director Start Here", type: "Training Resource", format: "PDF",
    storagePath: "00_PRINT_ME_Full_State_Director_Training_Packet.pdf",
    featured: true, minutes: 30, updated: TODAY,
    tags: ["Print", "Training Packet"] },

  // 2. Core SOPs
  { id: "sop-assistant", title: "L1 Assistant State Director — Role SOP",
    description: "Role SOP for Assistant State Directors — supports the State Director on state execution.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L1-Assistant-State-Director-Role-SOP.pdf",
    minutes: 8, updated: TODAY, tags: ["Assistant State Director"] },
  { id: "sop-regional", title: "L1 Regional State Director — Role SOP",
    description: "Regional State Director role SOP — mentor and oversight role for state leaders.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L1-Regional-State-Director-Role-SOP.pdf",
    minutes: 8, updated: TODAY, tags: ["Regional State Director", "Mentor Program"] },
  { id: "sop-kpi", title: "L1 KPIs — Current Operations",
    description: "Current-state KPI SOP used for state scorecards.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L1-KPIs-Current-Operations.pdf",
    featured: true, minutes: 6, updated: TODAY, tags: ["KPI", "Scorecard"] },
  { id: "sop-scorecards", title: "L1 Scorecards — Current Operations",
    description: "Current-state scorecards SOP for weekly state review.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L1-Scorecards-Current-Operations.pdf",
    featured: true, minutes: 6, updated: TODAY, tags: ["Scorecard", "Weekly State Review"] },
  { id: "sop-weekly-ops", title: "L2 Weekly Operations — Current Operations",
    description: "Weekly operating rhythm SOP for State Directors.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Weekly-Operations-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Weekly Operations", "Weekly State Review"] },
  { id: "sop-daily-ops", title: "L2 Daily Operations — Current Operations",
    description: "Daily operating rhythm SOP for State Directors.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Daily-Operations-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Daily Operations"] },
  { id: "sop-escalations", title: "L2 Escalations — Current Operations",
    description: "Escalation SOP used for state-level issues touching families, staff, and cases.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Escalations-Current-Operations.pdf",
    featured: true, minutes: 6, updated: TODAY, tags: ["Escalation"] },
  { id: "sop-inter", title: "L2 Interdepartment Communication — Current Operations",
    description: "SOP for interdepartment communication owned by the State Director seat.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Interdepartment-Communication-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Interdepartment Communication"] },
  { id: "sop-reporting", title: "L2 Reporting — Current Operations",
    description: "Reporting SOP — current-state exports and reports available to State Directors.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Reporting-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Reports"] },
  { id: "sop-ops-audit", title: "L2 Operations Audits — Current Operations",
    description: "Operational audit SOP for State Directors to check state health.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Operations-Audits-Current-Operations.pdf",
    minutes: 6, updated: TODAY, tags: ["Audit", "State Health"] },
  { id: "sop-open-hours", title: "L2 Open Hours & Coverage Review — SOP",
    description: "SOP for reviewing open hours and coverage risk across the state.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Open-Hours-and-Coverage-Review-Process-SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["Hours Serviced", "Coverage"] },
  { id: "sop-new-lead", title: "L2 New Lead / Intake — Process SOP",
    description: "State Director reference for the new lead intake process (Intake owns execution).",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-New-Lead-Intake-Process-SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["Intake", "Handoff"] },
  { id: "sop-clin-esc", title: "L2 Clinical Escalation & Case Review — SOP",
    description: "Reference SOP for clinical escalations and case review coordination.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Clinical-Escalation-and-Case-Review-Process-SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["Clinical Escalation", "BCBA", "Case Review"] },
  { id: "sop-fam-clin-comm", title: "L2 Family / Clinical Communication — SOP",
    description: "SOP for family and clinical communication touching State Director awareness.",
    category: "State Director SOPs", type: "SOP", format: "PDF",
    storagePath: "L2-Family-Clinical-Communication-Process-SOP.pdf",
    minutes: 6, updated: TODAY, tags: ["Family Escalation", "Parent Escalation"] },

  // Signoffs
  { id: "signoff-sd", title: "State Director — Role Signoff",
    description: "Signoff completed at the end of the State Director onboarding journey.",
    category: "Role Packet and Signoff", type: "Signoff", format: "PDF",
    storagePath: "10 - State Director - Role Signoff.pdf",
    featured: true, minutes: 3, updated: TODAY, journeyWeek: 4,
    tags: ["State Director", "Signoff"] },
  { id: "signoff-sd-alt", title: "State Director — Signoff (Alternate)",
    description: "Alternate copy of the State Director signoff.",
    category: "Role Packet and Signoff", type: "Signoff", format: "PDF",
    storagePath: "10 - State Director - Signoff.pdf",
    minutes: 3, updated: TODAY, journeyWeek: 4, tags: ["Signoff"] },
  { id: "signoff-regional", title: "Regional State Director — Signoff",
    description: "Signoff completed by Regional State Directors.",
    category: "Role Packet and Signoff", type: "Signoff", format: "PDF",
    storagePath: "11 - Regional State Director - Signoff.pdf",
    minutes: 3, updated: TODAY, tags: ["Regional State Director", "Signoff"] },
  { id: "signoff-asd", title: "Assistant State Director — Signoff",
    description: "Signoff completed by Assistant State Directors.",
    category: "Role Packet and Signoff", type: "Signoff", format: "PDF",
    storagePath: "12 - Assistant State Director - Signoff.pdf",
    minutes: 3, updated: TODAY, tags: ["Assistant State Director", "Signoff"] },

  // Featured playbooks
  { id: "pb-state-health", title: "State Health Playbook",
    description: "Operational playbook for reading and defending state health.",
    category: "State Health, Growth, Scorecards, and KPIs", type: "Training Resource", format: "PDF",
    storagePath: "07 Operational Playbooks - 124 - state-health-playbook.pdf",
    featured: true, minutes: 12, updated: TODAY, journeyWeek: 1,
    tags: ["State Health", "Scorecard"] },
  { id: "pb-kpi", title: "KPI Playbook",
    description: "How State Directors read the KPI scorecards used weekly.",
    category: "State Health, Growth, Scorecards, and KPIs", type: "Training Resource", format: "PDF",
    storagePath: "07 Operational Playbooks - 131 - kpi-playbook.pdf",
    featured: true, minutes: 10, updated: TODAY, journeyWeek: 4,
    tags: ["KPI", "Scorecard"] },
  { id: "pb-util", title: "Utilization Playbook",
    description: "Utilization mindset and operating playbook for defending hours serviced.",
    category: "State Health, Growth, Scorecards, and KPIs", type: "Training Resource", format: "PDF",
    storagePath: "07 Operational Playbooks - 125 - utilization-playbook.pdf",
    minutes: 10, updated: TODAY, journeyWeek: 2, tags: ["Utilization", "Hours Serviced"] },

  // Mentor program featured
  { id: "mentor-handbook", title: "State Director — Mentor Handbook",
    description: "Handbook for Regional State Directors mentoring State Directors.",
    category: "Regional State Director Mentor Program", type: "Mentor Program", format: "PDF",
    storagePath: "002 - state-director-mentor-handbook.pdf",
    featured: true, minutes: 15, updated: TODAY,
    tags: ["Regional State Director", "Mentor Program"] },
  { id: "mentee-handbook", title: "State Director — Mentee Handbook",
    description: "Handbook for mentees inside the Regional State Director program.",
    category: "Regional State Director Mentor Program", type: "Mentor Program", format: "PDF",
    storagePath: "003 - state-director-mentee-handbook.pdf",
    minutes: 12, updated: TODAY, tags: ["Mentor Program"] },
  { id: "mentor-roadmap", title: "Regional State Director — Roadmap Packet",
    description: "Full Regional State Director roadmap packet (print).",
    category: "Regional State Director Mentor Program", type: "Mentor Program", format: "PDF",
    storagePath: "00_PRINT_ME_Gary_Regional_State_Director_Roadmap_Packet.pdf",
    featured: true, minutes: 25, updated: TODAY,
    tags: ["Regional State Director", "Mentor Program"] },
];

// ---------------------------------------------------------------------------
// Auto-classification for uncurated files from the bucket
// ---------------------------------------------------------------------------

const STATE_PREFIXES = ["Georgia", "Maryland", "North Carolina", "Tennessee", "Virginia"];

function inferFormat(name: string): ResourceFormat | undefined {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "PDF";
  if (n.endsWith(".csv")) return "CSV";
  if (n.endsWith(".xlsx")) return "XLSX";
  if (n.endsWith(".docx")) return "DOCX";
  if (n.endsWith(".md")) return "Markdown";
  if (n.endsWith(".mp4") || n.endsWith(".mov") || n.endsWith(".webm")) return "Video";
  return undefined;
}

function prettyTitle(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  // Strip leading numeric prefixes like "013 - " and " - 02 Source Document -"
  let t = base
    .replace(/^\d{2,3}\s*[-_.]\s*/, "")
    .replace(/^\d{2}\s+/, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/\bpdf\b|\bcsv\b|\bxlsx\b|\bdocx\b|\bmp4\b/gi, "").trim();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function classify(name: string): { category: Category; type: ResourceType; tags: string[]; needsReview?: boolean; planningOnly?: boolean; exampleOnly?: boolean } {
  const n = name.toLowerCase();
  const fmt = inferFormat(name);
  const tags: string[] = ["State Director", "Current Operations"];

  // State-specific
  const state = STATE_PREFIXES.find((s) => name.startsWith(s));
  if (state) {
    tags.push(state);
    return { category: "State-Specific References", type: "Current Operations", tags };
  }

  // Videos
  if (fmt === "Video") {
    return { category: "Videos and Walkthroughs", type: "Video", tags: [...tags, "Video"] };
  }

  // Markdown / planning references
  if (fmt === "Markdown") {
    return { category: "Needs Review - State Director Adjacent", type: "Needs Review", tags, needsReview: true, planningOnly: true };
  }

  // Reports/exports/examples
  if (fmt === "CSV" || fmt === "XLSX" || n.includes("report") || n.includes("export") || n.includes("audit")) {
    return { category: "Reports, Exports, and Examples", type: "Report/Export", tags: [...tags, "Report"], exampleOnly: true };
  }

  // Role packet / signoff
  if (n.includes("signoff") || n.includes("role packet") || n.includes("role deep dive") || n.includes("packet.pdf") || n.startsWith("print_me_")) {
    return { category: "Role Packet and Signoff", type: "Role Packet", tags: [...tags, "Role Packet"] };
  }

  // Mentor program
  if (n.includes("mentor") || n.includes("mentee") || n.includes("regional") || n.includes("gary_") || n.startsWith("gary ") || n.includes("shadow")) {
    return { category: "Regional State Director Mentor Program", type: "Mentor Program", tags: [...tags, "Mentor Program"] };
  }

  // SOPs (L1-/L2- naming) and non state-specific
  if (/^l[12][-_ ]/i.test(name)) {
    return { category: "State Director SOPs", type: "SOP", tags: [...tags, "SOP"] };
  }

  // Scorecards / KPIs / state health / hours
  if (n.includes("scorecard") || n.includes("kpi") || n.includes("state-health") || n.includes("state health") || n.includes("hours") || n.includes("utilization")) {
    return { category: "State Health, Growth, Scorecards, and KPIs", type: "Training Resource", tags: [...tags, "Scorecard", "KPI"] };
  }

  // Growth / BD / marketing / community
  if (n.includes("growth") || n.includes("marketing") || n.includes("bd") || n.includes("business-development") || n.includes("community")) {
    return { category: "Growth, Marketing, BD, and Community Presence", type: "Training Resource", tags: [...tags, "Growth", "Business Development"] };
  }

  // Intake/Recruiting/Assistant/VA handoffs
  if (n.includes("intake") || n.includes("recruit") || n.includes("assistant") || n.includes("-va-") || n.includes(" va ") || n.includes("orientation") || n.includes("candidate") || n.includes("interview") || n.includes("hiring")) {
    return { category: "Intake, Recruiting, Assistant, and VA Handoff References", type: "Handoff Reference", tags: [...tags, "Intake", "Recruiting"] };
  }

  // Clinical / BCBA / RBT / family / parent escalations
  if (n.includes("bcba") || n.includes("rbt") || n.includes("clinical") || n.includes("family") || n.includes("parent") || n.includes("case-review") || n.includes("case review")) {
    return { category: "Clinical, BCBA, RBT, Case, and Family Escalations", type: "Handoff Reference", tags: [...tags, "BCBA", "RBT", "Family Escalation"] };
  }

  // Scheduling / Staffing / Auth / QA
  if (n.includes("schedul") || n.includes("staffing") || n.includes("auth") || n.includes("qa") || n.includes("coverage") || n.includes("cancel") || n.includes("pairing") || n.includes("progress-report")) {
    return { category: "Scheduling, Staffing, Authorizations, and QA Handoff References", type: "Handoff Reference", tags: [...tags, "Scheduling", "Staffing", "Authorizations", "QA"] };
  }

  // Operations / rhythm / escalations / weekly
  if (n.includes("weekly") || n.includes("meeting") || n.includes("escalation") || n.includes("operational") || n.includes("cross-department") || n.includes("prioritization") || n.includes("accountability")) {
    return { category: "State Operations, Daily/Weekly Rhythm, and Escalations", type: "Training Resource", tags: [...tags, "Weekly State Review", "Escalation"] };
  }

  // Default → Training Academy Resources
  return { category: "Training Academy Resources", type: "Training Resource", tags };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const categoryMeta: Record<Category, { icon: typeof FileText; blurb: string }> = {
  "State Director Start Here": { icon: Star, blurb: "Orientation, role SOP, ramp plans, and the master packet." },
  "State Director SOPs": { icon: FileText, blurb: "Current-state State Director SOPs (PDF only)." },
  "Training Academy Resources": { icon: BookOpen, blurb: "Guides staged into the State Director journey." },
  "Videos and Walkthroughs": { icon: PlayCircle, blurb: "CentralReach and Monday walkthroughs referenced today." },
  "State Health, Growth, Scorecards, and KPIs": { icon: TrendingUp, blurb: "State health, growth, scorecards, and KPI playbooks." },
  "State Operations, Daily/Weekly Rhythm, and Escalations": { icon: Activity, blurb: "Daily/weekly operating rhythm and escalation flow." },
  "Growth, Marketing, BD, and Community Presence": { icon: MapPin, blurb: "State-level growth, BD, and community presence." },
  "Intake, Recruiting, Assistant, and VA Handoff References": { icon: Briefcase, blurb: "Handoff references — Intake / Recruiting / Assistant / VA." },
  "Clinical, BCBA, RBT, Case, and Family Escalations": { icon: ShieldCheck, blurb: "Clinical, BCBA, RBT, case, and family escalation references." },
  "Scheduling, Staffing, Authorizations, and QA Handoff References": { icon: Share2, blurb: "Handoff references — Scheduling / Staffing / Auth / QA." },
  "State-Specific References": { icon: MapPin, blurb: "GA · MD · NC · TN · VA state-specific references." },
  "Regional State Director Mentor Program": { icon: Compass, blurb: "Mentor and mentee resources for the RSD program." },
  "Role Packet and Signoff": { icon: ListChecks, blurb: "Role packets and onboarding signoff PDFs." },
  "Reports, Exports, and Examples": { icon: ClipboardCheck, blurb: "Example exports and reports — not a live data source." },
  "Needs Review - State Director Adjacent": { icon: AlertTriangle, blurb: "Planning references. Not current SOPs." },
};

const typeIcon: Record<ResourceType, typeof FileText> = {
  SOP: FileText, "Training Resource": BookOpen, "Video": PlayCircle,
  "Report/Export": Activity, "Role Packet": ListChecks, "Signoff": ListChecks,
  "Handoff Reference": Share2, "Current Operations": ShieldCheck,
  "Needs Review": AlertTriangle, "Mentor Program": Award,
};

// ---------------------------------------------------------------------------
// Signed URL resolver
// ---------------------------------------------------------------------------

async function openResource(r: Resource) {
  if (!r.storagePath) {
    toast.info("Reference item — see linked SOPs and guides.");
    return;
  }
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(r.storagePath, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Unable to open file. Please try again.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  } catch {
    toast.error("Unable to open file. Please try again.");
  }
}

function formatDate(s: string) {
  try { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return s; }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OSStateDirectorResources() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set(["start-role-sop", "sop-kpi", "sop-scorecards"]));
  const [dynamic, setDynamic] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch every file from the bucket. Any file not already covered by the
  // curated overrides gets auto-classified so nothing goes missing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
        if (error || !data) { setLoading(false); return; }
        const curatedPaths = new Set(CURATED.map((r) => r.storagePath).filter(Boolean));
        const extras: Resource[] = data
          .filter((o) => o.name && !curatedPaths.has(o.name))
          .map((o, idx) => {
            const info = classify(o.name);
            const fmt = inferFormat(o.name);
            const isSop = info.category === "State Director SOPs";
            // Enforce SOP category = PDF only
            if (isSop && fmt !== "PDF") {
              info.category = "Training Academy Resources";
              info.type = "Training Resource";
            }
            return {
              id: `auto-${idx}-${o.name.slice(0, 40)}`,
              title: prettyTitle(o.name),
              description: `${info.category} · Uploaded ${TODAY}. Current-state resource — open to view.`,
              category: info.category,
              type: info.type,
              format: fmt,
              storagePath: o.name,
              minutes: fmt === "Video" ? 8 : 6,
              updated: TODAY,
              tags: info.tags,
              needsReview: info.needsReview,
              planningOnly: info.planningOnly,
              exampleOnly: info.exampleOnly,
            } as Resource;
          });
        if (!cancelled) setDynamic(extras);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const resources = useMemo(() => [...CURATED, ...dynamic], [dynamic]);

  const toggleSave = (id: string) => setSaved((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (activeCategory && r.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [r.title, r.description, r.category, r.type, r.owner ?? "", ...(r.tags ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [resources, query, activeCategory]);

  const featured = useMemo(() => resources.filter((r) => r.featured), [resources]);
  const isFiltering = query.trim().length > 0 || activeCategory !== null;

  return (
    <OSShell rightRail={<ResourceRail total={resources.length} saved={saved.size} sopCount={resources.filter((r) => r.category === "State Director SOPs").length} onClearFilters={() => { setActiveCategory(null); setQuery(""); }} />}>
      <div className="space-y-8 pb-12 animate-fade-in">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Library className="h-3 w-3" /> Resource Library · State Leadership · State Director · Current-State
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">State Director Resources</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Current-state resources for State Directors — state health, growth, scorecards, KPIs, weekly rhythm, escalations, cross-department handoffs, state-specific references, and the Regional State Director mentor program. Current tools (CentralReach, Monday, Viventium, Outlook/Teams, phone systems) remain today's operating process — Blossom OS organizes access, training, and visibility.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved ({saved.size})
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/training"><GraduationCap className="mr-1.5 h-3.5 w-3.5" /> State Director Training Academy</Link>
            </Button>
          </div>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search state health, hours serviced, growth, scorecard, assistant, VA, BCBA, RBT, family escalation, regional…"
            className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isFiltering && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {activeCategory && <Chip onClear={() => setActiveCategory(null)}>{activeCategory}</Chip>}
              {query && <Chip onClear={() => setQuery("")}>"{query}"</Chip>}
              <span className="text-xs text-muted-foreground tabular-nums">
                {filtered.length} resource{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {loading && !dynamic.length && (
          <p className="text-xs text-muted-foreground">Loading resources from bucket…</p>
        )}

        {isFiltering ? (
          <FilteredView resources={filtered} saved={saved} onToggleSave={toggleSave} />
        ) : (
          <>
            <Section title="Featured State Director resources" subtitle="Highest-priority references for the State Director seat.">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => (
                  <FeaturedCard key={r.id} r={r} saved={saved.has(r.id)} onToggleSave={() => toggleSave(r.id)} />
                ))}
              </div>
            </Section>

            <Section title="Resource categories" subtitle="Organized to mirror the current State Director operating model.">
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

            <JourneyRoadmap resources={resources} />
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
          role="button" tabIndex={0}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleSave(); } }}
          className={cn("grid h-7 w-7 place-items-center rounded-full border transition-colors",
            saved ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-muted-foreground hover:text-foreground")}
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
        </div>
      </div>
      <span
        role="button" tabIndex={0}
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

function JourneyRoadmap({ resources }: { resources: Resource[] }) {
  const weeks: { n: 1 | 2 | 3 | 4; title: string; blurb: string }[] = [
    { n: 1, title: "Role, State Health, and Current Systems", blurb: "State Director seat, state health, current tools, and rhythm." },
    { n: 2, title: "Growth, Intake, Recruiting, Assistant/VA", blurb: "State growth, BD, community presence, and support-role visibility." },
    { n: 3, title: "Clinical, Family, Case, Coverage Risk", blurb: "BCBA/RBT oversight, family/clinical escalations, coverage risks." },
    { n: 4, title: "Weekly Review, KPIs, Reports, Mentor", blurb: "Weekly state review, scorecards, reports, mentor materials, and signoff." },
  ];
  return (
    <Section title="State Director 4-Week Journey — Attached Resources" subtitle="Attached / staged without changing the existing live State Director journey.">
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
                  <p className="text-[11px] text-muted-foreground">Staged in the category catalog — attach in the Academy without altering the live journey.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ResourceRail({ total, saved, sopCount, onClearFilters }: { total: number; saved: number; sopCount: number; onClearFilters: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your library</p>
        <div className="mt-3 space-y-2">
          <RailStat icon={Bookmark} label="Saved resources" value={saved} />
          <RailStat icon={FileText} label="Resources total" value={total} />
          <RailStat icon={ShieldCheck} label="SOP PDFs" value={sopCount} />
        </div>
        <button onClick={onClearFilters} className="mt-4 w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted">
          Reset filters
        </button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Boundaries</p>
        <p className="mt-2 text-xs text-muted-foreground">
          State Directors own state health, growth, hours serviced, and escalations. They do not become the routine execution owner for Intake, Recruiting, Auth, Scheduling, Staffing, QA, RCM, Payroll, or Credentialing.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System of record</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Blossom OS is the training / resource / reporting layer. CentralReach, Monday, Viventium, Outlook/Teams, and current phone systems remain today's operating tools.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Related</p>
        <div className="mt-2 space-y-1.5 text-xs">
          <RailLink to="/training" icon={GraduationCap}>State Director Training Academy</RailLink>
          <RailLink to="/reports" icon={FileText}>State Reports</RailLink>
          <RailLink to="/state-operations" icon={MapPin}>State Dashboard</RailLink>
          <RailLink to="/ops/state-escalations" icon={AlertTriangle}>State Escalations</RailLink>
          <RailLink to="/marketing/state-growth" icon={TrendingUp}>Growth in State</RailLink>
          <RailLink to="/ops/tasks" icon={ClipboardCheck}>Assistant / VA Tasks</RailLink>
          <RailLink to="/resource-library" icon={Building2}>All Resource Libraries</RailLink>
          <RailLink to="/organizational-chart" icon={Users}>Org Chart</RailLink>
          <RailLink to="/home" icon={Star}>Home</RailLink>
          <RailLink to="/ai/assistant" icon={MessageSquare}>Ask Blossom</RailLink>
        </div>
      </div>
    </div>
  );
}

function RailStat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function RailLink({ to, icon: Icon, children }: { to: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-foreground transition-colors hover:bg-muted/60">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="flex-1 truncate">{children}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </Link>
  );
}