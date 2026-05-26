import { ReactNode } from "react";
import { OSShell } from "../OSShell";

export { OpsCard as ExecCard, HealthPill, MetricTile, EmptyRow, AIPrompt, ActionPill, type HealthTone } from "../operations/_shared";

export function ExecPage({
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
              Executive Leadership
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
