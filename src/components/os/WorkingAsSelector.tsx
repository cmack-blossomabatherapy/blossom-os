import { useState } from "react";
import { ChevronDown, MapPin, Briefcase, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { useAuth } from "@/contexts/AuthContext";
import { DEPARTMENT_LABELS, type DepartmentKey } from "@/lib/access/roleAssignments";

/**
 * "Working As" selector — visible only for normal multi-hat users (≥2 hats).
 * Super-admins keep using <RoleSwitcher> (View As Role) and do NOT see this.
 */
export function WorkingAsSelector() {
  const { hats, activeHat, setActiveHat } = useOSRole();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return null;
  // Super-admins see the dedicated "View As Role" tool instead.
  if (isAdmin) return null;
  // Single-hat (or no-hat) users don't need a switcher.
  if (hats.length < 2 || !activeHat) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="os-glass-panel flex items-center gap-2 rounded-2xl px-2.5 py-1.5 pr-3.5 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <Briefcase className="h-3.5 w-3.5" />
        </div>
        <div className="hidden lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground leading-none">
            Working as
          </p>
          <p className="mt-0.5 text-[12px] font-semibold leading-tight">
            {activeHat.label}
            {activeHat.stateCode && (
              <span className="ml-1 text-muted-foreground font-normal">— {activeHat.stateCode}</span>
            )}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="os-glass-panel absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl p-2">
            <div className="px-2 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Switch active hat
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                The menu and state context follow your selection.
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {hats.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setActiveHat(h.id);
                    setOpen(false);
                    const home = ROLE_HOME[h.osRole] ?? "/";
                    navigate(home, { replace: true });
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition",
                    h.id === activeHat.id
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                      : "hover:bg-foreground/[0.04]",
                  )}
                >
                  <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-md bg-muted text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">
                      {h.label}
                      {h.isPrimary && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wider text-primary">
                          <Star className="h-2.5 w-2.5" /> Primary
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {h.stateCode && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {h.stateCode}
                        </span>
                      )}
                      {h.departmentKey && (
                        <span className="capitalize">
                          {DEPARTMENT_LABELS[h.departmentKey as DepartmentKey] ?? h.departmentKey}
                        </span>
                      )}
                      <span className="capitalize">· {h.scope}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}