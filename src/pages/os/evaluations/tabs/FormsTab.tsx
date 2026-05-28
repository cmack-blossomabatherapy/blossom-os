import { FileText } from "lucide-react";

const TEMPLATES = [
  "BCBA Quarterly Self Evaluation",
  "BCBA Annual Self Evaluation",
  "BCBA Quarterly Leadership Evaluation",
  "BCBA Annual Leadership Evaluation",
  "RBT Quarterly Self Evaluation",
  "RBT Annual Self Evaluation",
  "RBT Quarterly Leadership Evaluation",
  "RBT Annual Leadership Evaluation",
];

export default function FormsTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground">
        Form builder coming in the next pass. The templates below are reserved slots — responses will save directly to staff evaluation records.
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {TEMPLATES.map((name) => (
          <div key={name} className="rounded-2xl border border-border/70 bg-card p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Template not configured yet</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}