import { useMemo, useState } from "react";
import { FileText, Eye, Sparkles, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { EvaluationsData } from "../useEvaluationsData";
import type { EvalForm, FormSection } from "../types";

const RATING_LABELS: Record<number, string> = {
  1: "Needs Immediate Improvement",
  2: "Developing",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Exceptional",
};

function BrandedFormPreview({ form }: { form: EvalForm }) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [signature, setSignature] = useState("");

  const sections = form.questions_json?.sections ?? [];
  const totalRatings = useMemo(
    () =>
      sections
        .filter((s): s is Extract<FormSection, { type: "ratings" }> => s.type === "ratings")
        .reduce((acc, s) => acc + s.items.length, 0),
    [sections]
  );
  const answeredRatings = useMemo(
    () => Object.keys(answers).filter((k) => k.startsWith("rating::")).length,
    [answers]
  );
  const progress = totalRatings ? Math.round((answeredRatings / totalRatings) * 100) : 0;

  function setAnswer(key: string, val: string | number) {
    setAnswers((a) => ({ ...a, [key]: val }));
  }

  return (
    <div className="bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Branded header */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-8 w-8 rounded-xl bg-primary/10 grid place-items-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">Blossom ABA Therapy</p>
                <p className="text-[11px] text-muted-foreground">Performance Evaluation</p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">Preview</Badge>
          </div>

          <h1 className="mt-5 text-2xl md:text-[26px] font-semibold tracking-tight">
            {form.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {form.staff_role} · {form.evaluation_type} · {form.form_type} Form
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              { l: "Employee", v: "Jordan Rivera" },
              { l: "Role", v: form.staff_role },
              { l: "Reviewer", v: form.form_type === "Leadership" ? "Selected at submission" : "Alex Chen, BCBA" },
              { l: "Due", v: "Sample preview" },
            ].map((m) => (
              <div key={m.l} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.l}</p>
                <p className="text-[13px] font-medium text-foreground truncate">{m.v}</p>
              </div>
            ))}
          </div>

          {totalRatings > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Progress</span>
                <span>{answeredRatings} / {totalRatings} ratings</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form body */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-8 space-y-5">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-16px_hsl(var(--primary)/0.12)]"
          >
            <div className="px-5 py-4 border-b border-border/60 flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight">{sec.title}</h2>
                {sec.type === "ratings" && (sec as Extract<FormSection, { type: "ratings" }>).description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(sec as Extract<FormSection, { type: "ratings" }>).description}
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 space-y-5">
              {sec.type === "ratings" &&
                (sec as Extract<FormSection, { type: "ratings" }>).items.map((item) => {
                  const key = `rating::${sec.title}::${item}`;
                  const val = answers[key] as number | undefined;
                  return (
                    <div key={key}>
                      <Label className="text-[13px] font-medium">{item}</Label>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setAnswer(key, n)}
                            className={`h-10 w-10 rounded-xl border text-sm font-medium transition ${
                              val === n
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background border-border/70 hover:bg-muted text-foreground"
                            }`}
                            title={RATING_LABELS[n]}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-xs text-muted-foreground ml-1 min-h-[1.25rem]">
                          {val ? RATING_LABELS[val] : "Select a rating"}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {sec.type === "longtext" &&
                (sec as Extract<FormSection, { type: "longtext" }>).items.map((q) => {
                  const key = `text::${sec.title}::${q}`;
                  return (
                    <div key={key}>
                      <Label className="text-[13px] font-medium">{q}</Label>
                      <Textarea
                        rows={3}
                        className="mt-2 rounded-xl"
                        placeholder="Type your response…"
                        value={(answers[key] as string) ?? ""}
                        onChange={(e) => setAnswer(key, e.target.value)}
                      />
                    </div>
                  );
                })}

              {sec.type === "acknowledgment" && (
                <div className="space-y-4">
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={acknowledged}
                      onCheckedChange={(v) => setAcknowledged(!!v)}
                      className="mt-0.5"
                    />
                    <span className="text-foreground">
                      I confirm that the information submitted is accurate to the best of my knowledge.
                    </span>
                  </label>
                  <div>
                    <Label className="text-[13px] font-medium">Typed signature</Label>
                    <Input
                      className="mt-2 rounded-xl"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your full name"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Submission timestamp and IP recorded for HR compliance.
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <span>This is exactly what staff will see when filling out the form.</span>
          <span className="font-medium text-foreground">Preview mode</span>
        </div>

        <div className="flex justify-end gap-2 pb-2">
          <Button variant="ghost" disabled>Save Draft</Button>
          <Button disabled className="rounded-xl">Submit Evaluation</Button>
        </div>
      </div>
    </div>
  );
}

export default function FormsTab({ data }: { data: EvaluationsData }) {
  const [preview, setPreview] = useState<EvalForm | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Standardized templates power every self and leadership evaluation. Click preview to see exactly what staff will fill out.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {data.forms.map((f) => {
          const sectionCount = f.questions_json?.sections?.length ?? 0;
          return (
            <div
              key={f.id}
              className="rounded-2xl border border-border/70 bg-card p-4 flex items-start gap-3 transition hover:border-border hover:-translate-y-0.5"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {f.staff_role} · {f.evaluation_type} · {f.form_type} · {sectionCount} sections
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreview(f)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Preview
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl w-[96vw] p-0 overflow-hidden gap-0 max-h-[92vh]">
          <DialogTitle className="sr-only">{preview?.name ?? "Form preview"}</DialogTitle>
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/60 bg-background/80 backdrop-blur">
            <p className="text-xs text-muted-foreground">Branded staff-facing form preview</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full"
              onClick={() => setPreview(null)}
            >
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
          </div>
          <div className="max-h-[calc(92vh-44px)] overflow-y-auto">
            {preview && <BrandedFormPreview form={preview} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}