import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRoleSafe } from "@/contexts/OSRoleContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Upload, CheckCircle2, MessageSquare, History } from "lucide-react";
import { toast } from "sonner";
import type { PreboardingComment, PreboardingAudit, PreboardingStatus } from "./types";
import { STATUS_META, isDone } from "./types";
import type { PreboardingRow } from "./usePreboarding";

interface Props {
  row: PreboardingRow | null;
  internal: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function PreboardingItemSheet({ row, internal, onClose, onChanged }: Props) {
  const { user } = useAuth();
  const osRole = useOSRoleSafe();
  const isPreviewing = Boolean(osRole?.isPreviewing);
  const [comments, setComments] = useState<PreboardingComment[]>([]);
  const [audit, setAudit] = useState<PreboardingAudit[]>([]);
  const [newComment, setNewComment] = useState("");
  const [visibility, setVisibility] = useState<"all" | "internal">("all");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!row) return;
    supabase.from("rbt_preboarding_comments" as any).select("*").eq("item_id", row.item.id).order("created_at")
      .then(({ data }) => setComments((data as any) ?? []));
    supabase.from("rbt_preboarding_audit" as any).select("*").eq("item_id", row.item.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setAudit((data as any) ?? []));
  }, [row?.item.id]);

  if (!row) return null;
  const { item, requirement } = row;

  async function setStatus(status: PreboardingStatus) {
    if (isPreviewing) { toast.info("Read-only in preview mode."); return; }
    setBusy(true);
    const patch: any = { status };
    if (status === "submitted") { patch.submitted_at = new Date().toISOString(); patch.submitted_by = user?.id; }
    if (status === "approved") { patch.approved_at = new Date().toISOString(); patch.approved_by = user?.id; }
    await supabase.from("rbt_preboarding_items" as any).update(patch).eq("id", item.id);
    setBusy(false);
    onChanged();
  }

  async function uploadFile(f: File) {
    if (!user) return;
    if (isPreviewing) { toast.info("Read-only in preview mode."); return; }
    setBusy(true);
    const path = `${item.employee_id}/${item.requirement_key}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("rbt-preboarding-docs").upload(path, f, { upsert: true });
    if (!error) {
      await supabase.from("rbt_preboarding_items" as any).update({
        file_path: path, file_name: f.name,
        status: requirement.requires_approval ? "submitted" : "complete",
        submitted_at: new Date().toISOString(), submitted_by: user.id,
      }).eq("id", item.id);
    }
    setBusy(false);
    onChanged();
  }

  async function addComment() {
    if (!user || !newComment.trim()) return;
    if (isPreviewing) { toast.info("Read-only in preview mode."); return; }
    await supabase.from("rbt_preboarding_comments" as any).insert({
      item_id: item.id, author_id: user.id, body: newComment.trim(),
      visibility: internal ? visibility : "all",
    });
    setNewComment("");
    supabase.from("rbt_preboarding_comments" as any).select("*").eq("item_id", item.id).order("created_at")
      .then(({ data }) => setComments((data as any) ?? []));
  }

  const instructions = internal
    ? requirement.internal_instructions ?? requirement.employee_instructions
    : requirement.employee_instructions ?? requirement.description;

  const ownerLabel = requirement.owner_role === "rbt" ? "You" : requirement.owner_role.toUpperCase();

  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/70">
          <SheetTitle className="text-xl tracking-tight">{requirement.label}</SheetTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className={STATUS_META[item.status].tone}>● {STATUS_META[item.status].label}</span>
            <span className="text-muted-foreground">· Owner: {ownerLabel}</span>
            {item.due_at && <span className="text-muted-foreground">· Due {new Date(item.due_at).toLocaleDateString()}</span>}
            {!requirement.is_required && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Optional</span>}
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {instructions && <p className="text-[15px] leading-relaxed">{instructions}</p>}

          {requirement.external_action_url && (
            <a href={requirement.external_action_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground border border-border/70 h-11 px-4 text-sm font-medium hover:bg-muted transition">
              <ExternalLink className="h-4 w-4" />
              {requirement.external_action_label ?? "Open external system"}
            </a>
          )}

          {requirement.requires_file && !isDone(item.status) && (
            <label className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 cursor-pointer hover:bg-muted/40 transition">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.file_name ?? "Upload a file"}</p>
                <p className="text-xs text-muted-foreground">Stored privately in Blossom</p>
              </div>
              <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
            </label>
          )}

          {item.file_name && (
            <p className="text-xs text-muted-foreground">Uploaded file: {item.file_name}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {!isDone(item.status) && !requirement.requires_file && (
              <Button onClick={() => setStatus(requirement.requires_approval ? "submitted" : "complete")} disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {requirement.requires_approval ? "Mark submitted" : "Mark complete"}
              </Button>
            )}
            {internal && item.status === "submitted" && (
              <>
                <Button onClick={() => setStatus("approved")} disabled={busy}>Approve</Button>
                <Button variant="outline" onClick={() => setStatus("rejected")} disabled={busy}>Request changes</Button>
              </>
            )}
            {internal && !isDone(item.status) && (
              <Button variant="ghost" onClick={() => setStatus("waived")} disabled={busy}>Waive</Button>
            )}
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-medium tracking-tight flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Comments</h3>
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{c.visibility === "internal" ? "Internal note" : "Comment"}</span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p>{c.body}</p>
                </li>
              ))}
              {comments.length === 0 && <li className="text-xs text-muted-foreground">No comments yet.</li>}
            </ul>
            <div className="space-y-2">
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…" rows={3} />
              <div className="flex items-center justify-between">
                {internal ? (
                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    <input type="checkbox" checked={visibility === "internal"} onChange={(e) => setVisibility(e.target.checked ? "internal" : "all")} />
                    Internal only
                  </label>
                ) : <span />}
                <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>Post</Button>
              </div>
            </div>
          </section>

          {internal && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium tracking-tight flex items-center gap-1.5"><History className="h-4 w-4" /> Audit history</h3>
              <ul className="space-y-1.5 text-xs">
                {audit.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums w-32 shrink-0">{new Date(a.created_at).toLocaleString()}</span>
                    <span>{a.action}</span>
                    {a.from_status && <span className="text-muted-foreground">{a.from_status} → {a.to_status}</span>}
                  </li>
                ))}
                {audit.length === 0 && <li className="text-muted-foreground">No history yet.</li>}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}