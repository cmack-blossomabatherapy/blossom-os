import { downloadOnboardingChecklistPdf } from "/dev-server/src/lib/hr/onboardingChecklistPdf";
import { buildRoadmap, pickVariant, variantLabel } from "/dev-server/src/lib/hr/onboardingRoadmap";
import { writeFileSync } from "node:fs";

// Patch jsPDF save -> write to disk
import jsPDF from "jspdf";
const origSave = jsPDF.prototype.save;
jsPDF.prototype.save = function (filename: string) {
  const out = this.output("arraybuffer");
  writeFileSync(`/tmp/pdfqa/${filename}`, Buffer.from(out));
  return this;
};

const variant = pickVariant(["bcba"] as any);
const roadmap = buildRoadmap(variant, { clinic: "Atlanta", state: "GA" });
const completed = new Set<string>([
  "Day 1::Sign offer paperwork",
  "Day 1::Watch CEO welcome",
  "Week 1::Clinical Academy intro",
]);
downloadOnboardingChecklistPdf({
  hireName: "Sarah",
  variantLabel: variantLabel(variant),
  clinic: "Atlanta",
  state: "GA",
  roadmap,
  completedItems: completed,
});
console.log("done");
