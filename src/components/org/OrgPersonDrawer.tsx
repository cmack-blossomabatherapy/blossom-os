/**
 * Org chart drill-down drawer: person, role responsibilities, chain of
 * command, direct reports (click to drill deeper) and editor controls for the
 * reporting line.
 */
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Crosshair, ExternalLink, Mail, RotateCcw, Users } from "lucide-react";
import {
  ancestorsOf,
  canReparent,
  type OrgTree,
} from "@/lib/os/orgChart/tree";
import { cleanJobTitle, roleProfileForTitle } from "@/lib/os/orgChart/responsibilities";

export function OrgPersonDrawer({
  tree,
  personId,
  onOpenChange,
  onSelect,
  onFocus,
  canEdit,
  onReparent,
  onResetParent,
}: {
  tree: OrgTree;
  personId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onFocus: (id: string) => void;
  canEdit: boolean;
  onReparent: (childId: string, parentId: string | null) => void;
  onResetParent: (childId: string) => void;
}) {
  const node = personId ? tree.nodes.get(personId) : null;
  const person = node?.person ?? null;
  const role = roleProfileForTitle(person?.title);
  const chain = node ? ancestorsOf(tree, node.id).filter((id) => id !== tree.rootId) : [];
  const reports = node?.childIds ?? [];
  const reparentOptions = node
    ? Array.from(tree.nodes.values())
        .filter((n) => !n.isRoot && canReparent(tree, node.id, n.id))
        .sort((a, b) => (a.person?.name ?? "").localeCompare(b.person?.name ?? ""))
    : [];

  return (
    <Sheet open={!!personId} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {person && node && (
          <>
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-xl">{person.name}</SheetTitle>
              <SheetDescription>
                {cleanJobTitle(person.title) || role.label}
                {person.departmentName ? ` · ${person.departmentName}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">{role.label}</Badge>
              {person.state && (
                <Badge variant="outline" className="rounded-full">{person.state}</Badge>
              )}
              {person.leadershipLevel && person.leadershipLevel !== "individual" && (
                <Badge variant="outline" className="rounded-full capitalize">
                  {person.leadershipLevel}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full">
                Source: {node.parentSource === "manager" ? "Viventium manager" : node.parentSource}
              </Badge>
            </div>

            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Responsibilities
              </h3>
              <ul className="mt-2 space-y-1.5">
                {role.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>

            {chain.length > 0 && (
              <section className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Chain of command
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
                  {[...chain].reverse().map((id, idx) => (
                    <span key={id} className="flex items-center gap-1">
                      {idx > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
                      <button
                        type="button"
                        className="rounded-md px-1.5 py-0.5 text-primary hover:bg-muted"
                        onClick={() => onSelect(id)}
                      >
                        {tree.nodes.get(id)?.person?.name ?? "—"}
                      </button>
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Users className="size-3.5" /> Direct reports ({reports.length})
                {node.totalReports > reports.length && (
                  <span className="font-normal normal-case">· {node.totalReports} total</span>
                )}
              </h3>
              {reports.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No direct reports.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border/60">
                  {reports.map((id) => {
                    const r = tree.nodes.get(id);
                    if (!r?.person) return null;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onSelect(id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/60"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {r.person.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {cleanJobTitle(r.person.title)}
                            </span>
                          </span>
                          <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                            {r.totalReports > 0 && <>{r.totalReports}</>}
                            <ChevronRight className="size-3.5" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {canEdit && (
              <section className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reporting line
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <Select
                    value={node.parentId && node.parentId !== tree.rootId ? node.parentId : "__top__"}
                    onValueChange={(v) =>
                      onReparent(node.id, v === "__top__" ? null : v)
                    }
                  >
                    <SelectTrigger className="h-9 flex-1 rounded-xl text-sm">
                      <SelectValue placeholder="Reports to" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__top__">Top of chart</SelectItem>
                      {reparentOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.person?.name}
                          {o.person?.title ? ` — ${cleanJobTitle(o.person.title)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl"
                    title="Reset to the Viventium/HR manager"
                    onClick={() => onResetParent(node.id)}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
              </section>
            )}

            <div className="mt-5 flex flex-wrap gap-2 pb-6">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onFocus(node.id)}>
                <Crosshair className="size-4" /> Focus in chart
              </Button>
              {person.email && (
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <a href={`mailto:${person.email}`}>
                    <Mail className="size-4" /> Email
                  </a>
                </Button>
              )}
              <Button asChild size="sm" className="rounded-xl">
                <Link to={`/user-management/${person.id}`}>
                  <ExternalLink className="size-4" /> Open profile
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}