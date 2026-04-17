import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  mockCandidates,
  onboardingProgress,
  stageVariant,
  type Candidate,
  type CandidateRole,
} from "@/data/recruiting";
import { cn } from "@/lib/utils";

interface Props {
  role: CandidateRole;
  searchQuery: string;
  filter: (c: Candidate) => boolean;
}

export function RecruitingTableView({ role, searchQuery, filter }: Props) {
  const navigate = useNavigate();
  const rows = mockCandidates.filter((c) => {
    if (c.role !== role) return false;
    if (!filter(c)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.recruiter.toLowerCase().includes(q) ||
      c.appliedFor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Candidate", "Role", "Stage", "Source", "Location", "Recruiter", "Onboarding", "Days in Stage", ""].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const op = onboardingProgress(c);
            return (
              <tr
                key={c.id}
                onClick={() => navigate(`/recruiting/${c.id}`)}
                className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  <div className="flex items-center gap-1.5">
                    {c.name}
                    {c.alerts.length > 0 && <AlertCircle className="h-3 w-3 text-destructive" />}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.role}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={c.stage} variant={stageVariant(c.stage)} />
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    "text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded",
                    c.source === "Apploi" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {c.source}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.city}, {c.state}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.recruiter}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          op.pct === 100 ? "bg-success" : op.pct > 50 ? "bg-info" : "bg-warning",
                        )}
                        style={{ width: `${op.pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
                      {op.pct}%
                    </span>
                  </div>
                </td>
                <td className={cn("px-4 py-2.5 font-medium tabular-nums", c.daysInStage > 10 ? "text-destructive" : "text-muted-foreground")}>
                  {c.daysInStage}d
                </td>
                <td className="px-4 py-2.5 text-right text-[10px] text-muted-foreground">{c.id}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No candidates match the current filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
