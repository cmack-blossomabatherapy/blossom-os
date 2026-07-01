import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  CHANNEL_OPTIONS,
  SOURCE_SYSTEM_OPTIONS,
  type MarketingSourceInsert,
  type MarketingSourceRow,
  useMarketingSources,
} from "@/hooks/useMarketingSources";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: MarketingSourceRow | null;
}

export function SourceFormDialog({ open, onOpenChange, editing }: Props) {
  const { createSource, updateSource } = useMarketingSources();
  const [form, setForm] = useState<MarketingSourceInsert>({ name: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setForm({ ...editing });
    else setForm({ name: "", is_active: true });
  }, [editing, open]);

  const set = <K extends keyof MarketingSourceInsert>(k: K, v: MarketingSourceInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateSource(editing.id, form);
      else await createSource(form);
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit source" : "Add source"}</DialogTitle>
          <DialogDescription>Persists to <code>marketing_sources</code>.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Name *</Label>
            <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Source system</Label>
            <Select value={form.source_system ?? ""} onValueChange={(v) => set("source_system", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SOURCE_SYSTEM_OPTIONS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={form.channel ?? ""} onValueChange={(v) => set("channel", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} />
          </div>
          <div>
            <Label>External ID</Label>
            <Input value={form.external_id ?? ""} onChange={(e) => set("external_id", e.target.value || null)} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              id="src-active" type="checkbox" checked={!!form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
            />
            <Label htmlFor="src-active" className="!m-0">Active</Label>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.name?.trim()}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}