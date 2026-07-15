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

interface CredSection {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  adminOnly?: boolean;
  leadershipOnly?: boolean;
}

const SECTIONS: CredSection[] = [
  { id: "start_here",     tag: "cred_start_here",     title: "Start Here",                                subtitle: "Resource guide, inventory, Credentialing Specialist role SOP, and status tracking SOP." },
  { id: "sops",           tag: "cred_sops",           title: "Core Credentialing SOPs",                   subtitle: "PDF SOPs the Credentialing team uses today, plus department context." },
  { id: "bcba_refs",      tag: "cred_bcba_refs",      title: "BCBA Credentialing & Roster References",   subtitle: "BCBA credentials export, uncredentialed BCBAs, and the BCBA/Credentialing boards video." },
  { id: "insurance",      tag: "cred_insurance",      title: "Insurance & Payer Credentialing",          subtitle: "Payer/insurance credentialing exports (starting with VA)." },
  { id: "status_tracking",tag: "cred_status_tracking",title: "Status Tracking & Follow-Up",              subtitle: "Status tracking SOP and the exports used to drive outstanding follow-up." },
  { id: "handoffs",       tag: "cred_handoffs",       title: "RCM, Auth & Clinical Handoffs",            subtitle: "Related BCBA assignment, oversight, and clinical supervisor references — handoff context only." },
  { id: "training",       tag: "cred_training",       title: "Training, Role Packet & Signoff",          subtitle: "Onboarding journey, current packet, role deep dive, job packet, 30/60/90, role SOP book, and acknowledgement." },
  { id: "videos",         tag: "cred_videos",         title: "Videos & Media",                            subtitle: "BCBA & Credentialing boards walkthrough." },
  { id: "admin_qa",       tag: "cred_admin_qa",       title: "Needs Review — Credentialing Adjacent",    subtitle: "Future planning, owner confirmation, disk audit, and admin/QA prompts.", adminOnly: true },
];

function isLeadershipRole(role: string): boolean {
  return [
    "super_admin","executive_leadership","operations_leadership","training_management",
    "doo","director_of_operations","state_director","assistant_state_director",
    "billing_finance","authorization_coordinator",
  ].includes(role);
}

function isAdminRole(role: string): boolean {
  return ["super_admin","training_management"].includes(role);
}

export default function ResourceLibraryCredentialing() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const canSeeLeadership = isLeadershipRole(role);
  const canSeeAdmin = isAdminRole(role);

  const credResources = useMemo(
    () => resources.filter((r) => {
      if (!isVisibleToRole(r, role as any, activeState)) return false;
      const depts = (r.departments ?? []).map((d) => d.toLowerCase());
      return depts.includes("credentialing") || (r.tags ?? []).some((t) => t?.startsWith("cred_"));
    }),
    [resources, role, activeState],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return credResources.filter((r) => {
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
  }, [credResources, query, fileType, audience, sectionFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const s of SECTIONS) map[s.id] = [];
    for (const r of filtered) {
      // A resource may belong to multiple sections (e.g. Status Tracking + BCBA refs).
      const sectionTags = (r.tags ?? []).filter((t) => t?.startsWith("cred_") && SECTIONS.some((s) => s.tag === t));
      for (const tag of sectionTags) {
        const section = SECTIONS.find((s) => s.tag === tag);
        if (section) map[section.id].push(r);
      }
    }
    return map;
  }, [filtered]);

  const totalVisible = filtered.length;

  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Credentialing Resources</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">
            Current-state Credentialing SOPs, BCBA/roster exports, payer references, walkthrough videos, and
            role packets — organized so the Credentialing team and trainees can find, open, or download exactly
            what they need.
          </p>
        </header>
        <LibraryTabs />

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search — status tracking, BCBA credentials, uncredentialed, VA insurance, assignment, packet…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-xl pl-9 text-[12.5px]"
            />
          </div>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="h-9 w-[240px] rounded-xl text-[12.5px]"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {SECTIONS.filter((s) => (!s.adminOnly || canSeeAdmin) && (!s.leadershipOnly || canSeeLeadership)).map((s) => (
                <SelectItem key={s.tag} value={s.tag}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl text-[12.5px]"><SelectValue placeholder="File type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="XLSX">XLSX</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
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
          <span className="rounded-full bg-muted px-2 py-0.5">{credResources.length} total in your view</span>
        </div>

        {loading && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            Loading Credentialing resources…
          </div>
        )}

        {!loading && SECTIONS.map((section) => {
          if (section.adminOnly && !canSeeAdmin) return null;
          if (section.leadershipOnly && !canSeeLeadership) return null;
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