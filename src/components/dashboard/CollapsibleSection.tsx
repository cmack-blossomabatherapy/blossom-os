import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /** Render plain children without collapsible wrapper above this breakpoint. */
  collapsibleBelow?: "sm" | "md" | "lg";
  children: ReactNode;
  badge?: ReactNode;
}

/**
 * Mobile-friendly collapsible section. On the configured breakpoint and up
 * (default `md`), it renders children directly — preserving the existing
 * desktop layout. Below that breakpoint it shows a tap-to-expand header.
 */
export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  collapsibleBelow = "md",
  children,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const desktopShowClass =
    collapsibleBelow === "sm"
      ? "sm:block"
      : collapsibleBelow === "lg"
      ? "lg:block"
      : "md:block";
  const headerHideClass =
    collapsibleBelow === "sm"
      ? "sm:hidden"
      : collapsibleBelow === "lg"
      ? "lg:hidden"
      : "md:hidden";

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition active:scale-[0.99]",
          headerHideClass,
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          desktopShowClass,
          open ? "block" : "hidden",
        )}
      >
        {children}
      </div>
    </section>
  );
}