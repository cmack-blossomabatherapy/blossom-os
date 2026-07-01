import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import { cn } from "@/lib/utils";

/** Multi-select Owner picker. Sources from the live employee directory.
 *  Free-text custom owners are NOT allowed - only existing employees. */
export function OwnerCombobox({
  value,
  onChange,
  placeholder = "Search employees...",
  className,
}: {
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const { members } = useEmployeeDirectory();
  const [open, setOpen] = useState(false);

  const names = useMemo(
    () => Array.from(new Set(members.map((m) => m.name).filter(Boolean))).sort(),
    [members],
  );
  const selected = value ?? [];

  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter((n) => n !== name));
    else onChange([...selected, name]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-10 py-1.5", className)}
        >
          <div className="flex flex-wrap gap-1 text-left">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm">Select owners...</span>
            ) : (
              selected.map((n) => (
                <Badge key={n} variant="secondary" className="gap-1">
                  {n}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); toggle(n); }}
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup>
              {names.map((name) => {
                const isSelected = selected.includes(name);
                return (
                  <CommandItem key={name} value={name} onSelect={() => toggle(name)}>
                    <Check className={cn("mr-2 size-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Utility: normalize legacy single-string owner values to string[] for display/filtering. */
export function ownersToList(v: string[] | string | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [v];
}

export function ownersToText(v: string[] | string | null | undefined): string {
  const list = ownersToList(v);
  return list.length ? list.join(", ") : "-";
}