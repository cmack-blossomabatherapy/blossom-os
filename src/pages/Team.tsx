import { useMemo, useState } from "react";
import { UsersRound } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { TeamControlBar, type TeamViewMode } from "@/components/team/TeamControlBar";
import { TeamDirectoryView } from "@/components/team/TeamDirectoryView";
import { TeamWorkloadView } from "@/components/team/TeamWorkloadView";
import { TeamOrgChart } from "@/components/team/TeamOrgChart";
import { TeamPerformanceView } from "@/components/team/TeamPerformanceView";
import { TeamDetailPanel } from "@/components/team/TeamDetailPanel";
import { mockTeam, filterTeamByView, findMember, type TeamSavedView } from "@/data/team";

export default function Team() {
  const [viewMode, setViewMode] = useState<TeamViewMode>("directory");
  const [activeView, setActiveView] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockTeam[0]?.id ?? null);

  const filtered = useMemo(() => {
    let list = filterTeamByView(mockTeam, activeView as TeamSavedView);
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
  }, [activeView, searchQuery]);

  const selected = selectedId ? findMember(selectedId) ?? null : null;

  return (
    <PageShell
      title="Team"
      description="Directory · workload · org structure · performance"
      icon={UsersRound}
    >
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
            <TeamOrgChart selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {viewMode === "performance" && (
            <TeamPerformanceView members={filtered} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
        <div>
          <TeamDetailPanel member={selected} onClose={() => setSelectedId(null)} />
        </div>
      </div>
    </PageShell>
  );
}
