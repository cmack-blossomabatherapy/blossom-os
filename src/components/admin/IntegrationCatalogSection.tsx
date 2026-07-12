import { useMemo, useState } from "react";
import { Plug, Plus, Pencil, Trash2, Search, PowerOff, Power, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useIntegrationCatalog,
  type IntegrationCatalogRow,
} from "@/hooks/useIntegrationCatalog";

const CATEGORY_OPTIONS = [
  "clinical_emr", "hris", "recruiting", "communications", "marketing",
  "ai_voice", "lead_capture", "eligibility", "documents", "meetings",
  "background_checks", "other",
];

const STATUS_OPTIONS = [
  { value: "configured", label: "Configured" },
  { value: "not_configured", label: "Not configured" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "maybe", label: "Maybe / Evaluating" },
  { value: "planned", label: "Planned" },
  { value: "disabled", label: "Disabled (hidden from dropdowns)" },
];

const CRITICALITY_OPTIONS = ["critical", "standard", "maybe", "internal"];

function statusTone(status: string) {
  switch (status) {
    case "configured": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    case "needs_attention": return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    case "disabled": return "bg-muted text-muted-foreground border-border";
    case "planned": return "bg-blue-500/15 text-blue-600 border-blue-500/30";
    default: return "bg-secondary text-secondary-foreground border-border";
  }
}

interface FormState {
  id: string;
  display_name: string;
  category: string;
  criticality: string;
  status: string;
  owner_department: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  display_name: "",
  category: "other",
  criticality: "standard",
  status: "configured",
  owner_department: "",
  notes: "",
};

/**
 * Catalog metadata management, formerly the standalone
 * /system/integration-registry page. Rendered inline within
 * /admin/integrations so admins have one place to manage every
 * integration and the registry keys that feed dropdowns across
 * Workflow Inventory, Issue Tracker, and Request Intake.
 */
export function IntegrationCatalogSection() {
  const { rows, loading, upsert, setStatus, remove } = useIntegrationCatalog();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IntegrationCatalogRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        r.id.toLowerCase().includes(needle) ||
        r.display_name.toLowerCase().includes(needle) ||
        r.category.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: IntegrationCatalogRow) => {
    setEditing(row);
    setForm({
      id: row.id,
      display_name: row.display_name,
      category: row.category,
      criticality: row.criticality,
      status: row.status,
      owner_department: row.owner_department ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.id.trim() || !form.display_name.trim()) {
      toast({ title: "Missing fields", description: "Registry key and display name are required.", variant: "destructive" });
      return;
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(form.id.trim())) {
      toast({ title: "Invalid key", description: "Use lowercase letters, numbers, dashes, and underscores.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      await upsert({
        id: form.id.trim(),
        display_name: form.display_name.trim(),
        category: form.category,
        criticality: form.criticality,
        status: form.status,
        owner_department: form.owner_department.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast({ title: editing ? "Integration updated" : "Integration added" });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDisabled = async (row: IntegrationCatalogRow) => {
    const next = row.status === "disabled" ? "configured" : "disabled";
    try {
      await setStatus(row.id, next);
      toast({
        title: next === "disabled" ? "Hidden from dropdowns" : "Re-enabled",
        description: `${row.display_name} is now ${next}.`,
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async (row: IntegrationCatalogRow) => {
    if (!window.confirm(`Delete integration "${row.display_name}"? This removes the registry key.`)) return;
    try {
      await remove(row.id);
      toast({ title: "Integration deleted" });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : String(e) + " — the key may still be referenced by workflows or issues.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between border-b border-border/60 pb-3"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
            <Plug className="size-4" strokeWidth={1.75} />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Catalog metadata
            </h2>
            <p className="text-xs text-muted-foreground">
              Registry keys used by Workflow Inventory, Issue Tracker, Request Intake, and readiness surfaces.
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <Card className="p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by key, name, or category"
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-56">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" /> Add registry entry
            </Button>
          </Card>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-[minmax(160px,1fr)_minmax(200px,1.4fr)_140px_140px_140px_180px] text-xs font-medium text-muted-foreground bg-muted/40 px-4 py-2 border-b border-border">
              <div>Registry key</div>
              <div>Display name</div>
              <div>Category</div>
              <div>Criticality</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading registry…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No integrations match.</div>
            ) : (
              filtered.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[minmax(160px,1fr)_minmax(200px,1.4fr)_140px_140px_140px_180px] items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/20"
                >
                  <code className="text-xs font-mono">{r.id}</code>
                  <div className="text-sm font-medium text-foreground">
                    {r.display_name}
                    {r.owner_department ? (
                      <div className="text-xs text-muted-foreground font-normal">{r.owner_department}</div>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.category}</div>
                  <div className="text-xs text-muted-foreground capitalize">{r.criticality}</div>
                  <div>
                    <Badge variant="outline" className={statusTone(r.status)}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDisabled(r)}
                      title={r.status === "disabled" ? "Re-enable" : "Disable (hide from dropdowns)"}
                    >
                      {r.status === "disabled" ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(r)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit integration" : "Add integration"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ir-id">Registry key</Label>
              <Input
                id="ir-id"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="e.g. centralreach"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, dashes, underscores. Used everywhere in code.
              </p>
            </div>
            <div>
              <Label htmlFor="ir-name">Display name</Label>
              <Input
                id="ir-name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="e.g. CentralReach"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Criticality</Label>
                <Select value={form.criticality} onValueChange={(v) => setForm({ ...form, criticality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRITICALITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ir-owner">Owner department (optional)</Label>
              <Input
                id="ir-owner"
                value={form.owner_department}
                onChange={(e) => setForm({ ...form, owner_department: e.target.value })}
                placeholder="e.g. Operations Leadership"
              />
            </div>
            <div>
              <Label htmlFor="ir-notes">Notes (optional)</Label>
              <Textarea
                id="ir-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add integration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default IntegrationCatalogSection;