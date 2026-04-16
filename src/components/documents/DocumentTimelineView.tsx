import { FileText, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { type DocumentRecord, docStatusVariant, formatDocDate } from "@/data/documents";

interface Props {
  documents: DocumentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DocumentTimelineView({ documents, selectedId, onSelect }: Props) {
  // Sort by uploadedAt desc; missing docs go last grouped
  const uploaded = documents
    .filter((d) => d.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime());
  const missing = documents.filter((d) => !d.uploadedAt);

  // group uploaded by day
  const groups = new Map<string, DocumentRecord[]>();
  uploaded.forEach((d) => {
    const day = new Date(d.uploadedAt!).toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(d);
  });

  return (
    <div className="space-y-5">
      {missing.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-destructive mb-2 px-1 inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Awaiting Upload · {missing.length}
          </h3>
          <div className="bg-card rounded-xl border border-destructive/30 overflow-hidden divide-y divide-border/30">
            {missing.map((d) => (
              <Row key={d.id} d={d} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {day}
          </h3>
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden divide-y divide-border/30">
            {items.map((d) => (
              <Row key={d.id} d={d} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({
  d, selectedId, onSelect,
}: {
  d: DocumentRecord;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(d.id)}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-3",
        selectedId === d.id && "bg-primary/5",
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        d.status === "Missing" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
      )}>
        {d.status === "Missing" ? <AlertTriangle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
          <StatusBadge status={d.status} variant={docStatusVariant(d.status)} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {d.linkedRecordLabel} · {d.lastAction}
        </p>
      </div>
      <div className="text-[11px] text-muted-foreground tabular-nums shrink-0 text-right">
        {formatDocDate(d.uploadedAt)}
        {d.fileSize && <div className="text-[10px]">{d.fileSize}</div>}
      </div>
    </button>
  );
}
