import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, ShieldAlert, KeyRound, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { clearMfaVerified, getMfaVerifiedAt, MFA_MAX_AGE_MS, unenrollAllTotp } from "@/lib/mfa";

interface FactorRow {
  id: string;
  friendlyName: string | null;
  createdAt: string;
}

export function SecurityMfaCard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [factors, setFactors] = useState<FactorRow[] | null>(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const rows = (data?.totp ?? [])
      .filter((f) => f.status === "verified")
      .map<FactorRow>((f) => ({
        id: f.id,
        friendlyName: f.friendly_name ?? "Authenticator app",
        createdAt: f.created_at,
      }));
    setFactors(rows);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    try {
      await unenrollAllTotp();
      clearMfaVerified(user.id);
      toast.success("Authenticator removed — you'll set up a new one now.");
      nav("/mfa/setup", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reset two-factor");
    } finally {
      setResetting(false);
    }
  };

  const verifiedAt = user ? getMfaVerifiedAt(user.id) : null;
  const expiresAt = verifiedAt ? verifiedAt + MFA_MAX_AGE_MS : null;
  const hasFactor = (factors?.length ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Two-factor authentication</h2>
      </div>

      {factors === null ? (
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : !hasFactor ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            No authenticator app is set up. Two-factor is required for the Blossom OS.
          </div>
          <Button size="sm" onClick={() => nav("/mfa/setup")} className="gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Set up authenticator
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {factors.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <div className="font-medium text-foreground">{f.friendlyName}</div>
                  <div className="text-muted-foreground">
                    Enrolled {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            </div>
          ))}

          {expiresAt && (
            <p className="text-xs text-muted-foreground">
              This device stays verified until{" "}
              <span className="font-medium text-foreground">
                {new Date(expiresAt).toLocaleDateString()}
              </span>
              . You'll be asked to sign in again after that.
            </p>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Reset authenticator
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset two-factor authentication?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current authenticator will be removed. You'll be taken to setup to enroll a
                  new one immediately. Until you finish setup, you won't be able to access the OS.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} disabled={resetting}>
                  {resetting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Reset and re-enroll
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </section>
  );
}