import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Search, Save, X } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AUTOMATED_EMAIL_REGISTRY,
  type TemplateRegistryEntry,
} from "@/lib/integrations/communications/templateRegistry";

interface OverrideRow {
  template_key: string;
  channel: string;
  subject: string | null;
  body: string;
}

export default function AutomatedEmailsPage() {
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<Record<string, OverrideRow>>({});
  const [selected, setSelected] = useState<TemplateRegistryEntry | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void loadOverrides(); }, []);

  async function loadOverrides() {
    const { data, error } = await supabase
      .from("email_templates")
      .select("template_key,channel,subject,body");
    if (error) {
      return;
    }
    const map: Record<string, OverrideRow> = {};
    for (const row of (data ?? []) as OverrideRow[]) {
      map[`${row.channel}:${row.template_key}`] = row;
    }
    setOverrides(map);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return AUTOMATED_EMAIL_REGISTRY;
    return AUTOMATED_EMAIL_REGISTRY.filter((t) =>
      [t.displayName, t.description, t.usedIn, t.key, t.subject ?? "", t.body]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search]);

  function effective(t: TemplateRegistryEntry) {
    const ov = overrides[`${t.channel}:${t.key}`];
    return {
      subject: ov?.subject ?? t.subject ?? "",
      body: ov?.body ?? t.body,
      isOverridden: !!ov,
    };
  }

  function openTemplate(t: TemplateRegistryEntry) {
    const eff = effective(t);
    setSelected(t);
    setEditSubject(eff.subject);
    setEditBody(eff.body);
  }

  async function saveTemplate() {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        template_key: selected.key,
        channel: selected.channel,
        display_name: selected.displayName,
        description: selected.description,
        used_in: selected.usedIn,
        subject: selected.channel === "email" ? editSubject : null,
        body: editBody,
        provider: selected.provider,
      };
      const { error } = await supabase
        .from("email_templates")
        .upsert(payload as never, { onConflict: "template_key" });
      if (error) throw error;
      toast.success(`${selected.displayName} saved`);
      setSelected(null);
      await loadOverrides();
    } catch (e: any) {
      toast.error("Could not save template", { description: e?.message ?? "Admin role required." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Automated Emails"
      description="Every automated message Blossom OS sends to families. Edit the copy here — sends use these templates."
      icon={Mail}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, use, or body…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Badge variant="outline" className="text-[11px]">
          {AUTOMATED_EMAIL_REGISTRY.length} templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((t) => {
          const eff = effective(t);
          return (
            <button
              key={`${t.channel}:${t.key}`}
              onClick={() => openTemplate(t)}
              className="text-left rounded-xl border border-border/60 bg-card p-4 hover:bg-muted/40 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.displayName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    {t.channel === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    {t.channel === "email" ? "Email" : "SMS"}
                  </Badge>
                  {eff.isOverridden && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20" variant="outline">
                      Edited
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <p className="text-muted-foreground"><span className="font-medium text-foreground">Used in:</span> {t.usedIn}</p>
                <p className="text-muted-foreground"><span className="font-medium text-foreground">Provider:</span> {t.provider}</p>
                {t.channel === "email" && eff.subject && (
                  <p className="text-muted-foreground truncate"><span className="font-medium text-foreground">Subject:</span> {eff.subject}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.channel === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  {selected.displayName}
                </SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
                  <p><span className="font-medium text-foreground">Used in:</span> {selected.usedIn}</p>
                  <p><span className="font-medium text-foreground">Provider:</span> {selected.provider}</p>
                  <p className="mt-1">Variables: <code>{"{{parent_first_name}}"}</code>, <code>{"{{patient_first_name}}"}</code>, <code>{"{{intake_coordinator_name}}"}</code></p>
                </div>
                {selected.channel === "email" && (
                  <div>
                    <Label className="text-xs">Subject</Label>
                    <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="mt-1" />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Body</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={14}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={saving}>
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