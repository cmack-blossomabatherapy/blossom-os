import { useMemo, useState } from "react";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyRow } from "@/pages/os/marketing/_shared";
import {
  type MarketingSourceRow,
  useMarketingSources,
} from "@/hooks/useMarketingSources";
import { useMarketingSourceEvents } from "@/hooks/useMarketingSourceEvents";
import { SourceFormDialog } from "./SourceFormDialog";
import { expandSourceSlugAliases } from "@/lib/marketing/sourceEventMapper";

/**
 * Persisted source/connector manager. Reads `marketing_sources`, plus recent
 * activity from `marketing_source_events` for last-activity display.
 */
export function SourceManagerCard() {
  const { sources, loading, setActive } = useMarketingSources();
  const { events } = useMarketingSourceEvents({ limit: 500 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingSourceRow | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s: MarketingSourceRow) => { setEditing(s); setFormOpen(true); };

  const lastEventBySystem = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of events) {
      const key = (e.source ?? "").toLowerCase();
      if (!m.has(key) || e.receivedAt > (m.get(key) ?? "")) m.set(key, e.receivedAt);
    }
    return m;
  }, [events]);

  const lastForSource = (system: string | null | undefined) => {
    if (!system) return null;
    const aliases = expandSourceSlugAliases([system]);
    let latest: string | null = null;
    for (const a of aliases) {
      const v = lastEventBySystem.get(a);
      if (v && (!latest || v > latest)) latest = v;
    }
    return latest;
  };

  return (
    <>
      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Marketing sources</div>
            <div className="text-[11.5px] text-muted-foreground">
              {loading ? "Loading…" : `${sources.length} configured · from marketing_sources`}
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Source
          </Button>
        </div>
        {!loading && sources.length === 0 ? (
          <EmptyRow>
            No sources configured yet.{" "}
            <button className="underline underline-offset-2" onClick={openCreate}>Add one</button>.
          </EmptyRow>
        ) : (
          <div className="overflow-auto -mx-2">
            <table className="w-full text-[12.5px]">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="px-2 py-2 font-medium">Source</th>
                  <th className="px-2 py-2 font-medium">System</th>
                  <th className="px-2 py-2 font-medium">Channel</th>
                  <th className="px-2 py-2 font-medium">State</th>
                  <th className="px-2 py-2 font-medium">Last event</th>
                  <th className="px-2 py-2 font-medium">Active</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => {
                  const last = lastForSource(s.source_system);
                  return (
                    <tr key={s.id} className="border-t border-border/40">
                      <td className="px-2 py-2">
                        <div className="font-medium text-foreground">{s.name}</div>
                        {s.notes && <div className="text-[11px] text-muted-foreground truncate max-w-[240px]">{s.notes}</div>}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{s.source_system ?? "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{s.channel ?? "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{s.state ?? "—"}</td>
                      <td className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {last ? new Date(last).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-2 py-2">
                        <Badge className={s.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-muted"}>
                          {s.is_active ? "active" : "inactive"}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            title={s.is_active ? "Deactivate" : "Activate"}
                            onClick={() => setActive(s.id, !s.is_active)}
                          >
                            {s.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <SourceFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </>
  );
}