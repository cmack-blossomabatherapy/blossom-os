import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Plus, Trash2, Save, X, Pin } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCanManageCompanyHome,
  fetchAllCalendarEvents,
  fetchAllUpdates,
  fetchAllHighlights,
  type CompanyCalendarEvent,
  type CompanyUpdate,
  type CompanyHighlight,
} from "@/hooks/useCompanyHome";
import { toast } from "sonner";

export default function CompanyHomeManage() {
  const canManage = useCanManageCompanyHome();
  const { user, displayName } = useAuth();
  const [events, setEvents] = useState<CompanyCalendarEvent[]>([]);
  const [updates, setUpdates] = useState<CompanyUpdate[]>([]);
  const [highlights, setHighlights] = useState<CompanyHighlight[]>([]);

  const reload = async () => {
    const [e, u, h] = await Promise.all([
      fetchAllCalendarEvents(),
      fetchAllUpdates(),
      fetchAllHighlights(),
    ]);
    setEvents(e);
    setUpdates(u);
    setHighlights(h);
  };

  useEffect(() => {
    void reload();
  }, []);

  if (!canManage) return <Navigate to="/home" replace />;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10 space-y-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to Company Home
            </Link>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
              Manage Company Home
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Post updates, add calendar dates, and curate highlights for the whole company.
            </p>
          </div>
        </header>

        <UpdatesEditor
          items={updates}
          onReload={reload}
          authorName={displayName}
          userId={user?.id}
        />
        <CalendarEditor items={events} onReload={reload} userId={user?.id} />
        <HighlightsEditor items={highlights} onReload={reload} userId={user?.id} />
      </div>
    </OSShell>
  );
}

/* ---------------- Updates ---------------- */
function UpdatesEditor({
  items, onReload, authorName, userId,
}: {
  items: CompanyUpdate[];
  onReload: () => Promise<void>;
  authorName: string;
  userId: string | undefined;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Add a title and body");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("company_updates").insert({
      title: title.trim(),
      body: body.trim(),
      author_name: authorName,
      pinned,
      published: true,
      created_by: userId ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not post update", { description: error.message });
      return;
    }
    setTitle("");
    setBody("");
    setPinned(false);
    toast.success("Update posted");
    await onReload();
  };

  const togglePin = async (u: CompanyUpdate) => {
    const { error } = await supabase
      .from("company_updates")
      .update({ pinned: !u.pinned })
      .eq("id", u.id);
    if (error) toast.error("Update failed", { description: error.message });
    else await onReload();
  };

  const togglePublish = async (u: CompanyUpdate) => {
    const { error } = await supabase
      .from("company_updates")
      .update({ published: !u.published })
      .eq("id", u.id);
    if (error) toast.error("Update failed", { description: error.message });
    else await onReload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this update?")) return;
    const { error } = await supabase.from("company_updates").delete().eq("id", id);
    if (error) toast.error("Delete failed", { description: error.message });
    else await onReload();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Updates</h2>
      <Card className="rounded-2xl border-border/70 bg-card p-5 space-y-3">
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Welcome to Q3" />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What do you want to share?" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={pinned} onCheckedChange={setPinned} />
              Pin to top
            </label>
            <Button onClick={create} disabled={busy} className="rounded-xl">
              <Plus className="size-4" /> Post update
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((u) => (
          <Card key={u.id} className="rounded-2xl border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {u.pinned && <Pin className="inline size-3 mr-1 text-primary" />}
                  {u.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(parseISO(u.published_at), "MMM d, yyyy")}
                  {u.author_name ? ` · ${u.author_name}` : ""}
                  {!u.published ? " · Draft" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => togglePin(u)} className="rounded-lg text-xs">
                  {u.pinned ? "Unpin" : "Pin"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => togglePublish(u)} className="rounded-lg text-xs">
                  {u.published ? "Unpublish" : "Publish"}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(u.id)} className="rounded-lg">
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        )}
      </div>
    </section>
  );
}

/* ---------------- Calendar ---------------- */
function CalendarEditor({
  items, onReload, userId,
}: {
  items: CompanyCalendarEvent[];
  onReload: () => Promise<void>;
  userId: string | undefined;
}) {
  const [title, setTitle] = useState("");
  const [starts_on, setStartsOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("company_event");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim() || !starts_on) {
      toast.error("Add a title and date");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("company_calendar_events").insert({
      title: title.trim(),
      starts_on,
      category,
      location: location.trim() || null,
      description: description.trim() || null,
      all_day: true,
      created_by: userId ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not add event", { description: error.message });
      return;
    }
    setTitle("");
    setLocation("");
    setDescription("");
    toast.success("Event added");
    await onReload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("company_calendar_events").delete().eq("id", id);
    if (error) toast.error("Delete failed", { description: error.message });
    else await onReload();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Company Calendar</h2>
      <Card className="rounded-2xl border-border/70 bg-card p-5 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. All Company Meeting" />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={starts_on} onChange={(e) => setStartsOn(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom / Atlanta HQ / …" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="company_event / holiday / training …" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={create} disabled={busy} className="rounded-xl">
            <Plus className="size-4" /> Add event
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {items.map((ev) => (
          <Card key={ev.id} className="rounded-2xl border-border/70 bg-card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{ev.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(ev.starts_on), "MMM d, yyyy")}
                {ev.location ? ` · ${ev.location}` : ""}
                {` · ${ev.category}`}
              </p>
              {ev.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
              )}
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(ev.id)} className="rounded-lg">
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
      </div>
    </section>
  );
}

/* ---------------- Highlights ---------------- */
function HighlightsEditor({
  items, onReload, userId,
}: {
  items: CompanyHighlight[];
  onReload: () => Promise<void>;
  userId: string | undefined;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [link_url, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("company_highlights").insert({
      title: title.trim(),
      body: body.trim() || null,
      image_url: image_url.trim() || null,
      link_url: link_url.trim() || null,
      sort_order: items.length,
      published: true,
      created_by: userId ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not add highlight", { description: error.message });
      return;
    }
    setTitle(""); setBody(""); setImageUrl(""); setLinkUrl("");
    toast.success("Highlight added");
    await onReload();
  };

  const togglePublish = async (h: CompanyHighlight) => {
    const { error } = await supabase
      .from("company_highlights")
      .update({ published: !h.published })
      .eq("id", h.id);
    if (error) toast.error("Update failed", { description: error.message });
    else await onReload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this highlight?")) return;
    const { error } = await supabase.from("company_highlights").delete().eq("id", id);
    if (error) toast.error("Delete failed", { description: error.message });
    else await onReload();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Highlights</h2>
      <Card className="rounded-2xl border-border/70 bg-card p-5 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Charlotte clinic open!" />
          </div>
          <div>
            <Label className="text-xs">Image URL (optional)</Label>
            <Input value={image_url} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Body (optional)</Label>
            <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Link (optional)</Label>
            <Input value={link_url} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={create} disabled={busy} className="rounded-xl">
            <Plus className="size-4" /> Add highlight
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {items.map((h) => (
          <Card key={h.id} className="rounded-2xl border-border/70 bg-card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-3">
              {h.image_url && (
                <img src={h.image_url} alt="" className="size-12 rounded-lg object-cover border border-border/60" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{h.title}</p>
                {h.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{h.body}</p>}
                {!h.published && <p className="text-xs text-muted-foreground">Draft</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => togglePublish(h)} className="rounded-lg text-xs">
                {h.published ? "Unpublish" : "Publish"}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(h.id)} className="rounded-lg">
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No highlights yet.</p>}
      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = { Save, X };