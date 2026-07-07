import { ReactNode } from "react";
import { OSShell } from "../OSShell";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function OpsPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <OSShell>
      <div className="space-y-6 pb-12">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Operations Leadership
            </div>
            <h1 className="mt-1 text-2xl md:text-[28px] font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-[13.5px] text-muted-foreground max-w-2xl">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        {children}
      </div>
    </OSShell>
  );
}

export function OpsCard({
  title,
  hint,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-card border border-border/70 p-5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-12px_hsl(220_15%_20%/0.08)]",
        className,
      )}
    >
      {(title || hint) && (
        <div className="mb-4 flex items-baseline justify-between">
          {title && (
            <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
          )}
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

const TONE_STYLES = {
  healthy: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  attention: "bg-amber-50 text-amber-700 border-amber-200/70",
  risk: "bg-rose-50 text-rose-700 border-rose-200/70",
  blocked: "bg-rose-50 text-rose-700 border-rose-200/70",
  neutral: "bg-muted text-muted-foreground border-border/60",
} as const;

export type HealthTone = keyof typeof TONE_STYLES;

export function HealthPill({ tone, children }: { tone: HealthTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        TONE_STYLES[tone],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-emerald-500": tone === "healthy",
        "bg-amber-500": tone === "attention",
        "bg-rose-500": tone === "risk" || tone === "blocked",
        "bg-muted-foreground/50": tone === "neutral",
      })} />
      {children}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: HealthTone;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-4 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <HealthPill tone={tone}>{tone}</HealthPill>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[12px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-dashed border-border/60 p-5 text-center text-[13px] text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * AIPrompt — pill button that deep-links into Operational Insights with a prefilled prompt.
 * Use anywhere we surface "AI suggestions" on Ops Leadership pages.
 */
export function AIPrompt({
  label,
  prompt,
  variant = "subtle",
}: {
  label: string;
  prompt?: string;
  variant?: "subtle" | "card";
}) {
  const q = encodeURIComponent(prompt ?? label);
  const className =
    variant === "card"
      ? "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[12px] text-foreground/80 transition hover:bg-muted"
      : "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1 text-[11.5px] font-medium text-foreground/80 transition hover:bg-muted";
  return (
    <Link to={`/ai/assistant?q=${q}`} className={className}>
      <Sparkles className="h-3 w-3 opacity-70" />
      {label}
    </Link>
  );
}

/**
 * ActionPill — small pill button that fires a toast confirmation.
 * Used for inline operational actions (Assign, Follow up, Coordinate, etc.)
 * until a full action backend is connected.
 */
export function ActionPill({
  label,
  toastMessage,
  icon,
  className,
  onClick,
  disabled,
  title,
}: {
  label: string;
  toastMessage?: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={() => {
        if (disabled) return;
        if (onClick) {
          onClick();
          return;
        }
        toast.success(toastMessage ?? `${label} sent`);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-border hover:text-foreground hover:bg-muted",
        disabled && "opacity-50 cursor-not-allowed hover:bg-card hover:text-muted-foreground",
        className,
      )}
    >
      {label}
      {icon}
    </button>
  );
}