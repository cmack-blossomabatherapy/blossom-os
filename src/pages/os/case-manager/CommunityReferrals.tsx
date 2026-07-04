import { useState } from "react";
import { Globe2, Plus, Archive, Search } from "lucide-react";
import { useCaseManagerWorkspace } from "@/hooks/useCaseManagerWorkspace";
import { CMPage, Pill, FilterBar, FormDialog } from "./_shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["Autism Resource","Local Program","Parent Support","Therapy Adjunct","Crisis Support","Other"];
const STATES = ["GA","NC","TN","VA","MD","FL","TX","National"];

export default function CommunityReferralsPage() {
  const w = useCaseManagerWorkspace();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [state, setState] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const resourceById = (id: string | null) => w.communityResources.find((r) => r.id === id);

  const rows = w.communityResources.filter((r) => {
    if (cat !== "all" && r.category !== cat) return false;
    if (state !== "all" && r.state !== state) return false;
    if (q) { const s = q.toLowerCase(); if (![r.name, r.description, r.notes, r.city, r.county, (r.tags ?? []).join(",")].some((x) => (x ?? "").toLowerCase().includes(s))) return false; }
    return true;
  });

  return (
    <CMPage
      eyebrow="Case Manager · Community"
      title="Community Referrals"
      description="Curated autism resources, support organizations, and local programs to share with families."
      loading={w.loading}
      error={w.error}
      empty={!w.loading && w.communityResources.length === 0 ? { icon: Globe2, title: "No community resources yet", hint: "Add your first shared community resource." } : null}
      actions={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add resource</Button>}
    >
      <FilterBar>
        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…" className="pl-8 w-64" /></div>
        <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={state} onValueChange={setState}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All states</SelectItem>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <span className="text-[11px] text-muted-foreground">{rows.length} of {w.communityResources.length}</span>
      </FilterBar>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="truncate text-[13.5px] font-semibold">{r.name}</p>{r.category && <p className="mt-0.5 text-[11px] text-muted-foreground">{r.category}</p>}</div>
              <Pill tone="calm">{r.state ?? "—"}</Pill>
            </div>
            {r.description && <p className="mt-2 text-[12px] text-foreground/80 line-clamp-3">{r.description}</p>}
            <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
              {r.city && <p>{r.city}{r.county ? `, ${r.county}` : ""}</p>}
              {r.website && <p>{r.website}</p>}
              {r.phone && <p>{r.phone}</p>}
              {r.email && <p>{r.email}</p>}
            </div>
            {r.tags && r.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{r.tags.map((t) => <Pill key={t} tone="cool">{t}</Pill>)}</div>}
            <div className="mt-3 flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setEditId(r.id)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await w.archiveCommunityResource(r.id); toast.success("Archived"); }}><Archive className="mr-1 h-3 w-3" /> Archive</Button>
            </div>
          </div>
        ))}
      </div>

      <FormDialog open={addOpen} onOpenChange={setAddOpen} title="Add community resource" submitLabel="Add"
        fields={[
          { key: "name", label: "Resource name", required: true },
          { key: "category", label: "Category", type: "select", options: CATEGORIES },
          { key: "state", label: "State", type: "select", options: STATES },
          { key: "city", label: "City" },
          { key: "county", label: "County" },
          { key: "website", label: "Website" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        onSubmit={async (v) => { await w.createCommunityResource({ ...v, active: true } as any); toast.success("Resource added"); }}
      />
      {editId && (
        <FormDialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)} title="Edit resource" submitLabel="Save"
          initial={resourceById(editId) as any}
          fields={[
            { key: "name", label: "Resource name", required: true },
            { key: "category", label: "Category", type: "select", options: CATEGORIES },
            { key: "state", label: "State", type: "select", options: STATES },
            { key: "city", label: "City" },
            { key: "county", label: "County" },
            { key: "website", label: "Website" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "notes", label: "Notes", type: "textarea" },
          ]}
          onSubmit={async (v) => { if (!editId) return; await w.updateCommunityResource(editId, v as any); toast.success("Saved"); }}
        />
      )}
    </CMPage>
  );
}