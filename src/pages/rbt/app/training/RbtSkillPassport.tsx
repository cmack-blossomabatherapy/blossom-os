import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SKILL_META, type SkillState } from "./types";

interface Def { key: string; label: string; category: string; sort_order: number; }
interface Status { skill_key: string; state: SkillState; last_updated_at: string; last_evaluator_id: string | null; last_evaluation_id: string | null; }
interface Evaluation {
  id: string; skill_key: string; evaluator_id: string; evaluator_role: string | null;
  evaluated_at: string; context: string | null; rating: SkillState; notes: string | null;
  follow_up_action: string | null; attachment_url: string | null;
  employee_acknowledged_at: string | null; employee_acknowledgment_note: string | null;
}

export default function RbtSkillPassport() {
  const { user } = useAuth();
  const [defs, setDefs] = useState<Def[] | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Def | null>(null);

  async function load() {
    if (!user) return;
    const [d, s, e] = await Promise.all([
      supabase.from("rbt_skill_definitions" as any).select("*").eq("is_active", true).order("sort_order"),
      supabase.from("rbt_skill_status" as any).select("*").eq("employee_id", user.id),
      supabase.from("rbt_skill_evaluations" as any).select("*").eq("employee_id", user.id).order("evaluated_at", { ascending: false }),
    ]);
    setDefs(((d.data as any[]) ?? []) as Def[]);
    const map: Record<string, Status> = {};
    ((s.data as any[]) ?? []).forEach((r: any) => { map[r.skill_key] = r; });
    setStatus(map);
    setEvals(((e.data as any[]) ?? []) as Evaluation[]);
  }
  useEffect(() => { void load(); }, [user?.id]);

  const grouped = useMemo(() => {
    const g = new Map<string, Def[]>();
    (defs ?? []).forEach((d) => { g.set(d.category, [...(g.get(d.category) ?? []), d]); });
    return Array.from(g.entries());
  }, [defs]);

  if (defs === null) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  const totalCompetent = Object.values(status).filter((s) => s.state === "competent").length;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Skill Passport</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {totalCompetent}<span className="text-base text-muted-foreground"> of {defs.length} competent</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only evaluators can change a skill state. Tap a skill to see your history and acknowledge feedback.
        </p>
      </section>

      {grouped.map(([category, list]) => (
        <section key={category}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1 capitalize">{category.replace(/_/g," ")}</p>
          <ul className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
            {list.map((d) => {
              const st = status[d.key];
              const state = (st?.state ?? "introduced") as SkillState;
              const meta = SKILL_META[state];
              const evalCount = evals.filter((e) => e.skill_key === d.key).length;
              const unackd = evals.some((e) => e.skill_key === d.key && !e.employee_acknowledged_at);
              return (
                <li key={d.key}>
                  <button onClick={() => setSelected(d)} className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/50 transition">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{d.label}</p>
                      <p className={`text-xs ${meta.tone} truncate`}>
                        {meta.label}
                        {evalCount > 0 && <span className="text-muted-foreground"> · {evalCount} evaluation{evalCount === 1 ? "" : "s"}</span>}
                      </p>
                    </div>
                    {unackd && <span className="text-[10px] font-medium rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5">Ack</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {selected && (
        <SkillSheet
          def={selected}
          state={(status[selected.key]?.state ?? "introduced") as SkillState}
          evaluations={evals.filter((e) => e.skill_key === selected.key)}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); void load(); }}
        />
      )}
    </div>
  );
}

function SkillSheet({ def, state, evaluations, onClose, onSaved }:
  { def: Def; state: SkillState; evaluations: Evaluation[]; onClose: () => void; onSaved: () => void }) {
  const [ackNote, setAckNote] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = SKILL_META[state];

  async function acknowledge(id: string) {
    setSaving(true);
    const { error } = await supabase.from("rbt_skill_evaluations" as any)
      .update({ employee_acknowledged_at: new Date().toISOString(), employee_acknowledgment_note: ackNote.trim() || null })
      .eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Acknowledged");
    setAckNote("");
    onSaved();
  }

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{def.label}</SheetTitle></SheetHeader>
        <div className="mt-3 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span className={`text-sm ${meta.tone}`}>{meta.label}</span>
          </div>
          {evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluations yet. Your first review will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {evaluations.map((ev) => (
                <li key={ev.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(ev.evaluated_at).toLocaleDateString()}{ev.context && <> · {ev.context}</>}</span>
                    <span className={SKILL_META[ev.rating].tone}>{SKILL_META[ev.rating].label}</span>
                  </div>
                  {ev.notes && <p className="mt-2 text-sm">{ev.notes}</p>}
                  {ev.follow_up_action && (
                    <p className="mt-2 text-xs text-muted-foreground">Follow-up: {ev.follow_up_action}</p>
                  )}
                  {ev.attachment_url && (
                    <a href={ev.attachment_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline underline-offset-4">
                      View attachment
                    </a>
                  )}
                  {!ev.employee_acknowledged_at ? (
                    <div className="mt-3 space-y-2">
                      <Textarea rows={2} value={ackNote} onChange={(e) => setAckNote(e.target.value)} placeholder="Your acknowledgment (optional)" />
                      <Button size="sm" onClick={() => acknowledge(ev.id)} disabled={saving}>Acknowledge</Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-primary">
                      Acknowledged {new Date(ev.employee_acknowledged_at).toLocaleDateString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}