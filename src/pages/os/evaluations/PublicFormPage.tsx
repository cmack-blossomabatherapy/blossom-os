import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import type { FormSection } from "./types";

interface FormPayload {
  token_id: string;
  response_type: "Self" | "Leadership";
  used_at: string | null;
  employee: { first_name: string; last_name: string; role: string; state: string | null; email: string };
  reviewer_name: string | null;
  evaluation: { id: string; evaluation_type: "Quarterly" | "Annual" };
  cycle_name: string;
  due_date: string | null;
  form: { id: string; name: string; questions_json: { sections: FormSection[] } };
}

const RATING_LABELS: Record<number, string> = {
  1: "Needs Immediate Improvement",
  2: "Developing",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Exceptional",
};

export default function PublicFormPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<FormPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_eval_form_by_token", { p_token: token });
      setLoading(false);
      if (error) return setError(error.message);
      const p = data as unknown as ({ error?: string } & FormPayload);
      if (p?.error) return setError(p.error);
      setPayload(p as FormPayload);
      if (p.used_at) setDone(true);
    })();
  }, [token]);

  function setAnswer(key: string, val: string | number) {
    setAnswers((a) => ({ ...a, [key]: val }));
  }

  async function submit() {
    if (!payload || !acknowledged || !signature.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_eval_form_response", {
      p_token: payload.token_id,
      p_answers: answers,
      p_signature: signature.trim(),
    });
    setSubmitting(false);
    if (error) return setError(error.message);
    const r = data as { error?: string; ok?: boolean };
    if (r?.error) return setError(r.error);
    setDone(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30">
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading form...</div>
      </div>
    );
  }
  if (error || !payload) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30 p-6">
        <div className="max-w-md text-center rounded-2xl border bg-card p-8">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
          <h1 className="text-lg font-semibold mt-3">Form unavailable</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {error === "expired" ? "This evaluation link has expired."
              : error === "invalid_token" ? "This link is not valid."
              : error === "already_submitted" ? "This evaluation has already been submitted."
              : "Please contact HR for a new link."}
          </p>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30 p-6">
        <div className="max-w-md text-center rounded-2xl border bg-card p-8">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
          <h1 className="text-lg font-semibold mt-3">Thank you</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your {payload.response_type === "Self" ? "self-evaluation" : "leadership evaluation"} has been submitted to Blossom ABA Therapy.
          </p>
        </div>
      </div>
    );
  }

  const sections = payload.form.questions_json.sections ?? [];

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Blossom ABA Therapy</span>
        </div>
        <h1 className="text-2xl font-semibold">{payload.form.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {payload.employee.first_name} {payload.employee.last_name} · {payload.employee.role}
          {payload.employee.state ? ` · ${payload.employee.state}` : ""}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground rounded-xl border bg-card p-3">
          <div><span className="font-medium text-foreground">Type:</span> {payload.evaluation.evaluation_type} {payload.response_type}</div>
          <div><span className="font-medium text-foreground">Reviewer:</span> {payload.reviewer_name ?? "—"}</div>
          <div><span className="font-medium text-foreground">Due:</span> {payload.due_date ?? "TBD"}</div>
        </div>

        <div className="mt-6 space-y-6">
          {sections.map((sec, idx) => (
            <div key={idx} className="rounded-2xl border bg-card p-5">
              <h2 className="text-base font-semibold">{sec.title}</h2>
              {sec.type === "ratings" && (sec as Extract<FormSection,{type:"ratings"}>).description && (
                <p className="text-xs text-muted-foreground mt-1">{(sec as Extract<FormSection,{type:"ratings"}>).description}</p>
              )}
              <div className="mt-4 space-y-4">
                {sec.type === "ratings" && (sec as Extract<FormSection,{type:"ratings"}>).items.map((item) => {
                  const key = `rating::${sec.title}::${item}`;
                  return (
                    <div key={key}>
                      <Label className="text-sm">{item}</Label>
                      <div className="mt-1.5 flex gap-2">
                        {[1,2,3,4,5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setAnswer(key, n)}
                            className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
                              answers[key] === n ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                            }`}
                            title={RATING_LABELS[n]}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-xs text-muted-foreground self-center">
                          {answers[key] ? RATING_LABELS[answers[key] as number] : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {sec.type === "longtext" && (sec as Extract<FormSection,{type:"longtext"}>).items.map((q) => {
                  const key = `text::${sec.title}::${q}`;
                  return (
                    <div key={key}>
                      <Label className="text-sm">{q}</Label>
                      <Textarea
                        rows={3}
                        className="mt-1.5"
                        value={(answers[key] as string) ?? ""}
                        onChange={(e) => setAnswer(key, e.target.value)}
                      />
                    </div>
                  );
                })}
                {sec.type === "acknowledgment" && (
                  <div className="space-y-3">
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(!!v)} />
                      <span>I confirm that the information submitted is accurate to the best of my knowledge.</span>
                    </label>
                    <div>
                      <Label className="text-sm">Typed signature</Label>
                      <Input className="mt-1.5" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your full name" />
                    </div>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date().toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pb-10">
            <Button onClick={submit} disabled={submitting || !acknowledged || !signature.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Evaluation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}