import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Mail, Plus, Save, Trash2, RotateCcw, Link2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { resolveJourney, type TrainingModule } from "@/data/journey";
import {
  applyModuleOverrides, deleteModuleOverride, getStoredModuleOverrides,
  JOURNEY_MODULE_OVERRIDES_EVENT, upsertModuleOverride,
  type JourneyAudienceKey, type ModuleLinkOverride,
} from "@/data/journeyModuleOverrides";

function getModulesFor(audience: JourneyAudienceKey): TrainingModule[] {
  const key = audience === "bcba" ? "bcba" : "rbt-uncertified";
  const { data } = resolveJourney({ override: key });
  return applyModuleOverrides(data.modules, audience);
}

interface Props {
  canManage: boolean;
}

export function JourneyModulesPanel({ canManage }: Props) {
  const [audience, setAudience] = useState<JourneyAudienceKey>("rbt");
  const [modules, setModules] = useState<TrainingModule[]>(() => getModulesFor("rbt"));
  const [editing, setEditing] = useState<TrainingModule | null>(null);

  useEffect(() => {
    const refresh = () => setModules(getModulesFor(audience));
    refresh();
    window.addEventListener(JOURNEY_MODULE_OVERRIDES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_MODULE_OVERRIDES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [audience]);

  const overriddenIds = useMemo(
    () => new Set(getStoredModuleOverrides().filter((o) => o.audience === audience).map((o) => o.id)),
    [audience, modules],
  );

  const handleReset = (m: TrainingModule) => {
    if (!canManage) return;
    deleteModuleOverride(m.id, audience);
    toast.success(`Reset "${m.title}" to defaults`);
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">RBT &amp; BCBA Module Editor</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit links, coordinator contact info, and the "more information" body shown inside each module on the Training Hub.
          </p>
        </div>
        <StatusBadge status={`${overriddenIds.size} customized`} variant="default" />
      </div>

      <Tabs value={audience} onValueChange={(v) => setAudience(v as JourneyAudienceKey)} className="mt-4">
        <TabsList>
          <TabsTrigger value="rbt">RBT modules</TabsTrigger>
          <TabsTrigger value="bcba">BCBA modules</TabsTrigger>
        </TabsList>
        <TabsContent value={audience} className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((m) => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.category} · {m.estMinutes} min</p>
                  </div>
                  {overriddenIds.has(m.id) && <StatusBadge status="Customized" variant="info" />}
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1"><Link2 className="h-3 w-3" /> {(m.links ?? []).length} link{(m.links ?? []).length === 1 ? "" : "s"}</div>
                  <div className="flex items-center gap-1"><User className="h-3 w-3" /> {m.coordinatorName ?? "—"}</div>
                  <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.coordinatorEmail ?? "—"}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(m)} disabled={!canManage}>Edit</Button>
                  {overriddenIds.has(m.id) && (
                    <Button size="sm" variant="ghost" onClick={() => handleReset(m)} disabled={!canManage}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {editing && (
        <ModuleEditDialog
          module={editing}
          audience={audience}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function ModuleEditDialog({
  module, audience, onClose,
}: { module: TrainingModule; audience: JourneyAudienceKey; onClose: () => void }) {
  const [coordinatorName, setCoordinatorName] = useState(module.coordinatorName ?? "");
  const [coordinatorEmail, setCoordinatorEmail] = useState(module.coordinatorEmail ?? "");
  const [coordinatorRole, setCoordinatorRole] = useState(module.coordinatorRole ?? "");
  const [moreInfo, setMoreInfo] = useState(module.moreInfo ?? "");
  const [links, setLinks] = useState<ModuleLinkOverride[]>(
    (module.links ?? []).map((l) => ({ label: l.label, url: l.url, description: l.description })),
  );

  const updateLink = (i: number, patch: Partial<ModuleLinkOverride>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLink = () => setLinks([...links, { label: "", url: "" }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const cleanedLinks = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim(), description: l.description?.trim() || undefined }))
      .filter((l) => l.label && l.url);
    upsertModuleOverride({
      id: module.id,
      audience,
      links: cleanedLinks,
      coordinatorName: coordinatorName.trim() || undefined,
      coordinatorEmail: coordinatorEmail.trim() || undefined,
      coordinatorRole: coordinatorRole.trim() || undefined,
      moreInfo: moreInfo.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Updated "${module.title}"`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit module: {module.title}</DialogTitle>
          <DialogDescription>
            Changes apply to the {audience === "rbt" ? "RBT" : "BCBA"} Training Hub for all viewers. Reset to revert to defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Coordinator name</Label>
              <Input value={coordinatorName} onChange={(e) => setCoordinatorName(e.target.value)} className="mt-1" placeholder="Rebecca Bailey" />
            </div>
            <div>
              <Label>Coordinator role</Label>
              <Input value={coordinatorRole} onChange={(e) => setCoordinatorRole(e.target.value)} className="mt-1" placeholder="Training Coordinator" />
            </div>
            <div className="sm:col-span-2">
              <Label>Coordinator email</Label>
              <Input type="email" value={coordinatorEmail} onChange={(e) => setCoordinatorEmail(e.target.value)} className="mt-1" placeholder="training@blossomaba.com" />
            </div>
          </div>

          <div>
            <Label>More information</Label>
            <Textarea value={moreInfo} onChange={(e) => setMoreInfo(e.target.value)} className="mt-1 min-h-32" placeholder="Longer description shown inside the module dialog…" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Links</Label>
              <Button size="sm" variant="outline" onClick={addLink}>
                <Plus className="mr-1 h-3.5 w-3.5" />Add link
              </Button>
            </div>
            <div className="mt-2 space-y-3">
              {links.length === 0 && (
                <p className="text-xs text-muted-foreground">No links yet. Add one to make it visible inside the module dialog.</p>
              )}
              {links.map((l, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} placeholder="Label" />
                    <Input value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} placeholder="https://…" />
                  </div>
                  <Input value={l.description ?? ""} onChange={(e) => updateLink(i, { description: e.target.value })} placeholder="Description (optional)" />
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => removeLink(i)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" />Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Save className="mr-1 h-4 w-4" />Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}