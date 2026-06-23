import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ChevronsUpDown, Loader2, RefreshCw, Search, UserX } from "lucide-react";
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
  userId: string | null; // auth user id — written to the lead for joins
  isOnboarding: boolean; // employees.status === 'pending_start'
}

const INTAKE_ROLES = new Set(["intake_coordinator", "intake_lead"]);

/**
 * Employees with status 'active' are obviously current intake staff.
 * 'pending_start' is the schema's onboarding bucket (employee hired but
 * before their first active day) — we treat these as active current intake
 * staff and tag them with an "Onboarding" badge so it's obvious in the picker.
 * Inactive / on_leave / on_hold / resigned / terminated are excluded.
 */
const ACTIVE_STATUSES = ["active", "pending_start"] as const;

async function fetchIntakeStaff(): Promise<IntakeStaffMember[]> {
  const [empRes, rolesRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id,first_name,last_name,email,job_title,state,user_id,status")
      .in("status", ACTIVE_STATUSES as unknown as string[]),
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
      userId: e.user_id ?? null,
      isOnboarding: e.status === "pending_start",
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
  /** Show a red ring + helper message when the field is invalid. */
  invalid?: boolean;
}

export function IntakeCoordinatorPicker({ value, onChange, placeholder = "Search intake staff…", className, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<IntakeStaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchIntakeStaff()
      .then((rows) => { if (!cancelled) setStaff(rows); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed to load intake staff"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

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
          className={cn(
            "h-9 w-full justify-between font-normal",
            !value && "text-muted-foreground",
            invalid && "border-destructive ring-1 ring-destructive/40",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {loading
              ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-60" />
              : <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            <span className="truncate">{value || placeholder}</span>
            {selected?.isOnboarding && (
              <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:text-amber-300">Onboarding</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name, email, role…" />
          <CommandList>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading active intake staff…
              </div>
            )}
            {error && !loading && (
              <div className="flex flex-col gap-2 px-3 py-4 text-xs">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div className="font-medium">Couldn’t load intake staff</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{error}</div>
                  </div>
                </div>
                <Button type="button" size="sm" variant="outline" className="h-7 self-start text-[11px]" onClick={() => setReloadKey((k) => k + 1)}>
                  <RefreshCw className="mr-1.5 h-3 w-3" /> Try again
                </Button>
              </div>
            )}
            {!loading && !error && (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1 py-2 text-center text-xs text-muted-foreground">
                    <UserX className="h-4 w-4 opacity-60" />
                    <div>No matching intake staff</div>
                    <div className="text-[10.5px]">Try a different name, email, or role.</div>
                  </div>
                </CommandEmpty>
                {staff.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 px-3 py-6 text-center text-xs text-muted-foreground">
                    <UserX className="h-4 w-4 opacity-60" />
                    <div>No active intake staff in user management.</div>
                    <div className="text-[10.5px]">Add or assign the Intake Coordinator role to an employee.</div>
                  </div>
                ) : (
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
                        <span className="flex items-center gap-1.5 truncate text-sm">
                          {m.name}
                          {m.isOnboarding && (
                            <span className="rounded-full bg-amber-500/15 px-1.5 py-px text-[9.5px] font-medium text-amber-700 dark:text-amber-300">Onboarding</span>
                          )}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {roleLabel(m.role, m.jobTitle)}{m.state ? ` · ${m.state}` : ""}{m.email ? ` · ${m.email}` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}