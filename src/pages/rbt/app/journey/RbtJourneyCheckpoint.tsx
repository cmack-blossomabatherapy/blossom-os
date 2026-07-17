import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardFrame } from "../CardFrame";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TOPIC_DEFS, CAREER_INTERESTS } from "./topics";
import { Sparkles } from "lucide-react";

function Scale({ def, value, onChange }: { def: (typeof TOPIC_DEFS)[string]; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">{def.prompt}</p>
      {def.helper && <p className="text-xs text-muted-foreground mt-0.5">{def.helper}</p>}
      <div className="grid grid-cols-5 gap-2 mt-2">
        {[1,2,3,4,5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`h-11 min-h-11 rounded-xl border text-sm font-medium transition ${value === n ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/40 hover:bg-muted"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
        <span>{def.minLabel}</span><span>{def.maxLabel}</span>
      </div>
    </div>
  );
}

export default function RbtJourneyCheckpoint() {
  const { user } = useAuth();
  const { instanceId } = useParams();
  const nav = useNavigate();
  const [instance, setInstance] = useState<any | null>(null);
  const [cfg, setCfg] = useState<any | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [safety, setSafety] = useState(false); const [safetyNote, setSafetyNote] = useState("");
  const [familyNote, setFamilyNote] = useState("");
  const [trainingNote, setTrainingNote] = useState("");
  const [payrollNote, setPayrollNote] = useState("");
  const [reflection, setReflection] = useState("");
  const [freeText, setFreeText] = useState("");
  const [careers, setCareers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!instanceId) return;
    void (async () => {
      const { data: i } = await supabase.from("rbt_journey_instances" as any).select("*").eq("id", instanceId).maybeSingle();
      if (!i) return;
      setInstance(i);
      const { data: c } = await supabase.from("rbt_journey_checkpoints" as any).select("*").eq("key", (i as any).checkpoint_key).maybeSingle();
      setCfg(c);
      if ((i as any).status === "scheduled" || (i as any).status === "open") {
        await supabase.from("rbt_journey_instances" as any).update({ opened_at: new Date().toISOString(), status: "open" }).eq("id", (i as any).id);
      }
    })();
  }, [instanceId]);

  const topics = useMemo<string[]>(() => cfg?.questionnaire_topics ?? [], [cfg]);
  const isMilestone = cfg?.is_celebration;
  const showCareer = topics.includes("career_interest");

  if (!instance || !cfg) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("rbt_journey_responses" as any).insert({
      instance_id: instance.id, employee_id: instance.employee_id,
      topic_scores: scores,
      safety_concern: safety, safety_concern_note: safety ? safetyNote || null : null,
      family_barrier_note: familyNote || null,
      training_need_note: trainingNote || null,
      payroll_concern_note: payrollNote || null,
      reflection: reflection || null,
      career_interest: careers,
      free_text: freeText || null,
    });
    if (careers.length) {
      await supabase.from("rbt_career_interests" as any).upsert({
        employee_id: instance.employee_id,
        interested_in_lead: careers.includes("lead_rbt"),
        interested_in_fellowship: careers.includes("bcba_pathway"),
        notes: careers.join(", "),
      } as any, { onConflict: "employee_id" } as any);
    }
    setSaving(false);
    if (error) return toast.error(error.message || "Could not submit");
    toast.success("Thanks — your check-in has been shared with your support team.");
    nav("/rbt/app/journey");
  };

  return (
    <div className="space-y-3">
      <CardFrame
        title={cfg.label}
        subtitle={cfg.supportive_intro ?? "Your answers help us support you — they are not scored back to you."}
        state="success"
      >
        {isMilestone && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary/10 text-primary p-3 text-sm">
            <Sparkles className="h-4 w-4" /> Congratulations on this milestone.
          </div>
        )}
        <div className="space-y-5">
          {topics.filter((t) => t !== "career_interest").map((t) => {
            const def = TOPIC_DEFS[t]; if (!def) return null;
            return <Scale key={t} def={def} value={scores[t] ?? null} onChange={(v) => setScores((s) => ({ ...s, [t]: v }))} />;
          })}
        </div>
      </CardFrame>

      {(topics.includes("family_barriers") || topics.includes("training_needs") || topics.includes("payroll_concerns")) && (
        <CardFrame title="Optional context" subtitle="Any details help your team support you." state="success">
          <div className="space-y-4">
            {topics.includes("family_barriers") && (
              <div><label className="text-sm font-medium">Family or caregiver barriers</label>
                <textarea rows={2} value={familyNote} onChange={(e) => setFamilyNote(e.target.value)} className="mt-2 w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" /></div>
            )}
            {topics.includes("training_needs") && (
              <div><label className="text-sm font-medium">Training that would help you</label>
                <textarea rows={2} value={trainingNote} onChange={(e) => setTrainingNote(e.target.value)} className="mt-2 w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" /></div>
            )}
            {topics.includes("payroll_concerns") && (
              <div><label className="text-sm font-medium">Hours or pay concerns</label>
                <textarea rows={2} value={payrollNote} onChange={(e) => setPayrollNote(e.target.value)} className="mt-2 w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" /></div>
            )}
          </div>
        </CardFrame>
      )}

      <CardFrame title="Safety" subtitle="If something felt unsafe, tell us — we take it seriously." state="success">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} className="h-5 w-5" />
          <span className="text-sm font-medium">I want to flag a safety concern</span>
        </label>
        {safety && (
          <textarea rows={2} value={safetyNote} onChange={(e) => setSafetyNote(e.target.value)} placeholder="Describe the concern."
            className="mt-2 w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" />
        )}
      </CardFrame>

      {(isMilestone || topics.includes("intent_to_stay")) && (
        <CardFrame title={isMilestone ? "Reflection" : "Anything else?"} state="success">
          <textarea rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)}
            placeholder={isMilestone ? "What are you most proud of? What do you want next?" : "Optional — anything you want us to know."}
            className="w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" />
        </CardFrame>
      )}

      {showCareer && (
        <CardFrame title="Where do you see yourself growing?" subtitle="Pick anything that interests you — no pressure." state="success">
          <div className="grid grid-cols-2 gap-2">
            {CAREER_INTERESTS.map((c) => {
              const on = careers.includes(c.key);
              return (
                <button key={c.key} type="button"
                  onClick={() => setCareers((cs) => on ? cs.filter((x) => x !== c.key) : [...cs, c.key])}
                  className={`text-left h-11 min-h-11 rounded-xl border px-3 text-sm ${on ? "bg-primary/10 border-primary text-primary" : "border-border"}`}>
                  {c.label}
                </button>
              );
            })}
          </div>
          {cfg.key === "day_90" && (
            <p className="text-xs text-muted-foreground mt-3">Interested in becoming a BCBA? Ask your team about the Blossom BCBA Fellowship.</p>
          )}
        </CardFrame>
      )}

      <CardFrame title="Anything to add?" state="success">
        <textarea rows={2} value={freeText} onChange={(e) => setFreeText(e.target.value)}
          placeholder="Optional" className="w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" />
      </CardFrame>

      <button onClick={submit} disabled={saving}
        className="w-full rounded-xl bg-primary text-primary-foreground h-12 min-h-12 text-sm font-semibold disabled:opacity-60">
        {saving ? "Submitting…" : "Submit check-in"}
      </button>
      <p className="text-center text-xs text-muted-foreground">Your answers go to your BCBA and support team. You will not see a risk score.</p>
    </div>
  );
}