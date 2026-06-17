import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Plus } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MissingInformation() {
  const { leads, loading } = useLeads();

  const blocked = useMemo(
    () =>
      leads
        .filter(
          (l) =>
            l.status === "Missing Information" ||
            l.formReviewStatus === "Missing Info" ||
            l.formReviewStatus === "Missing Information",
        )
        .sort((a, b) => (a.nextTaskDue ?? "").localeCompare(b.nextTaskDue ?? "")),
    [leads],
  );

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Missing Information"
      description="Leads blocked by missing intake or insurance details. Action follow-ups appear here so nothing slips."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Lead-to-Active", icon: ArrowRight, to: "/intake/lead-to-active" },
      ]}
    >
      <Section title={`Blocked leads (${blocked.length})`} description="Sorted by next task due date.">
        {blocked.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading leads…" : "No leads are blocked on missing information."} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {blocked.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/leads/${lead.id}`} className="font-semibold hover:underline truncate block">
                      {lead.childName}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5">{lead.parentName}</div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{lead.status}</Badge>
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div>Owner: {lead.owner || "Unassigned"}</div>
                  {lead.lastContacted && <div>Last contact: {lead.lastContacted}</div>}
                  {lead.nextAction && (
                    <div className="flex items-center gap-1 text-amber-700">
                      <AlertCircle className="h-3 w-3" /> {lead.nextAction}
                    </div>
                  )}
                  {lead.nextTaskDue && <div>Due: {lead.nextTaskDue}</div>}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button asChild size="sm" variant="outline"><Link to={`/leads/${lead.id}`}>Open Lead</Link></Button>
                  <Button asChild size="sm" variant="ghost"><Link to={`/leads/${lead.id}#log`}>Log Contact</Link></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </GrowthPageShell>
  );
}