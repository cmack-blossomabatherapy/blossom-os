import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, Award, BadgeCheck, Bot, Check, ClipboardCheck, Lock,
  RotateCcw, ShieldCheck, Sparkles, UserCheck, UserCog, UserX, X, Zap,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

interface Row {
  id: string;
  user_id: string;
  actor_id: string | null;
  event_type: string;
  target_key: string | null;
  metadata: Record<string, unknown> | null;
  source: string;
  created_at: string;
}

interface ActorMap { [id: string]: { name: string; email: string | null } }

interface Props { userId: string; }

const moduleTitleByKey = (() => {
  const m = new Map<string, { title: string; phase: string }>();
  ONBOARDING_PHASES.forEach((p) => p.modules.forEach((mod) => m.set(mod.key, { title: mod.title, phase: p.weekLabel })));
  return m;
})();
const stepTitleById = (() => {
  const m = new Map<string, string>();
  ONBOARDING_STEPS.forEach((s) => m.set(s.id, s.title));
  return m;
})();

function describe(row: Row): { label: string; detail?: string; icon: LucideIcon; tone: "ok" | "warn" | "info" | "danger" | "muted" } {
  const t = row.target_key || "";
  switch (row.event_type) {
    case "module_complete": {
      const mod = moduleTitleByKey.get(t);
      return { label: `Completed module`, detail: mod ? `${mod.phase} · ${mod.title}` : t, icon: Check, tone: "ok" };
    }
    case "module_uncheck": {
      const mod = moduleTitleByKey.get(t);
      return { label: `Unchecked module`, detail: mod ? `${mod.phase} · ${mod.title}` : t, icon: RotateCcw, tone: "warn" };
    }
    case "step_complete":
      return { label: `Completed step`, detail: stepTitleById.get(t) || t, icon: Check, tone: "ok" };
    case "step_uncheck":
      return { label: `Unchecked step`, detail: stepTitleById.get(t) || t, icon: RotateCcw, tone: "warn" };
    case "ack":
      return { label: `Acknowledged`, detail: prettyAck(t), icon: ShieldCheck, tone: "info" };
    case "unack":
      return { label: `Removed acknowledgement`, detail: prettyAck(t), icon: AlertCircle, tone: "warn" };
    case "quiz_passed":
      return { label: `Passed final knowledge check`, icon: ClipboardCheck, tone: "ok" };
    case "quiz_reset":
      return { label: `Knowledge check reset`, icon: AlertCircle, tone: "warn" };
    case "path_change": {
      const meta = row.metadata as { from?: string; to?: string } | null;
      return { label: `Path changed`, detail: meta?.from && meta?.to ? `${meta.from} → ${meta.to}` : t, icon: UserCog, tone: "info" };
    }
    case "completed":
      return { label: `Onboarding completed`, icon: Award, tone: "ok" };
    case "reopened":
      return { label: `Completion reopened`, icon: Lock, tone: "warn" };
    case "certificate_issued":
      return { label: `Certificate issued`, detail: t, icon: BadgeCheck, tone: "ok" };
    case "journey_reset":
      return { label: `Journey reset by admin`, icon: RotateCcw, tone: "danger" };
    case "phase_rollback": {
      const meta = row.metadata as { phase?: string; note?: string; removed_modules?: string[] } | null;
      const removed = meta?.removed_modules?.length ?? 0;
      const noteSuffix = meta?.note ? ` — “${meta.note}”` : "";
      return {
        label: `Rolled back to ${meta?.phase ?? t}`,
        detail: `${removed} module${removed === 1 ? "" : "s"} cleared${noteSuffix}`,
        icon: RotateCcw,
        tone: "danger",
      };
    }
    case "state_initialized":
      return { label: `Onboarding journey started`, icon: Sparkles, tone: "info" };
    default:
      return { label: row.event_type, detail: t, icon: Activity, tone: "muted" };
  }
}

function prettyAck(key: string) {
  // Keys look like "<moduleKey>:action:<id>" or "policy.<name>" or "<moduleKey>:goal:<i>"
  if (key.startsWith("policy.")) return `Policy · ${key.slice(7).replace(/[._-]/g, " ")}`;
  const parts = key.split(":");
  if (parts.length >= 3) {
    const mod = moduleTitleByKey.get(parts[0]);
    const kind = parts[1];
    const what = parts.slice(2).join(":");
    const kindLabel = kind === "action" ? "task" : kind === "goal" ? "goal" : kind === "stage" ? "shadow stage" : kind;
    return `${mod?.title || parts[0]} · ${kindLabel} ${what}`;
  }
  return key;
}

function sourceMeta(source: string): { icon: LucideIcon; label: string; cls: string } {
  switch (source) {
    case "user": return { icon: UserCheck, label: "By the user", cls: "bg-primary/10 text-primary border-primary/30" };
    case "admin": return { icon: UserCog, label: "By an admin", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300" };
    case "system": return { icon: Bot, label: "Automation", cls: "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300" };
    case "automation": return { icon: Zap, label: "Automation", cls: "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300" };
    default: return { icon: UserX, label: source, cls: "bg-muted text-muted-foreground" };
  }
}

const toneCls: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-600 ring-amber-500/30",
  info: "bg-primary/10 text-primary ring-primary/30",
  danger: "bg-rose-500/15 text-rose-600 ring-rose-500/30",
  muted: "bg-muted text-muted-foreground ring-border",
};

function formatDay(d: Date) {
  const today = new Date(); today.setHours(0,0,0,0);
  const y = new Date(today); y.setDate(y.getDate() - 1);
  const day = new Date(d); day.setHours(0,0,0,0);
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === y.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function AuditTimeline({ userId }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [actors, setActors] = useState<ActorMap>({});
  const [filter, setFilter] = useState<"all" | "user" | "admin" | "system">("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("onboarding_audit_log")
        .select("id, user_id, actor_id, event_type, target_key, metadata, source, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) {
        console.warn("audit timeline failed:", error.message);
        setRows([]); setLoading(false); return;
      }
      const list = (data ?? []) as Row[];
      setRows(list);
      const actorIds = Array.from(new Set(list.map((r) => r.actor_id).filter((x): x is string => !!x)));
      if (actorIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", actorIds);
        const map: ActorMap = {};
        (profs ?? []).forEach((p: { user_id: string; display_name: string | null; email: string | null }) => {
          map[p.user_id] = { name: p.display_name || p.email || "Unknown", email: p.email };
        });
        if (!cancelled) setActors(map);
      }
      setLoading(false);

      // Realtime: append new audit rows as they come in
      const channel = supabase
        .channel(`onboarding_audit_log:${userId}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "onboarding_audit_log", filter: `user_id=eq.${userId}` },
          (payload) => {
            const r = payload.new as Row;
            setRows((prev) => [r, ...prev].slice(0, 500));
          })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
    const teardownPromise = load();
    return () => {
      cancelled = true;
      void teardownPromise.then((tearDown) => tearDown && tearDown());
    };
  }, [userId]);

  const visible = useMemo(
    () => filter === "all" ? rows : rows.filter((r) => r.source === filter || (filter === "system" && r.source === "automation")),
    [rows, filter],
  );

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    visible.forEach((r) => {
      const day = new Date(r.created_at);
      const key = day.toISOString().slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    return Array.from(m.entries());
  }, [visible]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Activity timeline</p>
          <Badge variant="outline" className="text-[10px] tabular-nums">{rows.length} event{rows.length === 1 ? "" : "s"}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all","user","admin","system"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:border-primary/40 text-muted-foreground",
              )}
            >
              {f === "all" ? "All" : f === "user" ? "By user" : f === "admin" ? "By admin" : "Automation"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-xs text-muted-foreground">
          No activity yet for this filter.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([day, items]) => (
            <div key={day} className="space-y-2">
              <p className="sticky top-0 z-10 bg-card/90 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                {formatDay(new Date(day))}
              </p>
              <ol className="relative ml-3 space-y-2 border-l border-border/60 pl-4">
                {items.map((r) => {
                  const d = describe(r);
                  const src = sourceMeta(r.source);
                  const Icon = d.icon;
                  const SrcIcon = src.icon;
                  const actor = r.actor_id ? actors[r.actor_id] : null;
                  const time = new Date(r.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                  return (
                    <li key={r.id} className="relative">
                      <span className={cn(
                        "absolute -left-[26px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card",
                        toneCls[d.tone],
                      )}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="rounded-lg border border-border/60 bg-background/60 p-2.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-medium text-foreground">{d.label}</p>
                          <Badge variant="outline" className={cn("gap-1 text-[10px]", src.cls)}>
                            <SrcIcon className="h-2.5 w-2.5" />
                            {actor ? actor.name : src.label}
                          </Badge>
                          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{time}</span>
                        </div>
                        {d.detail && (
                          <p className="mt-0.5 text-[12px] text-muted-foreground">{d.detail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
