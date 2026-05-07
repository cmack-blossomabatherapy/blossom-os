import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Lock, Compass, ArrowRight } from "lucide-react";
import { useAcademyComplete } from "@/hooks/useAcademyComplete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logAcademyEvent } from "@/lib/academy/audit";

/**
 * Gates a route behind Operations Academy completion.
 * Admins / training & HR roles bypass automatically (handled inside the hook).
 */
export function AcademyGate({ children }: { children: ReactNode }) {
  const { loading, complete, bypass } = useAcademyComplete();
  useEffect(() => {
    if (loading) return;
    void logAcademyEvent({
      event_type: complete ? "gate_unlocked" : "gate_blocked",
      complete,
      bypass,
    });
  }, [loading, complete, bypass]);
  if (loading) return null;
  if (complete) return <>{children}</>;
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-6">
      <Card className="w-full overflow-hidden border-border/60">
        <div className="bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--primary)/0.04))] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Blossom Training is locked</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Finish your <span className="font-semibold text-foreground">Operations Academy</span> curriculum to unlock the full Blossom Training catalog.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 border-t border-border/60 bg-card p-6">
          <Button asChild size="lg" className="gap-2">
            <Link to="/training/academy">
              <Compass className="h-4 w-4" /> Continue Operations Academy <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Once every required module is completed, this page will unlock automatically.</p>
        </div>
      </Card>
    </div>
  );
}