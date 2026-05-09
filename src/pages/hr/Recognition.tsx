import { useMemo, useState } from "react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles, Send, MessageCircle, Trophy, Star, Heart, HandHeart, Crown, Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ReactionKey = "applause" | "heart" | "star";
type Comment = { id: string; author: string; initials: string; body: string; at: string };
type Recognition = {
  id: string;
  from: { name: string; initials: string; role: string };
  to: { name: string; initials: string; role: string };
  fromManager?: boolean;
  spotlight?: boolean;
  value?: "Family First" | "Extreme Ownership" | "Always Improving" | "Data Over Emotion";
  message: string;
  createdAt: string;
  reactions: Record<ReactionKey, number>;
  comments: Comment[];
};

const reactionMeta: Record<ReactionKey, { icon: typeof HandHeart; label: string; tone: string }> = {
  applause: { icon: HandHeart, label: "Applause", tone: "text-primary" },
  heart: { icon: Heart, label: "Love", tone: "text-destructive" },
  star: { icon: Star, label: "Star", tone: "text-warning" },
};

const valueTone: Record<NonNullable<Recognition["value"]>, string> = {
  "Family First": "bg-success/12 text-success border-success/30",
  "Extreme Ownership": "bg-primary/12 text-primary border-primary/30",
  "Always Improving": "bg-accent/15 text-accent border-accent/30",
  "Data Over Emotion": "bg-info/12 text-info border-info/30",
};

const initialFeed: Recognition[] = [
  {
    id: "r1",
    from: { name: "Marcus Reyes", initials: "MR", role: "Chief Clinical Officer" },
    to: { name: "Jordan Patel", initials: "JP", role: "RBT, Phoenix Clinic" },
    fromManager: true,
    spotlight: true,
    value: "Family First",
    message:
      "Jordan stayed late to walk a new family through their first session and turned a hesitant intake into a confident start. This is exactly the energy that defines Blossom — slow down, meet families where they are, and make them feel seen.",
    createdAt: "2h ago",
    reactions: { applause: 24, heart: 11, star: 6 },
    comments: [
      { id: "c1", author: "Priya Anand", initials: "PA", body: "So proud of you, Jordan! 💐", at: "1h ago" },
      { id: "c2", author: "Sam O.", initials: "SO", body: "This is the standard.", at: "45m ago" },
    ],
  },
  {
    id: "r2",
    from: { name: "Alicia Brooks", initials: "AB", role: "BCBA, Mesa Clinic" },
    to: { name: "Devon Carter", initials: "DC", role: "Scheduling Lead" },
    value: "Extreme Ownership",
    message:
      "Devon rebuilt our entire weekend coverage map in two hours when three call-outs hit at once. Zero family disruption.",
    createdAt: "Yesterday",
    reactions: { applause: 12, heart: 4, star: 3 },
    comments: [],
  },
  {
    id: "r3",
    from: { name: "Renee Kim", initials: "RK", role: "Intake Specialist" },
    to: { name: "Tomás Vega", initials: "TV", role: "Authorization Coordinator" },
    value: "Always Improving",
    message:
      "Tomás built a checklist for re-auths that cut our turnaround time by 38%. He shared it without anyone asking.",
    createdAt: "2d ago",
    reactions: { applause: 18, heart: 7, star: 5 },
    comments: [
      { id: "c3", author: "Marcus Reyes", initials: "MR", body: "Adding this to our SOP library.", at: "2d ago" },
    ],
  },
];

const monthlyLeaders = [
  { name: "Jordan Patel", role: "RBT", count: 14 },
  { name: "Tomás Vega", role: "Auth Coord.", count: 11 },
  { name: "Devon Carter", role: "Scheduling", count: 9 },
  { name: "Maya Lin", role: "Clinic Director", count: 7 },
];

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function Recognition() {
  const { user } = useAuth();
  const { toast } = useToast();
  const meName = useMemo(() => {
    const meta = user?.user_metadata as { full_name?: string; display_name?: string } | undefined;
    return meta?.full_name || meta?.display_name || user?.email?.split("@")[0]?.replace(/[._-]/g, " ") || "You";
  }, [user]);
  const meInitials = initialsOf(meName);

  const [feed, setFeed] = useState<Recognition[]>(initialFeed);
  const [reacted, setReacted] = useState<Record<string, ReactionKey | undefined>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{ to: string; value: Recognition["value"] | ""; message: string }>(
    { to: "", value: "", message: "" },
  );

  const toggleReaction = (id: string, key: ReactionKey) => {
    setFeed((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const current = reacted[id];
        const next = { ...r.reactions };
        if (current === key) next[key] = Math.max(0, next[key] - 1);
        else {
          if (current) next[current] = Math.max(0, next[current] - 1);
          next[key] = next[key] + 1;
        }
        return { ...r, reactions: next };
      }),
    );
    setReacted((prev) => ({ ...prev, [id]: prev[id] === key ? undefined : key }));
  };

  const submitComment = (id: string) => {
    const body = (drafts[id] || "").trim();
    if (!body) return;
    setFeed((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              comments: [...r.comments, { id: `c-${Date.now()}`, author: meName, initials: meInitials, body, at: "now" }],
            }
          : r,
      ),
    );
    setDrafts((d) => ({ ...d, [id]: "" }));
  };

  const submitRecognition = () => {
    if (!form.to.trim() || !form.message.trim()) {
      toast({ title: "Add a teammate and a message", variant: "destructive" });
      return;
    }
    const fresh: Recognition = {
      id: `r-${Date.now()}`,
      from: { name: meName, initials: meInitials, role: "Teammate" },
      to: { name: form.to.trim(), initials: initialsOf(form.to.trim()), role: "" },
      value: form.value || undefined,
      message: form.message.trim(),
      createdAt: "just now",
      reactions: { applause: 0, heart: 0, star: 0 },
      comments: [],
    };
    setFeed((prev) => [fresh, ...prev]);
    setForm({ to: "", value: "", message: "" });
    setCreateOpen(false);
    toast({ title: "Recognition shared", description: `${fresh.to.name} will see this in their feed.` });
  };

  const spotlight = feed.find((r) => r.spotlight);
  const rest = feed.filter((r) => r.id !== spotlight?.id);
  const managerFeed = feed.filter((r) => r.fromManager);

  return (
    <GlassPageShell
      eyebrow="People & Culture"
      eyebrowIcon={Sparkles}
      title="Recognition"
      description="Celebrate the moments that make Blossom feel like Blossom. Send applause, drop a comment, lift a teammate up."
      actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Recognize a teammate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send recognition</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Teammate</label>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Who do you want to recognize?"
                  value={form.to}
                  onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Core value (optional)</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(valueTone) as Array<NonNullable<Recognition["value"]>>).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, value: f.value === v ? "" : v }))}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        form.value === v ? valueTone[v] : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea
                  className="mt-1 min-h-[110px]"
                  placeholder="Be specific — what did they do and why does it matter?"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={submitRecognition} className="gap-2"><Send className="h-4 w-4" /> Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="manager">From leadership</TabsTrigger>
              <TabsTrigger value="spotlight">Spotlights</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {spotlight && <SpotlightCard rec={spotlight} reacted={reacted[spotlight.id]} onReact={(k) => toggleReaction(spotlight.id, k)} />}
              {rest.map((r) => (
                <RecognitionItem
                  key={r.id}
                  rec={r}
                  reacted={reacted[r.id]}
                  onReact={(k) => toggleReaction(r.id, k)}
                  open={!!openComments[r.id]}
                  onToggleComments={() => setOpenComments((s) => ({ ...s, [r.id]: !s[r.id] }))}
                  draft={drafts[r.id] || ""}
                  onDraftChange={(v) => setDrafts((d) => ({ ...d, [r.id]: v }))}
                  onSubmitComment={() => submitComment(r.id)}
                  meInitials={meInitials}
                />
              ))}
            </TabsContent>

            <TabsContent value="manager" className="mt-4 space-y-4">
              {managerFeed.length === 0 && <EmptyHint />}
              {managerFeed.map((r) => (
                <RecognitionItem
                  key={r.id}
                  rec={r}
                  reacted={reacted[r.id]}
                  onReact={(k) => toggleReaction(r.id, k)}
                  open={!!openComments[r.id]}
                  onToggleComments={() => setOpenComments((s) => ({ ...s, [r.id]: !s[r.id] }))}
                  draft={drafts[r.id] || ""}
                  onDraftChange={(v) => setDrafts((d) => ({ ...d, [r.id]: v }))}
                  onSubmitComment={() => submitComment(r.id)}
                  meInitials={meInitials}
                />
              ))}
            </TabsContent>

            <TabsContent value="spotlight" className="mt-4 space-y-4">
              {spotlight ? (
                <SpotlightCard rec={spotlight} reacted={reacted[spotlight.id]} onReact={(k) => toggleReaction(spotlight.id, k)} />
              ) : <EmptyHint />}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="overflow-hidden border-border/60">
            <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/40 px-4 py-3">
              <Trophy className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">This month's leaders</h3>
            </div>
            <ol className="divide-y divide-border/60">
              {monthlyLeaders.map((l, i) => (
                <li key={l.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    i === 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
                  )}>
                    {i === 0 ? <Crown className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.role}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{l.count}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Why recognition matters</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Specific, timely recognition is the #1 driver of retention in clinical teams. Be concrete — name the moment, not the trait.
            </p>
          </Card>
        </aside>
      </div>
    </GlassPageShell>
  );
}

function EmptyHint() {
  return (
    <Card className="border-dashed border-border/60 p-8 text-center">
      <p className="text-sm text-muted-foreground">Nothing here yet — be the first to recognize someone.</p>
    </Card>
  );
}

function ReactionBar({
  reactions, reacted, onReact,
}: { reactions: Record<ReactionKey, number>; reacted: ReactionKey | undefined; onReact: (k: ReactionKey) => void }) {
  return (
    <div className="flex items-center gap-1.5">
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
              "group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition",
              active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            aria-pressed={active}
            aria-label={Meta.label}
          >
            <Icon className={cn("h-3.5 w-3.5", active && "scale-110", !active && Meta.tone, "transition")} />
            <span className="tabular-nums">{reactions[k]}</span>
          </button>
        );
      })}
    </div>
  );
}

function SpotlightCard({
  rec, reacted, onReact,
}: { rec: Recognition; reacted: ReactionKey | undefined; onReact: (k: ReactionKey) => void }) {
  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/12 via-card to-card p-6 md:p-7">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-accent/12 blur-2xl" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1 bg-primary text-primary-foreground"><Crown className="h-3 w-3" /> Spotlight</Badge>
          {rec.value && <Badge variant="outline" className={valueTone[rec.value]}>{rec.value}</Badge>}
          {rec.fromManager && <Badge variant="outline" className="border-warning/40 text-warning">From leadership</Badge>}
          <span className="ml-auto text-xs text-muted-foreground">{rec.createdAt}</span>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/30">
            <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">{rec.to.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">{rec.to.name}</p>
            <p className="text-xs text-muted-foreground">{rec.to.role}</p>
            <p className="mt-3 text-base leading-relaxed text-foreground">{rec.message}</p>
            <p className="mt-3 text-xs text-muted-foreground">— {rec.from.name}, {rec.from.role}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <ReactionBar reactions={rec.reactions} reacted={reacted} onReact={onReact} />
          <span className="text-xs text-muted-foreground">{rec.comments.length} comments</span>
        </div>
      </div>
    </Card>
  );
}

function RecognitionItem({
  rec, reacted, onReact, open, onToggleComments, draft, onDraftChange, onSubmitComment, meInitials,
}: {
  rec: Recognition;
  reacted: ReactionKey | undefined;
  onReact: (k: ReactionKey) => void;
  open: boolean;
  onToggleComments: () => void;
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmitComment: () => void;
  meInitials: string;
}) {
  return (
    <Card className="overflow-hidden border-border/60 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {rec.value && <Badge variant="outline" className={valueTone[rec.value]}>{rec.value}</Badge>}
        {rec.fromManager && <Badge variant="outline" className="border-warning/40 text-warning">From leadership</Badge>}
        <span className="ml-auto text-muted-foreground">{rec.createdAt}</span>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{rec.to.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold text-foreground">{rec.from.name}</span>
            <span className="text-muted-foreground"> recognized </span>
            <span className="font-semibold text-foreground">{rec.to.name}</span>
            {rec.to.role && <span className="text-muted-foreground"> · {rec.to.role}</span>}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{rec.message}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <ReactionBar reactions={rec.reactions} reacted={reacted} onReact={onReact} />
        <Button variant="ghost" size="sm" onClick={onToggleComments} className="gap-1.5 text-xs">
          <MessageCircle className="h-3.5 w-3.5" />
          {rec.comments.length} {rec.comments.length === 1 ? "comment" : "comments"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
          {rec.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar className="h-7 w-7"><AvatarFallback className="bg-secondary text-[10px]">{c.initials}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1 rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-xs font-semibold text-foreground">{c.author}</p>
                  <p className="text-[10px] text-muted-foreground">{c.at}</p>
                </div>
                <p className="mt-0.5 text-sm text-foreground">{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2.5">
            <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-[10px] text-primary">{meInitials}</AvatarFallback></Avatar>
            <div className="flex-1">
              <Textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder="Add a comment…"
                className="min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onSubmitComment();
                  }
                }}
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={onSubmitComment} disabled={!draft.trim()} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}