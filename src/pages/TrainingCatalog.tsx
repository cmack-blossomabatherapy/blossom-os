import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trainingDepartments } from "@/data/training";

const featured = [
  { title: "Blossom Systems Overview", category: "Systems", required: true },
  { title: "HIPAA & Compliance Basics", category: "Compliance", required: true },
  { title: "Parent Communication Essentials", category: "Clinical Support", required: false },
  { title: "Leadership Foundations", category: "Leadership", required: false },
];

const categories = [
  "New Hire Training",
  "Compliance",
  "Systems Training",
  "Leadership",
  "Clinical Support",
  "HR Training",
  "QA Training",
  "Scheduling",
  "Intake",
  "Parent Communication",
];

export default function TrainingCatalog() {
  const [q, setQ] = useState("");
  const filteredDepts = useMemo(
    () => trainingDepartments.filter((d) => d.name.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Training Catalog</h1>
        <p className="text-sm text-muted-foreground">Search and explore every course in the Blossom Academy.</p>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, departments, topics…"
            className="h-11 rounded-xl pl-9"
          />
        </div>
      </header>

      {/* Categories */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c} className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Featured courses</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((f) => (
            <Link
              key={f.title}
              to="/my-learning"
              className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="aspect-video rounded-xl bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.18))]" />
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                {f.required && <Badge className="text-[10px]">Required</Badge>}
              </div>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Departments */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">By department</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDepts.map((d) => (
            <Link
              key={d.id}
              to={`/training/department/${d.slug}`}
              className="group flex flex-col gap-1 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-foreground">{d.name}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
