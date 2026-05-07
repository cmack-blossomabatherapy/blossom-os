import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GlassHeroProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  subtitle?: string | ReactNode;
  children?: ReactNode;
  right?: ReactNode;
  className?: string;
  size?: "default" | "compact";
}

/**
 * Apple-style glass hero with aurora wash, gradient title, and a
 * right slot for stats / readiness / actions.
 */
export function GlassHero({
  eyebrow,
  eyebrowIcon: Eyebrow,
  title,
  subtitle,
  children,
  right,
  className,
  size = "default",
}: GlassHeroProps) {
  return (
    <section
      className={cn(
        "glass-hero relative",
        size === "compact" ? "p-6 md:p-7" : "p-7 md:p-9",
        className,
      )}
    >
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div className="space-y-4">
          {eyebrow && (
            <span className="glass-chip">
              {Eyebrow && <Eyebrow className="h-3 w-3" />}
              {eyebrow}
            </span>
          )}
          <div>
            <h1
              className={cn(
                "font-semibold leading-[1.05] tracking-tight",
                size === "compact" ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl",
              )}
            >
              <span className="text-gradient-brand">{title}</span>
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {children && <div className="pt-1">{children}</div>}
        </div>
        {right && <div className="lg:justify-self-end w-full">{right}</div>}
      </div>
    </section>
  );
}