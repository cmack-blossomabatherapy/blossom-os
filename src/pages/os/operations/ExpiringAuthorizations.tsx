import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import type { Authorization } from "@/data/authorizations";

/**
 * Expiring Authorizations — derived live from the merged authorization data
 * source (`useLiveAuthorizations`). Buckets show real expiration windows from
 * the Monday import (and, once configured, CentralReach). Past localStorage
 * MVP is fully retired.
 */

type Bucket = {
  key: string;
  label: string;
  tone: "rose" | "amber" | "blue" | "slate";
  match: (days: number) => boolean;
};

const BUCKETS: Bucket[] = [
  { key: "past",   label: "Expired / past due", tone: "rose",   match: (d) => d < 0 },
  { key: "d14",    label: "≤ 14 days",          tone: "rose",   match: (d) => d >= 0 && d <= 14 },
  { key: "d30",    label: "15 – 30 days",       tone: "amber",  match: (d) => d > 14 && d <= 30 },
  { key: "d60",    label: "31 – 60 days",       tone: "amber",  match: (d) => d > 30 && d <= 60 },
  { key: "d90",    label: "61 – 90 days",       tone: "blue",   match: (d) => d > 60 && d <= 90 },
];

const TONE: Record<Bucket["tone"], string> = {
  rose:  "border-rose-200 bg-rose-50 text-rose-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue:  "border-blue-200 bg-blue-50 text-blue-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

export default function ExpiringAuthorizations() {
  const { items, loading, error } = useLiveAuthorizations();
  const [activeBucket, setActiveBucket] = useState<string>("d14");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const enriched = useMemo(
    () =>
      items
        .map((a) => ({ ...a, _days: daysUntil(a.expirationDate) }))
        .filter((a): a is Authorization & { _days: number } => a._days !== null)
        .filter((a) => a._days <= 90),
    [items],
  );

  const bucketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BUCKETS.forEach((b) => {
      counts[b.key] = enriched.filter((a) => b.match(a._days)).length;
    });
    return counts;
  }, [enriched]);

  const states = useMemo(() => {
    const s = new Set<string>();
    enriched.forEach((a) => { if (a.state && a.state !== "—") s.add(a.state); });
    return Array.from(s).sort();
  }, [enriched]);

  const visible = useMemo(() => {
    const bucket = BUCKETS.find((b) => b.key === activeBucket);
    if (!bucket) return [];
    return enriched
      .filter((a) => bucket.match(a._days))
      .filter((a) => stateFilter === "all" || a.state === stateFilter)
      .sort((a, b) => a._days - b._days);
  }, [enriched, activeBucket, stateFilter]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <ShieldAlert className="h-3 w-3" /> Authorizations
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Expiring Authorizations</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Live view of authorizations expiring in the next 90 days. Buckets are derived from the
          authorization expiration date on the merged data source — no manual entry required.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {BUCKETS.map((b) => {
          const active = activeBucket === b.key;
          return (
            <button
              key={b.key}
              onClick={() => setActiveBucket(b.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                active ? `${TONE[b.tone]} shadow-sm` : "border-border/60 bg-white/80 hover:border-foreground/30"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{b.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{bucketCounts[b.key] ?? 0}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3">
          <span className="text-xs text-muted-foreground">State</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-transparent text-sm outline-none"
          >
            <option value="all">All</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Link
          to="/authorizations"
          className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3.5 text-sm text-foreground/80 hover:border-foreground/40"
        >
          Open full Authorizations workspace
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/85">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">Loading authorizations…</div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-rose-600">
            Authorizations couldn't load. Try again in a moment or contact your admin if this continues.
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No authorizations in this expiration window. Try another bucket or remove the state filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Payer</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Days</th>
                <th className="px-4 py-3 font-semibold">Coordinator</th>
                <th className="px-4 py-3 text-right font-semibold">Open</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.clientName}</td>
                  <td className="px-4 py-3 text-foreground/85">{a.payor}</td>
                  <td className="px-4 py-3 text-foreground/85">{a.state}</td>
                  <td className="px-4 py-3 text-foreground/85">{a.authType}</td>
                  <td className="px-4 py-3 text-foreground/85">{a.expirationDate ?? "—"}</td>
                  <td className={`px-4 py-3 font-semibold tabular-nums ${
                    a._days < 0 ? "text-rose-600" : a._days <= 14 ? "text-rose-600" : a._days <= 30 ? "text-amber-600" : "text-foreground/80"
                  }`}>
                    {a._days < 0 ? `${Math.abs(a._days)}d overdue` : `${a._days}d`}
                  </td>
                  <td className="px-4 py-3 text-foreground/85">{a.coordinator}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/authorizations?authId=${encodeURIComponent(a.id)}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}