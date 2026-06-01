import type { DashboardSpec, DashboardType } from "./dashboardEngine/types";

export interface AiDashboard {
  id: string;
  title: string;
  prompt: string;
  dashboardType: DashboardType;
  fileNames: string[];
  rowCount: number;
  createdAt: number;
  lastViewedAt?: number;
  status: "ready" | "error";
  spec?: DashboardSpec;
  narrativeStatus?: "pending" | "ready" | "error";
  error?: string;
}

const KEY = "blossom.os.aiDashboards.v1";

function read(): AiDashboard[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AiDashboard[];
  } catch { return []; }
}

function write(list: AiDashboard[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("blossom-ai-dashboards-changed"));
  } catch {}
}

export function listAiDashboards(): AiDashboard[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getAiDashboard(id: string): AiDashboard | undefined {
  return read().find(d => d.id === id);
}

export function saveAiDashboard(d: AiDashboard) {
  const list = read().filter(x => x.id !== d.id);
  list.push(d);
  write(list);
}

export function deleteAiDashboard(id: string) {
  write(read().filter(d => d.id !== id));
}

export function newAiDashboardId() {
  return `dash_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function touchAiDashboard(id: string) {
  const d = getAiDashboard(id);
  if (!d) return;
  saveAiDashboard({ ...d, lastViewedAt: Date.now() });
}