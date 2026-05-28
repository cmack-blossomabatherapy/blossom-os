import { cn } from "@/lib/utils";
import type { SelfStatus, LeadershipStatus, MeetingStatus, FinalStatus, EmailStatus, CycleStatus } from "./types";

type Tone = "ok" | "warn" | "crit" | "info" | "muted";

const TONE: Record<Tone, string> = {
  ok:   "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  crit: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary/10 text-primary border-primary/20",
  muted:"bg-muted text-muted-foreground border-border/70",
};

export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", TONE[tone])}>
      {children}
    </span>
  );
}

export function SelfBadge({ s }: { s: SelfStatus }) {
  const tone: Tone = s === "Completed" ? "ok" : s === "Overdue" ? "crit" : s === "Sent" || s === "Opened" ? "info" : "muted";
  return <StatusPill tone={tone}>{s}</StatusPill>;
}
export function LeadershipBadge({ s }: { s: LeadershipStatus }) {
  const tone: Tone = s === "Completed" ? "ok" : s === "In Progress" ? "info" : "muted";
  return <StatusPill tone={tone}>{s}</StatusPill>;
}
export function MeetingBadge({ s }: { s: MeetingStatus }) {
  const tone: Tone = s === "Completed" ? "ok" : s === "Scheduled" ? "info" : "muted";
  return <StatusPill tone={tone}>{s}</StatusPill>;
}
export function FinalBadge({ s }: { s: FinalStatus }) {
  const tone: Tone =
    s === "Complete" ? "ok" :
    s === "Overdue" ? "crit" :
    s === "Needs Meeting" ? "warn" :
    s === "In Progress" ? "info" : "muted";
  return <StatusPill tone={tone}>{s}</StatusPill>;
}
export function EmailBadge({ s }: { s: EmailStatus }) {
  const tone: Tone =
    s === "Sent" ? "ok" :
    s === "Failed" ? "crit" :
    s === "Queued" ? "info" :
    "muted";
  return <StatusPill tone={tone}>{s}</StatusPill>;
}
export function CycleBadge({ s }: { s: CycleStatus }) {
  const tone: Tone = s === "Active" ? "info" : s === "Complete" ? "ok" : s === "Archived" ? "muted" : "warn";
  return <StatusPill tone={tone}>{s}</StatusPill>;
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}