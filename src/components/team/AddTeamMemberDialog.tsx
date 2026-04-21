import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle2, UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type Role = "admin" | "staff" | "viewer";

interface InviteResult {
  email: string;
  tempPassword: string;
  role: Role;
}

export function AddTeamMemberDialog({ open, onOpenChange, onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setDisplayName("");
    setRole("staff");
    setResult(null);
    setCopied(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-invite-user", {
      body: { email: email.trim().toLowerCase(), displayName: displayName.trim() || undefined, role },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Failed to invite team member");
      return;
    }
    if (!data?.ok) {
      toast.error(data?.error ?? "Failed to invite team member");
      return;
    }
    setResult({ email: data.email, tempPassword: data.tempPassword, role: data.role });
    toast.success("Team member invited");
    onCreated?.();
  };

  const copy = async () => {
    if (!result) return;
    const text = `Email: ${result.email}\nTemporary password: ${result.tempPassword}\nRole: ${result.role}\n\nSign in at ${window.location.origin}/auth and you'll be asked to set a new password.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!result ? (
          <>
            <DialogHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <UserPlus className="h-5 w-5" />
              </div>
              <DialogTitle>Add team member</DialogTitle>
              <DialogDescription>
                Create a new account. You'll get a one-time password to share with them —
                they'll be asked to set their own password on first sign-in.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Full name</Label>
                <Input id="invite-name" placeholder="Sarah Martinez"
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Work email</Label>
                <Input id="invite-email" type="email" required autoComplete="off"
                  placeholder="sarah@blossomabatherapy.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — full access, manages team</SelectItem>
                    <SelectItem value="staff">Staff — can edit records</SelectItem>
                    <SelectItem value="viewer">Viewer — read-only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create account
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>
                Share these credentials with {result.email}. They'll be required to set a
                new password on first sign-in. This password won't be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
                <InfoRow label="Email" value={result.email} />
                <InfoRow label="Temporary password" value={result.tempPassword} mono />
                <InfoRow label="Role" value={result.role} />
              </div>
              <Button variant="outline" className="w-full" onClick={copy}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                {copied ? "Copied" : "Copy credentials"}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-foreground" : "text-foreground capitalize"}>{value}</span>
    </div>
  );
}