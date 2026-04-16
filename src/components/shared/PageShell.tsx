import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageShellProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({ title, description, icon: Icon, actions, children, className }: PageShellProps) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
