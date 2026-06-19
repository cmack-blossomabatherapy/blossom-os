import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, LogOut, ShieldCheck, Fingerprint, Mail, Smartphone } from "lucide-react";
import { MfaBrandShell } from "@/components/auth/MfaBrandShell";
import { markMfaVerified } from "@/lib/mfa";
import { isPasskeyAvailable, verifyWithPasskey } from "@/lib/security/passkey";
import { cn } from "@/lib/utils";

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
  const [passkeyCredId, setPasskeyCredId] = useState<string | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const passkeySupported = isPasskeyAvailable();
  const [emailMfaEnrolled, setEmailMfaEnrolled] = useState(false);
  const [emailMfaTarget, setEmailMfaTarget] = useState<string | null>(null);
  const [method, setMethod] = useState<"app" | "email">("app");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: list } = await supabase.auth.mfa.listFactors();
        const verified = (list?.totp ?? []).find((f) => f.status === "verified");
        // Check email enrollment as fallback / alternative.
        const { data: emailRow } = await supabase
          .from("user_email_mfa")
          .select("email")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) {
          // Always allow email-code fallback. Prefer the enrolled email, otherwise
          // fall back to the user's account email so admins who can't access their
          // authenticator app can still get in.
          setEmailMfaEnrolled(true);
          setEmailMfaTarget(emailRow?.email ?? user.email ?? null);
        }
        if (!verified) {
          if (emailRow) {
            if (!cancelled) setMethod("email");
            return;
          }
          // No TOTP and no email enrollment — let them use email-to-account-email.
          if (!cancelled) setMethod("email");
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
      // Load any registered security key for this user (optional fallback)
      try {
        const { data: pin } = await supabase
          .from("employee_pin_settings")
          .select("passkey_credential_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && pin?.passkey_credential_id) {
          setPasskeyCredId(pin.passkey_credential_id);
        }
      } catch {
        /* no-op */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, navigate]);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const handleSendEmail = async () => {
    setEmailSending(true);
    const { data, error } = await supabase.functions.invoke("email-mfa", {
      body: { action: "send" },
    });
    setEmailSending(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.message ?? error?.message ?? "Could not send code.");
      return;
    }
    setEmailSent(true);
    toast.success(`Code sent to ${emailMfaTarget ?? user?.email}`);
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !user) return;
    if (method === "email") {
      setVerifying(true);
      const { data, error } = await supabase.functions.invoke("email-mfa", {
        body: { action: "verify", code },
      });
      setVerifying(false);
      if (error || (data as any)?.error) {
        toast.error((data as any)?.message ?? error?.message ?? "Invalid code");
        setCode("");
        return;
      }
      markMfaVerified(user.id);
      toast.success("Verified — welcome back.");
      navigate(redirectTo, { replace: true });
      return;
    }
    if (!factorId || !challengeId) return;
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

  const handlePasskey = async () => {
    if (!user || !passkeyCredId) return;
    setPasskeyBusy(true);
    const result = await verifyWithPasskey(passkeyCredId);
    setPasskeyBusy(false);
    if (result.ok !== true) {
      if (result.reason === "cancelled") return;
      if (result.reason === "notSupported") {
        toast.error("Security keys aren't supported on this device.");
        return;
      }
      toast.error(result.message ?? "Couldn't verify security key.");
      return;
    }
    markMfaVerified(user.id);
    toast.success("Verified with security key — welcome back.");
    navigate(redirectTo, { replace: true });
  };

  return (
    <MfaBrandShell
      eyebrow="Two-factor required"
      title="Enter your authenticator code"
      description="Open your authenticator app and enter the 6-digit code for Blossom OS."
      footer={
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
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
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) handleVerify();
          }}
        >
          {(factorId && emailMfaEnrolled) && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {([
                { id: "app", label: "Authenticator", icon: Smartphone },
                { id: "email", label: "Email code", icon: Mail },
              ] as const).map((opt) => {
                const Icon = opt.icon;
                const selected = method === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setMethod(opt.id); setCode(""); }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                      selected ? "bg-white text-[#0c2340] shadow-sm" : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2d8a9e]/10 text-[#2d8a9e]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs text-slate-500">
              Signed in as <span className="font-medium text-[#0c2340]">{user?.email}</span>
            </div>
          </div>

          {method === "email" && (
            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={emailSending}
              variant="outline"
              className="w-full rounded-xl"
            >
              {emailSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {emailSent ? `Resend code to ${emailMfaTarget ?? user?.email}` : `Send code to ${emailMfaTarget ?? user?.email}`}
            </Button>
          )}

          <div className="flex justify-center py-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              autoFocus
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            disabled={code.length !== 6 || verifying || (method === "app" && !challengeId) || (method === "email" && !emailSent)}
            className="h-[52px] w-full rounded-xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/25 active:scale-[0.98]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          {method === "app" && passkeyCredId && passkeySupported && (
            <div className="space-y-3">
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  or
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasskey}
                disabled={passkeyBusy}
                className="h-[52px] w-full rounded-xl border-slate-200 text-base font-semibold text-[#0c2340] hover:bg-slate-50"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {passkeyBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="mr-2 h-4 w-4 text-[#2d8a9e]" />
                )}
                Use a security key instead
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-slate-500">
            Lost your phone? Ask an admin to reset your two-factor at{" "}
            <a
              href="mailto:hr@blossomabatherapy.com?subject=Reset%20my%20Blossom%202FA"
              className="font-medium text-[#2d8a9e] underline-offset-2 hover:underline"
            >
              hr@blossomabatherapy.com
            </a>
            .
          </p>
        </form>
      )}
    </MfaBrandShell>
  );
}