import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, KeyRound, Sparkles, CheckCircle2 } from "lucide-react";
import logoWordmark from "@/assets/blossom-logo-wordmark.png";

/**
 * Public branded password-reset page reached via the recovery email link.
 * Supabase places a `type=recovery` token in the URL hash on arrival; the
 * SDK consumes it automatically and emits a PASSWORD_RECOVERY auth event.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const isRecoveryHash = useMemo(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hash || "";
    return h.includes("type=recovery") || h.includes("access_token=");
  }, []);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when it parses the hash on this page.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && isRecoveryHash)) {
        setValidLink(true);
        setReady(true);
      }
    });
    // Also resolve once if a session is already established (e.g. user came back).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isRecoveryHash) setValidLink(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [isRecoveryHash]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (pw !== pw2) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (!error) {
      // Clear the must_change flag if it was set on this account.
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user.id);
      }
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Password updated");
    setTimeout(() => navigate("/", { replace: true }), 1200);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] opacity-[0.06] lg:hidden" />

      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative flex items-center">
          <div className="rounded-2xl bg-primary-foreground px-5 py-3 shadow-lg ring-1 ring-primary-foreground/30">
            <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-10 w-auto object-contain" />
          </div>
        </div>
        <div className="relative max-w-md space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Account security
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Set a new password</h2>
          <p className="text-base leading-relaxed text-primary-foreground/85">
            Choose something memorable but strong. You'll be signed in to Blossom Academy as soon as your new password is saved.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/70">© {new Date().getFullYear()} Blossom ABA Therapy</div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:py-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border">
              <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-9 w-auto object-contain" />
            </div>
          </div>

          <div className="mb-8 space-y-2 text-center lg:text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reset your password</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {done
                ? "All set — taking you to Blossom now…"
                : validLink
                  ? "Enter a new password for your Blossom account."
                  : ready
                    ? "This reset link is invalid or has expired. Request a new one from the sign-in page."
                    : "Verifying your reset link…"}
            </p>
          </div>

          {!ready ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-sm font-medium text-foreground">Password updated successfully</p>
            </div>
          ) : validLink ? (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="reset-pw" className="text-xs font-medium text-foreground/80">New password</Label>
                <div className="relative">
                  <Input
                    id="reset-pw"
                    type={show ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="h-12 rounded-xl bg-background pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-pw2" className="text-xs font-medium text-foreground/80">Confirm new password</Label>
                <Input
                  id="reset-pw2"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Re-enter new password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="h-12 rounded-xl bg-background"
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
                disabled={busy}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Link to="/auth" className="inline-flex w-full">
                <Button variant="outline" className="h-12 w-full rounded-xl">Back to sign in</Button>
              </Link>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary underline-offset-2 hover:underline">Return to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
