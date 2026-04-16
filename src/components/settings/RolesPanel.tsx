import { useState } from "react";
import { Check, X } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { cn } from "@/lib/utils";
import { mockRoles, permissionLabels, type Role, type PermissionKey } from "@/data/settings";

export function RolesPanel() {
  const [activeRoleId, setActiveRoleId] = useState<string>(mockRoles[0]?.id ?? "");
  const role = mockRoles.find((r) => r.id === activeRoleId)!;

  return (
    <SettingsPanel
      title="Roles & Permissions"
      description="Define what each role can see and do across the system"
      primaryAction={{ label: "Add Role" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
        <div className="space-y-1">
          {mockRoles.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoleId(r.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md border transition-colors",
                activeRoleId === r.id
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border/60 hover:bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{r.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{r.memberCount}</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{r.description}</p>
            </button>
          ))}
        </div>

        <RolePermissions role={role} />
      </div>
    </SettingsPanel>
  );
}

function RolePermissions({ role }: { role: Role }) {
  const groups: { title: string; keys: PermissionKey[] }[] = [
    { title: "Leads", keys: ["view-leads", "edit-leads"] },
    { title: "Clients", keys: ["view-clients", "edit-clients"] },
    { title: "Authorizations", keys: ["view-auths", "edit-auths"] },
    { title: "QA", keys: ["view-qa", "edit-qa"] },
    { title: "System", keys: ["run-automations", "access-reports", "manage-team", "manage-settings"] },
  ];

  return (
    <div className="bg-secondary/20 rounded-lg border border-border/40 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{role.name}</h3>
        <p className="text-xs text-muted-foreground">{role.description}</p>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">{g.title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {g.keys.map((k) => (
              <PermRow key={k} label={permissionLabels[k]} granted={role.permissions[k]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PermRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
      granted ? "border-success/30 bg-success/5" : "border-border/40 bg-card",
    )}>
      <div className={cn(
        "h-4 w-4 rounded inline-flex items-center justify-center shrink-0",
        granted ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
      )}>
        {granted ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <X className="h-2.5 w-2.5" strokeWidth={3} />}
      </div>
      <span className={cn("text-xs", granted ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}
