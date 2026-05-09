import { MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setOnboardingPath } from "@/lib/onboarding/storage";
import type { OnboardingPath } from "@/lib/onboarding/journey";

interface Props {
  path: OnboardingPath;
  disabled?: boolean;
}

const opts: { id: OnboardingPath; label: string; sub: string; icon: typeof MapPin }[] = [
  { id: "existing_state", label: "Existing State", sub: "Joining an established team", icon: Building2 },
  { id: "new_state", label: "New State", sub: "Launching a new market", icon: MapPin },
];

export function PathSwitcher({ path, disabled }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = path === o.id;
        return (
          <button
            key={o.id}
            disabled={disabled}
            onClick={() => setOnboardingPath(o.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
              active ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40" : "border-border/60 bg-card hover:border-primary/30",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{o.label}</p>
              <p className="text-[11px] text-muted-foreground">{o.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}