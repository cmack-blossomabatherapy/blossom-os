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
  CAMPAIGN_STATUSES,
  type MarketingCampaignInsert,
  type MarketingCampaignRow,
  useMarketingCampaigns,
} from "@/hooks/useMarketingCampaigns";
import { CHANNEL_OPTIONS, SOURCE_SYSTEM_OPTIONS, useMarketingSources } from "@/hooks/useMarketingSources";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: MarketingCampaignRow | null;
}

export function CampaignFormDialog({ open, onOpenChange, editing }: Props) {
  const { createCampaign, updateCampaign } = useMarketingCampaigns();
  const { sources } = useMarketingSources();

  const [form, setForm] = useState<MarketingCampaignInsert>({ name: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setForm({ ...editing });
    else setForm({ name: "", status: "draft" });
  }, [editing, open]);

  const set = <K extends keyof MarketingCampaignInsert>(k: K, v: MarketingCampaignInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateCampaign(editing.id, form);
      else await createCampaign(form);
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit campaign" : "Create campaign"}</DialogTitle>
          <DialogDescription>Persists to <code>marketing_campaigns</code>.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Name *</Label>
            <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status ?? "draft"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAMPAIGN_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={form.channel ?? ""} onValueChange={(v) => set("channel", v)}>
              <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source system</Label>
            <Select value={form.source_system ?? ""} onValueChange={(v) => set("source_system", v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {SOURCE_SYSTEM_OPTIONS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linked source</Label>
            <Select value={form.source_id ?? "none"} onValueChange={(v) => set("source_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">- none -</SelectItem>
                {sources.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} />
          </div>
          <div>
            <Label>Budget ($)</Label>
            <Input
              type="number" min={0}
              value={form.budget_cents != null ? Math.round((form.budget_cents ?? 0) / 100) : ""}
              onChange={(e) => set("budget_cents", e.target.value ? Math.round(Number(e.target.value) * 100) : null)}
            />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value || null)} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} />
          </div>
          <div>
            <Label>External ID</Label>
            <Input value={form.external_id ?? ""} onChange={(e) => set("external_id", e.target.value || null)} />
          </div>
          <div><Label>UTM source</Label><Input value={form.utm_source ?? ""} onChange={(e) => set("utm_source", e.target.value || null)} /></div>
          <div><Label>UTM medium</Label><Input value={form.utm_medium ?? ""} onChange={(e) => set("utm_medium", e.target.value || null)} /></div>
          <div><Label>UTM campaign</Label><Input value={form.utm_campaign ?? ""} onChange={(e) => set("utm_campaign", e.target.value || null)} /></div>
          <div><Label>UTM term</Label><Input value={form.utm_term ?? ""} onChange={(e) => set("utm_term", e.target.value || null)} /></div>
          <div className="col-span-2"><Label>UTM content</Label><Input value={form.utm_content ?? ""} onChange={(e) => set("utm_content", e.target.value || null)} /></div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.name?.trim()}>
            {saving ? "Saving..." : editing ? "Save changes" : "Create campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}