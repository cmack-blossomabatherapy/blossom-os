import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Search, Save, X, Copy, Power, PowerOff } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AUTOMATED_EMAIL_REGISTRY,
  type TemplateRegistryEntry,
  type TemplateChannel,
} from "@/lib/integrations/communications/templateRegistry";

interface TemplateRow {
  template_key: string;
  channel: TemplateChannel;
  display_name: string;
  description: string | null;
  used_in: string | null;
  subject: string | null;
  body: string;
  provider: string | null;
  stage: string | null;
  use_case: string | null;
  team: string | null;
  merge_fields: string[];
  is_active: boolean;
}

type MergedTemplate = TemplateRow & {
  hasDbRow: boolean;
  registryEntry?: TemplateRegistryEntry;
};

const TABLE = "intake_communication_templates" as never;

function rowFromRegistry(t: TemplateRegistryEntry): TemplateRow {
  const text = `${t.subject ?? ""}\n${t.body}`;
  const mergeFields = Array.from(
    new Set(Array.from(text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map((m) => m[1])),
  );
  return {
    template_key: String(t.key),
    channel: t.channel,
    display_name: t.displayName,
    description: t.description,
    used_in: t.usedIn,
    subject: t.subject ?? null,
    body: t.body,
    provider: t.provider,
    stage: null,
    use_case: null,
    team: null,
    merge_fields: mergeFields,
    is_active: true,
  };
}

export default function IntakeTemplatesManager() {
  const [rows, setRows] = useState<Record<string, TemplateRow>>({});
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | TemplateChannel>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selected, setSelected] = useState<MergedTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TemplateRow | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "template_key,channel,display_name,description,used_in,subject,body,provider,stage,use_case,team,merge_fields,is_active",
      );
    if (error) {
      toast.error("Could not load templates", { description: error.message });
      return;
    }
    const map: Record<string, TemplateRow> = {};
    for (const r of (data ?? []) as unknown as TemplateRow[]) {
      map[`${r.channel}:${r.template_key}`] = {
        ...r,
        merge_fields: Array.isArray(r.merge_fields) ? r.merge_fields : [],
      };
    }
    setRows(map);
  }

  const merged: MergedTemplate[] = useMemo(() => {
    const seen = new Set<string>();
    const out: MergedTemplate[] = [];
    for (const t of AUTOMATED_EMAIL_REGISTRY) {
      const id = `${t.channel}:${String(t.key)}`;
      seen.add(id);
      const dbRow = rows[id];
      const base = dbRow ?? rowFromRegistry(t);
      out.push({ ...base, hasDbRow: !!dbRow, registryEntry: t });
    }
    // Include DB-only rows (custom templates admins created but not in code registry).
    for (const [id, r] of Object.entries(rows)) {
      if (!seen.has(id)) out.push({ ...r, hasDbRow: true });
    }
    return out;
  }, [rows]);

  const teams = useMemo(
    () => Array.from(new Set(merged.map((r) => r.team).filter(Boolean) as string[])).sort(),
    [merged],
  );
  const stages = useMemo(
    () => Array.from(new Set(merged.map((r) => r.stage).filter(Boolean) as string[])).sort(),
    [merged],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return merged.filter((r) => {
      if (channelFilter !== "all" && r.channel !== channelFilter) return false;
      if (teamFilter !== "all" && r.team !== teamFilter) return false;
      if (stageFilter !== "all" && r.stage !== stageFilter) return false;
      if (activeFilter === "active" && !r.is_active) return false;
      if (activeFilter === "inactive" && r.is_active) return false;
      if (!q) return true;
      return [r.display_name, r.description, r.used_in, r.template_key, r.subject ?? "", r.body]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [merged, search, channelFilter, teamFilter, stageFilter, activeFilter]);

  function openTemplate(t: MergedTemplate) {
    setSelected(t);
    setDraft({ ...t });
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = {
        template_key: draft.template_key,
        channel: draft.channel,
        display_name: draft.display_name,
        description: draft.description,
        used_in: draft.used_in,
        subject: draft.channel === "email" ? draft.subject : null,
        body: draft.body,
        provider: draft.provider,
        stage: draft.stage,
        use_case: draft.use_case,
        team: draft.team,
        merge_fields: draft.merge_fields,
        is_active: draft.is_active,
      };
      const { error } = await supabase
        .from(TABLE)
        .upsert(payload as never, { onConflict: "channel,template_key" });
      if (error) throw error;
      toast.success(`${draft.display_name} saved`);
      setSelected(null);
      setDraft(null);
      await load();
    } catch (e: any) {
      toast.error("Could not save template", {
        description: e?.message ?? "Super Admin or Systems Admin role required.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: MergedTemplate, next: boolean) {
    try {
      const payload = {
        template_key: t.template_key,
        channel: t.channel,
        display_name: t.display_name,
        description: t.description,
        used_in: t.used_in,
        subject: t.channel === "email" ? t.subject : null,
        body: t.body,
        provider: t.provider,
        stage: t.stage,
        use_case: t.use_case,
        team: t.team,
        merge_fields: t.merge_fields,
        is_active: next,
      };
      const { error } = await supabase
        .from(TABLE)
        .upsert(payload as never, { onConflict: "channel,template_key" });
      if (error) throw error;
      toast.success(next ? "Template activated" : "Template deactivated");
      await load();
    } catch (e: any) {
      toast.error("Could not update template", { description: e?.message });
    }
  }

  async function copyBody(t: MergedTemplate) {
    try {
      const subject = t.channel === "email" && t.subject ? `Subject: ${t.subject}\n\n` : "";
      await navigator.clipboard.writeText(`${subject}${t.body}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard copy failed");
    }
  }

  return (
    <PageShell
      title="Intake Templates"
      description="Approved copy for every automated email and SMS Blossom OS may draft for families. Editing here does not send — sends still require an operator action."
      icon={Mail}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Team" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[11px] ml-auto">
          {filtered.length} of {merged.length} templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((t) => (
          <div
            key={`${t.channel}:${t.template_key}`}
            className="rounded-xl border border-border/60 bg-card p-4 hover:bg-muted/40 transition"
          >
            <button className="w-full text-left" onClick={() => openTemplate(t)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.display_name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    {t.channel === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    {t.channel === "email" ? "Email" : "SMS"}
                  </Badge>
                  {!t.is_active && (
                    <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                      Inactive
                    </Badge>
                  )}
                  {t.hasDbRow && t.is_active && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20" variant="outline">
                      Saved
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                {t.stage && <p className="text-muted-foreground"><span className="font-medium text-foreground">Stage:</span> {t.stage}</p>}
                {t.team && <p className="text-muted-foreground"><span className="font-medium text-foreground">Team:</span> {t.team}</p>}
                {t.use_case && <p className="text-muted-foreground"><span className="font-medium text-foreground">Use case:</span> {t.use_case}</p>}
                {t.merge_fields.length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Merge fields:</span>{" "}
                    {t.merge_fields.map((f) => `{{${f}}}`).join(", ")}
                  </p>
                )}
              </div>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copyBody(t)}>
                <Copy className="h-3 w-3 mr-1.5" /> Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => toggleActive(t, !t.is_active)}
              >
                {t.is_active ? <PowerOff className="h-3 w-3 mr-1.5" /> : <Power className="h-3 w-3 mr-1.5" />}
                {t.is_active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet
        open={!!selected}
        onOpenChange={(o) => { if (!o) { setSelected(null); setDraft(null); } }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
          {selected && draft && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.channel === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  {selected.display_name}
                </SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Channel:</span> {selected.channel}</p>
                  <p><span className="font-medium text-foreground">Template key:</span> {selected.template_key}</p>
                  <p><span className="font-medium text-foreground">Used in:</span> {selected.used_in ?? "—"}</p>
                  <p><span className="font-medium text-foreground">Provider:</span> {selected.provider ?? "—"}</p>
                  <p><span className="font-medium text-foreground">Merge fields:</span>{" "}
                    {selected.merge_fields.length ? selected.merge_fields.map((f) => `{{${f}}}`).join(", ") : "—"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Stage</Label>
                    <Input value={draft.stage ?? ""} onChange={(e) => setDraft({ ...draft, stage: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Team</Label>
                    <Input value={draft.team ?? ""} onChange={(e) => setDraft({ ...draft, team: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Use case</Label>
                    <Input value={draft.use_case ?? ""} onChange={(e) => setDraft({ ...draft, use_case: e.target.value })} className="mt-1" />
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <Label className="text-xs block mb-1">Active</Label>
                      <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                    </div>
                    <p className="text-[10px] text-muted-foreground pb-1">
                      Inactive templates are not approved for automated use.
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Merge fields (comma separated)</Label>
                  <Input
                    value={draft.merge_fields.join(", ")}
                    onChange={(e) => setDraft({
                      ...draft,
                      merge_fields: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })}
                    className="mt-1"
                  />
                </div>
                {selected.channel === "email" && (
                  <div>
                    <Label className="text-xs">Subject</Label>
                    <Input
                      value={draft.subject ?? ""}
                      onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Body</Label>
                  <Textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    rows={14}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" onClick={() => { setSelected(null); setDraft(null); }} disabled={saving}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
                </Button>
                <Button onClick={saveDraft} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}