import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, Copy, Check, LogOut } from "lucide-react";
import { MfaBrandShell } from "@/components/auth/MfaBrandShell";
import { markMfaVerified, unenrollAllTotp } from "@/lib/mfa";

export default function MfaSetup() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const redirectTo = fromState?.pathname
    ? `${fromState.pathname}${fromState.search ?? ""}${fromState.hash ?? ""}`
    : "/";

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        // Clear any unverified factors from prior attempts so enroll succeeds.
        const { data: list } = await supabase.auth.mfa.listFactors();
        const pending = (list?.totp ?? []).filter((f) => f.status !== "verified");
        await Promise.all(
          pending.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
        );

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Blossom OS · ${new Date().toLocaleDateString()}`,
        });
        if (cancelled) return;
        if (error) throw error;
        setFactorId(data.id);
        setQrSvg(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e: any) {
        if (cancelled) return;
        setBootError(e?.message ?? "Could not start authenticator setup.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const handleCopy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleVerify = async () => {
    if (!factorId || code.length !== 6 || !user) return;
    setVerifying(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !ch) {
      setVerifying(false);
      toast.error(chErr?.message ?? "Could not start verification");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code,
    });
    setVerifying(false);
    if (error) {
      toast.error(error.message);
      setCode("");
      return;
    }
    markMfaVerified(user.id);
    toast.success("Two-factor enabled — you're all set.");
    navigate(redirectTo, { replace: true });
  };

  const handleSignOut = async () => {
    if (factorId) {
      try {
        await unenrollAllTotp();
      } catch {
        /* no-op */
      }
    }
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <MfaBrandShell
      eyebrow="Set up two-factor"
      title="Add an authenticator app"
      description="Open Google Authenticator, Authy, or 1Password and scan the QR code below. Then enter the 6-digit code your app shows to finish."
      footer={
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3 w-3" /> Sign out and start over
        </button>
      }
    >
      {bootError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {bootError}
        </div>
      ) : !qrSvg ? (
        <div className="flex h-56 items-center justify-center rounded-2xl border border-border/60 bg-card">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-xl bg-white p-2 ring-1 ring-slate-200">
                <img
                  src={qrSvg}
                  alt="Authenticator QR code"
                  className="h-full w-full"
                />
              </div>
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Can't scan?
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter this setup key manually in your authenticator app.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2">
                  <code className="flex-1 select-all break-all text-left font-mono text-xs text-foreground">
                    {secret}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Copy setup key"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-medium text-foreground/80">
              Enter the 6-digit code from your app
            </div>
            <div className="flex justify-center sm:justify-start">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
            className="h-[52px] w-full rounded-xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/25 active:scale-[0.98]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & finish setup
          </Button>
        </div>
      )}
    </MfaBrandShell>
  );
}