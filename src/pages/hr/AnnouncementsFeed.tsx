import { useMemo, useState } from "react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Megaphone, Pin, Sparkles, Heart, ThumbsUp, PartyPopper, Hand, Plus,
  FileText, Image as ImageIcon, Paperclip, Search, AlertTriangle, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Category = "Company" | "Clinical" | "Operations" | "Culture" | "Policy" | "Wins";
type ReactionKey = "applaud" | "love" | "celebrate" | "thanks";
type Attachment = { name: string; size: string; kind: "pdf" | "image" | "doc" };

type Announcement = {
  id: string;
  title: string;
  body: string;
  category: Category;
  author: { name: string; role: string; initials: string };
  publishedAt: string;
  pinned?: boolean;
  featured?: boolean;
  urgent?: boolean;
  attachments?: Attachment[];
  reactions: Record<ReactionKey, number>;
};

const categoryTone: Record<Category, string> = {
  Company: "bg-primary/12 text-primary border-primary/30",
  Clinical: "bg-info/12 text-info border-info/30",
  Operations: "bg-accent/15 text-accent border-accent/30",
  Culture: "bg-success/12 text-success border-success/30",
  Policy: "bg-warning/12 text-warning border-warning/30",
  Wins: "bg-destructive/10 text-destructive border-destructive/30",
};

const reactionMeta: Record<ReactionKey, { icon: typeof Heart; label: string; tone: string }> = {
  applaud: { icon: Hand, label: "Applaud", tone: "text-primary" },
  love: { icon: Heart, label: "Love", tone: "text-destructive" },
  celebrate: { icon: PartyPopper, label: "Celebrate", tone: "text-warning" },
  thanks: { icon: ThumbsUp, label: "Thanks", tone: "text-info" },
};

const attachmentIcon = (k: Attachment["kind"]) =>
  k === "pdf" ? FileText : k === "image" ? ImageIcon : Paperclip;

const initialFeed: Announcement[] = [
  {
    id: "a1",
    title: "Welcome to Q2 — our biggest quarter yet",
    body:
      "Team, we're entering Q2 with three new clinics opening, a refreshed clinical model, and the strongest census in Blossom history. Thank you for the work that got us here. Read the full quarterly memo attached and join the all-hands Friday at 11am MT.",
    category: "Company",
    author: { name: "Dr. Sarah Mitchell", role: "CEO", initials: "SM" },
    publishedAt: "2h ago",
    pinned: true,
    featured: true,
    attachments: [
      { name: "Q2-Strategy-Memo.pdf", size: "1.4 MB", kind: "pdf" },
      { name: "Clinic-Openings-Map.png", size: "320 KB", kind: "image" },
    ],
    reactions: { applaud: 42, love: 18, celebrate: 31, thanks: 9 },
  },
  {
    id: "a2",
    title: "New telehealth consent forms — effective Monday",
    body:
      "We've updated the telehealth consent packet to align with the new state guidance. Please use the new forms starting Monday and discard old printed copies.",
    category: "Policy",
    author: { name: "Priya Anand", role: "Head of People & Culture", initials: "PA" },
    publishedAt: "Yesterday",
    urgent: true,
    attachments: [{ name: "Telehealth-Consent-v3.pdf", size: "210 KB", kind: "pdf" }],
    reactions: { applaud: 6, love: 1, celebrate: 0, thanks: 14 },
  },
  {
    id: "a3",
    title: "Phoenix Clinic hit 95% session attendance for the month",
    body:
      "Massive shoutout to the Phoenix team — 95% delivered hours against scheduled in March. Family satisfaction is up too. Keep going.",
    category: "Wins",
    author: { name: "Marcus Reyes", role: "CCO", initials: "MR" },
    publishedAt: "2d ago",
    featured: true,
    reactions: { applaud: 28, love: 11, celebrate: 22, thanks: 4 },
  },
  {
    id: "a4",
    title: "April culture week — small joys, big wins",
    body:
      "Themed days, lunch on us Wednesday, and a peer recognition leaderboard. Calendar attached — tell your manager what you'd love to see.",
    category: "Culture",
    author: { name: "Renee Kim", role: "Culture Lead", initials: "RK" },
    publishedAt: "3d ago",
    attachments: [{ name: "Culture-Week-Calendar.pdf", size: "180 KB", kind: "pdf" }],
    reactions: { applaud: 15, love: 19, celebrate: 12, thanks: 3 },
  },
  {
    id: "a5",
    title: "Scheduling: weekend coverage SOP refresh",
    body:
      "We've rebuilt the weekend coverage flow to cut callback time in half. Review the updated SOP before your next on-call rotation.",
    category: "Operations",
    author: { name: "Devon Carter", role: "Scheduling Lead", initials: "DC" },
    publishedAt: "5d ago",
    attachments: [{ name: "Weekend-Coverage-SOP.doc", size: "94 KB", kind: "doc" }],
    reactions: { applaud: 9, love: 2, celebrate: 1, thanks: 11 },
  },
];

const categories: Category[] = ["Company", "Clinical", "Operations", "Culture", "Policy", "Wins"];

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function AnnouncementsFeed() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const meName = useMemo(() => {
    const meta = user?.user_metadata as { full_name?: string; display_name?: string } | undefined;
    return meta?.full_name || meta?.display_name || user?.email?.split("@")[0]?.replace(/[._-]/g, " ") || "You";
  }, [user]);

  const [feed, setFeed] = useState<Announcement[]>(initialFeed);
  const [reacted, setReacted] = useState<Record<string, ReactionKey | undefined>>({});
  const [tab, setTab] = useState<"all" | "pinned" | "urgent">("all");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    title: string; body: string; category: Category; pinned: boolean; featured: boolean; urgent: boolean;
    attachments: Attachment[];
  }>({
    title: "", body: "", category: "Company", pinned: false, featured: false, urgent: false, attachments: [],
  });

  const onReact = (id: string, key: ReactionKey) => {
    setFeed((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const current = reacted[id];
        const next = { ...a.reactions };
        if (current === key) next[key] = Math.max(0, next[key] - 1);
        else {
          if (current) next[current] = Math.max(0, next[current] - 1);
          next[key] = next[key] + 1;
        }
        return { ...a, reactions: next };
      }),
    );
    setReacted((p) => ({ ...p, [id]: p[id] === key ? undefined : key }));
  };

  const togglePin = (id: string) =>
    setFeed((prev) => prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = Array.from(files).slice(0, 5).map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      kind: f.type.startsWith("image/") ? "image" : f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "doc",
    }));
    setForm((s) => ({ ...s, attachments: [...s.attachments, ...next].slice(0, 5) }));
  };

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    const fresh: Announcement = {
      id: `a-${Date.now()}`,
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      author: { name: meName, role: isAdmin ? "Admin" : "Team", initials: initialsOf(meName) },
      publishedAt: "just now",
      pinned: form.pinned,
      featured: form.featured,
      urgent: form.urgent,
      attachments: form.attachments.length ? form.attachments : undefined,
      reactions: { applaud: 0, love: 0, celebrate: 0, thanks: 0 },
    };
    setFeed((prev) => [fresh, ...prev]);
    setOpen(false);
    setForm({ title: "", body: "", category: "Company", pinned: false, featured: false, urgent: false, attachments: [] });
    toast({ title: "Announcement posted", description: "Your team will see it in their feed." });
  };

  const filtered = useMemo(() => {
    let list = feed;
    if (tab === "pinned") list = list.filter((a) => a.pinned);
    if (tab === "urgent") list = list.filter((a) => a.urgent);
    if (activeCategory !== "All") list = list.filter((a) => a.category === activeCategory);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((a) => `${a.title} ${a.body} ${a.author.name}`.toLowerCase().includes(q));
    return list.slice().sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [feed, tab, activeCategory, query]);

  const pinned = filtered.filter((a) => a.pinned);
  const featured = filtered.find((a) => a.featured && !a.pinned);
  const rest = filtered.filter((a) => !a.pinned && a.id !== featured?.id);

  return (
    <GlassPageShell
      eyebrow="People & Culture"
      eyebrowIcon={Megaphone}
      title="Announcements"
      description="Company, clinical, and culture updates — pinned, featured, and easy to react to."
      actions={
        isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New announcement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Make it scannable" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Message</label>
                  <Textarea
                    className="min-h-[120px]"
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Be clear and warm. Include the why."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, category: c }))}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          form.category === c ? categoryTone[c] : "border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Attachments</label>
                  <div className="mt-1">
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
                      <Paperclip className="h-4 w-4" />
                      <span>Attach files (max 5)</span>
                      <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                    </label>
                    {form.attachments.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {form.attachments.map((att, i) => {
                          const Icon = attachmentIcon(att.kind);
                          return (
                            <li key={`${att.name}-${i}`} className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate text-foreground">{att.name}</span>
                              <span className="text-muted-foreground">{att.size}</span>
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Remove attachment"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <ToggleRow label="Pin to top" checked={form.pinned} onCheckedChange={(v) => setForm((f) => ({ ...f, pinned: v }))} />
                  <ToggleRow label="Feature" checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))} />
                  <ToggleRow label="Urgent" checked={form.urgent} onCheckedChange={(v) => setForm((f) => ({ ...f, urgent: v }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit}>Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    >
      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pinned" className="gap-1.5"><Pin className="h-3 w-3" /> Pinned</TabsTrigger>
            <TabsTrigger value="urgent" className="gap-1.5"><AlertTriangle className="h-3 w-3" /> Urgent</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full md:w-72">
          <Search className="absolute z-10 left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search announcements" className="pl-8" />
        </div>
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0">
        {(["All", ...categories] as const).map((c) => {
          const active = activeCategory === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                active
                  ? c === "All"
                    ? "border-foreground bg-foreground text-background"
                    : categoryTone[c as Category]
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Pin className="h-3 w-3" /> Pinned
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {pinned.map((a) => (
              <AnnouncementCard
                key={a.id} a={a} isAdmin={isAdmin} reacted={reacted[a.id]}
                onReact={(k) => onReact(a.id, k)} onTogglePin={() => togglePin(a.id)} variant="pinned"
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured hero */}
      {featured && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Featured
          </h2>
          <AnnouncementCard
            a={featured} isAdmin={isAdmin} reacted={reacted[featured.id]}
            onReact={(k) => onReact(featured.id, k)} onTogglePin={() => togglePin(featured.id)} variant="featured"
          />
        </section>
      )}

      {/* Rest */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All updates</h2>
        {rest.length === 0 && (
          <Card className="border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Nothing matches those filters.
          </Card>
        )}
        <div className="space-y-3">
          {rest.map((a) => (
            <AnnouncementCard
              key={a.id} a={a} isAdmin={isAdmin} reacted={reacted[a.id]}
              onReact={(k) => onReact(a.id, k)} onTogglePin={() => togglePin(a.id)} variant="default"
            />
          ))}
        </div>
      </section>
    </GlassPageShell>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-xs font-medium text-foreground">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function ReactionBar({
  reactions, reacted, onReact,
}: { reactions: Record<ReactionKey, number>; reacted: ReactionKey | undefined; onReact: (k: ReactionKey) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(Object.keys(reactionMeta) as ReactionKey[]).map((k) => {
        const Meta = reactionMeta[k];
        const Icon = Meta.icon;
        const active = reacted === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onReact(k)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition",
              active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            aria-pressed={active}
            aria-label={Meta.label}
          >
            <Icon className={cn("h-3.5 w-3.5", !active && Meta.tone, active && "scale-110 transition")} />
            <span className="tabular-nums">{reactions[k]}</span>
          </button>
        );
      })}
    </div>
  );
}

function AnnouncementCard({
  a, isAdmin, reacted, onReact, onTogglePin, variant,
}: {
  a: Announcement;
  isAdmin: boolean;
  reacted: ReactionKey | undefined;
  onReact: (k: ReactionKey) => void;
  onTogglePin: () => void;
  variant: "pinned" | "featured" | "default";
}) {
  const isFeatured = variant === "featured";
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 p-5 md:p-6",
        variant === "pinned" && "border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card",
        isFeatured && "border-primary/30 bg-gradient-to-br from-primary/12 via-card to-card md:p-7",
      )}
    >
      {isFeatured && (
        <>
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-accent/12 blur-2xl" aria-hidden />
        </>
      )}
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className={categoryTone[a.category]}>{a.category}</Badge>
          {a.pinned && <Badge variant="outline" className="gap-1 border-primary/40 text-primary"><Pin className="h-3 w-3" /> Pinned</Badge>}
          {a.urgent && <Badge variant="outline" className="gap-1 border-warning/40 text-warning"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>}
          {a.featured && !a.pinned && <Badge variant="outline" className="gap-1 border-accent/40 text-accent"><Sparkles className="h-3 w-3" /> Featured</Badge>}
          <span className="ml-auto text-muted-foreground">{a.publishedAt}</span>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <Avatar className={cn("h-10 w-10", isFeatured && "h-12 w-12 ring-2 ring-primary/30")}>
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{a.author.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-semibold text-foreground", isFeatured ? "text-xl leading-tight" : "text-base")}>
              {a.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.author.name} · {a.author.role}</p>
            <p className={cn("mt-3 leading-relaxed text-foreground", isFeatured ? "text-base" : "text-sm")}>{a.body}</p>

            {a.attachments && a.attachments.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {a.attachments.map((att, i) => {
                  const Icon = attachmentIcon(att.kind);
                  return (
                    <li key={`${att.name}-${i}`}>
                      <button
                        type="button"
                        className="group flex w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-left text-xs hover:border-primary/40 hover:bg-card"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate font-medium text-foreground group-hover:text-primary">{att.name}</span>
                        <span className="text-muted-foreground">{att.size}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
          <ReactionBar reactions={a.reactions} reacted={reacted} onReact={onReact} />
          {isAdmin && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onTogglePin}>
              <Pin className={cn("h-3.5 w-3.5", a.pinned && "text-primary")} />
              {a.pinned ? "Unpin" : "Pin"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}