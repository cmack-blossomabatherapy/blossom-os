import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassPageShellProps {
  title: string;
  description?: string;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  actions?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Premium Admin-Hub style page shell: gradient hero + stat slot + actions.
 * Drop-in for any admin / training / reporting module.
 */
export function GlassPageShell({
  title, description, eyebrow, eyebrowIcon: Eyebrow, actions, stats, children, className,
}: GlassPageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6 animate-fade-in", className)}>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div className="space-y-4 min-w-0">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
                {Eyebrow && <Eyebrow className="h-3.5 w-3.5" />}
                {eyebrow}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">{description}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {stats && (
            <div className="lg:justify-self-end w-full min-w-0">
              {stats}
            </div>
          )}
        </div>
      </section>
      {children}
    </div>
  );
}

/**
 * Stat tile that matches the GlassPageShell hero — use inside the `stats` slot.
 */
export function GlassPageShellStats({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((s) => (
        <div key={s.label} className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
          <p className="text-2xl font-semibold text-primary-foreground tabular-nums">{s.value}</p>
          <p className="text-[11px] text-primary-foreground/85">{s.label}</p>
        </div>
      ))}
    </div>
  );
}