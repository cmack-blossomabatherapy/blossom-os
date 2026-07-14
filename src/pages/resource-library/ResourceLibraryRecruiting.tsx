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

interface RecruitingSection {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  adminOnly?: boolean;
}

const SECTIONS: RecruitingSection[] = [
  { id: "start_here",             tag: "recruiting_start_here",             title: "Start Here",                                subtitle: "Recruiting department overview, role SOP, and current workflow." },
  { id: "candidate_pipeline",     tag: "recruiting_candidate_pipeline",     title: "Candidate Pipeline",                        subtitle: "Candidate intake, follow-up, and HireCare board exports." },
  { id: "job_posting",            tag: "recruiting_job_posting",            title: "Job Posting and Sourcing",                  subtitle: "Job posting SOP, Indeed, ZipRecruiter, ClickUp, Apploi guides and videos." },
  { id: "resume_review",          tag: "recruiting_resume_review",          title: "Resume Review",                             subtitle: "Screening resumes and prioritizing candidates." },
  { id: "interviews",             tag: "recruiting_interviews",             title: "Interviews",                                subtitle: "Interview scheduling, running interviews, and interview training video." },
  { id: "offers",                 tag: "recruiting_offers",                 title: "Offers and Hiring Handoff",                 subtitle: "Offer letters, hiring handoff to HR, and leadership-only offer letter templates." },
  { id: "background_onboarding",  tag: "recruiting_background_onboarding",  title: "Background Checks and Onboarding Handoff",  subtitle: "Background checks, onboarding/orientation handoff awareness, Viventium transfer." },
  { id: "state_kpi",              tag: "recruiting_state_kpi",              title: "State Recruiting Needs and KPIs",           subtitle: "State recruiting need review and Recruiting KPI academy." },
  { id: "training_playbooks",     tag: "recruiting_training_playbooks",     title: "Training, Shadowing, and Playbooks",        subtitle: "Recruiting onboarding journey, shadow guides, and the Recruiting playbook." },
  { id: "admin_qa",               tag: "recruiting_admin_qa",               title: "Needs Review / Admin QA",                   subtitle: "Unclear source media and admin reconciliation notes.", adminOnly: true },
];

function isLeadershipRole(role: string): boolean {
  return [
    "super_admin","executive_leadership","operations_leadership","training_management",
    "recruiting_lead","hr_lead","hr","state_director",
  ].includes(role);
}

export default function ResourceLibraryRecruiting() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");

  const canSeeAdmin = isLeadershipRole(role);

  const recruitingResources = useMemo(
    () => resources.filter((r) => {
      if (!isVisibleToRole(r, role as any, activeState)) return false;
      const depts = (r.departments ?? []).map((d) => d.toLowerCase());
      return depts.includes("recruiting") || (r.tags ?? []).some((t) => t?.startsWith("recruiting_"));
    }),
    [resources, role, activeState],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recruitingResources.filter((r) => {
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
      return true;
    });
  }, [recruitingResources, query, fileType, audience]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const s of SECTIONS) map[s.id] = [];
    for (const r of filtered) {
      const tag = (r.tags ?? []).find((t) => t?.startsWith("recruiting_") && SECTIONS.some((s) => s.tag === t));
      const section = SECTIONS.find((s) => s.tag === tag);
      if (section) map[section.id].push(r);
    }
    return map;
  }, [filtered]);

  const totalVisible = filtered.length;
  const missing = recruitingResources.filter((r) => !r.storagePath && !r.url).length;

  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Recruiting Resources</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">
            Every current-state Recruiting SOP, platform guide, academy walkthrough, and training video —
            organized so recruiters can find, open, or download exactly what they need.
          </p>
        </header>
        <LibraryTabs />

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Recruiting — candidate, Apploi, Indeed, ZipRecruiter, offer letter, background check…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-xl pl-9 text-[12.5px]"
            />
          </div>
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl text-[12.5px]"><SelectValue placeholder="File type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="XLSX">XLSX</SelectItem>
              <SelectItem value="DOCX">DOCX</SelectItem>
              <SelectItem value="Text">Text / MD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="h-9 w-[170px] rounded-xl text-[12.5px]"><SelectValue placeholder="Audience" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All audiences</SelectItem>
              <SelectItem value="current">Current staff-facing</SelectItem>
              <SelectItem value="leadership">Leadership / admin only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 text-[11.5px] text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">{totalVisible} visible</span>
          <span className="rounded-full bg-muted px-2 py-0.5">{recruitingResources.length} total in your view</span>
          {canSeeAdmin && missing > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{missing} needs upload repair</span>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            Loading Recruiting resources…
          </div>
        )}

        {!loading && SECTIONS.map((section) => {
          if (section.adminOnly && !canSeeAdmin) return null;
          const items = grouped[section.id] ?? [];
          if (items.length === 0 && (query || fileType !== "all" || audience !== "all")) return null;
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