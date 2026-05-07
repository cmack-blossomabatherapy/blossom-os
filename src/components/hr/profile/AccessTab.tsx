import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, GraduationCap, Loader2, ShieldCheck, Link as LinkIcon, Mail, Send, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/hr/types";
import { ROLE_META, roleLabel, type AppRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AccessTab({ employee }: { employee: Employee }) {
  const { isAdmin, hasPerm } = useAuth();
  const canManageRoles = isAdmin || hasPerm("settings.manage") || hasPerm("hr.employees.edit");
  const canSendLink = isAdmin || hasPerm("hr.employees.edit");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkResult, setLinkResult] = useState<string | null>(null);
  const [linkLoginOpen, setLinkLoginOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState(employee.email ?? "");
  const [linkingLogin, setLinkingLogin] = useState(false);

  useEffect(() => {
    if (!employee.user_id) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", employee.user_id)
      .then(({ data, error }) => {
        if (!error && data) setRoles(data.map((r) => r.role as AppRole));
        setLoading(false);
      });
  }, [employee.user_id]);

  const toggleRole = async (role: AppRole, next: boolean) => {
    if (!employee.user_id) {
      toast.error("This employee has no Blossom OS account yet — link one first.");
      return;
    }
    setSaving(true);
    if (next) {
      const { error } = await supabase.from("user_roles").insert({ user_id: employee.user_id, role });
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      setRoles((prev) => Array.from(new Set([...prev, role])));
      toast.success(`${roleLabel(role)} added`);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", employee.user_id)
        .eq("role", role);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      setRoles((prev) => prev.filter((r) => r !== role));
      toast.success(`${roleLabel(role)} removed`);
    }
    setSaving(false);
  };

  const items = [
    { label: "Blossom OS account", on: !!employee.user_id, hint: employee.user_id ? "Linked" : "Not linked" },
    { label: "Employee resource hub", on: employee.resource_hub_access, hint: employee.resource_hub_access ? "Granted" : "Disabled" },
    { label: "Clinic kiosk clock-in", on: employee.kiosk_enabled, hint: employee.kiosk_enabled ? "PIN active" : "Disabled" },
    { label: "Viventium payroll", on: !!employee.viventium_employee_id, hint: employee.viventium_sync_status ?? "Not connected" },
    { label: "CentralReach", on: false, hint: "Manual setup required" },
  ];

  async function sendMagicLink() {
    if (!employee.email) {
      toast.error("Add an email to this employee before sending a sign-in link.");
      return;
    }
    setSendingLink(true);
    setLinkResult(null);
    const { data, error } = await supabase.functions.invoke("admin-employee-magic-link", {
      body: { employeeId: employee.id, siteUrl: window.location.origin },
    });
    setSendingLink(false);
    if (error) { toast.error(error.message); return; }
    if (data?.emailSent) {
      toast.success(`Sign-in link sent to ${employee.email}`);
      setLinkResult(`Sign-in link emailed to ${employee.email}. They'll be asked to set a password after signing in.`);
    } else if (data?.magicLink) {
      toast.warning("Email service unavailable — copy the link manually.");
      setLinkResult(data.magicLink);
    } else {
      toast.error(data?.emailError ?? "Could not send sign-in link.");
    }
  }

  async function linkExistingLogin() {
    const email = linkEmail.trim().toLowerCase();
    if (!email) { toast.error("Enter an email to link."); return; }
    setLinkingLogin(true);
    const { data, error } = await supabase.functions.invoke("admin-link-employee-login", {
      body: { employeeId: employee.id, email, siteUrl: window.location.origin, notify: true },
    });
    setLinkingLogin(false);
    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }
    if (data?.emailSent) {
      toast.success(`Linked ${data.email}. Notification emailed.`);
    } else if (data?.emailError) {
      toast.success(`Linked ${data.email}.`);
      toast.warning(`Could not email notification: ${data.emailError}`);
    } else {
      toast.success(`Linked ${data?.email ?? email}.`);
    }
    setLinkLoginOpen(false);
    // Force refresh of parent record
    window.location.reload();
  }

  const roleToggles: { key: AppRole; title: string; desc: string; icon: typeof GraduationCap }[] = [
    {
      key: "training_admin",
      title: "Training Admin access",
      desc: "Can assign trainings, track status, view training stats — adds Training Admin to the left menu.",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Module access &amp; roles</h3>
          {!employee.user_id && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              No login linked
            </Badge>
          )}
        </div>
        {!employee.user_id && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Link an existing Blossom OS login</p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Already signed in once with Google or a magic link? One-click connect their account so Operations Academy and the Resource Hub light up.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLinkEmail(employee.email ?? ""); setLinkLoginOpen(true); }}
              disabled={!canSendLink}
              className="shrink-0"
            >
              <Link2 className="h-3.5 w-3.5" /> Link login
            </Button>
          </div>
        )}
        <div className="mb-4 rounded-lg border border-primary/25 bg-primary/5 p-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {employee.user_id ? "Send a new sign-in link" : "Send sign-in link to activate account"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {employee.email
                  ? <>Emails <span className="font-medium text-foreground">{employee.email}</span> a one-click sign-in link. They'll set their own password right after.</>
                  : "Add an email to this employee first."}
              </p>
              {linkResult && (
                <p className="mt-2 text-[11px] break-all text-muted-foreground">{linkResult}</p>
              )}
            </div>
            <Button
              size="sm"
              onClick={sendMagicLink}
              disabled={!canSendLink || !employee.email || sendingLink}
              className="shrink-0"
            >
              {sendingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {employee.user_id ? "Resend link" : "Send link"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {roleToggles.map((rt) => {
            const on = roles.includes(rt.key);
            const Icon = rt.icon;
            return (
              <div
                key={rt.key}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                  on ? "border-primary/30 bg-primary/5" : "border-border/40",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rt.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{rt.desc}</p>
                </div>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <Switch
                    checked={on}
                    onCheckedChange={(checked) => toggleRole(rt.key, checked)}
                    disabled={!canManageRoles || !employee.user_id || saving}
                    className="mt-0.5"
                  />
                )}
              </div>
            );
          })}

          {roles.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                All assigned roles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {roleLabel(r)}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> Manage every role from <strong className="ml-1">Team → Admin · Live members &amp; roles</strong>.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={linkLoginOpen} onOpenChange={setLinkLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link existing login</DialogTitle>
            <DialogDescription>
              Enter the email of an existing Blossom OS account. We'll connect it to this employee record and email them a confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Account email</label>
            <Input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="user@example.com"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkLoginOpen(false)} disabled={linkingLogin}>Cancel</Button>
            <Button onClick={linkExistingLogin} disabled={linkingLogin || !linkEmail.trim()}>
              {linkingLogin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Link &amp; notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">System access</h3>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
              {it.on ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{it.label}</p>
                <p className={cn("text-[11px]", it.on ? "text-muted-foreground" : "text-muted-foreground/70")}>{it.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}