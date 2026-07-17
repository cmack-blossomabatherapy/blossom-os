import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardFrame } from "../CardFrame";
import { useAuth } from "@/contexts/AuthContext";
import { useFirstCase } from "./useFirstCase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function Scale({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`h-11 min-h-11 rounded-xl border text-sm font-medium transition ${value === n ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/40 hover:bg-muted"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FirstSessionCheckin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { primary, loading } = useFirstCase(user?.id);

  const [confidence, setConfidence] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number | null>(null);
  const [support, setSupport] = useState<number | null>(null);
  const [scheduleAccuracy, setScheduleAccuracy] = useState<number | null>(null);
  const [crWorked, setCrWorked] = useState<boolean | null>(null);
  const [family, setFamily] = useState(false); const [familyNote, setFamilyNote] = useState("");
  const [safety, setSafety] = useState(false); const [safetyNote, setSafetyNote] = useState("");
  const [wantSupport, setWantSupport] = useState(false); const [supportNote, setSupportNote] = useState("");
  const [freeText, setFreeText] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  if (!primary) return <CardFrame title="No first case yet" state="empty" emptyLabel="Your first case will appear here once scheduled." />;

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("rbt_first_session_checkins" as any).insert({
      first_case_id: primary.id, employee_id: primary.employee_id,
      confidence, clarity, support_received: support, schedule_accuracy: scheduleAccuracy,
      centralreach_worked: crWorked,
      family_concern: family, family_concern_note: family ? familyNote || null : null,
      safety_concern: safety, safety_concern_note: safety ? safetyNote || null : null,
      additional_support_requested: wantSupport, additional_support_note: wantSupport ? supportNote || null : null,
      free_text: freeText || null,
    });
    if (!error) {
      await supabase.from("rbt_first_case" as any).update({ status: "first_session_done" }).eq("id", primary.id);
    }
    setSaving(false);
    if (error) return toast.error(error.message || "Could not submit");
    toast.success("Thanks — your team will follow up on anything you flagged.");
    nav("/rbt/app/first-case");
  };

  return (
    <div className="space-y-3">
      <CardFrame title="After your first session" subtitle="Two minutes — honest answers help us support you." state="success">
        <div className="space-y-5">
          <Scale label="How confident do you feel?" value={confidence} onChange={setConfidence} />
          <Scale label="How clear were expectations?" value={clarity} onChange={setClarity} />
          <Scale label="How supported did you feel?" value={support} onChange={setSupport} />
          <Scale label="How accurate was the schedule?" value={scheduleAccuracy} onChange={setScheduleAccuracy} />

          <div>
            <p className="text-sm font-medium mb-2">Did CentralReach work for you?</p>
            <div className="grid grid-cols-2 gap-2">
              {[{v:true,l:"Yes"},{v:false,l:"No"}].map((o) => (
                <button key={o.l} type="button" onClick={() => setCrWorked(o.v)}
                  className={`h-11 min-h-11 rounded-xl border text-sm font-medium ${crWorked === o.v ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/40"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardFrame>

      <CardFrame title="Anything to flag?" subtitle="Nothing gets ignored — items you flag stay open until resolved with you." state="success">
        <div className="space-y-4">
          {[
            { on: family, set: setFamily, note: familyNote, setNote: setFamilyNote, label: "Family / caregiver concern", ph: "What happened with the family?" },
            { on: safety, set: setSafety, note: safetyNote, setNote: setSafetyNote, label: "Safety concern", ph: "Describe the safety concern." },
            { on: wantSupport, set: setWantSupport, note: supportNote, setNote: setSupportNote, label: "I want additional support", ph: "What support would help?" },
          ].map((f) => (
            <div key={f.label}>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={f.on} onChange={(e) => f.set(e.target.checked)} className="h-5 w-5 rounded" />
                <span className="text-sm font-medium">{f.label}</span>
              </label>
              {f.on && (
                <textarea value={f.note} onChange={(e) => f.setNote(e.target.value)} placeholder={f.ph} rows={2}
                  className="mt-2 w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" />
              )}
            </div>
          ))}

          <div>
            <p className="text-sm font-medium mb-2">Anything else?</p>
            <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={3}
              placeholder="Optional — a moment, a win, a question…"
              className="w-full rounded-xl bg-muted/60 border border-border p-3 text-sm" />
          </div>
        </div>
      </CardFrame>

      <button onClick={submit} disabled={saving}
        className="w-full rounded-xl bg-primary text-primary-foreground h-12 min-h-12 text-sm font-semibold disabled:opacity-60">
        {saving ? "Submitting…" : "Submit check-in"}
      </button>
    </div>
  );
}