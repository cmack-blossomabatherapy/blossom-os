import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import logoWordmark from "@/assets/blossom-logo-wordmark.png";
import { Checkbox } from "@/components/ui/checkbox";
import { setRememberPreference, getRememberPreference } from "@/lib/rememberSession";

const CANONICAL_LOGIN_HOST = "blossom.abacommandcenter.com";
const LOVABLE_PUBLISHED_HOST = "blossom-os.lovable.app";

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState<boolean>(() => getRememberPreference());

  useEffect(() => {
    if (window.location.hostname !== LOVABLE_PUBLISHED_HOST) return;

    window.location.replace(
      `https://${CANONICAL_LOGIN_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

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
    <div className="relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Ambient brand background (mobile + behind brand panel) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] opacity-[0.06] lg:hidden" />

      {/* Brand panel — desktop */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-primary-foreground lg:flex bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />

        <div className="relative flex items-center">
          <div className="rounded-2xl bg-primary-foreground px-5 py-3 shadow-lg ring-1 ring-primary-foreground/30">
            <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <div className="relative max-w-md space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Blossom Academy
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Where the Blossom team grows together.
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/85">
            Sign in to access onboarding, training, and the tools that power exceptional care for the families we serve.
          </p>
          <ul className="space-y-2 pt-2 text-sm text-primary-foreground/85">
            {[
              "Personalized learning journeys",
              "Live operations & scheduling",
              "Premium HR & training experience",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Blossom ABA Therapy
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:py-16">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border">
              <img src={logoWordmark} alt="Blossom ABA Therapy" className="h-9 w-auto object-contain" />
            </div>
          </div>

          <div className="mb-8 space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sign in with your Blossom team account to continue.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email" className="text-xs font-medium text-foreground/80">
                Email
              </Label>
              <Input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@blossomabatherapy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signin-password" className="text-xs font-medium text-foreground/80">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-background pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Need an account? Team accounts are created by your administrator.
              Contact your Blossom admin to get access.
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground lg:hidden">
            © {new Date().getFullYear()} Blossom ABA Therapy
          </p>
        </div>
      </div>
    </div>
  );
}
