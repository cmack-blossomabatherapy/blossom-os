import { useEffect, useMemo, useState } from "react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";
import { ROLE_META } from "@/lib/roles";

interface Row {
  user_id: string;
  display_name: string | null;
  email: string | null;
  state: string | null;
  active: boolean;
  roles: AppRole[];
}

const roleLabel = (r: AppRole) => ROLE_META.find((m) => m.key === r)?.label ?? r;

export default function OSUserManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, state, active")
        .order("display_name", { ascending: true });
      const ids = (profiles ?? []).map((p) => p.user_id);
      let roleMap = new Map<string, AppRole[]>();
      if (ids.length) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids);
        (roles ?? []).forEach((r) => {
          const arr = roleMap.get(r.user_id) ?? [];
          arr.push(r.role as AppRole);
          roleMap.set(r.user_id, arr);
        });
      }
      setRows(
        (profiles ?? []).map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          email: p.email,
          state: p.state,
          active: p.active,
          roles: roleMap.get(p.user_id) ?? [],
        })),
      );
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.display_name, r.email, r.state, r.roles.join(" ")].join(" ").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <OSShell>
      <header className="os-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
            Blossom OS · Users
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[32px]">User Management</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Simple roster of who has access. Invite new users and change roles here.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <UserPlus className="h-4 w-4" /> Invite user
        </Button>
      </header>

      <section className="os-card mt-6">
        <div className="flex items-center justify-between gap-3 border-b border-foreground/[0.06] px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, role, state…"
              className="h-10 pl-9"
            />
          </div>
          <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
            <Users2 className="h-3.5 w-3.5" />
            {filtered.length} user{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-foreground/[0.025] text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">State</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No users yet.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.user_id} className="border-t border-foreground/[0.05] hover:bg-foreground/[0.02]">
                  <td className="px-5 py-3 font-medium text-foreground">{r.display_name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.email ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length === 0 && <span className="text-muted-foreground">—</span>}
                      {r.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-[10.5px]">{roleLabel(role)}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.state ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge variant={r.active ? "default" : "outline"} className="text-[10.5px]">
                      {r.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OSShell>
  );
}