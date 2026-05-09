import { Link } from "react-router-dom";
import { MapPin, Users as UsersIcon, BookOpen, ArrowRight } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Badge } from "@/components/ui/badge";
import { blossomLocations } from "@/data/blossomOS";

export default function Locations() {
  const states = blossomLocations.filter((l) => l.type === "State");
  const clinics = blossomLocations.filter((l) => l.type === "Clinic");
  return (
    <GlassPageShell
      eyebrow="Locations"
      eyebrowIcon={MapPin}
      title="States & clinics"
      description="Every Blossom location with its team, trainings, resources, and compliance requirements."
    >
      <div className="space-y-8">
        {[{ title: "States", items: states }, { title: "Clinics", items: clinics }].map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((loc) => (
                <Link
                  key={loc.id}
                  to={`/blossom/locations/${loc.id}`}
                  className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{loc.state}</Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{loc.name}</h3>
                  {loc.address && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{loc.address}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><UsersIcon className="h-3 w-3" />{loc.staffCount} staff</span>
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{loc.trainings}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </GlassPageShell>
  );
}
