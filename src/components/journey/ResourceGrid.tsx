import { ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { JourneyResource } from "@/data/journey";

export function ResourceGrid({ resources }: { resources: JourneyResource[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Resources</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Everything you need, in one place.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {resources.map((r) => {
          const Icon = r.icon;
          const cardClass =
            "group rounded-xl border border-border/60 p-4 hover:border-primary/40 hover:shadow-md transition-all bg-gradient-to-br from-background to-muted/20";
          const inner = (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                {r.internalRoute ? (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{r.category}</p>
              <p className="text-sm font-semibold text-foreground mt-1">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.description}</p>
            </>
          );
          return r.internalRoute ? (
            <Link key={r.id} to={r.internalRoute} className={cardClass}>
              {inner}
            </Link>
          ) : (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className={cardClass}>
              {inner}
            </a>
          );
        })}
      </div>
    </div>
  );
}
