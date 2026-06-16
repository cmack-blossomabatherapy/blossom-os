import { ReactNode } from "react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  /** Short tagline shown under the title. */
  intent: string;
  /** Optional KPI strip — keep to 3-5 numbers max. */
  kpis?: { label: string; value: string; hint?: string }[];
  /** Operational sections rendered in the main column. */
  sections?: { title: string; description?: string; body?: ReactNode }[];
  /** Right-rail content (AI hint, filters, etc). */
  aside?: ReactNode;
  children?: ReactNode;
}

/**
 * Shared HR Team page shell. Calm Apple-style layout used by all curated
 * HR Team pages so every screen feels like part of one operating system.
 * Pages plug real data in via `kpis`, `sections`, `aside`, or `children`.
 */
export function HRShellPage({ title, subtitle, icon: Icon, intent, kpis, sections, aside, children }: Props) {
  return (
    <OSShell>
      <div className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <header className="mb-8 flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted grid place-items-center shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            <p className="text-[13px] text-muted-foreground/80 mt-2 max-w-2xl">{intent}</p>
          </div>
        </header>

        {kpis && kpis.length > 0 && (
          <div className="grid gap-3 mb-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-semibold tracking-tight mt-1">{k.value}</p>
                {k.hint && <p className="text-[11px] text-muted-foreground mt-1">{k.hint}</p>}
              </div>
            ))}
          </div>
        )}

        <div className={cn("grid gap-6", aside ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
          <div className="space-y-6 min-w-0">
            {sections?.map((s) => (
              <section key={s.title} className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
                <div className="mb-4">
                  <h2 className="text-base font-medium tracking-tight">{s.title}</h2>
                  {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                </div>
                {s.body}
              </section>
            ))}
            {children}
          </div>
          {aside && (
            <aside className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <h3 className="text-sm font-medium">Operational Insights</h3>
                </div>
                {aside}
              </div>
            </aside>
          )}
        </div>
      </div>
    </OSShell>
  );
}