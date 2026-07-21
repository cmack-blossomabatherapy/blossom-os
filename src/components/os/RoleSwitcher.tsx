import { useEffect, useState } from "react";
import { ChevronDown, Shield, MapPin, Eye, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOSRole, OS_STATES } from "@/contexts/OSRoleContext";
import { ROLE_PREVIEW_LIST } from "@/lib/os/roleMenus";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { displayNameFor } from "@/lib/os/clinicianIdentity";

/** Demo control for switching the active OS role + state scope. */
export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    role, scope, activeState, setRole, setActiveState,
    previewSubjectEmployeeId, setPreviewSubjectEmployeeId, isPreviewing,
  } = useOSRole();
  const { isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [subjectResults, setSubjectResults] = useState<Array<{ id: string; first_name: string|null; last_name: string|null; email: string|null; credential: string|null }>>([]);
  const [subjectLabel, setSubjectLabel] = useState<string | null>(null);
  const current =
    ROLE_PREVIEW_LIST.find((r) => r.role === role) ?? ROLE_PREVIEW_LIST[0];

  // Only super admins can impersonate other roles.
  if (loading || !isAdmin) return null;

  const showPreviewPicker = role === "rbt" || role === "bcba";

  // Search employees by name when picker is open.
  useEffect(() => {
    if (!showPreviewPicker || !open) return;
    let cancelled = false;
    const run = async () => {
      const q = subjectQuery.trim();
      const credentialFilter = role === "bcba" ? "BCBA" : "RBT";
      let query = supabase
        .from("employees")
        .select("id,first_name,last_name,email,credential")
        .ilike("credential", `%${credentialFilter}%`)
        .order("last_name", { ascending: true })
        .limit(15);
      if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
      const { data } = await query;
      if (!cancelled) setSubjectResults((data as any) ?? []);
    };
    void run();
    return () => { cancelled = true; };
  }, [subjectQuery, showPreviewPicker, open, role]);

  // Resolve label for the current preview subject once.
  useEffect(() => {
    let cancelled = false;
    if (!previewSubjectEmployeeId) { setSubjectLabel(null); return; }
    supabase.from("employees")
      .select("first_name,last_name,email")
      .eq("id", previewSubjectEmployeeId)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setSubjectLabel(data ? displayNameFor(data as any) : null); });
    return () => { cancelled = true; };
  }, [previewSubjectEmployeeId]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "os-glass-panel flex items-center gap-2 rounded-2xl px-2.5 py-1.5 text-left",
          compact ? "" : "pr-3.5",
        )}
      >
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
          <Shield className="h-3.5 w-3.5" />
        </div>
        {!compact && (
          <div className="hidden lg:block">
            <p className="text-[11.5px] font-semibold leading-tight">{current.label}</p>
            <p className="text-[10px] capitalize text-muted-foreground leading-tight">
              {scope === "state" ? `${activeState} · state scope` : `${scope} scope`}
            </p>
          </div>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="os-glass-panel absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl p-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                View as role
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {ROLE_PREVIEW_LIST.map((r) => (
                <button
                  key={r.role}
                  onClick={() => { setRole(r.role); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] transition",
                    r.role === role ? "bg-gradient-to-r from-[hsl(265_85%_65%)]/15 to-transparent text-foreground" : "hover:bg-foreground/[0.04]",
                  )}
                >
                  <span className="font-medium">{r.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">role</span>
                </button>
              ))}
            </div>

            {scope === "state" && (
              <div className="mt-1 border-t border-border/60 px-2 pt-2 pb-1">
                <div className="flex items-center gap-2 px-0.5 pb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">State scope</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {OS_STATES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveState(s)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                        s === activeState
                          ? "bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white"
                          : "bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showPreviewPicker && (
              <div className="mt-1 border-t border-border/60 px-2 pt-2 pb-1">
                <div className="flex items-center justify-between gap-2 px-0.5 pb-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Preview as {role === "bcba" ? "BCBA" : "RBT"}
                    </p>
                  </div>
                  {isPreviewing && (
                    <button
                      onClick={() => setPreviewSubjectEmployeeId(null)}
                      className="flex items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 hover:bg-foreground/[0.1]"
                    >
                      <X className="h-3 w-3" /> Exit preview
                    </button>
                  )}
                </div>
                {isPreviewing && (
                  <p className="mb-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[10.5px] text-amber-700">
                    Read-only preview as <span className="font-semibold">{subjectLabel ?? "employee"}</span>. Writes are blocked.
                  </p>
                )}
                <input
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                  placeholder="Search employee…"
                  className="w-full rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[12px] outline-none focus:border-foreground/30"
                />
                <div className="mt-1 max-h-40 overflow-y-auto">
                  {subjectResults.map((emp) => {
                    const active = emp.id === previewSubjectEmployeeId;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => { setPreviewSubjectEmployeeId(emp.id); setOpen(false); }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12px]",
                          active ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <span className="truncate">{displayNameFor(emp)}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {emp.credential ?? ""}
                        </span>
                      </button>
                    );
                  })}
                  {!subjectResults.length && (
                    <p className="px-2 py-1.5 text-[11px] text-muted-foreground">No employees found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}