import { useMemo, useState } from "react";
import { Search, Undo2, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TRAINING_PATHS } from "@/lib/academy/trainingPaths";
import {
  ALL_ROLE_SLUGS,
  DEFAULT_ROLE_TO_SLUG,
  FALLBACK_PATH_SLUG,
  humanizeRoleSlug,
} from "@/lib/training/roleJourneyAssignments";
import { useRoleJourneyAssignments } from "@/hooks/useRoleJourneyAssignments";
import { cn } from "@/lib/utils";

/**
 * HR-managed mapping between a Blossom OS role slug and the Training
 * Academy wireframe path that role should see. Lives under the
 * Training Management Center → "Role Journeys" tab.
 */
export function RoleJourneyAssignmentsView() {
  const { overrides, save, clear, clearAll, loading } = useRoleJourneyAssignments();
  const [query, setQuery] = useState("");
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ROLE_SLUGS.filter((slug) => {
      if (!q) return true;
      return (
        slug.toLowerCase().includes(q) ||
        humanizeRoleSlug(slug).toLowerCase().includes(q)
      );
    });
  }, [query]);

  const handleSelect = async (roleSlug: string, pathSlug: string) => {
    setPendingRole(roleSlug);
    const res = await save(roleSlug, pathSlug);
    setPendingRole(null);
    if (res.ok) toast.success(`Updated ${humanizeRoleSlug(roleSlug)}`);
    else toast.error(res.error ?? "Could not save assignment");
  };

  const handleReset = async (roleSlug: string) => {
    setPendingRole(roleSlug);
    const res = await clear(roleSlug);
    setPendingRole(null);
    if (res.ok) toast.success(`Reset ${humanizeRoleSlug(roleSlug)} to default`);
    else toast.error(res.error ?? "Could not reset");
  };

  const handleResetAll = async () => {
    const res = await clearAll();
    if (res.ok) toast.success("All role journeys reset to defaults");
    else toast.error(res.error ?? "Could not reset all");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">Role Journeys</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
            Choose which Training Academy wireframe each role sees on their home page.
            Leave blank to use the built-in default.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset all to defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset every role journey?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears every override. Roles will fall back to their default
                wireframe assignment. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleResetAll()}>
                Reset all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles…"
          className="h-10 rounded-xl pl-10 text-[13.5px]"
        />
      </div>

      {loading && (
        <p className="text-[13px] text-muted-foreground">Loading assignments…</p>
      )}

      <div className="space-y-2">
        {rows.map((roleSlug) => {
          const defaultSlug = DEFAULT_ROLE_TO_SLUG[roleSlug] ?? FALLBACK_PATH_SLUG;
          const override = overrides[roleSlug];
          const activeSlug = override ?? defaultSlug;
          const isCustom = !!override;
          const isPending = pendingRole === roleSlug;
          return (
            <div
              key={roleSlug}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors",
                isCustom && "border-primary/30 bg-primary/[0.03]",
              )}
            >
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-foreground">
                    {humanizeRoleSlug(roleSlug)}
                  </span>
                  {isCustom ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/40 bg-primary/10 text-primary"
                    >
                      Custom
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {roleSlug}
                </p>
              </div>
              <div className="min-w-[240px]">
                <Select
                  value={activeSlug}
                  onValueChange={(v) => void handleSelect(roleSlug, v)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-10 rounded-xl text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_PATHS.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.title}
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          {p.slug}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                disabled={!isCustom || isPending}
                onClick={() => void handleReset(roleSlug)}
              >
                <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-center text-[13px] text-muted-foreground">
            No roles match "{query}".
          </p>
        )}
      </div>

      <p className="pt-2 text-[12px] text-muted-foreground">
        <Save className="mr-1 inline h-3 w-3" />
        Changes save automatically and sync to every learner in real time.
      </p>
    </div>
  );
}