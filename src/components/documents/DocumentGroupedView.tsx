import { Folder, FileText, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  type DocumentRecord, type DocGroup, docGroupOrder, docStatusVariant, formatDocDate,
} from "@/data/documents";

interface Props {
  documents: DocumentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const groupSubtitle: Record<DocGroup, string> = {
  Intake: "Initial Form · Consent Forms · Insurance Cards",
  Authorization: "VOB · Auth Packet · Supporting Docs",
  QA: "Treatment Plan · QA Review",
  Operations: "Case Coordination · Scheduling · Notes",
};

export function DocumentGroupedView({ documents, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-4">
      {docGroupOrder.map((group) => {
        const items = documents.filter((d) => d.group === group);
        if (items.length === 0) return null;
        const missing = items.filter((d) => d.status === "Missing").length;
        return (
          <div key={group} className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Folder className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                    {group}
                    {missing > 0 && (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {missing} missing
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{groupSubtitle[group]}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-background border border-border/60 px-2 py-0.5 rounded-md">
                {items.length}
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 hover:bg-muted/20 transition-colors flex items-center gap-3",
                    selectedId === d.id && "bg-primary/5",
                  )}
                >
                  {d.status === "Missing" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                      <StatusBadge status={d.status} variant={docStatusVariant(d.status)} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {d.linkedRecordLabel} · {d.owner} · {formatDocDate(d.uploadedAt)}
                    </p>
                  </div>
                  {d.blockingStage && (
                    <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded shrink-0">
                      Blocks: {d.blockingStage}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
