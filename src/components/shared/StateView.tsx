import { ReactNode } from "react";
import { AlertTriangle, Loader2, LucideIcon, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Variant = "loading" | "empty" | "error";

interface StateViewProps {
  variant: Variant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

const defaults: Record<Variant, { title: string; description: string; icon: LucideIcon }> = {
  loading: { title: "Loading…", description: "Fetching the latest data.", icon: Loader2 },
  empty: { title: "Nothing here yet", description: "There's no data to show right now.", icon: Inbox },
  error: { title: "Something went wrong", description: "We couldn't load this view. Try again.", icon: AlertTriangle },
};

const toneRing: Record<Variant, string> = {
  loading: "bg-primary/10 text-primary",
  empty: "bg-muted/60 text-muted-foreground",
  error: "bg-destructive/12 text-destructive",
};

/**
 * Unified empty / loading / error placeholder.
 * Drop inside a GlassPanel body or any container.
 */
export function StateView({
  variant, title, description, icon, action, onRetry, className, compact,
}: StateViewProps) {
  const d = defaults[variant];
  const Icon = icon ?? d.icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 mx-auto",
        compact ? "py-8 max-w-sm" : "py-12 max-w-md",
        className,
      )}
    >
      <div className={cn("flex items-center justify-center rounded-2xl shrink-0", compact ? "h-10 w-10" : "h-12 w-12", toneRing[variant])}>
        <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", variant === "loading" && "animate-spin")} />
      </div>
      <div className="space-y-1">
        <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-sm" : "text-[15px]")}>
          {title ?? d.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description ?? d.description}</p>
      </div>
      {(action || (variant === "error" && onRetry)) && (
        <div className="pt-1 flex items-center gap-2">
          {action}
          {variant === "error" && onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}