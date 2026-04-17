import { useNavigate } from "react-router-dom";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  candidatesByStage,
  type CandidateRole,
  type Candidate,
} from "@/data/recruiting";

interface Props {
  role: CandidateRole;
  searchQuery: string;
  filter: (c: Candidate) => boolean;
}

export function RecruitingPipelineView({ role, searchQuery, filter }: Props) {
  const navigate = useNavigate();
  const columns = candidatesByStage(role, (c) => {
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
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {columns.map((col) => (
          <div
            key={col.stage}
            className="w-[260px] shrink-0 bg-secondary/40 rounded-xl border border-border/40 flex flex-col max-h-[70vh]"
          >
            <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground truncate">{col.stage}</h3>
              <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                {col.candidates.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {col.candidates.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic text-center py-4">empty</p>
              )}
              {col.candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/recruiting/${c.id}`)}
                  className="w-full text-left bg-card rounded-lg border border-border/60 p-2.5 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                    {c.alerts.length > 0 && (
                      <AlertCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.appliedFor}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {c.state}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5",
                        c.daysInStage > 10 ? "text-destructive" : "",
                      )}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {c.daysInStage}d
                    </span>
                    {c.source === "Apploi" && (
                      <span className="ml-auto text-[9px] uppercase font-semibold bg-primary/10 text-primary px-1 rounded">
                        Apploi
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
