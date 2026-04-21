import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logoBrand from "@/assets/blossom-logo.png";

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) toast.error(error);
    else toast.success("Welcome back");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden"
        style={{ backgroundColor: "hsl(188 45% 45%)" }}>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex items-center gap-3 text-white">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
          </div>
          <span className="font-semibold tracking-tight">Blossom Operations</span>
        </div>

        <div className="relative flex flex-col items-center text-center text-white max-w-md mx-auto">
          <img src={logoBrand} alt="Blossom ABA Therapy" className="w-60 h-60 object-contain drop-shadow-xl rounded-3xl" />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Helping families bloom.</h2>
          <p className="mt-2 text-white/80 text-sm leading-relaxed">
            The operations hub for intake, authorizations, scheduling, and care delivery —
            built for the Blossom ABA Therapy team.
          </p>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Blossom ABA Therapy
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src={logoBrand} alt="Blossom ABA Therapy" className="h-20 w-20 rounded-2xl object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Welcome back. Use your Blossom team account to continue.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@blossomabatherapy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>
            <Button type="submit" className="w-full h-10" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/60">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need an account? Team accounts are created by your administrator.
              Contact your Blossom admin to get access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
