import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import {
  AdminSettings, CallQueue, ChangeRequest, CoverageTemplate, DEFAULT_SETTINGS,
  Employee, HolidayProfile, RetellCall, SharedRouting,
  SEED_COVERAGE_TEMPLATES, SEED_EMPLOYEES, SEED_HOLIDAY_PROFILES, SEED_QUEUES,
  SEED_RETELL_CALLS, SEED_SHARED,
} from "@/data/phoneSystem";

type PhoneSystemState = {
  queues: CallQueue[];
  employees: Employee[];
  shared: SharedRouting[];
  requests: ChangeRequest[];
  retellCalls: RetellCall[];
  settings: AdminSettings;
  coverageTemplates: CoverageTemplate[];
  holidayProfiles: HolidayProfile[];
  setQueues: (q: CallQueue[]) => void;
  setEmployees: (e: Employee[]) => void;
  setShared: (s: SharedRouting[]) => void;
  upsertRequest: (r: ChangeRequest) => void;
  deleteRequest: (id: string) => void;
  upsertRetellCall: (c: RetellCall) => void;
  setSettings: (s: AdminSettings) => void;
  setCoverageTemplates: (t: CoverageTemplate[]) => void;
  setHolidayProfiles: (h: HolidayProfile[]) => void;
};

const Ctx = createContext<PhoneSystemState | null>(null);
const KEY = "blossom.phone-system.v2";

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
  const [queues, setQueues] = useState<CallQueue[]>(SEED_QUEUES);
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [shared, setShared] = useState<SharedRouting[]>(SEED_SHARED);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [retellCalls, setRetellCalls] = useState<RetellCall[]>(SEED_RETELL_CALLS);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [coverageTemplates, setCoverageTemplates] = useState<CoverageTemplate[]>(SEED_COVERAGE_TEMPLATES);
  const [holidayProfiles, setHolidayProfiles] = useState<HolidayProfile[]>(SEED_HOLIDAY_PROFILES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.queues) setQueues(data.queues);
        if (data.employees) setEmployees(data.employees);
        if (data.shared) setShared(data.shared);
        if (data.requests) setRequests(data.requests);
        if (data.retellCalls) setRetellCalls(data.retellCalls);
        if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        if (data.coverageTemplates) setCoverageTemplates(data.coverageTemplates);
        if (data.holidayProfiles) setHolidayProfiles(data.holidayProfiles);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || directoryLoading || directoryMembers.length === 0) return;
    setEmployees((current) => syncDirectoryEmployees(current, directoryMembers));
  }, [directoryMembers, directoryLoading, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({
        queues, employees, shared, requests, retellCalls, settings, coverageTemplates, holidayProfiles,
      }));
    } catch { /* ignore */ }
  }, [queues, employees, shared, requests, retellCalls, settings, coverageTemplates, holidayProfiles, hydrated]);

  const value: PhoneSystemState = {
    queues, employees, shared, requests, retellCalls, settings, coverageTemplates, holidayProfiles,
    setQueues, setEmployees, setShared, setSettings, setCoverageTemplates, setHolidayProfiles,
    upsertRequest: (r) =>
      setRequests((prev) => {
        const idx = prev.findIndex((p) => p.id === r.id);
        if (idx === -1) return [r, ...prev];
        const next = [...prev];
        next[idx] = r;
        return next;
      }),
    deleteRequest: (id) => setRequests((prev) => prev.filter((p) => p.id !== id)),
    upsertRetellCall: (c) =>
      setRetellCalls((prev) => {
        const idx = prev.findIndex((p) => p.id === c.id);
        if (idx === -1) return [c, ...prev];
        const next = [...prev];
        next[idx] = c;
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