import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { UserCheck } from "lucide-react";
import { ClientControlBar, ClientViewMode } from "@/components/clients/ClientControlBar";
import { ClientTableView } from "@/components/clients/ClientTableView";
import { ClientPipelineView } from "@/components/clients/ClientPipelineView";
import { ClientQueueView } from "@/components/clients/ClientQueueView";
import { mockClients } from "@/data/clients";

export default function Clients() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ClientViewMode>("table");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    let result = mockClients;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.childName.toLowerCase().includes(q) ||
          c.parentName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.bcba?.toLowerCase().includes(q) ?? false) ||
          (c.rbt?.toLowerCase().includes(q) ?? false)
      );
    }

    switch (activeView) {
      case "mine":
        result = result.filter((c) => c.intakeOwner === "Sarah M.");
        break;
      case "action":
        result = result.filter((c) => !c.bcba || c.stage === "Waiting on Consent Forms" || c.stage === "Schedule Assessment" || (c.stage === "Pending Initial Auth" && c.authStatus === "Not Submitted"));
        break;
      case "pending-start":
        result = result.filter((c) => c.stage === "Pending Start Date");
        break;
      case "staffing":
        result = result.filter((c) => c.stage === "Staffing Needed" || c.stage === "Restaffing Needed");
        break;
      case "active":
        result = result.filter((c) => c.stage === "Active");
        break;
      case "qa":
        result = result.filter((c) => c.stage === "In QA");
        break;
    }
    return result;
  }, [searchQuery, activeView]);

  return (
    <PageShell
      title="Clients"
      description="Client command center — full lifecycle from BCBA assignment to active services"
      icon={UserCheck}
    >
      <ClientControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {viewMode === "table" && (
        <ClientTableView clients={filteredClients} onSelect={(c) => navigate(`/clients/${c.id}`)} />
      )}
      {viewMode === "pipeline" && (
        <ClientPipelineView clients={filteredClients} onSelect={(c) => navigate(`/clients/${c.id}`)} />
      )}
      {viewMode === "queue" && (
        <ClientQueueView clients={filteredClients} onSelect={(c) => navigate(`/clients/${c.id}`)} />
      )}
    </PageShell>
  );
}
