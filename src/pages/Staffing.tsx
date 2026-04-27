import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { StaffingControlBar, type StaffingViewMode } from "@/components/staffing/StaffingControlBar";
import { StaffingQueueView } from "@/components/staffing/StaffingQueueView";
import { StaffingMatchingView } from "@/components/staffing/StaffingMatchingView";
import { StaffingDirectoryView } from "@/components/staffing/StaffingDirectoryView";
import { StaffingCapacityView } from "@/components/staffing/StaffingCapacityView";

export default function Staffing() {
  const [viewMode, setViewMode] = useState<StaffingViewMode>("queue");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PageShell title="Staffing" description="Match client demand to RBT supply" icon={UserPlus}>
      <StaffingControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {viewMode === "queue" && <StaffingQueueView searchQuery={searchQuery} onStartMatching={() => setViewMode("matching")} />}
      {viewMode === "matching" && <StaffingMatchingView searchQuery={searchQuery} />}
      {viewMode === "directory" && <StaffingDirectoryView searchQuery={searchQuery} activeView={activeView} />}
      {viewMode === "capacity" && <StaffingCapacityView />}
    </PageShell>
  );
}
