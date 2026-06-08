/**
 * Welcome to Blossom — written reflection capture.
 *
 * Stores answers per question in the `training_reflections` table so the
 * learner's own answers persist across devices and admins / mentors can
 * review them from Training Management.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export interface ReflectionQuestion {
  key: string;
  question: string;
}

interface Props {
  context: string;
  questions: ReflectionQuestion[];
  /** Optional intro under the section title. */
  description?: string;
}

type Status = "idle" | "saving" | "saved" | "error";

export function WelcomeReflectionForm({ context, questions, description }: Props) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  const questionMap = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.key, q.question])),
    [questions],
  );

  // Load existing answers for this user + context.
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("training_reflections")
      .select("question_key, answer")
      .eq("user_id", user.id)
      .eq("context", context)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
        } else if (data) {
          const next: Record<string, string> = {};
          for (const row of data) {
            if (row.question_key) next[row.question_key] = row.answer ?? "";
          }
          setAnswers(next);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, context]);

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStatuses((prev) => ({ ...prev, [key]: "saving" }));
    if (debounceRefs.current[key]) clearTimeout(debounceRefs.current[key]!);
    debounceRefs.current[key] = setTimeout(() => {
      void persist(key, value);
    }, 600);
  };

  const persist = async (key: string, value: string) => {
    if (!user?.id) {
      setStatuses((prev) => ({ ...prev, [key]: "error" }));
      return;
    }
    const { error } = await supabase
      .from("training_reflections")
      .upsert(
        {
          user_id: user.id,
          context,
          question_key: key,
          question_text: questionMap[key] ?? null,
          answer: value,
        },
        { onConflict: "user_id,context,question_key" },
      );
    setStatuses((prev) => ({ ...prev, [key]: error ? "error" : "saved" }));
  };

  if (!user) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Sign in to save your reflections to your training record.
      </p>
    );
  }

  const answeredCount = questions.filter((q) => (answers[q.key] ?? "").trim().length > 0).length;

  return (
    <div data-testid="welcome-reflection-form" className="space-y-4">
      {description && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Saved to your training record · visible to your mentor and HR
        </span>
        <span>
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200/70 bg-rose-50/60 px-3 py-2 text-[12px] text-rose-900">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Couldn&apos;t load your saved answers: {loadError}</span>
        </div>
      )}

      <ul className="grid gap-4">
        {questions.map((q) => {
          const status = statuses[q.key] ?? "idle";
          const value = answers[q.key] ?? "";
          return (
            <li key={q.key} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <label className="block">
                <span className="text-[13px] font-medium text-foreground">{q.question}</span>
                <textarea
                  data-testid={`welcome-reflection-input-${q.key}`}
                  className="mt-2 w-full min-h-[88px] rounded-xl border border-border/60 bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={loading ? "Loading your saved answer…" : "Write a few honest sentences. Saves automatically."}
                  disabled={loading}
                  value={value}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  maxLength={2000}
                />
              </label>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <SaveIndicator status={status} />
                <span>{value.length}/2000</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SaveIndicator({ status }: { status: Status }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-emerald-600")}>
        <CheckCircle2 className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-rose-600">
        <AlertCircle className="h-3 w-3" /> Couldn&apos;t save — try again
      </span>
    );
  }
  return <span className="opacity-0">·</span>;
}