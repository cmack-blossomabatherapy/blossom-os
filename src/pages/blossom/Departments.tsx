import { Link } from "react-router-dom";
import { Building2, Users as UsersIcon, BookOpen, Folder, ArrowRight } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Badge } from "@/components/ui/badge";
import { blossomDepartments } from "@/data/blossomOS";

export default function Departments() {
  return (
    <GlassPageShell
      eyebrow="Departments"
      eyebrowIcon={Building2}
      title="Department hubs"
      description="Every Blossom department has its own home — owners, teams, training, resources, and KPIs in one place."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {blossomDepartments.map((d) => (
          <Link
            key={d.id}
            to={`/blossom/departments/${d.id}`}
            className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-[10px]">{d.memberCount} members</Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">{d.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{d.description}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">Owner · <span className="text-foreground font-medium">{d.owner}</span></p>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{d.trainings}</span>
              <span className="inline-flex items-center gap-1"><Folder className="h-3 w-3" />{d.resources}</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </GlassPageShell>
  );
}
