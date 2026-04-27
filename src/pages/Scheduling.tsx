import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { CalendarDays } from "lucide-react";
import { SchedulingControlBar, type SchedulingViewMode } from "@/components/scheduling/SchedulingControlBar";
import { SchedulingQueueView } from "@/components/scheduling/SchedulingQueueView";
import { SchedulingCalendarView } from "@/components/scheduling/SchedulingCalendarView";
import { SchedulingGridView } from "@/components/scheduling/SchedulingGridView";
import { SchedulingMatchingView } from "@/components/scheduling/SchedulingMatchingView";
import { allSchedulingClients, mockAssessments } from "@/data/scheduling";

export default function Scheduling() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<SchedulingViewMode>("queue");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allItems = useMemo(() => allSchedulingClients(), []);

  const filteredItems = useMemo(() => {
    let result = allItems;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.client.childName.toLowerCase().includes(q) ||
          (i.client.bcba?.toLowerCase().includes(q) ?? false) ||
          (i.client.rbt?.toLowerCase().includes(q) ?? false),
      );
    }
    switch (activeView) {
      case "unscheduled":
        result = result.filter((i) => i.status === "Unscheduled Assessment");
        break;
      case "scheduled":
        result = result.filter((i) => i.status === "Assessment Scheduled");
        break;
      case "pending-start":
        result = result.filter((i) => i.client.stage === "Pending Start Date");
        break;
      case "staffing":
        result = result.filter(
          (i) => i.client.stage === "Staffing Needed" || i.client.stage === "Restaffing Needed",
        );
        break;
      case "ready":
        result = result.filter((i) => i.status === "Pending Schedule");
        break;
      case "week":
        result = result.filter((i) => i.client.schedule.length > 0);
        break;
    }
    return result;
  }, [allItems, searchQuery, activeView]);

  const filteredAssessments = useMemo(() => {
    let result = mockAssessments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.clientName.toLowerCase().includes(q) || a.bcba.toLowerCase().includes(q),
      );
    }
    if (activeView === "unscheduled") result = result.filter((a) => a.status === "Unscheduled");
    if (activeView === "scheduled") result = result.filter((a) => a.status === "Scheduled");
    return result;
  }, [searchQuery, activeView]);

  const handleSelect = (clientId: string) => navigate(`/clients/${clientId}`);

  return (
    <PageShell
      title="Scheduling"
      description="Scheduling command center — assessments, weekly grids, and staff matching"
      icon={CalendarDays}
    >
      <SchedulingControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {viewMode === "queue" && (
        <SchedulingQueueView items={filteredItems} assessments={filteredAssessments} onSelect={handleSelect} />
      )}
      {viewMode === "calendar" && (
        <SchedulingCalendarView items={filteredItems} assessments={filteredAssessments} onSelect={handleSelect} />
      )}
      {viewMode === "grid" && <SchedulingGridView items={filteredItems} onSelect={handleSelect} />}
      {viewMode === "matching" && <SchedulingMatchingView items={filteredItems} onSelect={handleSelect} />}
    </PageShell>
  );
}
