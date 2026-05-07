import { useEffect, useMemo, useState } from "react";
import { Bell, Save, Lock } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

type Channels = { in_app: boolean; email: boolean };
type Recipients = { assignee: boolean; supervisor: boolean; hr_admin: boolean };
type EventCfg = { enabled: boolean; channels: ("in_app" | "email")[]; lead_days?: number };
type TrainingNotif = {
  enabled: boolean;
  channels: Channels;
  recipients: Recipients;
  events: Record<string, EventCfg>;
  digest: { enabled: boolean; frequency: "daily" | "weekly"; day: string; hour: number };
  quiet_hours: { enabled: boolean; start: string; end: string };
};

const DEFAULT_TRAINING: TrainingNotif = {
  enabled: true,
  channels: { in_app: true, email: true },
  recipients: { assignee: true, supervisor: false, hr_admin: true },
  events: {
    assigned:      { enabled: true,  channels: ["in_app", "email"] },
    due_soon:      { enabled: true,  channels: ["in_app", "email"], lead_days: 3 },
    overdue:       { enabled: true,  channels: ["in_app", "email"] },
    completed:     { enabled: true,  channels: ["in_app"] },
    quiz_failed:   { enabled: true,  channels: ["in_app", "email"] },
    cert_expiring: { enabled: true,  channels: ["in_app", "email"], lead_days: 30 },
    new_course:    { enabled: false, channels: ["in_app"] },
  },
  digest:      { enabled: false, frequency: "weekly", day: "mon", hour: 8 },
  quiet_hours: { enabled: false, start: "20:00", end: "07:00" },
};

const EVENT_META: { key: keyof TrainingNotif["events"]; label: string; description: string; hasLeadDays?: boolean }[] = [
  { key: "assigned",      label: "Training Assigned",        description: "When a course or track is newly assigned to an employee." },
  { key: "due_soon",      label: "Due Soon Reminder",        description: "Reminder before a training's due date.", hasLeadDays: true },
  { key: "overdue",       label: "Overdue Alert",            description: "When an assignment passes its due date." },
  { key: "completed",     label: "Completion Confirmation",  description: "When an employee finishes a course or passes a quiz." },
  { key: "quiz_failed",   label: "Quiz Failed",              description: "When a quiz attempt does not meet the passing score." },
  { key: "cert_expiring", label: "Certification Expiring",   description: "Before a certification (CPR, BACB, etc.) expires.", hasLeadDays: true },
  { key: "new_course",    label: "New Course Published",     description: "When a new course is published to a relevant role." },
];

export default function NotificationSettings() {
  const { hasPerm, user } = useAuth();
  const canEdit = hasPerm("hr.settings.manage");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TrainingNotif>(DEFAULT_TRAINING);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("hr_settings").select("value").eq("key", "notifications.training").maybeSingle();
    if (data?.value) {
      setDraft({ ...DEFAULT_TRAINING, ...(data.value as unknown as Partial<TrainingNotif>) });
    }
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("hr_settings").upsert({
      key: "notifications.training",
      value: draft as unknown as Json,
      description: "Notification rules for training assignments, due dates, completions, and certifications.",
      updated_by: user?.id ?? null,
      updated_by_name: user?.email ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notification settings saved.");
  }

  const set = <K extends keyof TrainingNotif>(k: K, v: TrainingNotif[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setEvent = (key: string, patch: Partial<EventCfg>) =>
    setDraft((d) => ({ ...d, events: { ...d.events, [key]: { ...d.events[key], ...patch } } }));
  const toggleEventChannel = (key: string, ch: "in_app" | "email") => {
    const cur = draft.events[key]?.channels ?? [];
    const next = cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch];
    setEvent(key, { channels: next });
  };

  if (loading) {
    return (
      <PageShell title="Notification Center" description="Configure when and how the HR Suite sends notifications." icon={Bell}>
        <Skeleton className="h-96" />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Notification Center"
      description="Configure when and how the HR Suite sends notifications."
      icon={Bell}
      actions={canEdit ? (
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</Button>
      ) : null}
    >
      <Tabs defaultValue="training" className="w-full">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar">
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="onboarding" disabled>Onboarding <Badge variant="secondary" className="ml-2">Soon</Badge></TabsTrigger>
          <TabsTrigger value="reviews" disabled>Reviews <Badge variant="secondary" className="ml-2">Soon</Badge></TabsTrigger>
          <TabsTrigger value="time" disabled>Time & Hours <Badge variant="secondary" className="ml-2">Soon</Badge></TabsTrigger>
          <TabsTrigger value="payroll" disabled>Payroll <Badge variant="secondary" className="ml-2">Soon</Badge></TabsTrigger>
          <TabsTrigger value="announcements" disabled>Announcements <Badge variant="secondary" className="ml-2">Soon</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4 mt-4">
          {/* Master toggle */}
          <Card className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Training notifications</h3>
                <p className="text-xs text-muted-foreground mt-1">Master switch for all training-related notifications. Per-event rules below still apply when on.</p>
              </div>
              <Switch checked={draft.enabled} onCheckedChange={(v) => set("enabled", v)} disabled={!canEdit} />
            </div>
          </Card>

          {/* Default channels */}
          <Card className="p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Default delivery channels</h3>
            <p className="text-xs text-muted-foreground mb-4">Channels available across all training events. Disable a channel here to turn it off everywhere.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ChannelRow label="In-app notifications" checked={draft.channels.in_app} onChange={(v) => set("channels", { ...draft.channels, in_app: v })} disabled={!canEdit} />
              <ChannelRow label="Email" checked={draft.channels.email} onChange={(v) => set("channels", { ...draft.channels, email: v })} disabled={!canEdit} />
            </div>
          </Card>

          {/* Recipients */}
          <Card className="p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Default recipients</h3>
            <p className="text-xs text-muted-foreground mb-4">Who receives training notifications by default.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ChannelRow label="Assignee (employee)" checked={draft.recipients.assignee} onChange={(v) => set("recipients", { ...draft.recipients, assignee: v })} disabled={!canEdit} />
              <ChannelRow label="Supervisor" checked={draft.recipients.supervisor} onChange={(v) => set("recipients", { ...draft.recipients, supervisor: v })} disabled={!canEdit} />
              <ChannelRow label="HR admins" checked={draft.recipients.hr_admin} onChange={(v) => set("recipients", { ...draft.recipients, hr_admin: v })} disabled={!canEdit} />
            </div>
          </Card>

          {/* Event rules */}
          <Card className="p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Event rules</h3>
            <p className="text-xs text-muted-foreground mb-4">Toggle individual notifications and pick the channels they go through.</p>
            <div className="divide-y">
              {EVENT_META.map((evt) => {
                const cfg = draft.events[evt.key] ?? { enabled: false, channels: [] };
                return (
                  <div key={evt.key} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center">
                    <div className="md:col-span-5">
                      <div className="text-sm font-medium text-foreground">{evt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{evt.description}</div>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Switch checked={cfg.enabled} onCheckedChange={(v) => setEvent(evt.key, { enabled: v })} disabled={!canEdit || !draft.enabled} />
                      <span className="text-xs text-muted-foreground">{cfg.enabled ? "On" : "Off"}</span>
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2 flex-wrap">
                      <ChannelChip label="In-app" active={cfg.channels.includes("in_app")} onToggle={() => toggleEventChannel(evt.key, "in_app")} disabled={!canEdit || !cfg.enabled || !draft.channels.in_app} />
                      <ChannelChip label="Email" active={cfg.channels.includes("email")} onToggle={() => toggleEventChannel(evt.key, "email")} disabled={!canEdit || !cfg.enabled || !draft.channels.email} />
                    </div>
                    <div className="md:col-span-2">
                      {evt.hasLeadDays ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={String(cfg.lead_days ?? 0)}
                            onChange={(e) => setEvent(evt.key, { lead_days: parseInt(e.target.value) || 0 })}
                            disabled={!canEdit || !cfg.enabled}
                            className="h-8"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Digest */}
          <Card className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Manager digest</h3>
                <p className="text-xs text-muted-foreground mt-1">Roll up training activity into a single recurring email for HR admins and supervisors.</p>
              </div>
              <Switch checked={draft.digest.enabled} onCheckedChange={(v) => set("digest", { ...draft.digest, enabled: v })} disabled={!canEdit} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Frequency</Label>
                <Select value={draft.digest.frequency} onValueChange={(v) => set("digest", { ...draft.digest, frequency: v as "daily" | "weekly" })} disabled={!canEdit || !draft.digest.enabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Day of week</Label>
                <Select value={draft.digest.day} onValueChange={(v) => set("digest", { ...draft.digest, day: v })} disabled={!canEdit || !draft.digest.enabled || draft.digest.frequency === "daily"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["mon","tue","wed","thu","fri","sat","sun"].map((d) => <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Send hour (24h, local)</Label>
                <Input type="number" min={0} max={23} value={String(draft.digest.hour)} onChange={(e) => set("digest", { ...draft.digest, hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0)) })} disabled={!canEdit || !draft.digest.enabled} />
              </div>
            </div>
          </Card>

          {/* Quiet hours */}
          <Card className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Quiet hours</h3>
                <p className="text-xs text-muted-foreground mt-1">Suppress non-urgent notifications during this window. Overdue and quiz-failed alerts always send.</p>
              </div>
              <Switch checked={draft.quiet_hours.enabled} onCheckedChange={(v) => set("quiet_hours", { ...draft.quiet_hours, enabled: v })} disabled={!canEdit} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Start</Label>
                <Input type="time" value={draft.quiet_hours.start} onChange={(e) => set("quiet_hours", { ...draft.quiet_hours, start: e.target.value })} disabled={!canEdit || !draft.quiet_hours.enabled} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input type="time" value={draft.quiet_hours.end} onChange={(e) => set("quiet_hours", { ...draft.quiet_hours, end: e.target.value })} disabled={!canEdit || !draft.quiet_hours.enabled} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {(["onboarding","reviews","time","payroll","announcements"] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <ComingSoon area={t} />
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}

function ChannelRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-card px-3 py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function ChannelChip({ label, active, onToggle, disabled }: { label: string; active: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`text-xs px-2.5 py-1 rounded-full border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
}

function ComingSoon({ area }: { area: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground capitalize">{area} notifications — Coming soon</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
        This area will host notification rules for {area}. The framework is in place — controls will light up once the underlying events are wired in.
      </p>
    </Card>
  );
}