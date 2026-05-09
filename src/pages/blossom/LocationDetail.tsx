import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft, ShieldCheck, BookOpen, Folder, Phone, ExternalLink } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blossomLocations } from "@/data/blossomOS";

export default function LocationDetail() {
  const { id } = useParams();
  const loc = blossomLocations.find((l) => l.id === id);
  if (!loc) {
    return (
      <GlassPageShell title="Location not found" description="">
        <Link to="/blossom/locations" className="text-sm text-primary">← Back</Link>
      </GlassPageShell>
    );
  }
  return (
    <GlassPageShell
      eyebrow="Location"
      eyebrowIcon={MapPin}
      title={loc.name}
      description={loc.address ?? `${loc.type} · ${loc.state}`}
      actions={<Link to="/blossom/locations"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Location-specific trainings</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>· State compliance training ({loc.state})</li>
            <li>· Local clinic onboarding</li>
            <li>· Emergency procedures</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Folder className="h-4 w-4 text-primary" />Location-specific resources</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>· {loc.name} contact directory</li>
            <li>· Floor plans & evacuation</li>
            <li>· Vendor contacts</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />Contacts</h3>
          <p className="text-sm text-muted-foreground">Site lead, regional director, and emergency contacts placeholder.</p>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><ExternalLink className="h-4 w-4 text-primary" />Login links</h3>
          <ul className="text-sm space-y-1.5 text-primary">
            <li>CentralReach</li>
            <li>Monday.com</li>
            <li>Viventium</li>
          </ul>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Compliance requirements</h3>
          <div className="flex flex-wrap gap-2">
            {loc.compliance.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
          </div>
        </Card>
      </div>
    </GlassPageShell>
  );
}
