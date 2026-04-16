import { useState } from "react";
import { Workflow, Layers, ListTodo, Building2 } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { OperationsControlBar } from "@/components/operations/OperationsControlBar";
import { OperationsPipelineView } from "@/components/operations/OperationsPipelineView";
import { QAQueueView } from "@/components/operations/QAQueueView";
import { ClinicsOverviewView } from "@/components/operations/ClinicsOverviewView";
import { cn } from "@/lib/utils";
import type { OpsLaneId } from "@/data/operations";

type ViewMode = "pipeline" | "qa-queue" | "clinics";

export default function Operations() {
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");

  const handleViewChange = (v: string) => {
    setActiveView(v);
    if (v === "qa") setViewMode("qa-queue");
    else if (v === "clinics") setViewMode("clinics");
    else setViewMode("pipeline");
  };

  const highlightLane: OpsLaneId | "blocked" | "all" =
    activeView === "all" || activeView === "clinics" ? "all" : (activeView as OpsLaneId | "blocked");

  return (
    <PageShell
      title="Operations"
      description="Unified lifecycle: Intake → Auth → Assessment → QA → Treatment Auth → Staffing → Start"
      icon={Workflow}
      actions={
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <ModeButton mode="pipeline" current={viewMode} onClick={setViewMode} icon={Layers} label="Pipeline" />
          <ModeButton mode="qa-queue" current={viewMode} onClick={setViewMode} icon={ListTodo} label="QA Queue" />
          <ModeButton mode="clinics" current={viewMode} onClick={setViewMode} icon={Building2} label="Clinics" />
        </div>
      }
    >
      <OperationsControlBar
        activeView={activeView}
        onActiveViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {viewMode === "pipeline" && (
        <OperationsPipelineView searchQuery={searchQuery} highlightLane={highlightLane} />
      )}
      {viewMode === "qa-queue" && <QAQueueView searchQuery={searchQuery} />}
      {viewMode === "clinics" && <ClinicsOverviewView searchQuery={searchQuery} />}
    </PageShell>
  );
}

function ModeButton({
  mode, current, onClick, icon: Icon, label,
}: {
  mode: ViewMode;
  current: ViewMode;
  onClick: (m: ViewMode) => void;
  icon: typeof Layers;
  label: string;
}) {
  return (
    <button
      onClick={() => onClick(mode)}
      className={cn(
        "px-2.5 h-7 text-xs font-medium rounded inline-flex items-center gap-1.5 transition-colors",
        current === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
