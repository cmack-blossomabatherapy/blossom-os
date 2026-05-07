import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GlassPanelProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconTone?: "primary" | "warning" | "success" | "accent";
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: "default" | "strong";
}

const iconToneCls: Record<NonNullable<GlassPanelProps["iconTone"]>, string> = {
  primary: "bg-primary/12 text-primary",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
  accent: "bg-accent/15 text-accent",
};

export function GlassPanel({
  title, description, icon: Icon, iconTone = "primary", actions, children,
  className, bodyClassName, variant = "default",
}: GlassPanelProps) {
  return (
    <section
      className={cn(
        "rounded-3xl overflow-hidden",
        variant === "strong" ? "glass-surface-strong" : "glass-surface",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", iconToneCls[iconTone])}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold tracking-tight text-foreground truncate">{title}</h2>}
              {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}