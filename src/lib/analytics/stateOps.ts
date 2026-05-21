/**
 * Pure aggregation functions over BCBA billable sessions for the
 * State Director dashboard. No network calls — operate on whatever
 * Session[] the hook hands in.
 */

export interface StateSession {
  id: string;
  date_of_service: string | null;
  bcba_name: string | null;
  provider_full: string | null;
  client_full: string | null;
  procedure_code: string | null;
  hours: number;
  state: string | null;
  service_location: string | null;
  payor_name: string | null;
  payor_type: string | null;
  units: number | null;
  charges_total: number | null;
  amount_paid: number | null;
  amount_owed: number | null;
  is_billable: boolean | null;
}

export type CodeFilter = "all" | "97153" | "97155" | "97151" | "97156";

export function normalizeCode(code: string | null | undefined): string {
  if (!code) return "—";
  const t = code.trim();
  if (/^97153/i.test(t)) return "97153";
  if (/^97155/i.test(t)) return "97155";
  if (/^97151/i.test(t)) return "97151";
  if (/^97156/i.test(t)) return "97156";
  return t;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0 = Sun
  const diff = (day + 6) % 7; // shift so Monday = 0
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weekKey(d: Date): string {
  const w = startOfWeek(d);
  return `${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, "0")}-${String(w.getDate()).padStart(2, "0")}`;
}

function weekLabel(key: string): string {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function filterByCode(sessions: StateSession[], code: CodeFilter): StateSession[] {
  if (code === "all") return sessions;
  return sessions.filter((s) => normalizeCode(s.procedure_code) === code);
}

export interface WeekPoint {
  weekKey: string;
  weekLabel: string;
  hours: number;
  clients: number;
  hoursMA: number; // 3-week moving avg
  clientsMA: number;
  hoursPerClient: number;
}

/** Build a weekly Hours vs Active-Clients series with a 3-week moving average. */
export function weeklySeries(sessions: StateSession[]): WeekPoint[] {
  const byWeek = new Map<string, { hours: number; clients: Set<string> }>();
  for (const s of sessions) {
    if (!s.date_of_service) continue;
    const k = weekKey(new Date(s.date_of_service));
    let bucket = byWeek.get(k);
    if (!bucket) {
      bucket = { hours: 0, clients: new Set() };
      byWeek.set(k, bucket);
    }
    bucket.hours += Number(s.hours) || 0;
    if (s.client_full) bucket.clients.add(s.client_full);
  }
  const keys = Array.from(byWeek.keys()).sort();
  const base = keys.map((k) => {
    const b = byWeek.get(k)!;
    return { weekKey: k, weekLabel: weekLabel(k), hours: b.hours, clients: b.clients.size };
  });
  // 3-week moving average
  return base.map((p, i) => {
    const slice = base.slice(Math.max(0, i - 2), i + 1);
    const hoursMA = slice.reduce((a, x) => a + x.hours, 0) / slice.length;
    const clientsMA = slice.reduce((a, x) => a + x.clients, 0) / slice.length;
    const hoursPerClient = p.clients ? p.hours / p.clients : 0;
    return {
      ...p,
      hoursMA: Math.round(hoursMA * 10) / 10,
      clientsMA: Math.round(clientsMA * 10) / 10,
      hoursPerClient: Math.round(hoursPerClient * 10) / 10,
    };
  });
}

export interface QuickStats {
  hoursThisWeek: number;
  hoursDelta: number;
  clientsThisWeek: number;
  clientsDelta: number;
  hoursPerClient: number;
  hoursPerClientDelta: number;
  supervisionRatio: number; // 97155 / 97153
  supervisionDelta: number;
}

export function quickStats(allSessions: StateSession[]): QuickStats {
  const series = weeklySeries(allSessions);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const hoursThisWeek = last?.hours ?? 0;
  const clientsThisWeek = last?.clients ?? 0;
  const hpc = last?.hoursPerClient ?? 0;
  const prevHpc = prev?.hoursPerClient ?? 0;

  // Supervision ratio across whole window vs prior half
  const splitHalf = Math.floor(allSessions.length / 2);
  const sortedByDate = [...allSessions]
    .filter((s) => s.date_of_service)
    .sort((a, b) => (a.date_of_service! < b.date_of_service! ? -1 : 1));
  const early = sortedByDate.slice(0, splitHalf);
  const late = sortedByDate.slice(splitHalf);
  const ratio = (rows: StateSession[]) => {
    let direct = 0;
    let sup = 0;
    for (const r of rows) {
      const c = normalizeCode(r.procedure_code);
      if (c === "97153") direct += Number(r.hours) || 0;
      else if (c === "97155") sup += Number(r.hours) || 0;
    }
    return direct > 0 ? sup / direct : 0;
  };
  const supLate = ratio(late);
  const supEarly = ratio(early);

  return {
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    hoursDelta: Math.round(((hoursThisWeek - (prev?.hours ?? 0))) * 10) / 10,
    clientsThisWeek,
    clientsDelta: clientsThisWeek - (prev?.clients ?? 0),
    hoursPerClient: Math.round(hpc * 10) / 10,
    hoursPerClientDelta: Math.round((hpc - prevHpc) * 10) / 10,
    supervisionRatio: Math.round(supLate * 1000) / 10, // as percent
    supervisionDelta: Math.round((supLate - supEarly) * 1000) / 10,
  };
}

export interface SupervisorRow {
  bcba: string;
  supervisionHours: number;
  directHours: number; // 97153 attributed via labels
  uniqueClients: number;
  ratio: number; // supervision per direct hr
}

/** Top + bottom BCBAs by supervision-to-direct ratio. */
export function supervisionLeaderboard(sessions: StateSession[]): SupervisorRow[] {
  const map = new Map<string, { sup: number; direct: number; clients: Set<string> }>();
  for (const s of sessions) {
    const code = normalizeCode(s.procedure_code);
    const bcba = s.bcba_name?.trim();
    if (!bcba || bcba.toLowerCase() === "unassigned bcba") continue;
    let row = map.get(bcba);
    if (!row) {
      row = { sup: 0, direct: 0, clients: new Set() };
      map.set(bcba, row);
    }
    const h = Number(s.hours) || 0;
    if (code === "97155") row.sup += h;
    if (code === "97153") row.direct += h;
    if (s.client_full) row.clients.add(s.client_full);
  }
  const rows: SupervisorRow[] = [];
  for (const [bcba, v] of map.entries()) {
    rows.push({
      bcba,
      supervisionHours: Math.round(v.sup * 10) / 10,
      directHours: Math.round(v.direct * 10) / 10,
      uniqueClients: v.clients.size,
      ratio: v.direct > 0 ? Math.round((v.sup / v.direct) * 1000) / 1000 : 0,
    });
  }
  return rows
    .filter((r) => r.directHours + r.supervisionHours >= 4) // hide tiny noise
    .sort((a, b) => b.ratio - a.ratio);
}

export interface AttentionItem {
  id: string;
  severity: "crit" | "warn";
  title: string;
  detail: string;
  action: string;
}

export function attentionItems(sessions: StateSession[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  // Unbilled value > 7 days old
  let unbilled = 0;
  let unbilledCount = 0;
  for (const s of sessions) {
    if (!s.date_of_service || !s.is_billable) continue;
    const age = now - new Date(s.date_of_service).getTime();
    if (age <= sevenDays) continue;
    const paid = Number(s.amount_paid) || 0;
    const charges = Number(s.charges_total) || 0;
    if (charges > 0 && paid === 0) {
      unbilled += charges;
      unbilledCount += 1;
    }
  }
  if (unbilled > 0) {
    items.push({
      id: "unbilled",
      severity: unbilled > 100_000 ? "crit" : "warn",
      title: `$${Math.round(unbilled).toLocaleString()} unpaid · ${unbilledCount} sessions`,
      detail: "Sessions older than 7 days with no payment posted.",
      action: "Open billing queue",
    });
  }

  // Patients without an assigned BCBA
  const unassigned = new Set<string>();
  for (const s of sessions) {
    if (!s.client_full) continue;
    const b = s.bcba_name?.trim().toLowerCase();
    if (!b || b === "unassigned bcba") unassigned.add(s.client_full);
  }
  if (unassigned.size > 0) {
    items.push({
      id: "unassigned",
      severity: unassigned.size > 5 ? "crit" : "warn",
      title: `${unassigned.size} patients without an assigned BCBA`,
      detail: "Detected from session labels in the current window.",
      action: "Assign BCBAs",
    });
  }

  // BCBAs above capacity (>35 billable hrs in latest week)
  const lastWeekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.getTime();
  })();
  const provHours = new Map<string, number>();
  for (const s of sessions) {
    if (!s.date_of_service) continue;
    if (new Date(s.date_of_service).getTime() < lastWeekStart) continue;
    const p = s.provider_full?.trim();
    if (!p) continue;
    provHours.set(p, (provHours.get(p) ?? 0) + (Number(s.hours) || 0));
  }
  const over = Array.from(provHours.entries()).filter(([, h]) => h > 35).length;
  if (over > 0) {
    items.push({
      id: "capacity",
      severity: "warn",
      title: `${over} providers over 35 billable hours this week`,
      detail: "Sustained overload risks burnout and quality issues.",
      action: "Review caseloads",
    });
  }

  // Admin/cancellation share
  let admin = 0;
  let total = 0;
  for (const s of sessions) {
    total += Number(s.hours) || 0;
    if (s.is_billable === false) admin += Number(s.hours) || 0;
  }
  if (total > 0) {
    const pct = (admin / total) * 100;
    if (pct > 6) {
      items.push({
        id: "admin-spike",
        severity: pct > 10 ? "crit" : "warn",
        title: `Admin & cancellation time at ${pct.toFixed(1)}%`,
        detail: "Above the 6% healthy threshold for the window.",
        action: "Investigate sources",
      });
    }
  }

  return items.slice(0, 4);
}

export interface RosterStats {
  activeBcbas: number;
  activeRbts: number;
  activeClients: number;
  billedTotal: number;
  paidTotal: number;
  owedTotal: number;
}

/**
 * Provider classification: a provider with any 97155/97151 hours acts as a
 * BCBA in this window; everyone else billing 97153 is treated as an RBT.
 */
export function rosterStats(sessions: StateSession[]): RosterStats {
  const isBcba = new Map<string, boolean>();
  const allProviders = new Set<string>();
  const clients = new Set<string>();
  let billed = 0;
  let paid = 0;
  let owed = 0;
  for (const s of sessions) {
    const p = s.provider_full?.trim();
    if (p) {
      allProviders.add(p);
      const c = normalizeCode(s.procedure_code);
      if (c === "97155" || c === "97151") isBcba.set(p, true);
      else if (!isBcba.has(p)) isBcba.set(p, false);
    }
    if (s.client_full) clients.add(s.client_full);
    billed += Number(s.charges_total) || 0;
    paid += Number(s.amount_paid) || 0;
    owed += Number(s.amount_owed) || 0;
  }
  let bcbas = 0;
  let rbts = 0;
  for (const v of isBcba.values()) {
    if (v) bcbas += 1;
    else rbts += 1;
  }
  return {
    activeBcbas: bcbas,
    activeRbts: rbts,
    activeClients: clients.size,
    billedTotal: Math.round(billed),
    paidTotal: Math.round(paid),
    owedTotal: Math.round(owed),
  };
}