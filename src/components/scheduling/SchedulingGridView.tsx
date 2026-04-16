import { useState } from "react";
import { cn } from "@/lib/utils";
import { mockRBTs, weekDays, timeSlots, type SchedulingClientStatus } from "@/data/scheduling";

type GridMode = "rbt" | "client" | "bcba" | "clinic";

interface Props {
  items: SchedulingClientStatus[];
  onSelect: (clientId: string) => void;
}

export function SchedulingGridView({ items, onSelect }: Props) {
  const [mode, setMode] = useState<GridMode>("rbt");

  const rows = (() => {
    if (mode === "rbt") return mockRBTs.map((r) => ({ id: r.id, label: r.name, sub: r.clinic }));
    if (mode === "client")
      return items
        .filter((i) => i.client.schedule.length > 0)
        .map((i) => ({ id: i.client.id, label: i.client.childName, sub: i.client.clinic }));
    if (mode === "bcba") {
      const set = new Set(items.map((i) => i.client.bcba).filter(Boolean) as string[]);
      return Array.from(set).map((n) => ({ id: n, label: n, sub: "BCBA" }));
    }
    const set = new Set(items.map((i) => i.client.clinic));
    return Array.from(set).map((c) => ({ id: c, label: c, sub: "Clinic" }));
  })();

  const getSlot = (rowId: string, day: string, time: string) => {
    if (mode === "rbt") {
      const rbt = mockRBTs.find((r) => r.id === rowId);
      const block = rbt?.schedule.find(
        (s) => s.day === day && time >= s.start && time < s.end,
      );
      if (!block) return null;
      const client = items.find((i) => i.client.id === block.clientId);
      return { label: client?.client.childName || "Available", clientId: block.clientId };
    }
    if (mode === "client") {
      const client = items.find((i) => i.client.id === rowId);
      const block = client?.client.schedule.find(
        (s) => s.day === day && time >= s.start && time < s.end,
      );
      if (!block) return null;
      return { label: block.rbt || "Unassigned", clientId: rowId };
    }
    return null;
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Weekly Schedule Grid</h3>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(["rbt", "client", "bcba", "clinic"] as GridMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 h-7 text-xs font-medium rounded uppercase transition-colors",
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              By {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left text-xs font-medium text-muted-foreground p-2 sticky left-0 bg-card min-w-[160px]">
                {mode === "rbt" ? "RBT" : mode === "client" ? "Client" : mode === "bcba" ? "BCBA" : "Clinic"}
              </th>
              {weekDays.map((d) => (
                <th key={d} className="text-left text-xs font-medium text-muted-foreground p-2 min-w-[110px]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30">
                <td className="p-2 sticky left-0 bg-card">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.sub}</p>
                </td>
                {weekDays.map((d) => {
                  // collect all blocks for this row/day
                  const blocks = timeSlots
                    .map((t) => ({ t, slot: getSlot(row.id, d, t) }))
                    .filter((x) => x.slot !== null);
                  // dedupe consecutive same client blocks
                  const seen = new Set<string>();
                  const uniqueBlocks = blocks.filter((b) => {
                    const key = `${b.slot?.clientId}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  return (
                    <td key={d} className="p-1 align-top">
                      {uniqueBlocks.length === 0 ? (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      ) : (
                        <div className="space-y-1">
                          {uniqueBlocks.map((b, i) => (
                            <button
                              key={i}
                              onClick={() => b.slot?.clientId && onSelect(b.slot.clientId)}
                              className="w-full text-left p-1.5 rounded text-[11px] bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 transition-colors"
                            >
                              <p className="font-medium truncate">{b.slot?.label}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
