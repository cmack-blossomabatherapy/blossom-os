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
 * modal. Used on Intake list pages (Referral Queue, Missing Information,
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{lead.childName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                · {canonicalFamilyLeadStage(lead.status)}
              </span>
            </DialogTitle>
          </DialogHeader>
          <LeadActionPanel
            lead={lead}
            sourcePage={sourcePage}
            onAfterAction={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}