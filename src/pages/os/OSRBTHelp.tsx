import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeartHandshake, ShieldAlert, CalendarClock, Wrench, Stethoscope, GraduationCap, UserCog, Clock, CheckCircle2 } from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow } from "@/hooks/useRbtWorkflow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "bcba",       label: "BCBA / clinical support",   routes_to: "bcba",       icon: Stethoscope, tone: "primary" as const },
  { id: "schedule",   label: "Scheduling issue",           routes_to: "scheduling", icon: CalendarClock, tone: "primary" as const },
  { id: "client",     label: "Client / session issue",     routes_to: "bcba",       icon: HeartHandshake, tone: "primary" as const },
  { id: "training",   label: "Training question",          routes_to: "training",   icon: GraduationCap, tone: "primary" as const },
  { id: "tech",       label: "Tech / access issue",        routes_to: "tech",       icon: Wrench, tone: "primary" as const },
  { id: "hr",         label: "HR / admin issue",           routes_to: "hr",         icon: UserCog, tone: "primary" as const },
  { id: "emergency",  label: "Emergency / escalation",     routes_to: "director",   icon: ShieldAlert, tone: "danger" as const },
];

export default function OSRBTHelp() {
  const wf = useRbtWorkflow();
  const [params] = useSearchParams();
  const [category, setCategory] = useState<string>(params.get("category") ?? "");
  const [urgency, setUrgency] = useState<"low" | "normal" | "high">("normal");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState<"in_app" | "phone" | "text">("in_app");
  const [clientId, setClientId] = useState<string>(params.get("client") ?? "");
  const [sessionId, setSessionId] = useState<string>(params.get("session") ?? "");
  const [submitting, setSubmitting] = useState(false);

  const selected = CATEGORIES.find((c) => c.id === category);

  const open = useMemo(() => wf.helpRequests.filter((h) => h.status !== "resolved" && h.status !== "closed"), [wf.helpRequests]);
  const past = useMemo(() => wf.helpRequests.filter((h) => h.status === "resolved" || h.status === "closed").slice(0, 10), [wf.helpRequests]);

  async function submit() {
    if (!category || !description.trim()) {
      toast({ title: "Add a category and description" });
      return;
    }
    setSubmitting(true);
    const res = await wf.submitHelpRequest({
      category,
      urgency,
      description: description.trim(),
      preferred_contact_method: contact,
      related_client_id: clientId || null,
      related_session_id: sessionId || null,
      routed_to_role: selected?.routes_to ?? "bcba",
    });
    setSubmitting(false);
    if (res) {
      toast({ title: "Help request submitted", description: `Routed to ${selected?.routes_to ?? "BCBA"}.` });
      setDescription(""); setCategory(""); setClientId(""); setSessionId("");
    } else {
      toast({ title: "Could not submit help request" });
    }
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <HeartHandshake className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Help</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Ask for BCBA support, report a scheduling issue, get tech help, or escalate. We'll route it to the right team.
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <section className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">What do you need help with?</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className={cn(
                      "flex items-center gap-2 h-11 px-3 rounded-xl text-[12.5px] border text-left",
                      category === c.id
                        ? c.tone === "danger" ? "bg-destructive text-destructive-foreground border-destructive"
                          : "bg-primary text-primary-foreground border-primary"
                        : c.tone === "danger" ? "border-destructive/40 hover:bg-destructive/10"
                          : "border-border/70 hover:bg-muted",
                    )}>
                    <c.icon className="h-4 w-4 shrink-0" />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as any)}
                  className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="low">Low urgency</option>
                  <option value="normal">Normal</option>
                  <option value="high">High — needs response today</option>
                </select>
                <select value={contact} onChange={(e) => setContact(e.target.value as any)}
                  className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="in_app">Reply in Blossom OS</option>
                  <option value="phone">Phone call</option>
                  <option value="text">Text message</option>
                </select>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                  className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="">Link client (optional)</option>
                  {wf.clients.map((c) => c.client_id && <option key={c.id} value={c.client_id!}>{c.client_name}</option>)}
                </select>
              </div>
              <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                <option value="">Link session (optional)</option>
                {wf.sessions.slice(0, 30).map((s) => (
                  <option key={s.id} value={s.id}>{s.session_date} · {s.client_name}</option>
                ))}
              </select>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you need…"
                className="w-full min-h-[100px] rounded-lg border border-border/70 bg-background p-2 text-[13px]" />
              <div className="flex items-center justify-between">
                {selected && <p className="text-[11px] text-muted-foreground">Routes to: <span className="text-foreground font-medium">{selected.routes_to}</span></p>}
                <button onClick={submit} disabled={submitting} className="h-9 px-4 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {submitting ? "Sending…" : "Submit request"}
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Open requests ({open.length})</p>
              {open.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No open requests.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {open.slice(0, 8).map((h) => (
                    <div key={h.id} className="py-2">
                      <p className="text-[12.5px] font-medium">{h.category}</p>
                      <p className="text-[11.5px] text-muted-foreground line-clamp-2">{h.description}</p>
                      <p className="text-[10.5px] mt-1 flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />{new Date(h.created_at).toLocaleString()} · {h.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {past.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Recently resolved</p>
                <div className="divide-y divide-border/60">
                  {past.map((h) => (
                    <div key={h.id} className="py-2 flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium truncate">{h.category}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </OSShell>
  );
}
