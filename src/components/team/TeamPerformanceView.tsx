import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TeamMember,
  type Department,
  departmentOrder,
  departmentVariant,
} from "@/data/team";

interface Props {
  members: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeamPerformanceView({ members, selectedId, onSelect }: Props) {
  const grouped = departmentOrder
    .map((d) => ({ dept: d, list: members.filter((m) => m.department === d) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map((g) => (
        <DepartmentBlock key={g.dept} dept={g.dept} list={g.list} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function DepartmentBlock({
  dept, list, selectedId, onSelect,
}: {
  dept: Department;
  list: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{dept} Team</h3>
        <StatusBadge status={`${list.length}`} variant={departmentVariant(dept)} />
      </div>
      <div className="divide-y divide-border/30">
        {list.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-4",
              selectedId === m.id && "bg-primary/5",
            )}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {m.initials}
            </div>
            <div className="min-w-[160px]">
              <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
              <p className="text-[11px] text-muted-foreground">{m.role}</p>
            </div>
            <div className="flex-1 flex items-center justify-end gap-6 flex-wrap">
              {m.performance.map((p, i) => (
                <div key={i} className="text-right min-w-[80px]">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.label}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <p className="text-sm font-semibold text-foreground tabular-nums">{p.value}</p>
                    {p.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                    {p.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                    {p.trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
