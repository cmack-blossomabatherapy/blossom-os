import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DocumentRecord, formatDocDate, daysUntil } from "@/data/documents";

interface Props {
  documents: DocumentRecord[];
  onSelect: (id: string) => void;
}

export function MissingDocumentsBanner({ documents, onSelect }: Props) {
  const missing = documents.filter((d) => d.status === "Missing");
  if (missing.length === 0) return null;

  // Show top 3
  const top = missing.slice(0, 3);

  return (
    <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Missing Documents Engine</h3>
            <p className="text-[11px] text-muted-foreground">
              {missing.length} document{missing.length === 1 ? "" : "s"} blocking pipeline progress
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {top.map((d) => {
          const dDays = daysUntil(d.requiredBy);
          const overdue = dDays !== null && dDays < 0;
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="text-left bg-card rounded-lg border border-destructive/20 p-2.5 hover:border-destructive/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground truncate">{d.linkedRecordLabel}</p>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-destructive shrink-0" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{d.type}</p>
              <div className="flex items-center justify-between mt-2">
                {d.blockingStage && (
                  <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                    Blocks: {d.blockingStage}
                  </span>
                )}
                {d.requiredBy && (
                  <span className={cn(
                    "text-[10px] font-medium tabular-nums ml-auto",
                    overdue ? "text-destructive" : "text-warning",
                  )}>
                    {overdue ? `${Math.abs(dDays!)}d overdue` : `${dDays}d left`}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
