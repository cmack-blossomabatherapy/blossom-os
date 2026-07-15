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

interface AuthSection {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  adminOnly?: boolean;
}

const SECTIONS: AuthSection[] = [
  { id: "start_here",           tag: "auth_start_here",              title: "Start Here",                              subtitle: "Authorizations overview, role SOP, and department academy guide." },
  { id: "initial",              tag: "auth_initial",                 title: "Initial Authorization",                   subtitle: "Initial authorization SOPs, submission video, cover sheet, and payer request forms." },
  { id: "treatment",            tag: "auth_treatment",               title: "Treatment Authorization",                 subtitle: "Treatment authorization SOP, submission video, and IT/CT request forms." },
  { id: "reassessment",         tag: "auth_reassessment",            title: "Reassessment, Renewals & Expiring",       subtitle: "Reassessment, renewals, and expiring authorization SOPs." },
  { id: "pending_approved_denied", tag: "auth_pending_approved_denied", title: "Pending, Approved & Denied Auths",     subtitle: "Follow-up, approved updates, denials, escalation SOPs, and board exports." },
  { id: "docs_qa",              tag: "auth_docs_qa",                 title: "Documentation, QA & Submission Quality", subtitle: "Missing documentation and QA submission SOPs." },
  { id: "bcba_insurance",       tag: "auth_bcba_insurance",          title: "BCBA Assignment & Insurance",             subtitle: "BCBA assignment confirmation, primary/secondary insurance, and credentialing overlap references." },
  { id: "state_payer",          tag: "auth_state_payer",             title: "State & Payer References",                subtitle: "GA process, multi-state process, and payer references for NC, TN, and VA (Alliance, Partners, Trillium, Vaya, CareFirst, Medicaid, Cigna, Aetna, Anthem, BCBS, UHC, Wellcare, Amerigroup, TennCare, DMAS, and more)." },
  { id: "cr_utilization",       tag: "auth_cr_utilization",          title: "CentralReach & Utilization",              subtitle: "Cigna monthly authorizations, finding approved POS, RBT conversion permission, and utilization/analysis reports." },
  { id: "training",             tag: "auth_training",                title: "Training & Academy Resources",            subtitle: "Authorizations 4-week onboarding journey and academy references." },
  { id: "admin_qa",             tag: "auth_admin_qa",                title: "Needs Review / Admin QA",                 subtitle: "Unclear source media, credentialing overlap, and upload reconciliation.", adminOnly: true },
];

function isLeadershipRole(role: string): boolean {
  return [
    "super_admin","executive_leadership","operations_leadership","training_management",
    "authorizations_lead","director_of_rcm","rcm","state_director",
  ].includes(role);
}

export default function ResourceLibraryAuthorizations() {
  const { resources, loading } = useLibraryResources();
  const { role, activeState } = useOSRole();
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");

  const canSeeAdmin = isLeadershipRole(role);

  const authResources = useMemo(
    () => resources.filter((r) => {
      if (!isVisibleToRole(r, role as any, activeState)) return false;
      const depts = (r.departments ?? []).map((d) => d.toLowerCase());
      return depts.includes("authorizations") || (r.tags ?? []).some((t) => t?.startsWith("auth_"));
    }),
    [resources, role, activeState],
  );

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of authResources) for (const s of r.states ?? []) if (s) set.add(s);
    return Array.from(set).sort();
  }, [authResources]);

  const payerOptions = useMemo(() => {
    const payers = new Set<string>();
    const known = ["alliance","partners","trillium","vaya","carefirst","medicaid","cigna","aetna","anthem","bcbs","uhc","wellcare","amerigroup","tenncare","dmas","healthy_blue","amerihealth","sentara","wellpoint","healthkeepers"];
    for (const r of authResources) {
      for (const t of r.tags ?? []) {
        if (known.includes(t)) payers.add(t);
      }
    }
    return Array.from(payers).sort();
  }, [authResources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return authResources.filter((r) => {
      if (q) {
        const hay = [r.title, r.description, r.fileName, ...(r.tags ?? []), ...(r.states ?? [])]
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
      if (stateFilter !== "all") {
        if (!(r.states ?? []).includes(stateFilter)) return false;
      }
      if (payerFilter !== "all") {
        if (!(r.tags ?? []).includes(payerFilter)) return false;
      }
      return true;
    });
  }, [authResources, query, fileType, audience, stateFilter, payerFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const s of SECTIONS) map[s.id] = [];
    for (const r of filtered) {
      const tag = (r.tags ?? []).find((t) => t?.startsWith("auth_") && SECTIONS.some((s) => s.tag === t));
      const section = SECTIONS.find((s) => s.tag === tag);
      if (section) map[section.id].push(r);
    }
    return map;
  }, [filtered]);

  const totalVisible = filtered.length;
  const missing = authResources.filter((r) => !r.storagePath && !r.url).length;

  return (
    <OSShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Resource Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Authorizations Resources</h1>
          <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">
            Every current-state Authorizations SOP, payer reference, board export, walkthrough video, and
            utilization report — organized so the Authorizations team can find, open, or download exactly
            what they need.
          </p>
        </header>
        <LibraryTabs />

        <div className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search — initial, treatment, reassessment, denial, BCBA assignment, Alliance, Trillium, Vaya, CareFirst, Medicaid, CentralReach, utilization…"
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
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="h-9 w-[110px] rounded-xl text-[12.5px]"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {stateOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={payerFilter} onValueChange={setPayerFilter}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-[12.5px]"><SelectValue placeholder="Payer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payers</SelectItem>
              {payerOptions.map((p) => (
                <SelectItem key={p} value={p}>{p.replace(/_/g, " ")}</SelectItem>
              ))}
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
          <span className="rounded-full bg-muted px-2 py-0.5">{authResources.length} total in your view</span>
          {canSeeAdmin && missing > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{missing} needs upload repair</span>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            Loading Authorizations resources…
          </div>
        )}

        {!loading && SECTIONS.map((section) => {
          if (section.adminOnly && !canSeeAdmin) return null;
          const items = grouped[section.id] ?? [];
          if (items.length === 0 && (query || fileType !== "all" || audience !== "all" || stateFilter !== "all" || payerFilter !== "all")) return null;
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