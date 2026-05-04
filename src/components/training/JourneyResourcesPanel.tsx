import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, ExternalLink, FileText, Loader2, Paperclip, Pencil, Pin, PinOff, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  getStoredJourneyResources, saveStoredJourneyResources,
  JOURNEY_RESOURCES_UPDATED_EVENT, JOURNEY_RESOURCE_CATEGORIES,
  JOURNEY_RESOURCE_ICONS, JOURNEY_RESOURCE_ICON_NAMES,
  type JourneyAudience, type JourneyResourceCategory, type StoredJourneyResource,
} from "@/data/journeyResources";

const AUDIENCE_TABS: { value: "all" | JourneyAudience; label: string }[] = [
  { value: "all", label: "All" },
  { value: "rbt", label: "RBT" },
  { value: "bcba", label: "BCBA" },
  { value: "both", label: "Shared" },
];

type EditState = Partial<StoredJourneyResource> & { id?: string };

const blankDraft = (): EditState => ({
  title: "", description: "", url: "", category: "Drive",
  audience: "rbt", iconName: "BookOpen", internalRoute: "", pinned: false,
});

const RESOURCE_BUCKET = "journey-resources";
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function JourneyResourcesPanel({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<StoredJourneyResource[]>(() => getStoredJourneyResources());
  const [audience, setAudience] = useState<"all" | JourneyAudience>("all");
  const [category, setCategory] = useState<"all" | JourneyResourceCategory>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EditState>(blankDraft());
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(getStoredJourneyResources());
    window.addEventListener(JOURNEY_RESOURCES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_RESOURCES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const persist = (next: StoredJourneyResource[]) => {
    setItems(next);
    saveStoredJourneyResources(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((r) => audience === "all" || r.audience === audience)
      .filter((r) => category === "all" || r.category === category)
      .filter((r) => !q || `${r.title} ${r.description} ${r.url}`.toLowerCase().includes(q))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || a.position - b.position);
  }, [items, audience, category, query]);

  const counts = useMemo(() => ({
    rbt: items.filter((r) => r.audience === "rbt" || r.audience === "both").length,
    bcba: items.filter((r) => r.audience === "bcba" || r.audience === "both").length,
  }), [items]);

  function startCreate() {
    if (!canManage) return;
    setDraft({ ...blankDraft(), audience: audience === "all" ? "rbt" : audience });
    setOpen(true);
  }

  function startEdit(r: StoredJourneyResource) {
    if (!canManage) return;
    setDraft({ ...r });
    setOpen(true);
  }

  function save() {
    if (!draft.title?.trim()) return toast.error("Title is required");
    if (!draft.url?.trim() && !draft.internalRoute?.trim() && !draft.fileUrl) {
      return toast.error("Add a URL, internal route, or upload a file");
    }
    const now = new Date().toISOString();
    if (draft.id) {
      const next = items.map((r) => r.id === draft.id ? { ...r, ...draft, updatedAt: now } as StoredJourneyResource : r);
      persist(next);
      toast.success("Resource updated");
    } else {
      const audienceVal = (draft.audience ?? "rbt") as JourneyAudience;
      const maxPos = items.filter((r) => r.audience === audienceVal).reduce((m, r) => Math.max(m, r.position), -1);
      const newItem: StoredJourneyResource = {
        id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: draft.title!.trim(),
        description: (draft.description ?? "").trim(),
        url: (draft.url ?? "").trim(),
        internalRoute: draft.internalRoute?.trim() || undefined,
        category: (draft.category ?? "Drive") as JourneyResourceCategory,
        audience: audienceVal,
        iconName: draft.iconName ?? "BookOpen",
        fileUrl: draft.fileUrl,
        fileName: draft.fileName,
        fileType: draft.fileType,
        fileSize: draft.fileSize,
        filePath: draft.filePath,
        pinned: !!draft.pinned,
        position: maxPos + 1,
        createdAt: now,
        updatedAt: now,
      };
      persist([...items, newItem]);
      toast.success("Resource added");
    }
    setOpen(false);
  }

  async function handleFileUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large (25 MB max).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(RESOURCE_BUCKET).upload(path, file, {
        contentType: file.type || undefined, upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(RESOURCE_BUCKET).getPublicUrl(path);
      setDraft((d) => ({
        ...d,
        fileUrl: data.publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: path,
        title: d.title?.trim() ? d.title : file.name.replace(/\.[^.]+$/, ""),
        iconName: d.iconName === "BookOpen" ? "FileText" : d.iconName,
      }));
      toast.success("File uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function clearAttachment() {
    if (draft.filePath) {
      try { await supabase.storage.from(RESOURCE_BUCKET).remove([draft.filePath]); } catch { /* noop */ }
    }
    setDraft((d) => ({ ...d, fileUrl: undefined, fileName: undefined, fileType: undefined, fileSize: undefined, filePath: undefined }));
  }

  function remove(r: StoredJourneyResource) {
    if (!canManage) return;
    if (!confirm(`Delete “${r.title}”?`)) return;
    if (r.filePath) {
      supabase.storage.from(RESOURCE_BUCKET).remove([r.filePath]).catch(() => { /* noop */ });
    }
    persist(items.filter((x) => x.id !== r.id));
    toast.success("Resource removed");
  }

  function togglePin(r: StoredJourneyResource) {
    if (!canManage) return;
    persist(items.map((x) => x.id === r.id ? { ...x, pinned: !x.pinned, updatedAt: new Date().toISOString() } : x));
  }

  function move(r: StoredJourneyResource, dir: -1 | 1) {
    if (!canManage) return;
    const peers = items.filter((x) => x.audience === r.audience).sort((a, b) => a.position - b.position);
    const idx = peers.findIndex((x) => x.id === r.id);
    const swap = peers[idx + dir];
    if (!swap) return;
    const next = items.map((x) => {
      if (x.id === r.id) return { ...x, position: swap.position };
      if (x.id === swap.id) return { ...x, position: r.position };
      return x;
    });
    persist(next);
  }

  function moveAudience(r: StoredJourneyResource, target: JourneyAudience) {
    if (!canManage) return;
    const maxPos = items.filter((x) => x.audience === target).reduce((m, x) => Math.max(m, x.position), -1);
    persist(items.map((x) => x.id === r.id ? { ...x, audience: target, position: maxPos + 1, updatedAt: new Date().toISOString() } : x));
    toast.success(`Moved to ${target.toUpperCase()}`);
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">RBT &amp; BCBA Resources</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Drives, links, guides, and examples shown to RBTs and BCBAs in the Training Hub.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            RBT visible: {counts.rbt} · BCBA visible: {counts.bcba}
          </p>
        </div>
        <Button onClick={startCreate} disabled={!canManage}>
          <Plus className="mr-2 h-4 w-4" /> Add resource
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tabs value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
          <TabsList>
            {AUDIENCE_TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {JOURNEY_RESOURCE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative ml-auto">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="pl-7 h-9 w-56 text-xs" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No resources match.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const Icon = JOURNEY_RESOURCE_ICONS[r.iconName] ?? BookOpen;
            return (
              <div key={r.id} className={cn("p-4 rounded-xl border", r.pinned ? "border-primary/40 bg-primary/5" : "border-border/40")}>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {r.pinned && <Pin className="h-3 w-3 text-primary fill-primary shrink-0" />}
                      <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <StatusBadge status={r.audience.toUpperCase()} variant={r.audience === "bcba" ? "info" : r.audience === "both" ? "success" : "default"} />
                      <span>· {r.category}</span>
                    </p>
                    {r.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.description}</p>}
                    {(r.url || r.internalRoute) && (
                      <a href={r.internalRoute || r.url} target={r.internalRoute ? undefined : "_blank"} rel="noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline mt-2 truncate max-w-full">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{r.internalRoute || r.url}</span>
                      </a>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
                    <Button size="sm" variant="outline" onClick={() => startEdit(r)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePin(r)}>
                      {r.pinned ? <><PinOff className="h-3.5 w-3.5" /> Unpin</> : <><Pin className="h-3.5 w-3.5" /> Pin</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => move(r, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => move(r, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <Select value={r.audience} onValueChange={(v) => moveAudience(r, v as JourneyAudience)}>
                      <SelectTrigger className="h-8 w-24 text-xs ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rbt">RBT</SelectItem>
                        <SelectItem value="bcba">BCBA</SelectItem>
                        <SelectItem value="both">Shared</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{draft.id ? "Edit resource" : "Add resource"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Audience</Label>
                <Select value={(draft.audience ?? "rbt") as string} onValueChange={(v) => setDraft({ ...draft, audience: v as JourneyAudience })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rbt">RBT only</SelectItem>
                    <SelectItem value="bcba">BCBA only</SelectItem>
                    <SelectItem value="both">Shared (both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={(draft.category ?? "Drive") as string} onValueChange={(v) => setDraft({ ...draft, category: v as JourneyResourceCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOURNEY_RESOURCE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Icon</Label>
                <Select value={draft.iconName ?? "BookOpen"} onValueChange={(v) => setDraft({ ...draft, iconName: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOURNEY_RESOURCE_ICON_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} />
                  Pin to top
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">External URL</Label>
              <Input value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Internal route (optional)</Label>
              <Input value={draft.internalRoute ?? ""} onChange={(e) => setDraft({ ...draft, internalRoute: e.target.value })} placeholder="/hr/journey/drive" />
              <p className="text-[11px] text-muted-foreground mt-1">If set, the tile opens this in-app route instead of the external URL.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">File attachment (PDF, Doc, etc.)</Label>
              {draft.fileUrl ? (
                <div className="flex items-center gap-2 mt-1 rounded-md border border-border/60 px-3 py-2 bg-muted/30">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{draft.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(draft.fileSize)}</p>
                  </div>
                  <a href={draft.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
                  <Button type="button" size="sm" variant="ghost" onClick={clearAttachment}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <label className={cn(
                  "mt-1 flex items-center justify-center gap-2 rounded-md border border-dashed border-border/70 px-3 py-3 text-xs text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-foreground transition-colors",
                  uploading && "opacity-60 cursor-wait",
                )}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{uploading ? "Uploading…" : "Click to upload (PDF, Doc, up to 25 MB)"}</span>
                  <input type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; handleFileUpload(f); }} />
                </label>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">When attached, the resource tile opens this file directly.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{draft.id ? "Save changes" : "Add resource"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}