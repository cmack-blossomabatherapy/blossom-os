/**
 * PublishUpdateCard — persist a leadership update to executive_updates.
 */
import { useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { ExecCard } from "@/pages/os/executive/_shared";
import { useExecutiveUpdates } from "@/hooks/useExecutiveWorkItems";

export function PublishUpdateCard() {
  const { data, isLoading, create } = useExecutiveUpdates();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("company");
  const [pinned, setPinned] = useState(false);

  const submit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        body: body || null,
        audience,
        pinned,
        publish,
      });
      setTitle("");
      setBody("");
      setAudience("company");
      setPinned(false);
      toast.success(publish ? "Update published" : "Update saved as draft");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save update");
    }
  };

  const items = (data ?? []).slice(0, 6);

  return (
    <ExecCard title="Publish executive update" hint="Persisted to executive updates log">
      <form className="mb-4 space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Update headline…"
          className="w-full bg-transparent px-2 py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (optional)"
          rows={3}
          className="w-full resize-none rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[12.5px] outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[12px]"
          >
            <option value="company">Company-wide</option>
            <option value="leadership">Leadership only</option>
            <option value="operations">Operations</option>
            <option value="clinical">Clinical</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin
          </label>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={(e) => submit(e, false)}
              disabled={!title.trim() || create.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-[12px] font-medium transition hover:bg-muted/60 disabled:opacity-40"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={(e) => submit(e, true)}
              disabled={!title.trim() || create.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[12px] font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            >
              {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Megaphone className="h-3 w-3" />}
              Publish
            </button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
          <div className="text-[13px] font-medium text-foreground/80">No published updates yet.</div>
          <div className="mt-1 text-[12px] text-muted-foreground">Draft or publish the first one above.</div>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((u: any) => (
            <li key={u.id} className="py-2.5 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium leading-snug">
                    {u.pinned && <span className="mr-1 text-amber-500">★</span>}
                    {u.title}
                  </div>
                  {u.body && (
                    <div className="mt-0.5 text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2">
                      {u.body}
                    </div>
                  )}
                </div>
                <span className="shrink-0 rounded-full border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {u.published_at ? "Published" : "Draft"}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {u.audience} · {new Date(u.published_at ?? u.created_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ExecCard>
  );
}