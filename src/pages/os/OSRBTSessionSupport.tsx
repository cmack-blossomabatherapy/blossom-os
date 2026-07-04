import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { LifeBuoy, ClipboardCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { OSShell } from "./OSShell";
import { useRbtWorkflow } from "@/hooks/useRbtWorkflow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CHECKLIST = [
  "Reviewed client's current programs",
  "Have reinforcers and materials ready",
  "Reviewed safety notes and family preferences",
  "Confirmed session time and location",
  "Reviewed most recent BCBA feedback",
];

const ISSUE_TYPES = [
  { value: "behavior", label: "Behavior escalation" },
  { value: "safety", label: "Safety concern" },
  { value: "family", label: "Family / parent concern" },
  { value: "scheduling", label: "Scheduling / access issue" },
  { value: "clinical", label: "Clinical question for BCBA" },
  { value: "tech", label: "Tech / access issue" },
];

export default function OSRBTSessionSupport() {
  const wf = useRbtWorkflow();
  const [params] = useSearchParams();
  const sessionParam = params.get("session");
  const clientParam = params.get("client");

  const preselectSession = useMemo(
    () => sessionParam ? wf.sessions.find((s) => s.id === sessionParam) ?? null : null,
    [wf.sessions, sessionParam],
  );

  const [sessionId, setSessionId] = useState<string>(preselectSession?.id ?? "");
  const [clientId, setClientId] = useState<string>(clientParam ?? preselectSession?.client_id ?? "");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [prepNotes, setPrepNotes] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [escalation, setEscalation] = useState<"none" | "normal" | "urgent">("normal");
  const [submitting, setSubmitting] = useState(false);

  const complete = Object.values(checked).filter(Boolean).length;

  async function submit() {
    if (!prepNotes && !issueType) {
      toast({ title: "Nothing to submit", description: "Add prep notes or select an issue type." });
      return;
    }
    setSubmitting(true);
    const res = await wf.logSessionSupport({
      session_id: sessionId || null,
      client_id: clientId || null,
      checklist_completed: checked,
      prep_notes: prepNotes || null,
      issue_type: issueType || null,
      issue_description: issueDesc || null,
      escalation_level: escalation,
      routed_to_role: issueType === "safety" || issueType === "behavior" || escalation === "urgent" ? "bcba" : issueType === "scheduling" ? "scheduling" : issueType === "tech" ? "tech" : null,
    });
    setSubmitting(false);
    if (res) {
      toast({ title: "Support log saved" });
      setPrepNotes(""); setIssueType(""); setIssueDesc(""); setChecked({});
    } else {
      toast({ title: "Could not save support log" });
    }
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <LifeBuoy className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Session Support</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Prep for a session, log an issue, or escalate to your BCBA. Notes stay in Blossom OS — clinical notes still live in CentralReach.
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <section className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-muted-foreground" /><h2 className="text-[13px] font-medium">Prep checklist</h2></div>
                <span className="text-[11px] text-muted-foreground">{complete}/{CHECKLIST.length}</span>
              </div>
              <div className="space-y-1.5">
                {CHECKLIST.map((item) => (
                  <label key={item} className="flex items-start gap-2 text-[13px] cursor-pointer">
                    <input type="checkbox" checked={!!checked[item]} onChange={(e) => setChecked({ ...checked, [item]: e.target.checked })} className="mt-1" />
                    <span className={cn(checked[item] && "line-through text-muted-foreground")}>{item}</span>
                  </label>
                ))}
              </div>
              <textarea value={prepNotes} onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Prep notes (only visible to you and your BCBA)…"
                className="mt-3 w-full min-h-[80px] rounded-lg border border-border/70 bg-background p-2 text-[13px]" />
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-muted-foreground" /><h2 className="text-[13px] font-medium">Report an issue</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="">Link session (optional)</option>
                  {wf.sessions.slice(0, 30).map((s) => (
                    <option key={s.id} value={s.id}>{s.session_date} · {s.client_name}</option>
                  ))}
                </select>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="">Link client (optional)</option>
                  {wf.clients.map((c) => c.client_id && <option key={c.id} value={c.client_id!}>{c.client_name}</option>)}
                </select>
                <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="">Issue type</option>
                  {ISSUE_TYPES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
                <select value={escalation} onChange={(e) => setEscalation(e.target.value as any)} className="h-9 rounded-lg border border-border/70 bg-background px-2 text-[12.5px]">
                  <option value="none">No escalation</option>
                  <option value="normal">Normal escalation</option>
                  <option value="urgent">Urgent — needs BCBA now</option>
                </select>
              </div>
              <textarea value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} placeholder="Describe what happened…"
                className="w-full min-h-[80px] rounded-lg border border-border/70 bg-background p-2 text-[13px]" />
            </section>

            <div className="flex items-center justify-end gap-2">
              <Link to="/rbt/help" className="h-9 px-3 rounded-xl text-[12.5px] border border-border/70 bg-card hover:bg-muted inline-flex items-center">Open Help</Link>
              <button onClick={submit} disabled={submitting}
                className="h-9 px-4 rounded-xl text-[12.5px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {submitting ? "Saving…" : "Submit"}
              </button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Recent support logs</p>
              {wf.supportLogs.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">No logs yet.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {wf.supportLogs.slice(0, 6).map((l) => (
                    <div key={l.id} className="py-2">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(l.created_at).toLocaleString()}</p>
                      {l.issue_type && <p className="text-[12.5px] mt-0.5">{l.issue_type}: {l.issue_description}</p>}
                      {l.prep_notes && !l.issue_type && <p className="text-[12.5px] mt-0.5 text-muted-foreground line-clamp-2">{l.prep_notes}</p>}
                      <p className="text-[10.5px] mt-1 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />{l.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </OSShell>
  );
}
