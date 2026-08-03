import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/**
 * Searchable single-select used by every CentralReach report filter.
 *
 * Replaces the plain `Select` dropdowns, which both truncated long option
 * lists and were unusable at ~1,000 clients. Options are searched in full;
 * only the matching slice is rendered so 1,000+ entries stay responsive.
 */
export const FILTER_ALL_VALUE = "__all";

const RENDER_LIMIT = 200;

export function FilterCombobox({
  label,
  value,
  options,
  onChange,
  allLabel,
  className,
}: {
  label: string;
  /** Empty string or `__all` means "no filter". */
  value: string;
  options: string[];
  onChange: (next: string) => void;
  allLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const all = allLabel ?? `All ${label}`;
  const selected = !value || value === FILTER_ALL_VALUE ? "" : value;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return { rows: matches.slice(0, RENDER_LIMIT), total: matches.length };
  }, [options, query]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn("h-9 w-full min-w-0 justify-between bg-background px-2.5 text-xs font-normal", className)}
        >
          <span className="truncate">{selected || all}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${label.toLowerCase()}…`}
            value={query}
            onValueChange={setQuery}
            className="text-xs"
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              <CommandItem value={FILTER_ALL_VALUE} onSelect={() => pick("")} className="text-xs">
                <Check className={cn("mr-2 h-3.5 w-3.5", selected ? "opacity-0" : "opacity-100")} />
                {all}
              </CommandItem>
              {visible.rows.map((o) => (
                <CommandItem key={o} value={o} onSelect={() => pick(o)} className="text-xs">
                  <Check className={cn("mr-2 h-3.5 w-3.5", selected === o ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{o}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {visible.total > visible.rows.length && (
              <p className="px-3 py-2 text-[10px] text-muted-foreground">
                Showing {visible.rows.length} of {visible.total} — keep typing to narrow.
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}