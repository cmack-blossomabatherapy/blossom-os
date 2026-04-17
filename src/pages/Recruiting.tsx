import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shared/PageShell";
import { RecruitingControlBar, type RecruitingViewMode } from "@/components/recruiting/RecruitingControlBar";
import { RecruitingMetricsBar } from "@/components/recruiting/RecruitingMetricsBar";
import { RecruitingPipelineView } from "@/components/recruiting/RecruitingPipelineView";
import { RecruitingTableView } from "@/components/recruiting/RecruitingTableView";
import { RecruitingQueueView } from "@/components/recruiting/RecruitingQueueView";
import type { CandidateRole, Candidate } from "@/data/recruiting";

const STUCK_DAYS = 10;

const filterFor = (view: string) => (c: Candidate) => {
  switch (view) {
    case "all":
      return true;
    case "new":
      return c.stage === "New Applicant" || c.stage === "Screening";
    case "interviewing":
      return c.stage === "Interview Scheduled" || c.stage === "Interview Completed" || c.stage === "Interview";
    case "offer":
      return ["Offer Sent", "Offer", "Offer Accepted"].includes(c.stage);
    case "onboarding":
      return ["Onboarding", "Background Check", "Orientation", "Training", "I9 / E-Verify", "Credentialing"].includes(c.stage);
    case "stuck":
      return c.daysInStage > STUCK_DAYS;
    case "ready":
      return c.stage === "Ready for Staffing" || c.stage === "Ready for Assignment";
    case "missing-data":
      return !c.interview && c.stage !== "New Applicant";
    default:
      return true;
  }
};

export default function Recruiting() {
  const [viewMode, setViewMode] = useState<RecruitingViewMode>("pipeline");
  const [role, setRole] = useState<CandidateRole>("RBT");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  const onSync = () => {
    setSyncing(true);
    toast.info("Apploi sync queued", {
      description: "Real Apploi integration will be wired in the next stage. For now this is a mock.",
    });
    setTimeout(() => setSyncing(false), 1200);
  };

  const filter = filterFor(activeView);

  return (
    <PageShell
      title="Recruiting"
      description="Apploi → Interview → Offer → Onboarding → Ready for Staffing"
      icon={Briefcase}
    >
      <RecruitingMetricsBar />
      <RecruitingControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        role={role}
        onRoleChange={setRole}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSync={onSync}
        syncing={syncing}
      />

      {viewMode === "pipeline" && (
        <RecruitingPipelineView role={role} searchQuery={searchQuery} filter={filter} />
      )}
      {viewMode === "queue" && (
        <RecruitingQueueView role={role} searchQuery={searchQuery} filter={filter} />
      )}
      {viewMode === "table" && (
        <RecruitingTableView role={role} searchQuery={searchQuery} filter={filter} />
      )}
    </PageShell>
  );
}
