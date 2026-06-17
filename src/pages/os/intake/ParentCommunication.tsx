import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Phone, Mail, Plus } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const COMM_KEY = "blossom-os.intake-comms.v1";
type LocalComm = { id: string; leadId: string; leadName: string; type: "call" | "sms" | "email" | "note"; preview: string; timestamp: string; user?: string };
function loadLocal(): LocalComm[] { if (typeof window === "undefined") return []; try { return JSON.parse(window.localStorage.getItem(COMM_KEY) || "[]"); } catch { return []; } }
function saveLocal(rows: LocalComm[]) { try { window.localStorage.setItem(COMM_KEY, JSON.stringify(rows)); } catch { /* ignore */ } }

interface CommRow {
  leadId: string;
  leadName: string;
  type: "call" | "sms" | "email" | "note";
  preview: string;
  timestamp: string;
  user?: string;
}

const ICONS = { call: Phone, sms: MessageSquare, email: Mail, note: MessageSquare } as const;

export default function ParentCommunication() {
  const { leads, loading } = useLeads();
  const [local, setLocal] = useState<LocalComm[]>(() => loadLocal());
  useEffect(() => { saveLocal(local); }, [local]);

  const logComm = (lead: { id: string; childName: string }, type: LocalComm["type"]) => {
    const preview = window.prompt(`${type.toUpperCase()} — what happened?`);
    if (!preview || !preview.trim()) return;
    setLocal((rows) => [{ id: `lc-${Date.now()}`, leadId: lead.id, leadName: lead.childName, type, preview: preview.trim(), timestamp: new Date().toISOString() }, ...rows]);
    toast.success(`${type} logged`);
  };

  const recent = useMemo<CommRow[]>(() => {
    const rows: CommRow[] = [];
    leads.forEach((l) => {
      (l.communications ?? []).forEach((c) =>
        rows.push({
          leadId: l.id,
          leadName: l.childName,
          type: c.type,
          preview: c.preview,
          timestamp: c.timestamp,
          user: c.user,
        }),
      );
    });
    local.forEach((c) => rows.push({ leadId: c.leadId, leadName: c.leadName, type: c.type, preview: c.preview, timestamp: c.timestamp, user: c.user }));
    return rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
  }, [leads, local]);

  const followUps = useMemo(
    () => leads.filter((l) => !!l.nextAction && l.status !== "VOB Completed").slice(0, 30),
    [leads],
  );

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Parent Communication"
      description="Recent family communication across phone, SMS, email, and notes — and the leads that need a follow-up."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: MessageSquare, to: "/leads" },
      ]}
    >
      <Section title={`Recent communications (${recent.length})`}>
        {recent.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading communications…" : "No communications logged yet. Logged calls, SMS, and emails will appear here."} />
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
            {recent.map((r, i) => {
              const Icon = ICONS[r.type] ?? MessageSquare;
              return (
                <div key={`${r.leadId}-${i}`} className="flex items-start gap-3 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Link to={`/leads/${r.leadId}`} className="font-medium hover:underline truncate">{r.leadName}</Link>
                      <span className="text-[11px] text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{r.preview}</div>
                    {r.user && <div className="text-[10px] text-muted-foreground mt-0.5">by {r.user}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title={`Required follow-ups (${followUps.length})`} description="Leads with an open next action.">
        {followUps.length === 0 ? (
          <ReadyForDataNotice message="No follow-ups pending." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {followUps.map((l) => (
              <div key={l.id} className="rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/leads/${l.id}`} className="font-medium text-sm truncate hover:underline">{l.childName}</Link>
                  <span className="text-[11px] text-muted-foreground shrink-0">{l.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{l.nextAction}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button asChild size="sm" variant="outline"><Link to={`/leads/${l.id}`}>Open</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => logComm(l, "call")}>Log Call</Button>
                  <Button size="sm" variant="ghost" onClick={() => logComm(l, "sms")}>Log Text</Button>
                  <Button size="sm" variant="ghost" onClick={() => logComm(l, "email")}>Log Email</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </GrowthPageShell>
  );
}