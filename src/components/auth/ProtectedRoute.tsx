import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { resolveMfaStatus, clearMfaVerified, type MfaStatus } from "@/lib/mfa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mfa, setMfa] = useState<MfaStatus>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!user) {
      setMfa({ state: "no_session" });
      return;
    }
    setMfa({ state: "loading" });
    resolveMfaStatus(user.id).then((s) => {
      if (cancelled) return;
      setMfa(s);
      if (s.state === "needs_refresh") {
        // 30-day reauth window expired — force re-login.
        clearMfaVerified(user.id);
        toast.info("Please sign in again — your 30-day session has expired.");
        void supabase.auth.signOut();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, location.pathname]);

  if (loading || mfa.state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || mfa.state === "no_session" || mfa.state === "needs_refresh") {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (mfa.state === "needs_enroll") {
    return <Navigate to="/mfa/setup" state={{ from: location }} replace />;
  }

  if (mfa.state === "needs_challenge") {
    return <Navigate to="/mfa/verify" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
