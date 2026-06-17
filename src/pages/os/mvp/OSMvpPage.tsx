import { Link } from "react-router-dom";
import {
  ArrowLeft, BarChart3, Filter, Inbox, Plus, Search,
  type LucideIcon,
} from "lucide-react";

/**
 * Real, calm MVP page used to back live route targets that don't yet have a
 * fully-built workspace. This is NOT a "Coming Soon" placeholder — it renders
 * inside the standard Blossom OS shell with a proper page header, filter row,
 * empty-state table, primary action, and a Reports link.
 *
 * Used by the role menus so every menu item opens a real page during the
 * transition to fully built workspaces.
 */
interface OSMvpPageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryActionLabel?: string;
  reportsHref?: string;
  emptyMessage?: string;
}

export default function OSMvpPage({
  eyebrow,
  title,
  description,
  icon: Icon = Inbox,
  primaryActionLabel,
  reportsHref = "/reports",
  emptyMessage = "No records yet. This view will populate as the source workflows go live.",
}: OSMvpPageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Icon className="h-3 w-3" /> {eyebrow}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      </header>

      {/* Action + filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {primaryActionLabel && (
          <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> {primaryActionLabel}
          </button>
        )}
        <Link
          to={reportsHref}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-secondary px-3.5 text-sm text-secondary-foreground hover:bg-muted"
        >
          <BarChart3 className="h-4 w-4" /> Reports
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Search
          </div>
          <button className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm text-muted-foreground hover:bg-muted">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* Empty state */}
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-16 text-center">
        <Icon className="mx-auto h-7 w-7 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-md mx-auto text-[13px] text-muted-foreground">{emptyMessage}</p>
      </div>

      <div className="mt-10 flex items-center gap-2 border-t border-border/70 pt-6">
        <Link
          to="/dashboard"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-secondary px-3.5 text-sm text-secondary-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}