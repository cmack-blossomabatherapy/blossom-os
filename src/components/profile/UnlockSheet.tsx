import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { verifyPin } from "@/lib/security/pinHash";
import { isPlatformAuthenticatorAvailable, verifyWithPasskey } from "@/lib/security/passkey";
import { logUnlockEvent, logVaultEvent } from "@/lib/security/vaultAudit";
import { Fingerprint, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_FAILED = 3;
const LOCKOUT_MS = 60_000;

export function UnlockSheet({ open, onOpenChange, userId, loginId, onUnlocked }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  loginId?: string | null;
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [passkeyOk, setPasskeyOk] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => { if (!open) { setPin(""); } }, [open]);
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  useEffect(() => {
    if (!open) return;
    isPlatformAuthenticatorAvailable().then(setPasskeyOk);
    supabase.from("employee_pin_settings").select("passkey_credential_id, locked_until")
      .eq("user_id", userId).maybeSingle().then(({ data }) => {
        if (data?.passkey_credential_id) setCredentialId(data.passkey_credential_id);
        if (data?.locked_until && new Date(data.locked_until).getTime() > Date.now()) {
          setLockedUntil(new Date(data.locked_until).getTime());
        }
      });
  }, [open, userId]);

  const lockedRemaining = lockedUntil ? Math.max(0, lockedUntil - now) : 0;

  async function tryPin() {
    if (lockedRemaining > 0) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.from("employee_pin_settings")
        .select("pin_hash, pin_salt, failed_attempts").eq("user_id", userId).maybeSingle();
      if (error || !data) throw error || new Error("PIN not set");
      const ok = await verifyPin(pin, data.pin_salt, data.pin_hash);
      await logUnlockEvent({ userId, method: "pin", success: ok });
      if (loginId) await logVaultEvent({ userId, loginId, action: ok ? "unlock_success" : "unlock_failed" });
      if (ok) {
        await supabase.from("employee_pin_settings").update({ failed_attempts: 0, locked_until: null }).eq("user_id", userId);
        onUnlocked();
        onOpenChange(false);
        return;
      }
      const next = (data.failed_attempts ?? 0) + 1;
      const lockUntil = next >= MAX_FAILED ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
      await supabase.from("employee_pin_settings").update({ failed_attempts: next, locked_until: lockUntil }).eq("user_id", userId);
      if (lockUntil) setLockedUntil(Date.now() + LOCKOUT_MS);
      toast({ title: "Incorrect PIN", description: lockUntil ? "Locked for 60 seconds." : `${MAX_FAILED - next} attempts left.`, variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Unlock failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setPin("");
    }
  }

  async function tryPasskey() {
    setBusy(true);
    const r = await verifyWithPasskey(credentialId ?? undefined);
    await logUnlockEvent({ userId, method: "passkey", success: r.ok });
    if (loginId) await logVaultEvent({ userId, loginId, action: r.ok ? "unlock_success" : "unlock_failed" });
    setBusy(false);
    if (r.ok) { onUnlocked(); onOpenChange(false); return; }
    if (r.reason === "notSupported") toast({ title: "Not available on this device", variant: "destructive" });
    else if (r.reason === "cancelled") toast({ title: "Cancelled" });
    else toast({ title: "Couldn't verify", description: r.message, variant: "destructive" });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md sm:mx-auto sm:rounded-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Unlock your vault</SheetTitle>
          <SheetDescription>Verify it's you before we reveal saved passwords.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {lockedRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4" /> Locked for {Math.ceil(lockedRemaining / 1000)}s after too many attempts.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="unlock-pin">PIN</Label>
            <Input id="unlock-pin" inputMode="numeric" type="password" autoFocus value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              onKeyDown={(e) => { if (e.key === "Enter") tryPin(); }}
              disabled={lockedRemaining > 0} />
            <Button className="w-full" onClick={tryPin} disabled={busy || !pin || lockedRemaining > 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock with PIN"}
            </Button>
          </div>
          {passkeyOk && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" /></div>
              <Button variant="outline" className="w-full" onClick={tryPasskey} disabled={busy}>
                <Fingerprint className="h-4 w-4" /> Use Face ID / Touch ID
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}