import { useMemo, useState } from "react";
import { OSShell } from "@/pages/os/OSShell";
import { LibraryTabs } from "@/components/resource-library/LibraryTabs";
import { ResourceGrid } from "@/components/resource-library/ResourceListView";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { useOSRole } from "@/contexts/OSRoleContext";
import { isVisibleToRole } from "@/lib/resources/resourceData";
import { fileTypeLabel } from "@/lib/resources/librarySections";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchedSection {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  adminOnly?: boolean;
}

const SECTIONS: SchedSection[] = [
  { id: "start_here",          tag: "sched_start_here",           title: "Start Here",                                subtitle: "Scheduling resource inventory and collection index." },
  { id: "sops",                tag: "sched_sops",                 title: "Scheduling SOPs",                           subtitle: "Learner-facing Scheduling Coordinator SOPs — role, clinic, field, family communication, follow-up, and escalation." },
  { id: "cr_references",       tag: "sched_cr_references",        title: "CentralReach Scheduling References",        subtitle: "Appointment, cancellation, connection guides plus the CentralReach walkthrough video library." },
  { id: "assessment",          tag: "sched_assessment",           title: "Assessment & Evaluation Scheduling",         subtitle: "Assessment scheduling and evaluation timeline references." },
  { id: "client_therapist_rbt",tag: "sched_client_therapist_rbt", title: "Client, Therapist & RBT Scheduling",        subtitle: "Client, therapist, new client setup, RBT availability, pairing, and case staffing match." },
  { id: "changes",             tag: "sched_changes",              title: "Schedule Changes, Rescheduling & Conflicts", subtitle: "Change requests, rescheduling, conflicts, cancellation analysis, and cancellation report video." },
  { id: "coverage",            tag: "sched_coverage",             title: "Coverage, Open Hours & Hours Serviced",     subtitle: "Coverage, open hours, hours serviced, and the scheduling playbook / monitoring / optimization guides." },
  { id: "training",            tag: "sched_training",             title: "Training, Shadowing & Role Packet",         subtitle: "Onboarding journey, academy guides, shadow guides, role deep dive, job packet, binder, and signoff." },
  { id: "exports",             tag: "sched_exports",              title: "Board Exports & Examples",                  subtitle: "Snapshot examples — NC cancellations spreadsheet and appointment export summary. Reference only, not policy." },
  { id: "admin_qa",            tag: "sched_admin_qa",             title: "Needs Review — Scheduling Adjacent",        subtitle: "Staffing-adjacent playbooks, source docs, and admin audits held for trainer review.", adminOnly: true },
];

function isLeadershipRole(role: string): boolean {
  return [
    "super_admin","executive_leadership","operations_leadership","training_management",
    "doo","director_of_operations","state_director","assistant_state_director",
  ].includes(role);
}

export default function ResourceLibraryScheduling() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const canSeeAdmin = isLeadershipRole(role);

  const schedResources = useMemo(
    () => resources.filter((r) => {
      if (!isVisibleToRole(r, role as any, activeState)) return false;
      const depts = (r.departments ?? []).map((d) => d.toLowerCase());
      return depts.includes("scheduling") || (r.tags ?? []).some((t) => t?.startsWith("sched_"));
    }),
    [resources, role, activeState],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schedResources.filter((r) => {
      if (q) {
        const hay = [r.title, r.description, r.fileName, ...(r.tags ?? [])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fileType !== "all" && fileTypeLabel(r) !== fileType) return false;
      if (audience === "current") {
        if ((r.visibilityLevel === "leadership_only") || (r.visibilityLevel === "admin_only")) return false;
      }
      if (audience === "leadership") {
        if (!(r.visibilityLevel === "leadership_only" || r.visibilityLevel === "admin_only")) return false;
      }
      if (sectionFilter !== "all") {
        if (!(r.tags ?? []).includes(sectionFilter)) return false;
      }
      return true;
    });
  }, [schedResources, query, fileType, audience, sectionFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const s of SECTIONS) map[s.id] = [];
    for (const r of filtered) {
      const tag = (r.tags ?? []).find((t) => t?.startsWith("sched_") && SECTIONS.some((s) => s.tag === t));
      const section = SECTIONS.find((s) => s.tag === tag);
      if (section) map[section.id].push(r);
    }
    return map;
  }, [filtered]);

  const totalVisible = filtered.length;
  const missing = schedResources.filter((r) => !r.storagePath && !r.url).length;

  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Scheduling Resources</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">
            Every current-state Scheduling SOP, CentralReach reference, walkthrough video, and board export —
            organized so the Scheduling team and Scheduling trainees can find, open, or download exactly what
            they need.
          </p>
        </header>
        <LibraryTabs />

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search — CentralReach, cancellation, RBT availability, pairing, coverage, open hours, packet…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-xl pl-9 text-[12.5px]"
            />
          </div>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="h-9 w-[210px] rounded-xl text-[12.5px]"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {SECTIONS.filter((s) => !s.adminOnly || canSeeAdmin).map((s) => (
                <SelectItem key={s.tag} value={s.tag}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl text-[12.5px]"><SelectValue placeholder="File type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="XLSX">XLSX</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="Text">Text / MD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="h-9 w-[180px] rounded-xl text-[12.5px]"><SelectValue placeholder="Audience" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All audiences</SelectItem>
              <SelectItem value="current">Current staff-facing</SelectItem>
              <SelectItem value="leadership">Leadership / admin only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 text-[11.5px] text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">{totalVisible} visible</span>
          <span className="rounded-full bg-muted px-2 py-0.5">{schedResources.length} total in your view</span>
          {canSeeAdmin && missing > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{missing} needs upload repair</span>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            Loading Scheduling resources…
          </div>
        )}

        {!loading && SECTIONS.map((section) => {
          if (section.adminOnly && !canSeeAdmin) return null;
          const items = grouped[section.id] ?? [];
          if (items.length === 0 && (query || fileType !== "all" || audience !== "all" || sectionFilter !== "all")) return null;
          return (
            <section key={section.id} className={cn("space-y-3")}>
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">{section.title}</h2>
                <p className="text-[12px] text-muted-foreground">{section.subtitle}</p>
              </div>
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-4 text-[12px] text-muted-foreground">
                  No resources in this section yet for your role.
                </div>
              ) : (
                <ResourceGrid items={items} />
              )}
            </section>
          );
        })}
      </div>
    </OSShell>
  );
}