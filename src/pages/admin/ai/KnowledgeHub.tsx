import { useEffect, useMemo, useRef, useState } from "react";
import { AiAdminShell } from "@/components/admin/ai/AiAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, RefreshCw, Trash2, Loader2, CheckCircle2, AlertCircle, Clock, Building2, HeartHandshake, Briefcase, Users, ShieldCheck, Calendar, ClipboardCheck, Stethoscope, Wallet, Settings, GraduationCap, Folder } from "lucide-react";

const CATEGORIES = [
  { key: "company",  label: "Company",   icon: Building2 },
  { key: "hr",       label: "HR",        icon: HeartHandshake },
  { key: "recruiting", label: "Recruiting", icon: Briefcase },
  { key: "intake",   label: "Intake",    icon: Users },
  { key: "authorizations", label: "Authorizations", icon: ShieldCheck },
  { key: "scheduling", label: "Scheduling", icon: Calendar },
  { key: "qa",       label: "QA",        icon: ClipboardCheck },
  { key: "clinical", label: "Clinical",  icon: Stethoscope },
  { key: "finance",  label: "Finance",   icon: Wallet },
  { key: "systems",  label: "Systems",   icon: Settings },
  { key: "training", label: "Training",  icon: GraduationCap },
  { key: "general",  label: "Uncategorized", icon: Folder },
];
const ROLES = ["admin", "exec", "ops_manager", "state_director", "bcba", "rbt", "intake", "scheduling", "recruiting_assistant", "hr", "qa", "finance", "marketing"];

function StatusChip({ status, error }: { status: string; error?: string | null }) {
  if (status === "ready") return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" />Ready</Badge>;
  if (status === "processing" || status === "pending") return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 gap-1"><Loader2 className="h-3 w-3 animate-spin" />Indexing</Badge>;
  if (status === "failed") return <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1" title={error || undefined}><AlertCircle className="h-3 w-3" />Failed</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Idle</Badge>;
}

export default function KnowledgeHub() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("company");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("company");
  const [tab, setTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [visibility, setVisibility] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("knowledge_documents").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs(data ?? []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    docs.forEach((d) => { m[d.category] = (m[d.category] ?? 0) + 1; });
    return m;
  }, [docs]);

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    return docs.filter((d) => d.category === activeCat).filter((d) =>
      !t || d.title.toLowerCase().includes(t) || (d.description ?? "").toLowerCase().includes(t)
    );
  }, [docs, activeCat, query]);

  const resetForm = () => { setTitle(""); setDescription(""); setCategory(activeCat); setTab("file"); setFile(null); setRawText(""); setVisibility([]); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const submit = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    if (tab === "file" && !file) { toast.error("Choose a file"); return; }
    if (tab === "text" && !rawText.trim()) { toast.error("Paste some text"); return; }
    setSubmitting(true);
    try {
      const { data: created, error } = await supabase.from("knowledge_documents").insert({
        title: title.trim(), description: description.trim() || null, category,
        role_visibility: visibility.length ? visibility : null,
        source_kind: tab === "file" ? "file" : "manual",
        file_mime: file?.type || (tab === "text" ? "text/plain" : null),
        file_size_bytes: file?.size ?? (rawText ? new Blob([rawText]).size : null),
        ingest_status: "processing",
      }).select().single();
      if (error || !created) throw error;
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token!;
      if (tab === "file" && file) {
        const path = `${created.id}/${file.name}`;
        await supabase.storage.from("knowledge-documents").upload(path, file, { upsert: true });
        await supabase.from("knowledge_documents").update({ file_path: path }).eq("id", created.id);
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-knowledge`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bucket: "knowledge-documents", storage_path: path, source_type: "knowledge_document", source_id: created.id, source_title: title.trim(), document_id: created.id }),
        });
      } else {
        await supabase.from("knowledge_documents").update({ raw_content: rawText }).eq("id", created.id);
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-knowledge`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ source_type: "knowledge_document", source_id: created.id, source_title: title.trim(), content: rawText, document_id: created.id }),
        });
      }
      toast.success("Document added & embedded");
      setDialogOpen(false); resetForm(); refresh();
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
    finally { setSubmitting(false); }
  };

  const reingest = async (doc: any) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token; if (!token) return;
    await supabase.from("knowledge_documents").update({ ingest_status: "processing", ingest_error: null }).eq("id", doc.id); refresh();
    try {
      if (doc.source_kind === "file" && doc.file_path) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-knowledge`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ bucket: "knowledge-documents", storage_path: doc.file_path, source_type: "knowledge_document", source_id: doc.id, source_title: doc.title, document_id: doc.id }) });
      } else {
        const { data: full } = await supabase.from("knowledge_documents").select("raw_content").eq("id", doc.id).single();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-knowledge`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ source_type: "knowledge_document", source_id: doc.id, source_title: doc.title, content: full?.raw_content || "", document_id: doc.id }) });
      }
      toast.success("Re-trained"); refresh();
    } catch (e: any) { toast.error(e?.message); }
  };

  const del = async (doc: any) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    if (doc.file_path) await supabase.storage.from("knowledge-documents").remove([doc.file_path]);
    const { error } = await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); }
  };

  return (
    <AiAdminShell>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Category rail */}
        <Card className="p-2 h-fit">
          <div className="space-y-0.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.key} onClick={() => setActiveCat(c.key)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${activeCat === c.key ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-muted"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{counts[c.key] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this category…" className="max-w-md" />
            <Button variant="ghost" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <div className="ml-auto">
              <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); else setCategory(activeCat); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Upload className="h-4 w-4" /> Add document</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Add to knowledge base</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. RBT Onboarding SOP v2" /></div>
                    <div className="grid gap-2"><Label>Description (optional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2"><Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2"><Label>Role visibility</Label>
                        <div className="flex flex-wrap gap-1 p-2 border rounded-md max-h-24 overflow-auto">
                          {ROLES.map((r) => (
                            <Badge key={r} variant={visibility.includes(r) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setVisibility((v) => v.includes(r) ? v.filter((x) => x !== r) : [...v, r])}>{r}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Empty = visible to all roles</p>
                      </div>
                    </div>
                    <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                      <TabsList className="grid grid-cols-2"><TabsTrigger value="file">Upload file</TabsTrigger><TabsTrigger value="text">Paste text</TabsTrigger></TabsList>
                      <TabsContent value="file" className="pt-3">
                        <Input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        <p className="text-xs text-muted-foreground mt-2">PDF, TXT, MD. Extracted, chunked, embedded automatically.</p>
                      </TabsContent>
                      <TabsContent value="text" className="pt-3">
                        <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} placeholder="Paste SOP, policy or reference content…" />
                      </TabsContent>
                    </Tabs>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={submit} disabled={submitting} className="gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? "Processing…" : "Add & embed"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="text-muted-foreground text-sm p-8">Loading…</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">No documents in this category</p>
              <p className="text-sm">Add the first one to teach Blossom AI.</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((d) => (
                <Card key={d.id} className="p-4 hover:border-primary/30 transition group">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0"><FileText className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">{d.title}</h3>
                      {d.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.description}</p>}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <StatusChip status={d.ingest_status} error={d.ingest_error} />
                        <Badge variant="outline" className="text-[10px]">{d.chunk_count} chunks</Badge>
                        {d.role_visibility?.length ? (
                          <Badge variant="outline" className="text-[10px]">{d.role_visibility.length} roles</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">All roles</Badge>
                        )}
                      </div>
                      {d.ingest_error && <p className="text-[11px] text-destructive mt-1.5 truncate" title={d.ingest_error}>{d.ingest_error}</p>}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{new Date(d.updated_at ?? d.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reingest(d)} title="Re-train"><RefreshCw className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(d)} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AiAdminShell>
  );
}