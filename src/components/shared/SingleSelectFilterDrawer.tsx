import { Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterGroup<K extends string = string> {
  key: K;
  label: string;
  /** All available chip values. Do NOT include the "All" reset — handled internally. */
  options: string[];
  /** Sentinel value meaning "no filter applied". Defaults to "All". */
  allValue?: string;
}

interface SingleSelectFilterDrawerProps<K extends string> {
  /** Module name shown in the title, e.g. "authorizations", "QA cases", "sessions". */
  entityLabel: string;
  values: Record<K, string>;
  onChange: (next: Record<K, string>) => void;
  groups: FilterGroup<K>[];
  /** Optional override for the trigger button label. Defaults to "Filters". */
  triggerLabel?: string;
}

/**
 * Standardized bottom-sheet filter drawer with pill-chip selectors and
 * Clear all / Apply footer actions. Matches the Leads & Clients drawer
 * styling exactly so all modules share one filter UX.
 */
export function SingleSelectFilterDrawer<K extends string>({
  entityLabel,
  values,
  onChange,
  groups,
  triggerLabel = "Filters",
}: SingleSelectFilterDrawerProps<K>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(values);

  // Sync draft when drawer (re)opens or external values change while closed
  useEffect(() => {
    if (!open) setDraft(values);
  }, [values, open]);

  const allValueFor = (group: FilterGroup<K>) => group.allValue ?? "All";
  const activeCount = (current: Record<K, string>) =>
    groups.reduce((acc, g) => acc + (current[g.key] !== allValueFor(g) ? 1 : 0), 0);

  const totalActive = activeCount(values);
  const draftActive = activeCount(draft);

  const clearAll = () => {
    const next = { ...draft };
    groups.forEach((g) => { next[g.key] = allValueFor(g) as Record<K, string>[K]; });
    setDraft(next);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs relative">
          <Filter className="h-3 w-3" /> {triggerLabel}
          {totalActive > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 ml-0.5 text-[10px]">{totalActive}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] rounded-t-2xl border-x-0 border-b-0 p-0"
      >
        <div className="mx-auto flex h-full max-w-3xl flex-col">
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="flex-row items-center justify-between space-y-0 px-5 pb-3 pt-3 text-left">
            <div>
              <SheetTitle className="text-base">Filter {entityLabel}</SheetTitle>
              <p className="text-xs text-muted-foreground">
                {draftActive === 0 ? "No filters active" : `${draftActive} active filter${draftActive === 1 ? "" : "s"}`}
              </p>
            </div>
            {draftActive > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 gap-1 text-xs">
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto border-t border-border/60 px-5 py-4">
            {groups.map((group) => {
              const allVal = allValueFor(group);
              const values = [allVal, ...group.options.filter((o) => o !== allVal)];
              return (
                <div key={group.key}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.map((opt) => {
                      const active = draft[group.key] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setDraft({ ...draft, [group.key]: opt })}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:border-primary/40",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-border/60 bg-background px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button variant="outline" className="flex-1" onClick={clearAll} disabled={draftActive === 0}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={apply}>
              Apply{draftActive > 0 ? ` (${draftActive})` : ""}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}