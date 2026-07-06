import { useState } from "react";
import { MessageSquare, Plus, Search, Phone, Mail, Voicemail, Users, ArrowDown, ArrowUp } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, FilterBar, FormDialog } from "./_shared";
import { familySelectOptions, familyOptionByValue, familyContext, stringValue, stringOrNull, booleanValue, dateTimeIsoOrNull, type CMFormValues } from "./_utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CHANNELS = ["call","email","sms","voicemail","parent_meeting","internal_update","other"];
const DIRECTIONS = ["inbound","outbound","internal"];

function channelIcon(c: string) {
  if (c === "call") return <Phone className="h-3 w-3" />;
  if (c === "email") return <Mail className="h-3 w-3" />;
  if (c === "voicemail") return <Voicemail className="h-3 w-3" />;
  if (c === "parent_meeting") return <Users className="h-3 w-3" />;
  return <MessageSquare className="h-3 w-3" />;
}

export default function ParentCommunicationPage() {
  const w = useCaseManagerWorkspace();
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<string>("all");
  const [direction, setDirection] = useState<string>("all");
  const [needsFollowUp, setNeedsFollowUp] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);

  const options = familySelectOptions(w.assignments);
  const pickFamily = (v: CMFormValues) => familyOptionByValue(w.assignments, stringValue(v.family));

  const rows = w.communications.filter((c) => {
    if (channel !== "all" && c.channel !== channel) return false;
    if (direction !== "all" && c.direction !== direction) return false;
    if (needsFollowUp === "yes" && !c.needs_followup) return false;
    if (needsFollowUp === "no" && c.needs_followup) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![c.client_name, c.contact_name, c.subject, c.summary].some((x) => (x ?? "").toLowerCase().includes(s))) return false;
    }
    return true;
  });

  return (
    <CMPage
      eyebrow="Case Manager · Communication"
      title="Parent Communication"
      description="Every parent contact — logged, searchable, and connected to follow-ups."
      loading={w.loading}
      error={w.error}
      empty={!w.loading && w.communications.length === 0 ? { icon: MessageSquare, title: "No communications yet", hint: "Log your first parent contact to start the timeline." } : null}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Log communication</Button>}
    >
      <FilterBar>
        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 w-64" /></div>
        <Select value={channel} onValueChange={setChannel}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All channels</SelectItem>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={direction} onValueChange={setDirection}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All directions</SelectItem>{DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
        <Select value={needsFollowUp} onValueChange={setNeedsFollowUp}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any follow-up state</SelectItem><SelectItem value="yes">Needs follow-up</SelectItem><SelectItem value="no">No follow-up</SelectItem></SelectContent></Select>
        <span className="text-[11px] text-muted-foreground">{rows.length} of {w.communications.length}</span>
      </FilterBar>

      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 divide-y divide-border/60">
        {rows.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted/40 text-[11px] font-semibold">{(c.contact_name ?? c.client_name ?? "—").split(" ").map((p)=>p[0]).join("").slice(0,2).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold">{c.contact_name ?? c.client_name ?? "Unknown"}{c.client_name && c.contact_name ? <span className="text-muted-foreground font-normal"> · {c.client_name}</span> : null}</p>
                <span className="shrink-0 text-[10.5px] text-muted-foreground">{new Date(c.occurred_at).toLocaleString()}</span>
              </div>
              {c.subject && <p className="mt-0.5 text-[12px] font-medium">{c.subject}</p>}
              <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{c.summary}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Pill tone="cool"><span className="inline-flex items-center gap-1">{channelIcon(c.channel)} {c.channel}</span></Pill>
                <Pill tone={c.direction === "inbound" ? "warm" : c.direction === "outbound" ? "calm" : "violet"}><span className="inline-flex items-center gap-1">{c.direction === "inbound" ? <ArrowDown className="h-2.5 w-2.5" /> : c.direction === "outbound" ? <ArrowUp className="h-2.5 w-2.5" /> : null} {c.direction}</span></Pill>
                {c.sentiment && <Pill tone={c.sentiment === "upset" ? "alert" : c.sentiment === "concerned" ? "amber" : "calm"}>{c.sentiment}</Pill>}
                {c.needs_followup && <Pill tone="amber">Follow-up needed{c.followup_at ? ` · ${new Date(c.followup_at).toLocaleDateString()}` : ""}</Pill>}
                {c.follow_up_id && <Pill tone="cool">Linked follow-up</Pill>}
                {c.outcome && <span className="text-[10.5px] text-muted-foreground">Outcome: {c.outcome}</span>}
              </div>
              {c.needs_followup && (
                <div className="mt-2">
                  <Button size="sm" variant="ghost" onClick={async () => { await w.resolveCommunicationFollowUp(c.id); toast.success("Marked resolved"); }}>Mark follow-up resolved</Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && !w.loading && w.communications.length > 0 && (
          <div className="p-6 text-center text-[12px] text-muted-foreground">No communications match your filters.</div>
        )}
      </div>

      <FormDialog
        open={addOpen} onOpenChange={setAddOpen}
        title="Log parent communication" submitLabel="Log"
        fields={[
          { key: "family", label: "Family / client", type: "select", options },
          { key: "channel", label: "Channel", type: "select", required: true, options: CHANNELS, defaultValue: "call" },
          { key: "direction", label: "Direction", type: "select", required: true, options: DIRECTIONS, defaultValue: "inbound" },
          { key: "contact_name", label: "Contact name" },
          { key: "subject", label: "Subject" },
          { key: "summary", label: "Summary", type: "textarea", required: true },
          { key: "outcome", label: "Outcome" },
          { key: "sentiment", label: "Sentiment", type: "select", options: ["positive","neutral","concerned","upset"] },
          { key: "needs_followup", label: "Needs follow-up", type: "checkbox" },
          { key: "followup_at", label: "Follow-up date/time", type: "datetime" },
          { key: "create_followup", label: "Also create a follow-up task", type: "checkbox", defaultValue: true },
        ]}
        onSubmit={async (v) => {
          const opt = pickFamily(v);
          const ctx = familyContext(opt);
          await w.logCommunicationWithFollowUp({
            ...ctx,
            channel: stringValue(v.channel), direction: stringValue(v.direction),
            contact_name: stringOrNull(v.contact_name), subject: stringOrNull(v.subject),
            summary: stringValue(v.summary), outcome: stringOrNull(v.outcome), sentiment: stringOrNull(v.sentiment),
            needs_followup: booleanValue(v.needs_followup),
            followup_at: dateTimeIsoOrNull(v.followup_at),
            create_followup: booleanValue(v.create_followup),
          });
          toast.success("Communication logged");
        }}
      />
    </CMPage>
  );
}