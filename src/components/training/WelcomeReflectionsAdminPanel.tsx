/**
 * Admin/HR view of Welcome-to-Blossom reflections.
 *
 * Lists each learner who has written a reflection along with their answers.
 * Read-only — admins do not edit learner reflections.
 */
import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReflectionRow {
  id: string;
  user_id: string;
  question_key: string;
  question_text: string | null;
  answer: string;
  updated_at: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
}

interface GroupedLearner {
  user_id: string;
  display_name: string;
  updated_at: string;
  answers: ReflectionRow[];
}

export function WelcomeReflectionsAdminPanel() {
  const [rows, setRows] = useState<ReflectionRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("training_reflections")
      .select("id,user_id,question_key,question_text,answer,updated_at")
      .eq("context", "welcome-to-blossom")
      .order("updated_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        const list = (data ?? []) as ReflectionRow[];
        setRows(list);
        const userIds = Array.from(new Set(list.map((r) => r.user_id)));
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);
          if (!cancelled && profs) {
            const map: Record<string, string> = {};
            for (const p of profs as ProfileRow[]) {
              if (p.user_id) map[p.user_id] = p.display_name ?? "";
            }
            setProfiles(map);
          }
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped: GroupedLearner[] = Object.values(
    rows.reduce<Record<string, GroupedLearner>>((acc, r) => {
      const key = r.user_id;
      if (!acc[key]) {
        acc[key] = {
          user_id: r.user_id,
          display_name: profiles[r.user_id] || "Learner",
          updated_at: r.updated_at,
          answers: [],
        };
      }
      acc[key].answers.push(r);
      if (r.updated_at > acc[key].updated_at) acc[key].updated_at = r.updated_at;
      return acc;
    }, {}),
  ).map((g) => ({ ...g, display_name: profiles[g.user_id] || g.display_name }));

  return (
    <section
      data-testid="welcome-reflections-admin-panel"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Reflections
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            Welcome to Blossom — written reflections
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground">
            Read-only view of what each new hire wrote in their Day-1 reflection. Bring these to
            mentor check-ins instead of asking learners to repeat themselves.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading reflections…
          </div>
        ) : error ? (
          <p className="text-[12.5px] text-rose-600">Couldn&apos;t load reflections: {error}</p>
        ) : grouped.length === 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-[12.5px] text-muted-foreground">
            <Inbox className="mt-0.5 h-3.5 w-3.5" />
            <span>
              No reflections submitted yet. New hires will appear here after they write answers
              on /training/welcome.
            </span>
          </div>
        ) : (
          <ul className="space-y-4">
            {grouped.map((g) => (
              <li
                key={g.user_id}
                data-testid={`welcome-reflection-row-${g.user_id}`}
                className="rounded-2xl border border-border/60 bg-background/60 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-foreground">
                    {g.display_name || "Learner"}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Updated {new Date(g.updated_at).toLocaleString()}
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {g.answers.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-border/60 bg-card px-3 py-2"
                    >
                      <p className="text-[12px] font-medium text-muted-foreground">
                        {a.question_text || a.question_key}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                        {a.answer.trim() || <span className="text-muted-foreground">(blank)</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}