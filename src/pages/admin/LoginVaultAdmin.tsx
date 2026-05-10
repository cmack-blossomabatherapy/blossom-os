import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { KeyRound, Plus, ShieldAlert, Loader2, Trash2 } from "lucide-react";

export default function LoginVaultAdmin() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: "", system_name: "", system_category: "", login_url: "", username: "", encrypted_password: "", notes: "" });
  const [busy, setBusy] = useState(false);

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const { data: logins, isLoading } = useQuery({
    queryKey: ["admin_logins"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_logins").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["admin_login_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("login_access_logs").select("*").order("occurred_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  async function create() {
    if (!form.user_id || !form.system_name) return toast({ title: "User ID and system name required", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("employee_logins").insert({
      user_id: form.user_id, system_name: form.system_name, system_category: form.system_category || null,
      login_url: form.login_url || null, username: form.username || null,
      encrypted_password: form.encrypted_password || null, notes: form.notes || null,
      assigned_by: user!.id,
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't create", description: error.message, variant: "destructive" });
    toast({ title: "Login assigned" });
    setOpen(false);
    setForm({ user_id: "", system_name: "", system_category: "", login_url: "", username: "", encrypted_password: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["admin_logins"] });
  }

  async function archive(id: string) {
    const { error } = await supabase.from("employee_logins").update({ is_active: false }).eq("id", id);
    if (error) return toast({ title: "Couldn't archive", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin_logins"] });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
              <KeyRound className="h-3.5 w-3.5" /> Login Vault
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Assigned employee logins</h1>
            <p className="mt-1 text-sm text-primary-foreground/85">Centralize system access. Employees unlock with PIN or Face ID.</p>
          </div>
          <Button variant="hero" size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Assign login</Button>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Passwords stored here are not yet encrypted at rest. Wire an encrypted vault edge function before storing real production credentials.</span>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Active logins ({logins?.filter((l: any) => l.is_active).length ?? 0})</h2>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <div className="divide-y divide-border/60">
          {logins?.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{l.system_name} {!l.is_active && <Badge variant="outline" className="ml-1 text-[10px]">Archived</Badge>}</p>
                <p className="text-[11px] text-muted-foreground truncate">User {l.user_id.slice(0, 8)} · {l.system_category || "General"} · {l.username || "no username"}</p>
              </div>
              {l.is_active && <Button variant="ghost" size="sm" onClick={() => archive(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
            </div>
          ))}
          {logins && logins.length === 0 && <p className="text-xs text-muted-foreground">No logins yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Recent vault activity</h2>
        <div className="divide-y divide-border/60 text-xs">
          {logs?.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between py-1.5">
              <span className="capitalize">{String(l.action).replace("_", " ")}</span>
              <span className="text-muted-foreground tabular-nums">{new Date(l.occurred_at).toLocaleString()}</span>
            </div>
          ))}
          {logs && logs.length === 0 && <p className="text-muted-foreground">No activity yet.</p>}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Assign login</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label>User ID (auth.users.id)</Label><Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="uuid" /></div>
            <div className="space-y-1.5"><Label>System name</Label><Input value={form.system_name} onChange={(e) => setForm({ ...form, system_name: e.target.value })} placeholder="e.g. CentralReach" /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input value={form.system_category} onChange={(e) => setForm({ ...form, system_category: e.target.value })} placeholder="EMR, Payroll, HR..." /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Login URL</Label><Input value={form.login_url} onChange={(e) => setForm({ ...form, login_url: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Password (placeholder)</Label><Input type="password" value={form.encrypted_password} onChange={(e) => setForm({ ...form, encrypted_password: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}