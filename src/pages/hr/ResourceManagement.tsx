import { useMemo, useState } from "react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, Upload, FolderPlus, Sparkles, Pin, Archive, Edit3,
  Send, Users2, MapPin, Tag, FileText, X, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resources as seedResources, resourceCategories, categoryById,
  formatRelative, TYPE_ICON, TYPE_TONE, roleLabel,
  type Resource, type ResourceCategoryId, type ResourceStatus, type ResourceType,
} from "@/lib/resources/resourceData";
import type { OSRole } from "@/lib/os/permissions";
import { toast } from "@/hooks/use-toast";

const ALL_ROLES: OSRole[] = [
  "intake_coordinator","authorization_coordinator","scheduling_team","recruiting_team",
  "hr_team","billing_finance","qa_team","bcba","rbt",
  "state_director","operations_leadership","executive_leadership","marketing_team",
];

const STATES = ["GA","NC","VA","TN","MD","FL","TX","SC"];

export default function ResourceManagement() {
  const [items, setItems] = useState<Resource[]>(seedResources);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<ResourceCategoryId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    return items.filter((r) => {
      if (activeCat !== "all" && r.category !== activeCat) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!s) return true;
      return (
        r.title.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.tags.some((t) => t.toLowerCase().includes(s))
      );
    });
  }, [items, query, activeCat, statusFilter]);

  const counts = {
    total: items.length,
    published: items.filter((r) => r.status === "Published").length,
    drafts: items.filter((r) => r.status === "Draft").length,
    archived: items.filter((r) => r.status === "Archived").length,
  };

  const handleCreate = (r: Resource) => {
    setItems((prev) => [r, ...prev]);
    toast({ title: "Resource added", description: r.title });
  };

  const togglePin = (id: string) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)));
  };
  const archive = (id: string) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Archived" as ResourceStatus } : r)));
    toast({ title: "Resource archived" });
    setSelected(null);
  };

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] space-y-8">
        {/* HEADER */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              HR Suite · Resource Management
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight text-foreground md:text-[32px]">
              Manage operational knowledge for the company.
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">
              Add, organize, and assign SOPs, workflows, templates, and operational resources across Blossom.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline"><FolderPlus className="mr-2 h-4 w-4" />Create Category</Button>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload File</Button>
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Resource</Button>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total resources" value={counts.total} />
          <StatCard label="Published" value={counts.published} tone="emerald" />
          <StatCard label="Drafts" value={counts.drafts} tone="amber" />
          <StatCard label="Archived" value={counts.archived} tone="slate" />
        </div>

        {/* MAIN */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr_320px]">
          {/* LEFT — categories */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Categories
              </div>
              <div className="mt-3 space-y-1">
                <CatBtn label="All resources" count={items.length} active={activeCat === "all"} onClick={() => setActiveCat("all")} />
                {resourceCategories.map((c) => (
                  <CatBtn
                    key={c.id}
                    label={c.name}
                    count={items.filter((r) => r.category === c.id).length}
                    active={activeCat === c.id}
                    onClick={() => setActiveCat(c.id)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Status</div>
              <div className="mt-3 space-y-1">
                {(["all","Published","Draft","Archived"] as const).map((s) => (
                  <CatBtn
                    key={s}
                    label={s === "all" ? "All statuses" : s}
                    count={s === "all" ? items.length : items.filter((r) => r.status === s).length}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s as any)}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER — table */}
          <div className="space-y-4 min-w-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources by title, tag, or description…"
                className="h-10 rounded-xl border-border/70 bg-card pl-9 text-[13.5px]"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <table className="w-full">
                <thead className="bg-muted/40 text-[11.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Resource</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Assigned to</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Updated</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const Icon = TYPE_ICON[r.type];
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className={cn(
                          "cursor-pointer border-t border-border/50 text-[13px] transition-colors hover:bg-muted/30",
                          selected?.id === r.id && "bg-muted/50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", TYPE_TONE[r.type])}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                {r.title}
                                {r.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                              </div>
                              <div className="truncate text-[11.5px] text-muted-foreground">{r.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{categoryById(r.category).name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.roles.length === 0 ? (
                              <Badge variant="secondary" className="rounded-full text-[10.5px] font-normal">All roles</Badge>
                            ) : (
                              <>
                                {r.roles.slice(0, 2).map((role) => (
                                  <Badge key={role} variant="secondary" className="rounded-full text-[10.5px] font-normal">
                                    {roleLabel(role)}
                                  </Badge>
                                ))}
                                {r.roles.length > 2 && (
                                  <Badge variant="secondary" className="rounded-full text-[10.5px] font-normal">
                                    +{r.roles.length - 2}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">{formatRelative(r.updatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]">Edit</Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                        No resources match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — detail / AI */}
          <aside className="space-y-4">
            {selected ? (
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Resource detail
                    </div>
                    <div className="mt-1 text-[15px] font-semibold text-foreground">{selected.title}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-[12.5px] text-muted-foreground">{selected.description}</p>

                <div className="mt-4 space-y-2 text-[12px]">
                  <Row icon={FileText} label="Category" value={categoryById(selected.category).name} />
                  <Row icon={Tag} label="Type" value={selected.type} />
                  <Row icon={Users2} label="Roles" value={selected.roles.length ? selected.roles.map(roleLabel).join(", ") : "All roles"} />
                  <Row icon={MapPin} label="States" value={selected.states.length ? selected.states.join(", ") : "All states"} />
                  <Row icon={Settings2} label="Status" value={selected.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePin(selected.id)}>
                    <Pin className="mr-1.5 h-3.5 w-3.5" /> {selected.pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button size="sm" variant="outline"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => archive(selected.id)}>
                    <Archive className="mr-1.5 h-3.5 w-3.5" />Archive
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center">
                <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-[12.5px] text-muted-foreground">Select a resource to view details.</p>
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-[hsl(265_70%_98%)] to-white p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(265_70%_94%)] text-[hsl(265_70%_45%)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-foreground">Ask Blossom AI</div>
                  <div className="text-[11.5px] text-muted-foreground">Suggestions for HR</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  "Which roles are missing SOPs?",
                  "Find duplicate resources to merge.",
                  "Suggest tags for untagged resources.",
                  "Summarize most-viewed resources this month.",
                ].map((p) => (
                  <button
                    key={p}
                    className="block w-full rounded-lg border border-border/60 bg-white/70 px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-white"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Ask anything…" className="h-9 rounded-lg border-border/70 bg-white text-[12.5px]" />
                <Button size="icon" className="h-9 w-9 rounded-lg"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AddResourceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={handleCreate}
      />
    </OSShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "amber" | "slate" }) {
  const toneCls =
    tone === "emerald" ? "text-emerald-700"
    : tone === "amber" ? "text-amber-700"
    : tone === "slate" ? "text-slate-600"
    : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-[24px] font-semibold tracking-tight", toneCls)}>{value}</div>
    </div>
  );
}

function CatBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors",
        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
      )}
    >
      <span className="truncate">{label}</span>
      <span className="text-[11px] text-muted-foreground">{count}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: ResourceStatus }) {
  const cls =
    status === "Published" ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : status === "Draft"   ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-medium ring-1", cls)}>
      {status}
    </span>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-1.5">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function AddResourceDialog({
  open, onOpenChange, onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (r: Resource) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("SOP");
  const [category, setCategory] = useState<ResourceCategoryId>("sops");
  const [status, setStatus] = useState<ResourceStatus>("Draft");
  const [roles, setRoles] = useState<OSRole[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [pinned, setPinned] = useState(false);
  const [url, setUrl] = useState("");

  const toggle = <T,>(list: T[], v: T) => list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const submit = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onCreate({
      id: `r-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "—",
      type, category, status,
      roles, states,
      departments: [],
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      uploadedBy: "You",
      createdAt: now, updatedAt: now,
      url: url || undefined,
      pinned,
    });
    onOpenChange(false);
    setTitle(""); setDescription(""); setRoles([]); setStates([]); setTags(""); setUrl(""); setPinned(false);
    setType("SOP"); setCategory("sops"); setStatus("Draft");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add resource</DialogTitle>
          <DialogDescription>Create or upload a new resource and assign it to the right roles.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Intake Workflow SOP" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short description of the resource." />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Type">
              <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["SOP","Workflow","Form","Template","Checklist","PDF","DOCX","XLSX","Video","Link","Tango","Image"] as ResourceType[]).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategoryId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resourceCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as ResourceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="External link or Tango URL (optional)">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </Field>

          <Field label={`Assign to roles ${roles.length ? `· ${roles.length} selected` : "· all roles"}`}>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ROLES.map((r) => {
                const on = roles.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => setRoles((prev) => toggle(prev, r))}
                    type="button"
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                      on ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-foreground hover:bg-muted/50"
                    )}
                  >
                    {roleLabel(r)}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label={`Visible in states ${states.length ? `· ${states.length} selected` : "· all states"}`}>
            <div className="flex flex-wrap gap-1.5">
              {STATES.map((s) => {
                const on = states.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => setStates((prev) => toggle(prev, s))}
                    type="button"
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                      on ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 bg-card text-foreground hover:bg-muted/50"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Tags (comma-separated)">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="intake, sop, onboarding" />
          </Field>

          <label className="flex items-center gap-2 text-[12.5px] text-foreground">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Pin to top for assigned roles
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create resource</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
