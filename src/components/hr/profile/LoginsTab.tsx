import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { KeyRound, Plus, Loader2, Trash2, Pencil, ExternalLink, ShieldAlert, ShieldCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Employee } from "@/lib/hr/types";

type LoginRow = {
  id: string;
  user_id: string;
  system_name: string;
  system_category: string | null;
  login_url: string | null;
  username: string | null;
  encrypted_password: string | null;
  notes: string | null;
  password_reset_required: boolean;
  is_active: boolean;
};

const blank = { system_name: "", system_category: "", login_url: "", username: "", encrypted_password: "", notes: "", password_reset_required: false };

export function LoginsTab({ employee }: { employee: Employee }) {
  const { user, isAdmin, hasPerm } = useAuth();
  const qc = useQueryClient();
  const canManage = isAdmin || hasPerm("hr.employees.edit") || hasPerm("settings.manage");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoginRow | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<LoginRow | null>(null);

  const { data: logins, isLoading } = useQuery({
    queryKey: ["employee_logins", employee.user_id],
    enabled: !!employee.user_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_logins")
        .select("*")
        .eq("user_id", employee.user_id!)
        .order("system_name");
      if (error) throw error;
      return data as LoginRow[];
    },
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  }

  function openEdit(l: LoginRow) {
    setEditing(l);
    setForm({
      system_name: l.system_name,
      system_category: l.system_category ?? "",
      login_url: l.login_url ?? "",
      username: l.username ?? "",
      encrypted_password: l.encrypted_password ?? "",
      notes: l.notes ?? "",
      password_reset_required: l.password_reset_required,
    });
    setOpen(true);
  }

  async function save() {
    if (!employee.user_id) {
      toast.error("Link a Blossom OS login to this employee first.");
      return;
    }
    if (!form.system_name.trim()) {
      toast.error("System name is required.");
      return;
    }
    setBusy(true);
    if (editing) {
      const { error } = await supabase
        .from("employee_logins")
        .update({
          system_name: form.system_name.trim(),
          system_category: form.system_category.trim() || null,
          login_url: form.login_url.trim() || null,
          username: form.username.trim() || null,
          encrypted_password: form.encrypted_password || null,
          notes: form.notes.trim() || null,
          password_reset_required: form.password_reset_required,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Login updated");
    } else {
      const { error } = await supabase.from("employee_logins").insert({
        user_id: employee.user_id,
        system_name: form.system_name.trim(),
        system_category: form.system_category.trim() || null,
        login_url: form.login_url.trim() || null,
        username: form.username.trim() || null,
        encrypted_password: form.encrypted_password || null,
        notes: form.notes.trim() || null,
        password_reset_required: form.password_reset_required,
        assigned_by: user?.id ?? null,
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Login assigned");
    }
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["employee_logins", employee.user_id] });
  }

  async function archive(l: LoginRow) {
    const { error } = await supabase.from("employee_logins").update({ is_active: !l.is_active }).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    toast.success(l.is_active ? "Login archived" : "Login restored");
    qc.invalidateQueries({ queryKey: ["employee_logins", employee.user_id] });
  }

  async function remove() {
    if (!confirmDel) return;
    const { error } = await supabase.from("employee_logins").delete().eq("id", confirmDel.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Login deleted");
    setConfirmDel(null);
    qc.invalidateQueries({ queryKey: ["employee_logins", employee.user_id] });
  }

  if (!employee.user_id) {
    return (
      <Card className="p-6 text-center">
        <KeyRound className="mx-auto h-7 w-7 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium">No login linked yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Link this employee to a Blossom OS account from the Access tab — then you can assign system logins here.</p>
      </Card>
    );
  }

  const active = logins?.filter((l) => l.is_active) ?? [];
  const archived = logins?.filter((l) => !l.is_active) ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Assigned system logins</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {employee.first_name} sees these in their Profile → My Logins tab. Passwords stay hidden until they unlock with their PIN.
              </p>
            </div>
          </div>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Add login
            </Button>
          )}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Only Vault Admins can view & manage these passwords. Employees unlock with their personal PIN to see them.</span>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : active.length === 0 && archived.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <KeyRound className="mx-auto mb-2 h-6 w-6 opacity-60" />
          No logins assigned yet. Click <span className="font-medium text-foreground">Add login</span> to share a system.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((l) => (
            <LoginCard key={l.id} l={l} canManage={canManage} onEdit={openEdit} onArchive={archive} onDelete={() => setConfirmDel(l)} />
          ))}
          {archived.length > 0 && (
            <>
              <p className="sm:col-span-2 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Archived</p>
              {archived.map((l) => (
                <LoginCard key={l.id} l={l} canManage={canManage} onEdit={openEdit} onArchive={archive} onDelete={() => setConfirmDel(l)} />
              ))}
            </>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit login" : "Assign new login"}</DialogTitle>
            <DialogDescription>
              These credentials show up in {employee.first_name}'s vault. They unlock the password with their PIN.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>System name *</Label>
              <Input value={form.system_name} onChange={(e) => setForm({ ...form, system_name: e.target.value })} placeholder="e.g. CentralReach" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.system_category} onChange={(e) => setForm({ ...form, system_category: e.target.value })} placeholder="EMR, Payroll, HR…" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Login URL</Label>
              <Input type="url" value={form.login_url} onChange={(e) => setForm({ ...form, login_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="text" value={form.encrypted_password} onChange={(e) => setForm({ ...form, encrypted_password: e.target.value })} placeholder="Stored securely" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="MFA setup, reminders, etc." />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={form.password_reset_required} onChange={(e) => setForm({ ...form, password_reset_required: e.target.checked })} />
              Flag as needing reset on next login
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              {editing ? "Save" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete login?</DialogTitle>
            <DialogDescription>
              This permanently removes <span className="font-medium text-foreground">{confirmDel?.system_name}</span> from {employee.first_name}'s vault. Prefer Archive if you might need it back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoginCard({ l, canManage, onEdit, onArchive, onDelete }: { l: LoginRow; canManage: boolean; onEdit: (l: LoginRow) => void; onArchive: (l: LoginRow) => void; onDelete: (l: LoginRow) => void }) {
  return (
    <Card className={`p-4 ${l.is_active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{l.system_name}</p>
            {!l.is_active && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
            {l.password_reset_required && <Badge variant="destructive" className="text-[10px]">Reset</Badge>}
          </div>
          {l.system_category && <Badge variant="outline" className="mt-1 text-[10px]">{l.system_category}</Badge>}
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs">
        {l.login_url && (
          <a href={l.login_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline truncate">
            <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{hostFrom(l.login_url)}</span>
          </a>
        )}
        <p className="text-muted-foreground">Username: <span className="font-medium text-foreground">{l.username || "—"}</span></p>
        <p className="text-muted-foreground inline-flex items-center gap-1.5">
          Password: <span className="font-mono">{l.encrypted_password ? "••••••••" : "—"}</span>
          {l.encrypted_password && <Lock className="h-3 w-3 text-primary" />}
        </p>
        {l.notes && <p className="text-[11px] text-muted-foreground line-clamp-2">{l.notes}</p>}
      </div>
      {canManage && (
        <div className="mt-3 flex gap-1.5">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-[11px]" onClick={() => onEdit(l)}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => onArchive(l)}>
            {l.is_active ? "Archive" : "Restore"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => onDelete(l)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Card>
  );
}

function hostFrom(url: string) { try { return new URL(url).hostname.replace("www.", ""); } catch { return url; } }
