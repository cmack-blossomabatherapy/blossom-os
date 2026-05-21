import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Quote, Sparkles, TrendingUp, Zap } from "lucide-react";
import logoWordmark from "@/assets/blossom-logo-wordmark.png";
import { Checkbox } from "@/components/ui/checkbox";
import { setRememberPreference, getRememberPreference } from "@/lib/rememberSession";
import { RequestAccessDialog } from "@/components/auth/RequestAccessDialog";

const CANONICAL_LOGIN_HOST = "blossom.abacommandcenter.com";
const LOVABLE_PUBLISHED_HOST = "blossom-os.lovable.app";

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const redirectTo = fromState?.pathname
    ? `${fromState.pathname}${fromState.search ?? ""}${fromState.hash ?? ""}`
    : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState<boolean>(() => getRememberPreference());
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0c2340]">
        <Loader2 className="h-6 w-6 animate-spin text-[#5cbdb9]" />
      </div>
    );
  }
  if (user) return <Navigate to={redirectTo} replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Apply the persistence preference BEFORE the auth call so the
    // sessionStorage marker is in place when onAuthStateChange fires.
    setRememberPreference(remember);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) toast.error(error);
    else toast.success("Welcome back");
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#0c2340] selection:bg-[#5cbdb9]/30"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      {/* Ambient aurora background */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#2d8a9e]/25 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-[#5cbdb9]/15 blur-[160px]" />

      <div className="relative flex min-h-screen w-full items-center justify-center p-5 sm:p-8 md:p-12">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">

          {/* Left column — desktop only */}
          <div className="hidden lg:col-span-1 lg:flex lg:flex-col lg:gap-4">
            {/* Logo tile */}
            <div className="flex aspect-square items-center justify-center rounded-3xl border border-[#1a4a6e]/60 bg-[#1a4a6e]/30 p-6 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:bg-[#1a4a6e]/45">
              <div className="rounded-2xl bg-white px-4 py-2 shadow-lg ring-1 ring-white/20">
                <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-8 w-auto object-contain" />
              </div>
            </div>

            {/* Quote tile */}
            <div className="flex flex-1 flex-col justify-end rounded-3xl border border-[#1a4a6e]/60 bg-[#1a4a6e]/30 p-6 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:bg-[#1a4a6e]/45">
              <Quote className="mb-4 h-6 w-6 text-[#5cbdb9]/60" />
              <p
                className="text-sm italic leading-relaxed text-white/85"
                style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
              >
                "The best operations tool I've used in 15 years of ABA. It just works."
              </p>
              <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5cbdb9]">
                Clinical Director · Austin
              </span>
            </div>
          </div>

          {/* Main auth card */}
          <div className="rounded-[2.25rem] bg-white p-7 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-bottom-4 duration-700 md:col-span-3 md:p-10 lg:col-span-3">
            <div className="mx-auto flex w-full max-w-sm flex-col">
              {/* Mobile logo */}
              <div className="mb-7 flex justify-center lg:hidden">
                <div className="rounded-2xl bg-[#f6fafd] px-4 py-2 ring-1 ring-[#1a4a6e]/10">
                  <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-8 w-auto object-contain" />
                </div>
              </div>

              <header className="mb-9 text-center lg:text-left">
                <h1
                  className="text-3xl font-semibold tracking-tight text-[#0c2340]"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Welcome back
                </h1>
                <p className="mt-2 text-sm text-[#1a4a6e]/70">
                  Sign in with your Blossom team account.
                </p>
              </header>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="signin-email"
                    className="ml-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0c2340]"
                  >
                    Email address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@blossomabatherapy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <Label
                      htmlFor="signin-password"
                      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0c2340]"
                    >
                      Password
                    </Label>
                    <Dialog
                      open={forgotOpen}
                      onOpenChange={(o) => { setForgotOpen(o); if (!o) { setForgotSent(false); setForgotEmail(email); } }}
                    >
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          onClick={() => { setForgotEmail(email); setForgotSent(false); }}
                          className="text-[11px] font-medium text-[#2d8a9e] transition-colors hover:text-[#1a4a6e]"
                        >
                          Forgot?
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
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-11 text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
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

                <div className="flex items-center gap-2 px-1 pt-1">
                  <Checkbox
                    id="signin-remember"
                    checked={remember}
                    onCheckedChange={(value) => setRemember(value === true)}
                    className="border-slate-300 data-[state=checked]:border-[#2d8a9e] data-[state=checked]:bg-[#2d8a9e]"
                  />
                  <label htmlFor="signin-remember" className="cursor-pointer select-none text-sm text-[#1a4a6e]/75">
                    Keep me signed in
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-14 w-full rounded-2xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/30 active:scale-[0.98]"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in to Blossom OS
                </Button>
              </form>

              <footer className="mt-9 text-center text-xs leading-relaxed text-[#1a4a6e]/60">
                Team accounts are created by your administrator —{" "}
                <RequestAccessDialog />{" "}
                or email{" "}
                <a
                  href="mailto:hr@blossomabatherapy.com?subject=Blossom%20Academy%20account%20access"
                  className="font-medium text-[#2d8a9e] underline-offset-2 hover:underline"
                >
                  hr@blossomabatherapy.com
                </a>
                .
              </footer>
            </div>
          </div>

          {/* Right column tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-1 md:grid-cols-1 lg:col-span-2">
            {/* Stats tile */}
            <div className="flex flex-col justify-between rounded-3xl bg-[#2d8a9e] p-6 text-white shadow-xl shadow-[#2d8a9e]/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#2d8a9e]/25">
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h4
                  className="text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  12 regions
                </h4>
                <p className="mt-1 text-sm text-white/85">
                  Supporting 380+ clinicians nationwide.
                </p>
              </div>
            </div>

            {/* What's new tile */}
            <div className="flex flex-col gap-3 rounded-3xl border border-[#1a4a6e]/60 bg-[#1a4a6e]/30 p-6 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:bg-[#1a4a6e]/45">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#5cbdb9]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5cbdb9]">
                <Sparkles className="h-3 w-3" /> What's new
              </span>
              <p className="text-sm font-medium leading-relaxed text-white">
                Telehealth scheduling and VOB Decision Center are now live for every region.
              </p>
              <div className="mt-auto flex -space-x-2 pt-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0c2340] bg-[#5cbdb9] text-[9px] font-bold text-[#0c2340]">B</div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0c2340] bg-[#2d8a9e] text-[9px] font-bold text-white">A</div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0c2340] bg-white/90 text-[9px] font-bold text-[#0c2340]">+3</div>
              </div>
            </div>

            {/* Aurora glyph tile */}
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a4a6e] to-[#2d8a9e] p-6 transition-all duration-500 hover:scale-[1.02] sm:aspect-auto md:aspect-square">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(178_44%_55%/0.45),transparent_60%)]" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#5cbdb9]/30 blur-3xl" />
              <div className="relative flex h-full flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">
                  <Zap className="h-6 w-6 text-[#5cbdb9]" />
                </div>
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Blossom OS · v2.6
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[11px] text-white/40">
        © {new Date().getFullYear()} Blossom ABA Therapy
      </div>
    </div>
  );
}
