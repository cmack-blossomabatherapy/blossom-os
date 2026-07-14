import { useEffect, useMemo, useState } from "react";
import { UsersRound, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamControlBar, type TeamViewMode } from "@/components/team/TeamControlBar";
import { TeamDirectoryView } from "@/components/team/TeamDirectoryView";
import { TeamWorkloadView } from "@/components/team/TeamWorkloadView";
import { TeamOrgChart } from "@/components/team/TeamOrgChart";
import { TeamPerformanceView } from "@/components/team/TeamPerformanceView";
import { TeamDetailPanel } from "@/components/team/TeamDetailPanel";
import { TeamAdminPanel } from "@/components/team/TeamAdminPanel";
import { BulkProvisionDialog } from "@/components/team/BulkProvisionDialog";
import { filterTeamByView, type TeamSavedView } from "@/data/team";
import { useLiveTeam } from "@/hooks/useLiveTeam";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_META, type RoleMeta } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ROLE_GROUPS: RoleMeta["group"][] = [
  "Leadership",
  "Operations",
  "Pipeline",
  "Service",
  "Support",
  "People",
  "Legacy",
];

export default function Team() {
  const { isAdmin } = useAuth();
  const { members: liveTeam, loading: teamLoading, reload } = useLiveTeam();
  const [viewMode, setViewMode] = useState<TeamViewMode>("directory");
  const [activeView, setActiveView] = useState<string>("all");
  const [activeRoleGroup, setActiveRoleGroup] = useState<RoleMeta["group"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);

  useEffect(() => {
    if (!selectedId && liveTeam.length > 0) {
      setSelectedId(liveTeam[0].id);
    }
  }, [liveTeam, selectedId]);

  const filtered = useMemo(() => {
    let list = filterTeamByView(liveTeam, activeView as TeamSavedView);
    if (activeRoleGroup !== "all") {
      const labels = ROLE_META.filter((r) => r.group === activeRoleGroup).map((r) =>
        r.label.toLowerCase(),
      );
      const keys = ROLE_META.filter((r) => r.group === activeRoleGroup).map((r) => r.key);
      list = list.filter((m) => {
        const role = (m.role || "").toLowerCase();
        if (labels.some((l) => role.includes(l) || l.includes(role))) return true;
        // For live members carrying role keys
        const anyRoles = (m as unknown as { roles?: string[] }).roles ?? [];
        return anyRoles.some((r) => keys.includes(r as RoleMeta["key"]));
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeView, activeRoleGroup, searchQuery, liveTeam]);

  const selected = selectedId ? liveTeam.find((m) => m.id === selectedId) ?? null : null;
  const totalMembers = liveTeam.length;
  const totalActive = liveTeam.filter((m) => m.status === "Active").length;
  const totalRoles = ROLE_META.length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Premium hero — matches Admin Hub */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <UsersRound className="h-3.5 w-3.5" /> User Management
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your team, every role.</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              Directory, workload, org structure, performance — and full control over the {totalRoles} roles that power Blossom.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { l: "Total members", v: totalMembers || "—" },
              { l: "Active", v: totalActive || "—" },
              { l: "Role types", v: totalRoles },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
                <p className="text-2xl font-semibold">{s.v}</p>
                <p className="text-[11px] text-primary-foreground/85">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button variant="hero" size="sm" onClick={() => setProvisionOpen(true)}>
                <UserPlus className="h-4 w-4" /> Provision employees
              </Button>
            )}
            <Button asChild variant="heroOutline" size="sm">
              <Link to="/admin">Back to Admin Hub <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Role group filters — every group from ROLE_META */}
      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Filter by role group</p>
            <p className="text-xs text-muted-foreground/80">Every Blossom role, grouped by function.</p>
          </div>
          <span className="text-[11px] text-muted-foreground">{filtered.length} match{filtered.length === 1 ? "" : "es"}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <RoleChip active={activeRoleGroup === "all"} onClick={() => setActiveRoleGroup("all")}>
            All groups
          </RoleChip>
          {ROLE_GROUPS.map((g) => {
            const count = ROLE_META.filter((r) => r.group === g).length;
            return (
              <RoleChip key={g} active={activeRoleGroup === g} onClick={() => setActiveRoleGroup(g)}>
                {g} <span className="ml-1 opacity-60">{count}</span>
              </RoleChip>
            );
          })}
        </div>
        {activeRoleGroup !== "all" && (
          <div className="mt-3 flex flex-wrap gap-1">
            {ROLE_META.filter((r) => r.group === activeRoleGroup).map((r) => (
              <span key={r.key} className="rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                {r.label}
              </span>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="space-y-2 pb-2">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold uppercase tracking-wider text-foreground">Admin · Live members & roles</span>
              <span className="opacity-70">— assign roles, invite new team members</span>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setProvisionOpen(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Provision real employees
            </Button>
          </div>
          <TeamAdminPanel />
        </section>
      )}

      <TeamControlBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
        <div className="min-w-0">
          {viewMode === "directory" && (
            <TeamDirectoryView members={filtered} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "workload" && (
            <TeamWorkloadView members={filtered} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "org" && (
            <TeamOrgChart members={liveTeam} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "performance" && (
            <TeamPerformanceView members={filtered} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
        <div>
          <TeamDetailPanel member={selected} onClose={() => setSelectedId(null)} />
        </div>
      </div>

      <BulkProvisionDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        onComplete={() => {
          void reload();
        }}
      />
    </div>
  );
}

function RoleChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 h-7 text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-muted-foreground hover:text-foreground border-border/60 hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
