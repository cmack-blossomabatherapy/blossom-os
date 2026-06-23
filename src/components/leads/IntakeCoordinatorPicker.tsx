import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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
 * IntakeCoordinatorPicker
 * Searchable picker that lists ACTIVE intake staff sourced from user management
 * (employees joined with user_roles). An intake staff member is anyone with a
 * role of intake_coordinator / intake_lead, OR whose job title contains
 * "intake". Inactive / terminated employees are excluded.
 */

export interface IntakeStaffMember {
  id: string;            // employee id (stable display key)
  name: string;          // "First Last"
  email: string | null;
  jobTitle: string | null;
  role: string | null;   // user_roles.role (intake_coordinator | intake_lead | …)
  state: string | null;
}

const INTAKE_ROLES = new Set(["intake_coordinator", "intake_lead"]);

async function fetchIntakeStaff(): Promise<IntakeStaffMember[]> {
  const [empRes, rolesRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id,first_name,last_name,email,job_title,state,user_id,status")
      .in("status", ["active", "pending_start"]),
    supabase.from("user_roles").select("user_id,role"),
  ]);
  if (empRes.error) throw empRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const rolesByUser = new Map<string, string[]>();
  (rolesRes.data ?? []).forEach((r: any) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });

  const out: IntakeStaffMember[] = [];
  for (const e of empRes.data ?? []) {
    const roles = e.user_id ? rolesByUser.get(e.user_id) ?? [] : [];
    const hasIntakeRole = roles.some((r) => INTAKE_ROLES.has(r));
    const jobTitleIntake = (e.job_title ?? "").toLowerCase().includes("intake");
    if (!hasIntakeRole && !jobTitleIntake) continue;
    out.push({
      id: e.id,
      name: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || (e.email ?? "Unknown"),
      email: e.email ?? null,
      jobTitle: e.job_title ?? null,
      role: roles.find((r) => INTAKE_ROLES.has(r)) ?? null,
      state: e.state ?? null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function roleLabel(r: string | null, jobTitle: string | null) {
  if (r === "intake_lead") return "Intake Lead";
  if (r === "intake_coordinator") return "Intake Coordinator";
  return jobTitle ?? "Intake";
}

interface Props {
  value: string;
  onChange: (name: string, member?: IntakeStaffMember) => void;
  placeholder?: string;
  className?: string;
}

export function IntakeCoordinatorPicker({ value, onChange, placeholder = "Search intake staff…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<IntakeStaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchIntakeStaff()
      .then((rows) => { if (!cancelled) setStaff(rows); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed to load intake staff"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(
    () => staff.find((s) => s.name === value),
    [staff, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-9 w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="truncate">{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name, email, role…" />
          <CommandList>
            {loading && <div className="px-3 py-4 text-xs text-muted-foreground">Loading intake staff…</div>}
            {error && <div className="px-3 py-4 text-xs text-destructive">{error}</div>}
            {!loading && !error && (
              <>
                <CommandEmpty>No active intake staff found.</CommandEmpty>
                <CommandGroup heading={`Active intake staff (${staff.length})`}>
                  {value && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => { onChange("", undefined); setOpen(false); }}
                      className="text-xs text-muted-foreground"
                    >
                      Clear assignment
                    </CommandItem>
                  )}
                  {staff.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={`${m.name} ${m.email ?? ""} ${m.role ?? ""} ${m.jobTitle ?? ""}`}
                      onSelect={() => { onChange(m.name, m); setOpen(false); }}
                    >
                      <Check className={cn("mr-2 h-3.5 w-3.5", selected?.id === m.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm">{m.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {roleLabel(m.role, m.jobTitle)}{m.state ? ` · ${m.state}` : ""}{m.email ? ` · ${m.email}` : ""}
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