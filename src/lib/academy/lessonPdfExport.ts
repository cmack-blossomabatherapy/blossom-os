import { jsPDF } from "jspdf";
import type { LessonContent, LessonMeta } from "./lessonContent";

/**
 * Client-side PDF export for Training Academy lessons and modules.
 * Renders each lesson as structured, printable sections so learners
 * can review offline. Uses jsPDF (already bundled) with automatic
 * page breaks and consistent typography.
 */

const MARGIN = 54;
const PAGE_W = 612;
const PAGE_H = 792;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface Cursor { y: number; page: number }

function makeDoc(): { doc: jsPDF; cur: Cursor } {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  return { doc, cur: { y: MARGIN, page: 1 } };
}

function ensureSpace(doc: jsPDF, cur: Cursor, needed: number) {
  if (cur.y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    cur.page += 1;
    cur.y = MARGIN;
  }
}

function writeText(
  doc: jsPDF,
  cur: Cursor,
  text: string,
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
) {
  const { size = 11, bold = false, color = [30, 30, 30], gap = 4 } = opts;
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
  const lh = size * 1.25;
  for (const line of lines) {
    ensureSpace(doc, cur, lh);
    doc.text(line, MARGIN, cur.y);
    cur.y += lh;
  }
  cur.y += gap;
}

function writeDivider(doc: jsPDF, cur: Cursor) {
  ensureSpace(doc, cur, 12);
  doc.setDrawColor(220, 224, 232);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, cur.y, PAGE_W - MARGIN, cur.y);
  cur.y += 10;
}

function writeSectionHeading(doc: jsPDF, cur: Cursor, label: string) {
  ensureSpace(doc, cur, 24);
  writeText(doc, cur, label.toUpperCase(), { size: 9, bold: true, color: [90, 100, 120], gap: 2 });
}

function writeBullets(doc: jsPDF, cur: Cursor, items: string[]) {
  for (const item of items) {
    writeText(doc, cur, `- ${item}`, { size: 11, gap: 2 });
  }
  cur.y += 4;
}

function writeLessonBody(doc: jsPDF, cur: Cursor, meta: LessonMeta, content: LessonContent) {
  writeText(doc, cur, meta.title, { size: 18, bold: true, gap: 2 });
  writeText(doc, cur, `~${meta.minutes} min - ${meta.kind}`, { size: 9, color: [110, 118, 132], gap: 8 });
  if (meta.summary) writeText(doc, cur, meta.summary, { size: 11, color: [70, 78, 92], gap: 10 });

  writeSectionHeading(doc, cur, "Objective");
  writeText(doc, cur, content.objective, { gap: 8 });

  writeSectionHeading(doc, cur, "Why this matters");
  writeText(doc, cur, content.whyItMatters, { gap: 8 });

  for (const s of content.sections) {
    writeSectionHeading(doc, cur, s.heading);
    writeText(doc, cur, s.body, { gap: 8 });
  }

  if (content.examples?.length) {
    writeSectionHeading(doc, cur, "Examples");
    for (const ex of content.examples) {
      writeText(doc, cur, ex.heading, { size: 11, bold: true, gap: 2 });
      writeText(doc, cur, ex.body, { gap: 6 });
    }
  }

  if (content.commonMistakes?.length) {
    writeSectionHeading(doc, cur, "Common mistakes to avoid");
    writeBullets(doc, cur, content.commonMistakes);
  }

  if (content.practiceActivity) {
    writeSectionHeading(doc, cur, "Practice activity");
    writeText(doc, cur, content.practiceActivity.prompt, { bold: true, gap: 2 });
    if (content.practiceActivity.guidance) {
      writeText(doc, cur, content.practiceActivity.guidance, { color: [90, 100, 120], gap: 8 });
    }
  }

  if (content.knowledgeCheck?.length) {
    writeSectionHeading(doc, cur, "Knowledge check");
    content.knowledgeCheck.forEach((q, i) => {
      writeText(doc, cur, `${i + 1}. ${q.q}`, { bold: true, gap: 2 });
      q.options.forEach((opt, oi) => {
        const marker = oi === q.answer ? "[x]" : "[ ]";
        writeText(doc, cur, `   ${marker} ${opt}`, { size: 11, gap: 1 });
      });
      cur.y += 4;
    });
  }

  if (content.reflectionPrompt) {
    writeSectionHeading(doc, cur, "Reflection");
    writeText(doc, cur, content.reflectionPrompt, { gap: 8 });
  }

  if (content.checklist?.length) {
    writeSectionHeading(doc, cur, "Checklist");
    writeBullets(doc, cur, content.checklist.map((c) => `[ ] ${c}`));
  }
}

function writeHeader(doc: jsPDF, cur: Cursor, pathTitle: string, moduleTitle: string) {
  writeText(doc, cur, "Blossom OS - Training Academy", { size: 9, color: [120, 128, 142], gap: 2 });
  writeText(doc, cur, pathTitle, { size: 11, color: [70, 78, 92], gap: 2 });
  writeText(doc, cur, moduleTitle, { size: 13, bold: true, gap: 8 });
  writeDivider(doc, cur);
}

function safeFileName(s: string): string {
  return s.replace(/[^a-z0-9\-_. ]/gi, "").trim().replace(/\s+/g, "_").slice(0, 80) || "lesson";
}

export function exportLessonToPdf(
  pathTitle: string,
  moduleTitle: string,
  meta: LessonMeta,
  content: LessonContent,
) {
  const { doc, cur } = makeDoc();
  writeHeader(doc, cur, pathTitle, moduleTitle);
  writeLessonBody(doc, cur, meta, content);
  doc.save(`${safeFileName(moduleTitle)}__${safeFileName(meta.title)}.pdf`);
}

export function exportModuleToPdf(
  pathTitle: string,
  moduleTitle: string,
  moduleDescription: string | undefined,
  lessons: { meta: LessonMeta; content: LessonContent }[],
) {
  const { doc, cur } = makeDoc();
  writeHeader(doc, cur, pathTitle, moduleTitle);
  if (moduleDescription) writeText(doc, cur, moduleDescription, { color: [70, 78, 92], gap: 10 });
  writeText(doc, cur, `${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`, {
    size: 10, color: [110, 118, 132], gap: 6,
  });

  lessons.forEach((l, i) => {
    if (i > 0) {
      doc.addPage();
      cur.page += 1;
      cur.y = MARGIN;
    } else {
      cur.y += 4;
    }
    writeLessonBody(doc, cur, l.meta, l.content);
  });

  doc.save(`${safeFileName(moduleTitle)}__full_module.pdf`);
}
