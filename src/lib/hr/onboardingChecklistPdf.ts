import jsPDF from "jspdf";
import type { RoadmapPhase } from "./onboardingRoadmap";

export interface ChecklistPdfInput {
  hireName: string;
  variantLabel: string;
  clinic?: string | null;
  state?: string | null;
  roadmap: RoadmapPhase[];
  completedItems: Set<string>;
  generatedAt?: Date;
}

const PRIMARY: [number, number, number] = [43, 123, 213]; // #2B7BD5
const TEXT: [number, number, number] = [26, 31, 46]; // #1A1F2E
const MUTED: [number, number, number] = [110, 118, 138];
const BORDER: [number, number, number] = [220, 224, 232];

const itemKey = (phase: string, item: string) => `${phase}::${item}`;

function safeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "new-hire";
}

export function downloadOnboardingChecklistPdf(input: ChecklistPdfInput) {
  const {
    hireName, variantLabel, clinic, state, roadmap, completedItems,
    generatedAt = new Date(),
  } = input;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const contentW = pageW - marginX * 2;

  const totalItems = roadmap.reduce((s, p) => s + p.items.length, 0);
  const completedCount = roadmap.reduce(
    (s, p) => s + p.items.filter((i) => completedItems.has(itemKey(p.phase, i))).length,
    0,
  );
  const pct = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);

  // Header band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Blossom ABA Therapy", marginX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Your 30-day onboarding checklist", marginX, 62);
  doc.setFontSize(9);
  doc.text(
    `Generated ${generatedAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`,
    pageW - marginX,
    42,
    { align: "right" },
  );

  // Subheader meta
  let y = 124;
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(hireName, marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const metaParts = [variantLabel];
  const loc = [clinic, state].filter(Boolean).join(" · ");
  if (loc) metaParts.push(loc);
  doc.text(metaParts.join("   •   "), marginX, y + 16);

  // Progress card
  y += 36;
  doc.setDrawColor(...BORDER);
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(marginX, y, contentW, 56, 8, 8, "FD");
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Progress", marginX + 16, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  doc.text(`${completedCount} of ${totalItems} tasks complete`, marginX + 16, y + 38);
  // Progress bar
  const barX = marginX + 220;
  const barY = y + 24;
  const barW = contentW - 240;
  doc.setFillColor(...BORDER);
  doc.roundedRect(barX, barY, barW, 10, 5, 5, "F");
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(barX, barY, Math.max(2, (barW * pct) / 100), 10, 5, 5, "F");
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${pct}%`, barX + barW, barY + 24, { align: "right" });

  y += 80;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 56) {
      // Footer
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Blossom ABA Therapy · Onboarding Checklist", marginX, pageH - 24);
      doc.addPage();
      y = 56;
    }
  };

  // Phases
  roadmap.forEach((phase, idx) => {
    ensureSpace(48);
    // Phase header
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(phase.phase.toUpperCase(), marginX, y);
    doc.setTextColor(...TEXT);
    doc.setFontSize(13);
    doc.text(phase.label, marginX, y + 18);

    const phaseDone = phase.items.filter((i) => completedItems.has(itemKey(phase.phase, i))).length;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(`${phaseDone}/${phase.items.length} done`, pageW - marginX, y + 18, { align: "right" });

    y += 30;
    doc.setDrawColor(...BORDER);
    doc.line(marginX, y, pageW - marginX, y);
    y += 12;

    // Items
    phase.items.forEach((item) => {
      const done = completedItems.has(itemKey(phase.phase, item));
      ensureSpace(24);

      // Checkbox
      const cbX = marginX;
      const cbY = y - 9;
      doc.setDrawColor(done ? PRIMARY[0] : 180, done ? PRIMARY[1] : 184, done ? PRIMARY[2] : 196);
      if (done) {
        doc.setFillColor(...PRIMARY);
        doc.roundedRect(cbX, cbY, 12, 12, 2, 2, "FD");
        // Check mark
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1.4);
        doc.line(cbX + 3, cbY + 6.5, cbX + 5.5, cbY + 9);
        doc.line(cbX + 5.5, cbY + 9, cbX + 9.5, cbY + 3.5);
        doc.setLineWidth(0.5);
      } else {
        doc.roundedRect(cbX, cbY, 12, 12, 2, 2, "S");
      }

      // Item text (wrapped)
      doc.setFont("helvetica", done ? "normal" : "normal");
      doc.setFontSize(10);
      doc.setTextColor(done ? MUTED[0] : TEXT[0], done ? MUTED[1] : TEXT[1], done ? MUTED[2] : TEXT[2]);
      const wrapped = doc.splitTextToSize(item, contentW - 24);
      doc.text(wrapped, cbX + 20, y);

      // Strikethrough for done items
      if (done) {
        const textW = Math.min(contentW - 24, doc.getTextWidth(wrapped[0]));
        doc.setDrawColor(...MUTED);
        doc.line(cbX + 20, y - 3, cbX + 20 + textW, y - 3);
      }

      y += Math.max(18, wrapped.length * 13);
    });

    if (idx < roadmap.length - 1) y += 14;
  });

  // Footer on last page
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Blossom ABA Therapy · Onboarding Checklist", marginX, pageH - 24);

  doc.save(`onboarding-checklist-${safeFilename(hireName)}.pdf`);
}