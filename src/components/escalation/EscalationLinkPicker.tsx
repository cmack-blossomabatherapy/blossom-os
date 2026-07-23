import { useEffect, useMemo, useState } from "react";
import { Link2, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type LinkEntityType = "lead" | "client" | "authorization";
export type LinkValue = { type: LinkEntityType; id: string; label: string } | null;

export const LINK_TYPE_LABEL: Record<LinkEntityType, string> = {
  lead: "Lead",
  client: "Client",
  authorization: "Authorization",
};

export function linkToHref(v: NonNullable<LinkValue>): string {
  switch (v.type) {
    case "lead":          return `/leads/${v.id}`;
    case "client":        return `/clients?client=${v.id}`;
    case "authorization": return `/authorizations?authId=${v.id}`;
  }
}

type Row = { id: string; label: string; sub?: string };

async function searchEntity(type: LinkEntityType, term: string): Promise<Row[]> {
  const q = term.trim();
  if (type === "lead") {
    let sel = supabase
      .from("intake_leads")
      .select("id, child_name, parent_name")
      .order("updated_at", { ascending: false })
      .limit(15);
    if (q) sel = sel.or(`child_name.ilike.%${q}%,parent_name.ilike.%${q}%`);
    const { data } = await sel;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      label: r.child_name || r.parent_name || "Untitled lead",
      sub: r.parent_name && r.child_name ? `Parent: ${r.parent_name}` : undefined,
    }));
  }
  if (type === "client") {
    let sel = supabase
      .from("clients")
      .select("id, child_name, parent_name, state")
      .order("updated_at", { ascending: false })
      .limit(15);
    if (q) sel = sel.or(`child_name.ilike.%${q}%,parent_name.ilike.%${q}%`);
    const { data } = await sel;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      label: r.child_name || r.parent_name || "Untitled client",
      sub: [r.parent_name, r.state].filter(Boolean).join(" · ") || undefined,
    }));
  }
  // authorization
  let sel = supabase
    .from("client_authorizations")
    .select("id, payor, service_type, state, client_id, clients(child_name)")
    .order("updated_at", { ascending: false })
    .limit(15);
  if (q) sel = sel.or(`payor.ilike.%${q}%,service_type.ilike.%${q}%`);
  const { data } = await sel;
  return (data ?? []).map((r: any) => {
    const child = r.clients?.child_name ?? "Client";
    return {
      id: r.id,
      label: `${child} — ${r.payor ?? "Auth"}`,
      sub: [r.service_type, r.state].filter(Boolean).join(" · ") || undefined,
    };
  });
}

type Props = {
  value: LinkValue;
  onChange: (v: LinkValue) => void;
  compact?: boolean;
};

export function EscalationLinkPicker({ value, onChange, compact }: Props) {
  const [openPicker, setOpenPicker] = useState(false);
  const [type, setType] = useState<LinkEntityType>(value?.type ?? "lead");
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!openPicker) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchEntity(type, term);
      if (!cancelled) { setRows(res); setLoading(false); }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [openPicker, type, term]);

  if (value && !openPicker) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[11px] gap-1">
          <Link2 className="h-3 w-3" />
          {LINK_TYPE_LABEL[value.type]}: {value.label}
        </Badge>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setOpenPicker(true)}>
          Change
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          aria-label="Remove link"
          onClick={() => onChange(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (!openPicker) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={cn("h-8 text-xs", compact && "h-7")}
        onClick={() => setOpenPicker(true)}
      >
        <Link2 className="h-3 w-3 mr-1" /> Link a lead, client, or authorization
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-2 space-y-2">
      <div className="flex gap-2">
        <Select value={type} onValueChange={(v) => setType(v as LinkEntityType)}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lead" className="text-xs">Lead</SelectItem>
            <SelectItem value="client" className="text-xs">Client</SelectItem>
            <SelectItem value="authorization" className="text-xs">Authorization</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Search ${LINK_TYPE_LABEL[type].toLowerCase()}…`}
            className="h-8 pl-7 text-xs"
            autoFocus
          />
        </div>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setOpenPicker(false)}>
          Cancel
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto rounded border bg-muted/20">
        {loading ? (
          <div className="p-2 text-xs text-muted-foreground">Searching…</div>
        ) : rows.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground">No matches.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ type, id: r.id, label: r.label });
                    setOpenPicker(false);
                  }}
                  className="w-full px-2 py-1.5 text-left text-xs hover:bg-muted/60"
                >
                  <div className="font-medium truncate">{r.label}</div>
                  {r.sub && <div className="text-[10px] text-muted-foreground truncate">{r.sub}</div>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default EscalationLinkPicker;