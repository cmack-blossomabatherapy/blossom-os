import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, ExternalLink, FileText, Link2, Video, Folder, Search, Pin } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  RESOURCE_CATEGORY_LABEL, RESOURCE_KIND_LABEL,
  type HRResource, type ResourceCategory, type ResourceKind,
} from "@/lib/hr/types";

const CATEGORIES: (ResourceCategory | "all")[] = [
  "all", "handbook", "payroll", "training", "clinical", "it", "benefits", "onboarding", "general",
];

const KIND_ICON: Record<ResourceKind, typeof FileText> = {
  document: FileText, link: Link2, video: Video, policy: FileText, form: FileText, folder: Folder,
};

export default function ResourceHub() {
  const { hasPerm, user } = useAuth();
  const canManage = hasPerm("hr.resources.manage");
  const [items, setItems] = useState<HRResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<ResourceCategory | "all">("all");

  // dialog
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [kind, setKind] = useState<ResourceKind>("document");
  const [category, setCategory] = useState<ResourceCategory>("general");
  const [url, setUrl] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("hr_resources").select("*")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false }).order("position");
    setItems((data ?? []) as HRResource[]);
    setLoading(false);
  }

  async function create() {
    if (!title.trim()) { toast.error("Title required."); return; }
    const { error } = await supabase.from("hr_resources").insert({
      title: title.trim(), description: desc.trim() || null,
      kind, category, url: url.trim() || null,
      uploaded_by: user?.id ?? null, uploaded_by_name: user?.email ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Resource added.");
    setOpen(false); setTitle(""); setDesc(""); setUrl(""); setKind("document"); setCategory("general");
    void load();
  }

  async function togglePin(r: HRResource) {
    const { error } = await supabase.from("hr_resources").update({ is_pinned: !r.is_pinned }).eq("id", r.id);
    if (error) toast.error(error.message); else void load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this resource?")) return;
    const { error } = await supabase.from("hr_resources").update({ is_active: false }).eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  const filtered = useMemo(() => {
    let r = items;
    if (cat !== "all") r = r.filter((x) => x.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => `${x.title} ${x.description ?? ""}`.toLowerCase().includes(q));
    }
    return r;
  }, [items, cat, search]);

  return (
    <PageShell
      title="Resource Hub"
      description="Documents, forms, videos, and links shared with your team."
      icon={BookOpen}
      actions={canManage ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add resource</Button> : null}
    >
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={cat} onValueChange={(v) => setCat(v as ResourceCategory | "all")}>
            <TabsList className="flex-wrap h-auto">
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c} value={c} className="text-xs">
                  {c === "all" ? "All" : RESOURCE_CATEGORY_LABEL[c]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-7 h-8 w-56 text-xs" />
          </div>
        </div>

        {loading ? <Skeleton className="h-32" /> : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No resources match.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((r) => {
              const Icon = KIND_ICON[r.kind];
              return (
                <div key={r.id} className={cn("p-4 rounded-lg border group", r.is_pinned ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border")}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {r.is_pinned && <Pin className="h-3 w-3 text-primary fill-primary shrink-0" />}
                        <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {RESOURCE_CATEGORY_LABEL[r.category]} · {RESOURCE_KIND_LABEL[r.kind]}
                      </p>
                      {r.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.description}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                            <ExternalLink className="h-3 w-3" /> Open
                          </a>
                        )}
                        {canManage && (
                          <>
                            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => togglePin(r)}>
                              {r.is_pinned ? "Unpin" : "Pin"}
                            </button>
                            <button className="text-xs text-destructive hover:text-destructive/80" onClick={() => remove(r.id)}>
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add resource</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Kind</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as ResourceKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RESOURCE_KIND_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ResourceCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RESOURCE_CATEGORY_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs text-muted-foreground">URL (optional)</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
            <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Add resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}