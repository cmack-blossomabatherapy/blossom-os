import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EvaluationsData } from "../useEvaluationsData";
import type { EvalForm, FormSection } from "../types";

export default function FormsTab({ data }: { data: EvaluationsData }) {
  const [preview, setPreview] = useState<EvalForm | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Eight standardized templates power every self and leadership evaluation. Sections are scored on a 1–5 scale with open-ended questions and an acknowledgment.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {data.forms.map((f) => {
          const sectionCount = f.questions_json?.sections?.length ?? 0;
          return (
            <div key={f.id} className="rounded-2xl border border-border/70 bg-card p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {f.staff_role} · {f.evaluation_type} · {f.form_type} · {sectionCount} sections
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreview(f)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Preview
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {preview?.questions_json?.sections?.map((s: FormSection, i: number) => (
              <div key={i} className="rounded-xl border p-3">
                <p className="text-sm font-semibold">{s.title}</p>
                {s.type === "ratings" && (
                  <>
                    <p className="text-[11px] text-muted-foreground mt-1">{(s as Extract<FormSection,{type:"ratings"}>).description}</p>
                    <ul className="text-xs mt-2 list-disc pl-5 space-y-0.5">
                      {(s as Extract<FormSection,{type:"ratings"}>).items.map((q) => <li key={q}>{q}</li>)}
                    </ul>
                  </>
                )}
                {s.type === "longtext" && (
                  <ul className="text-xs mt-2 list-disc pl-5 space-y-0.5">
                    {(s as Extract<FormSection,{type:"longtext"}>).items.map((q) => <li key={q}>{q}</li>)}
                  </ul>
                )}
                {s.type === "acknowledgment" && (
                  <p className="text-xs text-muted-foreground mt-1">Checkbox + typed signature + date.</p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}