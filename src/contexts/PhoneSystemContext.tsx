import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AdminSettings, CallQueue, ChangeRequest, CoverageTemplate, DEFAULT_SETTINGS,
  Employee, HolidayProfile, RetellCall, SharedRouting,
  StateDirectoryEntry, CorporateMenuOption, StateIntakeRouting,
  STATE_DIRECTORY, CORPORATE_MENU, STATE_INTAKE_ROUTING,
  SEED_COVERAGE_TEMPLATES, SEED_EMPLOYEES, SEED_HOLIDAY_PROFILES, SEED_QUEUES,
  SEED_RETELL_CALLS, SEED_SHARED,
} from "@/data/phoneSystem";

export type DirectoryLabels = {
  main: string;
  menu: string;
  stateDir: string;
  stateIntake: string;
  queues: string;
  shared: string;
};

export const DEFAULT_DIRECTORY_LABELS: DirectoryLabels = {
  main: "Main Corporate Numbers",
  menu: "Corporate Menu (AA9000)",
  stateDir: "State Direct Numbers",
  stateIntake: "State Intake Routing",
  queues: "All Call Queues",
  shared: "Shared Department Routing",
};

type PhoneSystemState = {
  queues: CallQueue[];
  employees: Employee[];
  shared: SharedRouting[];
  requests: ChangeRequest[];
  retellCalls: RetellCall[];
  settings: AdminSettings;
  coverageTemplates: CoverageTemplate[];
  holidayProfiles: HolidayProfile[];
  stateDirectory: StateDirectoryEntry[];
  corporateMenu: CorporateMenuOption[];
  stateIntakeRouting: StateIntakeRouting[];
  directoryLabels: DirectoryLabels;
  setQueues: (q: CallQueue[]) => void;
  setEmployees: (e: Employee[]) => void;
  saveEmployeeExtension: (previousExtension: string, employee: Employee) => void;
  setShared: (s: SharedRouting[]) => void;
  upsertRequest: (r: ChangeRequest) => void;
  deleteRequest: (id: string) => void;
  upsertRetellCall: (c: RetellCall) => void;
  setSettings: (s: AdminSettings) => void;
  setCoverageTemplates: (t: CoverageTemplate[]) => void;
  setHolidayProfiles: (h: HolidayProfile[]) => void;
  setStateDirectory: (d: StateDirectoryEntry[]) => void;
  setCorporateMenu: (m: CorporateMenuOption[]) => void;
  setStateIntakeRouting: (r: StateIntakeRouting[]) => void;
  setDirectoryLabels: (l: DirectoryLabels) => void;
};

const Ctx = createContext<PhoneSystemState | null>(null);
const LEGACY_KEY = "blossom.phone-system.v2";
const TABLE = "phone_system_state";

type StateKey =
  | "queues"
  | "employees"
  | "shared"
  | "requests"
  | "retellCalls"
  | "settings"
  | "coverageTemplates"
  | "holidayProfiles"
  | "stateDirectory"
  | "corporateMenu"
  | "stateIntakeRouting"
  | "directoryLabels";

async function loadAllFromDb(): Promise<Partial<Record<StateKey, unknown>>> {
  const { data, error } = await supabase.from(TABLE).select("key, value");
  if (error) {
    console.warn("[phone-system] load failed", error);
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[(row as { key: string }).key] = (row as { value: unknown }).value;
  return out as Partial<Record<StateKey, unknown>>;
}

async function saveToDb(key: StateKey, value: unknown) {
  const { error } = await supabase.from(TABLE).upsert({ key, value: value as never });
  if (error) console.warn(`[phone-system] save ${key} failed`, error);
}

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

function syncDirectoryEmployees(phoneEmployees: Employee[], directoryEmployees: ReturnType<typeof useEmployeeDirectory>["members"]): Employee[] {
  const next = [...phoneEmployees];
  const byEmail = new Map(directoryEmployees.filter((m) => m.email).map((m) => [normalize(m.email), m]));

  next.forEach((employee, index) => {
    const linked = employee.userId
      ? directoryEmployees.find((m) => m.uuid === employee.userId || m.id === employee.userId)
      : employee.email
        ? byEmail.get(normalize(employee.email))
        : undefined;

    if (linked) {
      next[index] = {
        ...employee,
        userId: linked.uuid ?? linked.id,
        email: linked.email ?? employee.email,
        name: linked.name,
        department: linked.departmentName ?? employee.department,
        role: linked.title ?? employee.role,
        source: "directory",
      };
    }
  });

  directoryEmployees.forEach((member) => {
    const hasLink = next.some((employee) =>
      (member.uuid && employee.userId === member.uuid) ||
      (member.email && normalize(employee.email) === normalize(member.email)) ||
      normalize(employee.name) === normalize(member.name),
    );

    if (!hasLink) {
      next.push({
        extension: "",
        userId: member.uuid ?? member.id,
        email: member.email ?? undefined,
        name: member.name,
        department: member.departmentName ?? undefined,
        role: member.title,
        source: "directory",
      });
    }
  });

  return next;
}

export function PhoneSystemProvider({ children }: { children: ReactNode }) {
  const { members: directoryMembers, loading: directoryLoading } = useEmployeeDirectory();
  const { isAdmin, roles } = useAuth();
  // Only admin/ops_manager can write to phone_system_state (per RLS). Gate
  // seed + directory-sync + persist writes to avoid RLS-violation error floods
  // for non-privileged users, who still read the shared state via SELECT.
  const canWrite = isAdmin || (roles as string[]).includes("ops_manager");
  const [queues, setQueues] = useState<CallQueue[]>(SEED_QUEUES);
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [shared, setShared] = useState<SharedRouting[]>(SEED_SHARED);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [retellCalls, setRetellCalls] = useState<RetellCall[]>(SEED_RETELL_CALLS);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [coverageTemplates, setCoverageTemplates] = useState<CoverageTemplate[]>(SEED_COVERAGE_TEMPLATES);
  const [holidayProfiles, setHolidayProfiles] = useState<HolidayProfile[]>(SEED_HOLIDAY_PROFILES);
  const [stateDirectory, setStateDirectory] = useState<StateDirectoryEntry[]>(STATE_DIRECTORY);
  const [corporateMenu, setCorporateMenu] = useState<CorporateMenuOption[]>(CORPORATE_MENU);
  const [stateIntakeRouting, setStateIntakeRouting] = useState<StateIntakeRouting[]>(STATE_INTAKE_ROUTING);
  const [directoryLabels, setDirectoryLabels] = useState<DirectoryLabels>(DEFAULT_DIRECTORY_LABELS);
  const [hydrated, setHydrated] = useState(false);

  // Initial load from DB. On first run, seed any missing keys with the SEED_*
  // defaults (or rescue values from old localStorage cache) so we never wipe
  // the page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await loadAllFromDb();
      let legacy: Record<string, unknown> = {};
      try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (raw) legacy = JSON.parse(raw);
      } catch { /* ignore */ }

      const pick = <T,>(key: StateKey, seed: T): T => {
        if (remote[key] !== undefined) return remote[key] as T;
        if (legacy[key] !== undefined) return legacy[key] as T;
        return seed;
      };

      const nextQueues          = pick<CallQueue[]>("queues", SEED_QUEUES);
      const nextEmployees       = pick<Employee[]>("employees", SEED_EMPLOYEES);
      const nextShared          = pick<SharedRouting[]>("shared", SEED_SHARED);
      const nextRequests        = pick<ChangeRequest[]>("requests", []);
      const nextRetell          = pick<RetellCall[]>("retellCalls", SEED_RETELL_CALLS);
      const nextSettings        = { ...DEFAULT_SETTINGS, ...(pick<Partial<AdminSettings>>("settings", DEFAULT_SETTINGS)) } as AdminSettings;
      const nextCoverage        = pick<CoverageTemplate[]>("coverageTemplates", SEED_COVERAGE_TEMPLATES);
      const nextHolidays        = pick<HolidayProfile[]>("holidayProfiles", SEED_HOLIDAY_PROFILES);
      const nextStateDir        = pick<StateDirectoryEntry[]>("stateDirectory", STATE_DIRECTORY);
      const nextMenu            = pick<CorporateMenuOption[]>("corporateMenu", CORPORATE_MENU);
      const nextIntake          = pick<StateIntakeRouting[]>("stateIntakeRouting", STATE_INTAKE_ROUTING);
      const nextLabels          = { ...DEFAULT_DIRECTORY_LABELS, ...(pick<Partial<DirectoryLabels>>("directoryLabels", DEFAULT_DIRECTORY_LABELS)) } as DirectoryLabels;

      if (cancelled) return;
      setQueues(nextQueues);
      setEmployees(nextEmployees);
      setShared(nextShared);
      setRequests(nextRequests);
      setRetellCalls(nextRetell);
      setSettings(nextSettings);
      setCoverageTemplates(nextCoverage);
      setHolidayProfiles(nextHolidays);
      setStateDirectory(nextStateDir);
      setCorporateMenu(nextMenu);
      setStateIntakeRouting(nextIntake);
      setDirectoryLabels(nextLabels);
      setHydrated(true);

      // Seed/rescue: write any keys that were missing from the DB.
      const toSeed: Array<[StateKey, unknown]> = [];
      if (remote.queues === undefined) toSeed.push(["queues", nextQueues]);
      if (remote.employees === undefined) toSeed.push(["employees", nextEmployees]);
      if (remote.shared === undefined) toSeed.push(["shared", nextShared]);
      if (remote.requests === undefined) toSeed.push(["requests", nextRequests]);
      if (remote.retellCalls === undefined) toSeed.push(["retellCalls", nextRetell]);
      if (remote.settings === undefined) toSeed.push(["settings", nextSettings]);
      if (remote.coverageTemplates === undefined) toSeed.push(["coverageTemplates", nextCoverage]);
      if (remote.holidayProfiles === undefined) toSeed.push(["holidayProfiles", nextHolidays]);
      if (remote.stateDirectory === undefined) toSeed.push(["stateDirectory", nextStateDir]);
      if (remote.corporateMenu === undefined) toSeed.push(["corporateMenu", nextMenu]);
      if (remote.stateIntakeRouting === undefined) toSeed.push(["stateIntakeRouting", nextIntake]);
      if (remote.directoryLabels === undefined) toSeed.push(["directoryLabels", nextLabels]);
      if (canWrite) {
        await Promise.all(toSeed.map(([k, v]) => saveToDb(k, v)));
      }
    })();
    return () => { cancelled = true; };
  }, [canWrite]);

  // Sync extensions with directory data once we're hydrated.
  useEffect(() => {
    if (!hydrated || directoryLoading || directoryMembers.length === 0) return;
    setEmployees((current) => {
      const merged = syncDirectoryEmployees(current, directoryMembers);
      if (canWrite) saveToDb("employees", merged);
      return merged;
    });
  }, [directoryMembers, directoryLoading, hydrated, canWrite]);

  // Realtime: when another user updates a key, pull it in.
  useEffect(() => {
    const channel = supabase
      .channel("phone_system_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload) => {
          const row = (payload.new ?? payload.old) as { key?: string; value?: unknown } | null;
          if (!row?.key) return;
          const v = row.value;
          switch (row.key as StateKey) {
            case "queues": setQueues(v as CallQueue[]); break;
            case "employees": setEmployees(v as Employee[]); break;
            case "shared": setShared(v as SharedRouting[]); break;
            case "requests": setRequests(v as ChangeRequest[]); break;
            case "retellCalls": setRetellCalls(v as RetellCall[]); break;
            case "settings": setSettings({ ...DEFAULT_SETTINGS, ...(v as Partial<AdminSettings>) }); break;
            case "coverageTemplates": setCoverageTemplates(v as CoverageTemplate[]); break;
            case "holidayProfiles": setHolidayProfiles(v as HolidayProfile[]); break;
            case "stateDirectory": setStateDirectory(v as StateDirectoryEntry[]); break;
            case "corporateMenu": setCorporateMenu(v as CorporateMenuOption[]); break;
            case "stateIntakeRouting": setStateIntakeRouting(v as StateIntakeRouting[]); break;
            case "directoryLabels": setDirectoryLabels({ ...DEFAULT_DIRECTORY_LABELS, ...(v as Partial<DirectoryLabels>) }); break;
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Helper: update local state AND persist to DB.
  const persist = <T,>(key: StateKey, setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (canWrite) void saveToDb(key, v);
  };

  const value: PhoneSystemState = {
    queues, employees, shared, requests, retellCalls, settings, coverageTemplates, holidayProfiles,
    stateDirectory, corporateMenu, stateIntakeRouting, directoryLabels,
    setQueues: persist("queues", setQueues),
    setEmployees: persist("employees", setEmployees),
    setShared: persist("shared", setShared),
    setSettings: persist("settings", setSettings),
    setCoverageTemplates: persist("coverageTemplates", setCoverageTemplates),
    setHolidayProfiles: persist("holidayProfiles", setHolidayProfiles),
    setStateDirectory: persist("stateDirectory", setStateDirectory),
    setCorporateMenu: persist("corporateMenu", setCorporateMenu),
    setStateIntakeRouting: persist("stateIntakeRouting", setStateIntakeRouting),
    setDirectoryLabels: persist("directoryLabels", setDirectoryLabels),
    saveEmployeeExtension: (previousExtension, employee) => {
      const nextExtension = employee.extension.trim();
      let nextEmployeesSnapshot: Employee[] = [];
      setEmployees((prev) => {
        const match = (row: Employee) =>
          (previousExtension && row.extension === previousExtension) ||
          (employee.userId && row.userId === employee.userId) ||
          (employee.email && normalize(row.email) === normalize(employee.email));
        const exists = prev.some(match);
        const next = exists ? prev.map((row) => (match(row) ? { ...row, ...employee, extension: nextExtension } : row)) : [{ ...employee, extension: nextExtension }, ...prev];
        const deduped = next.filter((row, index, all) => all.findIndex((other) => other.extension && other.extension === row.extension) === index || !row.extension);
        nextEmployeesSnapshot = deduped;
        return deduped;
      });
      void saveToDb("employees", nextEmployeesSnapshot);
      if (previousExtension && previousExtension !== nextExtension) {
        setQueues((prev) => {
          const next = prev.map((queue) => ({ ...queue, agents: queue.agents.map((agent) => agent === previousExtension ? nextExtension : agent) }));
          void saveToDb("queues", next);
          return next;
        });
        setShared((prev) => {
          const next = prev.map((route) => ({
            ...route,
            agents: route.agents.map((agent) => agent === previousExtension ? nextExtension : agent),
            businessHoursRouting: route.businessHoursRouting === previousExtension ? nextExtension : route.businessHoursRouting,
          }));
          void saveToDb("shared", next);
          return next;
        });
      }
    },
    upsertRequest: (r) =>
      setRequests((prev) => {
        const idx = prev.findIndex((p) => p.id === r.id);
        const next = idx === -1 ? [r, ...prev] : prev.map((p, i) => (i === idx ? r : p));
        void saveToDb("requests", next);
        return next;
      }),
    deleteRequest: (id) => setRequests((prev) => {
      const next = prev.filter((p) => p.id !== id);
      void saveToDb("requests", next);
      return next;
    }),
    upsertRetellCall: (c) =>
      setRetellCalls((prev) => {
        const idx = prev.findIndex((p) => p.id === c.id);
        const next = idx === -1 ? [c, ...prev] : prev.map((p, i) => (i === idx ? c : p));
        void saveToDb("retellCalls", next);
        return next;
      }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePhoneSystem() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePhoneSystem must be used within <PhoneSystemProvider>");
  return c;
}

export function downloadPhoneCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    triggerDownload(new Blob([""], { type: "text/csv" }), filename);
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv" }), filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function notifyPhoneWebhook(url: string, text: string): Promise<string> {
  if (!url) return "No webhook configured";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      mode: "no-cors",
    });
    return res.ok || res.type === "opaque" ? "Alert sent" : `Webhook ${res.status}`;
  } catch (e) {
    return `Webhook error: ${(e as Error).message}`;
  }
}