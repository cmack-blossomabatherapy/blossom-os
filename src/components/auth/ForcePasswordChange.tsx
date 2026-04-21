import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

/**
 * Blocking modal shown to any user whose profile has `must_change_password=true`.
 * They can't use the app until they set a new password (or sign out).
 */
export function ForcePasswordChange() {
  const { mustChangePassword, updatePassword, signOut } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  if (!mustChangePassword) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pw !== pw2) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    const { error } = await updatePassword(pw);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Password updated. Welcome to Blossom.");
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle>Set your password</DialogTitle>
          <DialogDescription>
            Your account was created by an administrator with a temporary password.
            Choose a new password to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input id="new-pw" type="password" required minLength={8}
              value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw2">Confirm password</Label>
            <Input id="new-pw2" type="password" required minLength={8}
              value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            <p className="text-[11px] text-muted-foreground">Minimum 8 characters. Leaked passwords are blocked.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => signOut()}>Sign out</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Set password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}