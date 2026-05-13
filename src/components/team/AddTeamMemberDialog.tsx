import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle2, UserPlus, Mail, AlertCircle } from "lucide-react";
import { ROLE_META, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface InviteResult {
  email: string;
  tempPassword: string;
  roles: AppRole[];
  welcomeEmailSent?: boolean;
  welcomeEmailStatus?: "sent" | "failed" | "skipped";
  welcomeEmailError?: string | null;
  resendMessageId?: string | null;
}

export function AddTeamMemberDialog({ open, onOpenChange, onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(new Set(["intake"]));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setDisplayName("");
    setSelectedRoles(new Set(["intake"]));
    setResult(null);
    setCopied(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggleRole = (key: AppRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.size === 0) {
      toast.error("Pick at least one role");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-invite-user", {
      body: {
        email: email.trim().toLowerCase(),
        displayName: displayName.trim() || undefined,
        roles: Array.from(selectedRoles),
        siteUrl: window.location.origin,
      },
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
    setResult({
      email: data.email,
      tempPassword: data.tempPassword,
      roles: data.roles ?? [],
      welcomeEmailSent: data.welcomeEmailSent,
      welcomeEmailStatus: data.welcomeEmailStatus,
      welcomeEmailError: data.welcomeEmailError,
      resendMessageId: data.resendMessageId,
    });
    toast.success(data.welcomeEmailSent ? "Team member invited and welcome email sent" : "Team member invited");
    onCreated?.();
    // Notify any live team directories / admin panels to refresh immediately.
    window.dispatchEvent(new CustomEvent("team-directory:refresh"));
  };

  const copy = async () => {
    if (!result) return;
    const text = `Email: ${result.email}\nTemporary password: ${result.tempPassword}\nRoles: ${result.roles.join(", ")}\n\nSign in at ${window.location.origin}/auth and you'll be asked to set a new password.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const openWelcomeDraft = () => {
    if (!result) return;
    const loginUrl = `${window.location.origin}/auth`;
    const firstName = displayName.trim().split(" ").filter(Boolean)[0];
    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
    const roleList = result.roles
      .map((role) => ROLE_META.find((item) => item.key === role)?.label ?? role)
      .join(", ");
    const subject = `Welcome to Blossom — your workspace is ready`;
    const body = [
      greeting,
      ``,
      `Welcome to Blossom ABA Therapy — we're so glad to have you on the team.`,
      ``,
      `Your Blossom workspace is ready, and you can use the details below to sign in for the first time:`,
      ``,
      `Email: ${result.email}`,
      `Temporary password: ${result.tempPassword}`,
      `Role access: ${roleList}`,
      `Sign in: ${loginUrl}`,
      ``,
      `For security, you'll be asked to create your own password the first time you sign in.`,
      ``,
      `Once you're in, you'll have access to your training, resources, and the tools connected to your role.`,
      ``,
      `Welcome aboard — we're excited to work with you!`,
      ``,
      `The Blossom team`,
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(result.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {!result ? (
          <>
            <DialogHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <UserPlus className="h-5 w-5" />
              </div>
              <DialogTitle>Add team member</DialogTitle>
              <DialogDescription>
                Create a new account with one or more roles. You'll get a one-time
                password to share — they'll set their own on first sign-in.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label>Roles</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedRoles.size} selected · pick one or more
                  </span>
                </div>
                <div className="rounded-lg border border-border/60 max-h-[320px] overflow-y-auto divide-y divide-border/40">
                  {ROLE_META.filter((r) => r.group !== "Legacy").map((r) => {
                    const checked = selectedRoles.has(r.key);
                    return (
                      <label
                        key={r.key}
                        className={cn(
                          "flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors",
                          checked && "bg-primary/5",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleRole(r.key)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{r.label}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {r.group}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
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
                {result.welcomeEmailSent ? "A polished welcome email was sent automatically." : `Share these credentials with ${result.email}.`} They'll be required to set a
                new password on first sign-in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
                <InfoRow label="Email" value={result.email} />
                <InfoRow label="Temporary password" value={result.tempPassword} mono />
                <InfoRow label="Roles" value={result.roles.join(", ")} />
              </div>
              <InviteEmailStatus result={result} />
              {!result.welcomeEmailSent && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" onClick={copy}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  {copied ? "Copied" : "Copy credentials"}
                </Button>
                <Button variant="outline" onClick={openWelcomeDraft}>
                  <Mail className="h-3.5 w-3.5 mr-2" />
                  Draft welcome email
                </Button>
              </div>}
              <p className="text-[11px] text-muted-foreground text-center">
                {result.welcomeEmailSent ? "The email was sent from Blossom through Resend." : "The welcome draft opens in your mail app — nothing is sent until you click Send there."}
              </p>
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
      <span className={mono ? "font-mono text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

function InviteEmailStatus({ result }: { result: InviteResult }) {
  const status = result.welcomeEmailStatus ?? (result.welcomeEmailSent ? "sent" : "failed");
  const sent = status === "sent";

  return (
    <div className={cn(
      "rounded-lg border p-3 text-sm",
      sent ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10",
    )}>
      <div className="flex items-start gap-2">
        {sent ? <CheckCircle2 className="h-4 w-4 text-success mt-0.5" /> : <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />}
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", sent ? "text-success" : "text-destructive")}>{sent ? "Welcome email sent via Resend" : "Welcome email was not sent"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {sent
              ? result.resendMessageId ? `Resend message ID: ${result.resendMessageId}` : "Resend accepted the email for delivery."
              : result.welcomeEmailError ?? "The backend saved the invite, but Resend did not confirm delivery."}
          </p>
        </div>
      </div>
    </div>
  );
}
