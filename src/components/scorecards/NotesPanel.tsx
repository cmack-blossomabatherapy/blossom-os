import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Note { id: string; note: string; author?: string; createdAt: string; }

export function NotesPanel({ initial }: { initial: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [draft, setDraft] = useState("");
  function post() {
    const text = draft.trim();
    if (!text) return;
    setNotes([{ id: crypto.randomUUID(), note: text, author: "You", createdAt: "just now" }, ...notes]);
    setDraft("");
  }
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
        <h3 className="text-[14px] font-semibold tracking-tight">Meeting summary &amp; notes</h3>
      </div>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">Wins, blockers, staffing concerns — keep it short.</p>

      <div className="mt-3 flex items-start gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Need RBTs. Snow week impacted hours."
          className="flex-1 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[12.5px] outline-none transition focus:border-[hsl(265_70%_55%)] focus:bg-card"
        />
        <Button size="sm" onClick={post} className="bg-[hsl(265_70%_55%)] hover:bg-[hsl(265_70%_50%)]">
          <Send className="mr-1 h-3 w-3" /> Post
        </Button>
      </div>

      <ul className="mt-3 space-y-2">
        {notes.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-[12px] text-muted-foreground">
            No notes yet for this week.
          </li>
        )}
        {notes.map(n => (
          <li key={n.id} className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2">
            <p className="text-[12.5px] leading-snug">{n.note}</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">{n.author ?? "—"} · {n.createdAt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}