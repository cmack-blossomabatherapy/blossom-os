import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_META, type AppRole } from "@/lib/roles";
import { getSidebarPreviewForRoles, hasFullNavigationAccess, roleNavigationExceptions } from "@/lib/navigationAccess";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PermRow {
  key: string;
  module: string;
  label: string;
  description: string | null;
}

/** Live editor of role → permission matrix. Backed by `permissions` and `role_permissions` tables. */
export function RolesPanel() {
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [matrix, setMatrix] = useState<Map<string, Set<AppRole>>>(new Map()); // perm_key -> roles granting it
  const [memberCount, setMemberCount] = useState<Map<AppRole, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<AppRole>("ops_manager");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const activeMeta = ROLE_META.find((r) => r.key === activeRole) ?? ROLE_META[0];
  const activeRoleHasPermission = (permission: string) => activeRole === "admin" || (matrix.get(permission)?.has(activeRole) ?? false);
  const sidebarPreview = getSidebarPreviewForRoles([activeRole], activeRoleHasPermission);
  const exceptionCount = (roleNavigationExceptions[activeRole]?.sectionTitles?.length ?? 0) + (roleNavigationExceptions[activeRole]?.itemPaths?.length ?? 0);
  const totalVisibleTabs = sidebarPreview.reduce((total, section) => total + section.items.length, 0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [pRes, rpRes, urRes] = await Promise.all([
        supabase.from("permissions").select("key, module, label, description").order("module"),
        supabase.from("role_permissions").select("role, permission_key"),
        supabase.from("user_roles").select("role"),
      ]);
      setPerms((pRes.data ?? []) as PermRow[]);
      const m = new Map<string, Set<AppRole>>();
      (rpRes.data ?? []).forEach((r) => {
        const set = m.get(r.permission_key) ?? new Set<AppRole>();
        set.add(r.role as AppRole);
        m.set(r.permission_key, set);
      });
      setMatrix(m);
      const counts = new Map<AppRole, number>();
      (urRes.data ?? []).forEach((r) => {
        counts.set(r.role as AppRole, (counts.get(r.role as AppRole) ?? 0) + 1);
      });
      setMemberCount(counts);
      setLoading(false);
    };
    void load();
  }, []);

  const grouped = useMemo(() => {
    const byModule = new Map<string, PermRow[]>();
    perms.forEach((p) => {
      const list = byModule.get(p.module) ?? [];
      list.push(p);
      byModule.set(p.module, list);
    });
    return Array.from(byModule.entries());
  }, [perms]);

  const grantedCount = activeRole === "admin" ? perms.length : perms.filter((p) => matrix.get(p.key)?.has(activeRole)).length;

  const togglePerm = async (permKey: string) => {
    if (activeRole === "admin") {
      toast.info("Admin always has every permission");
      return;
    }
    setSavingKey(permKey);
    const granted = matrix.get(permKey)?.has(activeRole) ?? false;
    if (granted) {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role", activeRole)
        .eq("permission_key", permKey);
      if (error) {
        toast.error(error.message);
        setSavingKey(null);
        return;
      }
    } else {
      const { error } = await supabase
        .from("role_permissions")
        .insert({ role: activeRole, permission_key: permKey });
      if (error) {
        toast.error(error.message);
        setSavingKey(null);
        return;
      }
    }
    setMatrix((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(permKey) ?? []);
      if (granted) set.delete(activeRole);
      else set.add(activeRole);
      next.set(permKey, set);
      return next;
    });
    setSavingKey(null);
  };

  if (loading) {
    return (
      <SettingsPanel title="Roles & Permissions" description="Loading…">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel
      title="Roles & Permissions"
      description="Admin access control for what each role sees, does, and owns. Changes save instantly."
      showSave={false}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          ["System Admin", ROLE_META.filter((r) => r.permissionLevel === "System Admin").length],
          ["Full Module Control", ROLE_META.filter((r) => r.permissionLevel === "Full Module Control").length],
          ["Edit Scoped", ROLE_META.filter((r) => r.permissionLevel === "Edit Scoped").length],
          ["View Only", ROLE_META.filter((r) => r.permissionLevel === "View Only").length],
        ].map(([label, count]) => (
          <div key={label} className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold text-foreground">{count}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <div className="space-y-1 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {ROLE_META.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md border transition-colors",
                activeRole === r.key
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border/60 hover:bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{r.label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {memberCount.get(r.key) ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-primary">{r.permissionLevel}</p>
            </button>
          ))}
        </div>

        <div className="bg-secondary/20 rounded-lg border border-border/40 p-4 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{activeMeta.label}</h3>
                  <Badge variant="secondary" className="text-[10px]">{activeMeta.permissionLevel}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activeMeta.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">{grantedCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Permissions</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Scope</p>
                <p className="mt-1 text-xs font-medium text-foreground">{activeMeta.scope}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">People</p>
                <p className="mt-1 text-xs font-medium text-foreground">{activeMeta.owners.join(", ")}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Owns</p>
                <p className="mt-1 text-xs font-medium text-foreground">{activeMeta.owns.join(" · ")}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Can</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeMeta.can.map((item) => <Badge key={item} variant="outline" className="text-[11px]">{item}</Badge>)}
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-card p-3">
                <p className="text-xs font-semibold text-foreground">Cannot / guardrails</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(activeMeta.cannot ?? ["Limited by selected permission toggles and ownership scope"]).map((item) => <Badge key={item} variant="secondary" className="text-[11px]">{item}</Badge>)}
                </div>
              </div>
            </div>

            {activeRole === "admin" && (
              <span className="w-fit text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                Always all permissions
              </span>
            )}

            <div className="rounded-lg border border-border/50 bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Sidebar preview</h3>
                  <p className="text-xs text-muted-foreground">Tabs visible to this role after menu restrictions and permissions.</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">{totalVisibleTabs}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Visible tabs</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {sidebarPreview.map((section) => (
                  <div key={section.title} className="rounded-md border border-border/50 bg-secondary/20 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {section.items.map((item) => (
                        <Badge key={`${section.title}-${item.path}`} variant="outline" className="text-[11px]">
                          {item.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {hasFullNavigationAccess([activeRole])
                  ? "This role uses the full navigation rule."
                  : exceptionCount > 0
                    ? `${exceptionCount} configured exception${exceptionCount === 1 ? "" : "s"} extend this role beyond Intelligence.`
                    : "No exceptions configured; this role is limited to Intelligence."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Permission matrix
              </h3>
              <p className="text-xs text-muted-foreground">
                Toggle exactly what this role can access in Admin settings.
              </p>
            </div>

          {grouped.map(([module, items]) => (
            <div key={module}>
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                {module}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {items.map((p) => {
                  const granted = activeRole === "admin" || (matrix.get(p.key)?.has(activeRole) ?? false);
                  return (
                    <label
                      key={p.key}
                      className={cn(
                        "flex items-start gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors",
                        granted
                          ? "border-success/30 bg-success/5"
                          : "border-border/40 bg-card hover:bg-muted/30",
                        activeRole === "admin" && "cursor-not-allowed opacity-90",
                      )}
                    >
                      <Checkbox
                        checked={granted}
                        disabled={activeRole === "admin" || savingKey === p.key}
                        onCheckedChange={() => togglePerm(p.key)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <span className={cn("text-xs", granted ? "text-foreground" : "text-muted-foreground")}>
                          {p.label}
                        </span>
                        {p.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
                        )}
                      </div>
                      {savingKey === p.key && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </SettingsPanel>
  );
}
