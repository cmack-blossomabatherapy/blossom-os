import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Search,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormSection } from "./types";

interface FormPayload {
  token_id: string;
  response_type: "Self" | "Leadership";
  used_at: string | null;
  employee: { first_name: string; last_name: string; role: string; state: string | null; email: string };
  reviewer_name: string | null;
  evaluation: { id: string; evaluation_type: string };
  due_date: string | null;
  form: { id: string; name: string; questions_json: { sections: FormSection[] } };
}

interface ReviewerOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  state: string | null;
  email: string;
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

  // Reviewer picker state (Leadership only)
  const [reviewer, setReviewer] = useState<ReviewerOption | null>(null);
  const [reviewerQuery, setReviewerQuery] = useState("");
  const [reviewerResults, setReviewerResults] = useState<ReviewerOption[]>([]);
  const [reviewerOpen, setReviewerOpen] = useState(false);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const reviewerBoxRef = useRef<HTMLDivElement | null>(null);

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

  // Debounced reviewer search
  useEffect(() => {
    if (!payload || payload.response_type !== "Leadership") return;
    if (!reviewerOpen) return;
    const handle = setTimeout(async () => {
      setReviewerLoading(true);
      const { data } = await supabase.rpc("search_eval_reviewers", {
        p_token: payload.token_id,
        p_query: reviewerQuery,
      });
      setReviewerLoading(false);
      if (Array.isArray(data)) setReviewerResults(data as unknown as ReviewerOption[]);
      else setReviewerResults([]);
    }, 180);
    return () => clearTimeout(handle);
  }, [reviewerQuery, reviewerOpen, payload]);

  // Click-outside to close reviewer dropdown
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!reviewerBoxRef.current) return;
      if (!reviewerBoxRef.current.contains(e.target as Node)) setReviewerOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const sections = payload?.form.questions_json.sections ?? [];

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

  const needsReviewer = payload?.response_type === "Leadership";
  const canSubmit =
    !!payload &&
    acknowledged &&
    signature.trim().length > 0 &&
    (!needsReviewer || !!reviewer);

  async function submit() {
    if (!payload || !canSubmit) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_eval_form_response", {
      p_token: payload.token_id,
      p_answers: answers,
      p_signature: signature.trim(),
      p_reviewer_id: reviewer?.id ?? null,
    });
    setSubmitting(false);
    if (error) return setError(error.message);
    const r = data as { error?: string; ok?: boolean };
    if (r?.error) return setError(r.error);
    setDone(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading form…
        </div>
      </div>
    );
  }
  if (error || !payload) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-primary/5 via-background to-background p-6">
        <div className="max-w-md text-center rounded-2xl border border-border/70 bg-card p-8 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_36px_-20px_hsl(var(--primary)/0.18)]">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
          <h1 className="text-lg font-semibold mt-3">Form unavailable</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {error === "expired"
              ? "This evaluation link has expired."
              : error === "invalid_token"
              ? "This link is not valid."
              : error === "already_submitted"
              ? "This evaluation has already been submitted."
              : "Please contact HR for a new link."}
          </p>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-primary/5 via-background to-background p-6">
        <div className="max-w-md text-center rounded-2xl border border-border/70 bg-card p-8 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_36px_-20px_hsl(var(--primary)/0.18)]">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
          <h1 className="text-lg font-semibold mt-3">Thank you</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your {payload.response_type === "Self" ? "self-evaluation" : "leadership evaluation"} has been
            submitted to Blossom ABA Therapy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Branded sticky header */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-5">
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
            <Badge variant="secondary" className="rounded-full">
              {payload.evaluation.evaluation_type} · {payload.response_type}
            </Badge>
          </div>

          <h1 className="mt-5 text-2xl md:text-[26px] font-semibold tracking-tight">
            {payload.form.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {payload.employee.first_name} {payload.employee.last_name} · {payload.employee.role}
            {payload.employee.state ? ` · ${payload.employee.state}` : ""}
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              { l: "Employee", v: `${payload.employee.first_name} ${payload.employee.last_name}` },
              { l: "Role", v: payload.employee.role },
              {
                l: "Reviewer",
                v: reviewer
                  ? `${reviewer.first_name} ${reviewer.last_name}`
                  : payload.reviewer_name ?? "—",
              },
              { l: "Due", v: payload.due_date ?? "TBD" },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-xl border border-border/60 bg-background/60 px-3 py-2"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.l}</p>
                <p className="text-[13px] font-medium text-foreground truncate">{m.v}</p>
              </div>
            ))}
          </div>

          {totalRatings > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Progress</span>
                <span>
                  {answeredRatings} / {totalRatings} ratings
                </span>
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
        {/* Reviewer picker (Leadership only) */}
        {needsReviewer && (
          <div
            className={cn(
              "rounded-2xl border bg-card shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-16px_hsl(var(--primary)/0.12)]",
              reviewer ? "border-border/70" : "border-primary/40 ring-1 ring-primary/15"
            )}
          >
            <div className="px-5 py-4 border-b border-border/60 flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <UserRound className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight">Who is completing this review?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start typing your name — select yourself from the list.
                </p>
              </div>
              {reviewer && (
                <Badge variant="secondary" className="rounded-full text-[10.5px]">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Selected
                </Badge>
              )}
            </div>
            <div className="p-5">
              <div ref={reviewerBoxRef} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 pl-9 rounded-xl"
                  placeholder="Type a name…"
                  value={
                    reviewer && !reviewerOpen
                      ? `${reviewer.first_name} ${reviewer.last_name}`
                      : reviewerQuery
                  }
                  onFocus={() => {
                    setReviewerOpen(true);
                    if (reviewer) {
                      setReviewerQuery(`${reviewer.first_name} ${reviewer.last_name}`);
                    }
                  }}
                  onChange={(e) => {
                    setReviewerQuery(e.target.value);
                    setReviewerOpen(true);
                    if (reviewer) setReviewer(null);
                  }}
                />
                {reviewerOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-border/70 bg-popover shadow-[0_12px_36px_-16px_hsl(var(--primary)/0.25)] overflow-hidden">
                    {reviewerLoading ? (
                      <div className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching staff…
                      </div>
                    ) : reviewerResults.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-muted-foreground">
                        {reviewerQuery.trim()
                          ? "No staff match that name."
                          : "Type at least one letter to search."}
                      </div>
                    ) : (
                      <ul className="max-h-72 overflow-y-auto py-1">
                        {reviewerResults.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewer(r);
                                setReviewerQuery("");
                                setReviewerOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted transition flex items-center gap-3"
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold shrink-0">
                                {r.first_name[0]}
                                {r.last_name[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {r.first_name} {r.last_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {r.role}
                                  {r.state ? ` · ${r.state}` : ""} · {r.email}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {reviewer && (
                <p className="text-[11.5px] text-muted-foreground mt-2">
                  Reviewing as <span className="font-medium text-foreground">{reviewer.first_name} {reviewer.last_name}</span> · {reviewer.role}
                </p>
              )}
            </div>
          </div>
        )}

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
                {sec.type === "ratings" &&
                  (sec as Extract<FormSection, { type: "ratings" }>).description && (
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
                            className={cn(
                              "h-10 w-10 rounded-xl border text-sm font-medium transition",
                              val === n
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background border-border/70 hover:bg-muted text-foreground"
                            )}
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
                    Submission timestamp recorded for HR compliance.
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 pb-10 pt-2">
          <p className="text-[11px] text-muted-foreground">
            {needsReviewer && !reviewer
              ? "Select yourself as the reviewer to submit."
              : !acknowledged || !signature.trim()
              ? "Acknowledge and sign to submit."
              : "Ready to submit."}
          </p>
          <Button
            onClick={submit}
            disabled={submitting || !canSubmit}
            className="rounded-xl h-10"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit Evaluation
          </Button>
        </div>
      </div>
    </div>
  );
}