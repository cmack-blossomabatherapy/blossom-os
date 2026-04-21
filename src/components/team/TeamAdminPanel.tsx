import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_META, ROLE_LOOKUP, roleLabel, type AppRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Trash2, ShieldCheck, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
}
interface RoleRow {
  user_id: string;
  role: AppRole;
}
interface Member {
  user_id: string;
  display_name: string;
  roles: AppRole[];
}

/** Live admin view of every team member and the roles they hold. */
export function TeamAdminPanel() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const profiles = (profilesRes.data ?? []) as ProfileRow[];
    const roles = (rolesRes.data ?? []) as RoleRow[];
    const byUser = new Map<string, AppRole[]>();
    roles.forEach((r) => {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role);
      byUser.set(r.user_id, list);
    });
    const combined: Member[] = profiles.map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name ?? "(no name)",
      roles: byUser.get(p.user_id) ?? [],
    }));
    combined.sort((a, b) => a.display_name.localeCompare(b.display_name));
    setMembers(combined);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        m.display_name.toLowerCase().includes(q) ||
        m.roles.some((r) => roleLabel(r).toLowerCase().includes(q)),
    );
  }, [members, query]);

  const toggleRole = async (member: Member, role: AppRole) => {
    if (member.user_id === currentUser?.id && role === "admin" && member.roles.includes("admin")) {
      // Block self-removing admin to avoid lockout.
      const adminCount = members.filter((m) => m.roles.includes("admin")).length;
      if (adminCount <= 1) {
        toast.error("Can't remove the last admin");
        return;
      }
    }
    setSavingId(member.user_id);
    const has = member.roles.includes(role);
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id)
        .eq("role", role);
      if (error) {
        toast.error(error.message);
        setSavingId(null);
        return;
      }
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, roles: m.roles.filter((r) => r !== role) } : m)),
      );
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: member.user_id, role });
      if (error) {
        toast.error(error.message);
        setSavingId(null);
        return;
      }
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, roles: [...m.roles, role] } : m)),
      );
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="p-3 border-b border-border/40 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search members or roles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {members.length} member{members.length === 1 ? "" : "s"}
        </span>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="divide-y divide-border/40">
        {filtered.map((m) => (
          <MemberRow
            key={m.user_id}
            member={m}
            onToggleRole={(role) => toggleRole(m, role)}
            saving={savingId === m.user_id}
            isCurrentUser={m.user_id === currentUser?.id}
          />
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No members match.</div>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member,
  onToggleRole,
  saving,
  isCurrentUser,
}: {
  member: Member;
  onToggleRole: (role: AppRole) => void;
  saving: boolean;
  isCurrentUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-3"
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{member.display_name}</span>
            {isCurrentUser && (
              <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {member.roles.length === 0 && (
              <span className="text-[11px] text-muted-foreground italic">No roles assigned</span>
            )}
            {member.roles.map((r) => (
              <span
                key={r}
                className="text-[10px] font-medium text-foreground bg-muted px-1.5 py-0.5 rounded"
              >
                {roleLabel(r)}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs text-primary">{open ? "Hide" : "Edit roles"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 bg-muted/20 border-t border-border/40">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mt-3 mb-2">
            Assigned roles {saving && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ROLE_META.filter((r) => r.group !== "Legacy").map((r) => {
              const checked = member.roles.includes(r.key);
              return (
                <label
                  key={r.key}
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors",
                    checked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 bg-card hover:bg-muted/30",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleRole(r.key)}
                    disabled={saving}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground">{r.label}</span>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{r.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
