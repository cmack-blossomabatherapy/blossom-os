import { useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

/**
 * Floating top-of-page Sign In CTA.
 * - Visible whenever there is no signed-in user.
 * - Hidden on the dedicated auth screens (already a sign-in surface).
 * - Disappears the moment a user is authenticated.
 */
export function SignInCtaButton() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (loading || user) return null;
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/mfa")
  ) return null;

  return (
    <div className="fixed top-3 right-3 z-[60]">
      <Button
        size="sm"
        onClick={() => navigate("/auth")}
        className="shadow-lg gap-1.5 rounded-full px-4 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Button>
    </div>
  );
}