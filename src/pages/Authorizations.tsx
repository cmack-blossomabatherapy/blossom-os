import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/shared/PageShell";
import { ShieldCheck } from "lucide-react";
import { AuthControlBar, AuthViewMode } from "@/components/authorizations/AuthControlBar";
import { AuthTableView } from "@/components/authorizations/AuthTableView";
import { AuthPipelineView } from "@/components/authorizations/AuthPipelineView";
import { AuthExpirationTimeline } from "@/components/authorizations/AuthExpirationTimeline";
import { AuthQueueView } from "@/components/authorizations/AuthQueueView";
import { mockAuths, daysUntil } from "@/data/authorizations";

export default function Authorizations() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<AuthViewMode>("table");
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = mockAuths;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.payor.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.coordinator.toLowerCase().includes(q)
      );
    }

    switch (activeView) {
      case "awaiting": result = result.filter((a) => a.stage === "Awaiting Submission"); break;
      case "submitted": result = result.filter((a) => a.stage === "Submitted"); break;
      case "approved": result = result.filter((a) => a.stage === "Approved"); break;
      case "denied": result = result.filter((a) => a.stage === "Denied"); break;
      case "expiring": result = result.filter((a) => {
        const d = daysUntil(a.expirationDate);
        return a.stage === "Expiring Soon" || (d !== null && d <= 90);
      }); break;
      case "qa": result = result.filter((a) => a.stage === "In QA Review"); break;
      case "missing": result = result.filter((a) => a.missingInfo); break;
    }
    return result;
  }, [searchQuery, activeView]);

  return (
    <PageShell
      title="Authorizations"
      description="Auth command center — submissions, approvals, denials, and renewals"
      icon={ShieldCheck}
    >
      <AuthControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeView={activeView}
        onActiveViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {viewMode === "table" && <AuthTableView auths={filtered} onSelect={(a) => navigate(`/authorizations/${a.id}`)} />}
      {viewMode === "pipeline" && <AuthPipelineView auths={filtered} onSelect={(a) => navigate(`/authorizations/${a.id}`)} />}
      {viewMode === "timeline" && <AuthExpirationTimeline auths={filtered} onSelect={(a) => navigate(`/authorizations/${a.id}`)} />}
      {viewMode === "queue" && <AuthQueueView auths={filtered} onSelect={(a) => navigate(`/authorizations/${a.id}`)} />}
    </PageShell>
  );
}
