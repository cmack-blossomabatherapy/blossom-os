import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BcbaPdfRow {
  name: string;
  state: string;
  director: string;
  activeClients: number;
  assignedRbts: number;
  h97153: number;
  h97155: number;
  h97156: number;
  h97151: number;
  hOther: number;
  total: number;
  payrollHours: number;
  avgHoursPerClient: number;
  avgHoursPerRbt: number;
  minimumHours: number;
  minStatus: string;
  flags: string[];
}

export interface BcbaPdfKpis {
  totalBcbas: number;
  totalClients: number;
  totalRbts: number;
  t97153: number;
  t97155: number;
  t97156: number;
  avgCaseload: number;
  avg97153: number;
  avg97155: number;
  avg97156: number;
}

export interface BcbaPdfOptions {
  rows: BcbaPdfRow[];
  kpis: BcbaPdfKpis;
  periodLabel: string;
  periodSpan: string;
  nMonths: number;
  minHours: number;
  insights: string[];
  filters?: { search?: string };
}

const f1 = (n: number) => (isFinite(n) ? n.toFixed(1) : "—");
const f0 = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "—");

// Brand palette (RGB)
const BRAND = { r: 43, g: 123, b: 213 };
const DARK = { r: 26, g: 31, b: 46 };
const MUTED = { r: 110, g: 119, b: 134 };
const SOFT_BG: [number, number, number] = [244, 247, 252];
const BORDER: [number, number, number] = [220, 226, 235];

function statusColor(s: string): [number, number, number] {
  switch (s) {
    case "Exceeds": return [16, 122, 87];
    case "Meets": return [37, 99, 165];
    case "At Risk": return [180, 119, 18];
    case "Below": return [183, 41, 53];
    default: return [110, 119, 134];
  }
}

export function exportBcbaProductivityPdf(opts: BcbaPdfOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 36;

  // ===== Header band =====
  doc.setFillColor(DARK.r, DARK.g, DARK.b);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 70, pageW, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BCBA Productivity Report", M, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(200, 215, 235);
  doc.text("Blossom ABA Therapy · Operational Intelligence", M, 48);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const generated = `Generated ${new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
  doc.text(generated, pageW - M, 32, { align: "right" });
  doc.setTextColor(200, 215, 235);
  doc.text(`Period: ${opts.periodLabel} (${opts.periodSpan})`, pageW - M, 48, { align: "right" });

  let y = 92;

  // ===== KPI cards row =====
  const kpiCards = [
    { label: "BCBAs", value: f0(opts.kpis.totalBcbas) },
    { label: "Clients served", value: f0(opts.kpis.totalClients) },
    { label: "RBTs supervised", value: f0(opts.kpis.totalRbts) },
    { label: "Avg caseload", value: f1(opts.kpis.avgCaseload) },
    { label: "97153 hrs", value: f1(opts.kpis.t97153) },
    { label: "97155 hrs", value: f1(opts.kpis.t97155) },
    { label: "97156 hrs", value: f1(opts.kpis.t97156) },
  ];
  const innerW = pageW - M * 2;
  const gap = 8;
  const cardW = (innerW - gap * (kpiCards.length - 1)) / kpiCards.length;
  const cardH = 56;
  kpiCards.forEach((k, i) => {
    const x = M + i * (cardW + gap);
    doc.setFillColor(...SOFT_BG);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(x, y, cardW, cardH, 6, 6, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(k.label.toUpperCase(), x + 10, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.text(k.value, x + 10, y + 40);
  });
  y += cardH + 16;

  // ===== AI insights / key findings =====
  if (opts.insights.length) {
    doc.setFillColor(248, 250, 255);
    doc.setDrawColor(...BORDER);
    const lines = opts.insights.slice(0, 5);
    const boxH = 24 + lines.length * 14;
    doc.roundedRect(M, y, innerW, boxH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text("Key Findings", M + 12, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(40, 50, 65);
    lines.forEach((line, i) => {
      doc.text(`•  ${line}`, M + 14, y + 32 + i * 14, { maxWidth: innerW - 28 });
    });
    y += boxH + 14;
  }

  // ===== Per-BCBA table =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.text("BCBA Breakdown", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(
    `${opts.rows.length} BCBA${opts.rows.length === 1 ? "" : "s"} · Minimum target ${opts.minHours} hrs`,
    pageW - M,
    y,
    { align: "right" },
  );
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [[
      "BCBA",
      "State",
      "Director",
      "Clients",
      "RBTs",
      "97153",
      "97155",
      "97156",
      "97151",
      "Other",
      "Total",
      "Avg/Client",
      "Status",
    ]],
    body: opts.rows.map(a => [
      a.name,
      a.state || "—",
      a.director || "—",
      f0(a.activeClients),
      f0(a.assignedRbts),
      f1(a.h97153),
      f1(a.h97155),
      f1(a.h97156),
      f1(a.h97151),
      f1(a.hOther),
      f1(a.total),
      f1(a.avgHoursPerClient),
      a.minStatus,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 5,
      lineColor: BORDER,
      lineWidth: 0.4,
      textColor: [40, 50, 65],
    },
    headStyles: {
      fillColor: [DARK.r, DARK.g, DARK.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [249, 251, 254] },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [DARK.r, DARK.g, DARK.b], cellWidth: 130 },
      1: { cellWidth: 50 },
      2: { cellWidth: 90 },
      3: { halign: "right", cellWidth: 45 },
      4: { halign: "right", cellWidth: 40 },
      5: { halign: "right", cellWidth: 45 },
      6: { halign: "right", cellWidth: 45 },
      7: { halign: "right", cellWidth: 45 },
      8: { halign: "right", cellWidth: 45 },
      9: { halign: "right", cellWidth: 45 },
      10: { halign: "right", fontStyle: "bold", cellWidth: 50 },
      11: { halign: "right", cellWidth: 60 },
      12: { halign: "center", fontStyle: "bold", cellWidth: 60 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 12) {
        const [r, g, b] = statusColor(String(data.cell.raw));
        data.cell.styles.textColor = [r, g, b];
      }
    },
    didDrawPage: () => drawFooter(doc, pageW, pageH, M),
  });

  // ===== Flags / risk page =====
  const flagged = opts.rows.filter(r => r.flags.length > 0);
  if (flagged.length) {
    doc.addPage();
    drawFooter(doc, pageW, pageH, M);
    // Header band on continuation pages
    doc.setFillColor(DARK.r, DARK.g, DARK.b);
    doc.rect(0, 0, pageW, 36, "F");
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(0, 36, pageW, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Risks & Flags Requiring Attention", M, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 215, 235);
    doc.text(`${flagged.length} BCBA${flagged.length === 1 ? "" : "s"} flagged`, pageW - M, 24, { align: "right" });

    autoTable(doc, {
      startY: 56,
      margin: { left: M, right: M },
      head: [["BCBA", "Status", "Total Hrs", "Min", "Flags"]],
      body: flagged.map(a => [
        a.name,
        a.minStatus,
        f1(a.total),
        String(a.minimumHours),
        a.flags.join(" · "),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        lineColor: BORDER,
        lineWidth: 0.4,
        textColor: [40, 50, 65],
        valign: "top",
      },
      headStyles: {
        fillColor: [DARK.r, DARK.g, DARK.b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [249, 251, 254] },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [DARK.r, DARK.g, DARK.b], cellWidth: 150 },
        1: { cellWidth: 70, fontStyle: "bold" },
        2: { cellWidth: 60, halign: "right" },
        3: { cellWidth: 50, halign: "right" },
        4: { cellWidth: "auto" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const [r, g, b] = statusColor(String(data.cell.raw));
          data.cell.styles.textColor = [r, g, b];
        }
      },
      didDrawPage: () => drawFooter(doc, pageW, pageH, M),
    });
  }

  const fname = `BCBA-Productivity-Report_${todayStamp()}.pdf`;
  doc.save(fname);
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, M: number) {
  const page = doc.getCurrentPageInfo().pageNumber;
  const total = doc.getNumberOfPages();
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.line(M, pageH - 28, pageW - M, pageH - 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text("Blossom OS · Confidential · For internal operational use only", M, pageH - 14);
  doc.text(`Page ${page} of ${total}`, pageW - M, pageH - 14, { align: "right" });
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}