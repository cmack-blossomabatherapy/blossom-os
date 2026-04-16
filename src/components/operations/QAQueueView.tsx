import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { mockQAItems, qaStageVariant, type QAItem, type QAStage } from "@/data/operations";

interface Section {
  title: string;
  description: string;
  icon: typeof AlertCircle;
  iconClass: string;
  filter: (q: QAItem) => boolean;
}

const sections: Section[] = [
  {
    title: "Needs Attention",
    description: "Missing treatment plan or documentation",
    icon: AlertCircle,
    iconClass: "text-destructive",
    filter: (q) => q.missingItems.length > 0 && q.stage !== "Returned",
  },
  {
    title: "In Progress",
    description: "Actively in QA review",
    icon: Clock,
    iconClass: "text-warning",
    filter: (q) => q.stage === "In QA Review" && q.missingItems.length === 0,
  },
  {
    title: "Ready to Submit",
    description: "QA complete · ready for treatment auth",
    icon: CheckCircle2,
    iconClass: "text-success",
    filter: (q) => q.stage === "Ready to Submit",
  },
  {
    title: "Returned · Needs Fix",
    description: "Sent back to BCBA for corrections",
    icon: RotateCcw,
    iconClass: "text-warning",
    filter: (q) => q.stage === "Returned",
  },
];

interface Props {
  searchQuery: string;
}

export function QAQueueView({ searchQuery }: Props) {
  const navigate = useNavigate();
  const filtered = mockQAItems.filter(
    (q) => !searchQuery || q.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        const items = filtered.filter(s.filter);
        return (
          <div key={s.title} className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <s.icon className={cn("h-4 w-4", s.iconClass)} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border/60">
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">No items in this group</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                {items.map((q) => (
                  <QACard key={q.id} q={q} onClick={() => navigate(`/qa/${q.id}`)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QACard({ q, onClick }: { q: QAItem; onClick: () => void }) {
  const isStale = q.daysInQA > 3;
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{q.clientName}</p>
        <StatusBadge status={q.stage} variant={qaStageVariant(q.stage)} />
      </div>
      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
        <span>{q.bcba ?? "No BCBA"}</span>
        <span>·</span>
        <span>{q.payor}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-muted-foreground">Owner: {q.owner}</span>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded",
            isStale ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
          )}
        >
          {q.daysInQA}d in QA
        </span>
      </div>
      {q.missingItems.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <p className="text-[10px] text-destructive font-medium">Missing:</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{q.missingItems.join(", ")}</p>
        </div>
      )}
    </button>
  );
}

export type { QAStage };
