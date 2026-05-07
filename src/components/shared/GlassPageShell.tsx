import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassHero } from "./GlassHero";

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
 * Drop-in replacement for PageShell that gives any module the futuristic
 * Apple-glass aurora hero + a pre-styled stats slot.
 */
export function GlassPageShell({
  title, description, eyebrow, eyebrowIcon, actions, stats, children, className,
}: GlassPageShellProps) {
  return (
    <div className={cn("aurora-bg -mx-3 -my-3 px-3 py-3 md:-mx-6 md:-my-6 md:px-6 md:py-6 min-h-full", className)}>
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 animate-fade-in">
        <GlassHero
          eyebrow={eyebrow}
          eyebrowIcon={eyebrowIcon}
          title={title}
          subtitle={description}
          right={
            (stats || actions) && (
              <div className="flex flex-col items-stretch gap-3">
                {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
                {stats}
              </div>
            )
          }
        />
        {children}
      </div>
    </div>
  );
}