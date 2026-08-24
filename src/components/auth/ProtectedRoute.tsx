import { ReactNode, useEffect, useRef, useState } from "react";
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
  // Which user id the current `mfa` value was resolved for. Used to decide
  // whether a re-check should be silent (same user) or blocking (new user).
  const resolvedForRef = useRef<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    if (!userId) {
      resolvedForRef.current = null;
      setMfa({ state: "no_session" });
      return;
    }
    // Supabase rotates the access token whenever the tab regains focus
    // (TOKEN_REFRESHED), which produces a new `user` object for the SAME user.
    // Re-entering the loading state here would unmount the whole page tree and
    // wipe in-page state (report filters, scroll position). So only show the
    // blocking spinner the first time we resolve MFA for a given user id;
    // afterwards revalidate quietly and keep rendering the page.
    if (resolvedForRef.current !== userId) setMfa({ state: "loading" });
    resolveMfaStatus(userId).then((s) => {
      if (cancelled) return;
      resolvedForRef.current = userId;
      setMfa(s);
      if (s.state === "needs_refresh") {
        // 30-day reauth window expired — force re-login.
        clearMfaVerified(userId);
        toast.info("Please sign in again — your 30-day session has expired.");
        void supabase.auth.signOut();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loading, userId, location.pathname]);

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
