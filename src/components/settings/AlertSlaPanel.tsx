import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Loader2, Clock, Globe2, Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSlaCache, type SlaRule, type SlaCategory } from "@/lib/alerts/sla";

const CATEGORIES: SlaCategory[] = ["task", "approval", "overdue", "compliance"];

const ALERT_TYPES = [
  "task_overdue",
  "intake_task_overdue",
  "compliance_flag",
  "authorization_expiring",
  "authorization_denied",
  "reauth_at_risk",
  "payroll_pending",
] as const;

function formatHours(h: number): string {
  if (h === 0) return "at due";
  const abs = Math.abs(h);
  const unit = abs >= 24 && abs % 24 === 0 ? `${abs / 24}d` : `${abs}h`;
  return h < 0 ? `${unit} before` : `${unit} after`;
}

interface DraftRow extends Partial<SlaRule> {
  _isNew?: boolean;
  _dirty?: boolean;
}

export function AlertSlaPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("alert_sla_rules")
      .select("id, alert_type, label, category, payor, state, warning_offset_hours, critical_offset_hours, active, notes")
      .order("alert_type", { ascending: true })
      .order("payor", { ascending: true, nullsFirst: true })
      .order("state", { ascending: true, nullsFirst: true });
    if (error) {
      toast({ title: "Couldn't load SLA rules", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as DraftRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function patchRow(idx: number, patch: Partial<DraftRow>) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch, _dirty: true };
      return next;
    });
  }

  function addRule() {
    setRows((prev) => [
      {
        _isNew: true,
        _dirty: true,
        alert_type: "task_overdue",
        category: "task",
        payor: null,
        state: null,
        warning_offset_hours: 0,
        critical_offset_hours: 24,
        active: true,
        label: "",
        notes: "",
      },
      ...prev,
    ]);
  }

  async function saveRow(idx: number) {
    const row = rows[idx];
    if (!row.alert_type || !row.category) {
      toast({ title: "Alert type and category are required", variant: "destructive" });
      return;
    }
    if ((row.critical_offset_hours ?? 0) < (row.warning_offset_hours ?? 0)) {
      toast({ title: "Critical threshold must be ≥ warning threshold", variant: "destructive" });
      return;
    }
    setSaving(row.id ?? "new");
    const payload = {
      alert_type: row.alert_type,
      label: row.label || null,
      category: row.category,
      payor: row.payor || null,
      state: row.state ? row.state.toUpperCase() : null,
      warning_offset_hours: Number(row.warning_offset_hours ?? 0),
      critical_offset_hours: Number(row.critical_offset_hours ?? 0),
      active: row.active ?? true,
      notes: row.notes || null,
    };
    const { error } = row._isNew
      ? await supabase.from("alert_sla_rules").insert(payload)
      : await supabase.from("alert_sla_rules").update(payload).eq("id", row.id!);
    setSaving(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidateSlaCache();
    toast({ title: "SLA rule saved" });
    load();
  }

  async function deleteRow(idx: number) {
    const row = rows[idx];
    if (row._isNew || !row.id) {
      setRows((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm("Delete this SLA rule?")) return;
    const { error } = await supabase.from("alert_sla_rules").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidateSlaCache();
    toast({ title: "Rule deleted" });
    load();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, DraftRow[]>();
    rows.forEach((r) => {
      const key = r.alert_type ?? "(new)";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Alert SLA thresholds</CardTitle>
          <CardDescription>
            Choose when each alert type escalates to <strong>warning</strong> and <strong>critical</strong>. Hours are
            measured from the alert's due time — negative numbers fire before due, positive numbers after due.
            Add a row scoped to a payor and/or state to override the default for that combination.
          </CardDescription>
        </div>
        <Button size="sm" onClick={addRule}><Plus className="h-4 w-4 mr-1" /> Add rule</Button>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([type, items]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="font-mono text-[11px]">{type}</Badge>
                  <span className="text-xs text-muted-foreground">{items.length} rule{items.length === 1 ? "" : "s"}</span>
                </div>
                <div className="border border-border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Alert type</TableHead>
                        <TableHead className="w-[120px]">Category</TableHead>
                        <TableHead className="w-[120px]"><Building2 className="h-3 w-3 inline mr-1" />Payor</TableHead>
                        <TableHead className="w-[80px]"><MapPin className="h-3 w-3 inline mr-1" />State</TableHead>
                        <TableHead className="w-[120px]">Warning (h)</TableHead>
                        <TableHead className="w-[120px]">Critical (h)</TableHead>
                        <TableHead className="w-[80px]">Active</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((row) => {
                        const idx = rows.indexOf(row);
                        const isDefault = !row.payor && !row.state;
                        return (
                          <TableRow key={row.id ?? `new-${idx}`}>
                            <TableCell>
                              <Select
                                value={row.alert_type ?? ""}
                                onValueChange={(v) => patchRow(idx, { alert_type: v })}
                              >
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ALERT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.category ?? ""}
                                onValueChange={(v) => patchRow(idx, { category: v as SlaCategory })}
                              >
                                <SelectTrigger className="h-8 text-xs capitalize"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.payor ?? ""}
                                onChange={(e) => patchRow(idx, { payor: e.target.value || null })}
                                placeholder={isDefault ? "(any)" : "Payor name"}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.state ?? ""}
                                onChange={(e) => patchRow(idx, { state: e.target.value || null })}
                                placeholder="(any)"
                                maxLength={2}
                                className="h-8 text-xs uppercase"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={row.warning_offset_hours ?? 0}
                                onChange={(e) => patchRow(idx, { warning_offset_hours: Number(e.target.value) })}
                                className="h-8 text-xs"
                              />
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {formatHours(Number(row.warning_offset_hours ?? 0))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={row.critical_offset_hours ?? 0}
                                onChange={(e) => patchRow(idx, { critical_offset_hours: Number(e.target.value) })}
                                className="h-8 text-xs"
                              />
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {formatHours(Number(row.critical_offset_hours ?? 0))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={row.active ?? true}
                                onCheckedChange={(v) => patchRow(idx, { active: v })}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => saveRow(idx)}
                                  disabled={!row._dirty || saving === (row.id ?? "new")}
                                >
                                  {saving === (row.id ?? "new")
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Save className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-destructive"
                                  onClick={() => deleteRow(idx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No rules yet. Click <Globe2 className="h-3 w-3 inline" /> Add rule to create one.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}