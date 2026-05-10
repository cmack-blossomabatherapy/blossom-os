import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { generateSalt, hashPin } from "@/lib/security/pinHash";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export function PinSetupDialog({ open, onOpenChange, userId, onComplete }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onComplete: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function save() {
    if (pin.length < 4) return toast({ title: "PIN too short", description: "Use at least 4 digits.", variant: "destructive" });
    if (pin !== confirm) return toast({ title: "PINs don't match", variant: "destructive" });
    setBusy(true);
    try {
      const salt = generateSalt();
      const hash = await hashPin(pin, salt);
      const { error } = await supabase.from("employee_pin_settings").upsert({
        user_id: userId, pin_hash: hash, pin_salt: salt, failed_attempts: 0, locked_until: null,
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "PIN set", description: "Use it to unlock your secure logins." });
      setPin(""); setConfirm("");
      onComplete();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Couldn't save PIN", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Set up your unlock PIN</DialogTitle>
          <DialogDescription>You'll need this every time you reveal a saved password.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="pin">New PIN</Label>
            <Input id="pin" inputMode="numeric" autoComplete="new-password" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm PIN</Label>
            <Input id="confirm" inputMode="numeric" autoComplete="new-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </div>
          <p className="text-[11px] text-muted-foreground">Stored as a salted PBKDF2 hash. Never sent in plain text.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !pin || !confirm}>Save PIN</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}