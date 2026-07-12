import { useRef, useState } from "react";
import { Paperclip, Link2, X, FileText, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Attachment =
  | { kind: "link"; name: string; url: string }
  | { kind: "file"; name: string; path: string; mime?: string | null; size?: number | null };

const BUCKET = "escalation-attachments";
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

function ensureHttp(url: string) {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

export function AttachmentComposer({
  value,
  onChange,
  uid,
  scope = "thread",
  disabled,
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  uid: string;
  scope?: string;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 15MB`);
        continue;
      }
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${uid}/${scope}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (error) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }
      added.push({ kind: "file", name: file.name, path, mime: file.type, size: file.size });
    }
    if (added.length) onChange([...value, ...added]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addLink() {
    const url = linkUrl.trim();
    if (!url) return;
    onChange([...value, { kind: "link", name: (linkLabel.trim() || url), url: ensureHttp(url) }]);
    setLinkUrl("");
    setLinkLabel("");
    setLinkOpen(false);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-1.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-[11px]"
            >
              {a.kind === "file" ? <FileText className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="opacity-60 hover:opacity-100"
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Paperclip className="h-3.5 w-3.5 mr-1" />}
          Attach file
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          disabled={disabled}
          onClick={() => setLinkOpen((o) => !o)}
        >
          <Link2 className="h-3.5 w-3.5 mr-1" />
          Add link
        </Button>
      </div>
      {linkOpen && (
        <div className="flex flex-col gap-1 rounded-md border p-2 bg-background">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="h-7 text-xs"
          />
          <Input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Label (optional)"
            className="h-7 text-xs"
          />
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-6 text-[11px]" onClick={addLink} disabled={!linkUrl.trim()}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AttachmentList({ items, mine }: { items: Attachment[]; mine?: boolean }) {
  const [openingIdx, setOpeningIdx] = useState<number | null>(null);

  async function openFile(a: Extract<Attachment, { kind: "file" }>, idx: number) {
    setOpeningIdx(idx);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(a.path, 60 * 10);
    setOpeningIdx(null);
    if (error || !data?.signedUrl) {
      toast.error("Could not open attachment");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!items?.length) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {items.map((a, i) =>
        a.kind === "link" ? (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] underline underline-offset-2 truncate",
              mine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-background/70 hover:bg-background",
            )}
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{a.name}</span>
          </a>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => openFile(a, i)}
            disabled={openingIdx === i}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-left truncate",
              mine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-background/70 hover:bg-background",
            )}
          >
            {openingIdx === i ? <Loader2 className="h-3 w-3 animate-spin shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
            <span className="truncate">{a.name}</span>
          </button>
        ),
      )}
    </div>
  );
}