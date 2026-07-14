import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IdCard, Users2, ScanLine, AlertTriangle, BadgeCheck, ChevronRight, Search, MapPin,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";

interface CompletionRow {
  employee_id: string;
  score: number | null;
  has_photo: boolean;
  has_bio: boolean;
  has_skills: boolean;
  has_contact: boolean;
  has_emergency: boolean;
}

interface TagRow {
  employee_id: string;
  tag_code: string;
  is_active: boolean;
  last_test_at: string | null;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function StatCard({ label, value, hint, tone = "default" }: {
  label: string; value: string | number; hint?: string;
  tone?: "default" | "primary" | "warning" | "success";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    warning: "text-amber-600",
    success: "text-emerald-600",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function IdentityDashboard() {
  const { members, loading: dirLoading, byUuid } = useEmployeeDirectory();
  const [completion, setCompletion] = useState<Record<string, CompletionRow>>({});
  const [tags, setTags] = useState<Record<string, TagRow>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ data: comp }, { data: tg }] = await Promise.all([
        supabase.from("employee_profile_completion").select("*"),
        supabase.from("employee_nfc_tags").select("employee_id,tag_code,is_active,last_test_at").eq("is_active", true),
      ]);
      if (cancelled) return;
      if (comp) {
        const map: Record<string, CompletionRow> = {};
        (comp as CompletionRow[]).forEach((r) => { if (r.employee_id) map[r.employee_id] = r; });
        setCompletion(map);
      }
      if (tg) {
        const map: Record<string, TagRow> = {};
        (tg as TagRow[]).forEach((r) => { map[r.employee_id] = r; });
        setTags(map);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const total = members.length;
    const scores = members.map((m) => m.uuid ? completion[m.uuid]?.score ?? 0 : 0);
    const avg = total ? Math.round(scores.reduce((a, b) => a + Number(b), 0) / total) : 0;
    const buckets = { complete: 0, partial: 0, missing: 0 };
    scores.forEach((s) => {
      if (s >= 80) buckets.complete++;
      else if (s >= 40) buckets.partial++;
      else buckets.missing++;
    });
    const tagged = members.filter((m) => m.uuid && tags[m.uuid]).length;
    return { total, avg, ...buckets, tagged, untagged: total - tagged };
  }, [members, completion, tags]);

  const incomplete = useMemo(() => {
    return members
      .map((m) => ({ m, score: m.uuid ? completion[m.uuid]?.score ?? 0 : 0 }))
      .filter((r) => r.score < 80)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12);
  }, [members, completion]);

  const tagRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members
      .filter((m) => {
        if (!term) return true;
        const tag = m.uuid ? tags[m.uuid]?.tag_code ?? "" : "";
        return [m.name, m.title, tag].some((v) => v.toLowerCase().includes(term));
      })
      .slice(0, 50);
  }, [members, tags, q]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-1 md:px-2">
        <header className="mb-10">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <IdCard className="size-3.5" /> Identity System
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Blossom Identity — admin overview.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
            Track profile completion company-wide, manage NFC badge assignments, and spot incomplete identities at a glance.
          </p>
        </header>

        {/* Stats */}
        <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Avg completion" value={`${stats.avg}%`} tone="primary"
            hint={`${stats.total} employees`} />
          <StatCard label="Complete profiles" value={stats.complete} tone="success"
            hint="80% or higher" />
          <StatCard label="Needs attention" value={stats.partial + stats.missing} tone="warning"
            hint={`${stats.missing} under 40%`} />
          <StatCard label="NFC tags active" value={`${stats.tagged} / ${stats.total}`}
            hint={`${stats.untagged} unassigned`} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Incomplete */}
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight inline-flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" /> Incomplete profiles
              </h2>
              <Link to="/user-management" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                Open directory <ChevronRight className="size-3" />
              </Link>
            </div>
            {dirLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
              ))}</div>
            ) : incomplete.length === 0 ? (
              <p className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Every profile is at 80% or higher. 🎉
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {incomplete.map(({ m, score }) => {
                  const c = m.uuid ? completion[m.uuid] : undefined;
                  return (
                    <li key={m.id}>
                      <Link to={`/user-management/${m.id}`}
                        className="flex items-center gap-3 py-3 transition hover:bg-muted/40 -mx-2 px-2 rounded-xl">
                        {m.photo ? (
                          <img src={m.photo} alt="" className="size-9 rounded-full object-cover ring-1 ring-border/60" />
                        ) : (
                          <div className="size-9 rounded-full bg-muted grid place-items-center text-[11px] font-medium text-muted-foreground ring-1 ring-border/60">
                            {initials(m.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.title}</p>
                        </div>
                        <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
                          {c?.has_photo === false && <Pill>photo</Pill>}
                          {c?.has_bio === false && <Pill>bio</Pill>}
                          {c?.has_skills === false && <Pill>skills</Pill>}
                          {c?.has_contact === false && <Pill>contact</Pill>}
                          {c?.has_emergency === false && <Pill>emergency</Pill>}
                        </div>
                        <span className={cn(
                          "tabular-nums rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          score >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive",
                        )}>{score}%</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* NFC tags */}
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.06)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight inline-flex items-center gap-2">
                <ScanLine className="size-4 text-primary" /> NFC tag assignments
              </h2>
            </div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or tag code…"
                className="h-10 rounded-xl border-border/70 bg-muted/40 pl-9" />
            </div>
            <div className="max-h-[28rem] overflow-y-auto -mx-2">
              <ul className="divide-y divide-border/60 px-2">
                {tagRows.map((m) => {
                  const tag = m.uuid ? tags[m.uuid] : undefined;
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-2.5">
                      <div className="size-8 rounded-full bg-muted grid place-items-center text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium inline-flex items-center gap-1.5">
                          {m.name}
                          {m.leadership && <BadgeCheck className="size-3 text-primary" />}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="size-2.5" />{m.states?.[0] ?? "—"} · {m.departmentName ?? "Unassigned"}
                        </p>
                      </div>
                      {tag ? (
                        <code className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                          {tag.tag_code}
                        </code>
                      ) : (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          unassigned
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Assign or revoke tags from each <Link to="/user-management" className="underline-offset-2 hover:underline">employee profile</Link>.
            </p>
          </section>
        </div>
      </div>
    </OSShell>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-muted px-1.5 py-0.5">{children}</span>;
}