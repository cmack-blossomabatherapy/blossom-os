import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { canonicalFamilyLeadStage } from "@/lib/intake/intakeWorkflow";
import type { Lead } from "@/data/leads";
import { cn } from "@/lib/utils";

/**
 * Compact "Actions" trigger that opens the full LeadActionPanel inside a
 * modal. Used on Intake list pages (Intake Dashboard, Missing Information,
 * etc.) so cards stay clean while still exposing the full action surface.
 */
export function LeadActionsButton({
  lead,
  sourcePage,
  className,
}: {
  lead: Lead;
  sourcePage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={cn("h-8 w-full rounded-lg text-xs font-medium", className)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        Actions
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-0">
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/[0.06] via-background to-background px-6 py-4">
            <DialogHeader className="space-y-1">
              <DialogTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg">
                <span className="font-semibold">{lead.childName}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
                  {canonicalFamilyLeadStage(lead.status)}
                </span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Pick an action — every one is explained so you always know what it will do.
              </p>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <LeadActionPanel
              lead={lead}
              sourcePage={sourcePage}
              onAfterAction={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}