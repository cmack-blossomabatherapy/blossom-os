import { ChevronDown } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type TeamMember,
  departmentVariant,
  workloadVariant,
} from "@/data/team";

interface Props {
  members: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeamOrgChart({ members, selectedId, onSelect }: Props) {
  const roots = members.filter((m) => !m.reportsTo);

  return (
    <div className="bg-card rounded-xl border border-border/60 p-6 overflow-x-auto">
      <div className="flex flex-col items-center gap-6 min-w-fit">
        {roots.length === 0 && (
          <p className="text-sm text-muted-foreground py-8">
            No org structure yet — assign reporting relationships to build the chart.
          </p>
        )}
        {roots.map((root) => (
          <Branch key={root.id} member={root} all={members} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function Branch({
  member, all, selectedId, onSelect,
}: {
  member: TeamMember;
  all: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const reports = all.filter((m) => m.reportsTo === member.id);

  return (
    <div className="flex flex-col items-center gap-3">
      <OrgCard member={member} selected={selectedId === member.id} onSelect={onSelect} />
      {reports.length > 0 && (
        <>
          <div className="flex flex-col items-center text-muted-foreground/40">
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex items-start gap-4 flex-wrap justify-center">
            {reports.map((r) => (
              <Branch key={r.id} member={r} all={all} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgCard({
  member, selected, onSelect,
}: {
  member: TeamMember;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(member.id)}
      className={cn(
        "min-w-[200px] rounded-xl border-2 transition-all p-3 text-left bg-card",
        selected ? "border-primary shadow-sm" : "border-border/60 hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
          {member.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <StatusBadge status={member.department} variant={departmentVariant(member.department)} />
        <StatusBadge status={member.workloadLevel} variant={workloadVariant(member.workloadLevel)} />
      </div>
    </button>
  );
}
