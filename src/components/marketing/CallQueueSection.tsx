import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Filter, Link2, PhoneCall, RefreshCw, Upload, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CALL_CATEGORIES,
  CALL_DISPOSITIONS,
  type CallCategory,
  type CallDisposition,
  useMarketingCallEvents,
  type MarketingCallEventRow,
} from "@/hooks/useMarketingCallEvents";
import { useLeads } from "@/contexts/LeadsContext";
import { eventToLeadDefaults } from "@/lib/leads/leadSourceEvents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { CallEventLogDialog } from "@/components/marketing/CallEventLogDialog";
import { BulkCallEventImportDialog } from "@/components/marketing/BulkCallEventImportDialog";

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", { timeZone: "America/New_York" });
}
function fmtDur(s: number | null | undefined) {
  if (!s) return "-";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function isMissed(row: MarketingCallEventRow) {
  const d = row.disposition?.toLowerCase() ?? "";
  if (d.includes("missed") || d.includes("voicemail") || d.includes("callback")) return true;
  const s = row.status?.toLowerCase() ?? "";
  return s.includes("missed") || s.includes("voicemail") || s.includes("no_answer") || s.includes("no answer");
}
function isAfterHours(iso: string) {
  const h = new Date(iso).getHours();
  return h >= 18 || h < 8;
}

/** Operating queue over marketing_call_events. */
export function CallQueueSection() {
  const {
    calls,
    loading,
    refetch,
    setCategory,
    setDisposition,
    setDirection,
    markReviewed,
    linkLead,
  } = useMarketingCallEvents({ limit: 500 });
  const { leads, createLead } = useLeads();

  const [queueFilter, setQueueFilter] = useState<"all" | "missed" | "after_hours" | "needs_review" | "callback_needed">("all");
  const [search, setSearch] = useState("");
  const [linkOpen, setLinkOpen] = useState<MarketingCallEventRow | null>(null);
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [bulkCallOpen, setBulkCallOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      if (queueFilter === "missed" && !isMissed(c)) return false;
      if (queueFilter === "after_hours" && !isAfterHours(c.occurred_at)) return false;
      if (queueFilter === "needs_review" && c.reviewed_at) return false;
      if (queueFilter === "callback_needed" && c.disposition !== "callback_needed") return false;
      if (!q) return true;
      const hay = [c.caller_name, c.caller_phone, c.state, c.source_system, c.status].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [calls, queueFilter, search]);

  const counts = useMemo(
    () => ({
      missed: calls.filter(isMissed).length,
      afterHours: calls.filter((c) => isAfterHours(c.occurred_at)).length,
      needsReview: calls.filter((c) => !c.reviewed_at).length,
      callbacks: calls.filter((c) => c.disposition === "callback_needed").length,
    }),
    [calls],
  );

  const onCreateLeadFromCall = async (row: MarketingCallEventRow) => {
    try {
      const pseudoEvent = {
        id: row.id,
        source: row.source_system ?? "Phone",
        sourceLabel: row.source_system ?? "Phone",
        sourceEventType: "phone_call" as const,
        phone: row.caller_phone ?? undefined,
        email: undefined,
        state: row.state ?? undefined,
        parentName: row.caller_name ?? undefined,
        parentFirstName: row.caller_name?.split(" ")[0],
        parentLastName: row.caller_name?.split(" ").slice(1).join(" ") || undefined,
        childName: undefined,
        summary: row.transcript_summary ?? row.status ?? undefined,
        receivedAt: row.occurred_at,
      } as never;
      const defaults = eventToLeadDefaults(pseudoEvent);
      const lead = await createLead({
        patientFirstName: defaults.patientFirstName,
        patientLastName: defaults.patientLastName,
        childName: defaults.childName,
        parentFirstName: defaults.parentFirstName,
        parentLastName: defaults.parentLastName,
        parentName: defaults.parentName,
        phone: defaults.phone,
        email: defaults.email,
        state: defaults.state,
        leadSource: defaults.leadSource,
        referralSource: defaults.referralSource,
        pipelineStage: defaults.pipelineStage,
        priority: "Warm",
      });
      await linkLead(row.id, lead.id);
      await setDisposition(row.id, "converted_to_lead");
      toast.success("Lead created from call");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create lead");
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <PhoneCall className="h-4 w-4" /> Call queue
          </div>
          <div className="text-[11.5px] text-muted-foreground">
            Work incoming calls from CTM / Jivetel / Retell / manual. Rows read/write <code>marketing_call_events</code>.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => void refetch()} disabled={loading}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLogCallOpen(true)}>
            <PhoneCall className="mr-1 h-3.5 w-3.5" /> Log call
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkCallOpen(true)}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Bulk Import Calls
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <QueueTab active={queueFilter === "all"} onClick={() => setQueueFilter("all")} label={`All (${calls.length})`} />
        <QueueTab active={queueFilter === "missed"} onClick={() => setQueueFilter("missed")} label={`Missed (${counts.missed})`} />
        <QueueTab active={queueFilter === "callback_needed"} onClick={() => setQueueFilter("callback_needed")} label={`Callbacks (${counts.callbacks})`} />
        <QueueTab active={queueFilter === "after_hours"} onClick={() => setQueueFilter("after_hours")} label={`After hours (${counts.afterHours})`} />
        <QueueTab active={queueFilter === "needs_review"} onClick={() => setQueueFilter("needs_review")} label={`Needs review (${counts.needsReview})`} />
        <div className="ml-auto flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Input className="h-8 w-56 bg-muted/40 border-0" placeholder="Search caller, phone, state..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="overflow-auto -mx-2">
        <table className="w-full text-[12px]">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="px-2 py-2 font-medium">When</th>
              <th className="px-2 py-2 font-medium">Source</th>
              <th className="px-2 py-2 font-medium">Dir</th>
              <th className="px-2 py-2 font-medium">Caller</th>
              <th className="px-2 py-2 font-medium">Phone</th>
              <th className="px-2 py-2 font-medium">State</th>
              <th className="px-2 py-2 font-medium">Dur</th>
              <th className="px-2 py-2 font-medium">Category</th>
              <th className="px-2 py-2 font-medium">Disposition</th>
              <th className="px-2 py-2 font-medium">Lead</th>
              <th className="px-2 py-2 font-medium">Reviewed</th>
              <th className="px-2 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-muted-foreground text-xs">
                  {loading ? "Loading..." : "No calls match this queue."}
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-border/40 align-top">
                <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{fmtDate(c.occurred_at)}</td>
                <td className="px-2 py-2">{c.source_system ?? "-"}</td>
                <td className="px-2 py-2">
                  <Select value={c.direction ?? "unknown"} onValueChange={(v) => void setDirection(c.id, v as "inbound" | "outbound" | "unknown")}>
                    <SelectTrigger className="h-7 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">inbound</SelectItem>
                      <SelectItem value="outbound">outbound</SelectItem>
                      <SelectItem value="unknown">unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2">{c.caller_name ?? "-"}</td>
                <td className="px-2 py-2 tabular-nums">{c.caller_phone ?? "-"}</td>
                <td className="px-2 py-2">{c.state ?? "-"}</td>
                <td className="px-2 py-2 tabular-nums">{fmtDur(c.duration_seconds)}</td>
                <td className="px-2 py-2">
                  <Select value={(c.call_category as CallCategory) ?? "unknown"} onValueChange={(v) => void setCategory(c.id, v as CallCategory)}>
                    <SelectTrigger className="h-7 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CALL_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2">
                  <Select value={(c.disposition as CallDisposition) ?? undefined} onValueChange={(v) => void setDisposition(c.id, v as CallDisposition)}>
                    <SelectTrigger className="h-7 w-36"><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      {CALL_DISPOSITIONS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2">
                  {c.lead_id ? (
                    <Link className="text-primary hover:underline" to={`/leads/${c.lead_id}`}>Open</Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {c.reviewed_at ? (
                    <Badge variant="outline" className="text-[10px]"><Check className="h-3 w-3 mr-0.5" />reviewed</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">pending</Badge>
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7">Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Workflow</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setLinkOpen(c)}>
                        <Link2 className="h-3.5 w-3.5 mr-1.5" /> Link to existing lead
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void onCreateLeadFromCall(c)}>
                        <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Create lead from call
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void setDisposition(c.id, "callback_needed")}>
                        Mark callback needed
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => void markReviewed(c.id, !c.reviewed_at)}>
                        {c.reviewed_at ? "Unmark reviewed" : "Mark reviewed"}
                      </DropdownMenuItem>
                      {c.lead_id && (
                        <DropdownMenuItem asChild>
                          <Link to={`/patient-journey?leadId=${c.lead_id}`}>Open patient journey</Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LinkLeadDialog
        open={!!linkOpen}
        onOpenChange={(v) => !v && setLinkOpen(null)}
        leads={leads}
        onPick={async (leadId) => {
          if (!linkOpen) return;
          try {
            await linkLead(linkOpen.id, leadId);
            await setDisposition(linkOpen.id, "attached_to_lead");
            toast.success("Call attached to lead");
          } catch { /* toast already fired */ }
          setLinkOpen(null);
        }}
      />
      <CallEventLogDialog
        open={logCallOpen}
        onOpenChange={setLogCallOpen}
        onLogged={() => void refetch()}
      />
      <BulkCallEventImportDialog
        open={bulkCallOpen}
        onOpenChange={setBulkCallOpen}
        onImported={() => void refetch()}
      />
    </section>
  );
}

function QueueTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 rounded-full px-3 text-[12px] font-medium transition ${
        active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {label}
    </button>
  );
}

function LinkLeadDialog({
  open, onOpenChange, leads, onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leads: ReturnType<typeof useLeads>["leads"];
  onPick: (leadId: string) => void;
}) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return leads
      .filter((l) =>
        !s || `${l.childName} ${l.parentName} ${l.phone} ${l.email}`.toLowerCase().includes(s),
      )
      .slice(0, 12);
  }, [leads, q]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Link call to lead</DialogTitle></DialogHeader>
        <Input className="h-9" placeholder="Search leads by name, phone, email..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-72 overflow-auto space-y-1.5">
          {matches.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No matches.</div>}
          {matches.map((l) => (
            <button
              key={l.id}
              onClick={() => onPick(l.id)}
              className="w-full text-left rounded-lg border border-border/60 bg-card px-3 py-2 hover:bg-muted/60"
            >
              <div className="font-medium text-sm truncate">{l.childName}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {l.parentName} / {l.state} / {l.status} / {l.phone || l.email}
              </div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}