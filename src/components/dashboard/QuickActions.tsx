import { UserPlus, Users, ShieldCheck, UserCheck, Calendar, Plus } from "lucide-react";

const actions = [
  { label: "New Lead", icon: UserPlus, href: "/leads" },
  { label: "New Client", icon: Users, href: "/clients" },
  { label: "New Authorization", icon: ShieldCheck, href: "/authorizations" },
  { label: "Assign BCBA", icon: UserCheck, href: "/ops/staffing?tab=open-cases" },
  { label: "Assign RBT", icon: UserCheck, href: "/ops/staffing?tab=match-queue" },
  { label: "Schedule Assessment", icon: Calendar, href: "/scheduling" },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-foreground transition-colors text-left group"
          >
            <action.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
