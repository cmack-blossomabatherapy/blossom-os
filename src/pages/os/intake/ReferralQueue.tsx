import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, Phone, Mail, MapPin, User, Flame, Search, List } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { getLeadWorkflowRisk } from "@/lib/intake/intakeWorkflow";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const QUEUE_STAGES = new Set(["New Lead", "In Contact"]);
type SortKey = "newest" | "oldest" | "highest_risk" | "unassigned";

export default function ReferralQueue() {
  const { leads, loading } = useLeads();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState<string>("all");
  const [ownerF, setOwnerF] = useState<string>("all");
  const [sourceF, setSourceF] = useState<string>("all");
  const [priorityF, setPriorityF] = useState<string>("all");
  const [riskF, setRiskF] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const baseQueue = useMemo(
    () => leads.filter((l) => QUEUE_STAGES.has(l.status)),
    [leads],
  );

  const uniques = useMemo(() => {
    const states = new Set<string>();
    const owners = new Set<string>();
    const sources = new Set<string>();
    baseQueue.forEach((l) => {
      if (l.state) states.add(l.state);
      if (l.owner) owners.add(l.owner);
      if (l.source) sources.add(l.source);
    });
    return {
      states: [...states].sort(),
      owners: [...owners].sort(),
      sources: [...sources].sort(),
    };
  }, [baseQueue]);

  const queue = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      const filtered = baseQueue.filter((l) => {
        if (stateF !== "all" && l.state !== stateF) return false;
        if (ownerF !== "all" && (l.owner || "Unassigned") !== ownerF) return false;
        if (sourceF !== "all" && l.source !== sourceF) return false;
        if (priorityF !== "all" && l.priority !== priorityF) return false;
        if (riskF !== "all") {
          const r = getLeadWorkflowRisk(l).level;
          if (riskF === "risk" && r !== "risk" && r !== "urgent") return false;
          if (riskF === "urgent" && r !== "urgent") return false;
          if (riskF === "ok" && r !== "ok") return false;
        }
        if (q) {
          const hay = [l.childName, l.parentName, l.phone, l.email, l.state, l.source]
            .map((s) => String(s ?? "").toLowerCase())
            .join(" ");
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      const sorted = [...filtered];
      switch (sort) {
        case "oldest":
          sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case "highest_risk":
          sorted.sort((a, b) => {
            const w = (lv: string) => (lv === "urgent" ? 0 : lv === "risk" ? 1 : 2);
            return w(getLeadWorkflowRisk(a).level) - w(getLeadWorkflowRisk(b).level);
          });
          break;
        case "unassigned":
          sorted.sort((a, b) => Number(!!a.owner) - Number(!!b.owner));
          break;
        case "newest":
        default:
          sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return sorted;
    },
    [baseQueue, search, stateF, ownerF, sourceF, priorityF, riskF, sort],
  );

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Referral Queue"
      description="New referrals awaiting first contact, ownership, and intake action."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center p-3 rounded-2xl border border-border/60 bg-card/50">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, parent, phone, email…" className="pl-9 h-9 bg-transparent border-0 focus-visible:ring-0" />
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <Select value={stateF} onValueChange={setStateF}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All states</SelectItem>{uniques.states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={ownerF} onValueChange={setOwnerF}>
            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All owners</SelectItem>{uniques.owners.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sourceF} onValueChange={setSourceF}>
            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All sources</SelectItem>{uniques.sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={priorityF} onValueChange={setPriorityF}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any priority</SelectItem><SelectItem value="Hot">Hot</SelectItem><SelectItem value="Warm">Warm</SelectItem><SelectItem value="Cold">Cold</SelectItem></SelectContent>
          </Select>
          <Select value={riskF} onValueChange={setRiskF}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any risk</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="risk">At risk+</SelectItem><SelectItem value="ok">Healthy</SelectItem></SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="highest_risk">Highest risk</SelectItem>
              <SelectItem value="unassigned">Unassigned first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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