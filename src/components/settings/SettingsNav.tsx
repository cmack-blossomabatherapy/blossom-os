import { cn } from "@/lib/utils";
import { settingsNav, settingsGroups, type SettingsSectionId } from "@/data/settings";

interface Props {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}

export function SettingsNav({ active, onSelect }: Props) {
  return (
    <nav className="bg-card rounded-xl border border-border/60 p-2 space-y-3 sticky top-4">
      {settingsGroups.map((group) => {
        const items = settingsNav.filter((n) => n.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors",
                    active === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted/40",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
