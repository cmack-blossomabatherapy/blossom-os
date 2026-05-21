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
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
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
      className="relative min-h-screen w-full overflow-hidden bg-[#f8fafc] selection:bg-[#2d8a9e]/20"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      {/* Brand logo anchor — top left */}
      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <div className="rounded-2xl bg-white px-3.5 py-2 shadow-sm ring-1 ring-slate-200">
          <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-7 w-auto object-contain" />
        </div>
      </div>


      <div className="relative flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:p-10">
          <header className="mb-8 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Please enter your details
            </span>
            <h1
              className="mt-2 text-4xl font-semibold tracking-tight text-[#0c2340]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Welcome back
            </h1>
          </header>

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
                className="h-[52px] rounded-xl border-slate-200 bg-slate-50 px-4 text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
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
                  className="h-[52px] rounded-xl border-slate-200 bg-slate-50 px-4 pr-11 text-[#0c2340] placeholder:text-slate-400 focus-visible:border-[#2d8a9e] focus-visible:ring-2 focus-visible:ring-[#2d8a9e]/20 focus-visible:ring-offset-0"
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
                className="h-[52px] w-full rounded-xl bg-[#2d8a9e] text-base font-semibold text-white shadow-lg shadow-[#2d8a9e]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a4a6e] hover:shadow-xl hover:shadow-[#1a4a6e]/25 active:scale-[0.98]"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </div>
          </form>

          <footer className="mt-10 border-t border-slate-100 pt-8 text-center text-xs leading-relaxed text-slate-500">
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
      </div>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} Blossom ABA Therapy
      </div>
    </div>
  );
}