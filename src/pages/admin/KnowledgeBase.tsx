import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, RefreshCw, Trash2, Sparkles, BookOpen, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";

type KnowledgeDocument = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  role_visibility: string[] | null;
  source_kind: string;
  file_path: string | null;
  file_mime: string | null;
  file_size_bytes: number | null;
  source_url: string | null;
  status: string;
  ingest_status: string;
  ingest_error: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = ["sop", "policy", "training", "clinical", "operations", "hr", "compliance", "general"];
const ROLES = ["admin", "executive", "operations", "state_director", "bcba", "rbt", "intake", "scheduling", "recruiting", "hr", "qa", "billing", "marketing"];

function StatusBadge({ status, error }: { status: string; error?: string | null }) {
  if (status === "ready") return <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="h-3 w-3" />Ready</Badge>;
  if (status === "processing") return <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 animate-spin" />Processing</Badge>;
  if (status === "failed") return <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive border-destructive/20" title={error || undefined}><AlertCircle className="h-3 w-3" />Failed</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
}

export default function KnowledgeBase() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("sop");
  const [tab, setTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [visibility, setVisibility] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/", { replace: true });
  }, [authLoading, isAdmin, navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs((data ?? []) as KnowledgeDocument[]);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const stats = useMemo(() => ({
    total: docs.length,
    ready: docs.filter((d) => d.ingest_status === "ready").length,
    processing: docs.filter((d) => d.ingest_status === "processing" || d.ingest_status === "pending").length,
    failed: docs.filter((d) => d.ingest_status === "failed").length,
    chunks: docs.reduce((s, d) => s + (d.chunk_count || 0), 0),
  }), [docs]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("sop"); setTab("file");
    setFile(null); setRawText(""); setVisibility([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (tab === "file" && !file) { toast.error("Please choose a file"); return; }
    if (tab === "text" && !rawText.trim()) { toast.error("Paste some text"); return; }
    setSubmitting(true);
    try {
      const { data: created, error: insertErr } = await supabase
        .from("knowledge_documents")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          role_visibility: visibility.length ? visibility : null,
          source_kind: tab === "file" ? "file" : "manual",
          file_mime: file?.type || (tab === "text" ? "text/plain" : null),
          file_size_bytes: file?.size ?? (rawText ? new Blob([rawText]).size : null),
          ingest_status: "processing",
        })
        .select()
        .single();
      if (insertErr || !created) throw insertErr || new Error("Insert failed");

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      if (tab === "file" && file) {
        const path = `${created.id}/${file.name}`;
        const { error: upErr } = await supabase.storage.from("knowledge-documents").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        await supabase.from("knowledge_documents").update({ file_path: path }).eq("id", created.id);

        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            bucket: "knowledge-documents",
            storage_path: path,
            source_type: "knowledge_document",
            source_id: created.id,
            source_title: title.trim(),
            document_id: created.id,
          }),
        });
        if (!resp.ok) {
          const b = await resp.json().catch(() => ({}));
          throw new Error(b.error || "Extraction failed");
        }
      } else {
        await supabase.from("knowledge_documents").update({ raw_content: rawText }).eq("id", created.id);
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            source_type: "knowledge_document",
            source_id: created.id,
            source_title: title.trim(),
            content: rawText,
            document_id: created.id,
          }),
        });
        if (!resp.ok) {
          const b = await resp.json().catch(() => ({}));
          throw new Error(b.error || "Ingest failed");
        }
      }

      toast.success("Document added — embeddings generated");
      setDialogOpen(false);
      resetForm();
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReingest = async (doc: KnowledgeDocument) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;
    await supabase.from("knowledge_documents").update({ ingest_status: "processing", ingest_error: null }).eq("id", doc.id);
    refresh();
    try {
      if (doc.source_kind === "file" && doc.file_path) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            bucket: "knowledge-documents",
            storage_path: doc.file_path,
            source_type: "knowledge_document",
            source_id: doc.id,
            source_title: doc.title,
            document_id: doc.id,
          }),
        });
      } else {
        const { data: full } = await supabase.from("knowledge_documents").select("raw_content").eq("id", doc.id).single();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            source_type: "knowledge_document",
            source_id: doc.id,
            source_title: doc.title,
            content: full?.raw_content || "",
            document_id: doc.id,
          }),
        });
      }
      toast.success("Re-ingest complete");
    } catch (e: any) {
      toast.error(e?.message || "Re-ingest failed");
    }
    refresh();
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`Delete "${doc.title}"? This removes its embeddings.`)) return;
    if (doc.file_path) {
      await supabase.storage.from("knowledge-documents").remove([doc.file_path]);
    }
    const { error } = await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refresh(); }
  };

  const toggleVis = (role: string) => {
    setVisibility((v) => v.includes(role) ? v.filter((r) => r !== role) : [...v, role]);
  };

  if (authLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="p-6 md:p-8 mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4" /> Operational Insights · Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">Upload SOPs, policies, and reference documents that power Operational Insights's answers.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2"><Upload className="h-4 w-4" /> Add Document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add to Knowledge Base</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. RBT Onboarding SOP v2" />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description for admins" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Role visibility</Label>
                  <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-10 max-h-24 overflow-auto">
                    {ROLES.map((r) => (
                      <Badge key={r} variant={visibility.includes(r) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => toggleVis(r)}>{r}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Empty = visible to all roles</p>
                </div>
              </div>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "file" | "text")}>
                <TabsList className="grid grid-cols-2"><TabsTrigger value="file">Upload file</TabsTrigger><TabsTrigger value="text">Paste text</TabsTrigger></TabsList>
                <TabsContent value="file" className="pt-3">
                  <Input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <p className="text-xs text-muted-foreground mt-2">PDF, TXT, or MD. Text is extracted and embedded automatically.</p>
                </TabsContent>
                <TabsContent value="text" className="pt-3">
                  <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Paste SOP, policy, or reference content…" rows={8} />
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Processing…" : "Add & Embed"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Documents", value: stats.total, icon: BookOpen },
          { label: "Ready", value: stats.ready, icon: CheckCircle2 },
          { label: "Processing", value: stats.processing, icon: Loader2 },
          { label: "Embedded chunks", value: stats.chunks, icon: Sparkles },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><s.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documents</CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium">No documents yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload SOPs and policies so Operational Insights can cite them.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Chunks</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.title}</div>
                      {d.description && <div className="text-xs text-muted-foreground mt-0.5">{d.description}</div>}
                      {d.ingest_error && <div className="text-xs text-destructive mt-1">{d.ingest_error}</div>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.role_visibility?.length ? d.role_visibility.join(", ") : "All roles"}</TableCell>
                    <TableCell><StatusBadge status={d.ingest_status} error={d.ingest_error} /></TableCell>
                    <TableCell className="text-right tabular-nums">{d.chunk_count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleReingest(d)} title="Re-ingest"><RefreshCw className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}