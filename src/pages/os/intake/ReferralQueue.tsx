import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, Phone, Mail, MapPin, User, Flame } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const QUEUE_STAGES = new Set(["New Lead", "In Contact"]);

export default function ReferralQueue() {
  const { leads, loading, moveStage, assignOwner, addTag } = useLeads();

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
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
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
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button asChild size="sm" variant="outline"><Link to={`/leads/${lead.id}`}>Open Lead</Link></Button>
                  <Button asChild size="sm" variant="ghost"><Link to={`/leads/${lead.id}#log`}>Log Contact</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => { moveStage([lead.id], "In Contact"); toast.success("Moved to In Contact"); }}>Move to Contacted</Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    const owner = window.prompt("Assign owner to", lead.owner || "");
                    if (owner && owner.trim()) { assignOwner([lead.id], owner.trim()); toast.success("Owner assigned"); }
                  }}>Assign Owner</Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    const tag = window.prompt("Add tag");
                    if (tag && tag.trim()) { addTag([lead.id], tag.trim()); toast.success("Tag added"); }
                  }}>Add Tag</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </GrowthPageShell>
  );
}