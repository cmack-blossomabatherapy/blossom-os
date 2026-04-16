import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { Users } from "lucide-react";
import { LeadControlBar, ViewMode } from "@/components/leads/LeadControlBar";
import { LeadTableView } from "@/components/leads/LeadTableView";
import { LeadPipelineView } from "@/components/leads/LeadPipelineView";
import { LeadQueueView } from "@/components/leads/LeadQueueView";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { mockLeads, Lead } from "@/data/leads";

export default function Leads() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = useMemo(() => {
    let result = mockLeads;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.childName.toLowerCase().includes(q) ||
          l.parentName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      );
    }

    // Saved view filters
    switch (activeView) {
      case "mine":
        result = result.filter((l) => l.owner === "Sarah M.");
        break;
      case "attention":
        result = result.filter((l) => l.status === "New Lead" || l.status === "Missing Information" || l.status === "Can't Reach" || l.daysInStage >= 5);
        break;
      case "today":
        result = result.filter((l) => l.daysInStage === 0);
        break;
      case "stuck":
        result = result.filter((l) => l.daysInStage >= 3);
        break;
      case "vob":
        result = result.filter((l) => l.status === "Form Received" || l.status === "Sent to VOB");
        break;
    }

    return result;
  }, [searchQuery, activeView]);

  return (
    <PageShell
      title="Leads"
      description="Lead command center — track intake pipeline from first contact to VOB"
      icon={Users}
    >
      <LeadControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {viewMode === "table" && (
        <LeadTableView
          leads={filteredLeads}
          onSelectLead={setSelectedLead}
          selectedLeadId={selectedLead?.id}
        />
      )}
      {viewMode === "pipeline" && (
        <LeadPipelineView leads={filteredLeads} onSelectLead={setSelectedLead} />
      )}
      {viewMode === "queue" && (
        <LeadQueueView leads={filteredLeads} onSelectLead={setSelectedLead} />
      )}

      <LeadDetailPanel
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </PageShell>
  );
}
