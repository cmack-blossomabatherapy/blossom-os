import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { resolveClientByCentralReachId } from "@/lib/os/reporting/canonicalClientResolver";

/**
 * `/clients/cr/:crId` — resolves a CentralReach client id to the canonical
 * internal client UUID and forwards to `/clients/:uuid` so every downstream
 * hook, tab, and deep-link keeps working unchanged.
 */
export default function CrClientRedirect() {
  const { crId } = useParams<{ crId: string }>();
  const [target, setTarget] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    resolveClientByCentralReachId(crId).then((uuid) => {
      if (!cancelled) setTarget(uuid);
    });
    return () => {
      cancelled = true;
    };
  }, [crId]);

  if (target === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Resolving client…
      </div>
    );
  }
  if (!target) {
    return <Navigate to="/clients" replace />;
  }
  return <Navigate to={`/clients/${target}`} replace />;
}