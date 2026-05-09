import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Award, BadgeCheck, ChevronRight, Clock, FileText, GraduationCap, Loader2, Lock, MailCheck,
  Search, ShieldCheck, Sparkles, Users, X,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ONBOARDING_PHASES, modulesForPath, requiredModuleKeys, type OnboardingPath,
} from "@/lib/onboarding/journey";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import { REQUIRED_POLICY_KEYS } from "@/lib/onboarding/gates";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  state: string | null;
  new_state_employee?: boolean | null;
  active: boolean | null;
}

interface OnbRow {
  user_id: string;
  completed_steps: string[];
  modules_complete: string[];
  acknowledgements: string[];
  quiz_passed: boolean;
  path: string;
  completed_at: string | null;
  certificate_id: string | null;
  updated_at: string;
}

interface UserRow extends ProfileRow {
  onb: OnbRow | null;
  percent: number;
  modulesDone: number;
  modulesTotal: number;
  status: "not_started" | "in_progress" | "complete";
}

const ALLOWED_ROLES = ["admin", "hr_admin", "hr_manager", "training_admin"];

function computeRow(p: ProfileRow, o: OnbRow | null): UserRow {
  const path: OnboardingPath = o?.path === "new_state" ? "new_state" : (p.new_state_employee ? "new_state" : "existing_state");
  const required = requiredModuleKeys(path);
  const done = required.filter((k) => (o?.modules_complete ?? []).includes(k)).length;
  const percent = required.length === 0 ? 0 : Math.round((done / required.length) * 100);
  const status: UserRow["status"] = o?.completed_at ? "complete" : (done === 0 ? "not_started" : "in_progress");
  return { ...p, onb: o, percent, modulesDone: done, modulesTotal: required.length, status };
}

export default function OnboardingProgress() {
  const { roles, loading: authLoading } = useAuth();
  const allowed = roles.some((r) => ALLOWED_ROLES.includes(r));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "not_started" | "in_progress" | "complete">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function load() {
    setLoading(true);
    const [profilesRes, onbRes] = await Promise.all([
      supabase.from("profiles")
        .select("user_id, display_name, email, job_title, department, state, new_state_employee, active")
        .eq("active", true),
      supabase.from("onboarding_state")
        .select("user_id, completed_steps, modules_complete, acknowledgements, quiz_passed, path, completed_at, certificate_id, updated_at"),
    ]);
    const profs = (profilesRes.data ?? []) as ProfileRow[];
    const onbs = new Map<string, OnbRow>();
    ((onbRes.data ?? []) as OnbRow[]).forEach((r) => onbs.set(r.user_id, r));
    const combined = profs
      .map((p) => computeRow(p, onbs.get(p.user_id) ?? null))
      .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));
    setRows(combined);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let r = rows;
    if (filter !== "all") r = r.filter((x) => x.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((x) =>
        (x.display_name || "").toLowerCase().includes(q) ||
        (x.email || "").toLowerCase().includes(q) ||
        (x.job_title || "").toLowerCase().includes(q) ||
        (x.department || "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [rows, query, filter]);

  const stats = useMemo(() => ({
    total: rows.length,
    complete: rows.filter((r) => r.status === "complete").length,
    in_progress: rows.filter((r) => r.status === "in_progress").length,
    not_started: rows.filter((r) => r.status === "not_started").length,
  }), [rows]);

  const selected = useMemo(() => filtered.find((r) => r.user_id === selectedId) || rows.find((r) => r.user_id === selectedId) || null, [filtered, rows, selectedId]);

  if (authLoading) return <PageShell title="Onboarding Progress"><Skeleton className="h-64" /></PageShell>;
  if (!allowed) return <Navigate to="/admin" replace />;

  return (
    <PageShell
      title="Onboarding Progress"
      subtitle="Search users and review onboarding completion before unlocking routes."
      icon={<GraduationCap className="h-5 w-5" />}
    >
      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Employees" value={stats.total} icon={Users} />
        <StatCard label="Complete" value={stats.complete} icon={Award} tone="emerald" />
        <StatCard label="In progress" value={stats.in_progress} icon={Sparkles} tone="primary" />
        <StatCard label="Not started" value={stats.not_started} icon={Clock} tone="muted" />
      </div>

      {/* Search + filters */}
      <Card className="p-4 mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, title, or department…"
              className="pl-9"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {(["all", "not_started", "in_progress", "complete"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:border-primary/40",
                )}
              >
                {f === "all" ? "All" : f === "not_started" ? "Not started" : f === "in_progress" ? "In progress" : "Complete"}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f === "all" ? rows.length : f === "complete" ? stats.complete : f === "in_progress" ? stats.in_progress : stats.not_started}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="mt-4 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No employees match your filters.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((u) => (
              <li key={u.user_id}>
                <button
                  onClick={() => setSelectedId(u.user_id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                    selectedId === u.user_id && "bg-primary/5",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {(u.display_name || u.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{u.display_name || "(no name)"}</p>
                      {u.new_state_employee && <Badge variant="outline" className="text-[10px]">New State</Badge>}
                      {u.onb?.certificate_id && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] dark:text-emerald-300" variant="outline">
                          <BadgeCheck className="mr-1 h-3 w-3" /> Certified
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {u.email || "—"}{u.job_title ? ` · ${u.job_title}` : ""}{u.department ? ` · ${u.department}` : ""}
                    </p>
                  </div>
                  <div className="hidden w-48 sm:block">
                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      <StatusPill status={u.status} />
                      <span className="text-muted-foreground">{u.modulesDone}/{u.modulesTotal}</span>
                    </div>
                    <Progress value={u.percent} className="mt-1 h-1.5" />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold tabular-nums text-foreground">{u.percent}%</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Detail panel */}
      {selected && (
        <DetailPanel user={selected} onClose={() => setSelectedId(null)} />
      )}
    </PageShell>
  );
}

function StatCard({ label, value, icon: Icon, tone = "default" }: { label: string; value: number; icon: typeof Users; tone?: "default" | "emerald" | "primary" | "muted" }) {
  const toneCls = {
    default: "text-foreground bg-muted",
    emerald: "text-emerald-600 bg-emerald-500/15",
    primary: "text-primary bg-primary/10",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneCls)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </Card>
  );
}

function StatusPill({ status }: { status: UserRow["status"] }) {
  if (status === "complete") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] dark:text-emerald-300" variant="outline">Complete</Badge>;
  if (status === "in_progress") return <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]" variant="outline">In progress</Badge>;
  return <Badge variant="outline" className="text-[10px] text-muted-foreground">Not started</Badge>;
}

function DetailPanel({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const path: OnboardingPath = (user.onb?.path === "new_state" || user.new_state_employee) ? "new_state" : "existing_state";
  const completedModules = new Set(user.onb?.modules_complete ?? []);
  const acks = new Set(user.onb?.acknowledgements ?? []);
  const completedSteps = new Set(user.onb?.completed_steps ?? []);
  const policiesDone = REQUIRED_POLICY_KEYS.every((k) => acks.has(k));
  const policiesMissing = REQUIRED_POLICY_KEYS.filter((k) => !acks.has(k)).length;

  return (
    <Card className="mt-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 bg-muted/30 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{user.display_name || "(no name)"}</h3>
            <Badge variant="outline" className="text-[10px]">{path === "new_state" ? "New State path" : "Existing State path"}</Badge>
            <StatusPill status={user.status} />
          </div>
          <p className="text-xs text-muted-foreground">{user.email || "—"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
        {/* Phases */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phases</p>
          {ONBOARDING_PHASES.map((phase) => {
            const mods = modulesForPath(phase, path);
            const done = mods.filter((m) => completedModules.has(m.key)).length;
            const pct = mods.length === 0 ? 0 : Math.round((done / mods.length) * 100);
            return (
              <div key={phase.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <phase.icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">{phase.weekLabel} — {phase.title}</p>
                  </div>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{done}/{mods.length}</span>
                </div>
                <Progress value={pct} className="mt-2 h-1.5" />
                {mods.length > 0 && (
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {mods.map((m) => {
                      const ok = completedModules.has(m.key);
                      return (
                        <li key={m.key} className="flex items-center gap-1.5 text-[11px]">
                          <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                          <span className={cn("truncate", ok ? "text-foreground" : "text-muted-foreground")}>{m.title}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column: gates + steps + cert */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Required gates</p>
            <div className="mt-2 space-y-2 text-sm">
              <GateRow icon={ShieldCheck} label="Policy acknowledgements" ok={policiesDone} detail={policiesDone ? "All acknowledged" : `${policiesMissing} missing`} />
              <GateRow icon={FileText} label="Final knowledge check" ok={!!user.onb?.quiz_passed} detail={user.onb?.quiz_passed ? "Passed" : "Not passed"} />
              <GateRow
                icon={Award}
                label="Certificate"
                ok={!!user.onb?.certificate_id}
                detail={user.onb?.certificate_id ? user.onb.certificate_id : "Not issued"}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step checklist</p>
            <ul className="mt-2 space-y-1">
              {ONBOARDING_STEPS.filter((s) => s.id !== "complete").map((s) => {
                const ok = completedSteps.has(s.id);
                return (
                  <li key={s.id} className="flex items-center gap-2 text-[12px]">
                    <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full",
                      ok ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground")}>
                      {ok ? "✓" : "·"}
                    </span>
                    <span className={cn("truncate", ok ? "text-foreground" : "text-muted-foreground")}>{s.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 p-3 text-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
            <p className="mt-1 text-muted-foreground">
              Last update: {user.onb?.updated_at ? new Date(user.onb.updated_at).toLocaleString() : "—"}
            </p>
            {user.onb?.completed_at && (
              <p className="text-emerald-700 dark:text-emerald-300">
                Completed: {new Date(user.onb.completed_at).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to="/settings"><Lock className="h-3.5 w-3.5" /> Manage route allow-list</Link>
            </Button>
            {user.email && (
              <Button asChild size="sm" variant="ghost" className="gap-1.5">
                <a href={`mailto:${user.email}`}><MailCheck className="h-3.5 w-3.5" /> Email user</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function GateRow({ icon: Icon, label, ok, detail }: { icon: typeof ShieldCheck; label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", ok ? "text-emerald-600" : "text-muted-foreground")} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
      </div>
      <span className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        ok ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
      )}>{ok ? "OK" : "Pending"}</span>
    </div>
  );
}

// Loader2 import kept for parity / future async actions
void Loader2;
