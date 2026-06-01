export type AiKpi = { label: string; value: string; delta?: string; trend?: "up" | "down" | "flat" };
export type AiChart = {
  type: "bar" | "line" | "area" | "pie" | "stacked-bar";
  labels: string[];
  series: { name: string; data: number[] }[];
  yLabel?: string;
  xLabel?: string;
};
export type AiTable = { columns: string[]; rows: (string | number)[][] };

export type AiRisk = { label: string; severity: "low" | "med" | "high"; note?: string };

export type AiSection = {
  id: string;
  title: string;
  narrative?: string;
  chart?: AiChart;
  table?: AiTable;
  insights?: string[];
};

export type AiReportResult = {
  title: string;
  subtitle?: string;
  summary: string;
  audience?: string;
  timeframe?: string;
  kpis: AiKpi[];
  insights: string[];
  recommendations?: string[];
  risks?: AiRisk[];
  sections?: AiSection[];
  // Legacy single chart/table (still rendered if no sections returned)
  chart?: AiChart;
  table?: AiTable;
};

export type AiReport = {
  id: string;
  title: string;
  prompt: string;
  filters: string[];
  audience?: string;
  timeframe?: string;
  breakdown?: string;
  goal?: string;
  comparison?: string;
  fileName: string;
  rowCount: number;
  files?: { name: string; rowCount: number }[];
  createdAt: number;
  status: "generating" | "ready" | "error";
  result?: AiReportResult;
  error?: string;
};

const KEY = "blossom.os.aiReports.v1";

function read(): AiReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AiReport[];
  } catch {
    return [];
  }
}

function write(list: AiReport[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("blossom-ai-reports-changed"));
  } catch {}
}

export function listAiReports(): AiReport[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getAiReport(id: string): AiReport | undefined {
  return read().find((r) => r.id === id);
}

export function saveAiReport(r: AiReport) {
  const list = read().filter((x) => x.id !== r.id);
  list.push(r);
  write(list);
}

export function deleteAiReport(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function newAiReportId() {
  return `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Lightweight CSV parser — handles quoted fields & escaped quotes. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const out: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (field.length || cur.length) { cur.push(field); out.push(cur); cur = []; field = ""; }
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); out.push(cur); }
  if (!out.length) return { headers: [], rows: [] };
  const [headers, ...rows] = out;
  return { headers, rows };
}

/** Builds a compact preview string (headers + first N rows) for the AI prompt. */
export function previewCsvForPrompt(text: string, maxRows = 150): { preview: string; rowCount: number; headers: string[] } {
  const { headers, rows } = parseCsv(text);
  const slice = rows.slice(0, maxRows);
  const lines = [headers.join(",")].concat(slice.map((r) => r.join(",")));
  return { preview: lines.join("\n"), rowCount: rows.length, headers };
}