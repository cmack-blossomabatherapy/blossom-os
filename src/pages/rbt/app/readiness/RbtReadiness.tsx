import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight, LifeBuoy, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useReadiness } from "./useReadiness";
import { READINESS_META, OWNER_LABEL, isReadinessDone, type ReadinessRow } from "./types";

export default function RbtReadiness() {
  const { user } = useAuth();
  const { rows, loading, error, stats, reload } = useReadiness(user?.id ?? null);
  const [selected, setSelected] = useState<ReadinessRow | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  if (loading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  const { total, complete, percent, nextRow, blocker } = stats;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your readiness</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{complete} of {total} steps complete</p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Only our team can mark a step complete.</p>
      </section>

      {nextRow && !blocker && (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-xs uppercase tracking-widest text-primary">Next step</p>
          <p className="mt-1 text-base font-medium">{nextRow.gate.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {nextRow.gate.employee_instructions ?? "Our team will guide you when it's time."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Owner: {OWNER_LABEL[nextRow.gate.owner_role] ?? nextRow.gate.owner_role}
            {nextRow.state.due_at && <> · Due {new Date(nextRow.state.due_at).toLocaleDateString()}</>}
          </p>
        </section>
      )}

      {blocker && (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-destructive">Blocker</p>
              <p className="mt-1 text-base font-medium">{blocker.gate.label}</p>
              {blocker.state.blocker_note && (
                <p className="mt-1 text-sm text-muted-foreground">{blocker.state.blocker_note}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {OWNER_LABEL[blocker.gate.owner_role] ?? blocker.gate.owner_role} is working on this.
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <p className="mb-2 px-1 text-xs uppercase tracking-widest text-muted-foreground">All steps</p>
        <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
          {(rows ?? []).map((r) => {
            const done = isReadinessDone(r.state.status);
            const overdue = !done && r.state.due_at && new Date(r.state.due_at) < new Date();
            const Icon = done ? CheckCircle2
              : overdue ? AlertTriangle
              : r.state.status !== "not_started" ? Clock
              : Circle;
            return (
              <li key={r.state.id}>
                <button onClick={() => setSelected(r)} className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/50 transition">
                  <Icon className={`h-5 w-5 shrink-0 ${done ? "text-primary" : overdue ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.gate.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className={READINESS_META[r.state.status].tone}>{READINESS_META[r.state.status].label}</span>
                      {" · "}Owner: {OWNER_LABEL[r.gate.owner_role] ?? r.gate.owner_role}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => setSupportOpen(true)}>
          <LifeBuoy className="h-4 w-4 mr-1.5" /> Request support
        </Button>
      </div>

      <GateDetailSheet row={selected} onClose={() => setSelected(null)} onSupport={() => { setSelected(null); setSupportOpen(true); }} />
      <SupportSheet
        open={supportOpen}
        gateKey={selected?.gate.key}
        onClose={() => setSupportOpen(false)}
        onSent={() => { setSupportOpen(false); void reload(); toast.success("Support request sent."); }}
      />
    </div>
  );
}

function GateDetailSheet({ row, onClose, onSupport }: { row: ReadinessRow | null; onClose: () => void; onSupport: () => void }) {
  if (!row) return null;
  const done = isReadinessDone(row.state.status);
  return (
    <Sheet open={!!row} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>{row.gate.label}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-xs text-muted-foreground">
            <span className={READINESS_META[row.state.status].tone}>{READINESS_META[row.state.status].label}</span>
            {" · "}Owner: {OWNER_LABEL[row.gate.owner_role] ?? row.gate.owner_role}
          </div>
          {row.gate.employee_instructions && <p className="text-sm">{row.gate.employee_instructions}</p>}
          {row.state.blocker_note && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/30 p-3 text-sm">
              <p className="text-xs uppercase tracking-widest text-destructive mb-1">Note</p>
              {row.state.blocker_note}
            </div>
          )}
          {!done && (
            <Button onClick={onSupport} variant="outline" className="w-full">
              <LifeBuoy className="h-4 w-4 mr-1.5" /> Ask for help on this step
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SupportSheet({ open, gateKey, onClose, onSent }:
  { open: boolean; gateKey?: string; onClose: () => void; onSent: () => void }) {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const isPreviewing = Boolean(osRole?.isPreviewing);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function send() {
    if (!user || !subject.trim()) return;
    if (isPreviewing) { toast.info("Read-only in preview mode."); return; }
    setSaving(true);
    const { error } = await supabase.from("rbt_readiness_support_requests" as any).insert({
      employee_id: user.id, gate_key: gateKey ?? null, subject: subject.trim(), body: body.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSubject(""); setBody(""); onSent();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>Request support</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea placeholder="How can we help?" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          <Button onClick={send} disabled={saving || !subject.trim() || isPreviewing} className="w-full">
            {saving ? "Sending…" : isPreviewing ? "Read-only in preview" : "Send request"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}