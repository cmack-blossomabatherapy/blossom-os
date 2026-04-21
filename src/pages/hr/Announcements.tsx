import { useEffect, useMemo, useState } from "react";
import { Megaphone, Plus, Pin, AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  ANNOUNCEMENT_PRIORITY_META,
  type AnnouncementPriority, type HRAnnouncement,
} from "@/lib/hr/types";

export default function Announcements() {
  const { hasPerm, user } = useAuth();
  const canManage = hasPerm("hr.announcements.manage");
  const [items, setItems] = useState<HRAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pinned" | "urgent">("all");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("info");
  const [pinned, setPinned] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("hr_announcements").select("*")
      .order("pinned", { ascending: false }).order("publish_at", { ascending: false });
    setItems((data ?? []) as HRAnnouncement[]);
    setLoading(false);
  }

  async function create() {
    if (!title.trim() || !body.trim()) { toast.error("Title and body required."); return; }
    const { error } = await supabase.from("hr_announcements").insert({
      title: title.trim(), body: body.trim(), priority, pinned,
      audience: "all", author_id: user?.id ?? null,
      author_name: user?.email ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement posted.");
    setOpen(false); setTitle(""); setBody(""); setPriority("info"); setPinned(false);
    void load();
  }

  async function togglePin(a: HRAnnouncement) {
    const { error } = await supabase.from("hr_announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    if (error) toast.error(error.message); else void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("hr_announcements").delete().eq("id", id);
    if (error) toast.error(error.message); else void load();
  }

  const filtered = useMemo(() => {
    if (tab === "pinned") return items.filter((x) => x.pinned);
    if (tab === "urgent") return items.filter((x) => x.priority === "urgent");
    return items;
  }, [items, tab]);

  return (
    <PageShell
      title="Announcements"
      description="Company, state, and clinic-wide messages from HR & leadership."
      icon={Megaphone}
      actions={canManage ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New announcement</Button> : null}
    >
      <Card className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({items.length})</TabsTrigger>
            <TabsTrigger value="pinned">Pinned ({items.filter((x) => x.pinned).length})</TabsTrigger>
            <TabsTrigger value="urgent">Urgent ({items.filter((x) => x.priority === "urgent").length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? <Skeleton className="h-32" /> : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No announcements.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div key={a.id} className={cn("p-4 rounded-lg border", a.pinned ? "border-primary/40 bg-primary/5" : "border-border/40")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary" />}
                      {a.priority === "urgent" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", ANNOUNCEMENT_PRIORITY_META[a.priority].tone)}>
                        {ANNOUNCEMENT_PRIORITY_META[a.priority].label}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    </div>
                    <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{a.body}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {a.author_name ?? "HR"} · {new Date(a.publish_at).toLocaleString()}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => togglePin(a)}>
                        <Pin className={cn("h-3.5 w-3.5", a.pinned && "text-primary fill-primary")} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(a.id)}>Delete</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs text-muted-foreground">Message</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} /></div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as AnnouncementPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={pinned} onCheckedChange={setPinned} id="pinned" />
                <Label htmlFor="pinned" className="text-sm">Pin to top</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Post announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}