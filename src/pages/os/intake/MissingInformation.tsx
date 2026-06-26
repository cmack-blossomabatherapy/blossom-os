import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, List, Plus } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { getMissingInfoFlags, canonicalFamilyLeadStage } from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";

export default function MissingInformation() {
  const { leads: allLeads, loading } = useLeads();
  const { matches } = useIntakeStateFilter();
  const leads = useMemo(() => allLeads.filter((l) => matches(l.state)), [allLeads, matches]);

  const blocked = useMemo(
    () =>
      leads
        .filter((l) => {
          // Export 87 — canonical Intake Packet Follow Up is the operational
          // "missing information" stage. Legacy "Missing Information" still
          // counts via the canonical aliasing.
          if (canonicalFamilyLeadStage(l.status) === "Intake Packet Follow Up") return true;
          if (l.formReviewStatus === "Missing Info" || l.formReviewStatus === "Missing Information") return true;
          const flags = getMissingInfoFlags(l);
          return flags.any || (l.tags ?? []).some((t) => /missing|blocker/i.test(t));
        })
        .sort((a, b) => (a.nextTaskDue ?? "").localeCompare(b.nextTaskDue ?? "")),
    [leads],
  );

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Packet Follow Up / Missing Info"
      description="Leads waiting on packet corrections, documents, insurance details, or family follow-up."
      headerRight={<IntakeStateFilterToggle />}
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: List, to: "/leads" },
        { label: "Open Ready-to-Start Pipeline", icon: ArrowRight, to: "/intake/lead-to-active" },
      ]}
    >
      <Section title={`Packet follow-up queue (${blocked.length})`} description="Sorted by next task due date.">
        {blocked.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading leads…" : "No packet follow-up items are blocked right now."} />
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
                {(() => {
                  const flags = getMissingInfoFlags(lead);
                  const list = [
                    flags.phone && "phone",
                    flags.email && "email",
                    flags.insurance && "insurance",
                    flags.diagnosis && "DX",
                    flags.dob && "DOB",
                    flags.referralSource && "referral",
                    flags.documents && "docs",
                    flags.owner && "owner",
                  ].filter(Boolean) as string[];
                  return list.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {list.map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px] py-0">Missing: {f}</Badge>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div className="mt-3">
                  <LeadActionPanel lead={lead} compact sourcePage="missing-information" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </GrowthPageShell>
  );
}