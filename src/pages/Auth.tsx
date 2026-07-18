import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, KeyRound, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import logoWhite from "@/assets/blossom-logo-light.webp";
import logoColor from "@/assets/blossom-logo-color.png";
import flowerMark from "@/assets/blossom-flower-mark.png";
import { Checkbox } from "@/components/ui/checkbox";
import { setRememberPreference, getRememberPreference } from "@/lib/rememberSession";
import { RequestAccessDialog } from "@/components/auth/RequestAccessDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const CANONICAL_LOGIN_HOST = "blossom.abacommandcenter.com";
const LOVABLE_PUBLISHED_HOST = "blossom-os.lovable.app";

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";
  const isWelcome = searchParams.get("welcome") === "1";
  const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  // Only resume the prior path for canonical work surfaces; otherwise land on the Company Home.
  const RESUME_PREFIXES = ["/reports", "/work-queue", "/clients", "/scheduling", "/intake"];
  const shouldResume =
    !!fromState?.pathname && RESUME_PREFIXES.some((p) => fromState!.pathname!.startsWith(p));
  const redirectTo = shouldResume
    ? `${fromState!.pathname}${fromState!.search ?? ""}${fromState!.hash ?? ""}`
    : "/home";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState<boolean>(() => getRememberPreference());
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [method, setMethod] = useState<"password" | "code">("password");
  const [codeEmail, setCodeEmail] = useState(prefillEmail);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeVerifying, setCodeVerifying] = useState(false);

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = codeEmail.trim().toLowerCase();
    if (!trimmed) return;
    setCodeBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    });
    setCodeBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCodeSent(true);
    toast.success("We just emailed you a 6-digit sign-in code");
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) return;
    setCodeVerifying(true);
    setRememberPreference(remember);
    const { error } = await supabase.auth.verifyOtp({
      email: codeEmail.trim().toLowerCase(),
      token: code,
      type: "email",
    });
    setCodeVerifying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = forgotEmail.trim();
    if (!trimmed) return;
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForgotSent(true);
    toast.success("Password reset link sent");
  };

  useEffect(() => {
    if (window.location.hostname !== LOVABLE_PUBLISHED_HOST) return;
    window.location.replace(
      `https://${CANONICAL_LOGIN_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }, []);

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-[#2d8a9e]" />
      </div>
    );
  }
  if (user) return <Navigate to={redirectTo} replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRememberPreference(remember);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) toast.error(error);
    else toast.success("Welcome back");
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#f6f8fb] selection:bg-[#2d8a9e]/20"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      <div className="relative grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-[#0c2340] via-[#143a5c] to-[#1a4a6e] p-12 text-white">
          {/* decorative blobs */}
          <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#2d8a9e]/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <img
            aria-hidden
            src={flowerMark}
            alt=""
            className="pointer-events-none absolute -right-20 -bottom-16 h-[420px] w-[420px] opacity-[0.08] select-none"
          />

          <div className="relative z-10 flex items-center">
            <img
              src={logoWhite}
              alt="Blossom ABA Therapy"
              className="h-14 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
            />
          </div>

          <div className="relative z-10 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Blossom Command Center
            </span>
            <h2 className="mt-5 text-[40px] font-semibold leading-[1.1] tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              One calm place to run your ABA operations.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              Intake, scheduling, authorizations, training, and team intelligence — all in one branded workspace built for Blossom.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/85">
              {[
                "Sign in with your password or a one-time email code",
                "HIPAA-aware, role-based access for every team",
                "Live operational intelligence across every state",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 text-xs text-white/60">
            © {new Date().getFullYear()} Blossom ABA Therapy · Secure team sign-in
          </div>
        </aside>

        {/* Form panel */}
        <main className="relative flex min-h-screen w-full items-start justify-center p-4 py-6 sm:items-center sm:p-10">
          <div className="w-full max-w-[460px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-300/30 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:rounded-3xl sm:p-10 sm:shadow-2xl">
            {/* mobile logo inside card */}
            <div className="mb-6 flex justify-center lg:hidden">
              <img
                src={logoColor}
                alt="Blossom ABA Therapy"
                className="h-12 w-auto object-contain"
              />
            </div>
          <header className="mb-6 text-center sm:mb-8 sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isWelcome ? "Activate your account" : "Please enter your details"}
            </span>
            <h1
              className="mt-2 text-3xl font-semibold tracking-tight text-[#0c2340] sm:text-4xl"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {isWelcome ? "Welcome to Blossom" : "Welcome back"}
            </h1>
            {isWelcome && (
              <p className="mt-3 rounded-xl bg-[#2d8a9e]/10 px-4 py-3 text-sm leading-relaxed text-[#0c2340]">
                Sign in with the <strong>temporary password</strong> from your welcome email.
                You'll be prompted to create your own password right after.
              </p>
            )}
          </header>

          <Tabs value={method} onValueChange={(v) => setMethod(v as "password" | "code")} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 sm:mb-6">
              <TabsTrigger value="password" className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0c2340] data-[state=active]:shadow-sm">
                <KeyRound className="h-3.5 w-3.5" /> Password
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0c2340] data-[state=active]:shadow-sm">
                <Mail className="h-3.5 w-3.5" /> Email code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="ml-1 text-sm font-medium text-slate-700">
                Email address
              </Label>
              <Input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@blossomabatherapy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[52px] rounded-xl border-slate-200 bg-slate-50 px-4 text-base text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password" className="ml-1 text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[52px] rounded-xl border-slate-200 bg-slate-50 px-4 pr-11 text-base text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2d8a9e]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label htmlFor="signin-remember" className="group flex cursor-pointer items-center gap-2 text-slate-600">
                <Checkbox
                  id="signin-remember"
                  checked={remember}
                  onCheckedChange={(value) => setRemember(value === true)}
                  className="border-slate-300 data-[state=checked]:border-[#2d8a9e] data-[state=checked]:bg-[#2d8a9e]"
                />
                <span className="transition-colors group-hover:text-[#0c2340]">Keep me signed in</span>
              </label>
              <Dialog
                open={forgotOpen}
                onOpenChange={(o) => { setForgotOpen(o); if (!o) { setForgotSent(false); setForgotEmail(email); } }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setForgotSent(false); }}
                    className="font-medium text-[#2d8a9e] transition-colors hover:text-[#1a4a6e]"
                  >
                    Forgot password?
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2d8a9e]/10 text-[#2d8a9e]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <DialogTitle>Reset your password</DialogTitle>
                    <DialogDescription>
                      {forgotSent
                        ? "If an account exists for that email, a branded reset link is on its way. Check your inbox (and spam folder)."
                        : "Enter the email tied to your Blossom account and we'll send a secure reset link."}
                    </DialogDescription>
                  </DialogHeader>
                  {!forgotSent && (
                    <form onSubmit={handleForgot} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="forgot-email" className="text-xs font-medium text-foreground/80">Email</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@blossomabatherapy.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="h-11 rounded-xl bg-background"
                        />
                      </div>
                      <DialogFooter className="gap-2 sm:gap-2">
                        <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button type="submit" className="rounded-xl" disabled={forgotBusy}>
                          {forgotBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send reset link
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                  {forgotSent && (
                    <DialogFooter>
                      <Button onClick={() => setForgotOpen(false)} className="rounded-xl w-full sm:w-auto">Done</Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="h-[52px] w-full rounded-xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/20 transition-all duration-300 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#2d8a9e]/70 disabled:text-white disabled:shadow-none sm:hover:-translate-y-0.5"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </div>
              </form>
            </TabsContent>

            <TabsContent value="code" className="mt-0">
              {!codeSent ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="rounded-xl bg-[#2d8a9e]/8 border border-[#2d8a9e]/15 px-3 py-2 text-xs leading-relaxed text-[#0c2340] sm:px-4 sm:py-3">
                    No password needed. Enter your work email and we'll send you a 6-digit sign-in code.
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp-email" className="ml-1 text-sm font-medium text-slate-700">
                      Email address
                    </Label>
                    <Input
                      id="otp-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@blossomabatherapy.com"
                      value={codeEmail}
                      onChange={(e) => setCodeEmail(e.target.value)}
                      className="h-[52px] rounded-xl border-slate-200 bg-slate-50 px-4 text-base text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={codeBusy}
                    className="h-[52px] w-full rounded-xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/20 transition-all duration-300 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#2d8a9e]/70 disabled:text-white disabled:shadow-none sm:hover:-translate-y-0.5"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {codeBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Email me a sign-in code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="rounded-xl bg-[#2d8a9e]/8 border border-[#2d8a9e]/15 px-3 py-2 text-xs leading-relaxed text-[#0c2340] sm:px-4 sm:py-3">
                    We sent a 6-digit code to <strong>{codeEmail}</strong>. It expires in 10 minutes.
                  </div>
                  <div className="space-y-2">
                    <Label className="ml-1 text-sm font-medium text-slate-700">Enter the code</Label>
                    <div className="flex w-full justify-center overflow-x-auto py-2 [&_[data-slot=input-otp-slot]]:h-11 [&_[data-slot=input-otp-slot]]:w-10 [&_[data-slot=input-otp-slot]]:text-[#0c2340] sm:[&_[data-slot=input-otp-slot]]:h-12 sm:[&_[data-slot=input-otp-slot]]:w-12">
                      <InputOTP maxLength={6} value={code} onChange={setCode} containerClassName="gap-1.5 sm:gap-2">
                        <InputOTPGroup className="gap-1.5 sm:gap-2">
                          {[0,1,2,3,4,5].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={codeVerifying || code.length !== 6}
                    className="h-[52px] w-full rounded-xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/20 transition-all duration-300 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#2d8a9e]/70 disabled:text-white disabled:shadow-none sm:hover:-translate-y-0.5"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {codeVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & sign in
                  </Button>
                  <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => { setCodeSent(false); setCode(""); }}
                      className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-[#0c2340]"
                    >
                      <ArrowLeft className="h-3 w-3" /> Use a different email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendCode()}
                      disabled={codeBusy}
                      className="font-medium text-[#2d8a9e] hover:text-[#1a4a6e] disabled:opacity-60"
                    >
                      {codeBusy ? "Resending…" : "Resend code"}
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <footer className="mt-6 border-t border-slate-100 pt-5 text-center text-xs leading-relaxed text-slate-500 sm:mt-10 sm:pt-8">
            Team accounts are created by your administrator.{" "}
            <RequestAccessDialog />{" "}
            or email{" "}
            <a
              href="mailto:hr@blossomabatherapy.com?subject=Blossom%20Academy%20account%20access"
              className="font-medium text-[#2d8a9e] underline-offset-2 hover:underline"
            >
              hr@blossomabatherapy.com
            </a>
          </footer>
          </div>
        </main>
      </div>

    </div>
  );
}