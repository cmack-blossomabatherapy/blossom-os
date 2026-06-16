import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ArrowRight, AlertCircle } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface DeptRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  primary_queue_path: string | null;
  workspace_id: string | null;
  head_user_id: string | null;
  backup_user_id: string | null;
  sort_order: number;
}
interface ProfileLite { user_id: string; display_name: string | null; email: string | null; }

export default function Departments() {
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("departments")
        .select("id,slug,name,description,primary_queue_path,workspace_id,head_user_id,backup_user_id,sort_order")
        .order("sort_order");
      const rows = (data ?? []) as DeptRow[];
      setDepts(rows);
      const ids = Array.from(new Set(rows.flatMap((d) => [d.head_user_id, d.backup_user_id]).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("user_id,display_name,email").in("user_id", ids);
        const map: Record<string, ProfileLite> = {};
        (profs ?? []).forEach((p) => { map[p.user_id] = p as ProfileLite; });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, []);

  const ownerName = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = profiles[id];
    return p?.display_name || p?.email || "Unknown";
  };

  return (
    <GlassPageShell
      eyebrow="Departments"
      eyebrowIcon={Building2}
      title="Department Management"
      description="The 16 Blossom OS departments. Heads, backups, members, KPIs, and escalation rules are editable."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading departments…</p>
      ) : depts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No departments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {depts.map((d) => (
            <Link
              key={d.id}
              to={`/blossom/departments/${d.id}`}
              className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                {!d.head_user_id && (
                  <Badge variant="outline" className="gap-1 text-[10px] text-amber-600">
                    <AlertCircle className="h-3 w-3" /> No head
                  </Badge>
                )}
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{d.name}</h3>
              {d.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{d.description}</p>
              )}
              <div className="mt-3 space-y-0.5 text-[11px] text-muted-foreground">
                <p>Head · <span className="font-medium text-foreground">{ownerName(d.head_user_id)}</span></p>
                <p>Backup · <span className="text-foreground">{ownerName(d.backup_user_id)}</span></p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                <span className="truncate">{d.primary_queue_path ?? "—"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </GlassPageShell>
  );
}
