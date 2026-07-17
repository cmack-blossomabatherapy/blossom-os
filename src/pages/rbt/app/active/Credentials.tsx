import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { ShieldCheck, FileText, Heart, MapPin, ClipboardList } from "lucide-react";

const ICONS: Record<string, any> = {
  rbt_cert: ShieldCheck,
  cpr_first_aid: Heart,
  background_check: FileText,
  state_requirement: MapPin,
  document: ClipboardList,
};

function StatusPill({ status, expires }: { status: string; expires?: string | null }) {
  const soon = expires && (new Date(expires).getTime() - Date.now()) / 864e5 < 60;
  const tone = /expired|missing/.test(status)
    ? "bg-destructive/10 text-destructive"
    : /expiring/.test(status) || soon
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    : /pending/.test(status)
    ? "bg-muted text-muted-foreground"
    : "bg-primary/10 text-primary";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function Credentials() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_credentials" as any)
      .select("id,credential_type,label,identifier,status,issued_on,expires_on,state_code,notes,last_verified_at")
      .eq("employee_id", user.id)
      .order("expires_on", { ascending: true, nullsFirst: false })
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, [user?.id]);

  const state = rows === null ? "loading" : rows.length === 0 ? "empty" : "success";
  const groups = ["rbt_cert", "cpr_first_aid", "background_check", "state_requirement", "document"];
  const grouped = groups.map((g) => ({ key: g, items: (rows ?? []).filter((r) => r.credential_type === g) }));
  const renewals = (rows ?? []).filter((r) => r.status !== "active" && r.status !== "complete");

  return (
    <div className="space-y-3">
      <CardFrame title="Credentials" state={state} emptyLabel="No credentials on file yet."
        subtitle="Your compliance snapshot">
        <div className="space-y-4">
          {grouped.filter((g) => g.items.length > 0).map((g) => {
            const Icon = ICONS[g.key] ?? FileText;
            return (
              <div key={g.key}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {g.key.replace(/_/g, " ")}
                </p>
                <ul className="space-y-1.5">
                  {g.items.map((r) => (
                    <li key={r.id} className="rounded-xl border border-border/70 bg-card p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.identifier ?? ""}{r.state_code ? ` · ${r.state_code}` : ""}
                          </p>
                        </div>
                        <StatusPill status={r.status} expires={r.expires_on} />
                      </div>
                      {r.expires_on && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Expires {new Date(r.expires_on).toLocaleDateString()}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardFrame>

      <CardFrame title="Renewal tasks" state={renewals.length ? "success" : "empty"}
        emptyLabel="Nothing to renew right now.">
        <ul className="space-y-1.5">
          {renewals.map((r) => (
            <li key={r.id} className="text-sm flex items-center justify-between">
              <span className="truncate">{r.label}</span>
              <StatusPill status={r.status} expires={r.expires_on} />
            </li>
          ))}
        </ul>
      </CardFrame>
    </div>
  );
}