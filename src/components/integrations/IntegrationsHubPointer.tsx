import { Link } from "react-router-dom";
import { PlugZap, ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Consolidated pointer to the single source of truth for integration
 * status/health: Admin → Integrations. Rendered anywhere a department
 * page previously hosted its own integration readiness widget so users
 * see identical language and only one home for connection state.
 */
export function IntegrationsHubPointer({
  scope,
  description,
}: {
  scope?: string;
  description?: string;
}) {
  const { isAdmin } = useAuth();
  const label = scope ? `${scope} integrations` : "Integrations";
  const help =
    description ??
    "Connection status, sync health, and readiness for every source system live in one place under Admin → Integrations.";

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <PlugZap className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{label}</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Managed in Admin
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{help}</p>
          <div className="mt-3">
            {isAdmin ? (
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link to="/admin/integrations">
                  Open Admin → Integrations <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Ask an admin to connect or reconnect a source system.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default IntegrationsHubPointer;