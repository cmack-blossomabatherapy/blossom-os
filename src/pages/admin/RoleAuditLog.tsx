import { useEffect, useMemo, useState } from "react";
import { History, Loader2, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { roleLabel, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  target_user_id: string;
  target_user_email: string | null;
  target_user_name: string | null;
  role: AppRole;
  action: "granted" | "revoked";
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  source: string | null;
  created_at: string;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default function RoleAuditLog() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | "granted" | "revoked">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("role_audit_log" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!cancelled) {
        setEntries((data as unknown as AuditEntry[]) ?? []);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const roles = useMemo(() => Array.from(new Set(entries.map((e) => e.role))).sort(), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.target_user_name ?? ""} ${e.target_user_email ?? ""} ${e.actor_name ?? ""} ${e.actor_email ?? ""} ${e.role}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, actionFilter, roleFilter, search]);

  const stats = useMemo(() => ({
    total: entries.length,
    granted: entries.filter((e) => e.action === "granted").length,
    revoked: entries.filter((e) => e.action === "revoked").length,
    trainingAdmin: entries.filter((e) => e.role === "training_admin").length,
  }), [entries]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Admin
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Role Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable history of role grants and revocations — including Training Admin permission toggles. Captured automatically by the database.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total events</div><div className="text-2xl font-semibold mt-1">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Granted</div><div className="text-2xl font-semibold mt-1 text-success">{stats.granted}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Revoked</div><div className="text-2xl font-semibold mt-1 text-destructive">{stats.revoked}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Training Admin changes</div><div className="text-2xl font-semibold mt-1">{stats.trainingAdmin}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>Showing latest {filtered.length} of {entries.length} events</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as typeof actionFilter)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="granted">Granted</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel(r as AppRole)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-[240px]" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No matching events.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Affected user</TableHead>
                  <TableHead>Changed by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.action === "granted"
                        ? <ShieldCheck className="h-4 w-4 text-success" />
                        : <ShieldOff className="h-4 w-4 text-destructive" />}
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(e.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border-transparent", e.action === "granted" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                        {e.action === "granted" ? "Granted" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{roleLabel(e.role)}</div>
                      <div className="text-xs text-muted-foreground">{e.role}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{e.target_user_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{e.target_user_email || e.target_user_id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{e.actor_name || (e.actor_user_id ? "—" : "System")}</div>
                      <div className="text-xs text-muted-foreground">{e.actor_email || (e.actor_user_id ? e.actor_user_id : "Automated")}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}