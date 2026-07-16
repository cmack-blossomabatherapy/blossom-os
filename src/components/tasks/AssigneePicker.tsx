import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { cn } from "@/lib/utils";

/**
 * AssigneePicker — searchable dropdown of all active employees.
 * Used across the Tasks page for reassign / owner selection.
 */

export interface AssigneeOption {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
  state: string | null;
  userId: string | null;
}

async function fetchAssignees(search?: string): Promise<AssigneeOption[]> {
  const { data, error } = await supabase.rpc("search_assignable_employees" as never, {
    search: search?.trim() || null,
    max_rows: 100,
  } as never);
  if (error) throw error;
  return ((data as any[] | null) ?? [])
    .map((e: any) => ({
      id: e.id,
      name:
        (e.name ?? "").trim() ||
        (e.email ?? "Unknown"),
      email: e.email ?? null,
      jobTitle: e.job_title ?? null,
      state: e.state ?? null,
      userId: e.user_id ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface Props {
  value: string;
  onChange: (name: string, member?: AssigneeOption) => void;
  placeholder?: string;
  className?: string;
  triggerSize?: "sm" | "default";
}

export function AssigneePicker({
  value,
  onChange,
  placeholder = "Search people…",
  className,
  triggerSize = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      fetchAssignees(query)
      .then((rows) => { if (!cancelled) setPeople(rows); })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    }, 150);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [open, query]);

  const selected = useMemo(
    () => people.find((p) => p.name === value),
    [people, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            triggerSize === "sm" ? "h-7 px-2 text-xs" : "h-9 w-full",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-60" />
            ) : (
              <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
            )}
            <span className="truncate">{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search by name, email, title…" />
          <CommandList>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading people…
              </div>
            )}
            {!loading && (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1 py-2 text-center text-xs text-muted-foreground">
                    <UserX className="h-4 w-4 opacity-60" />
                    <div>No matching people</div>
                  </div>
                </CommandEmpty>
                <CommandGroup heading={`Active people (${people.length})`}>
                  {value && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => { onChange("", undefined); setOpen(false); }}
                      className="text-xs text-muted-foreground"
                    >
                      Clear assignment
                    </CommandItem>
                  )}
                  {people.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={`${m.name} ${m.email ?? ""} ${m.jobTitle ?? ""}`}
                      onSelect={() => { onChange(m.name, m); setOpen(false); }}
                    >
                      <Check className={cn("mr-2 h-3.5 w-3.5", selected?.id === m.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm">{m.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {m.jobTitle ?? "Team member"}{m.state ? ` · ${m.state}` : ""}{m.email ? ` · ${m.email}` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}