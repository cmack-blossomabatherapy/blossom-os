import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "crit" | "info" | "muted";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  const cls =
    tone === "crit"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : tone === "warn"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      : tone === "ok"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      : tone === "info"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      : "bg-muted text-muted-foreground border-border/70";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>
      {children}
    </span>
  );
}

export function KpiCard({
  label, value, hint, tone = "muted",
}: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  const accent =
    tone === "crit" ? "text-destructive"
      : tone === "warn" ? "text-amber-700 dark:text-amber-400"
      : tone === "ok" ? "text-emerald-700 dark:text-emerald-400"
      : tone === "info" ? "text-blue-700 dark:text-blue-400"
      : "text-foreground";
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight mt-1", accent)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </Card>
  );
}

export function HeaderBtn({
  icon: Icon, children, to, onClick, primary,
}: { icon: LucideIcon; children: ReactNode; to?: string; onClick?: () => void; primary?: boolean }) {
  const cls = cn(
    "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] transition-all",
    primary
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "text-foreground border border-border/70 bg-card hover:bg-muted",
  );
  if (to) return <Link to={to} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{children}</Link>;
  return <button onClick={onClick} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{children}</button>;
}

export function PageHeader({
  icon: Icon, title, subtitle, children,
}: { icon: LucideIcon; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex items-start gap-4">
      <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="hidden md:flex items-center gap-2">{children}</div>}
    </header>
  );
}

export function Empty({
  icon: Icon, title, hint, action,
}: { icon: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-muted grid place-items-center">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium tracking-tight">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  );
}

export function fullName(e: { first_name?: string | null; last_name?: string | null; preferred_name?: string | null }) {
  return `${e.preferred_name || e.first_name || ""} ${e.last_name || ""}`.trim() || "—";
}

export function fmtMoney(n: number | string | null | undefined) {
  const v = typeof n === "string" ? Number(n) : n ?? 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);
}

export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}