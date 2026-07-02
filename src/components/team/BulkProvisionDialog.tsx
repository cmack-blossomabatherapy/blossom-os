import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/lib/roles";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface UnprovisionedEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
}

interface ProvisionResult {
  email: string;
  name: string;
  roles: AppRole[];
  tempPassword?: string;
  error?: string;
}

/** Map a job title to one or more app roles. */
export function rolesForTitle(title: string): AppRole[] {
  const t = title.toLowerCase();
  if (t.includes("ceo") || t.includes("director of operations")) return ["exec", "admin"];
  if (t.includes("operations manager")) return ["ops_manager", "admin"];
  if (t.includes("systems") && t.includes("software")) return ["admin"];
  if (t === "finance") return ["finance"];
  if (t === "payroll") return ["payroll_admin", "finance"];
  if (t.includes("human resources")) return ["hr_admin"];
  if (t.includes("recruiting")) return ["recruiting_assistant", "hr_manager"];
  if (t.includes("marketing")) return ["staff"];
  if (t.includes("administrative manager") || t.includes("executive assistant") || t.includes("administrative assistant"))
    return ["staff"];
  if (t.includes("intake")) return ["intake"];
  if (t.includes("authorizations manager") || t.includes("auth coordinator")) return ["auth_team"];
  if (t.includes("scheduling")) return ["scheduling"];
  if (t.includes("qa")) return ["qa"];
  if (t.includes("manager of clinics")) return ["clinic_director", "ops_manager"];
  if (t.includes("clinic director")) return ["clinic_director"];
  if (t.includes("clinic administrator")) return ["clinic"];
  if (t.includes("bcba")) return ["clinic"];
  if (t.includes("assistant state director")) return ["assistant_state_director"];
  if (t.includes("regional state director") || t.includes("state director")) return ["state_director"];
  if (t.includes("case manager")) return ["clinic"];
  if (t.includes("staffing")) return ["staffing"];
  if (t.includes("recruitment")) return ["recruiting_assistant"];
  if (t.includes("training") || t.includes("rbt rep")) return ["staff"];
  return ["staff"];
}

export function BulkProvisionDialog({ open, onOpenChange, onComplete }: Props) {
  const [pending, setPending] = useState<UnprovisionedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ProvisionResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      setResults([]);
      const { data } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, job_title, user_id, status")
        .eq("status", "active")
        .is("user_id", null)
        .not("email", "is", null);
      setPending((data ?? []).map((e) => ({
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        email: (e.email ?? "").toLowerCase(),
        job_title: e.job_title,
      })));
      setLoading(false);
    })();
  }, [open]);

  const summary = useMemo(() => {
    const ok = results.filter((r) => r.tempPassword).length;
    const failed = results.filter((r) => r.error).length;
    return { ok, failed };
  }, [results]);

  const provisionAll = async () => {
    setRunning(true);
    setProgress({ done: 0, total: pending.length });
    const out: ProvisionResult[] = [];
    for (let i = 0; i < pending.length; i++) {
      const emp = pending[i];
      const roles = rolesForTitle(emp.job_title);
      const displayName = `${emp.first_name} ${emp.last_name}`;
      try {
        const { data, error } = await supabase.functions.invoke("admin-invite-user", {
          body: { email: emp.email, displayName, roles, siteUrl: window.location.origin },
        });
        if (error || !data?.ok) {
          out.push({
            email: emp.email,
            name: displayName,
            roles,
            error: data?.error ?? error?.message ?? "Unknown error",
          });
        } else {
          out.push({
            email: emp.email,
            name: displayName,
            roles: data.roles ?? roles,
            tempPassword: data.tempPassword,
          });
          // Link the employee row to the new auth user.
          await supabase
            .from("employees")
            .update({ user_id: data.userId })
            .eq("id", emp.id);
        }
      } catch (err: any) {
        out.push({
          email: emp.email,
          name: displayName,
          roles,
          error: err?.message ?? "Request failed",
        });
      }
      setProgress({ done: i + 1, total: pending.length });
      setResults([...out]);
    }
    setRunning(false);
    onComplete?.();
    const okCount = out.filter((r) => r.tempPassword).length;
    toast.success(`Provisioned ${okCount} of ${out.length} employee logins`);
  };

  const downloadCsv = () => {
    const header = "Name,Email,Roles,Temporary Password,Status\n";
    const rows = results.map((r) => {
      const status = r.tempPassword ? "OK" : `ERROR: ${r.error}`;
      const pw = r.tempPassword ?? "";
      return [r.name, r.email, r.roles.join("|"), pw, status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blossom-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
            <UserPlus className="h-5 w-5" />
          </div>
          <DialogTitle>Provision real employee logins</DialogTitle>
          <DialogDescription>
            Creates an account for every active employee that doesn't yet have one.
            Each person gets a one-time password and will be forced to change it on first sign-in.
            Roles are inferred from each job title.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <span className="font-semibold text-foreground">{pending.length}</span>{" "}
              employee{pending.length === 1 ? "" : "s"} ready to provision.
            </div>
            <div className="rounded-lg border border-border/60 max-h-[320px] overflow-y-auto divide-y divide-border/40">
              {pending.map((p) => {
                const roles = rolesForTitle(p.job_title);
                return (
                  <div key={p.id} className="px-3 py-2 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.email} · {p.job_title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                      {roles.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-medium text-foreground bg-muted px-1.5 py-0.5 rounded"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {pending.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  All active employees already have logins.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border/60 bg-card p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Provisioned</p>
                <p className="text-lg font-semibold text-success">{summary.ok}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Errors</p>
                <p className="text-lg font-semibold text-destructive">{summary.failed}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-2">
                <p className="text-[10px] uppercase text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold text-foreground">
                  {progress.done}/{progress.total}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 max-h-[320px] overflow-y-auto divide-y divide-border/40">
              {results.map((r) => (
                <div key={r.email} className="px-3 py-2 flex items-start gap-2">
                  {r.tempPassword ? (
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    {r.error && (
                      <p className="text-xs text-destructive mt-0.5">{r.error}</p>
                    )}
                    {r.tempPassword && (
                      <p className="text-xs font-mono text-foreground mt-0.5">
                        {r.tempPassword}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {results.length > 0 && (
            <Button type="button" variant="outline" onClick={downloadCsv}>
              <Download className="h-3.5 w-3.5 mr-2" /> Download CSV
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={running}>
            Close
          </Button>
          {results.length === 0 && (
            <Button onClick={provisionAll} disabled={running || pending.length === 0}>
              {running && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Provision {pending.length} employee{pending.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}