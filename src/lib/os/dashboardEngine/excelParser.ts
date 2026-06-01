import * as XLSX from "xlsx";
import { parseCSVText, detectDateRange } from "@/lib/os/reportEngine/csv";
import type { ParsedFile } from "@/lib/os/reportEngine/types";

/**
 * Parse a CSV or XLSX/XLS file into one ParsedFile per worksheet.
 * Multi-sheet workbooks return multiple ParsedFiles, suffixed with the sheet name.
 */
export async function parseAnyFile(file: File): Promise<ParsedFile[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    const text = await file.text();
    const { headers, rows } = parseCSVText(text);
    return [{
      fileName: file.name,
      headers,
      rows,
      rowCount: rows.length,
      dateRange: detectDateRange(rows, headers),
    }];
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const out: ParsedFile[] = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });
      if (!json.length) continue;
      const headers = Object.keys(json[0]);
      const rows: Record<string, string>[] = json.map(r => {
        const o: Record<string, string> = {};
        for (const h of headers) o[h] = String(r[h] ?? "").trim();
        return o;
      });
      out.push({
        fileName: wb.SheetNames.length === 1 ? file.name : `${file.name} · ${sheetName}`,
        headers,
        rows,
        rowCount: rows.length,
        dateRange: detectDateRange(rows, headers),
      });
    }
    if (!out.length) throw new Error("Workbook contains no data rows.");
    return out;
  }
  throw new Error(`Unsupported file type: ${file.name}`);
}

export const SUPPORTED_EXTENSIONS = ".csv,.xlsx,.xls,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";