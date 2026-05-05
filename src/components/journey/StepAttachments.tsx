import { useEffect, useRef, useState } from "react";
import { Paperclip, Upload, Trash2, Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "journey-attachments";
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

interface Attachment {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_name: string | null;
  uploaded_by: string;
  created_at: string;
}

interface Props {
  ownerUserId: string;
  journeyKey: string;
  stepId: string;
  currentUserId: string;
  currentUserName?: string | null;
  isAdmin?: boolean;
}

function formatBytes(b?: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

export function StepAttachments({
  ownerUserId, journeyKey, stepId, currentUserId, currentUserName, isAdmin,
}: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUpload = !!currentUserId && (currentUserId === ownerUserId || !!isAdmin);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("journey_step_attachments")
      .select("id,file_name,storage_path,mime_type,size_bytes,uploaded_by_name,uploaded_by,created_at")
      .eq("user_id", ownerUserId)
      .eq("journey_key", journeyKey)
      .eq("step_id", stepId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load attachments", description: error.message, variant: "destructive" });
    } else {
      setItems((data ?? []) as Attachment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!ownerUserId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUserId, journeyKey, stepId]);

  const onPick = () => inputRef.current?.click();

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Max 20 MB per file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const safe = sanitizeName(file.name);
    const path = `${ownerUserId}/${journeyKey}/${stepId}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) {
      setUploading(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("journey_step_attachments").insert({
      user_id: ownerUserId,
      journey_key: journeyKey,
      step_id: stepId,
      file_name: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: currentUserId,
      uploaded_by_name: currentUserName ?? null,
    });
    if (insErr) {
      // Try to clean up the orphaned storage object
      await supabase.storage.from(BUCKET).remove([path]);
      toast({ title: "Couldn't save attachment", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: "File attached", description: file.name });
      await load();
    }
    setUploading(false);
  };

  const onDownload = async (a: Attachment) => {
    setBusyId(a.id);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(a.storage_path, 60);
    setBusyId(null);
    if (error || !data?.signedUrl) {
      toast({ title: "Couldn't open file", description: error?.message ?? "Unknown error", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const onDelete = async (a: Attachment) => {
    if (!confirm(`Remove "${a.file_name}"?`)) return;
    setBusyId(a.id);
    const { error: delDbErr } = await supabase
      .from("journey_step_attachments")
      .delete()
      .eq("id", a.id);
    if (delDbErr) {
      setBusyId(null);
      toast({ title: "Couldn't delete", description: delDbErr.message, variant: "destructive" });
      return;
    }
    await supabase.storage.from(BUCKET).remove([a.storage_path]);
    setBusyId(null);
    setItems((prev) => prev.filter((x) => x.id !== a.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-primary" /> Attachments
          {items.length > 0 && <span className="text-muted-foreground font-normal">· {items.length}</span>}
        </p>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={onUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.heic,.gif"
            />
            <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={onPick} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {canUpload ? "No documents yet. Upload signed forms, certificates, or notes for this step." : "No documents have been attached."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a) => {
            const canDelete = a.uploaded_by === currentUserId || !!isAdmin;
            return (
              <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{a.file_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {formatBytes(a.size_bytes)}{a.uploaded_by_name ? ` · ${a.uploaded_by_name}` : ""} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDownload(a)} disabled={busyId === a.id} title="Download">
                  {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                </Button>
                {canDelete && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(a)} disabled={busyId === a.id} title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}