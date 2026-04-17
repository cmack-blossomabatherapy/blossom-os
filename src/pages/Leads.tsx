import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { Users } from "lucide-react";
import { LeadControlBar, ViewMode } from "@/components/leads/LeadControlBar";
import { LeadTableView } from "@/components/leads/LeadTableView";
import { LeadPipelineView } from "@/components/leads/LeadPipelineView";
import { LeadQueueView } from "@/components/leads/LeadQueueView";
import { LeadKpiStrip } from "@/components/leads/LeadKpiStrip";
import { LeadBulkActionBar } from "@/components/leads/LeadBulkActionBar";
import { LeadFilters } from "@/components/leads/LeadFilterPopover";
import { mockLeads, kpiFilters, KpiKey } from "@/data/leads";

const emptyFilters: LeadFilters = { states: [], sources: [], owners: [], insurances: [], priorities: [] };

export default function Leads() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<LeadFilters>(emptyFilters);
  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filterOptions = useMemo(() => ({
    states: Array.from(new Set(mockLeads.map((l) => l.state))).sort(),
    sources: Array.from(new Set(mockLeads.map((l) => l.source))).sort(),
    owners: Array.from(new Set(mockLeads.map((l) => l.owner))).sort(),
    insurances: Array.from(new Set(mockLeads.map((l) => l.insurance))).sort(),
    priorities: ["Hot", "Warm", "Cold"],
  }), []);

  const filteredLeads = useMemo(() => {
    let result = mockLeads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.childName.toLowerCase().includes(q) ||
          l.parentName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q),
      );
    }

    // Multi-select filters
    if (filters.states.length) result = result.filter((l) => filters.states.includes(l.state));
    if (filters.sources.length) result = result.filter((l) => filters.sources.includes(l.source));
    if (filters.owners.length) result = result.filter((l) => filters.owners.includes(l.owner));
    if (filters.insurances.length) result = result.filter((l) => filters.insurances.includes(l.insurance));
    if (filters.priorities.length) result = result.filter((l) => filters.priorities.includes(l.priority));

    // KPI filter (overrides saved view when active)
    if (activeKpi) {
      result = result.filter(kpiFilters[activeKpi]);
    } else {
      switch (activeView) {
        case "mine": result = result.filter((l) => l.owner === "Sarah M."); break;
        case "today": result = result.filter((l) => l.daysInStage === 0); break;
        case "attention": result = result.filter((l) => l.status === "New Lead" || l.status === "Missing Information" || l.status === "Can't Reach" || l.daysInStage >= 5); break;
        case "stuck": result = result.filter((l) => l.daysInStage >= 3); break;
        case "vob": result = result.filter((l) => l.status === "Form Received" || l.status === "Sent to VOB"); break;
        case "cantReach": result = result.filter((l) => l.status === "Can't Reach" || l.status === "Sent Packet - Can't Reach"); break;
        case "vobDone": result = result.filter((l) => l.status === "VOB Completed"); break;
      }
    }

    return result;
  }, [searchQuery, activeView, filters, activeKpi]);

  const handleKpiClick = (key: KpiKey) => {
    setActiveKpi(activeKpi === key ? null : key);
    setActiveView("all");
  };

  const handleViewChange = (id: string) => {
    setActiveView(id);
    setActiveKpi(null);
  };

  return (
    <PageShell
      title="Leads"
      description="Lead command center — track intake pipeline from first contact to VOB"
      icon={Users}
    >
      <LeadKpiStrip leads={mockLeads} activeKpi={activeKpi} onKpiClick={handleKpiClick} />

      <LeadControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
      />

      <LeadBulkActionBar count={selectedIds.length} onClear={() => setSelectedIds([])} />

      {viewMode === "table" && (
        <LeadTableView
          leads={filteredLeads}
          onSelectLead={(lead) => navigate(`/leads/${lead.id}`)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}
      {viewMode === "pipeline" && (
        <LeadPipelineView leads={filteredLeads} onSelectLead={(lead) => navigate(`/leads/${lead.id}`)} />
      )}
      {viewMode === "queue" && (
        <LeadQueueView leads={filteredLeads} onSelectLead={(lead) => navigate(`/leads/${lead.id}`)} />
      )}
    </PageShell>
  );
}
