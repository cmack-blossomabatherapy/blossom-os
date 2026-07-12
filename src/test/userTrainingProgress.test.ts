import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Per-user training progress persistence", () => {
  it("academyData.setTrainingProgress fires a cloud upsert unless skipped", () => {
    const src = read("src/lib/training/academyData.ts");
    expect(src).toMatch(/opts\?:\s*\{\s*skipCloud\?:\s*boolean\s*\}/);
    expect(src).toMatch(/pushProgressToCloud/);
    expect(src).toMatch(/blossom\.training\.progress\.v2/);
  });

  it("progressCloud upserts scoped to user_training_progress", () => {
    const src = read("src/lib/training/progressCloud.ts");
    expect(src).toMatch(/from\("user_training_progress"\)/);
    expect(src).toMatch(/merge_user_training_progress/);
    expect(src).toMatch(/bindTrainingProgressUser/);
    expect(src).toMatch(/flushTrainingProgressQueue/);
    expect(src).toMatch(/postgres_changes/);
  });

  it("OSShell mounts the training-progress cloud bridge", () => {
    const src = read("src/pages/os/OSShell.tsx");
    expect(src).toMatch(/TrainingProgressCloudBridge/);
  });

  it("MyLearning renders the NextUpCard so users see what's next", () => {
    const src = read("src/pages/MyLearning.tsx");
    expect(src).toMatch(/NextUpCard/);
  });

  it("NextUpCard prioritizes in-progress modules before required not-started ones", () => {
    const src = read("src/components/training/NextUpCard.tsx");
    expect(src).toMatch(/inProgress[^]*requiredNotStarted[^]*otherNotStarted/);
  });
});