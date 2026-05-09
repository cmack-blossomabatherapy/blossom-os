import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { upsertSopFromText, type SopDocumentRow } from "@/lib/sop/repository";
import { splitSections } from "@/lib/sop/indexer";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: { doc: SopDocumentRow; body: string } | null;
  onSaved: () => void;
}

export function AddSopDialog({ open, onOpenChange, editing, onSaved }: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(editing?.doc.title ?? "");
      setOwner(editing?.doc.owner ?? "");
      setBody(editing?.body ?? "");
    }
  }, [open, editing]);

  const preview = splitSections(body, title || "Overview");

  const handleFile = async (file: File) => {
    const text = await file.text();
    setBody(text);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  const onSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Add a title and body", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await upsertSopFromText({
        id: editing?.doc.id,
        title: title.trim(),
        owner: owner.trim() || undefined,
        body,
        source: editing ? editing.doc.source as "paste" | "upload" | "url" : "paste",
      });
      toast({
        title: editing ? "SOP updated" : "SOP added",
        description: `Indexed ${preview.length} section${preview.length === 1 ? "" : "s"}.`,
      });
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast({
        title: "Couldn't save SOP",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {editing ? "Edit SOP" : "Add SOP"}
          </DialogTitle>
          <DialogDescription>
            Paste SOP text or upload a .md / .txt file. Sections and tags are extracted automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Authorization Denial Playbook" />
            </div>
            <div>
              <Label className="text-xs">Owner</Label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Devorah Singh" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Body</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Upload .md / .txt
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt,.markdown,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder={"# Section heading\nSection body…\n\n# Another section\nMore text…"}
              className="font-mono text-xs"
            />
          </div>

          {preview.length > 0 && body.trim() && (
            <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Preview · {preview.length} section{preview.length === 1 ? "" : "s"} will be indexed
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto">
                {preview.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    § {p.section}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editing ? "Save & Re-index" : "Add & Index"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}