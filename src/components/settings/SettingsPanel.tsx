import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  primaryAction?: { label: string; onClick?: () => void };
  showSave?: boolean;
}

export function SettingsPanel({ title, description, children, primaryAction, showSave = true }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {primaryAction && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {showSave && (
            <Button size="sm" className="h-8 text-xs">
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
            </Button>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
