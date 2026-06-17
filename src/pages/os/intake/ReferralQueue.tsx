import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, Phone, Mail, MapPin, User, Flame } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { getLeadWorkflowRisk } from "@/lib/intake/intakeWorkflow";

const QUEUE_STAGES = new Set(["New Lead", "In Contact"]);

export default function ReferralQueue() {
  const { leads, loading } = useLeads();
  const [addOpen, setAddOpen] = useState(false);

  const queue = useMemo(
    () =>
      leads
        .filter((l) => QUEUE_STAGES.has(l.status))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [leads],
  );

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Referral Queue"
      description="New referrals awaiting first contact, ownership, and intake action."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Leads", icon: ClipboardList, to: "/leads" },
      ]}
    >
      <Section title={`Awaiting contact (${queue.length})`} description="Leads in New Lead or In Contact, newest first.">
        {queue.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading leads…" : "No referrals waiting. Add a lead or connect a source to populate this queue."} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {queue.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-border/70 bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/leads/${lead.id}`} className="font-semibold text-foreground hover:underline truncate block">
                      {lead.childName}
                    </Link>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3" /> {lead.parentName || "—"}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{lead.status}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {lead.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {lead.phone}</div>}
                  {lead.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" /> {lead.email}</div>}
                  <div className="flex items-center gap-3">
                    {lead.state && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.state}</span>}
                    {lead.source && <span>{lead.source}</span>}
                    {lead.priority === "Hot" && <span className="flex items-center gap-1 text-orange-600"><Flame className="h-3 w-3" /> Hot</span>}
                  </div>
                  <div>Owner: {lead.owner || "Unassigned"}</div>
                  {lead.nextAction && <div>Next: {lead.nextAction}</div>}
                </div>
                {(() => {
                  const risk = getLeadWorkflowRisk(lead);
                  return risk.reasons.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {risk.reasons.slice(0, 3).map((r) => (
                        <Badge key={r} variant="secondary" className="text-[10px] py-0">{r}</Badge>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div className="mt-3">
                  <LeadActionPanel lead={lead} compact sourcePage="referral-queue" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <NewLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaults={buildLeadSourceDefaults("Website", { sourcePage: "referral-queue" })}
      />
    </GrowthPageShell>
  );
}