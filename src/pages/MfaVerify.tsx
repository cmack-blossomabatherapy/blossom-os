import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { MfaBrandShell } from "@/components/auth/MfaBrandShell";
import { markMfaVerified } from "@/lib/mfa";

export default function MfaVerify() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const redirectTo = fromState?.pathname
    ? `${fromState.pathname}${fromState.search ?? ""}${fromState.hash ?? ""}`
    : "/";

  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: list } = await supabase.auth.mfa.listFactors();
        const verified = (list?.totp ?? []).find((f) => f.status === "verified");
        if (!verified) {
          if (!cancelled) navigate("/mfa/setup", { replace: true });
          return;
        }
        setFactorId(verified.id);
        const { data: ch, error } = await supabase.auth.mfa.challenge({
          factorId: verified.id,
        });
        if (cancelled) return;
        if (error || !ch) throw error ?? new Error("Could not start challenge");
        setChallengeId(ch.id);
      } catch (e: any) {
        if (!cancelled) setBootError(e?.message ?? "Could not start verification");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, navigate]);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const handleVerify = async () => {
    if (!factorId || !challengeId || code.length !== 6 || !user) return;
    setVerifying(true);
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (error) {
      // The current challenge is now spent — request a fresh one.
      const { data: ch } = await supabase.auth.mfa.challenge({ factorId });
      setChallengeId(ch?.id ?? null);
      setVerifying(false);
      setCode("");
      toast.error(error.message);
      return;
    }
    markMfaVerified(user.id);
    setVerifying(false);
    toast.success("Verified — welcome back.");
    navigate(redirectTo, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <MfaBrandShell
      eyebrow="Two-factor required"
      title="Enter your authenticator code"
      description="Open your authenticator app and enter the 6-digit code for Blossom OS. After verifying, you'll stay signed in on this device for 30 days."
      footer={
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3 w-3" /> Sign in as someone else
        </button>
      }
    >
      {bootError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {bootError}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user?.email}</span>
            </div>
          </div>

          <div className="flex justify-center sm:justify-start">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              autoFocus
              onComplete={() => {
                /* user clicks Verify */
              }}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying || !challengeId}
            className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
          >
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Lost your phone? Ask an admin to reset your two-factor at{" "}
            <a
              href="mailto:hr@blossomabatherapy.com?subject=Reset%20my%20Blossom%202FA"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              hr@blossomabatherapy.com
            </a>
            .
          </p>
        </div>
      )}
    </MfaBrandShell>
  );
}