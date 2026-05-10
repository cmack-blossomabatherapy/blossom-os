import { Award } from "lucide-react";

export function CertificationsSection() {
  const certs = [
    { t: "HIPAA Awareness", s: "Valid through 2026" },
    { t: "Blossom Systems Foundation", s: "Awarded May 1, 2026" },
    { t: "Crisis Prevention", s: "Valid through 2027" },
  ];
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Certifications & competencies</h2>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {certs.map((c) => (
          <li key={c.t} className="rounded-xl border border-border/50 bg-background/40 p-3">
            <p className="text-sm font-medium text-foreground">{c.t}</p>
            <p className="text-[11px] text-muted-foreground">{c.s}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}