import { Link } from "react-router-dom";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OSShell } from "@/pages/os/OSShell";
import type { ReactNode } from "react";

/** Status badge tone — matches the Phase 3 reports landing visual language. */
const STATUS_TONE = {
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  setup_needed: "bg-amber-50 text-amber-800 border-amber-200",
  needs_data: "bg-sky-50 text-sky-700 border-sky-200",
  ready: "bg-sky-50 text-sky-700 border-sky-200",
  paused: "bg-zinc-100 text-zinc-700 border-zinc-200",
} as const;

export type GrowthStatus = keyof typeof STATUS_TONE;

const STATUS_LABEL: Record<GrowthStatus, string> = {
  live: "Live",
  active: "Active",
  setup_needed: "Setup needed",
  needs_data: "Needs Data",
  ready: "Ready for data",
  paused: "Paused",
};

export function StatusBadge({ status }: { status: GrowthStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0 border", STATUS_TONE[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export interface PageAction {
  label: string;
  to?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "ghost";
}

export function GrowthPageShell({
  eyebrow, title, description, actions, headerRight, children, noShell = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: PageAction[];
  headerRight?: ReactNode;
  children: ReactNode;
  /** When true, render without the outer <OSShell> — the caller already
   *  provides the Blossom OS shell (sidebar + topbar). Prevents nested
   *  shells when a route wraps the page in <OSShellPage>. */
  noShell?: boolean;
}) {
  const body = (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{eyebrow}</div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              {headerRight}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
          </div>
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {actions.map((a) => {
                const Icon = a.icon;
                const inner = (
                  <>
                    {Icon && <Icon className="h-4 w-4 mr-1.5" />}
                    {a.label}
                  </>
                );
                if (a.to) {
                  return (
                    <Button key={a.label} asChild size="sm" variant={a.variant ?? "outline"}>
                      <Link to={a.to}>{inner}</Link>
                    </Button>
                  );
                }
                return (
                  <Button
                    key={a.label}
                    size="sm"
                    variant={a.variant ?? "outline"}
                    onClick={a.onClick}
                  >
                    {inner}
                  </Button>
                );
              })}
            </div>
          )}
        </header>
        {children}
    </div>
  );
  if (noShell) return body;
  return <OSShell>{body}</OSShell>;
}

export function StatCard({
  label, value, hint, status, icon: Icon,
}: { label: string; value: string; hint?: string; status?: GrowthStatus; icon?: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
      <div className="flex items-start justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {status && <StatusBadge status={status} />}
      </div>
    </div>
  );
}

export function Section({
  title, description, action, children,
}: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ReadyForDataNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function LinkCard({
  title, description, to, status, icon: Icon,
}: { title: string; description: string; to: string; status?: GrowthStatus; icon?: LucideIcon }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/70 bg-card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
      {status && <div className="mt-3"><StatusBadge status={status} /></div>}
    </Link>
  );
}